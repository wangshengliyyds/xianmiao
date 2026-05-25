#!/bin/bash
# ============================================
# 闲妙 - 阿里云服务器部署脚本
# 使用方法：在服务器上克隆项目后运行
#   chmod +x deploy.sh && ./deploy.sh
# ============================================

set -e

APP_NAME="xianmiao"
APP_DIR="/var/www/$APP_NAME"
REPO_URL=""  # 填入你的 git 仓库地址
PORT=3001

echo "==============================="
echo "  闲妙 部署脚本"
echo "==============================="

# ---- 1. 检查 Node.js ----
if ! command -v node &> /dev/null; then
  echo "[1/6] 安装 Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
else
  echo "[1/6] Node.js 已安装: $(node -v)"
fi

# ---- 2. 检查 pnpm ----
if ! command -v pnpm &> /dev/null; then
  echo "[2/6] 安装 pnpm..."
  npm install -g pnpm
else
  echo "[2/6] pnpm 已安装: $(pnpm -v)"
fi

# ---- 3. 检查 PM2 ----
if ! command -v pm2 &> /dev/null; then
  echo "[3/6] 安装 PM2..."
  npm install -g pm2
else
  echo "[3/6] PM2 已安装"
fi

# ---- 4. 拉取/更新代码 ----
echo "[4/6] 拉取代码..."
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR"
  git pull
else
  if [ -z "$REPO_URL" ]; then
    echo "请先在脚本中填入 REPO_URL（git 仓库地址）"
    echo "或者手动将代码上传到 $APP_DIR"
    mkdir -p "$APP_DIR"
    exit 1
  fi
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# ---- 5. 安装依赖 & 构建 ----
echo "[5/6] 安装依赖..."
pnpm install --frozen-lockfile

echo "[5/6] 构建项目..."
pnpm build

# ---- 6. 配置环境变量（如不存在） ----
if [ ! -f ".env.production" ]; then
  echo "[6/6] 创建 .env.production..."
  cat > .env.production << 'ENVEOF'
# 修改以下配置为你的实际值
NEXT_PUBLIC_APP_URL=http://YOUR_SERVER_IP:3001
NEXTAUTH_URL=http://YOUR_SERVER_IP:3001
NEXTAUTH_SECRET=请生成一个随机强密钥
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名Key
SUPABASE_SERVICE_KEY=你的Supabase服务密钥
SPUG_API_URL=你的推送服务URL(可选)
ENVEOF
  echo "请编辑 .env.production 填入正确的服务器 IP 和 NEXTAUTH_SECRET"
  echo "然后重新运行此脚本"
  exit 1
fi

# ---- 7. 启动/重启 PM2 ----
echo "[6/6] 启动服务..."
pm2 delete $APP_NAME 2>/dev/null || true
NODE_ENV=production pm2 start npm --name $APP_NAME -- start -- -p $PORT
pm2 save

# 设置 PM2 开机自启
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo ""
echo "==============================="
echo "  部署完成！"
echo "  访问: http://$(hostname -I | awk '{print $1}'):$PORT"
echo ""
echo "  常用命令："
echo "  pm2 status        - 查看状态"
echo "  pm2 logs $APP_NAME - 查看日志"
echo "  pm2 restart $APP_NAME - 重启"
echo "==============================="
