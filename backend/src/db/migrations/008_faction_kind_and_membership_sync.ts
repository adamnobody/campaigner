import type Database from 'better-sqlite3';

function hasColumn(db: Database.Database, tableName: string, columnName: string): boolean {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  return columns.some((column) => column.name === columnName);
}

function recreateFactionsWithKindAndType(db: Database.Database): void {
  const hasKind = hasColumn(db, 'factions', 'kind');
  const hasType = hasColumn(db, 'factions', 'type');
  if (!hasType && !hasKind) {
    return;
  }

  const kindExpr = hasKind
    ? "CASE WHEN kind IN ('state', 'faction') THEN kind ELSE 'faction' END"
    : "CASE WHEN type IN ('state', 'faction') THEN type ELSE 'faction' END";
  const semanticTypeExpr = hasType ? 'type' : 'NULL';

  db.exec(`
    CREATE TABLE IF NOT EXISTS factions_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'faction' CHECK(kind IN ('state', 'faction')),
      type TEXT,
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
      id, project_id, name, kind, type, custom_type, state_type, custom_state_type, motto,
      description, history, goals, headquarters, territory, status, color, secondary_color,
      image_path, banner_path, founded_date, disbanded_date, parent_faction_id, sort_order,
      created_at, updated_at
    )
    SELECT
      id, project_id, name, ${kindExpr} as kind, ${semanticTypeExpr} as type, custom_type, state_type, custom_state_type, motto,
      description, history, goals, headquarters, territory, status, color, secondary_color,
      image_path, banner_path, founded_date, disbanded_date, parent_faction_id, sort_order,
      created_at, updated_at
    FROM factions;
  `);

  db.exec('DROP TABLE factions;');
  db.exec('ALTER TABLE factions_new RENAME TO factions;');
}

function syncFactionMembershipPairs(db: Database.Database): void {
  db.exec(`
    DELETE FROM character_factions
    WHERE faction_id IN (
      SELECT id
      FROM factions
      WHERE kind != 'faction'
    );
  `);

  db.exec(`
    INSERT INTO faction_members (faction_id, character_id, rank_id, role, joined_date, left_date, is_active, notes)
    SELECT
      cf.faction_id,
      cf.character_id,
      (
        SELECT fr.id
        FROM faction_ranks fr
        WHERE fr.faction_id = cf.faction_id
        ORDER BY fr.level ASC, fr.id ASC
        LIMIT 1
      ) as rank_id,
      'Член фракции',
      '',
      '',
      1,
      ''
    FROM character_factions cf
    JOIN factions f ON f.id = cf.faction_id
    LEFT JOIN faction_members fm
      ON fm.faction_id = cf.faction_id
      AND fm.character_id = cf.character_id
    WHERE f.kind = 'faction'
      AND fm.id IS NULL;
  `);

  db.exec(`
    INSERT OR IGNORE INTO character_factions (character_id, faction_id)
    SELECT fm.character_id, fm.faction_id
    FROM faction_members fm
    JOIN factions f ON f.id = fm.faction_id
    WHERE f.kind = 'faction';
  `);
}

export function migrateFactionKindAndMembershipSync(db: Database.Database): void {
  db.exec('PRAGMA foreign_keys = OFF;');
  const run = db.transaction(() => {
    recreateFactionsWithKindAndType(db);
    syncFactionMembershipPairs(db);
  });
  run();
  db.exec('PRAGMA foreign_keys = ON;');
}
