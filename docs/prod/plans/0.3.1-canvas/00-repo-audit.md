# 0.3.1 Canvas — Repository Audit Baseline

> **Historical.** Baseline audit before mainline canvas migration. Implementation and parity tracks are closed; see `docs/prod/vision/canvas.md` §6.

Status: factual baseline for ADR-0002 / ADR-0003. No implementation decisions are made here.

## Corrections from pre-audit discussion

- Correction: `docs/prod/adr/0001-canvas-rendering-engine.md` does not exist in this repository. The existing ADR-0001 file is `docs/prod/adr/0001-canvas-rendering-technology.md`; `AGENTS.md` also points to that path (`AGENTS.md:11-12`).
- Correction: the current DOM/SVG `MapPage` already supports territory click-selection. SVG transparent hit paths call `onTerritoryClick` (`frontend/src/pages/maps/components/MapTerritorySvg.tsx:354-369`), and fallback point-in-territory selection is implemented in `handleMapClick` (`frontend/src/pages/maps/hooks/useMapInteractions.ts:328-382`).
- Correction: the "No UI framework" rule is scoped to prototype 001. Mainline currently uses MUI dependencies in `frontend/package.json:21-29`; the prototype rule lives in `.cursor/rules/prototype-canvas.mdc`.

## 2.1 Current MapPage Stack

### Main page component

| File | Lines | Responsibility | Evidence |
| --- | ---: | --- | --- |
| `frontend/src/pages/maps/MapPage.tsx` | 736 | Route-level map page that loads map data, owns current mode and selected marker/territory state, composes toolbar, DOM image background, SVG territory overlay, marker overlay, dialogs, and side panels. | State and hooks: `frontend/src/pages/maps/MapPage.tsx:39-115`; render composition: `frontend/src/pages/maps/MapPage.tsx:476-735`. |

### Custom hooks serving the map

| File | Lines | Responsibility | Evidence |
| --- | ---: | --- | --- |
| `frontend/src/pages/maps/hooks/useMapViewport.ts` | 136 | Owns DOM pan/zoom refs, CSS transform application, wheel zoom, fit-to-screen, zoom buttons, and reset view. | `frontend/src/pages/maps/hooks/useMapViewport.ts:11-14`, `frontend/src/pages/maps/hooks/useMapViewport.ts:23-29`, `frontend/src/pages/maps/hooks/useMapViewport.ts:52-82`, `frontend/src/pages/maps/hooks/useMapViewport.ts:120-135`. |
| `frontend/src/pages/maps/hooks/useMapInitialFit.ts` | 92 | Fits the loaded map image into the viewport when image/map state changes. | Used from `MapPage` with map image dimensions and `fitToScreen`: `frontend/src/pages/maps/MapPage.tsx:161-173`. |
| `frontend/src/pages/maps/hooks/useMapData.ts` | 169 | Loads project/map/markers/territories/notes/factions data for `MapPage`. | Destructured by `MapPage`: `frontend/src/pages/maps/MapPage.tsx:86-115`. |
| `frontend/src/pages/maps/hooks/useMapNavigation.ts` | 41 | Manages map breadcrumb navigation and child-map navigation. | Destructured by `MapPage`: `frontend/src/pages/maps/MapPage.tsx:175-181`. |
| `frontend/src/pages/maps/hooks/useMapMarkerCrud.ts` | 277 | Handles marker dialog state, marker drag/save/delete/edit, child map file state, and map image upload. | Destructured by `MapPage`: `frontend/src/pages/maps/MapPage.tsx:188-221`. |
| `frontend/src/pages/maps/hooks/useMapTerritoryCrud.ts` | 263 | Handles territory dialog state, create/update/delete, point editing, vertex insertion/deletion, and save/cancel flows. | Destructured by `MapPage`: `frontend/src/pages/maps/MapPage.tsx:223-254`. |
| `frontend/src/pages/maps/hooks/useMapTerritoryDrawing.ts` | 83 | Holds in-progress territory rings and points, undo, contour completion, and create-dialog snapshot building. | Destructured by `MapPage`: `frontend/src/pages/maps/MapPage.tsx:62-72`. |
| `frontend/src/pages/maps/hooks/useMapInteractions.ts` | 462 | Handles map mouse events, panning, marker click/double-click, territory click, drawing clicks, territory edit hit checks, and selected panel state. | Hook arguments and selected state wiring: `frontend/src/pages/maps/hooks/useMapInteractions.ts:13-53`; `MapPage` usage: `frontend/src/pages/maps/MapPage.tsx:293-351`; territory hit handling: `frontend/src/pages/maps/hooks/useMapInteractions.ts:328-382`. |

### Sub-components serving the map

| File | Lines | Responsibility | Evidence |
| --- | ---: | --- | --- |
| `frontend/src/pages/maps/components/MapToolbar.tsx` | 197 | Toolbar for map mode, breadcrumbs, drawing controls, zoom controls, counts, and upload action. | Rendered by `MapPage`: `frontend/src/pages/maps/MapPage.tsx:478-497`. |
| `frontend/src/pages/maps/components/MapTerritorySvg.tsx` | 578 | SVG overlay for territory fill/borders/effects, draft drawing, selection visual, transparent hit paths, labels, edit points, and edge insertion preview. | Main territory render: `frontend/src/pages/maps/components/MapTerritorySvg.tsx:258-372`; rendered by `MapPage`: `frontend/src/pages/maps/MapPage.tsx:568-586`. |
| `frontend/src/pages/maps/components/MapMarkerOnMap.tsx` | 108 | DOM marker overlay item for each map marker, including selected/drag visual state and child-map indicator. | Marker list render: `frontend/src/pages/maps/MapPage.tsx:587-607`. |
| `frontend/src/pages/maps/components/MapMarkerDialog.tsx` | 226 | Marker create/edit dialog. | Rendered by `MapPage`: `frontend/src/pages/maps/MapPage.tsx:706-719`. |
| `frontend/src/pages/maps/components/MapTerritoryDialog.tsx` | 216 | Territory create/edit dialog. | Rendered by `MapPage`: `frontend/src/pages/maps/MapPage.tsx:720-728`. |
| `frontend/src/pages/maps/components/MapMarkerPanel.tsx` | 154 | Right-side selected marker panel. | Rendered by `MapPage`: `frontend/src/pages/maps/MapPage.tsx:671-684`. |
| `frontend/src/pages/maps/components/MapTerritoryPanel.tsx` | 160 | Right-side selected territory panel. | Rendered by `MapPage`: `frontend/src/pages/maps/MapPage.tsx:686-701`. |
| `frontend/src/pages/maps/components/mapUtils.ts` | 309 | Shared map types, constants, normalization helpers, geometry helpers, fit calculation, SVG path conversion, label metrics, and territory point-in-polygon helpers. | Fit and geometry helpers: `frontend/src/pages/maps/components/mapUtils.ts:167-191`, `frontend/src/pages/maps/components/mapUtils.ts:263-297`. |

### Current pan/zoom mechanism

- `MapPage` attaches mouse handlers to the map container (`frontend/src/pages/maps/MapPage.tsx:514-540`) and renders all map content inside a `transformRef` wrapper with `transformOrigin: '0 0'` (`frontend/src/pages/maps/MapPage.tsx:543-548`).
- `useMapViewport` applies `translate(...) scale(...)` directly to `transformRef.current.style.transform` (`frontend/src/pages/maps/hooks/useMapViewport.ts:23-29`).
- Wheel zoom is registered as a native `wheel` listener on the container and updates `panRef`/`zoomRef` before applying the transform (`frontend/src/pages/maps/hooks/useMapViewport.ts:52-82`).
- Fit-to-screen uses `computeFitView` from `mapUtils` (`frontend/src/pages/maps/hooks/useMapViewport.ts:41-49`; `frontend/src/pages/maps/components/mapUtils.ts:169-191`).

### Current territory hit-testing

- SVG-level hit testing is implemented by transparent `<path>` elements for each territory ring with `pointerEvents` enabled in marker/select modes; those paths call `onTerritoryClick` (`frontend/src/pages/maps/components/MapTerritorySvg.tsx:354-369`).
- `handleTerritoryClick` selects the clicked territory, clears marker selection, sets panel type to `territory`, and opens the panel (`frontend/src/pages/maps/hooks/useMapInteractions.ts:296-326`).
- `handleMapClick` also scans territories from topmost to bottom with `isPointInTerritory` when not shift-clicking (`frontend/src/pages/maps/hooks/useMapInteractions.ts:328-382`).
- `isPointInTerritory` delegates to `isPointInPolygon`, which uses an even-odd crossing test (`frontend/src/pages/maps/components/mapUtils.ts:263-297`).

### Current background rendering

- The current map background is a DOM `<img>` whose source comes from `useAssetUrl(mapImagePath)` (`frontend/src/pages/maps/MapPage.tsx:158-159`, `frontend/src/pages/maps/MapPage.tsx:550-567`).
- The image dimensions are set from natural image size on `onLoad` (`frontend/src/pages/maps/MapPage.tsx:553-556`) and rendered with `maxWidth: 'none'`, `maxHeight: 'none'`, and `draggable={false}` (`frontend/src/pages/maps/MapPage.tsx:557-567`).
- The image, SVG territory overlay, and marker overlays share the same transformed wrapper (`frontend/src/pages/maps/MapPage.tsx:543-609`).

## 2.2 Current Backend for Maps

### Rust models related to Map

Only one Rust model file directly contains Map DTOs.

| File | Lines | Struct | Public fields | Evidence |
| --- | ---: | --- | --- | --- |
| `src-tauri/src/models/map.rs` | 238 | `MapRecord` | `id`, `project_id`, `parent_map_id`, `parent_marker_id`, `name`, `image_path`, `created_at`, `updated_at` | `src-tauri/src/models/map.rs:28-39` |
| `src-tauri/src/models/map.rs` | 238 | `GetRootMapInput` | `project_id`, `branch_id` | `src-tauri/src/models/map.rs:41-46` |
| `src-tauri/src/models/map.rs` | 238 | `GetMapTreeInput` | `project_id`, `branch_id` | `src-tauri/src/models/map.rs:48-53` |
| `src-tauri/src/models/map.rs` | 238 | `GetMapInput` | `id` | `src-tauri/src/models/map.rs:55-59` |
| `src-tauri/src/models/map.rs` | 238 | `CreateMapInput` | `project_id`, `parent_map_id`, `parent_marker_id`, `name`, `image_path`, `branch_id` | `src-tauri/src/models/map.rs:61-70` |
| `src-tauri/src/models/map.rs` | 238 | `UpdateMapInput` | `id`, `name`, `image_path` | `src-tauri/src/models/map.rs:72-78` |
| `src-tauri/src/models/map.rs` | 238 | `DeleteMapInput` | `id` | `src-tauri/src/models/map.rs:80-84` |
| `src-tauri/src/models/map.rs` | 238 | `MapMarker` | `id`, `map_id`, `title`, `description`, `position_x`, `position_y`, `color`, `icon`, `linked_note_id`, `child_map_id`, `created_at`, `updated_at` | `src-tauri/src/models/map.rs:86-101` |
| `src-tauri/src/models/map.rs` | 238 | `ListMapMarkersInput` | `map_id`, `branch_id` | `src-tauri/src/models/map.rs:103-108` |
| `src-tauri/src/models/map.rs` | 238 | `CreateMapMarkerInput` | `map_id`, `title`, `description`, `position_x`, `position_y`, `color`, `icon`, `linked_note_id`, `child_map_id`, `branch_id` | `src-tauri/src/models/map.rs:110-123` |
| `src-tauri/src/models/map.rs` | 238 | `UpdateMapMarkerInput` | `id`, `title`, `description`, `position_x`, `position_y`, `color`, `icon`, `linked_note_id`, `child_map_id`, `branch_id` | `src-tauri/src/models/map.rs:125-138` |
| `src-tauri/src/models/map.rs` | 238 | `DeleteMapMarkerInput` | `id`, `branch_id` | `src-tauri/src/models/map.rs:140-145` |
| `src-tauri/src/models/map.rs` | 238 | `MapTerritoryPoint` | `x`, `y` | `src-tauri/src/models/map.rs:147-152` |
| `src-tauri/src/models/map.rs` | 238 | `MapTerritory` | `id`, `map_id`, `name`, `description`, `color`, `opacity`, `border_color`, `border_width`, `smoothing`, `rings`, `faction_id`, `sort_order`, `created_at`, `updated_at` | `src-tauri/src/models/map.rs:154-171` |
| `src-tauri/src/models/map.rs` | 238 | `ListMapTerritoriesInput` | `map_id`, `branch_id` | `src-tauri/src/models/map.rs:173-178` |
| `src-tauri/src/models/map.rs` | 238 | `CreateMapTerritoryInput` | `map_id`, `name`, `description`, `color`, `opacity`, `border_color`, `border_width`, `smoothing`, `rings`, `faction_id`, `sort_order`, `branch_id` | `src-tauri/src/models/map.rs:180-195` |
| `src-tauri/src/models/map.rs` | 238 | `UpdateMapTerritoryInput` | `id`, `name`, `description`, `color`, `opacity`, `border_color`, `border_width`, `smoothing`, `rings`, `faction_id`, `sort_order`, `branch_id` | `src-tauri/src/models/map.rs:197-212` |
| `src-tauri/src/models/map.rs` | 238 | `DeleteMapTerritoryInput` | `id`, `branch_id` | `src-tauri/src/models/map.rs:214-219` |
| `src-tauri/src/models/map.rs` | 238 | `ListTerritorySummariesInput` | `project_id`, `branch_id` | `src-tauri/src/models/map.rs:221-226` |
| `src-tauri/src/models/map.rs` | 238 | `MapTerritorySummary` | `id`, `name`, `map_id`, `map_name`, `faction_id`, `occupant_name`, `occupant_kind` | `src-tauri/src/models/map.rs:228-238` |

### Tauri commands related to maps

| Command function | Signature | Evidence |
| --- | --- | --- |
| `maps_get_root_command` | `State<'_, DatabaseState>, GetRootMapInput -> Result<Option<MapRecord>>` | `src-tauri/src/commands/maps.rs:14-24` |
| `maps_get_tree_command` | `State<'_, DatabaseState>, GetMapTreeInput -> Result<Vec<MapRecord>>` | `src-tauri/src/commands/maps.rs:26-36` |
| `maps_get_command` | `State<'_, DatabaseState>, GetMapInput -> Result<MapRecord>` | `src-tauri/src/commands/maps.rs:38-45` |
| `maps_create_command` | `State<'_, DatabaseState>, CreateMapInput -> Result<MapRecord>` | `src-tauri/src/commands/maps.rs:47-57` |
| `maps_update_command` | `State<'_, DatabaseState>, UpdateMapInput -> Result<MapRecord>` | `src-tauri/src/commands/maps.rs:59-69` |
| `maps_delete_command` | `State<'_, DatabaseState>, DeleteMapInput -> Result<()>` | `src-tauri/src/commands/maps.rs:71-78` |
| `maps_markers_list_command` | `State<'_, DatabaseState>, ListMapMarkersInput -> Result<Vec<MapMarker>>` | `src-tauri/src/commands/maps.rs:80-90` |
| `maps_markers_create_command` | `State<'_, DatabaseState>, CreateMapMarkerInput -> Result<MapMarker>` | `src-tauri/src/commands/maps.rs:92-102` |
| `maps_markers_update_command` | `State<'_, DatabaseState>, UpdateMapMarkerInput -> Result<MapMarker>` | `src-tauri/src/commands/maps.rs:104-114` |
| `maps_markers_delete_command` | `State<'_, DatabaseState>, DeleteMapMarkerInput -> Result<()>` | `src-tauri/src/commands/maps.rs:116-126` |
| `maps_territories_list_command` | `State<'_, DatabaseState>, ListMapTerritoriesInput -> Result<Vec<MapTerritory>>` | `src-tauri/src/commands/maps.rs:128-138` |
| `maps_territories_create_command` | `State<'_, DatabaseState>, CreateMapTerritoryInput -> Result<MapTerritory>` | `src-tauri/src/commands/maps.rs:140-150` |
| `maps_territories_update_command` | `State<'_, DatabaseState>, UpdateMapTerritoryInput -> Result<MapTerritory>` | `src-tauri/src/commands/maps.rs:152-162` |
| `maps_territories_delete_command` | `State<'_, DatabaseState>, DeleteMapTerritoryInput -> Result<()>` | `src-tauri/src/commands/maps.rs:164-174` |
| `maps_territory_summaries_list_command` | `State<'_, DatabaseState>, ListTerritorySummariesInput -> Result<Vec<MapTerritorySummary>>` | `src-tauri/src/commands/maps.rs:176-186` |
| `uploads_save_map_image_command` | `AppHandle, UploadFileInput -> Result<UploadSavedPath>` | `src-tauri/src/commands/uploads.rs:32-38` |
| `maps_upload_image_command` | `AppHandle, State<'_, DatabaseState>, MapUploadImageInput -> Result<MapRecord>` | `src-tauri/src/commands/uploads.rs:124-135` |
| `projects_upload_map_image_command` | `AppHandle, State<'_, DatabaseState>, ProjectUploadMapImageInput -> Result<Project>` | `src-tauri/src/commands/uploads.rs:137-148` |

The command handler registers the map commands in `src-tauri/src/lib.rs:115-129` and the map upload command in `src-tauri/src/lib.rs:176`.

### SQLite migrations touching maps

| Migration | Schema touched | Evidence |
| --- | --- | --- |
| `src-tauri/migrations/002_projects.sql` | `projects` includes `map_image_path TEXT`. | `src-tauri/migrations/002_projects.sql:1-9` |
| `src-tauri/migrations/003_branch_foundation.sql` | `scenario_branches` and `branch_overrides` provide branch storage used by map entities. | `src-tauri/migrations/003_branch_foundation.sql:1-33` |
| `src-tauri/migrations/015_maps.sql` | Creates `maps`, `map_markers`, and `map_territories`; adds indexes for map project/parent and created-branch lookup. | Tables: `src-tauri/migrations/015_maps.sql:1-52`; indexes: `src-tauri/migrations/015_maps.sql:54-61`. |

No `canvas_scene`, `canvas_object`, or `canvas_layer` schema exists in the current migrations. A repository-wide search for `canvas|scene|layer|curve|primitive|pixi|viewport` in `src-tauri/src` found graph-layout viewport types but no map canvas persistence model.

### Current upload flow for background images

- Frontend reads a `File` into `number[]` bytes and forwards `fileName` and `mime` through the transport (`frontend/src/api/uploadFile.ts:9-33`).
- `mapApi.uploadMapImage` calls the `maps_upload_image` Tauri command with `mapId` (`frontend/src/api/maps.ts:321-325`).
- `MapUploadImageInput` contains `map_id`, `file_bytes`, `file_name`, and `mime`; it has no `branch_id` field (`src-tauri/src/models/upload.rs:58-65`).
- `maps_upload_image` validates size and MIME, deletes an existing map image if present, writes the new file under the maps upload subdir, stores the returned web path on the map, and returns the updated `MapRecord` (`src-tauri/src/uploads/service.rs:208-230`).
- `projects_upload_map_image` is a separate project-level map-image flow using `ProjectUploadMapImageInput` (`src-tauri/src/models/upload.rs:67-74`; `src-tauri/src/uploads/service.rs:233-255`).
- Default map-image validation allows `.jpg`, `.jpeg`, `.png`, `.webp`, `.svg` and MIME types `image/jpeg`, `image/jpg`, `image/pjpeg`, `image/png`, `image/webp`, `image/svg+xml`; `MAX_IMAGE_SIZE` is `50 * 1024 * 1024` bytes (`src-tauri/src/uploads/validation.rs:3-14`).
- Uploaded files are written under the Tauri app data uploads root, with subdir `maps` (`src-tauri/src/paths.rs:8-20`, `src-tauri/src/paths.rs:76-88`); `write_file` rejects filenames containing path separators or `..` and returns a web path (`src-tauri/src/uploads/storage.rs:11-28`).
- Map entity filenames use `map_{map_id}_{timestamp}{ext}` and default to `.png` when no extension exists (`src-tauri/src/uploads/filename.rs:81-88`).

### Branch-overlay logic for maps

- Map reads resolve an effective branch for root/tree reads and filter map rows by created branch visibility (`src-tauri/src/repositories/maps.rs:89-167`).
- Marker list reads filter base rows by branch visibility and then apply branch overrides for `map_marker` when `branch_id` is present (`src-tauri/src/repositories/maps.rs:283-335`).
- Marker updates/deletes in a branch are stored as `map_marker` upsert/delete overrides instead of updating base rows (`src-tauri/src/repositories/maps.rs:451-528`).
- Territory list reads filter base rows by branch visibility and apply `map_territory` overrides when `branch_id` is present (`src-tauri/src/repositories/maps.rs:530-584`).
- Territory updates/deletes in a branch are stored as `map_territory` upsert/delete overrides (`src-tauri/src/repositories/maps.rs:710-804`).
- `branch_overlay::apply_item_overlay` merges patch JSON into serialized entities or hides deleted entities (`src-tauri/src/services/branch_overlay.rs:14-47`).
- `branch_scope` resolves effective branch IDs, resolves created branch IDs, verifies project membership, and computes visibility across branch ancestry (`src-tauri/src/services/branch_scope.rs:7-90`).

## 2.3 Existing Mainline Canvas Infrastructure

### PixiJS package status

`frontend/package.json` dependencies and devDependencies do not include `pixi.js` or `pixi-viewport`; the current dependency list runs from `@tauri-apps/api` through `zustand` and dev dependencies from `@types/react` through `vite` (`frontend/package.json:13-50`). A direct search for `pixi|Pixi|pixi-viewport` in `frontend/package.json` returned no matches.

### Existing canvas / WebGL code in mainline

Mainline contains HTML Canvas 2D graph pages, but no PixiJS/WebGL unified map canvas implementation.

| File | Lines | Canvas role | Evidence |
| --- | ---: | --- | --- |
| `frontend/src/pages/graph/ProjectGraphPage.tsx` | 1129 | Project graph page owns an `HTMLCanvasElement`, camera refs, panning refs, saved graph viewport, and a 2D canvas render loop. | Canvas/camera refs: `frontend/src/pages/graph/ProjectGraphPage.tsx:154-181`; render loop gets `2d` context: `frontend/src/pages/graph/ProjectGraphPage.tsx:592-631`; canvas element render: `frontend/src/pages/graph/ProjectGraphPage.tsx:1074-1093`. |
| `frontend/src/pages/wiki/WikiGraphPage.tsx` | 500 | Wiki graph page owns an `HTMLCanvasElement`, camera refs, and 2D canvas drawing. | Canvas/camera refs: `frontend/src/pages/wiki/WikiGraphPage.tsx:51-79`; render loop gets `2d` context: `frontend/src/pages/wiki/WikiGraphPage.tsx:169-184`; canvas element render: `frontend/src/pages/wiki/WikiGraphPage.tsx:448`. |
| `frontend/src/pages/characters/CharacterGraphPage.tsx` | 654 | Character graph page owns an `HTMLCanvasElement`, camera refs, and 2D canvas drawing. | Canvas/camera refs: `frontend/src/pages/characters/CharacterGraphPage.tsx:36-69`; canvas element render: `frontend/src/pages/characters/CharacterGraphPage.tsx:554-555`. |
| `frontend/src/pages/graph/components/GraphCanvasShell.tsx` | 53 | Decorative shell around graph canvas content. | File-level comment and component export: `frontend/src/pages/graph/components/GraphCanvasShell.tsx:10-12`. |
| `src-tauri/src/models/graph_layout.rs` | 62 | Persists graph layout viewport and node positions, not map canvas objects. | `GraphLayoutViewport`: `src-tauri/src/models/graph_layout.rs:6-12`; `GraphLayoutDataV1`: `src-tauri/src/models/graph_layout.rs:23-31`. |
| `shared/src/schemas/graphLayout.schema.ts` | 28 | Shared Zod schema for graph layout viewport and node positions. | `shared/src/schemas/graphLayout.schema.ts:3-23`. |

### React StrictMode

React StrictMode is enabled at the frontend entry point (`frontend/src/main.tsx:12-29`).

## 2.4 Carry-over from Prototype 001

Source: `docs/prod/prototypes/001-curve-text-canvas/CARRYOVER.md:53-59`.

| # | Item | Status | Mainline ticket | Resolved in | Affects |
| --- | --- | --- | --- | --- | --- |
| 1 | Curve text click selection | open | TBD | — | ADR-0003 data/hit-test model; implementation plan curve-text selection milestone. |
| 2 | Real 16k PNG on min-spec | open | TBD | — | ADR-0002 migration/user rollout risk; implementation plan min-spec background validation milestone. |
| 3 | Incremental reconciliation | open | TBD | — | ADR-0003 renderer/store boundary; implementation plan reconciler milestone. |
