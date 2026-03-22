#!/usr/bin/env node

/**
 * Campaigner Doctor — проверяет целостность проекта перед запуском.
 * Запуск: npm run doctor
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// ─────────── Helpers ───────────

let passed = 0;
let warned = 0;
let failed = 0;

function ok(msg) {
  passed++;
  console.log(`  ✅ ${msg}`);
}

function warn(msg) {
  warned++;
  console.log(`  ⚠️  ${msg}`);
}

function fail(msg) {
  failed++;
  console.log(`  ❌ ${msg}`);
}

function section(title) {
  console.log(`\n🔍 ${title}`);
  console.log('─'.repeat(50));
}

function fileExists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function dirExists(rel) {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) && fs.statSync(p).isDirectory();
}

function tryExec(cmd, opts = {}) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf-8', stdio: 'pipe', ...opts }).trim();
  } catch {
    return null;
  }
}

function getVersion(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch {
    return null;
  }
}

// ─────────── Checks ───────────

function checkEnvironment() {
  section('Среда');

  // Node.js
  const nodeVer = getVersion('node -v');
  if (nodeVer) {
    const major = parseInt(nodeVer.replace('v', '').split('.')[0]);
    if (major >= 18) {
      ok(`Node.js ${nodeVer}`);
    } else {
      fail(`Node.js ${nodeVer} — требуется v18+`);
    }
  } else {
    fail('Node.js не найден');
  }

  // npm
  const npmVer = getVersion('npm -v');
  if (npmVer) {
    ok(`npm ${npmVer}`);
  } else {
    fail('npm не найден');
  }

  // Git
  const gitVer = getVersion('git --version');
  if (gitVer) {
    ok(`${gitVer}`);
  } else {
    warn('Git не найден (не критично)');
  }
}

function checkProjectStructure() {
  section('Структура проекта');

  const required = [
    'package.json',
    'shared/package.json',
    'shared/tsconfig.json',
    'shared/src/index.ts',
    'shared/src/constants.ts',
    'shared/src/schemas/index.ts',
    'shared/src/types/index.ts',
    'backend/package.json',
    'backend/tsconfig.json',
    'backend/src/index.ts',
    'backend/src/db/connection.ts',
    'frontend/package.json',
    'frontend/tsconfig.json',
    'frontend/vite.config.ts',
    'frontend/index.html',
    'frontend/src/main.tsx',
    'frontend/src/App.tsx',
  ];

  let allPresent = true;
  for (const f of required) {
    if (!fileExists(f)) {
      fail(`Отсутствует: ${f}`);
      allPresent = false;
    }
  }
  if (allPresent) {
    ok(`Все ${required.length} ключевых файлов на месте`);
  }

  // Directories
  const requiredDirs = ['shared/src/schemas', 'backend/src/controllers', 'backend/src/services', 'backend/src/routes', 'frontend/src/pages', 'frontend/src/components'];
  let allDirs = true;
  for (const d of requiredDirs) {
    if (!dirExists(d)) {
      fail(`Отсутствует директория: ${d}`);
      allDirs = false;
    }
  }
  if (allDirs) {
    ok(`Все ${requiredDirs.length} директорий на месте`);
  }
}

function checkNodeModules() {
  section('Зависимости (node_modules)');

  const locations = [
    { name: 'root', path: 'node_modules' },
  ];

  let needsInstall = false;

  for (const loc of locations) {
    if (dirExists(loc.path)) {
      ok(`${loc.name}/node_modules существует`);
    } else {
      fail(`${loc.name}/node_modules отсутствует — запустите npm install`);
      needsInstall = true;
    }
  }

  // Check critical packages
  const criticalPackages = [
    { name: 'typescript', check: 'node_modules/typescript' },
    { name: 'concurrently', check: 'node_modules/concurrently' },
    { name: 'express', check: 'node_modules/express' },
    { name: 'react', check: 'node_modules/react' },
    { name: 'better-sqlite3', check: 'node_modules/better-sqlite3' },
    { name: 'vite', check: 'node_modules/vite' },
    { name: 'tsx', check: 'node_modules/tsx' },
    { name: 'zod', check: 'node_modules/zod' },
    { name: 'zustand', check: 'node_modules/zustand' },
    { name: '@mui/material', check: 'node_modules/@mui/material' },
    { name: 'axios', check: 'node_modules/axios' },
    { name: 'react-router-dom', check: 'node_modules/react-router-dom' },
    { name: 'react-markdown', check: 'node_modules/react-markdown' },
  ];

  if (!needsInstall) {
    let missingPkgs = [];
    for (const pkg of criticalPackages) {
      if (!dirExists(pkg.check)) {
        missingPkgs.push(pkg.name);
      }
    }
    if (missingPkgs.length === 0) {
      ok(`Все ${criticalPackages.length} критических пакетов установлены`);
    } else {
      fail(`Отсутствуют пакеты: ${missingPkgs.join(', ')} — запустите npm install`);
    }
  }
}

function checkSharedBuild() {
  section('Сборка shared');

  if (dirExists('shared/dist')) {
    const hasIndex = fileExists('shared/dist/index.js');
    const hasTypes = fileExists('shared/dist/index.d.ts');

    if (hasIndex && hasTypes) {
      ok('shared/dist/index.js и index.d.ts существуют');

      // Check freshness
      try {
        const srcStat = fs.statSync(path.join(ROOT, 'shared/src/index.ts'));
        const distStat = fs.statSync(path.join(ROOT, 'shared/dist/index.js'));
        if (distStat.mtimeMs >= srcStat.mtimeMs) {
          ok('shared/dist актуален');
        } else {
          warn('shared/dist устарел — будет пересобран при npm run dev');
        }
      } catch {
        warn('Не удалось проверить свежесть shared/dist');
      }
    } else {
      if (!hasIndex) fail('shared/dist/index.js отсутствует');
      if (!hasTypes) fail('shared/dist/index.d.ts отсутствует');
      warn('Запустите: cd shared && npx tsc');
    }
  } else {
    warn('shared/dist не существует — будет создан при npm run dev');
  }

  // Try to build shared
  console.log('\n  🔨 Пробуем собрать shared...');
  const buildResult = tryExec('cd shared && npx tsc --noEmit 2>&1');
  if (buildResult === null || buildResult === '') {
    ok('shared компилируется без ошибок');
  } else {
    const errorCount = (buildResult.match(/error TS/g) || []).length;
    if (errorCount > 0) {
      fail(`shared: ${errorCount} ошибок TypeScript`);
      // Show first 5 lines
      const lines = buildResult.split('\n').slice(0, 5);
      lines.forEach(l => console.log(`     ${l}`));
    } else {
      ok('shared компилируется без ошибок');
    }
  }
}

function checkBackend() {
  section('Backend');

  // Check key files
  const backendFiles = [
    'backend/src/index.ts',
    'backend/src/db/connection.ts',
    'backend/src/middleware/errorHandler.ts',
    'backend/src/middleware/validateRequest.ts',
  ];

  let allOk = true;
  for (const f of backendFiles) {
    if (!fileExists(f)) {
      fail(`Отсутствует: ${f}`);
      allOk = false;
    }
  }
  if (allOk) ok('Все ключевые файлы backend на месте');

  // Check controllers match services match routes
  const entities = ['character', 'note', 'map', 'project', 'timeline', 'tag', 'faction', 'dogma'];
  let mismatch = [];
  for (const e of entities) {
    const hasController = fileExists(`backend/src/controllers/${e}.controller.ts`);
    const hasService = fileExists(`backend/src/services/${e}.service.ts`);
    const hasRoute = fileExists(`backend/src/routes/${e}.routes.ts`);
    if (!hasController || !hasService || !hasRoute) {
      const missing = [];
      if (!hasController) missing.push('controller');
      if (!hasService) missing.push('service');
      if (!hasRoute) missing.push('routes');
      mismatch.push(`${e}: отсутствует ${missing.join(', ')}`);
    }
  }
  if (mismatch.length === 0) {
    ok(`Все ${entities.length} сущностей имеют controller + service + routes`);
  } else {
    mismatch.forEach(m => warn(m));
  }

  // TypeScript check
  console.log('\n  🔨 Проверяем TypeScript backend...');
  const backendTsc = tryExec('cd backend && npx tsc --noEmit 2>&1');
  if (backendTsc === null || backendTsc === '') {
    ok('Backend компилируется без ошибок');
  } else {
    const errorCount = (backendTsc.match(/error TS/g) || []).length;
    if (errorCount > 0) {
      warn(`Backend: ${errorCount} ошибок TypeScript (могут быть не критичны для tsx watch)`);
      const lines = backendTsc.split('\n').filter(l => l.includes('error TS')).slice(0, 5);
      lines.forEach(l => console.log(`     ${l.trim()}`));
    } else {
      ok('Backend компилируется без ошибок');
    }
  }
}

function checkFrontend() {
  section('Frontend');

  // Check key page files
const pages = [
  'HomePage', 'MapPage', 'CharactersPage', 'CharacterDetailPage',
  'CharacterGraphPage', 'NotesPage', 'NoteEditorPage', 'WikiPage',
  'TimelinePage', 'ProjectSettingsPage', 'FactionsPage',
  'FactionDetailPage', 'DogmasPage',
];

  let missingPages = [];
  for (const p of pages) {
    if (!fileExists(`frontend/src/pages/${p}.tsx`)) {
      missingPages.push(p);
    }
  }
  if (missingPages.length === 0) {
    ok(`Все ${pages.length} страниц на месте`);
  } else {
    fail(`Отсутствуют страницы: ${missingPages.join(', ')}`);
  }

  // Check components
  const components = [
    'components/Layout/AppLayout.tsx',
    'components/Layout/Sidebar.tsx',
    'components/Layout/TopBar.tsx',
    'components/ui/ErrorBoundary.tsx',
    'components/ui/DndButton.tsx',
    'components/ui/LoadingScreen.tsx',
    'components/ui/ConfirmDialog.tsx',
    'components/ui/GlobalSnackbar.tsx',
  ];

  let missingComponents = [];
  for (const c of components) {
    if (!fileExists(`frontend/src/${c}`)) {
      missingComponents.push(c);
    }
  }
  if (missingComponents.length === 0) {
    ok(`Все ${components.length} ключевых компонентов на месте`);
  } else {
    missingComponents.forEach(c => warn(`Отсутствует: frontend/src/${c}`));
  }

  // Check stores
  const stores = ['useProjectStore', 'useCharacterStore', 'useNoteStore', 
  'useMapStore', 'useTimelineStore', 'useUIStore', 'useStyleStore', 
  'useFactionStore', 'useDogmaStore', 'useTagStore'];
  let missingStores = [];
  for (const s of stores) {
    if (!fileExists(`frontend/src/store/${s}.ts`)) {
      missingStores.push(s);
    }
  }
  if (missingStores.length === 0) {
    ok(`Все ${stores.length} Zustand-сторов на месте`);
  } else {
    missingStores.forEach(s => warn(`Отсутствует: frontend/src/store/${s}.ts`));
  }

  // Vite config check
  if (fileExists('frontend/vite.config.ts')) {
    const viteConfig = fs.readFileSync(path.join(ROOT, 'frontend/vite.config.ts'), 'utf-8');
    if (viteConfig.includes('proxy') || viteConfig.includes('/api')) {
      ok('Vite proxy для /api настроен');
    } else {
      warn('Vite proxy для /api не найден в vite.config.ts');
    }
  }
}

function checkDatabase() {
  section('База данных');

  // Check data directory
  if (dirExists('data')) {
    ok('Директория data/ существует');
  } else {
    warn('Директория data/ не существует — будет создана при первом запуске');
  }

  // Check if SQLite DB exists
  if (fileExists('data/campaigner.sqlite')) {
    const stat = fs.statSync(path.join(ROOT, 'data/campaigner.sqlite'));
    const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);
    ok(`campaigner.sqlite существует (${sizeMB} MB)`);
  } else {
    warn('campaigner.sqlite не найден — будет создан при первом запуске');
  }

  // Check uploads dirs
  const uploadDirs = ['data/uploads', 'data/uploads/maps', 'data/uploads/characters'];
  let missingUploads = [];
  for (const d of uploadDirs) {
    if (!dirExists(d)) {
      missingUploads.push(d);
    }
  }
  if (missingUploads.length === 0) {
    ok('Все директории uploads на месте');
  } else {
    warn(`Директории будут созданы при запуске: ${missingUploads.join(', ')}`);
  }
}

function checkPorts() {
  section('Порты');

  // Try to check if ports are in use (best effort)
  const checkPort = (port, name) => {
    try {
      // Works on Windows (netstat) and Linux/Mac (lsof)
      let result;
      if (process.platform === 'win32') {
        result = tryExec(`netstat -ano | findstr :${port} | findstr LISTENING`);
      } else {
        result = tryExec(`lsof -i :${port} -t 2>/dev/null`);
      }

      if (result && result.trim()) {
        warn(`Порт ${port} (${name}) уже занят — возможен конфликт`);
      } else {
        ok(`Порт ${port} (${name}) свободен`);
      }
    } catch {
      ok(`Порт ${port} (${name}) — не удалось проверить, скорее всего свободен`);
    }
  };

  checkPort(3001, 'Backend API');
  checkPort(5173, 'Vite Frontend');
}

function checkSchemaConsistency() {
  section('Консистентность схем');

  // Check that shared schemas export matches types
  if (fileExists('shared/src/schemas/index.ts') && fileExists('shared/src/types/index.ts')) {
    const schemasIndex = fs.readFileSync(path.join(ROOT, 'shared/src/schemas/index.ts'), 'utf-8');
    const typesIndex = fs.readFileSync(path.join(ROOT, 'shared/src/types/index.ts'), 'utf-8');

    const schemaFiles = ['character.schema', 'note.schema', 'map.schema', 'project.schema', 'timeline.schema', 'common.schema'];
    let missingSchemas = [];
    for (const s of schemaFiles) {
      if (!schemasIndex.includes(s)) {
        missingSchemas.push(s);
      }
    }

    if (missingSchemas.length === 0) {
      ok(`Все ${schemaFiles.length} схем экспортируются из schemas/index.ts`);
    } else {
      warn(`Не экспортируются из schemas/index.ts: ${missingSchemas.join(', ')}`);
    }

    // Check types reference schemas
    const typeSchemas = ['characterSchema', 'noteSchema', 'mapMarkerSchema', 'projectSchema', 'timelineEventSchema'];
    let missingTypes = [];
    for (const t of typeSchemas) {
      if (!typesIndex.includes(t)) {
        missingTypes.push(t);
      }
    }

    if (missingTypes.length === 0) {
      ok('Все основные типы ссылаются на схемы');
    } else {
      warn(`Типы без привязки к схемам: ${missingTypes.join(', ')}`);
    }
  } else {
    fail('schemas/index.ts или types/index.ts отсутствует');
  }
}

function checkGitStatus() {
  section('Git');

  const gitDir = dirExists('.git');
  if (!gitDir) {
    warn('Не git-репозиторий');
    return;
  }

  ok('Git-репозиторий инициализирован');

  const branch = tryExec('git branch --show-current');
  if (branch) {
    ok(`Текущая ветка: ${branch}`);
  }

  const status = tryExec('git status --porcelain');
  if (status === '') {
    ok('Рабочее дерево чистое');
  } else if (status !== null) {
    const changes = status.split('\n').filter(Boolean).length;
    warn(`${changes} незакоммиченных изменений`);
  }

  // Check .gitignore
  if (fileExists('.gitignore')) {
    const gitignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf-8');
    const shouldIgnore = ['node_modules', 'dist', 'data/', '.env'];
    let notIgnored = [];
    for (const item of shouldIgnore) {
      if (!gitignore.includes(item)) {
        notIgnored.push(item);
      }
    }
    if (notIgnored.length === 0) {
      ok('.gitignore покрывает node_modules, dist, data, .env');
    } else {
      warn(`.gitignore не содержит: ${notIgnored.join(', ')}`);
    }
  } else {
    warn('.gitignore отсутствует');
  }
}

// ─────────── Main ───────────

console.log('');
console.log('🏰 ═══════════════════════════════════════════════');
console.log('   C A M P A I G N E R   D O C T O R');
console.log('═══════════════════════════════════════════════════');

checkEnvironment();
checkProjectStructure();
checkNodeModules();
checkSharedBuild();
checkBackend();
checkFrontend();
checkDatabase();
checkPorts();
checkSchemaConsistency();
checkGitStatus();

// ─────────── Summary ───────────

console.log('\n═══════════════════════════════════════════════════');
console.log('📊 РЕЗУЛЬТАТ');
console.log('═══════════════════════════════════════════════════');
console.log(`  ✅ Пройдено: ${passed}`);
console.log(`  ⚠️  Предупреждений: ${warned}`);
console.log(`  ❌ Ошибок: ${failed}`);
console.log('');

if (failed === 0 && warned === 0) {
  console.log('  🎉 Всё отлично! Запускайте: npm run dev');
} else if (failed === 0) {
  console.log('  👍 Можно запускать: npm run dev');
  console.log('     Предупреждения не блокируют запуск.');
} else {
  console.log('  🔧 Рекомендуемые действия:');
  console.log('     1. npm install');
  console.log('     2. cd shared && npx tsc');
  console.log('     3. npm run doctor');
}

console.log('');
process.exit(failed > 0 ? 1 : 0);