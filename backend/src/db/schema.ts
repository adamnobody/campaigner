import type Database from 'better-sqlite3';

export function createTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived')),
      map_image_path TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      parent_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      title TEXT DEFAULT '',
      race TEXT DEFAULT '',
      character_class TEXT DEFAULT '',
      level INTEGER,
      status TEXT DEFAULT 'alive' CHECK(status IN ('alive', 'dead', 'unknown', 'missing')),
      bio TEXT DEFAULT '',
      appearance TEXT DEFAULT '',
      personality TEXT DEFAULT '',
      backstory TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      image_path TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS character_relationships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      source_character_id INTEGER NOT NULL,
      target_character_id INTEGER NOT NULL,
      relationship_type TEXT NOT NULL CHECK(relationship_type IN ('ally','enemy','family','friend','rival','mentor','student','lover','spouse','employer','employee','custom')),
      custom_label TEXT DEFAULT '',
      description TEXT DEFAULT '',
      is_bidirectional INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (source_character_id) REFERENCES characters(id) ON DELETE CASCADE,
      FOREIGN KEY (target_character_id) REFERENCES characters(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      folder_id INTEGER,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      format TEXT DEFAULT 'md' CHECK(format IN ('md', 'txt')),
      note_type TEXT DEFAULT 'note' CHECK(note_type IN ('wiki', 'note', 'marker_note')),
      is_pinned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS maps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      parent_map_id INTEGER,
      parent_marker_id INTEGER,
      name TEXT NOT NULL,
      image_path TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_map_id) REFERENCES maps(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS map_markers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      map_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      position_x REAL NOT NULL,
      position_y REAL NOT NULL,
      color TEXT DEFAULT '#FF6B6B',
      icon TEXT DEFAULT 'custom',
      linked_note_id INTEGER,
      child_map_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (map_id) REFERENCES maps(id) ON DELETE CASCADE,
      FOREIGN KEY (linked_note_id) REFERENCES notes(id) ON DELETE SET NULL,
      FOREIGN KEY (child_map_id) REFERENCES maps(id) ON DELETE SET NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS timeline_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      event_date TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      era TEXT DEFAULT '',
      linked_note_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (linked_note_id) REFERENCES notes(id) ON DELETE SET NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#808080',
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE(project_id, name)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tag_associations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tag_id INTEGER NOT NULL,
      entity_type TEXT NOT NULL CHECK(entity_type IN ('character', 'note', 'timeline_event', 'dogma')),
      entity_id INTEGER NOT NULL,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
      UNIQUE(tag_id, entity_type, entity_id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS wiki_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      source_note_id INTEGER NOT NULL,
      target_note_id INTEGER NOT NULL,
      label TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (source_note_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY (target_note_id) REFERENCES notes(id) ON DELETE CASCADE,
      UNIQUE(source_note_id, target_note_id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS dogmas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'other' CHECK(category IN ('cosmology','magic','religion','society','politics','economy','history','nature','races','technology','other')),
      description TEXT DEFAULT '',
      impact TEXT DEFAULT '',
      exceptions TEXT DEFAULT '',
      is_public INTEGER DEFAULT 1,
      importance TEXT DEFAULT 'major' CHECK(importance IN ('fundamental','major','minor')),
      status TEXT DEFAULT 'active' CHECK(status IN ('active','deprecated','hidden')),
      sort_order INTEGER DEFAULT 0,
      icon TEXT DEFAULT '',
      color TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS factions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'other',
      custom_type TEXT DEFAULT '',
      state_type TEXT DEFAULT '',
      custom_state_type TEXT DEFAULT '',
      motto TEXT DEFAULT '',
      description TEXT DEFAULT '',
      history TEXT DEFAULT '',
      goals TEXT DEFAULT '',
      headquarters TEXT DEFAULT '',
      territory TEXT DEFAULT '',
      status TEXT DEFAULT 'active' CHECK(status IN ('active','disbanded','secret','exiled','destroyed')),
      color TEXT DEFAULT '',
      secondary_color TEXT DEFAULT '',
      image_path TEXT,
      banner_path TEXT,
      founded_date TEXT DEFAULT '',
      disbanded_date TEXT DEFAULT '',
      parent_faction_id INTEGER,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_faction_id) REFERENCES factions(id) ON DELETE SET NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS faction_ranks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faction_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 0,
      description TEXT DEFAULT '',
      permissions TEXT DEFAULT '',
      icon TEXT DEFAULT '',
      color TEXT DEFAULT '',
      FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS faction_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faction_id INTEGER NOT NULL,
      character_id INTEGER NOT NULL,
      rank_id INTEGER,
      role TEXT DEFAULT '',
      joined_date TEXT DEFAULT '',
      left_date TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      notes TEXT DEFAULT '',
      FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE,
      FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
      FOREIGN KEY (rank_id) REFERENCES faction_ranks(id) ON DELETE SET NULL,
      UNIQUE(faction_id, character_id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS faction_relations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      source_faction_id INTEGER NOT NULL,
      target_faction_id INTEGER NOT NULL,
      relation_type TEXT NOT NULL DEFAULT 'neutral',
      custom_label TEXT DEFAULT '',
      description TEXT DEFAULT '',
      started_date TEXT DEFAULT '',
      is_bidirectional INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (source_faction_id) REFERENCES factions(id) ON DELETE CASCADE,
      FOREIGN KEY (target_faction_id) REFERENCES factions(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS dynasties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      motto TEXT DEFAULT '',
      description TEXT DEFAULT '',
      history TEXT DEFAULT '',
      status TEXT DEFAULT 'active' CHECK(status IN ('active','extinct','exiled','declining','rising')),
      color TEXT DEFAULT '',
      secondary_color TEXT DEFAULT '',
      image_path TEXT,
      founded_date TEXT DEFAULT '',
      extinct_date TEXT DEFAULT '',
      founder_id INTEGER,
      current_leader_id INTEGER,
      heir_id INTEGER,
      linked_faction_id INTEGER,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (founder_id) REFERENCES characters(id) ON DELETE SET NULL,
      FOREIGN KEY (current_leader_id) REFERENCES characters(id) ON DELETE SET NULL,
      FOREIGN KEY (heir_id) REFERENCES characters(id) ON DELETE SET NULL,
      FOREIGN KEY (linked_faction_id) REFERENCES factions(id) ON DELETE SET NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS dynasty_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dynasty_id INTEGER NOT NULL,
      character_id INTEGER NOT NULL,
      generation INTEGER DEFAULT 0,
      role TEXT DEFAULT '',
      birth_date TEXT DEFAULT '',
      death_date TEXT DEFAULT '',
      is_main_line INTEGER DEFAULT 1,
      notes TEXT DEFAULT '',
      FOREIGN KEY (dynasty_id) REFERENCES dynasties(id) ON DELETE CASCADE,
      FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
      UNIQUE(dynasty_id, character_id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS dynasty_family_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dynasty_id INTEGER NOT NULL,
      source_character_id INTEGER NOT NULL,
      target_character_id INTEGER NOT NULL,
      relation_type TEXT NOT NULL CHECK(relation_type IN ('parent','child','spouse','sibling')),
      custom_label TEXT DEFAULT '',
      FOREIGN KEY (dynasty_id) REFERENCES dynasties(id) ON DELETE CASCADE,
      FOREIGN KEY (source_character_id) REFERENCES characters(id) ON DELETE CASCADE,
      FOREIGN KEY (target_character_id) REFERENCES characters(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS dynasty_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dynasty_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      event_date TEXT NOT NULL,
      importance TEXT DEFAULT 'normal' CHECK(importance IN ('critical','major','normal','minor')),
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (dynasty_id) REFERENCES dynasties(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS map_territories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      map_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      color TEXT DEFAULT '#4ECDC4',
      opacity REAL DEFAULT 0.25,
      border_color TEXT DEFAULT '#4ECDC4',
      border_width REAL DEFAULT 2,
      points TEXT NOT NULL DEFAULT '[]',
      faction_id INTEGER,
      smoothing REAL DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (map_id) REFERENCES maps(id) ON DELETE CASCADE,
      FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE SET NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS scenario_branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      parent_branch_id INTEGER,
      base_revision INTEGER DEFAULT 0,
      is_main INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_branch_id) REFERENCES scenario_branches(id) ON DELETE SET NULL,
      UNIQUE(project_id, name)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS branch_overrides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      op TEXT NOT NULL CHECK(op IN ('upsert', 'delete', 'create')),
      patch_json TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (branch_id) REFERENCES scenario_branches(id) ON DELETE CASCADE,
      UNIQUE(branch_id, entity_type, entity_id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS branch_local_entities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL,
      entity_type TEXT NOT NULL,
      local_id TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (branch_id) REFERENCES scenario_branches(id) ON DELETE CASCADE,
      UNIQUE(branch_id, entity_type, local_id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS geo_story_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      branch_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      event_date TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      map_id INTEGER,
      territory_id INTEGER,
      action_type TEXT NOT NULL,
      payload_json TEXT NOT NULL DEFAULT '{}',
      linked_note_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (branch_id) REFERENCES scenario_branches(id) ON DELETE CASCADE,
      FOREIGN KEY (map_id) REFERENCES maps(id) ON DELETE SET NULL,
      FOREIGN KEY (territory_id) REFERENCES map_territories(id) ON DELETE SET NULL,
      FOREIGN KEY (linked_note_id) REFERENCES notes(id) ON DELETE SET NULL
    );
  `);
}

export function createIndexes(db: Database.Database): void {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_characters_project ON characters(project_id);
    CREATE INDEX IF NOT EXISTS idx_characters_name ON characters(project_id, name);
    CREATE INDEX IF NOT EXISTS idx_characters_status ON characters(project_id, status);
    CREATE INDEX IF NOT EXISTS idx_notes_project ON notes(project_id);
    CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder_id);
    CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(project_id, note_type);
    CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(project_id, is_pinned);
    CREATE INDEX IF NOT EXISTS idx_notes_project_type_updated ON notes(project_id, note_type, updated_at);
    CREATE INDEX IF NOT EXISTS idx_notes_project_folder_updated ON notes(project_id, folder_id, updated_at);
    CREATE INDEX IF NOT EXISTS idx_timeline_events_project ON timeline_events(project_id);
    CREATE INDEX IF NOT EXISTS idx_timeline_events_sort ON timeline_events(project_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_folders_project ON folders(project_id);
    CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);
    CREATE INDEX IF NOT EXISTS idx_tags_project ON tags(project_id);
    CREATE INDEX IF NOT EXISTS idx_tag_associations_entity ON tag_associations(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_tag_associations_tag ON tag_associations(tag_id);
    CREATE INDEX IF NOT EXISTS idx_tag_associations_full ON tag_associations(entity_type, entity_id, tag_id);
    CREATE INDEX IF NOT EXISTS idx_relationships_source ON character_relationships(source_character_id);
    CREATE INDEX IF NOT EXISTS idx_relationships_target ON character_relationships(target_character_id);
    CREATE INDEX IF NOT EXISTS idx_relationships_project ON character_relationships(project_id);
    CREATE INDEX IF NOT EXISTS idx_wiki_links_project ON wiki_links(project_id);
    CREATE INDEX IF NOT EXISTS idx_wiki_links_source ON wiki_links(source_note_id);
    CREATE INDEX IF NOT EXISTS idx_wiki_links_target ON wiki_links(target_note_id);
    CREATE INDEX IF NOT EXISTS idx_maps_project ON maps(project_id);
    CREATE INDEX IF NOT EXISTS idx_maps_parent ON maps(parent_map_id);
    CREATE INDEX IF NOT EXISTS idx_map_markers_map ON map_markers(map_id);
    CREATE INDEX IF NOT EXISTS idx_map_markers_map_created ON map_markers(map_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_map_markers_child_map ON map_markers(child_map_id);
    CREATE INDEX IF NOT EXISTS idx_map_territories_map ON map_territories(map_id);
    CREATE INDEX IF NOT EXISTS idx_map_territories_map_sort_created ON map_territories(map_id, sort_order, created_at);
    CREATE INDEX IF NOT EXISTS idx_map_territories_faction ON map_territories(faction_id);
    CREATE INDEX IF NOT EXISTS idx_dogmas_project ON dogmas(project_id);
    CREATE INDEX IF NOT EXISTS idx_dogmas_category ON dogmas(project_id, category);
    CREATE INDEX IF NOT EXISTS idx_dogmas_importance ON dogmas(project_id, importance);
    CREATE INDEX IF NOT EXISTS idx_dogmas_status ON dogmas(project_id, status);
    CREATE INDEX IF NOT EXISTS idx_factions_project ON factions(project_id);
    CREATE INDEX IF NOT EXISTS idx_factions_type ON factions(project_id, type);
    CREATE INDEX IF NOT EXISTS idx_factions_status ON factions(project_id, status);
    CREATE INDEX IF NOT EXISTS idx_factions_parent ON factions(parent_faction_id);
    CREATE INDEX IF NOT EXISTS idx_faction_ranks_faction ON faction_ranks(faction_id);
    CREATE INDEX IF NOT EXISTS idx_faction_ranks_level ON faction_ranks(faction_id, level);
    CREATE INDEX IF NOT EXISTS idx_faction_members_faction ON faction_members(faction_id);
    CREATE INDEX IF NOT EXISTS idx_faction_members_character ON faction_members(character_id);
    CREATE INDEX IF NOT EXISTS idx_faction_members_rank ON faction_members(rank_id);
    CREATE INDEX IF NOT EXISTS idx_faction_relations_project ON faction_relations(project_id);
    CREATE INDEX IF NOT EXISTS idx_faction_relations_source ON faction_relations(source_faction_id);
    CREATE INDEX IF NOT EXISTS idx_faction_relations_target ON faction_relations(target_faction_id);
    CREATE INDEX IF NOT EXISTS idx_dynasties_project ON dynasties(project_id);
    CREATE INDEX IF NOT EXISTS idx_dynasties_status ON dynasties(project_id, status);
    CREATE INDEX IF NOT EXISTS idx_dynasty_members_dynasty ON dynasty_members(dynasty_id);
    CREATE INDEX IF NOT EXISTS idx_dynasty_members_character ON dynasty_members(character_id);
    CREATE INDEX IF NOT EXISTS idx_dynasty_family_links_dynasty ON dynasty_family_links(dynasty_id);
    CREATE INDEX IF NOT EXISTS idx_dynasty_events_dynasty ON dynasty_events(dynasty_id);
    CREATE INDEX IF NOT EXISTS idx_dynasty_events_sort ON dynasty_events(dynasty_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_branches_project ON scenario_branches(project_id);
    CREATE INDEX IF NOT EXISTS idx_branches_parent ON scenario_branches(parent_branch_id);
    CREATE INDEX IF NOT EXISTS idx_branch_overrides_branch_entity ON branch_overrides(branch_id, entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_branch_local_branch_entity ON branch_local_entities(branch_id, entity_type);
    CREATE INDEX IF NOT EXISTS idx_geo_story_branch_date ON geo_story_events(branch_id, event_date, sort_order);
    CREATE INDEX IF NOT EXISTS idx_geo_story_map ON geo_story_events(map_id);
    CREATE INDEX IF NOT EXISTS idx_geo_story_territory ON geo_story_events(territory_id);
  `);
}
