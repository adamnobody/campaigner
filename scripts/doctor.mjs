#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const issues = [];
const notes = [];

function exists(p) {
  try {
    fs.accessSync(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function run(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' }).trim();
}

function line(prefix, msg) {
  console.log(`${prefix} ${msg}`);
}

function ok(msg) {
  line('[OK]', msg);
}

function warn(msg) {
  line('[WARN]', msg);
  issues.push({ level: 'warn', msg });
}

function info(msg) {
  line('[INFO]', msg);
}

function section(title) {
  console.log(`\n=== ${title} ===`);
}

function tryRun(label, fn) {
  try {
    return fn();
  } catch (e) {
    warn(`${label}: ${e?.message ?? String(e)}`);
    return null;
  }
}

section('Environment');
info(`cwd: ${root}`);
ok(`node: ${process.version}`);
const npmV = tryRun('npm version', () => run('npm -v'));
if (npmV) ok(`npm: v${npmV}`);

section('Repo root sanity');
const rootPkgPath = path.join(root, 'package.json');
if (!exists(rootPkgPath)) {
  warn('No package.json in current directory. Run doctor from repo root.');
} else {
  ok('package.json found in repo root');
}

let rootPkg = null;
if (exists(rootPkgPath)) {
  rootPkg = tryRun('parse root package.json', () => readJson(rootPkgPath));
}

const hasAppsLayout =
  exists(path.join(root, 'apps', 'frontend')) &&
  exists(path.join(root, 'apps', 'backend')) &&
  exists(path.join(root, 'apps', 'frontend', 'package.json')) &&
  exists(path.join(root, 'apps', 'backend', 'package.json'));

const hasFlatLayout =
  exists(path.join(root, 'frontend')) &&
  exists(path.join(root, 'backend')) &&
  exists(path.join(root, 'frontend', 'package.json')) &&
  exists(path.join(root, 'backend', 'package.json'));

section('Layout detection');
if (hasAppsLayout) {
  ok('Detected layout: monorepo (apps/frontend + apps/backend)');
} else if (hasFlatLayout) {
  ok('Detected layout: flat (frontend + backend)');
  notes.push('This repo seems to be a non-workspaces layout. Use: cd frontend && npm i && npm run dev (same for backend).');
} else {
  warn('Could not detect a known layout (neither apps/* nor flat frontend/backend with package.json).');
}

section('Workspaces (only if monorepo layout)');
if (hasAppsLayout) {
  const ws = rootPkg?.workspaces;
  if (!ws) {
    warn('Root "workspaces" field is missing. npm -w commands may not work.');
  } else {
    ok('workspaces field exists in root package.json');
  }

  if (rootPkg && rootPkg.private !== true) {
    warn('Root package.json "private" is not true. npm workspaces usually expect private: true.');
  } else if (rootPkg) {
    ok('root private: true');
  }

  // Check npm sees workspaces
  tryRun('npm ls --workspaces', () => {
    run('npm ls --workspaces --depth=0');
    ok('npm sees workspaces');
  });
} else {
  info('Skipping workspace checks (not a monorepo apps/* layout).');
}

section('Dependencies / binaries');

function checkBinInWorkspace(bin, workspacePath) {
  // workspacePath: "apps/frontend" or "frontend"
  const wsFlag = hasAppsLayout ? `-w ${workspacePath}` : '';
  const label = hasAppsLayout ? `workspace ${workspacePath}` : workspacePath;

  try {
    run(`npm exec ${wsFlag} -- ${bin} --version`);
    ok(`${bin} available (${label})`);
  } catch {
    warn(`${bin} not found (${label}). Likely you need to run npm install for that package.`);
  }
}

if (hasAppsLayout) {
  checkBinInWorkspace('vite', 'apps/frontend');
  checkBinInWorkspace('tsx', 'apps/backend');
} else if (hasFlatLayout) {
  // В flat-структуре npm exec без -w будет искать в root,
  // поэтому аккуратнее: просто проверяем, что внутри папок есть node_modules/.bin,
  // а если нет — подсказываем. (Не запускаем команды, чтобы не требовать установки.)
  const feBin = path.join(root, 'frontend', 'node_modules', '.bin');
  const beBin = path.join(root, 'backend', 'node_modules', '.bin');

  if (exists(feBin)) ok('frontend node_modules/.bin present');
  else warn('frontend node_modules not installed (run: cd frontend && npm install)');

  if (exists(beBin)) ok('backend node_modules/.bin present');
  else warn('backend node_modules not installed (run: cd backend && npm install)');
} else {
  info('Skipping binary checks (unknown layout).');
}

section('Lockfile');
const lockPath = path.join(root, 'package-lock.json');
if (exists(lockPath)) ok('package-lock.json found');
else warn('package-lock.json not found (installs may be less reproducible)');

section('Summary');
if (issues.length === 0) {
  ok('No issues detected');
} else {
  info(`Issues: ${issues.length}`);
  for (const it of issues) {
    line(' -', it.msg);
  }
}

if (notes.length) {
  console.log('\nHints:');
  for (const n of notes) line(' *', n);
}

// Никогда не падаем — всегда exit code 0
process.exitCode = 0;
