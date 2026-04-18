import type Database from 'better-sqlite3';
import { SYSTEM_POLITICAL_SCALES_SEED } from '../seeds/politicalScalesSeedData.js';

function hasColumn(db: Database.Database, tableName: string, columnName: string): boolean {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  return columns.some((column) => column.name === columnName);
}

function addColumnIfMissing(db: Database.Database, tableName: string, columnDef: string, columnName: string): void {
  if (!hasColumn(db, tableName, columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnDef};`);
  }
}

export function migratePoliticalScales(db: Database.Database): void {
  const run = db.transaction(() => {
    addColumnIfMissing(db, 'faction_policies', "category TEXT NOT NULL DEFAULT 'other'", 'category');
    addColumnIfMissing(db, 'faction_policies', 'enacted_date TEXT', 'enacted_date');

    db.exec(`
      CREATE TABLE IF NOT EXISTS political_scales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL,
        entity_type TEXT NOT NULL CHECK(entity_type IN ('state','faction')),
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        left_pole_label TEXT NOT NULL,
        right_pole_label TEXT NOT NULL,
        left_pole_description TEXT NOT NULL DEFAULT '',
        right_pole_description TEXT NOT NULL DEFAULT '',
        icon TEXT,
        zones_json TEXT,
        is_system INTEGER NOT NULL DEFAULT 0,
        project_id INTEGER,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        CHECK (
          (is_system = 1 AND project_id IS NULL) OR
          (is_system = 0 AND project_id IS NOT NULL)
        )
      );
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS political_scale_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scale_id INTEGER NOT NULL,
        entity_type TEXT NOT NULL CHECK(entity_type IN ('state','faction')),
        entity_id INTEGER NOT NULL,
        value INTEGER NOT NULL DEFAULT 0 CHECK(value >= -100 AND value <= 100),
        enabled INTEGER NOT NULL DEFAULT 1,
        note TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (scale_id) REFERENCES political_scales(id) ON DELETE CASCADE,
        FOREIGN KEY (entity_id) REFERENCES factions(id) ON DELETE CASCADE,
        UNIQUE(scale_id, entity_type, entity_id)
      );
    `);

    db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_political_scales_code_unique ON political_scales(code);
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_political_scales_entity_project ON political_scales(entity_type, project_id);
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_psa_entity ON political_scale_assignments(entity_type, entity_id);
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_psa_scale ON political_scale_assignments(scale_id);
    `);

    const insertScale = db.prepare(`
      INSERT OR IGNORE INTO political_scales (
        code, entity_type, category, name,
        left_pole_label, right_pole_label,
        left_pole_description, right_pole_description,
        icon, zones_json, is_system, project_id, sort_order
      ) VALUES (
        @code, @entity_type, @category, @name,
        @left_pole_label, @right_pole_label,
        @left_pole_description, @right_pole_description,
        NULL, @zones_json, 1, NULL, @sort_order
      );
    `);

    for (const row of SYSTEM_POLITICAL_SCALES_SEED) {
      insertScale.run({
        code: row.code,
        entity_type: row.entityType,
        category: row.category,
        name: row.name,
        left_pole_label: row.leftPoleLabel,
        right_pole_label: row.rightPoleLabel,
        left_pole_description: row.leftPoleDescription,
        right_pole_description: row.rightPoleDescription,
        zones_json: row.zonesJson,
        sort_order: row.sortOrder,
      });
    }
  });

  run();
}
