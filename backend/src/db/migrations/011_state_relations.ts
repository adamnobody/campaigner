import type Database from 'better-sqlite3';

function hasColumn(db: Database.Database, tableName: string, columnName: string): boolean {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  return columns.some((column) => column.name === columnName);
}

function addColumnIfMissing(db: Database.Database, tableName: string, columnDef: string, columnName: string): void {
  if (!hasColumn(db, tableName, columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnDef};`);
  }
}

/** FKs: ruling dynasty / ruler character; map_territories.faction_id unchanged. */
export function migrateStateRelations(db: Database.Database): void {
  const run = db.transaction(() => {
    addColumnIfMissing(
      db,
      'factions',
      'ruling_dynasty_id INTEGER REFERENCES dynasties(id) ON DELETE SET NULL',
      'ruling_dynasty_id'
    );
    addColumnIfMissing(
      db,
      'factions',
      'ruler_character_id INTEGER REFERENCES characters(id) ON DELETE SET NULL',
      'ruler_character_id'
    );

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_factions_ruling_dynasty ON factions(ruling_dynasty_id);
    `);
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_factions_ruler_character ON factions(ruler_character_id);
    `);
  });

  run();
}
