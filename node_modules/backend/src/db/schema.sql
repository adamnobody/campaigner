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

-- Characters
CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  tags_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_characters_project_id ON characters(project_id);

-- Relationships
CREATE TABLE IF NOT EXISTS relationships (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  from_character_id TEXT NOT NULL,
  to_character_id TEXT NOT NULL,
  type TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_relationships_project_id ON relationships(project_id);
CREATE INDEX IF NOT EXISTS idx_relationships_from ON relationships(from_character_id);
CREATE INDEX IF NOT EXISTS idx_relationships_to ON relationships(to_character_id);