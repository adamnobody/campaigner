import { Database } from 'better-sqlite3';

export function migrate001CreateMapsTables(db: Database): void {
  db.exec(`
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
      FOREIGN KEY (parent_map_id) REFERENCES maps(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_marker_id) REFERENCES map_markers(id) ON DELETE SET NULL
    );

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

    CREATE INDEX IF NOT EXISTS idx_maps_project ON maps(project_id);
    CREATE INDEX IF NOT EXISTS idx_maps_parent ON maps(parent_map_id);
    CREATE INDEX IF NOT EXISTS idx_map_markers_map ON map_markers(map_id);
    CREATE INDEX IF NOT EXISTS idx_map_markers_child_map ON map_markers(child_map_id);
  `);
}