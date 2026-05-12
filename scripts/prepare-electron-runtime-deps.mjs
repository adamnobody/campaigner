/**
 * Installs production-only npm dependencies needed to run packaged backend/dist
 * under bundled Node.js (minimal tree — not the whole monorepo node_modules).
 *
 * Output: build/electron-runtime/node_modules (see package.json electron-builder extraResources).
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RUNTIME_DIR = path.join(ROOT, 'build', 'electron-runtime');

function main() {
  const backendPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'backend', 'package.json'), 'utf8'));
  const deps = backendPkg.dependencies && typeof backendPkg.dependencies === 'object' ? { ...backendPkg.dependencies } : null;

  if (!deps || Object.keys(deps).length === 0) {
    console.error('[prepare-electron-runtime-deps] backend/package.json has no dependencies');
    process.exit(1);
  }

  deps['@campaigner/shared'] = 'file:../../shared';

  const runtimePkg = {
    name: 'campaigner-electron-runtime',
    private: true,
    version: '1.0.0',
    description:
      'Generated production node_modules subtree for Electron-packaged backend (do not publish).',
    dependencies: deps,
  };

  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  fs.writeFileSync(path.join(RUNTIME_DIR, 'package.json'), `${JSON.stringify(runtimePkg, null, 2)}\n`);

  const nodeModulesDir = path.join(RUNTIME_DIR, 'node_modules');
  const lockPath = path.join(RUNTIME_DIR, 'package-lock.json');
  if (fs.existsSync(nodeModulesDir)) fs.rmSync(nodeModulesDir, { recursive: true, force: true });
  if (fs.existsSync(lockPath)) fs.rmSync(lockPath, { force: true });

  console.log('[prepare-electron-runtime-deps] npm install --omit=dev →', RUNTIME_DIR);
  const r = spawnSync(
    'npm',
    ['install', '--omit=dev', '--no-audit', '--no-fund', '--loglevel', 'error'],
    { cwd: RUNTIME_DIR, stdio: 'inherit', shell: true }
  );
  if (r.status !== 0) {
    console.error('[prepare-electron-runtime-deps] npm install exited', r.status);
    process.exit(r.status ?? 1);
  }
  console.log('[prepare-electron-runtime-deps] OK');
}

main();
