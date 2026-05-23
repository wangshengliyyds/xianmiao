// PM2 配置文件
module.exports = {
  apps: [
    {
      name: 'xianmiao',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/xianmiao/error.log',
      out_file: '/var/log/xianmiao/out.log',
      merge_logs: true,
    },
  ],
}
