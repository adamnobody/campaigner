CREATE TABLE IF NOT EXISTS wiki_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  source_note_id INTEGER NOT NULL,
  target_note_id INTEGER NOT NULL,
  label TEXT DEFAULT '',
  created_branch_id INTEGER REFERENCES scenario_branches(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (source_note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (target_note_id) REFERENCES notes(id) ON DELETE CASCADE,
  UNIQUE(source_note_id, target_note_id)
);

CREATE INDEX IF NOT EXISTS idx_wiki_links_project ON wiki_links(project_id);
CREATE INDEX IF NOT EXISTS idx_wiki_links_source ON wiki_links(source_note_id);
CREATE INDEX IF NOT EXISTS idx_wiki_links_target ON wiki_links(target_note_id);
