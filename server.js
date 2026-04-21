require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const logger = require('./helpers/logger');
const { sessions, initializeSession } = require('./services/whatsapp');

const app = express();
app.use(express.json());

// --- Middlewares ---
const secureAPI = (req, res, next) => {
    const clientKey = (req.header('X-API-KEY') || '').trim();
    const serverKey = (process.env.SECRET_API_KEY || '').trim();

    // فقط اگر دیباگ مود فعال بود، جزئیات رو چاپ کن
    if (process.env.DEBUG_MODE === 'true') {
        console.log(`\n--- DEBUG MODE (Security) ---`);
        console.log(`Client Key: [${clientKey}]`);
        console.log(`Server Key: [${serverKey}]`);
        console.log(`Match? ${clientKey === serverKey}\n`);
    }

    if (!clientKey || clientKey !== serverKey) {
        logger('security', `Unauthorized access attempt from IP: ${req.ip}`);
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};
// --- Endpoints ---

// 1. Send OTP (With Sender Number Support)
app.post('/send-otp', secureAPI, async (req, res) => {
    const { phone, message, session_id } = req.body;
    const targetId = session_id || process.env.SESSION_IDS.split(',')[0];
    const session = sessions.get(targetId);

    if (!session || session.status !== 'READY') {
        return res.status(503).json({ error: 'Session not ready' });
    }

    try {
        await session.client.sendMessage(`${phone.replace('+', '')}@c.us`, message);
        res.json({ success: true, sender: session.number });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Session Status
app.get('/status', secureAPI, (req, res) => {
    const report = [];
    process.env.SESSION_IDS.split(',').forEach(id => {
        const s = sessions.get(id);
        report.push({ id, status: s ? s.status : 'OFFLINE', number: s ? s.number : null });
    });
    res.json(report);
});

// 3. Delete Session
app.delete('/session/:id', secureAPI, async (req, res) => {
    const sessionId = req.params.id;
    const session = sessions.get(sessionId);
    
    if (session) {
        await session.client.destroy().catch(() => {});
        sessions.delete(sessionId);
    }

    const sessionPath = path.join(__dirname, '.wwebjs_auth', `session-${sessionId}`);
    if (fs.existsSync(sessionPath)) {
        setTimeout(() => fs.rmSync(sessionPath, { recursive: true, force: true }), 2000);
    }
    
    res.json({ success: true, message: "Session removal initiated." });
});

// --- Start Server ---
const PORT = process.env.PORT || 30033;
app.listen(PORT, () => {
    logger('system', `Server started on port ${PORT}`);
    process.env.SESSION_IDS.split(',').forEach(id => initializeSession(id));
});