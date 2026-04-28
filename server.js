require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const fsPromises = require('fs').promises; // ماژول غیرهمگان برای فایل‌ها
const path = require('path');
const logger = require('./helpers/logger');
const { sessions, initializeSession, sendSecureMessage } = require('./services/whatsapp');

const app = express();
app.use(express.json());

// ==========================================
// 1. Core Configurations
// ==========================================

// فعال‌سازی Trust Proxy برای دریافت IP واقعی کاربر پشت Nginx
app.set('trust proxy', process.env.TRUST_PROXY === 'false' ? false : 1);

// ==========================================
// 2. Middlewares
// ==========================================

// محدودیت تعداد درخواست (Rate Limiter)
const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 دقیقه
    max: 30, // حداکثر 30 درخواست
    message: { error: 'Too many requests, please try again later.' }
});

// میدلور بررسی IP (Whitelist)
const ipWhitelist = (req, res, next) => {
    if (process.env.IGNORE_IP_WHITELIST === 'true') return next();
    
    const allowedIps = (process.env.ALLOWED_IPS || '').split(',').map(ip => ip.trim()).filter(Boolean);
    if (allowedIps.length === 0) return next(); // اگر لیست خالی بود، رد کن

    const clientIp = req.ip; // به لطف trust proxy اینجا IP واقعی هست
    
    const isAllowed = allowedIps.some(allowedIp => clientIp.startsWith(allowedIp));
    
    if (!isAllowed) {
        logger('security', `Forbidden IP attempt: ${clientIp}`);
        return res.status(403).json({ error: 'Forbidden: Your IP is not allowed.' });
    }
    next();
};

// میدلور احراز هویت با API Key
const secureAPI = (req, res, next) => {
    const clientKey = (req.header('X-API-KEY') || '').trim();
    const serverKey = (process.env.SECRET_API_KEY || '').trim();

    if (process.env.DEBUG_MODE === 'true') {
        logger('debug', `Security Check - Client: [${clientKey}] | Server: [${serverKey}] | Match: ${clientKey === serverKey}`);
    }

    if (!clientKey || clientKey !== serverKey) {
        logger('security', `Unauthorized access attempt from IP: ${req.ip}`);
        return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }
    next();
};

// اعمال میدلورهای امنیتی روی مسیرهای حساس
app.use('/send-otp', globalLimiter);


// ==========================================
// 3. Routes
// ==========================================

app.post('/send-otp', ipWhitelist, secureAPI, async (req, res) => {
    const { phone, message, code, session_id } = req.body;

    if (!phone || (!message && !code)) {
        return res.status(400).json({ error: 'Phone and at least message or code are required' });
    }

    const activeSessionIds = process.env.SESSION_IDS ? process.env.SESSION_IDS.split(',') : [];
    const targetId = session_id || activeSessionIds[0];
    const session = sessions.get(targetId);

    if (!session || session.status !== 'READY') {
        logger('error', `Send attempt failed: Session [${targetId}] is not READY`);
        return res.status(503).json({ error: `WhatsApp session [${targetId}] is not ready` });
    }

    try {
        let cleanPhone = String(phone).trim().replace(/^(?:\+|00)/, '');
        const formattedPhone = `${cleanPhone}@c.us`;

        let finalMessage = message || '';
        if (code) {
            finalMessage = finalMessage ? `${finalMessage}${code}` : `${code}`;
        }

        await sendSecureMessage(session, formattedPhone, finalMessage);
        
        logger('success', `Message sent to ${cleanPhone} via [${targetId}]`);
        res.json({ 
            success: true, 
            via: targetId, 
            sender: session.number,
            status: 'Sent'
        });
    } catch (err) {
        logger('error', `Send Error [${targetId}]: ${err.message}`);
        res.status(500).json({ error: 'Failed to send message', details: err.message });
    }
});


app.get('/status', ipWhitelist, secureAPI, (req, res) => {
    const activeSessionIds = process.env.SESSION_IDS ? process.env.SESSION_IDS.split(',') : [];
    const report = activeSessionIds.map(id => {
        const s = sessions.get(id);
        return {
            id,
            status: s ? s.status : 'OFFLINE',
            number: s ? s.number : null,
            ready_since: s ? s.readyAt : null
        };
    });
    res.json(report);
});


app.get('/health', (req, res) => {
    const uptime = process.uptime();
    res.status(200).json({
        status: 'UP',
        uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
        memory_usage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
        timestamp: new Date().toISOString()
    });
});


app.delete('/session/:id', ipWhitelist, secureAPI, async (req, res) => {
    const sessionId = req.params.id;
    const session = sessions.get(sessionId);
    
    logger('command', `Manual delete request for session: [${sessionId}]`);

    try {
        // 1. قطع اتصال نرم‌افزاری واتس‌اپ
        if (session) {
            await session.client.destroy().catch(() => {});
            sessions.delete(sessionId);
        }

        // 2. حذف فیزیکی فایل‌های سشن به روش غیرهمگان (بدون setTimeout و rmSync)
        const sessionPath = path.join(__dirname, '.wwebjs_auth', `session-${sessionId}`);
        
        await fsPromises.access(sessionPath).catch(() => null); // بررسی وجود
        await fsPromises.rm(sessionPath, { recursive: true, force: true });
        logger('system', `Directory for [${sessionId}] removed successfully.`);

        // 3. شروع مجدد فوری سشن برای دریافت کد QR جدید
        initializeSession(sessionId);
        
        res.json({ success: true, message: `Session [${sessionId}] terminated and re-initializing for new QR.` });
    } catch (err) {
        logger('error', `Session cleanup failed: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 4. Global Error Handlers & Start
// ==========================================

// جلوگیری از تبدیل سرور به حالت زامبی در صورت بروز خطای مهلک
process.on('uncaughtException', (err) => {
    logger('fatal', `Uncaught Exception: ${err.message}`);
    process.exit(1); // خروج اجباری تا PM2 آن را سالم ری‌استارت کند
});

process.on('unhandledRejection', (reason, promise) => {
    logger('fatal', `Unhandled Rejection at: ${promise} - Reason: ${reason}`);
    process.exit(1);
});

const PORT = process.env.PORT || 30033;
app.listen(PORT, () => {
    logger('system', `------------------------------------------------`);
    logger('system', `WA-GATEWAY-SERVICE STARTED ON PORT ${PORT}`);
    logger('system', `DEBUG_MODE: ${process.env.DEBUG_MODE}`);
    logger('system', `TRUST_PROXY: ENABLED`);
    logger('system', `------------------------------------------------`);

    // مقداردهی اولیه سشن‌ها
    const activeSessionIds = process.env.SESSION_IDS ? process.env.SESSION_IDS.split(',') : [];
    activeSessionIds.forEach((id, index) => {
        setTimeout(() => initializeSession(id), index * 5000);
    });
});