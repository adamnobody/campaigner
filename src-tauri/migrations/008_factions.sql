CREATE TABLE IF NOT EXISTS factions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'faction' CHECK(kind IN ('state', 'faction')),
  type TEXT,
  motto TEXT DEFAULT '',
  description TEXT DEFAULT '',
  history TEXT DEFAULT '',
  goals TEXT DEFAULT '',
  headquarters TEXT DEFAULT '',
  territory TEXT DEFAULT '',
  treasury INTEGER,
  population INTEGER,
  army_size INTEGER,
  navy_size INTEGER,
  territory_km2 INTEGER,
  annual_income INTEGER,
  annual_expenses INTEGER,
  members_count INTEGER,
  influence INTEGER CHECK (influence IS NULL OR (influence >= 0 AND influence <= 100)),
  status TEXT DEFAULT 'active' CHECK(status IN ('active','disbanded','secret','exiled','destroyed')),
  color TEXT DEFAULT '',
  secondary_color TEXT DEFAULT '',
  image_path TEXT,
  banner_path TEXT,
  founded_date TEXT DEFAULT '',
  disbanded_date TEXT DEFAULT '',
  parent_faction_id INTEGER,
  ruling_dynasty_id INTEGER,
  ruler_character_id INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_branch_id INTEGER REFERENCES scenario_branches(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_faction_id) REFERENCES factions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS faction_ranks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  faction_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  permissions TEXT DEFAULT '',
  icon TEXT DEFAULT '',
  color TEXT DEFAULT '',
  FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS faction_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  faction_id INTEGER NOT NULL,
  character_id INTEGER NOT NULL,
  rank_id INTEGER,
  role TEXT DEFAULT '',
  joined_date TEXT DEFAULT '',
  left_date TEXT DEFAULT '',
  is_active INTEGER DEFAULT 1,
  notes TEXT DEFAULT '',
  FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (rank_id) REFERENCES faction_ranks(id) ON DELETE SET NULL,
  UNIQUE(faction_id, character_id)
);

CREATE TABLE IF NOT EXISTS faction_relations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  source_faction_id INTEGER NOT NULL,
  target_faction_id INTEGER NOT NULL,
  relation_type TEXT NOT NULL DEFAULT 'neutral',
  custom_label TEXT DEFAULT '',
  description TEXT DEFAULT '',
  started_date TEXT DEFAULT '',
  is_bidirectional INTEGER DEFAULT 1,
  created_branch_id INTEGER REFERENCES scenario_branches(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (source_faction_id) REFERENCES factions(id) ON DELETE CASCADE,
  FOREIGN KEY (target_faction_id) REFERENCES factions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS faction_custom_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  faction_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE,
  UNIQUE(faction_id, name)
);

CREATE TABLE IF NOT EXISTS faction_policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  faction_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('ambition','policy')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('planned','active','archived')),
  category TEXT NOT NULL DEFAULT 'other',
  enacted_date TEXT,
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_factions_project ON factions(project_id);
CREATE INDEX IF NOT EXISTS idx_factions_kind ON factions(project_id, kind);
CREATE INDEX IF NOT EXISTS idx_factions_type ON factions(project_id, type);
CREATE INDEX IF NOT EXISTS idx_factions_status ON factions(project_id, status);
CREATE INDEX IF NOT EXISTS idx_factions_parent ON factions(parent_faction_id);
CREATE INDEX IF NOT EXISTS idx_factions_ruling_dynasty ON factions(ruling_dynasty_id);
CREATE INDEX IF NOT EXISTS idx_factions_ruler_character ON factions(ruler_character_id);
CREATE INDEX IF NOT EXISTS idx_factions_project_created_branch ON factions(project_id, created_branch_id);

CREATE INDEX IF NOT EXISTS idx_faction_policies_faction ON faction_policies(faction_id);

CREATE INDEX IF NOT EXISTS idx_faction_ranks_faction ON faction_ranks(faction_id);
CREATE INDEX IF NOT EXISTS idx_faction_ranks_level ON faction_ranks(faction_id, level);

CREATE INDEX IF NOT EXISTS idx_faction_members_faction ON faction_members(faction_id);
CREATE INDEX IF NOT EXISTS idx_faction_members_character ON faction_members(character_id);
CREATE INDEX IF NOT EXISTS idx_faction_members_rank ON faction_members(rank_id);

CREATE INDEX IF NOT EXISTS idx_faction_relations_project ON faction_relations(project_id);
CREATE INDEX IF NOT EXISTS idx_faction_relations_source ON faction_relations(source_faction_id);
CREATE INDEX IF NOT EXISTS idx_faction_relations_target ON faction_relations(target_faction_id);
CREATE INDEX IF NOT EXISTS idx_faction_relations_project_created_branch
  ON faction_relations(project_id, created_branch_id);

CREATE INDEX IF NOT EXISTS idx_faction_custom_metrics_faction_id ON faction_custom_metrics(faction_id);
