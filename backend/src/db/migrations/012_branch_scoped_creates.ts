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

/** Nullable FK: NULL = legacy / canon (visible on all branches); non-null = created on a non-main branch only. */
export function migrateBranchScopedCreates(db: Database.Database): void {
  const run = db.transaction(() => {
    addColumnIfMissing(
      db,
      'notes',
      'created_branch_id INTEGER REFERENCES scenario_branches(id) ON DELETE SET NULL',
      'created_branch_id',
    );
    addColumnIfMissing(
      db,
      'timeline_events',
      'created_branch_id INTEGER REFERENCES scenario_branches(id) ON DELETE SET NULL',
      'created_branch_id',
    );
    addColumnIfMissing(
      db,
      'dogmas',
      'created_branch_id INTEGER REFERENCES scenario_branches(id) ON DELETE SET NULL',
      'created_branch_id',
    );
    addColumnIfMissing(
      db,
      'map_markers',
      'created_branch_id INTEGER REFERENCES scenario_branches(id) ON DELETE SET NULL',
      'created_branch_id',
    );
    addColumnIfMissing(
      db,
      'map_territories',
      'created_branch_id INTEGER REFERENCES scenario_branches(id) ON DELETE SET NULL',
      'created_branch_id',
    );

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_notes_project_created_branch ON notes(project_id, created_branch_id);
    `);
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_timeline_project_created_branch ON timeline_events(project_id, created_branch_id);
    `);
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_dogmas_project_created_branch ON dogmas(project_id, created_branch_id);
    `);
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_map_markers_map_created_branch ON map_markers(map_id, created_branch_id);
    `);
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_map_territories_map_created_branch ON map_territories(map_id, created_branch_id);
    `);
  });

  run();
}
