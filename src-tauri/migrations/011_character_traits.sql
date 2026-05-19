CREATE TABLE IF NOT EXISTS character_traits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_path TEXT DEFAULT '',
  is_predefined INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, name)
);

CREATE TABLE IF NOT EXISTS character_trait_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  character_id INTEGER NOT NULL,
  trait_id INTEGER NOT NULL,
  assigned_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (trait_id) REFERENCES character_traits(id) ON DELETE CASCADE,
  UNIQUE(character_id, trait_id)
);

CREATE TABLE IF NOT EXISTS character_trait_exclusions (
  trait_id INTEGER NOT NULL,
  excluded_trait_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (trait_id, excluded_trait_id),
  FOREIGN KEY (trait_id) REFERENCES character_traits(id) ON DELETE CASCADE,
  FOREIGN KEY (excluded_trait_id) REFERENCES character_traits(id) ON DELETE CASCADE,
  CHECK (trait_id != excluded_trait_id)
);

CREATE INDEX IF NOT EXISTS idx_character_traits_project ON character_traits(project_id);
CREATE INDEX IF NOT EXISTS idx_character_traits_predefined ON character_traits(project_id, is_predefined);
CREATE INDEX IF NOT EXISTS idx_character_trait_assignments_character ON character_trait_assignments(character_id);
CREATE INDEX IF NOT EXISTS idx_character_trait_assignments_trait ON character_trait_assignments(trait_id);
