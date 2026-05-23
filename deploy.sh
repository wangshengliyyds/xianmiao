#!/bin/bash

# 闲妙部署脚本 - 阿里云 ECS
set -e

echo "================================"
echo "  闲妙 - 部署脚本"
echo "================================"

# 配置
APP_DIR="/opt/xianmiao"
APP_NAME="xianmiao"
BRANCH="main"

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# 检查 .env.local
if [ ! -f "$APP_DIR/.env.local" ]; then
    err ".env.local 不存在，请先配置环境变量"
fi

if grep -q "placeholder" "$APP_DIR/.env.local" 2>/dev/null; then
    warn ".env.local 中仍有 placeholder 值，请填入真实凭证"
fi

# 1. 检查环境
log "检查环境..."
command -v node >/dev/null 2>&1 || err "需要 Node.js 18+"
command -v pnpm >/dev/null 2>&1 || npm install -g pnpm

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    err "需要 Node.js 18+，当前版本: $(node -v)"
fi

# 2. 拉取代码
log "拉取最新代码..."
cd $APP_DIR
git pull origin $BRANCH

# 3. 安装依赖
log "安装依赖..."
pnpm install --frozen-lockfile

# 4. 构建
log "构建项目..."
pnpm build

# 5. 重启服务
log "重启服务..."
if command -v pm2 >/dev/null 2>&1; then
    pm2 delete $APP_NAME 2>/dev/null || true
    pm2 start ecosystem.config.js
    pm2 save
    log "PM2 进程已启动"
else
    warn "pm2 未安装，使用 nohup 启动"
    pkill -f "next start" 2>/dev/null || true
    nohup npm start > /var/log/xianmiao.log 2>&1 &
fi

# 6. 重载 Nginx（如果已安装）
if command -v nginx >/dev/null 2>&1; then
    log "重载 Nginx..."
    nginx -t && nginx -s reload
fi

log "================================"
log " 部署完成！"
log "================================"
log "本地访问: http://localhost:3000"
log "公网访问: http://$(curl -s --max-time 3 ifconfig.me 2>/dev/null || echo '获取IP失败'):3000"
