const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const logger = require('../helpers/logger');

const sessions = new Map();

/**
 * ایجاد تاخیر برای شبیه‌سازی رفتار انسانی
 * @param {number} ms 
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * ارسال گزارش به لاراول (Webhook)
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
            headers: { 'X-API-KEY': process.env.SECRET_API_KEY }
        });
    } catch (error) {
        logger('error', `Webhook failed for [${sessionId}]: ${error.message}`);
    }
};

/**
 * تابع ارسال پیام با مکانیزم Anti-Ban
 */
const sendSecureMessage = async (session, phone, message) => {
    // ایجاد تاخیر تصادفی بین ۲ تا ۵ ثانیه قبل از هر ارسال
    const waitTime = Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;
    logger('debug', `Anti-Ban: Waiting ${waitTime}ms before sending...`);
    await delay(waitTime);
    
    return session.client.sendMessage(phone, message);
};

const initializeSession = (sessionId) => {
    logger('system', `Initializing WhatsApp session: [${sessionId}]`);

    const client = new Client({
        authStrategy: new LocalAuth({ clientId: sessionId }),
        // بهینه‌سازی شده برای اجرای بدون خطا در لینوکس (Headless mode)
        puppeteer: { 
            headless: true, 
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage', // جلوگیری از کرش در رم پایین سرور
                '--disable-gpu',           // ضروری برای لینوکس
                '--no-first-run',
                '--no-zygote'
            ] 
        }
    });

    // --- رویدادهای واتس‌اپ ---

    client.on('qr', (qr) => {
        console.log(`\n=========================================`);
        console.log(`📱 QR CODE FOR: [${sessionId}]`);
        console.log(`=========================================\n`);
        qrcode.generate(qr, { small: true });
        logger('whatsapp', `QR Code generated for [${sessionId}]`);
        notifyLaravel('QR_GENERATED', sessionId);
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

        notifyLaravel('SESSION_READY', sessionId, { number: myNumber });
    });

    client.on('auth_failure', (msg) => {
        logger('error', `Session [${sessionId}] Auth Failure: ${msg}`);
        sessions.delete(sessionId);
        notifyLaravel('AUTH_FAILURE', sessionId, { reason: msg });
    });

    client.on('disconnected', (reason) => {
        logger('warning', `Session [${sessionId}] Disconnected: ${reason}`);
        sessions.delete(sessionId);
        notifyLaravel('DISCONNECTED', sessionId, { reason });
    });

    // مدیریت وضعیت دریافت پیام (تاییدیه ارسال)
    client.on('message_ack', (msg, ack) => {
        // ack: 1 (Sent), 2 (Delivered), 3 (Read)
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