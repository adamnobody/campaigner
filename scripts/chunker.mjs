import { promises as fs } from 'node:fs';
import path from 'node:path';
import { globby } from 'globby';
import pc from 'picocolors';
import { encoding_for_model, get_encoding } from 'tiktoken';

function parseArgs(argv) {
  const out = {};
  for (const raw of argv) {
    if (!raw.startsWith('--')) continue;
    const clean = raw.slice(2);
    const eq = clean.indexOf('=');
    if (eq === -1) {
      out[clean] = true;
      continue;
    }
    const k = clean.slice(0, eq);
    const v = clean.slice(eq + 1);
    out[k] = v;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));

const root = path.resolve(String(args.root ?? '.'));
const model = String(args.model ?? 'cl100k_base');
const target = Number(args.target ?? 25000);
const buffer = Number(args.buffer ?? Math.floor(target * 0.2));
const maxChunk = target - buffer;
const outDir = path.resolve(root, String(args.outDir ?? 'chunks'));
const includeFromArgs = String(args.include ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const excludeFromArgs = String(args.exclude ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (!Number.isFinite(target) || target <= 0) {
  throw new Error(`Invalid --target: ${args.target}`);
}
if (!Number.isFinite(buffer) || buffer < 0) {
  throw new Error(`Invalid --buffer: ${args.buffer}`);
}
if (maxChunk <= 0) {
  throw new Error(`Invalid chunk settings: target=${target}, buffer=${buffer}, maxChunk=${maxChunk}`);
}

const include = [
  '**/*.ts',
  '**/*.tsx',
  '**/*.js',
  '**/*.json',
  '**/*.md',
  ...includeFromArgs,
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
  ...excludeFromArgs,
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

function estimateStepChars(text, totalTokens) {
  const approxCharsPerToken = Math.max(3, Math.round(text.length / Math.max(totalTokens, 1)));
  return Math.max(1, approxCharsPerToken * Math.floor(maxChunk * 0.9));
}

function alignEndToLineBreak(text, start, desiredEnd) {
  if (desiredEnd >= text.length) return text.length;
  const minEnd = Math.max(start + 1, Math.floor(desiredEnd * 0.8));
  const maxEnd = Math.min(text.length, Math.floor(desiredEnd * 1.2));

  const forward = text.indexOf('\n', desiredEnd);
  if (forward !== -1 && forward <= maxEnd) return forward + 1;

  const back = text.lastIndexOf('\n', desiredEnd);
  if (back !== -1 && back >= minEnd) return back + 1;

  return desiredEnd;
}

(async () => {
  console.log(pc.cyan(`Root: ${root}`));
  console.log(pc.cyan(`OutDir: ${outDir}`));

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
    generatedAt: new Date().toISOString(),
    warnings: [],
    files: [],
    chunks: [],
  };

  const chunks = [];
  let current = { id: 1, files: [], tokens: 0 };
  const fileTextByRel = new Map();

  for (const file of files) {
    const rel = niceRel(file);
    let text = '';
    try {
      text = await fs.readFile(file, 'utf8');
    } catch (err) {
      manifest.warnings.push({
        path: rel,
        reason: 'read_error',
        message: err instanceof Error ? err.message : String(err),
      });
      continue;
    }

    fileTextByRel.set(rel, text);
    const tokens = countTokens(text);

    manifest.files.push({ path: rel, tokens });

    if (tokens > maxChunk) {
      let start = 0;
      let part = 1;
      const step = estimateStepChars(text, tokens);

      while (start < text.length) {
        const desiredEnd = start + step;
        const end = alignEndToLineBreak(text, start, desiredEnd);
        const slice = text.slice(start, end);
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
          start,
          end,
        });
        current.tokens += t;

        part += 1;
        start = end;
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

  await fs.mkdir(outDir, { recursive: true });

  for (const c of chunks) {
    const fp = path.join(outDir, `chunk_${String(c.id).padStart(2, '0')}.txt`);
    const parts = [];

    for (const f of c.files) {
      const p = f.virtual ? f.path.split('#part')[0] : f.path;
      const fullText = fileTextByRel.get(p);
      if (typeof fullText !== 'string') {
        manifest.warnings.push({
          path: p,
          reason: 'missing_file_cache',
          message: 'File text was not cached; skipped while writing chunk',
        });
        continue;
      }
      let text = fullText;

      if (f.virtual) {
        const from = Number.isFinite(f.start) ? f.start : 0;
        const to = Number.isFinite(f.end) ? f.end : text.length;
        text = text.slice(from, to);
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
  if (manifest.warnings.length) {
    console.log(pc.yellow(`Warnings: ${manifest.warnings.length}`));
  }
})().finally(() => {
  if (enc && typeof enc.free === 'function') enc.free();
});