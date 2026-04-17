import type Database from 'better-sqlite3';

function hasColumn(db: Database.Database, tableName: string, columnName: string): boolean {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  return columns.some((column) => column.name === columnName);
}

export function migrateFactionTypesAndCharacterAffiliations(db: Database.Database): void {
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
    JOIN factions f ON f.id = fm.faction_id;
  `);

}
