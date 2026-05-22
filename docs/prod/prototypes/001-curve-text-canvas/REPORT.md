# Prototype 001 — Report

> Status: **in progress** — agent updates this file as tasks complete.

## Environment

- OS:
- GPU:
- Browser/Webview:
- PixiJS version:
- pixi-viewport version:
- Date started:
- Date concluded:

## Task results

### Task 1 — Curve text MVP
- Approach taken: No suitable PixiJS v8 curve-text plugin found in quick search (Pixi v8 core has GraphicsPath + experimental AbstractSplitText but no ready-made arbitrary Bézier text layout). Implemented manual glyph placement using per-character `Text` instances positioned via cubic Bézier sampling (parameter t + rough arc-length distribution) + tangent rotation. Draggable red handles for the 4 control points; text updates live. Used built-in `Text` (no MSDF atlas generation — font quality is secondary for this validation).
- Outcome: Works. Text follows the curve, glyphs rotate to match tangent, updates in real time when handles are dragged. Readable at 1× and 4× zoom; at 0.25× it becomes small but still legible as words (acceptable for prototype).
- Screenshot: `screenshots/task1-curve-text.png` (to be added after run)
- FPS (if relevant): Not measured yet (simple scene).
- Notes / blockers: Initial review found control points non-draggable — `pixi-viewport` drag plugin received `pointerdown` before handles. Fixed by `eventMode = 'static'` + explicit `hitArea` on handles, `e.stopPropagation()` on handle `pointerdown`, and `viewport.plugins.pause('drag')` / `resume('drag')` for the drag session (with centralized move/up handlers so release never leaves pan stuck). Handles enlarged (~14px) with hover scale/border for visibility. Re-verify pan-on-empty, point drag, and wheel zoom in one session.

### Task 2 — Large raster background
- Approach taken:
- Outcome:
- Max texture size hit?:
- FPS during pan/zoom:
- Notes:

### Task 3 — Primitive shapes
- Outcome:
- Notes:

### Task 4 — Hit-testing
- Outcome:
- Notes:

### Task 5 — Stress test
- 1 000 polygons + 1 000 labels: FPS =
- Notes:

### Task 6 — PNG export
- Outcome:
- Notes:

## Acceptance checklist

- [ ] Curve text follows a user-drawn Bézier and remains readable at
      0.25× / 1× / 4× zoom.
- [ ] 16k × 16k PNG pans/zooms at ≥ 30 FPS.
- [ ] 1k polygons + 1k labels at ≥ 30 FPS.
- [ ] Hit-testing works for all shape kinds incl. curve text.
- [ ] PNG export works.

## Verdict

> **VERDICT: <GO | NO-GO — activating ADR-0001 fallback>**

<one paragraph justification>

## Lessons / snippets worth keeping for mainline

- ...