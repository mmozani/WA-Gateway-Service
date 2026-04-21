const fs = require('fs');
const path = require('path');

const logger = (type, message) => {
    // اگر نوع لاگ debug بود و در فایل env فعال نبود، چیزی چاپ نکن
    if (type === 'debug' && process.env.DEBUG_MODE !== 'true') return;

    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}\n`;
    
    console.log(logEntry.trim());
    // لاگ‌های دیباگ رو توی فایل ذخیره نمی‌کنیم که حجیم نشه
    if (type !== 'debug') {
        fs.appendFileSync(path.join(__dirname, '../access.log'), logEntry);
    }
};

module.exports = logger;