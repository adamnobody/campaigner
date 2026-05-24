# 0.3.1 Canvas — Implementation Plan

Status: Accepted
Accepted: 2026-05-24

## Scope and inputs

- Baseline audit: `docs/prod/plans/0.3.1-canvas/00-repo-audit.md`
- Rendering decision: `docs/prod/adr/0001-canvas-rendering-technology.md`
- Migration strategy: `docs/prod/adr/0002-mappage-migration-strategy.md` (Full replacement)
- Data model: `docs/prod/adr/0003-canvas-data-model.md`

This plan delivers one unified map experience in 0.3.1. Legacy DOM/SVG map persistence and rendering are removed in the same release.

## Stage 1 — Contracts and migration prep

- Freeze DTO/contracts for `CanvasScene`, `CanvasLayer`, `CanvasObject` and corresponding input structs.
- Finalize object-kind discriminator list and shared validation constraints for `kind`, `z_index`, and JSON payload shape.
- Define migration script contract for two internal testers (source rows, transform rules, verification checks, rollback path before destructive drop).

Exit criteria:
- Canvas DTO/invocation contract draft is approved.
- Migration script contract is reviewed and test data fixtures are prepared.

## Stage 2 — Backend schema migrations

- Add migration creating `canvas_scene`, `canvas_layer`, `canvas_object` plus indexes from ADR-0003.
- Backfill `maps -> canvas_scene` and map dependent rows into `canvas_object` (`marker`, `territory`) with deterministic z-order.
- Remove legacy tables in the same migration sequence: `map_territories`, `map_markers`, `maps`.
- Keep branch compatibility through `created_branch_id` and `branch_overrides` entity types for canvas entities.

Exit criteria:
- Fresh DB bootstraps with canvas tables only.
- Existing internal tester DB fixture migrates successfully to canvas schema.
- No remaining runtime SQL references to dropped map tables.

## Stage 3 — Rust models, repositories, and branch overlay wiring

- Add canvas model module (`src-tauri/src/models/canvas.rs`) and replace direct map DTO usage in map flows.
- Implement repositories for scene/layer/object CRUD + reorder + bulk operations.
- Extend branch overlay usage to `canvas_scene`, `canvas_layer`, `canvas_object` using existing services in `src-tauri/src/services/branch_overlay.rs` and `src-tauri/src/services/branch_scope.rs`.
- Add repository tests for branch visibility, upsert/delete overrides, and deterministic ordering.

Exit criteria:
- Canvas repository tests pass.
- Branched edits to canvas objects round-trip with expected overlay behavior.

## Stage 4 — Tauri commands + Specta bindings

- Add command module (`src-tauri/src/commands/canvas.rs`) for scene/layer/object CRUD and bulk reconciler operations.
- Register canvas commands in `src-tauri/src/lib.rs`.
- Export new types/commands in `src-tauri/src/specta.rs`.
- Regenerate TypeScript bindings to `frontend/src/types/generated/bindings.ts` via `npm run tauri:codegen`.

Exit criteria:
- `npm run tauri:codegen` completes and frontend builds with generated canvas types.
- Legacy map command usage is isolated or removed from the new map surface.

## Stage 5 — Frontend API and state transition

- Add/replace API module calls under `frontend/src/api/` for canvas commands (no direct `invoke` from pages/components).
- Refactor map page data-loading hooks to consume scene/layer/object contracts instead of marker/territory lists.
- Introduce client-side scene cache and optimistic bulk patch queue compatible with reconciler commands.

Exit criteria:
- Map page loads from canvas APIs only.
- CRUD and reorder actions use canvas commands, including bulk paths where relevant.

## Stage 6 — Canvas renderer integration

- Introduce Pixi-based rendering bridge in map page route-level composition.
- Map layer/object entities to render primitives and interaction handlers.
- Wire selection/edit gestures, hit-testing, and viewport state persistence against new scene data.
- Close carry-over item for incremental reconciliation with bulk upsert/delete flow.

Exit criteria:
- Scene renders from persisted data with pan/zoom/select/edit baseline parity.
- Incremental reconciler updates avoid full-scene redraw persistence churn.

## Stage 7 — Remove legacy DOM/SVG layer

Delete legacy map rendering/editing artifacts identified in repo audit once canvas parity is verified:

- `frontend/src/pages/maps/components/MapTerritorySvg.tsx`
- `frontend/src/pages/maps/components/MapMarkerOnMap.tsx`
- `frontend/src/pages/maps/hooks/useMapViewport.ts`
- `frontend/src/pages/maps/hooks/useMapMarkerCrud.ts`
- `frontend/src/pages/maps/hooks/useMapTerritoryCrud.ts`
- `frontend/src/pages/maps/hooks/useMapTerritoryDrawing.ts`
- `frontend/src/pages/maps/hooks/useMapInteractions.ts`
- `frontend/src/pages/maps/components/MapMarkerDialog.tsx`
- `frontend/src/pages/maps/components/MapTerritoryDialog.tsx`
- `frontend/src/pages/maps/components/MapMarkerPanel.tsx`
- `frontend/src/pages/maps/components/MapTerritoryPanel.tsx`

Then simplify or replace remaining map helpers (`frontend/src/pages/maps/components/mapUtils.ts`) so no SVG/legacy geometry contracts remain.

Exit criteria:
- No runtime imports of removed legacy components/hooks.
- `MapPage` no longer composes DOM image + SVG + DOM marker overlays from legacy stack.

## Stage 8 — Quality gates and operational rollout

- Run required build/test gates:
  - `npm run build:shared`
  - `npm run build --workspace=frontend`
  - `cargo fmt`
  - `cargo clippy -- -D warnings`
  - `cargo test`
- Validate carry-over checks: curve-text click selection and real 16k PNG on min-spec target.
- Operational task: notify the two internal testers that pre-0.3.1 maps are migrated only via one-time script before upgrade; otherwise their legacy maps may be lost.

Exit criteria:
- All CI-equivalent local checks pass.
- Tester migration/loss communication is sent and acknowledged.

## Stage 9 — Release hardening and cleanup

- Remove dead Rust commands/repositories/models tied only to legacy map tables.
- Remove stale frontend i18n keys and UI logic tied to marker/territory dialogs/pan handlers.
- Update release notes and developer docs to reflect single canvas map model.
- Tag unresolved non-blocking follow-ups (if any) for 0.3.2+ backlog.

Exit criteria:
- No active code paths depend on legacy map schema or DOM/SVG surface.
- 0.3.1 release branch is merge-ready with accepted ADR set.

## Acceptance criteria

- One unified map experience in app runtime; no dual-path legacy/canvas behavior.
- Persistence for maps is canvas-native only (`canvas_scene`, `canvas_layer`, `canvas_object`).
- Branch-aware behavior works for scene/layer/object CRUD, reorder, and bulk operations.
- Specta bindings expose canvas contracts and frontend compiles against generated types.
- Legacy map tables and legacy DOM/SVG rendering/editing layer are removed.
- Carry-over items from prototype 001 are either resolved in 0.3.1 or explicitly re-deferred with owner and target version.

## Risks and mitigations

- Risk: migration script misses edge-case legacy rows.
  - Mitigation: dry-run mode + row-count parity report + fixture-based migration tests before destructive drop.
- Risk: branch overlay regressions on bulk operations.
  - Mitigation: repository-level branch tests for mixed create/update/delete and ancestry visibility.
- Risk: performance regressions from naive reconciler writes.
  - Mitigation: enforce bulk upsert/delete usage and add stress scenario checks from prototype carry-over.
- Risk: 16k PNG behavior differs on min-spec hardware.
  - Mitigation: run explicit min-spec validation before release candidate sign-off.

## Carry-over mapping (Prototype 001 -> 0.3.1)

- Carry-over #1 `Curve text click selection` -> Stages 5-6, must be closed before Stage 8 sign-off.
- Carry-over #2 `Real 16 000 x 16 000 PNG background on min-spec hardware` -> Stages 6 and 8, mandatory release gate.
- Carry-over #3 `Incremental scene reconciliation` -> Stages 3-6, closed when bulk reconciler path is default.
