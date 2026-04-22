require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const logger = require('./helpers/logger');
const { sessions, initializeSession, sendSecureMessage } = require('./services/whatsapp');

const app = express();
app.use(express.json());

// ==========================================
// 1. Middlewares
// ==========================================

// محدودیت تعداد درخواست برای جلوگیری از سوءاستفاده (Rate Limiter)
const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 دقیقه
    max: 30, // حداکثر 30 درخواست در دقیقه برای هر IP
    message: { error: 'Too many requests, please try again later.' }
});

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

// اعمال محدودیت روی تمام مسیرهای API
app.use('/send-otp', globalLimiter);


app.post('/send-otp', secureAPI, async (req, res) => {
    // 1. دریافت ساختار جدید از Body
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

        // 4. ارسال پیام با متد ایمن (Anti-Ban)
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


app.get('/status', secureAPI, (req, res) => {
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

/**
 * مانیتورینگ سلامت سرویس (Health Check)
 */
app.get('/health', (req, res) => {
    const uptime = process.uptime();
    res.status(200).json({
        status: 'UP',
        uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
        memory_usage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
        timestamp: new Date().toISOString()
    });
});

/**
 * حذف فیزیکی و منطقی سشن و آماده‌سازی برای راه‌اندازی مجدد
 */
app.delete('/session/:id', secureAPI, async (req, res) => {
    const sessionId = req.params.id;
    const session = sessions.get(sessionId);
    
    logger('command', `Manual delete request for session: [${sessionId}]`);

    try {
        if (session) {
            await session.client.destroy().catch(() => {});
            sessions.delete(sessionId);
        }

        const sessionPath = path.join(__dirname, '.wwebjs_auth', `session-${sessionId}`);
        if (fs.existsSync(sessionPath)) {
            // ایجاد وقفه برای آزادسازی فایل‌ها در ویندوز و سپس حذف
            setTimeout(() => {
                try {
                    fs.rmSync(sessionPath, { recursive: true, force: true });
                    logger('system', `Directory for [${sessionId}] removed. Re-initializing...`);
                    initializeSession(sessionId); // شروع مجدد برای دریافت QR جدید
                } catch (e) {
                    logger('error', `File cleanup failed: ${e.message}`);
                }
            }, 3000);
        }
        
        res.json({ success: true, message: `Session [${sessionId}] termination and cleanup initiated.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 3. Global Error Handler & Start
// ==========================================

// جلوگیری از کرش سرور در صورت بروز خطای پیش‌بینی نشده
process.on('uncaughtException', (err) => {
    logger('fatal', `Uncaught Exception: ${err.message}`);
});

const PORT = process.env.PORT || 30033;
app.listen(PORT, () => {
    logger('system', `------------------------------------------------`);
    logger('system', `WA-GATEWAY-SERVICE STARTED ON PORT ${PORT}`);
    logger('system', `DEBUG_MODE: ${process.env.DEBUG_MODE}`);
    logger('system', `------------------------------------------------`);

    // مقداردهی اولیه سشن‌ها
    const activeSessionIds = process.env.SESSION_IDS ? process.env.SESSION_IDS.split(',') : [];
    activeSessionIds.forEach((id, index) => {
        // ایجاد فاصله زمانی بین استارت سشن‌ها برای جلوگیری از فشار ناگهانی به CPU/RAM
        setTimeout(() => initializeSession(id), index * 5000);
    });
});