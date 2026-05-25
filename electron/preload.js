const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('electronPlatform', {
  platform: process.platform,
  isElectron: true,
})
