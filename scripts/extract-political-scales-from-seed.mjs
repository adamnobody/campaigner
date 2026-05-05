import fs from 'fs';

const raw = fs.readFileSync('./backend/src/db/seeds/politicalScalesSeedData.ts', 'utf8');
const sep = `\nexport function migratePoliticalScales`;
const endIdx = raw.indexOf(sep);
const s = endIdx >= 0 ? raw.slice(0, endIdx) : raw;

const re =
  /code: '([^']+)',\s*\n\s*entityType:[^\n]+\n\s*category:[^\n]+\n\s*name: '([^']*)',\s*\n\s*leftPoleLabel: '([^']*)',\s*\n\s*rightPoleLabel: '([^']*)',\s*\n\s*leftPoleDescription: '([^']*)',\s*\n\s*rightPoleDescription: '([^']*)',\s*\n\s*zonesJson: (JSON\.stringify\(\[[\s\S]*?\]\)|null),\s*\n\s*sortOrder: \d+,/g;

const rows = [];
let m;
while ((m = re.exec(s)) !== null) {
  let zones = null;
  const zTok = m[7];
  if (zTok !== 'null') {
    const inner = zTok.replace(/^JSON\.stringify\(/, '').replace(/\)\s*$/, '');
    try {
      zones = eval(inner);
    } catch (e) {
      console.error('eval zones failed', m[1], e);
      process.exit(1);
    }
  }
  rows.push({
    code: m[1],
    name: m[2],
    leftPole: m[3],
    rightPole: m[4],
    leftDesc: m[5],
    rightDesc: m[6],
    zones,
  });
}

if (rows.length !== 32) {
  console.error('expected 32 rows, got', rows.length);
  process.exit(1);
}

fs.writeFileSync('./scripts/_political-rows-from-seed.json', JSON.stringify(rows, null, 2), 'utf8');
console.error('wrote scripts/_political-rows-from-seed.json', rows.length, 'items');
