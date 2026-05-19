#!/usr/bin/env node
/**
 * Fails if `apiClient.` is used outside the allowed HTTP transport files.
 * Run: node scripts/lint-no-api-client.mjs
 */
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const frontendSrc = path.join(root, 'frontend', 'src');

const allowed = new Set([
  path.join(frontendSrc, 'api', 'client.ts'),
  path.join(frontendSrc, 'api', 'transport', 'http.ts'),
  path.join(frontendSrc, 'api', 'transport', 'httpMultipart.ts'),
]);

let output = '';
try {
  output = execSync(
    `rg "apiClient\\." "${frontendSrc}" -g "*.ts" -g "*.tsx" --no-heading`,
    { encoding: 'utf8', cwd: root },
  );
} catch (error) {
  const status = error.status;
  const stdout = error.stdout?.toString() ?? '';
  if (status === 1 && !stdout.trim()) {
    console.log('lint-no-api-client: OK (no apiClient usages outside transport)');
    process.exit(0);
  }
  if (stdout.trim()) {
    output = stdout;
  } else {
    console.error(error.message);
    process.exit(2);
  }
}

const violations = output
  .trim()
  .split('\n')
  .filter(Boolean)
  .filter((line) => {
    const file = line.split(':')[0];
    return !allowed.has(path.normalize(file));
  });

if (violations.length > 0) {
  console.error('apiClient must only be used in frontend/src/api/client.ts and transport HTTP helpers:\n');
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log('lint-no-api-client: OK');
