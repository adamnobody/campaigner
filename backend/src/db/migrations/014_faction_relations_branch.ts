import type Database from 'better-sqlite3';

function hasColumn(db: Database.Database, tableName: string, columnName: string): boolean {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  return columns.some((column) => column.name === columnName);
}

/** Branch scope for faction_relations (same snapshot rules as factions). */
export function migrateFactionRelationsBranch014(db: Database.Database): void {
  const run = db.transaction(() => {
    if (!hasColumn(db, 'faction_relations', 'created_branch_id')) {
      db.exec(
        `ALTER TABLE faction_relations ADD COLUMN created_branch_id INTEGER REFERENCES scenario_branches(id) ON DELETE SET NULL;`,
      );
    }

    const projects = db.prepare('SELECT id FROM projects').all() as Array<{ id: number }>;

    for (const { id: projectId } of projects) {
      const main = db
        .prepare(`SELECT id FROM scenario_branches WHERE project_id = ? AND is_main = 1 LIMIT 1`)
        .get(projectId) as { id: number } | undefined;

      if (!main) continue;

      if (hasColumn(db, 'faction_relations', 'created_branch_id')) {
        db.prepare(
          `UPDATE faction_relations SET created_branch_id = ? WHERE project_id = ? AND created_branch_id IS NULL`,
        ).run(main.id, projectId);
      }
    }
  });

  run();
}
