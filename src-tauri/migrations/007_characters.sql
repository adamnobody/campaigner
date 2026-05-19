CREATE TABLE IF NOT EXISTS characters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  state_id INTEGER,
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
  created_branch_id INTEGER REFERENCES scenario_branches(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS character_factions (
  character_id INTEGER NOT NULL,
  faction_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (character_id, faction_id),
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS character_relationships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  source_character_id INTEGER NOT NULL,
  target_character_id INTEGER NOT NULL,
  relationship_type TEXT NOT NULL CHECK(relationship_type IN ('ally','enemy','family','friend','rival','mentor','student','lover','spouse','employer','employee','custom')),
  custom_label TEXT DEFAULT '',
  description TEXT DEFAULT '',
  is_bidirectional INTEGER DEFAULT 1,
  created_branch_id INTEGER REFERENCES scenario_branches(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (source_character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (target_character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_characters_project ON characters(project_id);
CREATE INDEX IF NOT EXISTS idx_characters_name ON characters(project_id, name);
CREATE INDEX IF NOT EXISTS idx_characters_status ON characters(project_id, status);
CREATE INDEX IF NOT EXISTS idx_characters_state ON characters(state_id);
CREATE INDEX IF NOT EXISTS idx_characters_project_created_branch ON characters(project_id, created_branch_id);
CREATE INDEX IF NOT EXISTS idx_character_factions_character ON character_factions(character_id);
CREATE INDEX IF NOT EXISTS idx_character_factions_faction ON character_factions(faction_id);
CREATE INDEX IF NOT EXISTS idx_relationships_source ON character_relationships(source_character_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON character_relationships(target_character_id);
CREATE INDEX IF NOT EXISTS idx_relationships_project ON character_relationships(project_id);
CREATE INDEX IF NOT EXISTS idx_relationships_project_created_branch ON character_relationships(project_id, created_branch_id);
