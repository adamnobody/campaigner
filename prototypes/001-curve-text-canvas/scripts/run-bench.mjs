/**
 * Headless FPS benchmark for Task 2. Requires dev server on port 5173.
 * Uses npx -p playwright (not a project dependency).
 */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const dir = dirname(fileURLToPath(import.meta.url))
const script = join(dir, 'bench-inline.cjs')

const result = spawnSync('npx', ['--yes', '-p', 'playwright', 'node', script], {
  encoding: 'utf8',
  shell: true,
  stdio: 'inherit',
})

process.exit(result.status ?? 1)
