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

export function migrateFactionMetrics(db: Database.Database): void {
  const run = db.transaction(() => {
    addColumnIfMissing(db, 'factions', 'treasury INTEGER', 'treasury');
    addColumnIfMissing(db, 'factions', 'population INTEGER', 'population');
    addColumnIfMissing(db, 'factions', 'army_size INTEGER', 'army_size');
    addColumnIfMissing(db, 'factions', 'navy_size INTEGER', 'navy_size');
    addColumnIfMissing(db, 'factions', 'territory_km2 INTEGER', 'territory_km2');
    addColumnIfMissing(db, 'factions', 'annual_income INTEGER', 'annual_income');
    addColumnIfMissing(db, 'factions', 'annual_expenses INTEGER', 'annual_expenses');
    addColumnIfMissing(db, 'factions', 'members_count INTEGER', 'members_count');
    addColumnIfMissing(
      db,
      'factions',
      "influence INTEGER CHECK (influence IS NULL OR (influence >= 0 AND influence <= 100))",
      'influence'
    );

    db.exec(`
      CREATE TABLE IF NOT EXISTS faction_custom_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        faction_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        value REAL NOT NULL,
        unit TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE,
        UNIQUE(faction_id, name)
      );
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_faction_custom_metrics_faction_id ON faction_custom_metrics(faction_id);');
    db.exec('DROP TABLE IF EXISTS faction_assets;');
  });
  run();
}
