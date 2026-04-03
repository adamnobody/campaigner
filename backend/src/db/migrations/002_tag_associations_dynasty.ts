import type Database from 'better-sqlite3';

export function migrateTagAssociationsForDynasty(db: Database.Database): void {
  try {
    const tableInfo = db.prepare(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='tag_associations'"
    ).get() as { sql: string } | undefined;

    if (tableInfo && tableInfo.sql && !tableInfo.sql.includes("'dynasty'")) {
      console.log('🔄 Migrating tag_associations to support dynasty...');
      db.exec(`
        CREATE TABLE tag_associations_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tag_id INTEGER NOT NULL,
          entity_type TEXT NOT NULL CHECK(entity_type IN ('character', 'note', 'timeline_event', 'dogma', 'faction', 'dynasty')),
          entity_id INTEGER NOT NULL,
          FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
          UNIQUE(tag_id, entity_type, entity_id)
        );
        INSERT INTO tag_associations_new SELECT * FROM tag_associations;
        DROP TABLE tag_associations;
        ALTER TABLE tag_associations_new RENAME TO tag_associations;
      `);
      console.log('✅ tag_associations migrated for dynasty');
    }
  } catch (e) {
    console.warn('⚠️ tag_associations migration skipped:', e);
  }
}
