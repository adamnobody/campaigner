/**
 * Downloads portable Node.js (Windows x64) into build/node-runtime/win-x64
 * so Electron can spawn backend under a normal Node ABI (better-sqlite3).
 *
 * Version: package.json fields `campaignerElectron.nodeRuntimeVersion` or `engines.node` (semver range → best-effort default).
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'build', 'node-runtime', 'win-x64');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

function pickVersion() {
  const pinned = PKG.campaignerElectron?.nodeRuntimeVersion;
  if (pinned && /^\d+\.\d+\.\d+$/.test(pinned)) return pinned;
  console.warn('[prepare-node-runtime] Set package.json "campaignerElectron.nodeRuntimeVersion" for reproducible builds; using 22.14.0');
  return '22.14.0';
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          file.close();
          fs.unlinkSync(dest);
          return download(res.headers.location, dest).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlinkSync(dest);
          return reject(new Error(`GET ${url} → ${res.statusCode}`));
        }
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      })
      .on('error', (err) => {
        try {
          file.close();
          fs.unlinkSync(dest);
        } catch (_) {}
        reject(err);
      });
  });
}

function extractZipWindows(zipPath, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  const ps = [
    '-NoProfile',
    '-Command',
    `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force`,
  ];
  execFileSync('powershell.exe', ps, { stdio: 'inherit' });
}

function flattenNodeFolder(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  if (entries.length === 1 && entries[0].isDirectory() && entries[0].name.startsWith('node-v')) {
    const nested = path.join(dir, entries[0].name);
    for (const name of fs.readdirSync(nested)) {
      fs.renameSync(path.join(nested, name), path.join(dir, name));
    }
    fs.rmdirSync(nested);
  }
}

async function main() {
  if (process.platform !== 'win32') {
    console.log('[prepare-node-runtime] Skipping portable Node download (non-Windows).');
    return;
  }

  const version = pickVersion();
  const baseName = `node-v${version}-win-x64`;
  const zipName = `${baseName}.zip`;
  const url = `https://nodejs.org/dist/v${version}/${zipName}`;
  const tmpZip = path.join(ROOT, 'build', '_node_download', zipName);

  fs.mkdirSync(path.dirname(tmpZip), { recursive: true });
  const extractDir = path.join(ROOT, 'build', '_node_extract');

  console.log(`[prepare-node-runtime] Node ${version} from ${url}`);

  if (fs.existsSync(path.join(OUT_DIR, 'node.exe'))) {
    console.log('[prepare-node-runtime] Already exists:', path.join(OUT_DIR, 'node.exe'));
    return;
  }

  await download(url, tmpZip);
  fs.rmSync(extractDir, { recursive: true, force: true });
  fs.mkdirSync(extractDir, { recursive: true });
  extractZipWindows(tmpZip, extractDir);
  flattenNodeFolder(extractDir);

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(OUT_DIR), { recursive: true });
  fs.renameSync(extractDir, OUT_DIR);

  try {
    fs.unlinkSync(tmpZip);
  } catch (_) {}

  if (!fs.existsSync(path.join(OUT_DIR, 'node.exe'))) {
    throw new Error(`node.exe not found under ${OUT_DIR} after extraction`);
  }
  console.log('[prepare-node-runtime] OK →', path.join(OUT_DIR, 'node.exe'));
}

main().catch((e) => {
  console.error('[prepare-node-runtime] FAILED:', e.message);
  process.exit(1);
});
