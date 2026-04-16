const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const fs = require('fs');

let mainWindow;
let serverProcess;

const SERVER_PORT = 3001;

const logFile = path.join(app.getPath('userData'), 'electron-debug.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  console.log(msg);
  try { fs.appendFileSync(logFile, line); } catch (e) {}
}

function getBasePath() {
  return app.isPackaged
    ? process.resourcesPath
    : path.join(__dirname, '..');
}

function findSystemNode() {
  try {
    const cmd = process.platform === 'win32' ? 'where node' : 'which node';
    const nodePath = execSync(cmd, { encoding: 'utf-8' }).split('\n')[0].trim();
    if (nodePath && fs.existsSync(nodePath)) return nodePath;
  } catch (e) {}

  // Типичные пути на Windows
  const candidates = [
    'C:\\Program Files\\nodejs\\node.exe',
    'C:\\Program Files (x86)\\nodejs\\node.exe',
    path.join(process.env.LOCALAPPDATA || '', 'fnm_multishells', '**', 'node.exe'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
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

    const base = getBasePath();
    const serverPath = path.join(base, 'backend', 'dist', 'index.js');
    const frontendDist = path.join(base, 'frontend', 'dist');
    const dbPath = path.join(app.getPath('userData'), 'campaigner.sqlite');
    const nodeModulesPath = path.join(base, 'node_modules');

    log(`=== Server startup ===`);
    log(`app.isPackaged: ${app.isPackaged}`);
    log(`basePath: ${base}`);
    log(`Node.js: ${systemNode}`);
    log(`Server: ${serverPath} (exists: ${fs.existsSync(serverPath)})`);
    log(`Frontend: ${frontendDist} (exists: ${fs.existsSync(frontendDist)})`);
    log(`node_modules: ${nodeModulesPath} (exists: ${fs.existsSync(nodeModulesPath)})`);
    log(`DB: ${dbPath}`);

    if (!fs.existsSync(serverPath)) {
      const errMsg = `backend/dist/index.js не найден!\n\nПуть: ${serverPath}`;
      dialog.showErrorBox('Ошибка', errMsg);
      return reject(new Error(errMsg));
    }

    serverProcess = spawn(systemNode, [serverPath], {
      cwd: path.join(base, 'backend'),
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: String(SERVER_PORT),
        DATABASE_PATH: dbPath,
        FRONTEND_DIST_PATH: frontendDist,
        NODE_PATH: nodeModulesPath,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let started = false;
    let stderrBuffer = '';

    serverProcess.stdout.on('data', (data) => {
      const msg = data.toString();
      log(`[server:out] ${msg.trim()}`);
      if (!started && (msg.includes('Server') || msg.includes('listening') || msg.includes('port'))) {
        started = true;
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      const msg = data.toString();
      log(`[server:err] ${msg.trim()}`);
      stderrBuffer += msg;
    });

    serverProcess.on('error', (err) => {
      log(`[spawn-error] ${err.message}`);
      reject(err);
    });

    serverProcess.on('exit', (code) => {
      log(`[server:exit] code=${code}`);
      if (!started) {
        dialog.showErrorBox('Ошибка сервера',
          `Сервер завершился с кодом ${code}\n\n${stderrBuffer.slice(0, 500)}\n\nЛог: ${logFile}`);
        reject(new Error(`Server exit code ${code}`));
      }
    });

    // Fallback: если через 6 сек сервер не написал "listening" — всё равно пробуем
    setTimeout(() => {
      if (!started) {
        started = true;
        log('[server] Fallback timeout — trying to open window');
        resolve();
      }
    }, 6000);
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
  mainWindow.setMenuBarVisibility(false);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(async () => {
  try {
    log('=== Electron starting ===');
    await startServer();
    log('Server ready, creating window...');
    createWindow();
  } catch (err) {
    log(`FATAL: ${err.message}`);
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