import { exec, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import pc from 'picocolors';

const PORT = Number(process.env.SMOKE_PORT || process.env.PORT || 3001);
const API_URL = process.env.API_URL || `http://localhost:${PORT}/api`;
const HEALTH_URL = `${API_URL}/health`;
const DEBUG_ENDPOINT = 'http://127.0.0.1:7926/ingest/67d2b135-3c0f-4cbe-ad30-af1a135feb8a';
const DEBUG_SESSION_ID = '316f21';

function sendDebugLog({ runId, hypothesisId, location, message, data }) {
  fetch(DEBUG_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': DEBUG_SESSION_ID,
    },
    body: JSON.stringify({
      sessionId: DEBUG_SESSION_ID,
      runId,
      hypothesisId,
      location,
      message,
      data: data ?? {},
      timestamp: Date.now(),
    }),
  }).catch(() => {});
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function execCommand(command, options = {}) {
  return new Promise((resolve) => {
    const child = exec(
      command,
      { windowsHide: true, maxBuffer: 1024 * 1024 * 10, ...options },
      (error, stdout, stderr) => {
        resolve({
          code: error?.code ?? 0,
          stdout: stdout ?? '',
          stderr: stderr ?? '',
          error: error ?? null,
        });
      }
    );

    if (options.stdio === 'inherit') {
      child.stdout?.pipe(process.stdout);
      child.stderr?.pipe(process.stderr);
    }
  });
}

async function isHealthy() {
  try {
    const res = await fetch(HEALTH_URL);
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForHealth(timeoutMs = 15000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (await isHealthy()) return true;
    await sleep(500);
  }

  throw new Error(`Backend did not become healthy within ${timeoutMs}ms: ${HEALTH_URL}`);
}

async function getPidsByPort(port) {
  const cmd = `powershell -NoProfile -Command "$connections = Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue; if ($connections) { $connections | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique }"`;
  const result = await execCommand(cmd);

  if (!result.stdout.trim()) {
    return [];
  }

  const pids = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^\d+$/.test(line))
    .map((line) => Number(line));

  // #region agent log
  sendDebugLog({
    runId: 'smoke-up',
    hypothesisId: 'H3',
    location: 'scripts/smoke-runner.mjs:getPidsByPort',
    message: 'Resolved listening PIDs for port',
    data: { port, pids },
  });
  // #endregion

  return pids;
}

async function killPid(pid) {
  const cmd = `powershell -NoProfile -Command "Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue"`;
  const result = await execCommand(cmd);
  return result.code === 0;
}

async function killProcessesOnPort(port, reason = 'Cleaning port') {
  const pids = await getPidsByPort(port);

  if (pids.length === 0) {
    return [];
  }

  console.log(pc.yellow(`\n⚠ ${reason}: found process(es) on port ${port}: ${pids.join(', ')}`));

  const killed = [];
  for (const pid of pids) {
    const ok = await killPid(pid);
    if (ok) {
      killed.push(pid);
      console.log(pc.yellow(`⚠ Killed PID ${pid} on port ${port}`));
    } else {
      console.log(pc.red(`✖ Failed to kill PID ${pid} on port ${port}`));
    }
  }

  await sleep(1000);
  return killed;
}

async function ensurePortIsFree(port, context = 'port cleanup') {
  await killProcessesOnPort(port, context);
  await sleep(500);

  const leftoverPids = await getPidsByPort(port);
  if (leftoverPids.length > 0) {
    throw new Error(`${context}: port ${port} is still occupied by PID(s): ${leftoverPids.join(', ')}`);
  }
}

async function stopBackendProcess(proc) {
  if (!proc) return;
  if (proc.exitCode !== null) return;

  // #region agent log
  sendDebugLog({
    runId: 'smoke-up',
    hypothesisId: 'H1',
    location: 'scripts/smoke-runner.mjs:stopBackendProcess:beforeSIGTERM',
    message: 'Sending SIGTERM to backend process handle',
    data: { pid: proc.pid, exitCode: proc.exitCode, killed: proc.killed },
  });
  // #endregion

  proc.kill('SIGTERM');
  await sleep(1500);

  // #region agent log
  sendDebugLog({
    runId: 'smoke-up',
    hypothesisId: 'H2',
    location: 'scripts/smoke-runner.mjs:stopBackendProcess:afterWait',
    message: 'Post-SIGTERM wait status',
    data: { pid: proc.pid, exitCode: proc.exitCode, killed: proc.killed },
  });
  // #endregion

  if (proc.exitCode === null) {
    console.log(pc.yellow('⚠ Backend did not stop after SIGTERM, forcing...'));
    // #region agent log
    sendDebugLog({
      runId: 'smoke-up',
      hypothesisId: 'H1',
      location: 'scripts/smoke-runner.mjs:stopBackendProcess:forceSIGKILL',
      message: 'Escalating to SIGKILL',
      data: { pid: proc.pid, exitCode: proc.exitCode, killed: proc.killed },
    });
    // #endregion
    proc.kill('SIGKILL');
    await sleep(1000);
  }
}

async function main() {
  let backendProcess = null;

  try {
    console.log(pc.cyan('\n▶ Building shared'));
    const buildResult = await execCommand('npm run build:shared', { stdio: 'inherit' });
    if (buildResult.code !== 0) {
      process.exit(buildResult.code);
    }

    console.log(pc.cyan(`\n▶ Cleaning port ${PORT}`));
    await ensurePortIsFree(PORT, 'pre-run port cleanup');

    console.log(pc.cyan('\n▶ Starting backend'));
    const backendCwd = path.resolve(process.cwd(), 'backend');
    const tsxCliCandidates = [
      path.resolve(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs'),
      path.resolve(backendCwd, 'node_modules', 'tsx', 'dist', 'cli.mjs'),
    ];
    const tsxCli = tsxCliCandidates.find((candidate) => fs.existsSync(candidate));
    if (!tsxCli) {
      throw new Error(`tsx CLI not found. Checked:\n- ${tsxCliCandidates.join('\n- ')}`);
    }
    backendProcess = spawn(process.execPath, [tsxCli, 'src/index.ts'], {
      cwd: backendCwd,
      stdio: 'inherit',
      shell: false,
      detached: false,
    });

    // #region agent log
    sendDebugLog({
      runId: 'smoke-up',
      hypothesisId: 'H1',
      location: 'scripts/smoke-runner.mjs:main:spawnBackend',
      message: 'Spawned backend process via npm',
      data: {
        pid: backendProcess.pid,
        spawnfile: backendProcess.spawnfile,
        shell: false,
        detached: false,
      },
    });
    // #endregion

    backendProcess.on('error', (err) => {
      console.error(pc.red(`✖ Backend process error: ${err.message}`));
    });

    console.log(pc.cyan(`\n▶ Waiting for health: ${HEALTH_URL}`));
    await waitForHealth();
    console.log(pc.green('✔ Backend is healthy'));

    console.log(pc.cyan('\n▶ Running smoke'));
    const smokeResult = await execCommand('npm run smoke', { stdio: 'inherit' });

    console.log(pc.cyan('\n▶ Stopping backend'));
    await stopBackendProcess(backendProcess);

    console.log(pc.cyan(`\n▶ Final port cleanup ${PORT}`));
    await ensurePortIsFree(PORT, 'post-run port cleanup');

    process.exit(smokeResult.code);
  } catch (err) {
    console.error(pc.red(`\n✖ ${err instanceof Error ? err.message : String(err)}`));

    if (backendProcess) {
      console.log(pc.cyan('\n▶ Stopping backend after failure'));
      await stopBackendProcess(backendProcess);
    }

    try {
      console.log(pc.cyan(`\n▶ Failure cleanup for port ${PORT}`));
      await ensurePortIsFree(PORT, 'failure port cleanup');
    } catch (cleanupErr) {
      console.error(
        pc.red(
          `✖ Cleanup error: ${cleanupErr instanceof Error ? cleanupErr.message : String(cleanupErr)}`
        )
      );
    }

    process.exit(1);
  }
}

main();