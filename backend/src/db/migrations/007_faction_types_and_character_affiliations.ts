import type Database from 'better-sqlite3';

function hasColumn(db: Database.Database, tableName: string, columnName: string): boolean {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  return columns.some((column) => column.name === columnName);
}

export function migrateFactionTypesAndCharacterAffiliations(db: Database.Database): void {
  db.exec('PRAGMA foreign_keys = OFF;');

  const recreateFactions = db.transaction(() => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS factions_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'faction' CHECK(type IN ('state', 'faction')),
        custom_type TEXT DEFAULT '',
        state_type TEXT DEFAULT '',
        custom_state_type TEXT DEFAULT '',
        motto TEXT DEFAULT '',
        description TEXT DEFAULT '',
        history TEXT DEFAULT '',
        goals TEXT DEFAULT '',
        headquarters TEXT DEFAULT '',
        territory TEXT DEFAULT '',
        status TEXT DEFAULT 'active' CHECK(status IN ('active','disbanded','secret','exiled','destroyed')),
        color TEXT DEFAULT '',
        secondary_color TEXT DEFAULT '',
        image_path TEXT,
        banner_path TEXT,
        founded_date TEXT DEFAULT '',
        disbanded_date TEXT DEFAULT '',
        parent_faction_id INTEGER,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_faction_id) REFERENCES factions_new(id) ON DELETE SET NULL
      );
    `);

    db.exec(`
      INSERT INTO factions_new (
        id, project_id, name, type, custom_type, state_type, custom_state_type, motto,
        description, history, goals, headquarters, territory, status, color, secondary_color,
        image_path, banner_path, founded_date, disbanded_date, parent_faction_id, sort_order,
        created_at, updated_at
      )
      SELECT
        id, project_id, name, 'faction' as type, custom_type, state_type, custom_state_type, motto,
        description, history, goals, headquarters, territory, status, color, secondary_color,
        image_path, banner_path, founded_date, disbanded_date, parent_faction_id, sort_order,
        created_at, updated_at
      FROM factions;
    `);

    db.exec('DROP TABLE factions;');
    db.exec('ALTER TABLE factions_new RENAME TO factions;');
  });

  recreateFactions();

  if (!hasColumn(db, 'characters', 'state_id')) {
    db.exec(`
      ALTER TABLE characters
      ADD COLUMN state_id INTEGER REFERENCES factions(id) ON DELETE SET NULL;
    `);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS character_factions (
      character_id INTEGER NOT NULL,
      faction_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (character_id, faction_id),
      FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
      FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    INSERT OR IGNORE INTO character_factions (character_id, faction_id)
    SELECT DISTINCT fm.character_id, fm.faction_id
    FROM faction_members fm
    JOIN factions f ON f.id = fm.faction_id
    WHERE f.type = 'faction';
  `);

  db.exec(`
    UPDATE characters
    SET state_id = NULL
    WHERE state_id IS NOT NULL;
  `);

  db.exec('PRAGMA foreign_keys = ON;');
}
