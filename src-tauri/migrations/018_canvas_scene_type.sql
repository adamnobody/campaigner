-- Add scene_type column to canvas_scene
ALTER TABLE canvas_scene ADD COLUMN scene_type TEXT CHECK(scene_type IN ('root_canvas', 'map'));

-- Recreate canvas_object to update CHECK constraint for kind to include 'scene_container'
CREATE TABLE canvas_object_new (
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
    'group',
    'scene_container'
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

-- Copy data from old table to new table
INSERT INTO canvas_object_new (
  id, scene_id, layer_id, kind, name, z_index, transform_json, geometry_json,
  style_json, content_json, resource_path, linked_note_id, linked_scene_id,
  is_hidden, is_locked, created_branch_id, created_at, updated_at
)
SELECT
  id, scene_id, layer_id, kind, name, z_index, transform_json, geometry_json,
  style_json, content_json, resource_path, linked_note_id, linked_scene_id,
  is_hidden, is_locked, created_branch_id, created_at, updated_at
FROM canvas_object;

-- Drop old table and rename new table
DROP TABLE canvas_object;
ALTER TABLE canvas_object_new RENAME TO canvas_object;

-- Recreate indexes on canvas_object
CREATE INDEX IF NOT EXISTS idx_canvas_object_scene ON canvas_object(scene_id);
CREATE INDEX IF NOT EXISTS idx_canvas_object_scene_layer_z ON canvas_object(scene_id, layer_id, z_index);
CREATE INDEX IF NOT EXISTS idx_canvas_object_scene_kind ON canvas_object(scene_id, kind);
CREATE INDEX IF NOT EXISTS idx_canvas_object_scene_branch ON canvas_object(scene_id, created_branch_id);
CREATE INDEX IF NOT EXISTS idx_canvas_object_linked_scene ON canvas_object(linked_scene_id);
