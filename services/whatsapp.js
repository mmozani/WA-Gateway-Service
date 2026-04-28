const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const qrcode = require('qrcode'); // پکیج جدید برای تولید Base64
const axios = require('axios');
const logger = require('../helpers/logger');

const sessions = new Map();

/**
 * ایجاد تاخیر برای شبیه‌سازی رفتار انسانی
 * @param {number} ms 
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * ارسال گزارش به بک‌اند (Webhook)
 */
const notifyLaravel = async (event, sessionId, data = {}) => {
    if (!process.env.WEBHOOK_URL) return;
    
    try {
        await axios.post(process.env.WEBHOOK_URL, {
            event: event,
            session_id: sessionId,
            ...data,
            timestamp: new Date().toISOString()
        }, {
            headers: { 'X-API-KEY': process.env.SECRET_API_KEY },
            timeout: 5000 // اضافه شدن تایم‌اوت برای جلوگیری از هنگ کردن وب‌هوک
        });
    } catch (error) {
        // فقط در دیباگ لاگ بگیر تا لاگ‌ها شلوغ نشن
        logger('debug', `Webhook failed for [${sessionId}]: ${error.message}`);
    }
};

/**
 * تابع ارسال پیام با مکانیزم ضد-بلاک پیشرفته
 */
const sendSecureMessage = async (session, phone, message) => {
    // محاسبه زمان تایپ بر اساس طول متن (شبیه‌سازی رفتار انسانی)
    const typingDelay = Math.min(message.length * 50, 3000); // حداکثر 3 ثانیه تایپ
    const randomExtraDelay = Math.floor(Math.random() * 1500) + 500; // نویز تصادفی
    const totalWait = typingDelay + randomExtraDelay;
    
    logger('debug', `Anti-Ban: Simulating typing for ${totalWait}ms...`);
    await delay(totalWait);
    
    return session.client.sendMessage(phone, message);
};

const initializeSession = async (sessionId, isRetry = false) => {
    // جلوگیری از ری‌استارت بی‌نهایت در صورت قطعی دائمی اینترنت
    const maxRetries = 5;
    if (!sessions.has(`retry_${sessionId}`)) {
        sessions.set(`retry_${sessionId}`, 0);
    }
    
    const currentRetry = sessions.get(`retry_${sessionId}`);
    
    if (isRetry && currentRetry >= maxRetries) {
        logger('error', `Session [${sessionId}] reached max reconnection attempts (${maxRetries}). Stopping.`);
        notifyLaravel('RECONNECT_FAILED', sessionId, { reason: 'Max retries exceeded' });
        sessions.delete(`retry_${sessionId}`);
        return;
    }

    if (isRetry) {
        const backoffTime = currentRetry * 10000; // 10s, 20s, 30s, ...
        logger('warning', `Session [${sessionId}] retry ${currentRetry}/${maxRetries} in ${backoffTime/1000}s...`);
        await delay(backoffTime);
        sessions.set(`retry_${sessionId}`, currentRetry + 1);
    } else {
        sessions.set(`retry_${sessionId}`, 0);
    }

    logger('system', `Initializing WhatsApp session: [${sessionId}]`);

    const client = new Client({
        authStrategy: new LocalAuth({ clientId: sessionId }),
        puppeteer: { 
            headless: true, 
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--no-zygote'
            ] 
        }
    });

    // --- رویدادهای واتس‌اپ ---

    client.on('qr', async (qr) => {
        console.log(`\n=========================================`);
        console.log(`📱 QR CODE FOR: [${sessionId}]`);
        console.log(`=========================================\n`);
        qrcodeTerminal.generate(qr, { small: true });
        
        // ریست کردن شمارنده ریکانکت در صورت دریافت کد QR جدید
        sessions.set(`retry_${sessionId}`, 0);

        // تولید Base64 برای ارسال به پنل
        try {
            const qrImage = await qrcode.toDataURL(qr);
            notifyLaravel('QR_GENERATED', sessionId, { qr: qrImage, expires_in: 20 });
        } catch (err) {
            logger('error', `Failed to generate QR Base64: ${err.message}`);
            notifyLaravel('QR_GENERATED', sessionId); // فال‌بک بدون تصویر
        }
    });

    client.on('ready', () => {
        const myNumber = client.info.wid.user;
        logger('whatsapp', `Session [${sessionId}] is READY. Number: ${myNumber}`);
        
        sessions.set(sessionId, { 
            client, 
            status: 'READY', 
            number: myNumber,
            readyAt: new Date().toISOString() 
        });

        // ریست کردن شمارنده ریکانکت در صورت موفقیت آمیز بودن
        sessions.set(`retry_${sessionId}`, 0);
        notifyLaravel('SESSION_READY', sessionId, { number: myNumber });
    });

    client.on('auth_failure', (msg) => {
        logger('error', `Session [${sessionId}] Auth Failure: ${msg}`);
        sessions.delete(sessionId);
        sessions.delete(`retry_${sessionId}`);
        notifyLaravel('AUTH_FAILURE', sessionId, { reason: msg });
    });

    client.on('disconnected', (reason) => {
        logger('warning', `Session [${sessionId}] Disconnected: ${reason}`);
        sessions.delete(sessionId); // حذف از مپ سشن‌های فعال
        
        // تلاش برای اتصال مجدد به صورت خودکار
        notifyLaravel('DISCONNECTED', sessionId, { reason, auto_reconnecting: true });
        initializeSession(sessionId, true); // فراخوانی با فلگ ریکانکت
    });

    client.on('message_ack', (msg, ack) => {
        if (ack === 3) {
            logger('debug', `Message to ${msg.to} was READ.`);
        }
    });

    client.initialize().catch(err => {
        logger('fatal', `Failed to initialize [${sessionId}]: ${err.message}`);
    });
};

module.exports = { 
    sessions, 
    initializeSession, 
    sendSecureMessage
};