/**
 * Rebuild better-sqlite3 with the bundled Windows portable Node.js (matches packaged runtime ABI).
 * Do not run electron-rebuild for backend native deps when backend uses bundled Node.
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function bundledNodeExe() {
  return path.join(ROOT, 'build', 'node-runtime', 'win-x64', 'node.exe');
}

function main() {
  if (process.platform !== 'win32') {
    console.log(
      '[rebuild-backend-native] Skipping (Windows-only bundled Node path in repo). Use system node + npm rebuild on Unix if needed.'
    );
    return;
  }

  const node = bundledNodeExe();
  if (!fs.existsSync(node)) {
    console.error('[rebuild-backend-native] Missing', node, '— run npm run electron:prepare-node first.');
    process.exit(1);
  }

  const nodeDir = path.dirname(node);
  const env = {
    ...process.env,
    PATH: `${nodeDir}${path.delimiter}${process.env.PATH || ''}`,
  };

  console.log('[rebuild-backend-native] npm rebuild with PATH node →', node);
  const r = spawnSync('npm', ['rebuild', 'better-sqlite3', '-w', '@campaigner/backend'], {
    cwd: ROOT,
    stdio: 'inherit',
    env,
    shell: true,
  });

  if (r.status !== 0) {
    console.error('[rebuild-backend-native] npm rebuild exited', r.status);
    process.exit(r.status ?? 1);
  }
  console.log('[rebuild-backend-native] OK');
}

main();
