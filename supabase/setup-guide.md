# 闲妙 - Supabase 初始化指南

## 步骤 1：创建 Supabase 项目

1. 访问 https://supabase.com 并注册/登录
2. 点击 "New Project" 创建新项目
3. 选择区域（推荐 Singapore 或 Tokyo，延迟最低）
4. 设置数据库密码（请记住）
5. 等待项目创建完成（约 1-2 分钟）

## 步骤 2：获取 API 凭证

1. 进入项目后，点击左侧 "Settings" → "API"
2. 复制以下三个值：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_KEY`（点击 Reveal 查看）

## 步骤 3：执行建表脚本

1. 在 Supabase Dashboard 中点击左侧 "SQL Editor"
2. 点击 "New Query"
3. 打开本项目的 `supabase/schema.sql` 文件，复制全部内容
4. 粘贴到 SQL Editor 中，点击 "Run" 执行
5. 等待执行完成（约 10 秒），确认无报错

## 步骤 4：执行种子数据

1. 再次点击 "New Query"
2. 打开 `supabase/seed.sql`，复制全部内容
3. 粘贴并执行
4. 确认输出 "DO" 和 "SELECT" 成功

## 步骤 5：创建 Storage Buckets

在 Supabase Dashboard 中点击左侧 "Storage"，创建以下 3 个 Bucket：

| Bucket 名称 | 公开访问 | 用途 |
|------------|---------|------|
| `products` | 是 | 商品图片 |
| `avatars`  | 是 | 用户头像 |
| `chat`     | 否 | 聊天图片 |

创建步骤：
1. 点击 "Create Bucket"
2. 输入名称，勾选/不勾选 "Public bucket"
3. 点击 "Create"

## 步骤 6：配置 Storage RLS 策略

对每个 Bucket，在 "Policies" 标签页添加策略：

**products 和 avatars（公开读）：**
- 策略名: `Public Read`
- 操作: SELECT
- 策略表达式: `true`

**所有 Bucket（认证写）：**
- 策略名: `Auth Upload`
- 操作: INSERT
- 策略表达式: `auth.uid() IS NOT NULL`

**所有 Bucket（所有者删改）：**
- 策略名: `Owner Update`
- 操作: UPDATE
- 策略表达式: `auth.uid() = owner`

- 策略名: `Owner Delete`
- 操作: DELETE
- 策略表达式: `auth.uid() = owner`

## 步骤 7：配置 .env.local

将步骤 2 获取的凭证填入项目根目录的 `.env.local`：

```
NEXT_PUBLIC_SUPABASE_URL=https://你的项目ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon_key
SUPABASE_SERVICE_KEY=你的service_role_key
```

## 步骤 8：设置管理员

应用启动后，用手机号登录，然后在 Supabase SQL Editor 执行：

```sql
UPDATE profiles SET role = 'admin' WHERE phone = '你的手机号';
```

## 完成！

现在可以启动应用了：
- 本地开发：`pnpm dev` 或双击 `dev-start.bat`
- 服务器部署：`bash deploy.sh`
