# 闲妙 Bug 修复 + 桌面端 App 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 CRITICAL/MEDIUM 安全 Bug，然后基于 Electron 打包桌面端 App

**Architecture:** Phase 1 修补 4 个关键安全/错误处理问题；Phase 2 搭建 Electron 壳加载远程服务器 URL，与现有 Capacitor Android 方式一致

**Tech Stack:** Next.js 16, TypeScript, Electron 33+, electron-builder

---

## Phase 1: Bug 修复

### Task 1: dev/switch-role 添加 NODE_ENV 保护

**Files:**
- Modify: `src/app/api/dev/switch-role/route.ts:53`

**Context:** 该路由是唯一没有 `NODE_ENV` 检查的 dev 路由。生产环境中任何匿名用户可通过 POST `/api/dev/switch-role` 切换到管理员身份。

- [ ] **Step 1: 添加环境检查**

将 `src/app/api/dev/switch-role/route.ts` 的 POST 函数改为：

```ts
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { role } = await request.json()
  // ... 剩余逻辑不变
}
```

只在第 53 行 `export async function POST(request: Request) {` 之后、第 54 行 `const { role } = await request.json()` 之前，插入 4 行：

```ts
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
```

- [ ] **Step 2: 验证**

本地 dev 模式下 `curl -X POST http://localhost:3000/api/dev/switch-role -H 'Content-Type: application/json' -d '{"role":"admin"}` 应仍正常工作。构建生产版本后同一请求应返回 404。

- [ ] **Step 3: Commit**

```bash
git add src/app/api/dev/switch-role/route.ts
git commit -m "fix: guard dev/switch-role endpoint with NODE_ENV check"
```

---

### Task 2: 短信验证码不再明文返回

**Files:**
- Modify: `src/app/api/auth/send-code/route.ts:86-95`

**Context:** 当短信服务不可用或发送失败时，第 92-94 行将验证码明文通过 `dev_code` 字段返回给客户端，完全绕过手机验证。

- [ ] **Step 1: 修改 dev_code 返回逻辑**

将第 86-95 行：

```ts
    // 返回验证码用于测试（短信服务不可用时自动显示）
    const response: Record<string, unknown> = {
      success: true,
      message: '验证码已发送',
    }
    // 未配置短信服务或发送失败时，在页面上显示验证码
    if (!smsSent) {
      response.dev_code = code
    }
    return NextResponse.json(response)
```

改为：

```ts
    const response: Record<string, unknown> = {
      success: true,
      message: '验证码已发送',
    }
    if (!smsSent) {
      if (process.env.NODE_ENV === 'development') {
        response.dev_code = code
      } else {
        return NextResponse.json({ error: '验证码发送失败，请稍后重试' }, { status: 500 })
      }
    }
    return NextResponse.json(response)
```

- [ ] **Step 2: 删除生产环境打印手机号的 console.log**

删除第 77 行：
```ts
          console.log(`[SMS] 验证码已发送至 ${phone}, request_id: ${(spugResult as any).request_id}`)
```

改为：
```ts
          if (process.env.NODE_ENV === 'development') {
            console.log(`[SMS] 验证码已发送至 ${phone}`)
          }
```

- [ ] **Step 3: 验证**

在 dev 模式下，短信发送失败应仍返回 `dev_code`。生产构建后应返回 500 错误。

- [ ] **Step 4: Commit**

```bash
git add src/app/api/auth/send-code/route.ts
git commit -m "fix: stop leaking verification code in production API response"
```

---

### Task 3: 8 个 API 路由添加 try/catch

**Files:**
- Modify: `src/app/api/profile/route.ts:6-25`
- Modify: `src/app/api/admin/users/route.ts:5-30`
- Modify: `src/app/api/admin/users/[id]/route.ts` (GET handler — 当前无 GET，如有则添加)
- Modify: `src/app/api/reports/route.ts:6-67`
- Modify: `src/app/api/orders/[id]/route.ts:5-35`
- Modify: `src/app/api/conversations/[id]/route.ts:5-88`
- Modify: `src/app/api/favorites/route.ts:61-89` (POST)
- Modify: `src/app/api/favorites/route.ts:92-121` (DELETE)

- [ ] **Step 1: profile GET — 添加 try/catch**

`src/app/api/profile/route.ts`，将 GET 函数包裹：

```ts
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[profile] GET error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
```

- [ ] **Step 2: admin/users GET — 添加 try/catch**

`src/app/api/admin/users/route.ts`，将第 5-30 行的 GET 函数用 try/catch 包裹，在函数开头加 `try {`，在函数结尾（第 29 行 return 之后）加 `} catch (err) { console.error('[admin/users] GET error:', err); return NextResponse.json({ error: '服务器错误' }, { status: 500 }) }`

- [ ] **Step 3: reports POST — 添加 try/catch**

`src/app/api/reports/route.ts`，将 POST 函数（第 6-67 行）用 try/catch 包裹。在第 7 行后加 `try {`，在第 66 行 return 后加 `} catch (err) { console.error('[reports] POST error:', err); return NextResponse.json({ error: '服务器错误' }, { status: 500 }) }`

- [ ] **Step 4: orders/[id] GET — 添加 try/catch**

`src/app/api/orders/[id]/route.ts`，将 GET 函数（第 5-35 行）用 try/catch 包裹。

- [ ] **Step 5: conversations/[id] GET — 添加 try/catch**

`src/app/api/conversations/[id]/route.ts`，将 GET 函数（第 4-88 行）用 try/catch 包裹。

- [ ] **Step 6: favorites POST — 添加 try/catch**

`src/app/api/favorites/route.ts`，将 POST 函数（第 61-89 行）用 try/catch 包裹。

- [ ] **Step 7: favorites DELETE — 添加 try/catch**

`src/app/api/favorites/route.ts`，将 DELETE 函数（第 92-121 行）用 try/catch 包裹。

- [ ] **Step 8: 验证**

```bash
npx tsc --noEmit  # 应无类型错误
```

- [ ] **Step 9: Commit**

```bash
git add src/app/api/profile/route.ts src/app/api/admin/users/route.ts src/app/api/reports/route.ts src/app/api/orders/\[id\]/route.ts src/app/api/conversations/\[id\]/route.ts src/app/api/favorites/route.ts
git commit -m "fix: add try/catch error handling to 7 API routes"
```

---

### Task 4: 地图页瓦片源替换为高德地图

**Files:**
- Modify: `src/app/(main)/map/page.tsx:35-39,78-80`

**Context:** OpenStreetMap 在国内访问不稳定，unpkg CDN 加载 Leaflet CSS 也可能超时。

- [ ] **Step 1: 替换 Leaflet CSS CDN 为本地 node_modules 路径**

将第 35-39 行：
```ts
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }
```

改为使用本地 CSS（将 leaflet.css 复制到 public 目录或通过 next.config 配置静态资源）：

方案：将 leaflet.css 复制到 `public/leaflet.css`，然后：
```ts
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = '/leaflet.css'
        document.head.appendChild(link)
      }
```

- [ ] **Step 2: 替换地图瓦片为高德地图**

将第 78-80 行：
```ts
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)
```

改为高德地图瓦片（无需 key 的 web 底图）：
```ts
    L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
      subdomains: ['1', '2', '3', '4'],
      attribution: '&copy; 高德地图',
    }).addTo(map)
```

- [ ] **Step 3: 复制 leaflet.css 到 public 目录**

```bash
cp node_modules/.pnpm/leaflet@*/node_modules/leaflet/dist/leaflet.css public/leaflet.css
```

- [ ] **Step 4: 验证**

启动 dev 服务器，访问地图页，确认：
1. 地图正常加载（高德瓦片）
2. 无外部 CDN 请求
3. 商品标记正常显示

- [ ] **Step 5: Commit**

```bash
git add src/app/\(main\)/map/page.tsx public/leaflet.css
git commit -m "fix: switch map tiles to Gaode and self-host Leaflet CSS"
```

---

## Phase 2: Electron 桌面端

### Task 5: 初始化 Electron 项目结构

**Files:**
- Create: `electron/main.js`
- Create: `electron/preload.js`
- Modify: `package.json` — 添加 devDependencies 和 scripts

- [ ] **Step 1: 安装 Electron 依赖**

```bash
pnpm add -D electron electron-builder
```

- [ ] **Step 2: 创建 `electron/main.js`**

```js
const { app, BrowserWindow, shell } = require('electron')
const path = require('path')

const APP_URL = process.env.ELECTRON_APP_URL || 'http://123.56.126.50:3001'

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: '闲妙',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.loadURL(APP_URL)

  // 外部链接用系统浏览器打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
```

- [ ] **Step 3: 创建 `electron/preload.js`**

```js
const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('electronPlatform', {
  platform: process.platform,
  isElectron: true,
})
```

- [ ] **Step 4: 修改 `package.json` 添加 scripts 和 main 字段**

在 `package.json` 中添加：

```json
{
  "main": "electron/main.js",
  "scripts": {
    "electron:dev": "electron .",
    "electron:build": "electron-builder",
    "electron:build:win": "electron-builder --win",
    "electron:build:mac": "electron-builder --mac",
    "electron:build:linux": "electron-builder --linux"
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add electron/ package.json pnpm-lock.yaml
git commit -m "feat: add Electron desktop app shell"
```

---

### Task 6: 配置 electron-builder 打包

**Files:**
- Create: `electron-builder.yml`
- Create: `electron/assets/icon.png` (需要转换现有 SVG 图标为 PNG)

- [ ] **Step 1: 创建 `electron-builder.yml`**

```yaml
appId: com.xianmiao.app
productName: 闲妙
directories:
  output: dist-electron
  buildResources: electron/assets

files:
  - electron/**/*

win:
  target:
    - nsis
  icon: electron/assets/icon.ico

mac:
  target:
    - dmg
  icon: electron/assets/icon.icns

linux:
  target:
    - AppImage
  icon: electron/assets/icon.png

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  shortcutName: 闲妙
```

- [ ] **Step 2: 生成应用图标**

将 `public/icons/icon-512.svg` 转换为：
- `electron/assets/icon.png` (512x512, Linux)
- `electron/assets/icon.ico` (Windows)
- `electron/assets/icon.icns` (macOS)

可以使用在线工具 https://convertio.co 或 `pnpm add -D electron-icon-builder` 批量生成。

- [ ] **Step 3: 测试打包**

```bash
pnpm electron:build:win
```

检查 `dist-electron/` 目录是否生成 `.exe` 安装包。

- [ ] **Step 4: Commit**

```bash
git add electron-builder.yml electron/assets/
git commit -m "feat: configure electron-builder for Windows/macOS/Linux"
```

---

### Task 7: 添加自动更新支持

**Files:**
- Modify: `electron/main.js` — 添加 autoUpdater 逻辑
- Modify: `package.json` — 添加 electron-updater 依赖

- [ ] **Step 1: 安装 electron-updater**

```bash
pnpm add electron-updater
```

- [ ] **Step 2: 在 `electron/main.js` 中添加自动更新**

在文件顶部添加：
```js
const { autoUpdater } = require('electron-updater')
```

在 `app.whenReady().then(createWindow)` 之后添加：
```js
app.whenReady().then(() => {
  createWindow()
  autoUpdater.checkForUpdatesAndNotify()
})
```

- [ ] **Step 3: Commit**

```bash
git add electron/main.js package.json pnpm-lock.yaml
git commit -m "feat: add auto-update support via electron-updater"
```

---

### Task 8: 适配桌面端布局

**Files:**
- Modify: `src/app/layout.tsx` 或 `src/app/(main)/layout.tsx` — 检测 Electron 环境调整布局

**Context:** 当前布局是移动端优先（底部导航栏），桌面端需要更宽的布局。

- [ ] **Step 1: 检测 Electron 环境**

在 `src/lib/constants.ts` 中添加：
```ts
export const IS_ELECTRON = typeof window !== 'undefined' && (window as any).electronPlatform?.isElectron === true
```

- [ ] **Step 2: 根据环境调整视口**

在 `electron/main.js` 的 BrowserWindow 配置中，User-Agent 已包含 Electron 标识，Next.js 可以据此判断。同时在 `capacitor.config.ts` 中已有 server.url 指向远程服务器，Electron 也使用同一 URL，因此前端需要区分。

在 preload 中暴露 `isElectron: true`，前端读取即可。

- [ ] **Step 3: 验证桌面端显示**

启动 `pnpm electron:dev`，确认：
1. 窗口标题显示「闲妙」
2. 页面正常加载远程服务器内容
3. 外部链接在系统浏览器打开
4. 窗口可调整大小（最小 800x600）

- [ ] **Step 4: Commit**

```bash
git add src/lib/constants.ts
git commit -m "feat: detect Electron environment for desktop layout"
```

---

## 最终验证

- [ ] TypeScript 编译通过：`npx tsc --noEmit`
- [ ] Dev 服务器正常启动：`pnpm dev`
- [ ] Electron 窗口正常打开：`pnpm electron:dev`
- [ ] 所有 dev 路由在生产构建中返回 404
- [ ] 短信验证码不再在 API 响应中泄露
