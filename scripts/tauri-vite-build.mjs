import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const launcher = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src-tauri/build-frontend.mjs',
);

const child = spawn(process.execPath, [launcher], {
  stdio: 'inherit',
  shell: false,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
