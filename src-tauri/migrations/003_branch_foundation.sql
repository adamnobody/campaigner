CREATE TABLE IF NOT EXISTS scenario_branches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  parent_branch_id INTEGER,
  base_revision INTEGER DEFAULT 0,
  is_main INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_branch_id) REFERENCES scenario_branches(id) ON DELETE SET NULL,
  UNIQUE(project_id, name)
);

CREATE TABLE IF NOT EXISTS branch_overrides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  op TEXT NOT NULL CHECK(op IN ('upsert', 'delete', 'create')),
  patch_json TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (branch_id) REFERENCES scenario_branches(id) ON DELETE CASCADE,
  UNIQUE(branch_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_branches_project ON scenario_branches(project_id);
CREATE INDEX IF NOT EXISTS idx_branches_parent ON scenario_branches(parent_branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_overrides_branch_entity
  ON branch_overrides(branch_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_branch_overrides_entity_lookup
  ON branch_overrides(entity_type, entity_id, branch_id);
