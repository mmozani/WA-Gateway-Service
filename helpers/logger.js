const fs = require('fs');
const path = require('path');
const logFilePath = path.join(__dirname, '../access.log');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

const logger = (type, message) => {
    if (type === 'debug' && process.env.DEBUG_MODE !== 'true') return;

    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}\n`;
    
    console.log(logEntry.trim());
    if (type !== 'debug') {
        logStream.write(logEntry);
    }
};

module.exports = logger;