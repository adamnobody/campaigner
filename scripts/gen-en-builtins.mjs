/**
 * Generates EN builtin catalog JSON for i18n (traits, ambitions, political scales).
 * Run: node scripts/gen-en-builtins.mjs (cwd = repo root) or cd scripts && node gen-en-builtins.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const root = path.join(__dirname, '..', 'frontend', 'src', 'i18n', 'locales', 'en', 'builtins');
fs.mkdirSync(root, { recursive: true });

const traitsEn = JSON.parse(fs.readFileSync(path.join(__dirname, 'en-catalog', 'traits-en.json'), 'utf8'));
const ambitionsEn = JSON.parse(fs.readFileSync(path.join(__dirname, 'en-catalog', 'ambitions-en.json'), 'utf8'));
const axesEn = JSON.parse(fs.readFileSync(path.join(__dirname, 'en-catalog', 'political-axes-en.json'), 'utf8'));
const zonesEn = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'en-catalog', 'political-zones-en-by-ru-label.json'), 'utf8'),
);

const rows = JSON.parse(fs.readFileSync(path.join(__dirname, '_political-rows-from-seed.json'), 'utf8'));
const politicalOut = {};
for (const r of rows) {
  const ax = axesEn[r.code];
  if (!ax) {
    console.error('missing political axis EN for', r.code);
    process.exit(1);
  }
  const entry = { ...ax };
  if (r.zones?.length) {
    entry.zones = r.zones.map((z) => {
      const tr = zonesEn[z.label];
      if (!tr) {
        console.error('missing zone EN for label', r.code, z.label);
        process.exit(1);
      }
      return { ...z, label: tr.label, description: tr.description };
    });
  }
  politicalOut[r.code] = entry;
}

fs.writeFileSync(`${root}/catalogTraits.json`, JSON.stringify(traitsEn, null, 2), 'utf8');
fs.writeFileSync(`${root}/catalogAmbitions.json`, JSON.stringify(ambitionsEn, null, 2), 'utf8');
fs.writeFileSync(`${root}/politicalScalesBuiltin.json`, JSON.stringify(politicalOut, null, 2), 'utf8');
console.error('Wrote catalogTraits, catalogAmbitions, politicalScalesBuiltin to', root);
