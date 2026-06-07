# ADR-0001: Canvas rendering technology for unified scene editor

## Status

Status: Accepted
Accepted: 2026-05-22
Validated by: Prototype 001 — see docs/prod/prototypes/001-curve-text-canvas/REPORT.md

## Context

Starting with v0.3.1, Campaigner introduces a unified canvas as the working
surface for maps, mind maps, entity cards, and free-form visual editing.
This is part of a larger UX rebuild covered by roadmap items CV01–CV05:

- **CV01** Unified canvas as a universal surface.
- **CV02** Visual primitives: line, polygon, rectangle, free text, icon, image.
- **CV03** Text transform / curve text (text along a path).
- **CV04** Layer system with toggle and ordering.
- **CV05** Multi-level / multi-layer maps (planned for 0.4.x).

Current state (0.3.0):
- Maps support only point markers and polygon territories.
- No rotated, curved, or path-aligned text.
- No layer system.
- No general-purpose primitives.
- No infinite canvas; map is a static raster with sparse overlays.

The chosen technology must support the next 1–2 years of visual features
on a single-user desktop app (Tauri + React + TypeScript on the frontend,
Rust + SQLite on the backend).

### Usage profile (assumed)

- Background raster maps up to ~16 000 × 16 000 px.
- Hundreds to low thousands of heterogeneous objects per scene:
  polygons (territories), polylines (rivers, routes), text labels (some
  along curves), icons, embedded images, mind-map nodes and edges,
  entity reference cards.
- Atmospheric visual style is a product differentiator: parchment look,
  fog of war, glow, soft shadows.
- Single user, no real-time collaboration ever.
- Export to PNG required; PDF and SVG not required.

## Decision drivers

| Driver                                              | Weight   |
|-----------------------------------------------------|----------|
| Curve / path-aligned text (CV03)                    | Critical |
| Performance with 1k–10k heterogeneous objects       | High     |
| Atmospheric effects (shaders, filters)              | High     |
| Layer system with independent transforms (CV04)     | High     |
| Solo developer learnability                         | High     |
| Large raster background handling (up to 16k²)       | High     |
| PNG export                                          | Medium   |
| Active maintenance and community                    | Medium   |
| Engine-agnostic data model                          | Medium   |
| Real-time collaboration                             | Not required |
| Vector PDF / SVG export                             | Not required |

## Options considered

### 1. SVG (DOM-based)

- ✅ Curve text is trivial via `<textPath>`.
- ✅ DOM-level debugging and CSS styling.
- ✅ Hit-testing is free (native DOM events).
- ❌ Performance collapses past ~3–5k DOM nodes — incompatible with the
  usage profile.
- ❌ No shader-based effects; "parchment" and "fog" require fragile filters.
- ❌ Large raster backgrounds are awkward (rasters live inside `<image>`
  but transformed text labels are DOM-heavy on top).

### 2. Canvas 2D via Konva.js

- ✅ Mature, well-documented, designed for editor-style apps.
- ✅ Built-in transformers, hit-testing, serialisation.
- ✅ Easier learning curve than WebGL.
- ⚠️ Curve text requires manual per-glyph layout along a sampled curve.
- ❌ No GPU effects; atmospheric filters are limited or expensive on CPU.
- ❌ Performance ceiling on large maps with thousands of objects.
- ⚠️ Konva's development pace has slowed in recent years.

### 3. WebGL via PixiJS v8

- ✅ GPU-accelerated; handles 10k+ objects comfortably.
- ✅ Built-in MSDF text in v8 — sharp at all zoom levels.
- ✅ Shader-based filters → atmospheric effects are first-class.
- ✅ `pixi-viewport` provides pan / zoom / culling out of the box.
- ✅ Active development; v8 released in 2024 with major API improvements.
- ✅ Scene-graph API maps cleanly onto a data-driven architecture.
- ⚠️ Curve text is non-trivial: either a community plugin, manual glyph
  placement on MSDF, or a custom fragment shader.
- ⚠️ Steeper learning curve; WebGL debugging is harder than DOM.

### 4. Hybrid: PixiJS + SVG overlay for curve text only

- ✅ Removes the only known high-risk item (curve text).
- ✅ All graphics in PixiJS; only text labels with a curve attribute go
  through SVG.
- ❌ Two coordinate systems must be kept in sync on every pan / zoom.
- ❌ Two rendering pipelines complicate selection, hit-testing, and
  export to PNG (SVG and Pixi must be composited).
- ❌ Layer ordering becomes ambiguous when SVG text must appear between
  Pixi layers.

## Decision

Adopt **PixiJS v8** as the primary rendering technology for the unified
canvas.

Rationale:

- It is the only option in the candidate set that simultaneously satisfies
  the *Critical* and *High* weight drivers (performance, effects, large
  rasters, layer system) on a single-engine architecture.
- The scene-graph API (containers, sprites, graphics) is the cleanest fit
  for a data-driven design where the canvas is a projection of a
  normalised TypeScript store (see ADR-0002, to be written).
- Built-in MSDF text in v8 mitigates the main historical pain point of
  WebGL renderers (text quality).
- A solo developer with AI-assisted tooling (Cursor agent) can reasonably
  learn PixiJS within the planned 0.3.1 timeline; raw WebGL or
  Three.js-for-2D would not be tractable.

**Fallback plan.** If the curve-text prototype (see "Validation") proves
unworkable within a two-week budget, we adopt **Option 4 (hybrid)**:
PixiJS for everything except path-aligned text labels, which fall back
to an SVG overlay layer rendered via `<textPath>`. In that case a follow-
up ADR will document the hybrid architecture in detail.

## Consequences

### Positive
- Single rendering foundation covers CV01–CV05 without re-platforming.
- GPU effects (parchment, fog, glow) become feasible and cheap at runtime.
- Layer system maps directly onto Pixi containers, each with its own
  filter stack.
- Built-in PNG export via `renderer.extract.canvas()` / `image()`.
- Performance headroom for future features (animated weather, particle
  effects, large mind maps).

### Negative
- Initial weeks will be slow due to learning curve.
- WebGL bugs surface as black screens or visual artefacts that are harder
  to diagnose than DOM bugs.
- Curve text remains a technical risk until validated.
- Text styling must go through MSDF font atlases — adding new fonts is
  a build-time step, not a runtime CSS change.

### Neutral
- The data model is deliberately engine-agnostic: PixiJS is treated as a
  projection of the scene store, not as the source of truth. Replacing
  the renderer in the future would not require touching the data model
  or the React UI layer.
- React UI (toolbars, panels, dialogs) is unaffected and remains plain
  React; the canvas is mounted imperatively into a `<canvas>` element
  managed by a thin React wrapper.

## Validation

A sandbox prototype (see `docs/prod/prototypes/001-curve-text-canvas/SPEC.md`)
must demonstrate the following before this ADR is considered fully
validated and main-line development on 0.3.1 begins:

1. **Curve text MVP.** A text string follows a user-drawn quadratic or
   cubic Bézier curve, remains readable at zoom levels 0.25× to 4×, and
   updates live when the curve is edited.
2. **Large raster background.** A 16 000 × 16 000 px PNG loads without
   crashing the renderer and pans / zooms at ≥ 30 FPS on the developer's
   primary machine.
3. **Object scale.** 1 000 polygons + 1 000 text labels render and
   interact at ≥ 30 FPS during pan / zoom.
4. **Hit-testing.** Click selection works reliably on polygons, lines,
   and rotated / curved text.
5. **PNG export.** The visible viewport can be exported to a PNG file.

Budget for the prototype: **up to two calendar weeks**. If any of the
five criteria fail after that budget, the fallback plan (Option 4) is
activated and this ADR is amended.

## References

- PixiJS v8 documentation: https://pixijs.com/
- pixi-viewport: https://github.com/davidfig/pixi-viewport
- tldraw architecture (reference for data-driven canvas):
  https://github.com/tldraw/tldraw
- Excalidraw architecture (reference for Canvas 2D editor):
  https://github.com/excalidraw/excalidraw
- Roadmap items CV01–CV05 (internal roadmap document).

## Validation outcome

Prototype 001 completed all six validation tasks and recorded **VERDICT: GO** in `docs/prod/prototypes/001-curve-text-canvas/REPORT.md`: curve text along a Bézier, large raster-style tiled background, primitive drawing, hit-testing and selection, 2 000-object stress testing, and viewport PNG export were all demonstrated. The five ADR acceptance criteria are treated as validated for starting mainline 0.3.1 work, with documented partial coverage that must be closed in mainline: curve-text click selection was deferred, and the 16k background validation used procedural 4096² tiles rather than decoding a real 16 000 × 16 000 PNG file.

The remaining deferred work is tracked in `docs/prod/prototypes/001-curve-text-canvas/CARRYOVER.md` and `docs/canvas-debt.md`. As of 2026-06-07: curve text selection is **partially** closed in mainline (0.3.5 text parity); incremental reconciliation and real 16k PNG validation remain open (`DEBT-C1`, `DEBT-011`). The measured prototype numbers were: fit-all pan on the 16 384 × 16 384 tiled background averaged **180.0 FPS** with **175.4 FPS minimum**; the 2 000-object stress test measured **60.1 / 54.1 FPS** idle, **60.2 / 52.1 FPS** pan, and **60.2 / 52.4 FPS** zoom (average / minimum); viewport export produced a small-scene PNG of approximately **22 KB** and a stress-scene PNG of approximately **293 KB**.