# Prototype 001 — Curve text & canvas foundation

## Purpose

Validate the technical choices made in **ADR-0001** before committing
mainline 0.3.1 development to PixiJS. This prototype is a **throwaway
sandbox**, not production code. Its only deliverables are:

1. A go / no-go answer for PixiJS v8.
2. A short written report (`REPORT.md` in this folder) summarising what
   worked, what didn't, and rough performance numbers.
3. (Optional) Reusable snippets that may later be ported into the main
   codebase.

## Non-goals

- Production quality code.
- UI polish.
- Integration with the main Campaigner codebase, SQLite, or Tauri.
- Undo / redo, persistence, multi-document support.
- Touch / mobile input.

## Tech stack

- **Build**: Vite + TypeScript (strict mode).
- **UI shell**: React 18, function components, no global state library
  needed — use `useState` / `useRef`. The point is to test the canvas,
  not React patterns.
- **Renderer**: PixiJS **v8** (current stable at time of writing).
- **Viewport**: `pixi-viewport` (verify v8 compatibility; if it lags
  v8, fall back to a hand-written pan/zoom on a root `Container`).
- **No backend.** Everything in-memory, refresh = reset.

Sandbox code lived in `prototypes/001-curve-text-canvas/` (removed 2026-06-07 after
mainline validation). Historical setup used a separate folder, e.g.
`prototypes/001-curve-text-canvas/`,
with its own `package.json`. Do **not** add it to the main app's
workspaces.

## Architecture (intentionally minimal)

```
App.tsx
  └── <CanvasHost />              #,
                                  #          stress test, export PNG
```

The scene holds a plain in-memory array of objects with a discriminated
union type:

```ts
type SceneObject =
  | { id: string; kind: 'polygon'; points: [number, number][]; fill: number }
  | { id: string; kind: 'polyline'; points: [number, number][]; stroke: number }
  | { id: string; kind: 'text'; x: number; y: number; rotation: number; content: string }
  | { id: string; kind: 'curveText'; curve: BezierCurve; content: string }
  | { id: string; kind: 'image'; x: number; y: number; src: string }
```

`PixiScene` reconciles this array onto Pixi display objects. A naive
"clear and rebuild on every change" is acceptable for the prototype.

## Validation tasks (in this order — risk-first)

Each task must end with a screenshot or short screen recording committed
to this folder.

### Task 1 — Curve text MVP  *(highest risk, do first)*

1. User draws a cubic Bézier curve by clicking 4 points on empty canvas.
2. A text string ("The Kingdom of Aldoria") is laid out along the curve.
3. Glyphs follow the curve tangent (each glyph rotated to match).
4. The text remains visually correct at zoom levels 0.25×, 1×, 4×.
5. Dragging any control point of the curve updates the text in real time.

**Approach to attempt, in order:**

1. Search npm for an existing PixiJS v8 curve-text plugin. If a working
   one exists, use it.
2. If not, implement manual glyph placement: sample the curve at
   arc-length intervals matching each glyph's advance width, place a
   `PIXI.Text` (or `BitmapText`) per glyph at the sampled position with
   the tangent rotation.
3. If both are blocked, document the blocker in `REPORT.md` and stop —
   this triggers the ADR-0001 fallback.

### Task 2 — Large raster background

1. Provide a sample 16 000 × 16 000 PNG (or generate one programmatically
   with a colourful gradient and grid).
2. Load it as a Pixi `Sprite` on the BackgroundLayer.
3. Confirm it loads on a typical dev machine without crashing.
4. Pan and zoom across the full extent at ≥ 30 FPS.
5. If GPU texture-size limits are hit, document the threshold and try
   tiled loading (split into 4096-tile chunks).

### Task 3 — Primitive shapes

1. Add a polygon by clicking points, double-click to close.
2. Add a polyline by clicking points, Enter to finish.
3. Add a plain text label at a clicked position, with rotation slider.
4. All shapes draggable.

### Task 4 — Hit-testing and selection

1. Click any object to select it (visual feedback: dashed bounding box
   or tint).
2. Selection works for polygons (including concave), polylines (with
   small hit tolerance), text, and curve text.

### Task 5 — Stress test

1. Button: "Spawn 1 000 polygons + 1 000 labels at random positions."
2. Measure FPS during pan / zoom using Pixi's built-in stats or
   `stats.js`.
3. Record the result in `REPORT.md`.

### Task 6 — PNG export

1. Button: "Export viewport to PNG."
2. Use `renderer.extract.canvas(stage)` or `image(stage)` to produce
   a downloadable PNG of the current viewport.
3. Verify text and shapes appear correctly in the exported file,
   including curve text.

## Acceptance criteria (mirror of ADR-0001 § Validation)

The prototype is **successful** if all five criteria from ADR-0001 are
met. The prototype is **failed** (triggering the fallback plan) if any
of these is false after the two-week budget:

- [ ] Curve text follows a user-drawn Bézier and stays readable at
      0.25× / 1× / 4× zoom.
- [ ] A 16 000 × 16 000 PNG background pans / zooms at ≥ 30 FPS.
- [ ] 1 000 polygons + 1 000 labels render and interact at ≥ 30 FPS.
- [ ] Click selection works for all shape kinds including curve text.
- [ ] Viewport can be exported to a PNG file.

## Deliverables

In `docs/prod/prototypes/001-curve-text-canvas/`:

- `REPORT.md` — written conclusions, per-task results, FPS numbers,
  screenshots, and an explicit **GO** or **NO-GO** verdict on PixiJS v8.
- `screenshots/` — at least one screenshot per task.
- A link to the sandbox repo/folder containing the prototype code.

## Out of scope (do NOT do)

- Persistence (no SQLite, no localStorage beyond optional debug aids).
- Tauri integration.
- Connection to the main Campaigner codebase.
- Production-grade UI / styling.
- Cross-browser testing — Chromium (the Tauri webview) is the only
  target.
- Internationalisation, accessibility audits.
- Unit tests. Manual verification is sufficient for a throwaway.

## Working agreement with the agent

- Commit early and often; one commit per task is fine.
- If you discover that an approach is fundamentally blocked, **stop and
  write it up in REPORT.md before trying alternatives** — we want to
  know what didn't work, not just what did.
- Do not silently expand scope. If you want to add something not in
  this spec, ask first.
- Keep dependencies minimal: PixiJS, pixi-viewport, React, Vite, and
  TypeScript. Anything else needs justification in REPORT.md.

## References

- ADR-0001 — Canvas rendering technology.
- PixiJS v8 docs: https://pixijs.com/8.x/guides
- PixiJS v8 text guide (MSDF / BitmapText):
  https://pixijs.com/8.x/guides/components/text
- pixi-viewport: https://github.com/davidfig/pixi-viewport
- Bézier curve arc-length parameterisation reference (any standard
  computer-graphics text; e.g. "Real-Time Rendering" ch. 17).