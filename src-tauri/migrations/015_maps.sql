CREATE TABLE IF NOT EXISTS maps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  parent_map_id INTEGER,
  parent_marker_id INTEGER,
  name TEXT NOT NULL,
  image_path TEXT,
  created_branch_id INTEGER REFERENCES scenario_branches(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_map_id) REFERENCES maps(id) ON DELETE CASCADE
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
  created_branch_id INTEGER REFERENCES scenario_branches(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (map_id) REFERENCES maps(id) ON DELETE CASCADE,
  FOREIGN KEY (linked_note_id) REFERENCES notes(id) ON DELETE SET NULL,
  FOREIGN KEY (child_map_id) REFERENCES maps(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS map_territories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  map_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  color TEXT DEFAULT '#4ECDC4',
  opacity REAL DEFAULT 0.25,
  border_color TEXT DEFAULT '#4ECDC4',
  border_width REAL DEFAULT 2,
  points TEXT NOT NULL DEFAULT '[]',
  faction_id INTEGER,
  smoothing REAL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_branch_id INTEGER REFERENCES scenario_branches(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (map_id) REFERENCES maps(id) ON DELETE CASCADE,
  FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_maps_project ON maps(project_id);
CREATE INDEX IF NOT EXISTS idx_maps_parent ON maps(parent_map_id);
CREATE INDEX IF NOT EXISTS idx_maps_project_created_branch ON maps(project_id, created_branch_id);
CREATE INDEX IF NOT EXISTS idx_map_markers_map ON map_markers(map_id);
CREATE INDEX IF NOT EXISTS idx_map_markers_child_map ON map_markers(child_map_id);
CREATE INDEX IF NOT EXISTS idx_map_markers_map_created_branch ON map_markers(map_id, created_branch_id);
CREATE INDEX IF NOT EXISTS idx_map_territories_map ON map_territories(map_id);
CREATE INDEX IF NOT EXISTS idx_map_territories_map_created_branch ON map_territories(map_id, created_branch_id);
