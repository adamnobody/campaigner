CREATE TABLE IF NOT EXISTS canvas_scene (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_scene_id INTEGER REFERENCES canvas_scene(id) ON DELETE CASCADE,
  parent_object_id INTEGER REFERENCES canvas_object(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  background_path TEXT,
  viewport_json TEXT NOT NULL DEFAULT '{}',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_branch_id INTEGER REFERENCES scenario_branches(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS canvas_layer (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scene_id INTEGER NOT NULL REFERENCES canvas_scene(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('background', 'content', 'overlay', 'annotation', 'ui_helper')),
  z_index INTEGER NOT NULL,
  is_hidden INTEGER NOT NULL DEFAULT 0,
  is_locked INTEGER NOT NULL DEFAULT 0,
  opacity REAL NOT NULL DEFAULT 1.0,
  blend_mode TEXT NOT NULL DEFAULT 'normal',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_branch_id INTEGER REFERENCES scenario_branches(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS canvas_object (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scene_id INTEGER NOT NULL REFERENCES canvas_scene(id) ON DELETE CASCADE,
  layer_id INTEGER NOT NULL REFERENCES canvas_layer(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK(kind IN (
    'territory',
    'marker',
    'curve_text',
    'text',
    'polygon',
    'polyline',
    'rectangle',
    'ellipse',
    'image',
    'icon',
    'group'
  )),
  name TEXT,
  z_index INTEGER NOT NULL,
  transform_json TEXT NOT NULL,
  geometry_json TEXT NOT NULL DEFAULT '{}',
  style_json TEXT NOT NULL DEFAULT '{}',
  content_json TEXT NOT NULL DEFAULT '{}',
  resource_path TEXT,
  linked_note_id INTEGER REFERENCES notes(id) ON DELETE SET NULL,
  linked_scene_id INTEGER REFERENCES canvas_scene(id) ON DELETE SET NULL,
  is_hidden INTEGER NOT NULL DEFAULT 0,
  is_locked INTEGER NOT NULL DEFAULT 0,
  created_branch_id INTEGER REFERENCES scenario_branches(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_canvas_scene_project ON canvas_scene(project_id);
CREATE INDEX IF NOT EXISTS idx_canvas_scene_parent ON canvas_scene(parent_scene_id);
CREATE INDEX IF NOT EXISTS idx_canvas_scene_project_branch ON canvas_scene(project_id, created_branch_id);
CREATE INDEX IF NOT EXISTS idx_canvas_scene_parent_object ON canvas_scene(parent_object_id);

CREATE INDEX IF NOT EXISTS idx_canvas_layer_scene ON canvas_layer(scene_id);
CREATE INDEX IF NOT EXISTS idx_canvas_layer_scene_z ON canvas_layer(scene_id, z_index);
CREATE INDEX IF NOT EXISTS idx_canvas_layer_scene_branch ON canvas_layer(scene_id, created_branch_id);

CREATE INDEX IF NOT EXISTS idx_canvas_object_scene ON canvas_object(scene_id);
CREATE INDEX IF NOT EXISTS idx_canvas_object_scene_layer_z ON canvas_object(scene_id, layer_id, z_index);
CREATE INDEX IF NOT EXISTS idx_canvas_object_scene_kind ON canvas_object(scene_id, kind);
CREATE INDEX IF NOT EXISTS idx_canvas_object_scene_branch ON canvas_object(scene_id, created_branch_id);
CREATE INDEX IF NOT EXISTS idx_canvas_object_linked_scene ON canvas_object(linked_scene_id);

DROP TABLE IF EXISTS map_territories;
DROP TABLE IF EXISTS map_markers;
DROP TABLE IF EXISTS maps;
