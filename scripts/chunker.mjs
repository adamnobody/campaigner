/**
 * chunker.mjs — собирает исходники монорепо Campaigner в тематические .txt-чанки
 * для обзора/LLM. Запуск из корня: node scripts/chunker.mjs
 * Зависимости: только node:fs и node:path.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'chunks');

/** Каталоги при обходе не открываем (имя директории на текущем уровне). */
const EXCLUDED_DIR_NAMES = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'uploads',
  'public',
  'scripts',
  'chunks',
]);

const SKIP_EXTENSIONS = new Set([
  '.json',
  '.css',
  '.html',
  '.bat',
  '.md',
]);

const BINARY_LIKE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.ico',
  '.bmp',
  '.svg',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.pdf',
  '.zip',
  '.sqlite',
  '.lock',
]);

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

/** Имя выходного файла без пути. */
const CHUNK_OUTPUT = {
  shared: 'chunk_shared.txt',
  backend_db: 'chunk_backend_db.txt',
  backend_services: 'chunk_backend_services.txt',
  backend_api: 'chunk_backend_api.txt',
  backend_utils: 'chunk_backend_utils.txt',
  frontend_store: 'chunk_frontend_store.txt',
  frontend_api: 'chunk_frontend_api.txt',
  frontend_hooks: 'chunk_frontend_hooks.txt',
  frontend_theme: 'chunk_frontend_theme.txt',
  frontend_components_ui: 'chunk_frontend_components_ui.txt',
  frontend_pages_entities: 'chunk_frontend_pages_entities.txt',
  frontend_pages_visualization: 'chunk_frontend_pages_visualization.txt',
  frontend_pages_content: 'chunk_frontend_pages_content.txt',
  frontend_pages_system: 'chunk_frontend_pages_system.txt',
  frontend_entry: 'chunk_frontend_entry.txt',
  uncategorized: 'chunk_uncategorized.txt',
};

function toPosix(rel) {
  return rel.split(path.sep).join('/');
}

function isSourceFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!SOURCE_EXTENSIONS.has(ext)) return false;
  if (SKIP_EXTENSIONS.has(ext) || BINARY_LIKE_EXTENSIONS.has(ext)) return false;
  const base = path.basename(filePath);
  if (base === 'LICENSE' || base === 'license') return false;
  return true;
}

/**
 * @param {string} dir
 * @param {string} root
 * @param {string[]} out
 */
async function walkCollect(dir, root, out) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (EXCLUDED_DIR_NAMES.has(ent.name)) continue;
      await walkCollect(full, root, out);
    } else if (ent.isFile()) {
      if (!isSourceFile(full)) continue;
      out.push(full);
    }
  }
}

/**
 * @param {string} posixRel путь относительно корня репозитория, с /
 * @returns {keyof typeof CHUNK_OUTPUT | null}
 */
function assignChunk(posixRel) {
  // --- shared ---
  if (posixRel.startsWith('shared/src/')) return 'shared';

  // --- backend (порядок важен: db и services раньше общих правил) ---
  if (posixRel.startsWith('backend/src/db/')) return 'backend_db';
  if (posixRel.startsWith('backend/src/services/')) return 'backend_services';
  if (posixRel.startsWith('backend/src/controllers/')) return 'backend_api';
  if (posixRel.startsWith('backend/src/routes/')) return 'backend_api';
  if (posixRel.startsWith('backend/src/middleware/')) return 'backend_api';
  if (posixRel === 'backend/src/index.ts') return 'backend_api';
  if (posixRel.startsWith('backend/src/utils/')) return 'backend_utils';

  // --- frontend: не pages ---
  if (posixRel.startsWith('frontend/src/store/')) return 'frontend_store';
  if (posixRel.startsWith('frontend/src/api/')) return 'frontend_api';
  if (posixRel.startsWith('frontend/src/hooks/')) return 'frontend_hooks';
  if (posixRel.startsWith('frontend/src/theme/')) return 'frontend_theme';

  const compPrefixes = [
    'frontend/src/components/ui/',
    'frontend/src/components/detail/',
    'frontend/src/components/forms/',
    'frontend/src/components/Layout/',
    'frontend/src/components/onboarding/',
    'frontend/src/components/settings/',
  ];
  if (compPrefixes.some((p) => posixRel.startsWith(p))) return 'frontend_components_ui';

  // --- frontend: pages (порядок: узкие/визуализация → контент → система → сущности) ---
  if (posixRel.startsWith('frontend/src/pages/')) {
    const base = path.posix.basename(posixRel);

    // Визуализация
    if (base === 'CharacterGraphPage.tsx') return 'frontend_pages_visualization';
    if (posixRel.startsWith('frontend/src/pages/character-graph/')) return 'frontend_pages_visualization';
    if (base === 'TimelinePage.tsx') return 'frontend_pages_visualization';
    if (base === 'MapPage.tsx') return 'frontend_pages_visualization';
    if (posixRel.startsWith('frontend/src/pages/map/')) return 'frontend_pages_visualization';
    if (base === 'WikiGraphPage.tsx') return 'frontend_pages_visualization';

    // Контент (заметки, вики)
    if (/^Note.*\.tsx$/i.test(base)) return 'frontend_pages_content';
    if (posixRel.startsWith('frontend/src/pages/note-editor/')) return 'frontend_pages_content';
    if (/^Wiki.*\.tsx$/i.test(base)) return 'frontend_pages_content';
    if (posixRel.startsWith('frontend/src/pages/wiki/')) return 'frontend_pages_content';

    // Системные
    if (base === 'HomePage.tsx') return 'frontend_pages_system';
    if (posixRel.startsWith('frontend/src/pages/home/')) return 'frontend_pages_system';
    if (base === 'ProjectSettingsPage.tsx') return 'frontend_pages_system';
    if (base === 'AppearanceSettingsPage.tsx') return 'frontend_pages_system';
    if (posixRel.startsWith('frontend/src/pages/appearance/')) return 'frontend_pages_system';

    // Сущности
    if (base !== 'CharacterGraphPage.tsx' && /^Character.*\.tsx$/i.test(base)) {
      return 'frontend_pages_entities';
    }
    if (posixRel.startsWith('frontend/src/pages/character/')) return 'frontend_pages_entities';
    if (/^Faction.*\.tsx$/i.test(base)) return 'frontend_pages_entities';
    if (posixRel.startsWith('frontend/src/pages/faction/')) return 'frontend_pages_entities';
    if (/^Dynast.*\.tsx$/i.test(base)) return 'frontend_pages_entities';
    if (posixRel.startsWith('frontend/src/pages/dynasty/')) return 'frontend_pages_entities';
    if (/^Dogma.*\.tsx$/i.test(base)) return 'frontend_pages_entities';
    if (posixRel.startsWith('frontend/src/pages/dogma/')) return 'frontend_pages_entities';

    // Остальное под pages — без категории (если появятся новые файлы)
    return 'uncategorized';
  }

  // Точка входа + utils
  if (posixRel === 'frontend/src/App.tsx' || posixRel === 'frontend/src/main.tsx') {
    return 'frontend_entry';
  }
  if (posixRel.startsWith('frontend/src/utils/')) return 'frontend_entry';

  return 'uncategorized';
}

/**
 * @param {string} chunkKey
 * @param {string[]} filesSorted posix paths
 */
function renderChunkBody(filesSorted, contentsByRel) {
  const tocLines = ['=== TABLE OF CONTENTS ==='];
  filesSorted.forEach((rel, i) => {
    tocLines.push(`${i + 1}. ${rel}`);
  });
  tocLines.push('========================', '');

  const parts = [tocLines.join('\n')];
  for (const rel of filesSorted) {
    const text = contentsByRel.get(rel);
    parts.push(`=== FILE: ${rel} ===`, text ?? '', '');
  }
  return parts.join('\n');
}

function padCell(s, width) {
  const str = String(s);
  return str.length >= width ? str : str + ' '.repeat(width - str.length);
}

async function main() {
  const allFiles = [];
  await walkCollect(ROOT, ROOT, allFiles);
  allFiles.sort((a, b) => a.localeCompare(b));

  /** @type {Map<string, string[]>} */
  const byChunk = new Map();
  for (const key of Object.keys(CHUNK_OUTPUT)) {
    byChunk.set(key, []);
  }

  /** @type {Map<string, string>} */
  const contentsByRel = new Map();

  for (const abs of allFiles) {
    const rel = toPosix(path.relative(ROOT, abs));
    let text;
    try {
      text = await fs.readFile(abs, 'utf8');
    } catch {
      continue;
    }
    contentsByRel.set(rel, text);
    const chunk = assignChunk(rel);
    byChunk.get(chunk).push(rel);
  }

  for (const list of byChunk.values()) {
    list.sort((a, b) => a.localeCompare(b));
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  try {
    const existing = await fs.readdir(OUT_DIR);
    for (const name of existing) {
      if (name.endsWith('.txt')) {
        await fs.unlink(path.join(OUT_DIR, name));
      }
    }
  } catch (e) {
    if (e && e.code !== 'ENOENT') throw e;
  }

  /** @type {{ key: string, name: string, files: number, bytes: number }[]} */
  const stats = [];

  for (const [chunkKey, files] of byChunk) {
    if (!files.length) continue;
    const outName = CHUNK_OUTPUT[chunkKey];
    if (!outName) continue;

    const body = renderChunkBody(files, contentsByRel);
    const outPath = path.join(OUT_DIR, outName);
    await fs.writeFile(outPath, body, 'utf8');
    const bytes = Buffer.byteLength(body, 'utf8');
    stats.push({
      key: chunkKey,
      name: outName,
      files: files.length,
      bytes,
    });
  }

  stats.sort((a, b) => a.name.localeCompare(b.name));

  const nameW = Math.max(
    36,
    ...stats.map((s) => s.name.length),
    'TOTAL (sum of chunks)'.length
  );
  const filesW = 6;
  const bytesW = 12;

  console.log('');
  console.log(`${padCell('chunk', nameW)} ${padCell('files', filesW)} ${padCell('bytes', bytesW)}`);
  console.log(`${'-'.repeat(nameW)} ${'-'.repeat(filesW)} ${'-'.repeat(bytesW)}`);
  let totalFiles = 0;
  let totalBytes = 0;
  for (const s of stats) {
    console.log(
      `${padCell(s.name, nameW)} ${padCell(s.files, filesW)} ${padCell(s.bytes, bytesW)}`
    );
    totalFiles += s.files;
    totalBytes += s.bytes;
  }
  console.log(`${'-'.repeat(nameW)} ${'-'.repeat(filesW)} ${'-'.repeat(bytesW)}`);
  console.log(
    `${padCell('TOTAL (sum of chunks)', nameW)} ${padCell(totalFiles, filesW)} ${padCell(totalBytes, bytesW)}`
  );
  console.log(`\nOutput: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
