#!/bin/bash
# 闲妙 - 开发环境启动脚本 (Linux/macOS)

set -e

echo ""
echo "================================"
echo "  闲妙 - AI驱动二手闲置交易平台"
echo "  开发环境启动脚本"
echo "================================"
echo ""

# 检查 Node.js
command -v node >/dev/null 2>&1 || { echo "[错误] 未检测到 Node.js，请先安装: https://nodejs.org"; exit 1; }

# 检查 pnpm
command -v pnpm >/dev/null 2>&1 || {
    echo "[提示] 未检测到 pnpm，正在安装..."
    npm install -g pnpm
}

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "[提示] 正在安装依赖..."
    pnpm install
fi

# 检查 .env.local
if [ ! -f ".env.local" ]; then
    echo "[提示] 未找到 .env.local，请配置环境变量"
    exit 1
fi

# 显示配置状态
echo "[配置状态]"
if grep -q "placeholder" .env.local 2>/dev/null; then
    echo "  Supabase: 未配置（使用 Mock 数据）"
else
    echo "  Supabase: 已配置"
fi

if grep -q "MIMO_API_KEY" .env.local 2>/dev/null && ! grep "MIMO_API_KEY" .env.local | grep -q "#"; then
    echo "  MiMo AI:  已配置"
else
    echo "  MiMo AI:  未配置（使用模拟数据）"
fi

echo ""
echo "[启动] 正在启动开发服务器..."
echo "  本地: http://localhost:3000"
echo ""
echo "  按 Ctrl+C 停止服务器"
echo ""

pnpm dev
