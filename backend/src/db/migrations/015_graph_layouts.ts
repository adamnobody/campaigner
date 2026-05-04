import type Database from 'better-sqlite3';

export function migrateGraphLayouts015(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS graph_layouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      branch_id INTEGER NOT NULL,
      graph_type TEXT NOT NULL,
      layout_data TEXT NOT NULL DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (branch_id) REFERENCES scenario_branches(id) ON DELETE CASCADE,
      UNIQUE(project_id, branch_id, graph_type)
    );
    CREATE INDEX IF NOT EXISTS idx_graph_layouts_project_branch
      ON graph_layouts(project_id, branch_id);
  `);
}
