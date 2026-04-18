import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createTables, createIndexes } from './schema.js';
import { migrateFactionPolicies } from './migrations/004_faction_policies.js';
import { migrateTagAssociationsForDynasty } from './migrations/002_tag_associations_dynasty.js';
import { migrateDynastyMembersGraph } from './migrations/003_dynasty_members_graph.js';
import { migrateFactionAmbitions } from './migrations/005_faction_ambitions.js';
import { migrateTraitAndAmbitionExclusions } from './migrations/006_trait_and_ambition_exclusions.js';
import { migrateFactionTypesAndCharacterAffiliations } from './migrations/007_faction_types_and_character_affiliations.js';
import { migrateFactionKindAndMembershipSync } from './migrations/008_faction_kind_and_membership_sync.js';
import { migrateFactionMetrics } from './migrations/009_faction_metrics.js';
import { migratePoliticalScales } from './migrations/010_political_scales.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DATABASE_PATH
  ? path.resolve(__dirname, '../../../', process.env.DATABASE_PATH)
  : path.resolve(__dirname, '../../../data/campaigner.sqlite');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initializeDatabase(): void {
  const database = getDb();

  createTables(database);
  migrateFactionPolicies(database);
  migrateTagAssociationsForDynasty(database);
  migrateDynastyMembersGraph(database);
  migrateFactionAmbitions(database);
  migrateTraitAndAmbitionExclusions(database);
  migrateFactionTypesAndCharacterAffiliations(database);
  migrateFactionKindAndMembershipSync(database);
  migrateFactionMetrics(database);
  migratePoliticalScales(database);
  createIndexes(database);

  console.log('✅ Database initialized successfully');
}

export function closeDatabase(): void {
  if (db) {
    db.close();
  }
}
