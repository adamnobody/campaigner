CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#808080',
  UNIQUE(project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_tags_project ON tags(project_id);
