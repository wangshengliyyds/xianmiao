@echo off
chcp 65001 >nul
title 闲妙 - 开发环境启动

echo.
echo  ================================
echo    闲妙 - AI驱动二手闲置交易平台
echo    开发环境启动脚本
echo  ================================
echo.

:: 检查 Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装: https://nodejs.org
    pause
    exit /b 1
)

:: 检查 pnpm
where pnpm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [提示] 未检测到 pnpm，正在安装...
    call npm install -g pnpm
)

:: 检查依赖
if not exist "node_modules" (
    echo [提示] 正在安装依赖...
    call pnpm install
)

:: 检查 .env.local
if not exist ".env.local" (
    echo [提示] 创建 .env.local 配置文件...
    copy ".env.example" ".env.local" 2>nul || (
        echo [警告] 未找到 .env.example，请手动配置 .env.local
    )
)

:: 显示配置状态
echo [配置状态]
findstr /C:"placeholder" .env.local >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo   Supabase: 未配置（使用 Mock 数据）
) else (
    echo   Supabase: 已配置
)

findstr /C:"SPUG_APP_KEY" .env.local >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo   短信验证: 已配置
) else (
    echo   短信验证: 未配置（验证码输出到控制台）
)

findstr /C:"MIMO_API_KEY" .env.local | findstr /V "#" >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo   MiMo AI:  已配置
) else (
    echo   MiMo AI:  未配置（使用模拟数据）
)

echo.
echo [启动] 正在启动开发服务器...
echo   本地: http://localhost:3000
echo   网络: 查看启动输出
echo.
echo   按 Ctrl+C 停止服务器
echo.

:: 启动
call pnpm dev
