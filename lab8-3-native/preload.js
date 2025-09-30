const { contextBridge, ipcRenderer } = require('electron');

console.log('🌉 [PRELOAD] ตั้งค่า Native APIs...');

contextBridge.exposeInMainWorld('nativeAPI', {
    // File Operations (เดิม)
    openFile: () => ipcRenderer.invoke('open-file'),
    saveFile: (content, fileName) => ipcRenderer.invoke('save-file', { content, fileName }),
    
    // 🔔 Notifications
    showNotification: (title, body, urgent = false) => {
      console.log('🔔 [PRELOAD] แสดง notification:', title);
      return ipcRenderer.invoke('show-notification', { title, body, urgent });
    },
    
    notifyAgentEvent: (agentName, eventType, details = {}) => {
      console.log('📢 [PRELOAD] Agent event:', agentName, eventType);
      return ipcRenderer.invoke('notify-agent-event', { agentName, eventType, details });
    }
  });