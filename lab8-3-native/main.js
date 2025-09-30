const { app, BrowserWindow, ipcMain, dialog, Menu, Tray, Notification, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow = null;
let tray = null;
let appIsQuiting = false;

// IPC Event Handlers
ipcMain.on('hide-to-tray', () => {
    if (mainWindow) {
        mainWindow.hide();
        if (process.platform === 'win32') {
            new Notification({
                title: 'Agent Wallboard',
                body: 'App is still running in the system tray'
            }).show();
        }
    }
});

ipcMain.on('show-app', () => {
    if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
    }
});

function createWindow() {
    console.log('🚀 [MAIN] สร้าง window...');
    
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Load the index.html file
    mainWindow.loadFile('index.html');
    
    // Open DevTools in development
    mainWindow.webContents.openDevTools();

    console.log('✅ [MAIN] Window พร้อมแล้ว');
    
    // Create system tray
    createTray();
    
    // Handle window close event
    mainWindow.on('close', (event) => {
        if (!appIsQuiting) {
            event.preventDefault();
            mainWindow.hide();
            
            // Show notification that the app is still running
            new Notification({
                title: 'Agent Wallboard',
                body: 'แอปยังทำงานอยู่ใน system tray\nคลิกขวาที่ icon เพื่อเปิดเมนู'
            }).show();
        }
    });
}

// System Tray
function createTray() {
    console.log('🖱️ [MAIN] สร้าง system tray...');
    
    try {
        // Create icon (use built-in icon if file not found)
        let trayIcon;
        try {
            trayIcon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'icon.png'));
            if (trayIcon.isEmpty()) throw new Error('Icon file not found');
        } catch (error) {
            console.warn('⚠️ ใช้ไอคอนเริ่มต้น เนื่องจากไม่พบไฟล์ icon.png');
            trayIcon = nativeImage.createEmpty();
        }

        // For macOS
        if (process.platform === 'darwin') {
            trayIcon = trayIcon.resize({ width: 16, height: 16 });
            trayIcon.setTemplateImage(true);
        }

        tray = new Tray(trayIcon);

        // Create context menu
        const contextMenu = Menu.buildFromTemplate([
            {
                label: '📊 แสดง Wallboard',
                click: () => {
                    console.log('📊 [TRAY] แสดง wallboard');
                    if (mainWindow) {
                        mainWindow.show();
                        mainWindow.focus();
                    }
                }
            },
            {
                label: '🔄 เปลี่ยนสถานะ',
                submenu: [
                    { label: '🟢 Available', click: () => changeAgentStatusFromTray('Available') },
                    { label: '🔴 Busy', click: () => changeAgentStatusFromTray('Busy') },
                    { label: '🟡 Break', click: () => changeAgentStatusFromTray('Break') }
                ]
            },
            { type: 'separator' },
            {
                label: '⚙️ ตั้งค่า',
                click: () => {
                    console.log('⚙️ [TRAY] เปิดตั้งค่า');
                    // Open settings (future implementation)
                }
            },
            {
                label: '❌ ออกจากโปรแกรม',
                click: () => {
                    console.log('❌ [TRAY] ออกจากโปรแกรม');
                    appIsQuiting = true;
                    app.quit();
                }
            }
        ]);
        
        // Set up tray
        tray.setContextMenu(contextMenu);
        tray.setToolTip('Agent Wallboard - Desktop App');
        
        // Handle tray icon click
        tray.on('click', () => {
            console.log('🖱️ [TRAY] คลิก tray icon');
            if (mainWindow) {
                if (mainWindow.isVisible()) {
                    mainWindow.hide();
                } else {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        });
        
        console.log('✅ [MAIN] System tray พร้อมแล้ว');
        return tray;
        
    } catch (error) {
        console.error('❌ [MAIN] Error creating tray:', error);
        return null;
    }
}

// Change status from tray
function changeAgentStatusFromTray(status) {
    console.log('🔄 [TRAY] เปลี่ยนสถานะเป็น:', status);
    
    // Send message to renderer if window exists
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('status-changed-from-tray', {
            newStatus: status,
            timestamp: new Date().toISOString()
        });
    }
    
    // Show notification
    try {
        new Notification({
            title: 'สถานะเปลี่ยนแล้ว',
            body: `เปลี่ยนสถานะเป็น ${status} แล้ว`,
            icon: path.join(__dirname, 'assets', 'notification.png')
        }).show();
    } catch (error) {
        console.error('❌ [TRAY] ไม่สามารถแสดง notification:', error);
    }
}

// File Operations
ipcMain.handle('open-file', async () => {
    console.log('📂 [MAIN] เปิด file dialog...');

    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters: [
                { name: 'Text Files', extensions: ['txt', 'json', 'csv'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (!result.canceled && result.filePaths[0]) {
            const filePath = result.filePaths[0];
            const content = await fs.readFile(filePath, 'utf8');

            console.log('✅ [MAIN] อ่านไฟล์สำเร็จ:', path.basename(filePath));

            return {
                success: true,
                fileName: path.basename(filePath),
                filePath: filePath,
                content: content,
                size: content.length
            };
        }

        return { success: false, cancelled: true };

    } catch (error) {
        console.error('❌ [MAIN] Error:', error);
        return { success: false, error: error.message };
    }
});

// Save file
ipcMain.handle('save-file', async (event, { content, fileName = 'export.txt' }) => {
    console.log('💾 [MAIN] บันทึกไฟล์...');

    try {
        const result = await dialog.showSaveDialog(mainWindow, {
            defaultPath: fileName,
            filters: [
                { name: 'Text Files', extensions: ['txt'] },
                { name: 'CSV Files', extensions: ['csv'] },
                { name: 'JSON Files', extensions: ['json'] }
            ]
        });

        if (!result.canceled && result.filePath) {
            await fs.writeFile(result.filePath, content, 'utf8');
            console.log('✅ [MAIN] บันทึกสำเร็จ:', path.basename(result.filePath));
            
            return {
                success: true,
                fileName: path.basename(result.filePath),
                filePath: result.filePath
            };
        }

        return { success: false, cancelled: true };

    } catch (error) {
        console.error('❌ [MAIN] Error:', error);
        return { success: false, error: error.message };
    }
});

// Notification API
ipcMain.handle('show-notification', (event, { title, body, urgent = false }) => {
    console.log('🔔 [MAIN] แสดง notification:', title);

    try {
        const notification = new Notification({
            title: title,
            body: body,
            icon: path.join(__dirname, 'assets', 'notification.png'),
            urgency: urgent ? 'critical' : 'normal',
            timeoutType: urgent ? 'never' : 'default'
        });

        notification.show();

        // Handle notification click
        notification.on('click', () => {
            console.log('🔔 [MAIN] คลิก notification');
            if (mainWindow) {
                mainWindow.show();
                mainWindow.focus();
            }
        });

        console.log('✅ [MAIN] แสดง notification สำเร็จ');
        return { success: true };

    } catch (error) {
        console.error('❌ [MAIN] Error notification:', error);
        return { success: false, error: error.message };
    }
});

// Agent event notification
ipcMain.handle('notify-agent-event', (event, { agentName, eventType, details = {} }) => {
    console.log('📢 [MAIN] Agent event notification:', agentName, eventType);

    const eventMessages = {
        'login': `🟢 ${agentName} เข้าสู่ระบบแล้ว`,
        'logout': `🔴 ${agentName} ออกจากระบบแล้ว`,
        'status_change': `🔄 ${agentName} เปลี่ยนสถานะเป็น ${details.newStatus}`,
        'call_received': `📞 ${agentName} รับสายใหม่`,
        'call_ended': `📞 ${agentName} จบการโทร (${details.duration} วินาที)`
    };

    try {
        const notification = new Notification({
            title: 'Agent Wallboard Update',
            body: eventMessages[eventType] || `📊 ${agentName}: ${eventType}`,
            icon: path.join(__dirname, 'assets', 'notification.png')
        });

        notification.show();

        notification.on('click', () => {
            if (mainWindow) {
                mainWindow.show();
                mainWindow.focus();
            }
        });

        return { success: true };
    } catch (error) {
        console.error('❌ [MAIN] Error showing agent event notification:', error);
        return { success: false, error: error.message };
    }
});

// App event handlers
app.whenReady().then(() => {
    createWindow();

    // macOS: Create new window when dock icon is clicked and no windows are open
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        } else if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
});

// Prevent app from quitting when all windows are closed (Windows/Linux)
app.on('window-all-closed', () => {
    // On macOS it's common for applications to stay open until explicitly quit
    if (process.platform !== 'darwin') {
        // On Windows/Linux, we'll keep the app running in the tray
    }
});

// Handle app before-quit
app.on('before-quit', () => {
    appIsQuiting = true;
    if (mainWindow) {
        mainWindow.destroy();
    }
});