CREATE TABLE IF NOT EXISTS timeline_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  event_date TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  era TEXT DEFAULT '',
  era_color TEXT DEFAULT '',
  linked_note_id INTEGER,
  created_branch_id INTEGER REFERENCES scenario_branches(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (linked_note_id) REFERENCES notes(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_timeline_events_project
  ON timeline_events(project_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_sort
  ON timeline_events(project_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_timeline_project_created_branch
  ON timeline_events(project_id, created_branch_id);
