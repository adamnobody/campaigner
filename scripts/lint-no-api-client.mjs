#!/usr/bin/env node
/**
 * Fails if `apiClient.` is used outside the allowed HTTP transport files.
 * Run: npm run lint:api-client
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const frontendSrc = path.join(root, 'frontend', 'src');

const ALLOWLIST_RELATIVE = [
  'api/client.ts',
  'api/transport/http.ts',
  'api/transport/httpMultipart.ts',
];

const ALLOWLIST = new Set(
  ALLOWLIST_RELATIVE.map((rel) => path.normalize(path.join(frontendSrc, rel))),
);

const PATTERN = 'apiClient.';

function fail(message, code = 2) {
  console.error(message);
  process.exit(code);
}

function isTsFile(name) {
  return name.endsWith('.ts') || name.endsWith('.tsx');
}

function collectTsFiles(dir, files = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectTsFiles(fullPath, files);
    } else if (entry.isFile() && isTsFile(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

/** Ignore `apiClient.` inside // comments or string literals. */
function isIgnoredMatch(line, index) {
  const before = line.slice(0, index);
  const slashComment = before.lastIndexOf('//');
  if (slashComment !== -1) {
    return true;
  }

  const charBefore = index > 0 ? line[index - 1] : '';
  const charAfter = line[index + PATTERN.length] ?? '';
  if (charBefore === "'" || charBefore === '"') {
    return true;
  }
  if (charAfter === "'" || charAfter === '"') {
    return true;
  }

  return false;
}

function findViolationsInLine(line) {
  const hits = [];
  let from = 0;

  while (from < line.length) {
    const index = line.indexOf(PATTERN, from);
    if (index === -1) {
      break;
    }
    if (!isIgnoredMatch(line, index)) {
      hits.push(index);
    }
    from = index + PATTERN.length;
  }

  return hits;
}

function scanFile(filePath) {
  const normalized = path.normalize(filePath);
  if (ALLOWLIST.has(normalized)) {
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const violations = [];

  for (let lineNum = 0; lineNum < lines.length; lineNum += 1) {
    const line = lines[lineNum];
    if (!line.includes(PATTERN)) {
      continue;
    }
    if (findViolationsInLine(line).length > 0) {
      violations.push({
        file: normalized,
        line: lineNum + 1,
        text: line.trimEnd(),
      });
    }
  }

  return violations;
}

if (!fs.existsSync(frontendSrc)) {
  fail(`lint-no-api-client: frontend/src directory not found: ${frontendSrc}`);
}

for (const rel of ALLOWLIST_RELATIVE) {
  const allowPath = path.join(frontendSrc, rel);
  if (!fs.existsSync(allowPath)) {
    fail(`lint-no-api-client: allowlist entry not found: ${allowPath}`);
  }
}

const files = collectTsFiles(frontendSrc);
const allViolations = [];

for (const file of files) {
  allViolations.push(...scanFile(file));
}

if (allViolations.length > 0) {
  console.error(
    'apiClient must only be used in frontend/src/api/client.ts and transport HTTP helpers:\n',
  );
  for (const v of allViolations) {
    console.error(`${v.file}:${v.line}: ${v.text}`);
  }
  process.exit(1);
}

console.log('lint-no-api-client: OK');
