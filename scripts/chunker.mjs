import { promises as fs } from 'node:fs';
import path from 'node:path';
import { globby } from 'globby';
import pc from 'picocolors';
import { encoding_for_model, get_encoding } from 'tiktoken';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

const root = path.resolve(String(args.root ?? '.'));
const model = String(args.model ?? 'cl100k_base');
const target = Number(args.target ?? 25000);
const buffer = Number(args.buffer ?? Math.floor(target * 0.2));
const maxChunk = target - buffer;

const include = [
  '**/*.ts',
  '**/*.tsx',
  '**/*.js',
  '**/*.json',
  '**/*.md',
];

const exclude = [
  '**/node_modules/**',
  '**/.git/**',
  '**/.next/**',
  '**/dist/**',
  '**/build/**',
  '**/*.map',
  '**/*.lock',
  '**/package.json',
  '**/package-lock.json',
  '**/data/**/*.sqlite',
  '**/data/uploads/**',
];

let enc;
try {
  enc = model === 'cl100k_base' ? get_encoding(model) : encoding_for_model(model);
} catch {
  enc = get_encoding('cl100k_base');
}

function countTokens(text) {
  try {
    return enc.encode(text).length;
  } catch {
    return Math.ceil(text.length / 3.5);
  }
}

function niceRel(p) {
  return path.relative(root, p) || path.basename(p);
}

function getVirtualSlice(text, totalTokens, maxChunk, partIdx) {
  const approxCharsPerToken = Math.max(3, Math.round(text.length / Math.max(totalTokens, 1)));
  const step = Math.max(1, approxCharsPerToken * Math.floor(maxChunk * 0.9));
  const start = step * partIdx;
  const end = step * (partIdx + 1);
  return text.slice(start, end);
}

(async () => {
  console.log(pc.cyan(`Root: ${root}`));

  const files = await globby(include, {
    cwd: root,
    absolute: true,
    ignore: exclude,
  });

  files.sort();

  const manifest = {
    model,
    target,
    buffer,
    maxChunk,
    totalTokens: 0,
    files: [],
    chunks: [],
  };

  const chunks = [];
  let current = { id: 1, files: [], tokens: 0 };

  for (const file of files) {
    const rel = niceRel(file);
    const text = await fs.readFile(file, 'utf8');
    const tokens = countTokens(text);

    manifest.files.push({ path: rel, tokens });

    if (tokens > maxChunk) {
      let start = 0;
      let part = 1;
      const approxCharsPerToken = Math.max(3, Math.round(text.length / Math.max(tokens, 1)));
      const step = Math.max(1, approxCharsPerToken * Math.floor(maxChunk * 0.9));

      while (start < text.length) {
        const slice = text.slice(start, start + step);
        const t = countTokens(slice);

        if (current.tokens + t > maxChunk && current.files.length) {
          chunks.push(current);
          current = { id: current.id + 1, files: [], tokens: 0 };
        }

        current.files.push({
          path: `${rel}#part${part}`,
          tokens: t,
          size: slice.length,
          virtual: true,
        });
        current.tokens += t;

        part += 1;
        start += step;
      }

      continue;
    }

    if (current.tokens + tokens > maxChunk && current.files.length) {
      chunks.push(current);
      current = { id: current.id + 1, files: [], tokens: 0 };
    }

    current.files.push({ path: rel, tokens });
    current.tokens += tokens;
  }

  if (current.files.length) {
    chunks.push(current);
  }

  manifest.totalTokens = manifest.files.reduce((sum, f) => sum + f.tokens, 0);
  manifest.chunks = chunks.map((c) => ({
    id: c.id,
    tokens: c.tokens,
    files: c.files,
  }));

  const outDir = path.join(root, 'chunks');
  await fs.mkdir(outDir, { recursive: true });

  for (const c of chunks) {
    const fp = path.join(outDir, `chunk_${String(c.id).padStart(2, '0')}.txt`);
    const parts = [];

    for (const f of c.files) {
      const p = f.virtual ? f.path.split('#part')[0] : f.path;
      const abs = path.join(root, p);
      let text = await fs.readFile(abs, 'utf8');

      if (f.virtual) {
        const totalTokens = countTokens(text);
        const partIdx = Number(f.path.split('#part')[1]) - 1;
        text = getVirtualSlice(text, totalTokens, maxChunk, partIdx);
      }

      parts.push(`\n\n/* ==== ${f.path} (${f.tokens} tok) ==== */\n\n${text}`);
    }

    await fs.writeFile(fp, parts.join('\n'), 'utf8');
  }

  await fs.writeFile(
    path.join(outDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );

  console.log(pc.green(`Files: ${manifest.files.length}`));
  console.log(pc.green(`Total tokens (approx): ${manifest.totalTokens}`));
  console.log(
    pc.green(`Chunks: ${manifest.chunks.length}, target ${target}, maxChunk ${maxChunk}`)
  );
})().finally(() => {
  enc.free();
});