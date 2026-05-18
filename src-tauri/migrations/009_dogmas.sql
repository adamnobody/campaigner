CREATE TABLE IF NOT EXISTS dogmas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other'
    CHECK(category IN ('cosmology','magic','religion','society','politics','economy','history','nature','races','technology','other')),
  description TEXT DEFAULT '',
  impact TEXT DEFAULT '',
  exceptions TEXT DEFAULT '',
  is_public INTEGER DEFAULT 1,
  importance TEXT DEFAULT 'major' CHECK(importance IN ('fundamental','major','minor')),
  status TEXT DEFAULT 'active' CHECK(status IN ('active','deprecated','hidden')),
  sort_order INTEGER DEFAULT 0,
  icon TEXT DEFAULT '',
  color TEXT DEFAULT '',
  created_branch_id INTEGER REFERENCES scenario_branches(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dogmas_project ON dogmas(project_id);
CREATE INDEX IF NOT EXISTS idx_dogmas_category ON dogmas(project_id, category);
CREATE INDEX IF NOT EXISTS idx_dogmas_importance ON dogmas(project_id, importance);
CREATE INDEX IF NOT EXISTS idx_dogmas_status ON dogmas(project_id, status);
CREATE INDEX IF NOT EXISTS idx_dogmas_project_created_branch
  ON dogmas(project_id, created_branch_id);
