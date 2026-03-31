import { spawn } from 'child_process';
import pc from 'picocolors';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const HEALTH_URL = `${API_URL}/health`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options,
    });

    child.on('error', reject);
    child.on('exit', (code) => resolve(code ?? 0));
  });
}

async function stopProcess(proc, label = 'process') {
  if (!proc || proc.killed) return;

  proc.kill('SIGTERM');
  await sleep(1500);

  if (!proc.killed) {
    console.log(pc.yellow(`⚠ ${label} did not stop after SIGTERM, forcing...`));
    proc.kill('SIGKILL');
    await sleep(500);
  }
}

async function main() {
  let backendProcess = null;
  let startedByRunner = false;

  try {
    console.log(pc.cyan('\n▶ Building shared'));
    const buildCode = await runCommand('npm', ['run', 'build:shared']);
    if (buildCode !== 0) {
      process.exit(buildCode);
    }

    const alreadyRunning = await isHealthy();

    if (alreadyRunning) {
      console.log(pc.yellow(`\n⚠ Backend already running at ${HEALTH_URL}; reusing existing server`));
    } else {
      console.log(pc.cyan('\n▶ Starting backend'));
      backendProcess = spawn('npm', ['run', 'backend:start:once'], {
        stdio: 'inherit',
        shell: true,
        detached: false,
      });

      startedByRunner = true;

      backendProcess.on('error', (err) => {
        console.error(pc.red(`✖ Backend process error: ${err.message}`));
      });

      console.log(pc.cyan(`\n▶ Waiting for health: ${HEALTH_URL}`));
      await waitForHealth();
      console.log(pc.green('✔ Backend is healthy'));
    }

    console.log(pc.cyan('\n▶ Running smoke'));
    const smokeCode = await runCommand('npm', ['run', 'smoke']);

    if (startedByRunner) {
      console.log(pc.cyan('\n▶ Stopping backend'));
      await stopProcess(backendProcess, 'backend');
    } else {
      console.log(pc.dim('\n• Backend was not started by runner, leaving it running'));
    }

    process.exit(smokeCode);
  } catch (err) {
    console.error(pc.red(`\n✖ ${err instanceof Error ? err.message : String(err)}`));

    if (startedByRunner && backendProcess) {
      console.log(pc.cyan('\n▶ Stopping backend after failure'));
      await stopProcess(backendProcess, 'backend');
    }

    process.exit(1);
  }
}

main();