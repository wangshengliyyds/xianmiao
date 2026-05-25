# 闲妙 - 阿里云服务器部署教程

## 前置条件

- 阿里云 ECS 服务器（推荐 2核4G 以上）
- 已安装 Git
- 服务器安全组开放 3001 端口

## 第一步：上传代码到 Git 仓库

```bash
# 在本地项目目录
cd C:\Users\hp\Desktop\ww\xianmiao
git init
git add .
git commit -m "initial commit"
git remote add origin <你的git仓库地址>
git push -u origin main
```

## 第二步：SSH 登录服务器

```bash
ssh root@你的服务器IP
```

## 第三步：克隆项目并配置

```bash
# 克隆项目
git clone <你的git仓库地址> /var/www/xianmiao
cd /var/www/xianmiao

# 创建生产环境配置
cp .env.production.example .env.production
nano .env.production
```

编辑 `.env.production`，把 `YOUR_SERVER_IP` 替换为你服务器的实际 IP：

```
NEXT_PUBLIC_APP_URL=http://47.xxx.xxx.xxx:3001
NEXTAUTH_URL=http://47.xxx.xxx.xxx:3001
NEXTAUTH_SECRET=你的随机密钥(用 openssl rand -base64 32 生成)
```

## 第四步：运行部署脚本

```bash
chmod +x deploy.sh
./deploy.sh
```

脚本会自动：
1. 安装 Node.js 20
2. 安装 pnpm
3. 安装 PM2
4. 安装依赖并构建
5. 启动服务

## 第五步：验证部署

打开浏览器访问：`http://你的服务器IP:3001`

## 常用命令

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs xianmiao

# 重启服务
pm2 restart xianmiao

# 更新代码后重新部署
cd /var/www/xianmiao
./update.sh
```

## 后续优化（可选）

### 配置 Nginx 反向代理（有域名后）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 配置 SSL 证书（HTTPS）

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

然后更新 `.env.production` 中的 URL 为 `https://your-domain.com`。
