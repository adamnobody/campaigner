import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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

  database.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived')),
      map_image_path TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      parent_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
    );
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      title TEXT DEFAULT '',
      race TEXT DEFAULT '',
      character_class TEXT DEFAULT '',
      level INTEGER,
      status TEXT DEFAULT 'alive' CHECK(status IN ('alive', 'dead', 'unknown', 'missing')),
      bio TEXT DEFAULT '',
      appearance TEXT DEFAULT '',
      personality TEXT DEFAULT '',
      backstory TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      image_path TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS character_relationships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      source_character_id INTEGER NOT NULL,
      target_character_id INTEGER NOT NULL,
      relationship_type TEXT NOT NULL CHECK(relationship_type IN ('ally','enemy','family','friend','rival','mentor','student','lover','spouse','employer','employee','custom')),
      custom_label TEXT DEFAULT '',
      description TEXT DEFAULT '',
      is_bidirectional INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (source_character_id) REFERENCES characters(id) ON DELETE CASCADE,
      FOREIGN KEY (target_character_id) REFERENCES characters(id) ON DELETE CASCADE
    );
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      folder_id INTEGER,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      format TEXT DEFAULT 'md' CHECK(format IN ('md', 'txt')),
      note_type TEXT DEFAULT 'note' CHECK(note_type IN ('wiki', 'note', 'marker_note')),
      is_pinned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
    );
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS maps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      parent_map_id INTEGER,
      parent_marker_id INTEGER,
      name TEXT NOT NULL,
      image_path TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_map_id) REFERENCES maps(id) ON DELETE CASCADE
    );
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS map_markers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      map_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      position_x REAL NOT NULL,
      position_y REAL NOT NULL,
      color TEXT DEFAULT '#FF6B6B',
      icon TEXT DEFAULT 'custom',
      linked_note_id INTEGER,
      child_map_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (map_id) REFERENCES maps(id) ON DELETE CASCADE,
      FOREIGN KEY (linked_note_id) REFERENCES notes(id) ON DELETE SET NULL,
      FOREIGN KEY (child_map_id) REFERENCES maps(id) ON DELETE SET NULL
    );
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS timeline_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      event_date TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      era TEXT DEFAULT '',
      linked_note_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (linked_note_id) REFERENCES notes(id) ON DELETE SET NULL
    );
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#808080',
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE(project_id, name)
    );
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS tag_associations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tag_id INTEGER NOT NULL,
      entity_type TEXT NOT NULL CHECK(entity_type IN ('character', 'note', 'timeline_event')),
      entity_id INTEGER NOT NULL,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
      UNIQUE(tag_id, entity_type, entity_id)
    );
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS wiki_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      source_note_id INTEGER NOT NULL,
      target_note_id INTEGER NOT NULL,
      label TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (source_note_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY (target_note_id) REFERENCES notes(id) ON DELETE CASCADE,
      UNIQUE(source_note_id, target_note_id)
    );
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_characters_project ON characters(project_id);
    CREATE INDEX IF NOT EXISTS idx_characters_name ON characters(project_id, name);
    CREATE INDEX IF NOT EXISTS idx_characters_status ON characters(project_id, status);
    CREATE INDEX IF NOT EXISTS idx_notes_project ON notes(project_id);
    CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder_id);
    CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(project_id, note_type);
    CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(project_id, is_pinned);
    CREATE INDEX IF NOT EXISTS idx_timeline_events_project ON timeline_events(project_id);
    CREATE INDEX IF NOT EXISTS idx_timeline_events_sort ON timeline_events(project_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_folders_project ON folders(project_id);
    CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);
    CREATE INDEX IF NOT EXISTS idx_tags_project ON tags(project_id);
    CREATE INDEX IF NOT EXISTS idx_tag_associations_entity ON tag_associations(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_tag_associations_tag ON tag_associations(tag_id);
    CREATE INDEX IF NOT EXISTS idx_tag_associations_full ON tag_associations(entity_type, entity_id, tag_id);
    CREATE INDEX IF NOT EXISTS idx_relationships_source ON character_relationships(source_character_id);
    CREATE INDEX IF NOT EXISTS idx_relationships_target ON character_relationships(target_character_id);
    CREATE INDEX IF NOT EXISTS idx_relationships_project ON character_relationships(project_id);
    CREATE INDEX IF NOT EXISTS idx_wiki_links_project ON wiki_links(project_id);
    CREATE INDEX IF NOT EXISTS idx_wiki_links_source ON wiki_links(source_note_id);
    CREATE INDEX IF NOT EXISTS idx_wiki_links_target ON wiki_links(target_note_id);
    CREATE INDEX IF NOT EXISTS idx_maps_project ON maps(project_id);
    CREATE INDEX IF NOT EXISTS idx_maps_parent ON maps(parent_map_id);
    CREATE INDEX IF NOT EXISTS idx_map_markers_map ON map_markers(map_id);
    CREATE INDEX IF NOT EXISTS idx_map_markers_child_map ON map_markers(child_map_id);
  `);

  console.log('✅ Database initialized successfully');
}

export function closeDatabase(): void {
  if (db) {
    db.close();
  }
}