import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

export function openProjectDb(projectPath: string) {
  const dbPath = path.join(projectPath, 'db.sqlite');
  const db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // гарантируем, что базовая схема применена
  initProjectDb(db);

  // миграции markers
  try {
    const cols = db.prepare(`PRAGMA table_info(markers)`).all() as Array<{ name: string }>;

    const hasIcon = cols.some((c) => c.name === 'icon');
    if (!hasIcon) {
      db.prepare(`ALTER TABLE markers ADD COLUMN icon TEXT NOT NULL DEFAULT ''`).run();
    }

    const hasPoints = cols.some((c) => c.name === 'points');
    if (!hasPoints) {
      db.prepare(`ALTER TABLE markers ADD COLUMN points TEXT`).run();
    }

    const hasStyle = cols.some((c) => c.name === 'style');
    if (!hasStyle) {
      db.prepare(`ALTER TABLE markers ADD COLUMN style TEXT`).run();
    }
  } catch {
    // ignore
  }

  // миграции characters
  try {
    const cols = db.prepare(`PRAGMA table_info(characters)`).all() as Array<{ name: string }>;
    const hasPhotoPath = cols.some((c) => c.name === 'photo_path');
    if (!hasPhotoPath) {
      db.prepare(`ALTER TABLE characters ADD COLUMN photo_path TEXT NOT NULL DEFAULT ''`).run();
    }
  } catch {
    // ignore
  }

  return db;
}

export function initProjectDb(db: Database.Database) {
  // schema.sql лежит рядом с этим файлом в папке db/
  // (в dev: backend/src/db/schema.sql, в build: backend/dist/db/schema.sql — если ты копируешь файл)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(sql);
}
