const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const fs = require('fs');

let mainWindow;
let serverProcess;

const SERVER_PORT = 3001;

// Лог-файл для диагностики
const logFile = path.join(__dirname, '..', 'electron-debug.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  console.log(msg);
  fs.appendFileSync(logFile, line);
}

function findSystemNode() {
  try {
    const nodePath = execSync('where node', { encoding: 'utf-8' }).split('\n')[0].trim();
    if (nodePath) return nodePath;
  } catch (e) {}
  return null;
}

function startServer() {
  return new Promise((resolve, reject) => {
    const systemNode = findSystemNode();

    if (!systemNode) {
      dialog.showErrorBox(
        'Node.js не найден',
        'Для работы приложения необходим Node.js.\nСкачайте с https://nodejs.org'
      );
      app.quit();
      return reject(new Error('Node.js not found'));
    }

    log(`System Node.js: ${systemNode}`);

    const serverPath = path.join(__dirname, '..', 'backend', 'dist', 'index.js');
    const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
    const dbPath = path.join(app.getPath('userData'), 'campaigner.sqlite');

    log(`Server path: ${serverPath}`);
    log(`Server exists: ${fs.existsSync(serverPath)}`);
    log(`Frontend dist exists: ${fs.existsSync(frontendDist)}`);
    log(`DB path: ${dbPath}`);

    // Проверяем что файл сервера вообще есть
    if (!fs.existsSync(serverPath)) {
      const errMsg = `backend/dist/index.js не найден!\nПуть: ${serverPath}\nСначала выполните: npm run build`;
      dialog.showErrorBox('Файл сервера не найден', errMsg);
      return reject(new Error(errMsg));
    }

    serverProcess = spawn(systemNode, [serverPath], {
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: String(SERVER_PORT),
        DATABASE_PATH: dbPath,
        FRONTEND_DIST_PATH: frontendDist,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let started = false;
    let stderrBuffer = '';

    serverProcess.stdout.on('data', (data) => {
      const msg = data.toString();
      log(`[server:out] ${msg}`);
      if (!started && (msg.includes('Server') || msg.includes('listening') || msg.includes('port'))) {
        started = true;
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      const msg = data.toString();
      log(`[server:err] ${msg}`);
      stderrBuffer += msg;
    });

    serverProcess.on('error', (err) => {
      log(`[server:spawn-error] ${err.message}`);
      reject(err);
    });

    serverProcess.on('exit', (code) => {
      log(`[server:exit] code=${code}`);
      if (!started) {
        const errMsg = `Server exited with code ${code}\n\n--- stderr ---\n${stderrBuffer || '(пусто)'}`;
        log(errMsg);
        dialog.showErrorBox('Ошибка запуска сервера', errMsg);
        reject(new Error(errMsg));
      }
    });

    setTimeout(() => {
      if (!started) {
        started = true;
        log('[server] Fallback timeout — assuming started');
        resolve();
      }
    }, 5000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    icon: path.join(__dirname, 'icon.ico'),
    title: 'Campaigner',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(`http://localhost:${SERVER_PORT}`);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.setMenuBarVisibility(false);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    log('=== Electron starting ===');
    log(`__dirname: ${__dirname}`);
    log(`app.getAppPath(): ${app.getAppPath()}`);
    await startServer();
    log('Server ready, opening window...');
    createWindow();
  } catch (err) {
    log(`FATAL: ${err.message}`);
    dialog.showErrorBox('Ошибка запуска', err.message);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) serverProcess.kill();
});