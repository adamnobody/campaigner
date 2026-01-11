import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';

export function openProjectDb(projectPath: string) {
  const dbPath = path.join(projectPath, 'db.sqlite');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // ВАЖНО: гарантируем, что схема применена (и для старых проектов тоже)
  initProjectDb(db);

  try {
    const columns = db.prepare(`PRAGMA table_info(markers)`).all() as any[];
    const hasPoints = columns.some((col) => col.name === 'points');

    if (!hasPoints) {
      db.prepare(`ALTER TABLE markers ADD COLUMN points TEXT`).run();
      db.prepare(`ALTER TABLE markers ADD COLUMN style TEXT`).run();
    }
  } catch (err) {
    // ignore
  }
  try {
    const cols = db.prepare(`PRAGMA table_info(characters)`).all() as any[];
    const hasPhotoPath = cols.some((c) => c.name === 'photo_path');
    if (!hasPhotoPath) {
      db.prepare(`ALTER TABLE characters ADD COLUMN photo_path TEXT NOT NULL DEFAULT ''`).run();
    }
  } catch {
    // если таблицы characters ещё нет, initProjectDb создаст её
  }

  return db;
}

export function initProjectDb(db: Database.Database) {
  const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(sql);
}
