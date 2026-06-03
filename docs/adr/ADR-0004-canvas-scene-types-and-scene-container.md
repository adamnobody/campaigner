# ADR-0004: Canvas scene types and scene_container

> **Canonical path for agents:** this file lives at `docs/adr/` for the
> documentation PR. The numbered ADR index is maintained in
> `docs/prod/adr/README.md` (entry 0004).

## Status

**Proposed** — 2026-06-03. Awaiting review before migration 018+ and
backend work (see `docs/plans/0.3.2-canvas-architecture.md`).

**Extends:** ADR-0003 (canvas tables and object kinds). Does not replace
ADR-0003; adds `scene_type`, `scene_container`, and scene-aware validation.

## Context

Campaigner 0.3.1 introduced unified canvas tables (`canvas_scene`,
`canvas_layer`, `canvas_object`) per ADR-0003 and migration `017`. The
product UI was renamed «Карта» → «Холст», but the **data model still
treats the project root ambiguously**:

- Root is discovered as the first scene with `parent_scene_id IS NULL`
  (`get_root_scene`, `MapPage` initial load).
- A root scene **with** `background_path` behaves like a geographic map
  in practice, but nothing in the schema distinguishes «world canvas»
  from «map scene».
- Nested geography today uses **markers** and
  `canvas_markers_attach_child_scene` (`linked_scene_id` on
  `kind = 'marker'`).
- The product direction (see `docs/prod/vision/canvas.md`) requires a
  **project-wide working surface** (Холст) with **map scenes** opened as
  cards or via markers—not a single raster root that doubles as the only
  map.

Parity work (`docs/plans/0.3.1.x-canvas-parity.md`) restores marker/
territory UX **without** a schema change. This ADR defines the **0.3.2
Canvas architecture** milestone: explicit scene typing, `scene_container`
on the root canvas, and backend invariants—after parity, with migration
`018+`.

**Out of scope for this ADR:**

- Project Graph routes, stores, or layout (`/project/:id/graph` unchanged).
- `entity_ref`, typed `connection`, `chart` — future; see
  `docs/prod/vision/canvas.md` §3–6.
- CRDT, real-time collaboration, websocket sync, or multi-user-aware data
  (Campaigner is single-user offline only).
- Silent or automatic legacy data rewriting (**no silent migration**, **no
  silent backfill** of `scene_type` at migration 018).
- Route rename (`/map` → `/canvas`); aliases may be added later.
- In-app migration of pre-017 `maps` / `map_markers` / `map_territories`
  dumps (offline script only if needed).

## Decision drivers

| Driver | Weight | Notes |
|--------|--------|-------|
| Unambiguous root vs map semantics | Critical | Product «Холст» vs geographic «Карта» |
| No orphan scenes on create-map flow | High | Atomic TX like existing marker attach |
| Legacy projects keep working | High | `scene_type NULL` fallback, no silent migration |
| Engine-agnostic model (AGENTS.md) | High | `scene_type` + `kind`; no Pixi in persistence |
| Existing marker nested maps | High | Keep `attach_child_scene_to_marker` |
| Backend enforcement of kinds | Medium | After UI toolset; matrix per `scene_type` |
| Branch overlay compatibility | Medium | Same override pattern as marker attach |

## Options considered

### Option A: Keep `parent_scene_id IS NULL` as root discriminator

- ✅ No migration.
- ❌ Cannot express «Холст without map background» vs «map as root».
- ❌ Multiple null-parent scenes possible via generic `createScene`.

### Option B: Use `background_path IS NOT NULL` as map discriminator

- ✅ No new column.
- ❌ Conflates storage path with product type; root canvas cannot hold
  optional decor without becoming a «map».

### Option C: Explicit `scene_type` column (chosen)

- ✅ Clear product semantics: `root_canvas` | `map` (extensible later).
- ✅ `background_path` remains optional asset path, required only by
  business rules for `map` creation flows.
- ⚠️ Requires migration `018+` and read-path fallback for NULL legacy rows.

## Decision

### 1. Scene types (`canvas_scene.scene_type`)

Add column `scene_type TEXT` on `canvas_scene` with allowed values:

| Value | Meaning | UI label (ru) |
|-------|---------|---------------|
| `root_canvas` | Exactly one main project canvas (Холст) | Холст |
| `map` | Geographic map scene (raster background, territories, markers) | Карта |

**Rules:**

- **`background_path` is not a discriminator.** It may be set on `map`
  scenes; create-map flows require it at UI/service layer for new maps.
  `root_canvas` typically has `background_path = NULL` (dotted/subtle
  background is render-time chrome, not persisted map raster).
- **`parent_scene_id IS NULL` alone must not define root.** After
  migration, root resolution uses `scene_type = 'root_canvas'` with
  legacy fallback (below).
- **Invariant:** at most **one** `root_canvas` per `project_id`
  (enforced by partial unique index or equivalent repository check).
- **Child maps** use `parent_scene_id` + optional `parent_object_id`
  (marker or future parent) as today.

**Legacy fallback:** rows with `scene_type IS NULL` behave as today:
`get_root_scene` / frontend initial load may treat
`parent_scene_id IS NULL` as root; opening and editing unchanged until
opt-in migrator (PR9). **No silent migration** on app upgrade.

**Transition column strategy (migration 018):** `scene_type` is **nullable**
on existing databases. New projects: `create_root_scene_for_project` sets
`root_canvas` immediately. Backfill of NULL → `root_canvas` / `map` is
**opt-in only** (PR9), not applied at migration time.

### 2. `scene_container` object kind

| Aspect | Choice |
|--------|--------|
| Technical `kind` | `scene_container` |
| UI name | «Карта» (card on Холст) |
| Link to map scene | `canvas_object.linked_scene_id` → `canvas_scene.id` |
| Display-only fields | `content_json`: `titleOverride`, `showMarkerCount`, `showNestedMapCount`, optional `previewPath` later |
| Geometry / layout | `transform_json`, optional `geometry_json` for card bounds |

**Coexistence with marker links:**

| Mechanism | Role | `linked_scene_id` on |
|-----------|------|----------------------|
| **Marker** | Location / transition **inside a map**; drill-down to nested **map** scene | `kind = 'marker'` |
| **scene_container** | Card on **root_canvas**; opens a **map** scene | `kind = 'scene_container'` |

Both use the same FK column; semantics differ by `kind` and parent
scene `scene_type`. Existing command `canvas_markers_attach_child_scene`
remains; regression tests must pass after new commands.

### 3. Atomic create: map scene + scene_container

Creating a map **from the root canvas** must not use separate
`createScene` + `createObject` IPC calls without a transaction.

**One backend command** (working name, style Tauri project):

`canvas_create_map_with_scene_container`

**Transaction steps (order matters for cyclic FK):**

1. `BEGIN`
2. Validate parent scene is `root_canvas` (or legacy NULL root).
3. `INSERT canvas_scene` with `scene_type = 'map'`, `background_path`
   required at service layer, `parent_scene_id` = root, `parent_object_id`
   = NULL initially.
4. Create default layers (`Background`, `Content`) as in
   `create_default_layers_for_scene`.
5. `INSERT canvas_object` `kind = 'scene_container'` on root scene
   content layer with transform / `content_json`.
6. `UPDATE canvas_object SET linked_scene_id = child map scene id`.
7. Optionally `UPDATE canvas_scene SET parent_object_id = container id`.
8. `COMMIT`

On failure: rollback; **no orphan** child scene without container link.

Branch edits: apply the same `linkedSceneId` override pattern as
`attach_child_scene_to_marker` when `branch_id` is set.

### 4. Allowed object kinds by `scene_type`

Validation function: `validate_object_kind_for_scene(scene_type, kind)`.
Used from `create_object`, `update_object`, `reconcile_scene` / bulk
upsert. UI toolset may restrict earlier; backend is authoritative after
PR6.

**`icon` and `group`:**

- **`icon`** — supported **legacy** kind (parity with 017 CHECK); treat
  like marker for validation on `map` where marker is allowed; on
  `root_canvas` follow marker row only if product still creates icons—
  otherwise allow read/update for existing rows.
- **`group`** — **structural** kind; allowed on `root_canvas` and `map`
  for grouping children; no semantic link to scenes.

#### Matrix (0.3.2)

| kind | root_canvas | map |
|------|:-------------:|:---:|
| text | ✅ | ✅ |
| curve_text | ✅ | ✅ |
| rectangle | ✅ | ✅ |
| ellipse | ✅ | ✅ |
| polygon | ✅ | ✅ |
| polyline | ✅ | ✅ |
| image | ✅ | ✅ |
| scene_container | ✅ | ❌ |
| territory | ❌ | ✅ |
| marker | ❌ | ✅ |
| icon (legacy) | ❌* | ✅ |
| group | ✅ | ✅ |
| entity_ref | ❌ (future) | ❌ |
| connection | ❌ (future) | ❌ |
| chart | ❌ (future) | ❌ |

\*Existing `icon` rows on root from experiments: **read/update/delete**
allowed; **create** on `root_canvas` rejected unless product explicitly
needs it later.

**Future kinds** (`entity_ref`, `connection`, `chart`): not in 017/018
CHECK until separate ADR; reference `docs/prod/vision/canvas.md`.

### 5. `linked_scene_id` graph safety

On create/update of `linked_scene_id`:

- Reject **self-link** (`linked_scene_id = object.scene_id` or linked
  scene id equal to owning scene in invalid way).
- Reject **ancestor** link: linked scene must not be an ancestor of the
  object's scene in the `parent_scene_id` chain (prevents navigation
  cycles).
- Map scenes linked from `scene_container` must have
  `scene_type = 'map'` (or NULL legacy map-like scene once classified).

### 6. Navigation and routes

- **Breadcrumbs:** built from a **navigation stack**, not tree alone:
  `[{ sceneId, label, via: 'root' | 'container' | 'marker' | 'parent' }]`.
  Same `map` scene may be opened from marker vs container; stack records
  entry path. MVP stack helper lands in parity PR1; container `via` in PR8.
- **Routes:** keep `/project/:projectId/map` and
  `/project/:projectId/map/:mapId` (param remains `mapId` in code).
  UI copy «Холст» is i18n-only. Optional `/canvas` redirect later.

### 7. Legacy and migration policy

| Policy | Detail |
|--------|--------|
| New projects | `root_canvas` at project creation |
| Existing NULL `scene_type` | Continue opening as today |
| Opt-in prompt | «Преобразовать текущую карту в Холст с карточкой карты?» — PR9 |
| Pre-017 SQL dumps | Offline script only; not in-app |
| Silent auto-migration | **Forbidden** |

### 8. Text kinds (parity note)

Keep **`text`** and **`curve_text`** as separate kinds. Unified inspector
is optional in parity; merge to `text` + `warp.mode` is a **future**
data migration, not part of 018.

### 9. Territories and factions

Territory fields remain in `content_json` / `style_json` / `geometry_json`
(`rings[]`, `factionId` in `content_json`). No `ownerEntityType` /
`ownerEntityId` in 0.3.2. Reconciler must render **all rings**, not only
`rings[0]` (PR3).

## Consequences

### Positive

- Product model matches «Холст + карты» without overloading root
  `background_path`.
- Orphan-safe map creation from root.
- Clear extension point for future kinds and CV06 modes.
- Marker and container nested navigation coexist with explicit semantics.

### Negative

- Migration 018+ and coordinated frontend/backend releases.
- Two nested-map UX paths to test (marker vs container).
- Legacy NULL `scene_type` dual-path logic until PR9 or natural attrition.

### Neutral

- ADR-0003 tables unchanged in spirit; one column + one CHECK kind +
  validation layer.
- Project Graph untouched.
- `docs/prod/vision/canvas.md` timeline updated: `scene_container` moves
  from 0.4.x to 0.3.2 architecture milestone.

## Validation

| Milestone | Check |
|-----------|--------|
| PR4 merged | ADR Accepted; plan and vision aligned |
| PR5 | Migration applies on fresh DB; existing DB keeps NULL types |
| PR6–7 | `cargo test`: kind matrix, root invariant, no orphan on failed TX |
| PR8 | Manual: create map from root → card visible → open → breadcrumbs |
| PR9 | Opt-in migrator tested on fixture «root with background + territories» |

## References

- `docs/prod/adr/0003-canvas-data-model.md`
- `docs/prod/adr/0001-canvas-rendering-technology.md`
- `docs/prod/vision/canvas.md`
- `docs/plans/0.3.1.x-canvas-parity.md`
- `docs/plans/0.3.2-canvas-architecture.md`
- `src-tauri/migrations/017_canvas_replacement.sql`
- `src-tauri/src/repositories/canvas.rs` — `get_root_scene`,
  `attach_child_scene_to_marker`, `create_root_scene_for_project`
