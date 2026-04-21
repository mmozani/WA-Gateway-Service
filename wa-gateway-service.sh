#!/bin/bash

# --- تنظیمات رنگ برای خروجی بهتر ---
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting WA-Gateway-Service Auto-Setup...${NC}"

# ۱. آپدیت مخازن سیستم
echo -e "${GREEN}♻️ Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# ۲. نصب وابستگی‌های ضروری برای اجرای کرومیوم (Puppeteer) در لینوکس
echo -e "${GREEN}📦 Installing Chromium dependencies...${NC}"
sudo apt install -y libgbm-dev wget gnupg ca-certificates procps libxss1 \
libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 \
libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 \
libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 \
libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
gconf-service lsb-release

# ۳. نصب Node.js (نسخه ۲۰ - LTS)
if ! command -v node &> /dev/null
then
    echo -e "${GREEN}🌐 Installing Node.js 20...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo -e "${BLUE}✅ Node.js is already installed.${NC}"
fi

# ۴. نصب PM2 به صورت سراسری
if ! command -v pm2 &> /dev/null
then
    echo -e "${GREEN}⚙️ Installing PM2...${NC}"
    sudo npm install pm2 -g
fi

# ۵. نصب پکیج‌های پروژه
echo -e "${GREEN}📂 Installing project dependencies...${NC}"
npm install

# ۶. بررسی فایل .env
if [ ! -f .env ]; then
    echo -e "${GREEN}📝 Creating .env from .env.example...${NC}"
    cp .env.example .env
    echo -e "${BLUE}⚠️  Action Required: Please edit your .env file!${NC}"
fi

echo -e "${GREEN}✅ Setup complete!${NC}"
echo -e "${BLUE}👉 To start the app, run: ${NC} pm2 start ecosystem.config.js"