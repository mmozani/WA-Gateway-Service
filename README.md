# 🚀 WA-Gateway-Service

یک میکروسرویس حرفه‌ای و ماژولار مبتنی بر **Node.js** برای مدیریت همزمان چندین نشست (Session) واتس‌اپ. این سرویس به شما اجازه می‌دهد از طریق API، پیام‌های سیستمی و OTP ارسال کرده و وضعیت خطوط خود را مدیریت کنید.

---

## ✨ قابلیت‌ها

- **Multi-Session:** مدیریت چندین شماره مختلف به صورت همزمان.
- **Modular Design:** تفکیک بخش‌های منطقی (Services, Helpers, Routes).
- **Security:** تایید هویت با `X-API-KEY` و محدودسازی IP.
- **Debug Mode:** کنترل لاگ‌های فنی کنسول از طریق تنظیمات.
- **Sender Info:** شناسایی شماره فرستنده در هر پاسخ برای مدیریت بهتر در پنل‌های مدیریت (مانند Laravel).
- **Auto-Recovery:** تلاش برای راه‌اندازی مجدد سشن‌ها پس از حذف یا بروز خطا.

---

## 🛠 نصب و راه‌اندازی

۱. **نصب وابستگی‌ها:**
   ```bash
   npm install
   ```

۲. **پیکربندی:**
   فایل `.env.example` را به `.env` تغییر نام داده و متغیرها را تنظیم کنید.

۳. **اجرا:**
   ```bash
   # حالت توسعه
   node server.js

   # حالت تولید (با PM2)
   pm2 start server.js --name wa-gateway
   ```

---

## 📡 مستندات API (Endpoints)

تمام درخواست‌ها باید شامل هدر `X-API-KEY` باشند.

### ۱. ارسال پیام (Send OTP)
برای ارسال پیام از یک سشن خاص یا سشن پیش‌فرض.

- **URL:** `/send-otp`
- **Method:** `POST`
- **Body:**
```json
{
  "phone": "989123456789",
  "message": "کد تایید شما: 12345",
  "session_id": "primary-line" 
}
```
> `session_id` اختیاری است. اگر ارسال نشود، از اولین سشن تعریف شده استفاده می‌شود.

- **Response (Success):**
```json
{
  "success": true,
  "via": "primary-line",
  "sender": "989100000000",
  "status": "Sent"
}
```

---

### ۲. وضعیت سشن‌ها (Sessions Status)
مشاهده لیست تمام سشن‌های تعریف شده، وضعیت اتصال و شماره متصل به هر کدام.

- **URL:** `/sessions-status`
- **Method:** `GET`
- **Response:**
```json
[
  {
    "session_id": "primary-line",
    "status": "READY",
    "my_number": "989100000000"
  },
  {
    "session_id": "line-2",
    "status": "OFFLINE",
    "my_number": null
  }
]
```

---

### ۳. حذف و راه‌اندازی مجدد (Delete Session)
قطع اتصال، پاکسازی حافظه موقت و تلاش برای دریافت کد QR جدید.

- **URL:** `/session/:id`
- **Method:** `DELETE`
- **Response:**
```json
{
  "success": true,
  "message": "Session [primary-line] deleted and re-initializing..."
}
```

---

## ⚙️ تنظیمات فایل .env

| متغیر | توضیح |
| :--- | :--- |
| `PORT` | پورت اجرای سرور (پیش‌فرض 30033) |
| `SECRET_API_KEY` | کلید امنیتی برای دسترسی به APIها |
| `SESSION_IDS` | نام سشن‌ها که با کاما جدا شده‌اند (مثلا `line1,line2`) |
| `DEBUG_MODE` | اگر `true` باشد، جزئیات امنیتی و مقایسه کلیدها چاپ می‌شود |
| `ALLOWED_IPS` | لیست آی‌پی‌های مجاز برای فراخوانی سرویس |

---

## 📂 ساختار پوشه‌بندی

- `/helpers`: شامل ابزارهای کمکی مانند `logger.js`.
- `/services`: شامل منطق اصلی اتصال به واتس‌اپ `whatsapp.js`.
- `/.wwebjs_auth`: محل ذخیره توکن‌های ورود (در گیت آپلود نمی‌شود).
- `server.js`: نقطه ورود برنامه و مدیریت روت‌های Express.

---

## 📄 لایسنس
این پروژه تحت لایسنس **MIT** منتشر شده است.