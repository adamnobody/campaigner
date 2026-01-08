PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS maps (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  parent_map_id TEXT,
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  path TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS markers (
  id TEXT PRIMARY KEY,
  map_id TEXT NOT NULL,

  title TEXT NOT NULL,
  description TEXT,

  x REAL NOT NULL,
  y REAL NOT NULL,

  points TEXT,
  style TEXT,

  marker_type TEXT NOT NULL,
  color TEXT NOT NULL,

  link_type TEXT,
  link_note_id TEXT,
  link_map_id TEXT,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_maps_project ON maps(project_id);
CREATE INDEX IF NOT EXISTS idx_markers_map ON markers(map_id);
CREATE INDEX IF NOT EXISTS idx_notes_project ON notes(project_id);
