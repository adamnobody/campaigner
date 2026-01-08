import path from 'node:path';
import Database from 'better-sqlite3';
import { ensureDir, getDefaultProjectsRoot } from '../config/paths.js';

let db: Database.Database | null = null;

export async function getAppDb() {
  if (db) return db;

  const root = getDefaultProjectsRoot();
  await ensureDir(root);

  const appDbPath = path.join(root, 'app.sqlite');
  db = new Database(appDbPath);

  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS app_projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      system TEXT NOT NULL DEFAULT 'generic', -- Добавили поле
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_app_projects_created ON app_projects(created_at);
  `);

  try {
    const columns = db.prepare(`PRAGMA table_info(app_projects)`).all() as any[];
    const hasSystem = columns.some((col) => col.name === 'system');
    
    if (!hasSystem) {
      console.log('Migrating DB: Adding "system" column to app_projects...');
      db.exec(`ALTER TABLE app_projects ADD COLUMN system TEXT NOT NULL DEFAULT 'generic'`);
    }
  } catch (err) {
    console.error('Migration error:', err);
  }

  return db;
}
