import type Database from 'better-sqlite3';
import { BUILTIN_AMBITIONS, builtinAmbitionIconPath } from '@campaigner/shared/seeds';

export function migrateFactionAmbitions(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ambitions_catalog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      icon_path TEXT DEFAULT '',
      is_custom INTEGER NOT NULL DEFAULT 0,
      project_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      CHECK (
        (is_custom = 0 AND project_id IS NULL) OR
        (is_custom = 1 AND project_id IS NOT NULL)
      )
    );
  `);

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_ambitions_catalog_builtin_name
    ON ambitions_catalog(name)
    WHERE is_custom = 0;
  `);

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_ambitions_catalog_custom_project_name
    ON ambitions_catalog(project_id, name)
    WHERE is_custom = 1;
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS faction_ambitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faction_id INTEGER NOT NULL,
      ambition_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE,
      FOREIGN KEY (ambition_id) REFERENCES ambitions_catalog(id) ON DELETE CASCADE,
      UNIQUE(faction_id, ambition_id)
    );
  `);

  const insert = db.prepare(`
    INSERT OR IGNORE INTO ambitions_catalog (name, description, icon_path, is_custom, project_id)
    VALUES (?, ?, ?, 0, NULL)
  `);

  for (const ambition of BUILTIN_AMBITIONS) {
    insert.run(ambition.name, ambition.description, builtinAmbitionIconPath(ambition));
  }

  // Старые БД уже содержат строки с INSERT OR IGNORE — обновляем icon_path под актуальные файлы в public/ambitions.
  const syncBuiltinIcon = db.prepare(
    `UPDATE ambitions_catalog SET icon_path = ? WHERE name = ? AND is_custom = 0`
  );
  for (const ambition of BUILTIN_AMBITIONS) {
    syncBuiltinIcon.run(builtinAmbitionIconPath(ambition), ambition.name);
  }
}
