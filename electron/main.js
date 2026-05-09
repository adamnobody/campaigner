const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let serverProcess;

const SERVER_PORT = 3001;

const logFile = path.join(app.getPath('userData'), 'electron-debug.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  console.log(msg);
  try {
    fs.appendFileSync(logFile, line);
  } catch (e) {}
}

function getBasePath() {
  return app.isPackaged
    ? process.resourcesPath
    : path.join(__dirname, '..');
}

function getNodeRuntime() {
  // В packaged-приложении это будет Campaigner.exe.
  // С ELECTRON_RUN_AS_NODE=1 он работает как node.exe.
  return process.execPath;
}

function startServer() {
  return new Promise((resolve, reject) => {
    const base = getBasePath();

    const serverPath = path.join(base, 'backend', 'dist', 'index.js');
    const backendCwd = path.join(base, 'backend');
    const frontendDist = path.join(base, 'frontend', 'dist');
    const dbPath = path.join(app.getPath('userData'), 'campaigner.sqlite');
    const nodeModulesPath = path.join(base, 'node_modules');
    const nodeRuntime = getNodeRuntime();

    log(`=== Server startup ===`);
    log(`app.isPackaged: ${app.isPackaged}`);
    log(`basePath: ${base}`);
    log(`Node runtime: ${nodeRuntime}`);
    log(`Server: ${serverPath} (exists: ${fs.existsSync(serverPath)})`);
    log(`Backend cwd: ${backendCwd} (exists: ${fs.existsSync(backendCwd)})`);
    log(`Frontend: ${frontendDist} (exists: ${fs.existsSync(frontendDist)})`);
    log(`node_modules: ${nodeModulesPath} (exists: ${fs.existsSync(nodeModulesPath)})`);
    log(`DB: ${dbPath}`);

    if (!fs.existsSync(serverPath)) {
      const errMsg = `backend/dist/index.js не найден!\n\nПуть: ${serverPath}`;
      dialog.showErrorBox('Ошибка', errMsg);
      return reject(new Error(errMsg));
    }

    serverProcess = spawn(nodeRuntime, [serverPath], {
      cwd: backendCwd,
      env: {
        ...process.env,

        // Главное: заставляем Electron.exe работать как Node.js.
        ELECTRON_RUN_AS_NODE: '1',

        NODE_ENV: 'production',
        PORT: String(SERVER_PORT),
        DATABASE_PATH: dbPath,
        FRONTEND_DIST_PATH: frontendDist,

        // Твой root node_modules лежит в resources/node_modules.
        NODE_PATH: nodeModulesPath,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let started = false;
    let stderrBuffer = '';

    function markStarted(reason) {
      if (started) return;
      started = true;
      log(`[server] Started: ${reason}`);
      resolve();
    }

    serverProcess.stdout.on('data', (data) => {
      const msg = data.toString();
      log(`[server:out] ${msg.trim()}`);

      if (
        !started &&
        (
          msg.toLowerCase().includes('server') ||
          msg.toLowerCase().includes('listening') ||
          msg.toLowerCase().includes('port') ||
          msg.includes(String(SERVER_PORT))
        )
      ) {
        markStarted('stdout signal');
      }
    });

    serverProcess.stderr.on('data', (data) => {
      const msg = data.toString();
      log(`[server:err] ${msg.trim()}`);
      stderrBuffer += msg;
    });

    serverProcess.on('error', (err) => {
      log(`[spawn-error] ${err.message}`);

      if (!started) {
        dialog.showErrorBox(
          'Ошибка запуска сервера',
          `${err.message}\n\nЛог: ${logFile}`
        );

        reject(err);
      }
    });

    serverProcess.on('exit', (code) => {
      log(`[server:exit] code=${code}`);

      if (!started) {
        dialog.showErrorBox(
          'Ошибка сервера',
          `Сервер завершился с кодом ${code}\n\n${stderrBuffer.slice(0, 1000)}\n\nЛог: ${logFile}`
        );

        reject(new Error(`Server exit code ${code}`));
      }
    });

    // Fallback: если через 6 сек сервер не написал "listening" — всё равно пробуем открыть окно.
    setTimeout(() => {
      if (!started) {
        markStarted('fallback timeout');
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

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function stopServer() {
  if (serverProcess) {
    log('[server] Killing server process');
    serverProcess.kill();
    serverProcess = null;
  }
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
  stopServer();
  app.quit();
});

app.on('before-quit', () => {
  stopServer();
});