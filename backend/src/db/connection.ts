import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createTables, createIndexes } from './schema';
import { migrateTagAssociationsForDynasty } from './migrations/002_tag_associations_dynasty';
import { migrateDynastyMembersGraph } from './migrations/003_dynasty_members_graph';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DATABASE_PATH
  ? path.resolve(__dirname, '../../../', process.env.DATABASE_PATH)
  : path.resolve(__dirname, '../../../data/campaigner.sqlite');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initializeDatabase(): void {
  const database = getDb();

  createTables(database);
  migrateTagAssociationsForDynasty(database);
  migrateDynastyMembersGraph(database);
  createIndexes(database);

  console.log('✅ Database initialized successfully');
}

export function closeDatabase(): void {
  if (db) {
    db.close();
  }
}
