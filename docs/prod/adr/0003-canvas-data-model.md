# ADR-0003: Canvas data model for unified MapPage replacement

## Status

Status: Accepted
Accepted: 2026-05-24

## Context

ADR-0001 accepted PixiJS v8 as the rendering technology and validated it in prototype 001 (`docs/prod/adr/0001-canvas-rendering-technology.md`).
ADR-0002 accepted option (a) Full replacement, requiring one map experience and removing legacy DOM/SVG persistence and rendering paths in 0.3.1 (`docs/prod/adr/0002-mappage-migration-strategy.md`).

Current mainline map persistence is split across `maps`, `map_markers`, and `map_territories` from `src-tauri/migrations/015_maps.sql`, with DTOs and commands in `src-tauri/src/models/map.rs`, `src-tauri/src/commands/maps.rs`, and `src-tauri/src/repositories/maps.rs`. Current frontend rendering is DOM image + SVG territory + DOM marker composition in `frontend/src/pages/maps/MapPage.tsx` and related hooks/components documented in `docs/prod/plans/0.3.1-canvas/00-repo-audit.md`.

## Decision

### 1) New persistence schema

0.3.1 introduces three canonical tables:

#### `canvas_scene`

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE`
- `parent_scene_id INTEGER NULL REFERENCES canvas_scene(id) ON DELETE CASCADE`
- `parent_object_id INTEGER NULL REFERENCES canvas_object(id) ON DELETE SET NULL`
- `name TEXT NOT NULL`
- `background_path TEXT NULL` (uploads web path; replaces `maps.image_path`)
- `viewport_json TEXT NOT NULL DEFAULT '{}'` (serialized camera/view state)
- `metadata_json TEXT NOT NULL DEFAULT '{}'` (scene-level engine-agnostic metadata)
- `created_branch_id INTEGER NULL REFERENCES scenario_branches(id) ON DELETE SET NULL`
- `created_at TEXT DEFAULT (datetime('now'))`
- `updated_at TEXT DEFAULT (datetime('now'))`

Indexes:
- `idx_canvas_scene_project (project_id)`
- `idx_canvas_scene_parent (parent_scene_id)`
- `idx_canvas_scene_project_branch (project_id, created_branch_id)`
- `idx_canvas_scene_parent_object (parent_object_id)`

#### `canvas_layer`

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `scene_id INTEGER NOT NULL REFERENCES canvas_scene(id) ON DELETE CASCADE`
- `name TEXT NOT NULL`
- `kind TEXT NOT NULL` (`background`, `content`, `overlay`, `annotation`, `ui_helper`)
- `z_index INTEGER NOT NULL`
- `is_hidden INTEGER NOT NULL DEFAULT 0`
- `is_locked INTEGER NOT NULL DEFAULT 0`
- `opacity REAL NOT NULL DEFAULT 1.0`
- `blend_mode TEXT NOT NULL DEFAULT 'normal'`
- `metadata_json TEXT NOT NULL DEFAULT '{}'`
- `created_branch_id INTEGER NULL REFERENCES scenario_branches(id) ON DELETE SET NULL`
- `created_at TEXT DEFAULT (datetime('now'))`
- `updated_at TEXT DEFAULT (datetime('now'))`

Indexes:
- `idx_canvas_layer_scene (scene_id)`
- `idx_canvas_layer_scene_z (scene_id, z_index)`
- `idx_canvas_layer_scene_branch (scene_id, created_branch_id)`

#### `canvas_object`

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `scene_id INTEGER NOT NULL REFERENCES canvas_scene(id) ON DELETE CASCADE`
- `layer_id INTEGER NOT NULL REFERENCES canvas_layer(id) ON DELETE CASCADE`
- `kind TEXT NOT NULL` (discriminated union discriminator)
- `name TEXT NULL`
- `z_index INTEGER NOT NULL`
- `transform_json TEXT NOT NULL` (position/rotation/scale/anchor)
- `geometry_json TEXT NOT NULL DEFAULT '{}'` (shape/path/points/etc.)
- `style_json TEXT NOT NULL DEFAULT '{}'` (stroke/fill/filters/text style metadata)
- `content_json TEXT NOT NULL DEFAULT '{}'` (text payload, image params, object-kind extras)
- `resource_path TEXT NULL` (image/asset path when applicable)
- `linked_note_id INTEGER NULL REFERENCES notes(id) ON DELETE SET NULL`
- `linked_scene_id INTEGER NULL REFERENCES canvas_scene(id) ON DELETE SET NULL`
- `is_hidden INTEGER NOT NULL DEFAULT 0`
- `is_locked INTEGER NOT NULL DEFAULT 0`
- `created_branch_id INTEGER NULL REFERENCES scenario_branches(id) ON DELETE SET NULL`
- `created_at TEXT DEFAULT (datetime('now'))`
- `updated_at TEXT DEFAULT (datetime('now'))`

Indexes:
- `idx_canvas_object_scene (scene_id)`
- `idx_canvas_object_scene_layer_z (scene_id, layer_id, z_index)`
- `idx_canvas_object_scene_kind (scene_id, kind)`
- `idx_canvas_object_scene_branch (scene_id, created_branch_id)`
- `idx_canvas_object_linked_scene (linked_scene_id)`

### 2) Legacy map model replacement

Given ADR-0002 Full replacement, `maps`, `map_markers`, and `map_territories` are removed in 0.3.1 migrations and replaced by `canvas_scene`, `canvas_layer`, and `canvas_object`.

Migration decision for the two internal testers: run a one-time migration script before release that converts existing map rows into canvas rows. If a tester chooses not to run migration before upgrading, legacy map data is considered non-supported and may be lost. No legacy persistence remains in-app after 0.3.1.

### 3) `canvas_object.kind` discriminated union

The canonical object kinds in 0.3.1 are:

- `territory` (semantic region object; faction-aware metadata)
- `marker` (point marker; note/link metadata)
- `curve_text` (text bound to curve path)
- `text` (plain text block)
- `polygon`
- `polyline`
- `rectangle`
- `ellipse`
- `image`
- `icon`
- `group`

All kind-specific payloads are stored in `geometry_json` and `content_json`; `kind` is the single discriminator for frontend and backend DTOs.

### 4) Z-order model

Z-order is stored explicitly with `z_index` on both `canvas_layer` and `canvas_object`:

- Layer draw order: ascending `canvas_layer.z_index`.
- Object draw order inside a layer: ascending `canvas_object.z_index`.
- Reorder operations update only affected contiguous ranges (no array-position persistence).

This keeps ordering queryable and branch-overlay-friendly in SQLite while avoiding full-scene rewrites for simple reorders.

### 5) Branch-overlay interaction

Canvas entities use the same branch model already used by maps:

- Base rows use `created_branch_id` visibility rules aligned with existing branch scope behavior (`src-tauri/src/services/branch_scope.rs`).
- Branch edits for scene/layer/object are stored as `branch_overrides` records with new `entity_type` values: `canvas_scene`, `canvas_layer`, `canvas_object`, and merged via existing overlay mechanics (`src-tauri/src/services/branch_overlay.rs`).
- CRUD repository methods follow the same pattern currently used in `src-tauri/src/repositories/maps.rs`: base read + visibility filter + overlay application + branch upsert/delete overrides for branch-local edits.

### 6) New Tauri commands (signatures only)

Commands are added as thin wrappers in `src-tauri/src/commands/canvas.rs` and registered in `src-tauri/src/lib.rs` similarly to existing map commands.

Scene:
- `canvas_scenes_get_root_command(State<'_, DatabaseState>, GetRootCanvasSceneInput) -> Result<Option<CanvasScene>>`
- `canvas_scenes_get_tree_command(State<'_, DatabaseState>, GetCanvasSceneTreeInput) -> Result<Vec<CanvasScene>>`
- `canvas_scenes_get_command(State<'_, DatabaseState>, GetCanvasSceneInput) -> Result<CanvasScene>`
- `canvas_scenes_create_command(State<'_, DatabaseState>, CreateCanvasSceneInput) -> Result<CanvasScene>`
- `canvas_scenes_update_command(State<'_, DatabaseState>, UpdateCanvasSceneInput) -> Result<CanvasScene>`
- `canvas_scenes_delete_command(State<'_, DatabaseState>, DeleteCanvasSceneInput) -> Result<()>`

Layer:
- `canvas_layers_list_command(State<'_, DatabaseState>, ListCanvasLayersInput) -> Result<Vec<CanvasLayer>>`
- `canvas_layers_create_command(State<'_, DatabaseState>, CreateCanvasLayerInput) -> Result<CanvasLayer>`
- `canvas_layers_update_command(State<'_, DatabaseState>, UpdateCanvasLayerInput) -> Result<CanvasLayer>`
- `canvas_layers_delete_command(State<'_, DatabaseState>, DeleteCanvasLayerInput) -> Result<()>`
- `canvas_layers_reorder_command(State<'_, DatabaseState>, ReorderCanvasLayersInput) -> Result<Vec<CanvasLayer>>`

Object:
- `canvas_objects_list_command(State<'_, DatabaseState>, ListCanvasObjectsInput) -> Result<Vec<CanvasObject>>`
- `canvas_objects_get_command(State<'_, DatabaseState>, GetCanvasObjectInput) -> Result<CanvasObject>`
- `canvas_objects_create_command(State<'_, DatabaseState>, CreateCanvasObjectInput) -> Result<CanvasObject>`
- `canvas_objects_update_command(State<'_, DatabaseState>, UpdateCanvasObjectInput) -> Result<CanvasObject>`
- `canvas_objects_delete_command(State<'_, DatabaseState>, DeleteCanvasObjectInput) -> Result<()>`
- `canvas_objects_reorder_command(State<'_, DatabaseState>, ReorderCanvasObjectsInput) -> Result<Vec<CanvasObject>>`

Bulk/reconciler:
- `canvas_objects_bulk_upsert_command(State<'_, DatabaseState>, BulkUpsertCanvasObjectsInput) -> Result<Vec<CanvasObject>>`
- `canvas_objects_bulk_delete_command(State<'_, DatabaseState>, BulkDeleteCanvasObjectsInput) -> Result<()>`
- `canvas_reconcile_scene_command(State<'_, DatabaseState>, ReconcileCanvasSceneInput) -> Result<CanvasReconcileResult>`

### 7) Specta bindings

New canvas DTO/input/output types are added under `src-tauri/src/models/canvas.rs`, exported via `src-tauri/src/specta.rs`, and generated to `frontend/src/types/generated/bindings.ts` by the existing codegen binary (`src-tauri/src/bin/codegen.rs`) through `npm run tauri:codegen` (`package.json` script `tauri:codegen`).

## Consequences

### Frontend

- `frontend/src/api/maps.ts` transitions to canvas-oriented API calls, and map pages stop depending on legacy marker/territory DTOs from `src-tauri/src/models/map.rs`.
- `frontend/src/pages/maps/MapPage.tsx` no longer composes DOM image + SVG + DOM markers and instead reads a unified scene/layer/object model.
- Renderer reconciler can batch writes through new bulk commands instead of per-object granular RPC chatter.

### Backend

- New repository and service modules are added for canvas entities, reusing existing branch overlay infrastructure instead of introducing a parallel branching implementation.
- Existing map commands and DTOs become removable after migration completes.
- Search/export/import surfaces that currently reference map/marker/territory payloads must be aligned to canvas schema in subsequent implementation tasks.

### Migrations and operations

- 0.3.1 DB migrations create canvas tables, backfill/migrate internal tester data, then drop `map_territories`, `map_markers`, and `maps`.
- Release notes and tester communication must explicitly state legacy map data handling and non-support for old persistence post-release.

## References

- `docs/prod/adr/0001-canvas-rendering-technology.md`
- `docs/prod/adr/0002-mappage-migration-strategy.md`
- `docs/prod/plans/0.3.1-canvas/00-repo-audit.md`
- `src-tauri/migrations/015_maps.sql`
- `src-tauri/src/models/map.rs`
- `src-tauri/src/commands/maps.rs`
- `src-tauri/src/repositories/maps.rs`
- `src-tauri/src/services/branch_overlay.rs`
- `src-tauri/src/services/branch_scope.rs`
- `src-tauri/src/specta.rs`
- `src-tauri/src/bin/codegen.rs`
- `package.json`
