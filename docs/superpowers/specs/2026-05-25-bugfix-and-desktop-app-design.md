# 闲妙 Bug 修复 + 桌面端 App 设计方案

## 概述

本方案分两个阶段：
1. **Phase 1** — 修复 CRITICAL 和 MEDIUM 级别的 Bug
2. **Phase 2** — 基于 Electron 打包桌面端 App，上架应用商店

---

## Phase 1: Bug 修复

### Fix 1 — dev/switch-role 添加 NODE_ENV 保护（CRITICAL）

**文件:** `src/app/api/dev/switch-role/route.ts`

**问题:** 该路由没有任何环境检查，生产环境任何人可 POST 切换到管理员账号。

**方案:** 在函数开头添加 `NODE_ENV` 检查，与 `dev/seed` 和 `dev/fix-images` 保持一致：

```ts
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  // ... existing logic
}
```

### Fix 2 — 短信验证码不再明文返回（CRITICAL）

**文件:** `src/app/api/auth/send-code/route.ts`

**问题:** 短信发送失败时，`dev_code` 被返回给客户端，绕过手机验证。

**方案:** 生产环境删除 `dev_code` 字段，仅在 `NODE_ENV === 'development'` 时返回：

```ts
if (!smsSent) {
  if (process.env.NODE_ENV === 'development') {
    response.dev_code = code
  } else {
    return NextResponse.json({ error: '验证码发送失败，请稍后重试' }, { status: 500 })
  }
}
```

同时删除第 77 行的 console.log（生产环境打印手机号）。

### Fix 3 — API 路由添加 try/catch（MEDIUM）

**文件（8处）:**
- `src/app/api/profile/route.ts` — GET
- `src/app/api/admin/users/route.ts` — GET
- `src/app/api/admin/users/[id]/route.ts` — GET
- `src/app/api/reports/route.ts` — POST
- `src/app/api/orders/[id]/route.ts` — GET
- `src/app/api/conversations/[id]/route.ts` — GET
- `src/app/api/favorites/route.ts` — POST, DELETE

**方案:** 为每个缺少 try/catch 的 handler 添加标准错误处理：

```ts
export async function GET(request: Request) {
  try {
    // ... existing logic
  } catch (err) {
    console.error('[route-name] error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
```

### Fix 4 — 地图页使用国内可用的瓦片源（MEDIUM）

**文件:** `src/app/(main)/map/page.tsx`

**问题:** OpenStreetMap 在国内不稳定，unpkg CDN 加载慢。

**方案:**
- Leaflet CSS 改为本地引入（import 到页面或 next.config 中配置）
- 地图瓦片改用高德地图或天地图

---

## Phase 2: Electron 桌面端 App

### 技术选型

- **Electron** + **electron-builder** — 打包和分发
- 复用现有 Next.js Web 应用，通过远程 URL 加载（与 Capacitor 一致）
- 服务器地址：`http://123.56.126.50:3001`

### 架构方案

```
electron/
  main.js          — Electron 主进程
  preload.js       — 预加载脚本
  assets/          — 应用图标（ICO/ICNS/PNG）

package.json       — 添加 electron 相关脚本和依赖
```

Electron 主进程加载远程服务器 URL，类似 Capacitor 的 server.url 模式。

### 关键配置

| 配置项 | 值 |
|--------|-----|
| App Name | 闲妙 |
| App ID | com.xianmiao.app |
| 窗口大小 | 1200x800 (min 800x600) |
| 加载 URL | `http://123.56.126.50:3001` |
| 平台 | Windows (.exe), macOS (.dmg), Linux (.AppImage) |

### 上架方案

| 平台 | 方式 |
|------|------|
| Windows | Microsoft Store（需 MSIX 打包） |
| macOS | Mac App Store 或直接分发 DMG |
| 国内 | 腾讯软件中心、360软件管家等（提交 exe） |

### 自动更新

使用 `electron-updater` 配合 GitHub Releases 实现自动更新。

---

## 执行顺序

1. Fix 1 — switch-role NODE_ENV 保护
2. Fix 2 — 验证码不再明文返回
3. Fix 3 — 8 处 API 添加 try/catch
4. Fix 4 — 地图瓦片源替换
5. Phase 2 — 搭建 Electron 项目
6. Phase 2 — 打包测试
7. Phase 2 — 配置自动更新和应用商店提交
