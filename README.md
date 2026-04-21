# 🚀 WA-Gateway-Service

یک میکروسرویس حرفه‌ای و ماژولار مبتنی بر **Node.js** برای مدیریت همزمان چندین نشست (Session) واتس‌اپ. این سیستم به عنوان یک پل (Bridge) میان اپلیکیشن‌های شما (مانند پنل‌های Laravel یا Python) و پروتکل واتس‌اپ عمل می‌کند.

---

## 💡 چرا به این سرویس نیاز داریم؟ (Problem vs Solution)

در پروژه‌های بزرگ، ارسال پیام‌های OTP یا اعلان‌های سیستمی از طریق واتس‌اپ با چالش‌هایی همراه است:
1. **محدودیت IP:** واتس‌اپ به تغییرات IP حساس است؛ این سرویس روی یک سرور ثابت می‌ماند و نقش Gateway را ایفا می‌کند.
2. **مدیریت نشست‌ها:** مدیریت دستی نشست‌ها دشوار است؛ این سرویس چندین شماره را به صورت ایزوله مدیریت می‌کند.
3. **امنیت:** به جای باز کردن دسترسی‌های مستقیم، یک لایه امنیتی (API Key) اضافه می‌شود.

---

## 🔄 جریان کاربری (User Flow)

1. **اتصال:** مدیر سیستم از طریق کنسول، کد QR را اسکن کرده و سشن تایید می‌شود.
2. **درخواست:** اپلیکیشن شما (مثلاً لاراول) یک درخواست HTTP POST به این سرویس می‌فرستد.
3. **احراز هویت:** سرویس هدر `X-API-KEY` را چک می‌کند.
4. **ارسال:** پیام از طریق سشنِ مشخص شده به واتس‌اپ ارسال می‌شود.
5. **پاسخ:** شماره فرستنده و وضعیت ارسال به اپلیکیشن شما برمی‌گردد.



[Image of API Gateway architecture diagram]


---

## 🛠 نصب و اجرا

```bash
npm install
node server.js
```

---

## 📡 مستندات جامع API

### هدرهای مورد نیاز (Common Headers)
تمام درخواست‌ها **باید** شامل هدر زیر باشند:

| Key | Value | Description |
| :--- | :--- | :--- |
| `Content-Type` | `application/json` | فرمت داده‌های ارسالی |
| `X-API-KEY` | `your_secret_key` | کلید تعریف شده در فایل `.env` |

---

### ۱. ارسال پیام (Send Message)
- **Endpoint:** `/send-otp`
- **Method:** `POST`

**Request Body:**
```json
{
  "phone": "989123456789",
  "message": "کد تایید شما: 5544",
  "session_id": "line-1" 
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "via": "line-1",
  "sender": "989101112233",
  "status": "Sent"
}
```

---

### ۲. بررسی وضعیت خطوط (Session Status)
- **Endpoint:** `/sessions-status`
- **Method:** `GET`

**Success Response (200 OK):**
```json
[
  {
    "session_id": "line-1",
    "status": "READY",
    "my_number": "989101112233"
  }
]
```

---

### ۳. حذف و راه‌اندازی مجدد (Logout/Reset)
- **Endpoint:** `/session/:id`
- **Method:** `DELETE`

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Session [line-1] deleted and re-initializing..."
}
```

---

## ⚙️ عیب‌یابی (Debug Mode)
اگر در فایل `.env` مقدار `DEBUG_MODE=true` قرار داده شود، در کنسول سرور می‌توانید جزئیات زیر را مشاهده کنید:
- مقایسه دقیق کلیدهای API دریافت شده و موجود.
- لاگ دقیق لاگین و قطع اتصال سشن‌ها.

---

## 📂 ساختار ماژولار
- `server.js`: مدیریت روت‌ها و API.
- `services/whatsapp.js`: مدیریت چرخه حیات واتس‌اپ.
- `helpers/logger.js`: ثبت وقایع و لاگ‌های سیستم.


## 🐧 استقرار روی لینوکس (Ubuntu/Debian)

۱. **نصب وابستگی‌های کرومیوم:**
   ```bash
   sudo apt update
   sudo apt install -y libgbm-dev wget gnupg ca-certificates procps libxss1 libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 gconf-service lsb-release standard-notes
   ```

۲. **اجرا با PM2:**
   ```bash
   npm install pm2 -g
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```