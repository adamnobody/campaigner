const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const { spawn, execFile } = require('child_process');
const fs = require('fs');
const http = require('http');
const net = require('net');

let mainWindow;
/** @type {import('child_process').ChildProcess | null} */
let serverProcess = null;
let currentServerPort = null;

const BACKEND_POLL_TIMEOUT_MS = 30000;
const BACKEND_POLL_INTERVAL_MS = 400;

const START_PORT = 3001;

const logFile = path.join(app.getPath('userData'), 'electron-debug.log');

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  console.log(msg);
  try {
    fs.appendFileSync(logFile, line);
  } catch (_e) {
    // ignore
  }
}

function appendDebugLog(chunk) {
  try {
    fs.appendFileSync(logFile, chunk);
  } catch (_e) {
    // ignore
  }
}

function getPackagedNodeExecutablePath() {
  if (process.platform === 'win32') {
    return path.join(process.resourcesPath, 'node', 'node.exe');
  }
  return path.join(process.resourcesPath, 'node', 'bin', 'node');
}

/**
 * Backend must run under plain Node.js (not Electron) so native addons match NODE_MODULE_VERSION.
 */
function resolveNodeRuntime() {
  if (app.isPackaged) {
    return getPackagedNodeExecutablePath();
  }
  return process.env.npm_node_execpath || process.env.NODE || 'node';
}

function getBasePath() {
  return app.isPackaged ? process.resourcesPath : path.join(__dirname, '..');
}

/**
 * @param {number} startPort
 */
function findFreePort(startPort) {
  return new Promise((resolve, reject) => {
    const tryListen = (port) => {
      if (port > startPort + 5000) {
        reject(new Error(`Could not find a free port starting at ${startPort}`));
        return;
      }
      const server = net.createServer();
      server.unref();
      server.once('error', (err) => {
        /** @type {NodeJS.ErrnoException} */
        const e = err;
        if (e.code === 'EADDRINUSE') tryListen(port + 1);
        else reject(err);
      });
      server.listen(port, '127.0.0.1', () => {
        const addr = server.address();
        const p = typeof addr === 'object' && addr ? addr.port : port;
        server.close(() => resolve(p));
      });
    };
    tryListen(startPort);
  });
}

/**
 * @param {number} port
 * @param {import('child_process').ChildProcess} child
 */
function waitForBackendHttp(port, child) {
  const url = `http://127.0.0.1:${port}/`;
  const deadline = Date.now() + BACKEND_POLL_TIMEOUT_MS;

  return new Promise((resolve, reject) => {
    let interval = null;
    let settled = false;

    let cleanup = () => {};

    /** @param {Error} err */
    const fail = (err) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };

    const ok = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    let onExitRef = (_code, _signal) => {};
    /** @type {(err: Error) => void} */
    let onSpawnErrorRef = (_err) => {};

    cleanup = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      child.removeListener('exit', onExitRef);
      child.removeListener('error', onSpawnErrorRef);
    };

    onSpawnErrorRef = (err) => {
      fail(err instanceof Error ? err : new Error(String(err)));
    };

    onExitRef = (code, signal) => {
      fail(
        new Error(
          `Backend process exited before the server became ready (code=${code ?? 'undefined'}, signal=${signal ?? 'none'})`
        )
      );
    };

    child.once('exit', onExitRef);
    child.on('error', onSpawnErrorRef);

    const probe = () => {
      if (Date.now() > deadline) {
        fail(new Error(`Backend readiness timed out after ${BACKEND_POLL_TIMEOUT_MS} ms (URL ${url})`));
        return;
      }
      const req = http.get(url, (res) => {
        res.resume();
        ok();
      });
      req.on('error', () => {});
      req.setTimeout(2000, () => {
        req.destroy();
      });
    };

    interval = setInterval(probe, BACKEND_POLL_INTERVAL_MS);
    probe();
  });
}

/**
 * @param {string} stderr
 * @param {number | null | undefined} port
 */
function buildUserFacingErrorMessage(stderr, port) {
  const tail = stderr.slice(-2800);

  const eaddr = /EADDRINUSE[^0-9]*(\d+)/i.exec(stderr);
  const portHint = port !== undefined && port !== null ? `${port}` : eaddr ? eaddr[1] : 'unknown';

  if (/better_sqlite3\.node|NODE_MODULE_VERSION|ERR_DLOPEN_FAILED/i.test(stderr)) {
    return (
      'Не удалось загрузить нативный модуль SQLite (better-sqlite3): несовпадение версии Node.js и скомпилированного .node (ABI).\n\n' +
      'Пересоберите приложение так, чтобы better-sqlite3 был собран под тот же Node.js, что и встроенный runtime (см. npm run electron:build).\n\n' +
      `--- лог (фрагмент) ---\n${tail}`
    );
  }

  if (/Cannot find package|ERR_MODULE_NOT_FOUND/i.test(stderr)) {
    return (
      'Отсутствует или не найдена зависимость backend (node_modules). Проверьте, что production node_modules попал в сборку.\n\n' +
      `--- stderr (фрагмент) ---\n${tail}`
    );
  }

  if (/EADDRINUSE/i.test(stderr)) {
    return (
      `Порт уже занят (EADDRINUSE). Освободите порт ${portHint} или завершите старый процесс Campaigner / node.\n\n` +
      `--- stderr (фрагмент) ---\n${tail}`
    );
  }

  return `Не удалось запустить сервер приложения.\n\n--- stderr (фрагмент) ---\n${tail}\n\nПолный лог: ${logFile}`;
}

function stopServer() {
  if (!serverProcess) return;
  const proc = serverProcess;
  serverProcess = null;
  const pid = proc.pid;
  log(`[server] stopServer pid=${pid}`);

  try {
    proc.stdout?.removeAllListeners();
    proc.stderr?.removeAllListeners();
  } catch (_e) {
    // ignore
  }

  try {
    if (process.platform === 'win32' && pid) {
      execFile('taskkill', ['/PID', String(pid), '/T', '/F'], (err) => {
        if (err) log(`[server] taskkill: ${err.message}`);
      });
    } else if (pid) {
      proc.kill('SIGTERM');
    }
  } catch (e) {
    log(`[server] kill error: ${e.message}`);
  }
}

async function startServer() {
  const nodeRuntime = resolveNodeRuntime();

  const base = getBasePath();
  const serverPath = path.join(base, 'backend', 'dist', 'index.js');
  const backendCwd = path.join(base, 'backend');
  const frontendDist = path.join(base, 'frontend', 'dist');
  const dbPath = path.join(app.getPath('userData'), 'campaigner.sqlite');
  const nodeModulesPath = path.join(base, 'node_modules');

  log('=== Server startup ===');
  log(`app.isPackaged: ${app.isPackaged}`);
  log(`basePath: ${base}`);
  log(`nodeRuntime: ${nodeRuntime}`);
  log(`serverPath: ${serverPath} (exists: ${fs.existsSync(serverPath)})`);
  log(`backendCwd: ${backendCwd} (exists: ${fs.existsSync(backendCwd)})`);
  log(`frontendDist: ${frontendDist} (exists: ${fs.existsSync(frontendDist)})`);
  log(`nodeModulesPath: ${nodeModulesPath} (exists: ${fs.existsSync(nodeModulesPath)})`);
  log(`dbPath: ${dbPath}`);

  if (app.isPackaged && !fs.existsSync(nodeRuntime)) {
    const msg =
      `Не найден встроенный Node.js:\n${nodeRuntime}\n\n` +
      'Ожидается файл resources\\node\\node.exe после сборки (electron-builder extraResources).\n';
    dialog.showErrorBox('Campaigner — ошибка', msg);
    appendDebugLog(`${msg}\n`);
    throw new Error(msg.trim());
  }

  if (!fs.existsSync(serverPath)) {
    const errMsg = `Файл backend не найден.\n${serverPath}`;
    dialog.showErrorBox('Campaigner — ошибка', errMsg);
    throw new Error(errMsg);
  }

  const port = await findFreePort(START_PORT);
  currentServerPort = port;
  log(`port: ${port}`);

  const env = {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(port),
    DATABASE_PATH: dbPath,
    FRONTEND_DIST_PATH: frontendDist,
    NODE_PATH: nodeModulesPath,
    FRONTEND_URL: `http://127.0.0.1:${port}`,
  };
  delete env.ELECTRON_RUN_AS_NODE;

  serverProcess = spawn(nodeRuntime, [serverPath], {
    cwd: backendCwd,
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
  });

  let stderrBuffer = '';

  serverProcess.stdout.on('data', (data) => {
    const msg = data.toString();
    log(`[server:out] ${msg.trimEnd()}`);
  });

  serverProcess.stderr.on('data', (data) => {
    const msg = data.toString();
    log(`[server:err] ${msg.trimEnd()}`);
    stderrBuffer += msg;
  });

  try {
    await waitForBackendHttp(port, serverProcess);
    log('[server] HTTP ready');
  } catch (err) {
    const stderrFull = `\n=== Full backend stderr ===\n${stderrBuffer}\n`;
    appendDebugLog(stderrFull);
    log(`FATAL readiness: ${err.message}`);

    const userMsg = buildUserFacingErrorMessage(stderrBuffer, port);
    dialog.showErrorBox('Campaigner — сервер не запустился', userMsg);

    stopServer();
    throw err;
  }

  const spawnedBackend = serverProcess;
  spawnedBackend.once('exit', (code, signal) => {
    log(`[server:exit-after-ready] code=${code} signal=${signal ?? ''}`);
    if (serverProcess === spawnedBackend) serverProcess = null;
  });
}

function createWindow() {
  if (!currentServerPort) {
    throw new Error('createWindow called without currentServerPort');
  }

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

  mainWindow.loadURL(`http://127.0.0.1:${currentServerPort}`);
  mainWindow.setMenuBarVisibility(false);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

if (!gotSingleInstanceLock) {
  // Second instance exits above; remainder only for primary.
} else {
  app.whenReady().then(async () => {
    try {
      log('=== Electron starting (primary instance) ===');
      await startServer();
      log('Backend ready — creating BrowserWindow…');
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

  app.on('will-quit', () => {
    stopServer();
  });
}
