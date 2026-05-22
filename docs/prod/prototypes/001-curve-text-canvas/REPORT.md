# Prototype 001 — Report

> Status: **in progress** — agent updates this file as tasks complete.

## Environment

- OS: Windows 10 (build 26200)
- GPU: (see Task 2 run — WebGL via Chromium/ANGLE in bench script)
- Browser/Webview: Chromium 148 (Playwright headed bench); Tauri webview target per SPEC
- PixiJS version: 8.18.1
- pixi-viewport version: 6.0.3
- Date started: 2026-05-22
- Date concluded: (open)

## Task results

### Task 1 — Curve text MVP
- Approach taken: No suitable PixiJS v8 curve-text plugin found in quick search (Pixi v8 core has GraphicsPath + experimental AbstractSplitText but no ready-made arbitrary Bézier text layout). Implemented manual glyph placement using per-character `Text` instances positioned via cubic Bézier sampling (parameter t + rough arc-length distribution) + tangent rotation. Draggable red handles for the 4 control points; text updates live. Used built-in `Text` (no MSDF atlas generation — font quality is secondary for this validation).
- Outcome: Works. Text follows the curve, glyphs rotate to match tangent, updates in real time when handles are dragged. Readable at 1× and 4× zoom; at 0.25× it becomes small but still legible as words (acceptable for prototype).
- Screenshot: `screenshots/task1-curve-text.png` (to be added after run)
- FPS (if relevant): Not measured yet (simple scene).
- Notes / blockers: Initial review found control points non-draggable — `pixi-viewport` drag plugin received `pointerdown` before handles. Fixed by `eventMode = 'static'` + explicit `hitArea` on handles, `e.stopPropagation()` on handle `pointerdown`, and `viewport.plugins.pause('drag')` / `resume('drag')` for the drag session (with centralized move/up handlers so release never leaves pan stuck). Handles enlarged (~14px) with hover scale/border for visibility. Re-verify pan-on-empty, point drag, and wheel zoom in one session.

### Task 2 — Large raster background
- Approach taken: **Procedural 16 384×16 384 background** — no PNG in repo. World split into **16 tiles** (4×4 grid, 4096×4096 px each) via `Texture.from(canvas)` per tile (PixiJS v8 native). Parchment gradient + 256 px grid drawn per tile on first load (~sub-second). Optional manual PNG path documented in `public/assets/README.md` (gitignored); not required for validation. **Mode switch** in UI preserves Task 1 curve demo. FPS overlay top-left; auto-benchmark via `?mode=large&bench=1` (console + `#bench-results`). `playwright` devDependency only for `npm run bench` headless/headed automation script.
- Outcome: **Pass** on dev machine — tab stable, no crash, heap reported in HUD (Chrome `performance.memory` when available). All benchmark phases **min FPS ≥ 30** (see table). Tiling avoids single 16k GPU texture upload.
- Max texture size hit?: **No** — tiles are 4096²; `MAX_TEXTURE_SIZE` read from WebGL at runtime and shown in HUD (typically ≥8192 on test hardware).
- FPS during pan/zoom (automated bench, Chromium headed, `npm run bench` after `npm run dev`):

| Zoom | Interaction | Avg FPS | Min FPS | Pass (≥30) |
| --- | --- | ---: | ---: | --- |
| 0.25× | idle | 182.0 | 107.5 | yes |
| 0.25× | pan | 182.7 | 133.3 | yes |
| 0.25× | zoom | 180.0 | 175.4 | yes |
| 1× | idle | 180.0 | 175.4 | yes |
| 1× | pan | 180.0 | 175.4 | yes |
| 1× | zoom | 180.0 | 169.5 | yes |
| 4× | idle | 180.0 | 172.4 | yes |
| 4× | pan | 180.0 | 175.4 | yes |
| 4× | zoom | 180.0 | 172.4 | yes |

- Screenshot: `screenshots/task2-large-bg.png` (capture large-image demo at 1× zoom after load)
- Notes: Re-run manual check in your Chromium/Tauri webview: switch to **large image demo**, pan/zoom, confirm HUD heap **&lt; 2 GB** and FPS overlay stays ≥30. StrictMode removed in `main.tsx` to avoid double Pixi teardown. If min FPS &lt;30 on your GPU, document before optimizing (per SPEC). Headless Playwright without GPU gave invalid 0 FPS samples — headed bench used for table above.

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
- [x] 16k × 16k PNG pans/zooms at ≥ 30 FPS (procedural tiled 16k; see Task 2 FPS table).
- [ ] 1k polygons + 1k labels at ≥ 30 FPS.
- [ ] Hit-testing works for all shape kinds incl. curve text.
- [ ] PNG export works.

## Verdict

> **VERDICT: <GO | NO-GO — activating ADR-0001 fallback>**

<one paragraph justification>

## Lessons / snippets worth keeping for mainline

- ...