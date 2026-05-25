import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.xianmiao.app',
  appName: '闲妙',
  // 加载远程服务器（你的服务器 IP）
  server: {
    url: 'http://123.56.126.50:3001',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#10b981',
      showSpinner: false,
    },
  },
}

export default config
