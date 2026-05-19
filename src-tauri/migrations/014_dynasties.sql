CREATE TABLE IF NOT EXISTS dynasties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  motto TEXT DEFAULT '',
  description TEXT DEFAULT '',
  history TEXT DEFAULT '',
  status TEXT DEFAULT 'active' CHECK(status IN ('active','extinct','exiled','declining','rising')),
  color TEXT DEFAULT '',
  secondary_color TEXT DEFAULT '',
  image_path TEXT,
  founded_date TEXT DEFAULT '',
  extinct_date TEXT DEFAULT '',
  founder_id INTEGER,
  current_leader_id INTEGER,
  heir_id INTEGER,
  linked_faction_id INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_branch_id INTEGER REFERENCES scenario_branches(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (founder_id) REFERENCES characters(id) ON DELETE SET NULL,
  FOREIGN KEY (current_leader_id) REFERENCES characters(id) ON DELETE SET NULL,
  FOREIGN KEY (heir_id) REFERENCES characters(id) ON DELETE SET NULL,
  FOREIGN KEY (linked_faction_id) REFERENCES factions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS dynasty_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dynasty_id INTEGER NOT NULL,
  character_id INTEGER NOT NULL,
  generation INTEGER DEFAULT 0,
  role TEXT DEFAULT '',
  birth_date TEXT DEFAULT '',
  death_date TEXT DEFAULT '',
  is_main_line INTEGER DEFAULT 1,
  notes TEXT DEFAULT '',
  graph_x REAL,
  graph_y REAL,
  FOREIGN KEY (dynasty_id) REFERENCES dynasties(id) ON DELETE CASCADE,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  UNIQUE(dynasty_id, character_id)
);

CREATE TABLE IF NOT EXISTS dynasty_family_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dynasty_id INTEGER NOT NULL,
  source_character_id INTEGER NOT NULL,
  target_character_id INTEGER NOT NULL,
  relation_type TEXT NOT NULL CHECK(relation_type IN ('parent','child','spouse','sibling')),
  custom_label TEXT DEFAULT '',
  FOREIGN KEY (dynasty_id) REFERENCES dynasties(id) ON DELETE CASCADE,
  FOREIGN KEY (source_character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (target_character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dynasty_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dynasty_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  event_date TEXT NOT NULL,
  importance TEXT DEFAULT 'normal' CHECK(importance IN ('critical','major','normal','minor')),
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (dynasty_id) REFERENCES dynasties(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dynasties_project ON dynasties(project_id);
CREATE INDEX IF NOT EXISTS idx_dynasties_status ON dynasties(project_id, status);
CREATE INDEX IF NOT EXISTS idx_dynasties_project_created_branch ON dynasties(project_id, created_branch_id);
CREATE INDEX IF NOT EXISTS idx_dynasty_members_dynasty ON dynasty_members(dynasty_id);
CREATE INDEX IF NOT EXISTS idx_dynasty_members_character ON dynasty_members(character_id);
CREATE INDEX IF NOT EXISTS idx_dynasty_family_links_dynasty ON dynasty_family_links(dynasty_id);
CREATE INDEX IF NOT EXISTS idx_dynasty_events_dynasty ON dynasty_events(dynasty_id);
