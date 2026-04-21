# 🚀 WA-Gateway-Service

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2018.0.0-brightgreen)](https://nodejs.org/)
[![Framework](https://img.shields.io/badge/framework-Express-blue)](https://expressjs.com/)

یک میکروسرویس سبک و امن برای مدیریت نشست‌های چندگانه واتس‌اپ و ارسال پیام‌های سیستمی (OTP، اعلان‌ها و ...) از طریق API.

---

## ✨ قابلیت‌ها

* **مدیریت چند سشن:** امکان اتصال همزمان چندین شماره واتس‌اپ.
* **امنیت لایه‌بندی شده:** تایید هویت با API Key و محدودسازی آی‌پی‌های مجاز (Whitelist).
* **پایداری در ویندوز و لینوکس:** مکانیزم هوشمند برای بستن و حذف سشن‌ها بدون قفل شدن فایل.
* **سیستم لاگینگ:** ثبت تمام وقایع در فایل `access.log` برای عیب‌یابی سریع.
* **Rate Limiting:** کنترل تعداد درخواست‌ها برای جلوگیری از بلاک شدن شماره‌ها.

---

## 🛠 نصب و اجرا

### ۱. نصب پیش‌نیازها
```bash
npm install
```

### ۲. تنظیمات (Environment Variables)
یک فایل `.env` بسازید:
```env
PORT=30033
SECRET_API_KEY="your_random_secure_string"
ALLOWED_IPS=127.0.0.1,::1,192.168.
IGNORE_IP_WHITELIST=true
SESSION_IDS=line-1
```

### ۳. اجرا
```bash
# Development
node server.js

# Production
pm2 start server.js --name wa-gateway
```

---

## 📡 راهنمای استفاده از API

### ارسال پیام
`POST /send-otp`

**Headers:**
`X-API-KEY: [مقدار تنظیم شده در فایل env]`

**Body (JSON):**
```json
{
  "phone": "989123456789",
  "message": "Hello World!",
  "session_id": "line-1"
}
```

### حذف سشن (Logout)
`DELETE /session/:id`
این متد کلاینت را متوقف کرده و کش‌های مربوط به آن را برای اسکن مجدد پاک می‌کند.

---

## 🔒 ملاحظات امنیتی
* پوشه `.wwebjs_auth` و فایل `.env` به طور خودکار توسط `.gitignore` نادیده گرفته می‌شوند تا امنیت اکانت شما حفظ شود.
* توصیه می‌شود در محیط پروداکشن، `IGNORE_IP_WHITELIST` را روی `false` قرار دهید.

---

## 📄 لایسنس
این پروژه تحت لایسنس MIT منتشر شده است.