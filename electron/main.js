/**
 * main.js — Electron Main Process
 * Starts local Express/Socket.IO server + loads React frontend
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Required on Linux — prevents SUID sandbox fatal error when not running as root
if (process.platform === 'linux') app.commandLine.appendSwitch('no-sandbox');

const { initDb } = require('./local-server/db');
const { createLocalServer } = require('./local-server/index');
const { startSyncService, stopSyncService } = require('./local-server/sync');

const LOCAL_PORT = 3001;
const isDev = process.env.ELECTRON_DEV === 'true';

let mainWindow = null;
let httpServer = null;

// ─── Bootstrap ───────────────────────────────────────────────────────────────

async function bootstrap() {
  // 1. Init SQLite DB (must happen before anything else)
  const userDataPath = app.getPath('userData');
  initDb(userDataPath);
  console.log('[Desktop] SQLite initialized at:', userDataPath);

  // 2. Start local Express + Socket.IO server
  try {
    httpServer = await createLocalServer(LOCAL_PORT);
    console.log(`[Desktop] Local server running on port ${LOCAL_PORT}`);
  } catch (err) {
    console.error('[Desktop] Failed to start local server:', err);
  }

  // 3. Start background cloud sync service
  startSyncService();
  console.log('[Desktop] Sync service started');
}

// ─── Window ──────────────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // allow loading local files in production
    },
    title: 'Petpooja POS',
    show: false, // wait for ready-to-show
  });

  if (isDev) {
    // Development: connect to Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Production: load packaged or local React bundle
    const packagedPath  = path.join(process.resourcesPath, 'frontend-dist', 'index.html');
    const localBuildPath = path.join(__dirname, '../dist/index.html');
    const frontendPath  = fs.existsSync(packagedPath) ? packagedPath : localBuildPath;
    mainWindow.loadFile(frontendPath);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── App Lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  await bootstrap();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  stopSyncService();
  if (httpServer) {
    httpServer.close(() => console.log('[Desktop] Local server stopped'));
  }
  if (process.platform !== 'darwin') app.quit();
});

// ─── IPC Handlers ────────────────────────────────────────────────────────────

/** Returns the machine's local LAN IP for display in the UI */
ipcMain.handle('get-local-ip', () => {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
});

/** Returns current sync status */
ipcMain.handle('get-sync-status', () => {
  const { getSyncStatus } = require('./local-server/sync');
  return getSyncStatus();
});
