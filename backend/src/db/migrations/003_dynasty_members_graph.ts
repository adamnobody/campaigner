import type Database from 'better-sqlite3';

export function migrateDynastyMembersGraph(db: Database.Database): void {
  try {
    const colInfo = db.prepare("PRAGMA table_info(dynasty_members)").all() as Array<{ name: string }>;
    const hasGraphX = colInfo.some((c) => c.name === 'graph_x');
    if (!hasGraphX) {
      console.log('🔄 Migrating dynasty_members: adding graph_x, graph_y...');
      db.exec(`ALTER TABLE dynasty_members ADD COLUMN graph_x REAL DEFAULT NULL`);
      db.exec(`ALTER TABLE dynasty_members ADD COLUMN graph_y REAL DEFAULT NULL`);
      console.log('✅ dynasty_members migrated');
    }
  } catch (e) {
    console.warn('⚠️ dynasty_members graph migration skipped:', e);
  }
}
