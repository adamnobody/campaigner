import path from 'node:path';
import { createRequire } from 'node:module';
import pc from 'picocolors';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

const dbPath = path.resolve(process.env.DB_PATH || 'data/campaigner.sqlite');
const explicitProjectId = process.env.PROJECT_ID ? Number(process.env.PROJECT_ID) : null;

function printPlan(label, rows) {
  console.log(pc.cyan(`\n▶ ${label}`));
  if (!rows.length) {
    console.log(pc.yellow('  no rows returned by EXPLAIN QUERY PLAN'));
    return;
  }
  for (const row of rows) {
    console.log(`  - ${row.detail}`);
  }
}

function timeQuery(db, sql, params = [], rounds = 20) {
  const stmt = db.prepare(sql);
  const start = performance.now();
  for (let i = 0; i < rounds; i += 1) {
    stmt.all(...params);
  }
  return (performance.now() - start) / rounds;
}

function explainQuery(db, label, sql, params = []) {
  const planRows = db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...params);
  printPlan(label, planRows);
  const avgMs = timeQuery(db, sql, params, 25);
  console.log(pc.gray(`  avg execution ~${avgMs.toFixed(2)}ms (25 rounds)`));
}

function getProjectId(db) {
  if (explicitProjectId) return explicitProjectId;
  const row = db.prepare('SELECT id FROM projects ORDER BY id DESC LIMIT 1').get();
  return row?.id ?? null;
}

function main() {
  console.log(pc.bold(pc.magenta('\nCampaigner DB explain-hot')));
  console.log(pc.dim(`DB: ${dbPath}`));

  const db = new Database(dbPath, { readonly: true });
  const projectId = getProjectId(db);
  if (!projectId) {
    throw new Error('No project found. Seed data first (npm run db:seed-demo).');
  }
  console.log(pc.dim(`Project id: ${projectId}`));

  const rootMapRow = db.prepare(
    'SELECT id FROM maps WHERE project_id = ? AND parent_map_id IS NULL LIMIT 1'
  ).get(projectId);
  const rootMapId = rootMapRow?.id ?? null;

  explainQuery(
    db,
    'notes list by project/type sorted by updated_at',
    `SELECT id, title, updated_at FROM notes WHERE project_id = ? AND note_type = ? ORDER BY updated_at DESC LIMIT 100`,
    [projectId, 'wiki']
  );

  explainQuery(
    db,
    'notes list by folder sorted by updated_at',
    `SELECT id, title, updated_at FROM notes WHERE project_id = ? AND folder_id IS NULL ORDER BY updated_at DESC LIMIT 100`,
    [projectId]
  );

  explainQuery(
    db,
    'search-like notes',
    `SELECT id, title FROM notes WHERE project_id = ? AND (title LIKE ? OR content LIKE ?) LIMIT 50`,
    [projectId, '%seed%', '%seed%']
  );

  explainQuery(
    db,
    'map tree by project',
    `SELECT id, parent_map_id, name FROM maps WHERE project_id = ? ORDER BY parent_map_id, name`,
    [projectId]
  );

  if (rootMapId) {
    explainQuery(
      db,
      'markers by map ordered by created_at',
      `SELECT id, title FROM map_markers WHERE map_id = ? ORDER BY created_at LIMIT 500`,
      [rootMapId]
    );

    explainQuery(
      db,
      'territories by map ordered by sort/created',
      `SELECT id, name FROM map_territories WHERE map_id = ? ORDER BY sort_order, created_at LIMIT 500`,
      [rootMapId]
    );
  } else {
    console.log(pc.yellow('\nNo root map found; skipping marker/territory explain.'));
  }

  db.close();
  console.log(pc.green('\n✔ explain-hot completed\n'));
}

try {
  main();
} catch (error) {
  console.error(pc.red(error.stack || error.message));
  process.exitCode = 1;
}
