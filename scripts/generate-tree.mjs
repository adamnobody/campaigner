#!/usr/bin/env node
/**
 * Генерирует PROJECT_TREE.md — дерево файлов проекта для документации.
 * Запуск: npm run tree
 */
import { readdirSync, writeFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const OUTPUT = 'PROJECT_TREE.md';

// Что игнорируем при обходе
const IGNORE = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  '.vite',
  '.turbo',
  '.cache',
  'data',              // backend/data — локальная БД и uploads
  'uploads',           // на всякий случай, если где-то всплывёт
  '.DS_Store',
  'PROJECT_TREE.md',   // сам себя не включаем
]);

// Файлы, которые тоже скрываем по имени
const IGNORE_FILES = new Set([
  '.env',
  '.env.local',
  '.env.development',
  '.env.production',
]);

function shouldIgnore(name) {
  return IGNORE.has(name) || IGNORE_FILES.has(name);
}

function buildTree(dir, prefix = '') {
  const entries = readdirSync(dir, { withFileTypes: true })
    .filter(e => !shouldIgnore(e.name))
    .sort((a, b) => {
      // Папки сверху, потом файлы; внутри — по алфавиту
      if (a.isDirectory() !== b.isDirectory()) {
        return a.isDirectory() ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

  const lines = [];
  entries.forEach((entry, idx) => {
    const isLast = idx === entries.length - 1;
    const connector = isLast ? '└─ ' : '├─ ';
    const nextPrefix = prefix + (isLast ? '   ' : '│  ');
    lines.push(prefix + connector + entry.name);

    if (entry.isDirectory()) {
      const sub = buildTree(join(dir, entry.name), nextPrefix);
      lines.push(...sub);
    }
  });
  return lines;
}

const projectName = ROOT.split(/[\\/]/).pop();
const header = [
  '# Project Tree',
  '',
  `Автогенерируется скриптом \`npm run tree\`. Не редактировать вручную.`,
  '',
  '```',
  projectName,
];
const footer = ['```', ''];

const tree = buildTree(ROOT);
const content = [...header, ...tree, ...footer].join('\n');

writeFileSync(join(ROOT, OUTPUT), content, 'utf8');
console.log(`✓ ${OUTPUT} generated (${tree.length} entries)`);