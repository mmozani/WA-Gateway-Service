#!/bin/bash

# --- 1. Security & Pre-checks ---
# بررسی اینکه آیا اسکریپت با دسترسی ادمین (root) اجرا شده است یا خیر
if [ "$EUID" -ne 0 ]; then
  echo -e "\033[0;31m❌ Error: Please run this script as root (use sudo ./wa-gateway-service.sh)\033[0m"
  exit 1
fi

# متغیرهای مسیر
APP_DIR="/opt/wa-gateway"
CURRENT_DIR=$(pwd)

echo -e "\033[0;34m🚀 Starting Enterprise Installation for WA-Gateway-Service...\033[0m"

# --- 2. System Update & Dependencies ---
echo -e "\033[0;32m♻️ Updating system and installing dependencies...\033[0m"
apt update -y
# نصب پکیج‌های ضروری لینوکس و کرومیوم (نسخه سازگار با اوبونتو جدید)
apt install -y curl wget git unzip nano ufw \
libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 \
libasound2t64 libnss3 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 \
libgdk-pixbuf2.0-0 libgtk-3-0

# --- 3. Install Node.js & PM2 ---
if ! command -v node &> /dev/null; then
    echo -e "\033[0;32m🌐 Installing Node.js 20 LTS...\033[0m"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

if ! command -v pm2 &> /dev/null; then
    echo -e "\033[0;32m⚙️ Installing PM2 Process Manager...\033[0m"
    npm install pm2@latest -g
fi

# --- 4. Relocate Project to /opt ---
echo -e "\033[0;32m📂 Setting up application directory at $APP_DIR...\033[0m"

# ساخت پوشه اگر وجود نداشت
mkdir -p $APP_DIR

# کپی کردن تمام فایل‌های فعلی به پوشه اصلی سرور
cp -r $CURRENT_DIR/* $APP_DIR/
cp $CURRENT_DIR/.env* $APP_DIR/ 2>/dev/null # کپی فایل‌های مخفی محیطی

cd $APP_DIR

# --- 5. Application Setup ---
echo -e "\033[0;32m📦 Installing Node Modules...\033[0m"
npm install

# ساخت فایل .env در صورت عدم وجود
if [ ! -f .env ]; then
    echo -e "\033[0;33m📝 Creating default .env file...\033[0m"
    cp .env.example .env
fi

# تنظیم دسترسی‌های امنیتی برای پوشه
chown -R root:root $APP_DIR
chmod -R 755 $APP_DIR

# --- 6. Start Service with PM2 ---
echo -e "\033[0;32m🚀 Starting WA-Gateway with PM2...\033[0m"
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo -e "\033[0;32m✅ INSTALLATION COMPLETE! \033[0m"
echo -e "\033[0;33m---------------------------------------------------\033[0m"
echo -e "📍 Application is now installed at: \033[1m$APP_DIR\033[0m"
echo -e "🔑 Please edit your config file: \033[1mnano $APP_DIR/.env\033[0m"
echo -e "🔄 To restart the service run: \033[1mpm2 restart wa-gateway\033[0m"
echo -e "\033[0;33m---------------------------------------------------\033[0m"