import type Database from 'better-sqlite3';

/**
 * **Destructive migration (merge / PR note):** `004_faction_policies` intentionally does **not**
 * migrate legacy rows from `project_policies` or `policy_faction_links`. Those tables are dropped
 * and any previous policy data is lost. This is an **explicit, agreed clean reset** when moving to
 * faction-scoped `faction_policies`, not an oversight.
 *
 * After the DROPs, ensures `faction_policies` exists (CREATE IF NOT EXISTS).
 */
export function migrateFactionPolicies(db: Database.Database): void {
  db.exec(`
    DROP TABLE IF EXISTS policy_faction_links;
    DROP TABLE IF EXISTS project_policies;
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS faction_policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faction_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('ambition','policy')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('planned','active','archived')),
      description TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE
    );
  `);
}
