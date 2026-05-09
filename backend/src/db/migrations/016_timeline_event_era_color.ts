import type Database from 'better-sqlite3';

export function migrateTimelineEventEraColor016(database: Database.Database): void {
  const cols = database.prepare(`PRAGMA table_info(timeline_events)`).all() as Array<{ name: string }>;
  if (cols.some((c) => c.name === 'era_color')) return;
  database.exec(`ALTER TABLE timeline_events ADD COLUMN era_color TEXT DEFAULT '';`);
}
