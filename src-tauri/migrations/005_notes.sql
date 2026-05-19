CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  folder_id INTEGER,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  format TEXT DEFAULT 'md' CHECK(format IN ('md', 'txt')),
  note_type TEXT DEFAULT 'note' CHECK(note_type IN ('wiki', 'note', 'marker_note')),
  is_pinned INTEGER DEFAULT 0,
  created_branch_id INTEGER REFERENCES scenario_branches(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notes_project ON notes(project_id);
CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(project_id, note_type);
CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(project_id, is_pinned);
CREATE INDEX IF NOT EXISTS idx_notes_project_type_updated
  ON notes(project_id, note_type, updated_at);
CREATE INDEX IF NOT EXISTS idx_notes_project_folder_updated
  ON notes(project_id, folder_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_notes_project_created_branch
  ON notes(project_id, created_branch_id);
