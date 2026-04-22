# 🚀 WA-Gateway-Service: راهکار جامع و سازمانی مدیریت نشست‌های واتس‌اپ

<p align="center">
  <img src="https://img.shields.io/badge/version-2.1.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/Node.js-v18+-green.svg" alt="Node.js">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License">
  <img src="https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg" alt="Status">
  <img src="https://img.shields.io/badge/Platform-Linux%20%7C%20Ubuntu-lightgrey.svg" alt="Platform">
</p>

---

## 📋 فهرست مطالب

- [🎯 چرا این پروژه؟](#-چرا-این-پروژه-یک-ضرورت-استراتژیک-است)
- [✨ قابلیت‌ها](#-قابلیت‌های-کلیدی-و-پیشرفته)
- [🏗 معماری سیستم](#-معماری-سیستم)
- [📱 آماده‌سازی گوشی](#-گام-اول-آمادهسازی-حیاتی-گوشی-موبایل)
- [📂 ساختار پروژه](#-ساختار-پوشهبندی-پروژه)
- [🛠 نصب و راه‌اندازی](#-نصب-و-راهاندازی)
- [⚙️ پیکربندی](#️-متغیرهای-فایل-تنظیمات-env)
- [📡 مستندات API](#-مستندات-کامل-api)
- [🔗 وب‌هوک‌ها](#-مستندات-وبهوک-webhooks)
- [🔒 امنیت](#-امنیت)
- [❓ سوالات متداول](#-سوالات-متداول-faq)
- [🤝 مشارکت](#-مشارکت-در-توسعه)
- [📄 لایسنس](#-لایسنس)

---

## 🎯 چرا این پروژه یک ضرورت استراتژیک است؟

**WA-Gateway-Service** یک میکروسرویس فوق‌پایدار، ماژولار و امن است که به عنوان یک **لایه واسط (Bridge)** بین زیرساخت‌های نرم‌افزاری شما (مانند لاراول، پایتون، جاوا و غیره) و اپلیکیشن واتس‌اپ عمل می‌کند.

این پروژه با هدف **حذف هزینه‌های گزاف پیامک‌های بین‌المللی** و **دور زدن تحریم‌های ارتباطی** برای استارتاپ‌ها و کسب‌وکارهای ایرانی توسعه یافته است.

### 💡 مشکلات حل شده:

| مشکل | راه‌حل | تأثیر |
|------|--------|--------|
| 💸 **بحران هزینه‌های ارزی** | استفاده از واتس‌اپ به جای پیامک | هزینه ارسال به تمام نقاط جهان **صفر** |
| 🚫 **تحریم سرویس‌دهنده‌ها** | مالکیت ۱۰۰٪ زیرساخت | عدم وابستگی به Twilio و مشابهان |
| 📉 **نرخ تحویل پایین پیامک** | ارسال از طریق واتس‌اپ | نرخ تحویل نزدیک به **۱۰۰٪** |
| ⛔ **ریسک مسدود شدن** | موتور ضد-بلاک هوشمند | شبیه‌سازی رفتار انسانی |

### 🎯 موارد استفاده:

- ✅ ارسال کد تایید (OTP) به شماره‌های بین‌المللی
- ✅ اطلاع‌رسانی خودکار به کاربران
- ✅ پشتیبانی از چندین خطوط همزمان
- ✅ یکپارچه‌سازی با CRM و سیستم‌های موجود
- ✅ کاهش هزینه‌های ارتباطی تا **۹۹٪**

---

## ✨ قابلیت‌های کلیدی و پیشرفته

### 🔐 مدیریت چند-نشستی (Multi-Session)
پشتیبانی همزمان از چندین شماره موبایل ایزوله روی یک سرور با مدیریت جداگانه هر سشن.

### 🧹 اصلاح هوشمند شماره (Smart Sanitization)
سیستم به صورت خودکار پیش‌وندهای `+` و `00` را حذف کرده و شماره را به فرمت استاندارد تبدیل می‌کند.

### 🔢 قالب‌بندی کدهای تایید (OTP Formatter)
امکان ارسال مجزای متن پیام و کد تایید؛ سیستم کد را به صورت **Bold** در انتهای پیام ترکیب می‌کند.

### 📡 پشتیبانی کامل از وب‌هوک (Webhook)
ارسال گزارش لحظه‌ای رویدادها (وصل شدن، قطع شدن، تولید QR) به آدرس URL دلخواه شما.

### 📊 مانیتورینگ پیشرفته
مشاهده وضعیت مصرف RAM، زمان آنلاین بودن و سلامت لحظه‌ای خطوط.

### 🛡️ امنیت لایه‌بندی شده
محافظت از تمام مسیرها با X-API-KEY و قابلیت Trust Proxy برای کارکرد پشت Nginx.

### 🧹 پاکسازی خودکار
مکانیزم هوشمند حذف کش و فایل‌های موقت در صورت بروز خطا برای آماده‌سازی اسکن مجدد.

### 🤖 موتور ضد-بلاک (Anti-Ban Engine)
- شبیه‌سازی رفتار انسانی (Human-like Typing)
- ایجاد تأخیرهای تصادفی هوشمند
- مدیریت نرخ ارسال (Rate Limiting)
- تشخیص و جلوگیری از الگوهای رباتیک

---

## 🏗 معماری سیستم

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│         (Laravel / Python / Java / Mobile Apps)             │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/HTTPS
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx Reverse Proxy                      │
│              (SSL Termination + Load Balancing)             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│               WA-Gateway-Service (Port: 30033)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │   API    │  │ Session  │  │ Anti-Ban │  │ Webhook  │    │
│  │  Layer   │  │ Manager  │  │  Engine  │  │ Handler  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │  Logger  │  │Sanitizer │  │ Monitor  │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 WhatsApp Web (Multiple Sessions)            │
│     ┌─────────┐  ┌─────────┐  ┌─────────┐                 │
│     │Session 1│  │Session 2│  │Session N│                 │
│     └─────────┘  └─────────┘  └─────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 گام اول: آماده‌سازی حیاتی گوشی موبایل

> ⚠️ **مهم:** قبل از استقرار سرویس، انجام تنظیمات زیر روی گوشی فرستنده (Sender) برای **پایداری سشن** الزامی است:

### ✅ چک‌لیست آماده‌سازی:

| # | اقدام | جزئیات | اهمیت |
|---|-------|--------|-------|
| 1 | **به‌روزرسانی واتس‌اپ** | مطمئن شوید آخرین نسخه رسمی (Original/Business) را دارید | 🔴 ضروری |
| 2 | **غیرفعال کردن Battery Optimization** | تنظیمات → Apps → WhatsApp → Battery → Don't Optimize | 🔴 ضروری |
| 3 | **اتصال منظم اینترنت** | حداقل هر ۱۰ روز یک بار آنلاین باشید | 🟡 توصیه شده |
| 4 | **پاکسازی Linked Devices** | تمام سشن‌های قبلی و غیرضروری را پاک کنید | 🟡 توصیه شده |

### 📱 مراحل تنظیم Battery Optimization:

```
Settings → Apps → WhatsApp → Battery 
→ Select "Don't optimize" یا "Unrestricted"
```

---

## 📂 ساختار پوشه‌بندی پروژه

```text
/opt/WA-Gateway-Service/          # مسیر استاندارد نصب در لینوکس
│
├── 📁 helpers/                    # توابع کمکی و لاگر حرفه‌ای
│   └── logger.js                  # مدیریت ثبت وقایع در فایل و کنسول
│
├── 📁 services/                   # هسته پردازشی واتس‌اپ
│   └── whatsapp.js                # منطق اتصال، رویدادها و ضد-بلاک
│
├── 📁 .wwebjs_auth/               # محل ذخیره توکن‌های ورود (غیرقابل دسترسی از وب)
│
├── 📄 server.js                   # نقطه شروع برنامه و تعاریف API
├── 📄 wa-gateway-service.sh       # اسکریپت نصب تمام‌خودکار (Enterprise)
├── 📄 ecosystem.config.js         # تنظیمات مدیریت فرآیند PM2
├── 📄 .env                        # متغیرهای حساس و کلیدهای امنیتی
│
├── 📄 package.json                # وابستگی‌های پروژه
├── 📄 README.md                   # مستندات پروژه (این فایل)
└── 📄 .gitignore                  # فایل‌های نادیده گرفته شده توسط گیت
```

---

## 🛠 نصب و راه‌اندازی

### 📋 پیش‌نیازها:

- **سیستم عامل:** Ubuntu 20.04+ / Debian 11+
- **Node.js:** نسخه 18 یا بالاتر
- **PM2:** Process Manager برای Node.js
- **Nginx:** (اختیاری) برای Reverse Proxy و SSL
- **حافظه RAM:** حداقل 1GB (برای هر سشن)

---

### ۱. روش نصب خودکار (توصیه شده ⭐)

اسکریپت Bash طراحی شده تمامی پیش‌نیازها را به صورت خودکار نصب می‌کند:

```bash
# کلون کردن مخزن
git clone https://github.com/mmozani/WA-Gateway-Service.git
cd WA-Gateway-Service

# اجرای اسکریپت نصب (نیازمند دسترسی root)
sudo chmod +x wa-gateway-service.sh
sudo ./wa-gateway-service.sh
```

#### ✨ این اسکریپت چه کارهایی انجام می‌دهد:

- [ ] نصب Node.js نسخه 20 LTS
- [ ] نصب PM2 Process Manager
- [ ] نصب کتابخانه‌های گرافیکی Chromium (`libasound2t64` و ...)
- [ ] کپی پروژه به `/opt/WA-Gateway-Service`
- [ ] نصب وابستگی‌های npm
- [ ] ایجاد فایل `.env` نمونه
- [ ] تنظیم مجوزهای امنیتی

---

### ۲. روش نصب دستی

```bash
# ۱. نصب Node.js (اگر ندارید)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# ۲. نصب PM2
sudo npm install -g pm2

# ۳. نصب کتابخانه‌های سیستمی
sudo apt update
sudo apt install -y libasound2t64 libatk-bridge2.0-0 libcups2 libxkbcommon0 \
    libxdamage1 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2

# ۴. کلون و نصب پروژه
git clone https://github.com/mmozani/WA-Gateway-Service.git
cd WA-Gateway-Service
npm install

# ۵. تنظیم متغیرهای محیطی
cp .env.example .env
nano .env  # ویرایش تنظیمات

# ۶. اجرای سرویس
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

### ۳. پیکربندی Nginx (اختیاری اما توصیه شده)

برای استفاده از دامنه و SSL، از بلاک زیر در تنظیمات Nginx استفاده کنید:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/your-domain/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/your-domain/privateKey.pem;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://127.0.0.1:30033;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket Support (for future real-time features)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# HTTP to HTTPS Redirect
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 📸 نحوه اسکن کد QR و راه‌اندازی خطوط

### 🔄 مراحل اتصال:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   ۱. مشاهده لاگ  │ ──▶ │  ۲. اسکن QR     │ ──▶ │  ۳. تأیید جلسه  │
│  pm2 logs        │      │  گوشی → واتساپ  │      │  Session READY  │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

### 📝 دستورالعمل گام‌به‌گام:

```bash
# ۱. مشاهده لاگ‌های زنده
pm2 logs wa-gateway

# خروجی نمونه:
# [WA-Gateway] 🔄 Generating QR Code...
# [WA-Gateway] 📱 Scan this QR with your phone:
# [QR CODE WILL APPEAR HERE]
```

**مراحل اسکن:**

1. ☝️ گوشی خود را بردارید
2. 📱 وارد اپلیکیشن واتس‌اپ شوید
3. ⚙️ به بخش **Linked Devices** بروید
4. ➕ روی **Link a Device** کلیک کنید
5. 📷 کد نمایش داده شده در ترمینال را اسکن کنید
6. ✅ پیام `Session is READY. Number: 989XXXXXXXXX` را مشاهده خواهید کرد

> 💡 **نکته:** اطلاعات ورود ذخیره شده و برای دفعات بعد نیازی به اسکن مجدد نیست.

---

## ⚙️ متغیرهای فایل تنظیمات (.env)

```bash
# ===========================================
# WA-Gateway-Service Configuration
# ===========================================

# Server Configuration
PORT=30033                          # پورت اجرای سرویس
NODE_ENV=production                 # محیط اجرایی (development/production)

# Security
SECRET_API_KEY=your-secret-key-here  # کلید امنیتی برای API (تغییر دهید!)
TRUST_PROXY=1                       # فعال‌سازی Trust Proxy برای Nginx

# Sessions
SESSION_IDS=primary,second           # نام سشن‌ها (با کاما جدا شوند)

# Webhook
WEBHOOK_URL=https://your-domain.com/webhook  # آدرس دریافت رویدادها

# Anti-Ban Settings
TYPING_DELAY_MIN=1000               # حداقل تأخیر تایپ (میلی‌ثانیه)
TYPING_DELAY_MAX=3000               # حداکثر تأخیر تایپ (میلی‌ثانیه)
RATE_LIMIT_PER_MINUTE=30            # حداکثر پیام در دقیقه

# Logging
DEBUG_MODE=false                    # فعال‌سازی لاگ‌های جزئیاتی
LOG_LEVEL=info                      # سطح لاگ (debug/info/warn/error)

# Health Check
HEALTH_CHECK_INTERVAL=30000         # فاصله سلامت‌سنجی (میلی‌ثانیه)
```

---

## 📡 مستندات کامل API

### 🔐 احراز هویت

تمامی درخواست‌ها نیاز به هدر زیر دارند:

| Header | Value | Description |
|--------|-------|-------------|
| `Content-Type` | `application/json` | فرمت داده‌ها |
| `X-API-KEY` | `(your secret key)` | کلید API از فایل `.env` |

---

### ۱. ارسال پیام OTP

**POST** `/send-otp`

ارسال کد تایید به شماره موبایل مشخص شده.

#### Request Body:

```json
{
  "phone": "+989120209504",
  "message": "کد ورود شما:",
  "code": "1234",
  "session_id": "primary"
}
```

#### Parameters:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `phone` | string | ✅ Yes | شماره موبایل مقصد (با یا بدون پیشوند) |
| `message` | string | ✅ Yes | متن پیام (قبل از کد) |
| `code` | string/number | ✅ Yes | کد تایید |
| `session_id` | string | ❌ No | شناسه سشن (پیش‌فرض: primary) |

#### Success Response (200):

```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "to": "+989120209504",
    "session": "primary",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

#### Error Response (400/401/500):

```json
{
  "success": false,
  "error": "Invalid phone number format"
}
```

---

### ۲. مشاهده وضعیت خطوط

**GET** `/status`

دریافت لیست تمام سشن‌ها و وضعیت آن‌ها.

#### Response (200):

```json
{
  "success": true,
  "data": [
    {
      "id": "primary",
      "status": "READY",
      "number": "+989120209504",
      "uptime": "2d 5h 30m",
      "last_activity": "2024-01-15T10:29:45Z"
    },
    {
      "id": "second",
      "status": "OFFLINE",
      "number": null,
      "uptime": null,
      "last_activity": null
    }
  ]
}
```

---

### ۳. مانیتورینگ سلامت سرور

**GET** `/health`

بررسی سلامت سرویس و منابع سیستم.

#### Response (200):

```json
{
  "status": "healthy",
  "uptime": "172800 seconds",
  "memory": {
    "used_mb": 256,
    "total_mb": 1024,
    "percentage": 25
  },
  "sessions": {
    "total": 2,
    "active": 1,
    "offline": 1
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### ۴. حذف سشن و آماده‌سازی مجدد

**DELETE** `/session/:id`

قطع اتصال، پاکسازی کش و آماده‌سازی برای اسکن جدید.

#### Parameters:

| Parameter | Type | Location | Description |
|-----------|------|----------|-------------|
| `id` | string | URL Path | شناسه سشن |

#### Response (200):

```json
{
  "success": true,
  "message": "Session 'primary' deleted successfully. Ready for new QR scan."
}
```

---

## 🔗 مستندات وب‌هوک (Webhooks)

با تنظیم `WEBHOOK_URL` در فایل `.env`، رویدادهای زیر به صورت **POST** به آدرس مشخص شده ارسال می‌شوند:

### 📥 رویدادهای دریافتی:

#### ۱. تولید کد QR (برای نمایش در پنل)

```json
{
  "event": "qr",
  "session": "primary",
  "timestamp": "2024-01-15T10:25:00Z",
  "data": {
    "qr": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "expires_in": 20
  }
}
```

#### ۲. احراز هویت موفق

```json
{
  "event": "authenticated",
  "session": "primary",
  "timestamp": "2024-01-15T10:26:30Z",
  "data": {
    "number": "+989120209504"
  }
}
```

#### ۳. قطع اتصال

```json
{
  "event": "disconnected",
  "session": "primary",
  "timestamp": "2024-01-15T10:28:00Z",
  "data": {
    "reason": "connection_closed"
  }
}
```

#### ۴. ارسال موفق پیام

```json
{
  "event": "message_sent",
  "session": "primary",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "to": "+989123456789",
    "message_id": "true_989123456789@c.us_3EBxxxxxxx"
  }
}
```

---

## 🔒 امنیت

### 🛡️ لایه‌های امنیتی:

```
┌─────────────────────────────────────┐
│  Layer 1: API Key Authentication    │ ← X-API-KEY Header
├─────────────────────────────────────┤
│  Layer 2: Rate Limiting             │ ← Anti-Ban Engine
├─────────────────────────────────────┤
│  Layer 3: Input Validation          │ ← Smart Sanitization
├─────────────────────────────────────┤
│  Layer 4: Secure Storage            │ ← Encrypted Auth Tokens
├─────────────────────────────────────┤
│  Layer 5: Network Security          │ ← HTTPS + Nginx Hardening
└─────────────────────────────────────┘
```

### ✅ بهترین شیوه‌ها:

1. **تغییر کلید API:** همیشه مقدار `SECRET_API_KEY` را تغییر دهید
2. **استفاده از HTTPS:** همیشه از SSL/TLS استفاده کنید
3. **محدود کردن دسترسی:** فقط IPهای مجاز به API دسترسی داشته باشند
4. **به‌روزرسانی:** همیشه آخرین نسخه را استفاده کنید
5. **لاگ‌برداری:** لاگ‌ها را بررسی و نظارت کنید

---

## 🚀 اجرا در محیط عملیاتی (Production)

### 📋 دستورات مدیریتی PM2:

```bash
# ▶️ شروع سرویس
pm2 start ecosystem.config.js

# 📊 مشاهده وضعیت
pm2 status

# 📜 مشاهده لاگ‌ها (بسیار مهم برای عیب‌یابی!)
pm2 logs wa-gateway

# 🔄 ریستارت سرویس
pm2 restart wa-gateway

# ⏹️ توقف سرویس
pm2 stop wa-gateway

# ❌ حذف سرویس
pm2 delete wa-gateway

# 💾 ذخیره وضعیت (اجرا پس از ریبوت)
pm2 save
pm2 startup

# 📈 مانیتورینگ بلادرنگ
pm2 monit
```

### 🔧 عیب‌یابی رایج:

```bash
# بررسی لاگ‌های خطا
pm2 logs wa-gateway --err

# بررسی مصرف منابع
pm2 show wa-gateway

# پاک کردن لاگ‌ها
pm2 flush

# بررسی وضعیت سیستم
df -h
free -m
top -bn1 | head -20
```

---

## ❓ سوالات متداول (FAQ)

### ❓ **س: اگر شماره من مسدود (Ban) شد چکار کنم؟**

**ج:** 
1. سشن را با متد `DELETE /session/:id` پاک کنید
2. حداقل ۲۴ ساعت صبر کنید
3. با یک شماره جدید اسکن را انجام دهید
4. فاصله زمانی ارسال‌ها را در تنظیمات بررسی کنید
5. مطمئن شوید موتور ضد-بلاک فعال است

---

### ❓ **س: چرا خطای ERR_ERL_UNEXPECTED_X_FORWARDED_FOR دریافت می‌کنم؟**

**ج:** 
- اگر سرویس را پشت Nginx قرار داده‌اید، مطمئن شوید خط `app.set('trust proxy', 1);` در فایل `server.js` فعال است
- یا متغیر `TRUST_PROXY=1` را در فایل `.env` تنظیم کنید

---

### ❓ **س: چرا کد QR در ترمینال نمایش داده نمی‌شود؟**

**ج:** 
- مطمئن شوید کتابخانه‌های گرافیکی اوبونتو نصب شده‌اند
- اسکریپت نصب خودکار را دوباره اجرا کنید: `sudo ./wa-gateway-service.sh`
- یا دستی نصب کنید: `sudo apt install -y libasound2t64 libatk-bridge2.0-0 libcups2`

---

### ❓ **س: آیا می‌توانم چندین شماره را همزمان مدیریت کنم؟**

**ج:** 
- بله! کافی است متغیر `SESSION_IDS` را در فایل `.env` تنظیم کنید
- مثال: `SESSION_IDS=sales,support,marketing`
- هر سشن نیاز به اسکن QR جداگانه دارد

---

### ❓ **س: چگونه می‌توانم اطمینان حاصل کنم که سرویس پس از ریبوت سرور اجرا می‌شود؟**

**ج:** 
```bash
pm2 save
pm2 startup
```
این دستورات PM2 را به عنوان systemd service ثبت می‌کنند.

---

### ❓ **س: آیا این سرویس برای محیط Production مناسب است؟**

**ج:** 
- بله! این سرویس برای محیط Production طراحی شده است
- ویژگی‌هایی مانند: PM2 process manager، Auto-restart، Logging، Health monitoring
- پیشنهاد می‌شود از Nginx به عنوان Reverse Proxy استفاده کنید

---

## 🤝 مشارکت در توسعه

ما از مشارکت شما استقبال می‌کنیم! 🎉

### 📝 نحوه مشارکت:

1. 🍴 Fork پروژه را Fork کنید
2. 🌿 یک Branch جدید بسازید: `git checkout -b feature/AmazingFeature`
3. ✅ تغییراتتان را Commit کنید: `git commit -m 'Add some AmazingFeature'`
4. 📤 به Fork خود Push کنید: `git push origin feature/AmazingFeature`
5. 🔀 یک Pull Request باز کنید

### 🐛 گزارش باگ:

از طریق [Issues](https://github.com/mmozani/WA-Gateway-Service/issues) باگ را گزارش دهید.

---

## 👨‍💻 نویسنده

**[Mohammad Mozani](https://github.com/mmozani)**

- 📧 Email: [mozani@parsian.digital](mailto:mozani@parsian.digital)
- 💼 GitHub: [@mmozani](https://github.com/mmozani)

---

## 🙏 تشکر و قدردانی

- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) - کتابخانه اصلی واتس‌اپ
- [PM2](https://pm2.keymetrics.io/) - Process Manager
- جامعه **برنامه‌نویسان ایران** 🇮🇷

---

## 📄 لایسنس

این پروژه تحت لایسنس **MIT** منتشر شده است.

```
MIT License

Copyright (c) 2024 Mohammad Mozani

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

### ⭐ اگر این پروژه به شما کمک کرد، لطفاً Star کنید! ⭐

**توسعه داده شده با ❤️ برای جامعه برنامه‌نویسان ایران**

[![Star History Chart](https://api.star-history.com/svg?repos=mmozani/WA-Gateway-Service&type=Date)](https://star-history.com/#mmozani/WA-Gateway-Service&Date)

</div>

---

<p align="center">
  <b>🔗 لینک‌های مفید:</b><br>
  <a href="https://github.com/mmozani/WA-Gateway-Service/issues">🐛 گزارش مشکل</a> •
  <a href="https://github.com/mmozani/WA-Gateway-Service/discussions">💬 بحث و گفتگو</a> •
  <a href="https://github.com/mmozani/WA-Gateway-Service/releases">📦 نسخه‌ها</a>
</p>

---

<div align="center">

**© 2024 WA-Gateway-Service. Made with ❤️ in Iran 🇮🇷**

</div>