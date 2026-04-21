const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const logger = require('../helpers/logger');

const sessions = new Map();

const initializeSession = (sessionId) => {
    logger('system', `Initializing WhatsApp session: [${sessionId}]`);

    const client = new Client({
        authStrategy: new LocalAuth({ clientId: sessionId }),
        puppeteer: { 
            headless: true, 
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        }
    });

    client.on('qr', (qr) => {
        console.log(`\n📱 QR FOR: [${sessionId}]`);
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        // استخراج شماره موبایل متصل شده
        const myNumber = client.info.wid.user;
        logger('whatsapp', `Session [${sessionId}] is READY. Number: ${myNumber}`);
        sessions.set(sessionId, { client, status: 'READY', number: myNumber });
    });

    client.on('auth_failure', () => sessions.delete(sessionId));
    client.on('disconnected', () => sessions.delete(sessionId));

    client.initialize();
};

module.exports = { sessions, initializeSession };