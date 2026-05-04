import type Database from 'better-sqlite3';

function hasColumn(db: Database.Database, tableName: string, columnName: string): boolean {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  return columns.some((column) => column.name === columnName);
}

/** Adds created_branch_id to world entities; backfills NULL → main branch (per project) for snapshot inheritance. */
export function migrateBranchVisibilityV020(db: Database.Database): void {
  const run = db.transaction(() => {
    const tables = [
      'characters',
      'factions',
      'dynasties',
      'maps',
      'wiki_links',
      'character_relationships',
    ] as const;

    for (const table of tables) {
      if (!hasColumn(db, table, 'created_branch_id')) {
        db.exec(
          `ALTER TABLE ${table} ADD COLUMN created_branch_id INTEGER REFERENCES scenario_branches(id) ON DELETE SET NULL;`,
        );
      }
    }

    const projects = db.prepare('SELECT id FROM projects').all() as Array<{ id: number }>;

    for (const { id: projectId } of projects) {
      const main = db
        .prepare(
          `SELECT id FROM scenario_branches WHERE project_id = ? AND is_main = 1 LIMIT 1`,
        )
        .get(projectId) as { id: number } | undefined;

      if (!main) continue;

      const scopedTables = [
        'notes',
        'timeline_events',
        'dogmas',
        'map_markers',
        'map_territories',
        'characters',
        'factions',
        'dynasties',
        'maps',
        'wiki_links',
        'character_relationships',
      ] as const;

      for (const table of scopedTables) {
        if (!hasColumn(db, table, 'created_branch_id')) continue;
        db.prepare(`UPDATE ${table} SET created_branch_id = ? WHERE created_branch_id IS NULL`).run(
          main.id,
        );
      }
    }
  });

  run();
}
