#!/bin/bash
# ============================================
# 闲妙 - 服务器更新脚本
# 使用方法：在服务器上运行
#   chmod +x update.sh && ./update.sh
# ============================================

set -e

APP_NAME="xianmiao"
APP_DIR="/var/www/$APP_NAME"

echo "更新闲妙..."

cd "$APP_DIR"
git pull
pnpm install --frozen-lockfile
pnpm build
pm2 restart $APP_NAME

echo "更新完成！"
pm2 logs $APP_NAME --lines 5
