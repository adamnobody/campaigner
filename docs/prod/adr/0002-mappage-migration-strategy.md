# ADR-0002: MapPage migration strategy for 0.3.1 canvas integration

## Status

Status: Accepted
Accepted: 2026-05-24

## Open questions for product owner

1. Should existing maps be migrated into the new canvas-backed model during 0.3.1, or should existing DOM/SVG maps continue to open in the current implementation until a later migration step?
   - **Answer:** Migrate existing maps into the new canvas-backed model during 0.3.1. No legacy persistence remains after release.
2. Should curve text and other rich canvas primitives be available on every existing map immediately after 0.3.1, or only on maps created/converted into the new canvas format?
   - **Answer:** Curve text and all rich canvas primitives are available on every map after 0.3.1 (follows from Q1).
3. During the transition, may users see two map experiences (legacy DOM/SVG and new canvas), or must the application expose one unified map experience at all times?
   - **Answer:** One unified map experience at all times. Legacy DOM/SVG `MapPage` is removed in the same release that introduces canvas.
4. Is a map-type distinction acceptable in persisted product data (for example "simple map" vs "rich canvas map"), or should map type remain an implementation detail hidden from product concepts?
   - **Answer:** No map-type product concept. A single map entity and single persisted format are used.

## Context

ADR-0001 now accepts PixiJS v8 after prototype 001 validation (`docs/prod/adr/0001-canvas-rendering-technology.md:3-5`; validation outcome in `docs/prod/adr/0001-canvas-rendering-technology.md:189-194`). The current mainline map page is not canvas-based: `MapPage` composes a DOM image background, SVG territory overlay, and DOM marker overlay inside one transformed wrapper (`docs/prod/plans/0.3.1-canvas/00-repo-audit.md:45-63`). The backend currently persists maps, markers, and territories through `maps`, `map_markers`, and `map_territories` tables (`docs/prod/plans/0.3.1-canvas/00-repo-audit.md:124-130`), and it does not contain a `canvas_scene`, `canvas_object`, or `canvas_layer` model (`docs/prod/plans/0.3.1-canvas/00-repo-audit.md:132-134`).

This decision is required before ADR-0003 can define the data model, because the data model depends on whether old maps are replaced, temporarily coexist with canvas maps, or permanently remain as a separate product concept.

## Options considered

### 1. Full replacement

Current DOM/SVG `MapPage` is removed as the editing/rendering implementation for maps. Existing map concepts move to the new canvas-backed implementation, and the old DOM/SVG layer is deleted after parity is reached within the 0.3.1 work.

Data consequences:
- Requires a migration path from current `maps`, `map_markers`, and `map_territories` data into the new canvas schema, because current map data lives in the tables documented in `docs/prod/plans/0.3.1-canvas/00-repo-audit.md:124-130`.
- Requires ADR-0003 to define how current `MapRecord`, `MapMarker`, and `MapTerritory` DTOs map to scene/layer/object records, because those DTO fields are documented in `docs/prod/plans/0.3.1-canvas/00-repo-audit.md:67-100`.
- Requires branch-overlay behavior for existing markers and territories to be preserved or replaced in the canvas model, because current map marker and territory branch behavior is documented in `docs/prod/plans/0.3.1-canvas/00-repo-audit.md:160-168`.

UX consequences:
- Users see one map experience after the replacement is complete.
- 0.3.1 must provide functional parity for current background rendering, markers, territory rendering, territory selection, and editing flows before old UI removal; those current responsibilities are documented in `docs/prod/plans/0.3.1-canvas/00-repo-audit.md:13-63`.

Development consequences:
- Highest integration scope: `MapPage`, all map hooks, all map sub-components, map APIs, Rust models, migrations, repositories, and generated bindings may be affected.
- Requires the old DOM/SVG implementation to remain available internally until canvas parity is reached, or requires one large replacement branch.

Consequences for CARRYOVER #1 and #2:
- CARRYOVER #1 (curve text click selection) must be solved before old MapPage removal if curve text is part of the replacement surface.
- CARRYOVER #2 (real 16k PNG on min-spec) blocks confidence in replacing all maps that may load large raster backgrounds.

### 2. Gradual migration

The old DOM/SVG `MapPage` and a new canvas map implementation coexist temporarily behind a feature flag or routing/data switch. The old page is removed after the canvas implementation reaches functional parity.

Data consequences:
- ADR-0003 can introduce new canvas persistence while current `maps`, `map_markers`, and `map_territories` continue to serve existing map flows during transition.
- Requires a defined conversion policy from legacy map records to canvas records before the old page can be removed.
- Requires code paths to know whether a map is rendered by legacy DOM/SVG or canvas during the transition.

UX consequences:
- Users may see either legacy or canvas behavior during the transition, depending on the chosen rollout mechanism.
- Current DOM/SVG features remain available while canvas editing is incomplete, reducing parity pressure for the first canvas-visible milestone.

Development consequences:
- Lower immediate blast radius than full replacement, because current files documented in the audit can remain operational while new canvas code is added.
- Higher temporary maintenance cost, because old and new map implementations coexist until the migration is complete.

Consequences for CARRYOVER #1 and #2:
- CARRYOVER #1 can be scheduled before enabling curve text in user-visible canvas maps, rather than before the first read-only canvas view.
- CARRYOVER #2 can be tested before moving large/legacy raster maps to canvas by default.

### 3. Permanent coexistence

Canvas is introduced as a separate product mode for "rich maps", while current DOM/SVG maps remain as "simple maps". Persisted data distinguishes map type, and both implementations remain supported.

Data consequences:
- Requires a durable map-type field or equivalent persisted distinction, because the application must know whether a map uses current tables only or the new canvas schema.
- Requires ADR-0003 to define relationships between existing `Map` records and canvas scene records without assuming all maps become canvas scenes.
- Current `maps`, `map_markers`, and `map_territories` tables remain part of the product model rather than only migration input.

UX consequences:
- Users must understand which map type they are creating or editing, unless the distinction is hidden behind product rules.
- Some features may be available only in rich canvas maps, depending on the answer to Open question #2.

Development consequences:
- Avoids forced migration of all current maps during 0.3.1.
- Creates permanent dual-surface maintenance: current DOM/SVG `MapPage` files from the audit and new canvas files both remain production code.

Consequences for CARRYOVER #1 and #2:
- CARRYOVER #1 applies to rich canvas maps only unless the product requires curve text on simple maps too.
- CARRYOVER #2 applies to rich canvas maps and to any simple maps converted into rich maps; simple DOM/SVG maps keep the current upload and `<img>` rendering path documented in `docs/prod/plans/0.3.1-canvas/00-repo-audit.md:59-63`.

## Decision

Choose option (a) **Full replacement**.

Rationale from product owner:
- The product currently has no production users beyond two internal testers.
- Backward compatibility with the legacy DOM/SVG `MapPage` is not required.
- Technical debt from a dual-path strategy is unacceptable.
