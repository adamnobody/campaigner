import path from 'node:path';
import fs from 'node:fs/promises';

export function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'project';
}

export function assertInsideRoot(rootAbs: string, candidateAbs: string) {
  const rel = path.relative(rootAbs, candidateAbs);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw Object.assign(new Error('Unsafe path (outside project root).'), { status: 400, code: 'UNSAFE_PATH' });
  }
}

export async function atomicWriteFile(fileAbs: string, content: string) {
  const dir = path.dirname(fileAbs);
  await fs.mkdir(dir, { recursive: true });

  const tmp = `${fileAbs}.tmp-${Date.now()}`;
  await fs.writeFile(tmp, content, 'utf8');
  await fs.rename(tmp, fileAbs);
}
export async function atomicWriteBuffer(fileAbs: string, content: Buffer) {
  const dir = path.dirname(fileAbs);
  await fs.mkdir(dir, { recursive: true });

  const tmp = `${fileAbs}.tmp-${Date.now()}`;
  await fs.writeFile(tmp, content);
  await fs.rename(tmp, fileAbs);
}
