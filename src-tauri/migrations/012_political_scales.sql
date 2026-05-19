CREATE TABLE IF NOT EXISTS political_scales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('state','faction')),
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  left_pole_label TEXT NOT NULL,
  right_pole_label TEXT NOT NULL,
  left_pole_description TEXT NOT NULL DEFAULT '',
  right_pole_description TEXT NOT NULL DEFAULT '',
  icon TEXT,
  zones_json TEXT,
  is_system INTEGER NOT NULL DEFAULT 0,
  project_id INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CHECK (
    (is_system = 1 AND project_id IS NULL) OR
    (is_system = 0 AND project_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS political_scale_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scale_id INTEGER NOT NULL,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('state','faction')),
  entity_id INTEGER NOT NULL,
  value INTEGER NOT NULL DEFAULT 0 CHECK(value >= -100 AND value <= 100),
  enabled INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (scale_id) REFERENCES political_scales(id) ON DELETE CASCADE,
  FOREIGN KEY (entity_id) REFERENCES factions(id) ON DELETE CASCADE,
  UNIQUE(scale_id, entity_type, entity_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_political_scales_code_unique ON political_scales(code);
CREATE INDEX IF NOT EXISTS idx_political_scales_entity_project ON political_scales(entity_type, project_id);
CREATE INDEX IF NOT EXISTS idx_psa_entity ON political_scale_assignments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_psa_scale ON political_scale_assignments(scale_id);
