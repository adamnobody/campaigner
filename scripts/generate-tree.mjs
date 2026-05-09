#!/usr/bin/env node
/**
 * Генерирует PROJECT_TREE.md — дерево файлов проекта для документации.
 * Запуск: npm run tree
 */
import { readdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const OUTPUT = 'PROJECT_TREE.md';
const ALWAYS_IGNORE = new Set(['.git']);

function toGitPath(path) {
  return path.split(/[\\/]+/).join('/');
}

function getIgnoredPaths(paths) {
  if (paths.length === 0) {
    return new Set();
  }

  const result = spawnSync('git', ['check-ignore', '--no-index', '-z', '--stdin'], {
    cwd: ROOT,
    input: paths.join('\0') + '\0',
    encoding: 'utf8',
  });

  if (result.status !== 0 && result.status !== 1) {
    throw new Error(result.stderr || 'Failed to read ignored paths from git.');
  }

  return new Set(result.stdout.split('\0').filter(Boolean));
}

function buildTree(dir, prefix = '') {
  const allEntries = readdirSync(dir, { withFileTypes: true })
    .filter(entry => !ALWAYS_IGNORE.has(entry.name));
  const ignored = getIgnoredPaths(allEntries.map(entry => (
    toGitPath(relative(ROOT, join(dir, entry.name)))
  )));

  const entries = allEntries
    .filter(entry => {
      const relativePath = toGitPath(relative(ROOT, join(dir, entry.name)));
      return !ignored.has(relativePath);
    })
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