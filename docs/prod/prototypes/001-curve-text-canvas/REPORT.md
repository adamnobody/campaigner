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
- FPS during pan/zoom (automated bench, Playwright **Chromium** headed, `npm run bench` after `npm run dev`). **Vsync:** state not instrumented; sustained ~180 FPS min across phases suggests **vsync off / uncapped** in this environment — numbers are **relative**, not absolute vs a 60 Hz display.

| Zoom | Interaction | Avg FPS | Min FPS | Pass (≥30) |
| --- | --- | ---: | ---: | --- |
| 0.25× (rel. fit) | idle | 179.6 | 89.3 | yes |
| 0.25× (rel. fit) | pan | 180.0 | 172.4 | yes |
| 0.25× (rel. fit) | zoom | 180.0 | 166.7 | yes |
| 1× (rel. fit) | idle | 180.0 | 175.4 | yes |
| 1× (rel. fit) | pan | 180.0 | 175.4 | yes |
| 1× (rel. fit) | zoom | 180.0 | 175.4 | yes |
| 4× (rel. fit) | idle | 180.0 | 172.4 | yes |
| 4× (rel. fit) | pan | 180.0 | 175.4 | yes |
| 4× (rel. fit) | zoom | 180.0 | 175.4 | yes |
| **fit-all (~0.043×) — worst case: all 16 tiles visible** | **pan** | **180.0** | **175.4** | **yes** |

- **Worst-case interpretation:** `fit-all` zoom fits the entire 16 384×16 384 world on screen (all 16 tiles drawn). Rel. 0.25×/1×/4× rows are relative to “fit viewport” and do **not** guarantee all tiles visible — high FPS there can be misleading; the fit-all row is the stress case.
- **Google Chrome (vsync-respecting) manual row:** not captured on agent machine (Playwright `channel: 'chrome'` unavailable). **Please run locally:** `npm run dev`, then `node scripts/chrome-worst-case.cjs`, or open `?mode=large&bench=1` in desktop Chrome and read the fit-all row in the HUD/console.
- **Agent sanity (5 s pan at fit-all, Playwright Chromium):** min FPS **~90** observed (`?mode=large&sanity=1` / `node scripts/sanity-check.cjs`); still ≥30, no optimization attempted.
- Screenshot: `screenshots/task2-large-bg.png` (capture large-image demo at fit-all zoom after load)
- Notes: Re-run in your Chromium/Tauri webview; confirm HUD heap **&lt; 2 GB**. Headless Playwright without GPU gave invalid 0 FPS — do not use for validation.

**Procedural tiles vs real PNG:** Validation uses **procedural canvas tiles**, not a loaded 16k PNG. Memory profile, decode time, and GPU upload behavior of a real ~250 MB asset are **not** validated here. Main project should re-test with a representative PNG (or production pipeline asset) before locking ADR-0001.

### Task 3 — Primitive shapes
- Approach taken: Third demo mode **Primitives demo** (`?mode=primitives`) with React-owned `SceneObject[]` (`sceneTypes.ts`) synced to Pixi via naive clear-and-rebuild (`primitivesBridge.ts`). Toolbar: Polygon / Polyline / Text (toggle off = no tool). Polygon: click vertices, double-click close (≥3 points). Polyline: click vertices, **Enter** finish (≥2 points). Text: click to place, rotation slider in left sidebar updates last placed label. **Pan UX:** no tool → left-drag pan; tool active → **right-drag pan** (`viewport.plugins` drag `mouseButtons: 'right'`). Shape drag uses Task 1 pattern (`stopPropagation` + `pause('drag')` on shape). Pixi v8 Graphics: `moveTo`/`lineTo`/`closePath` + `fill()` / `stroke()`. Esc cancels in-progress shape.
- Outcome: **Pass** — all three primitives drawable, draggable as whole objects, Tasks 1–2 unchanged via demo dropdown.
- Screenshots: `screenshots/task3-polygon.png`, `task3-polyline.png`, `task3-text.png`
- Notes / gotchas: Double-click on polygon may add an extra vertex before close (acceptable for prototype). Text rotation slider applies to last placed label only (no selection UI until Task 4). Playwright screenshot script: `node scripts/capture-task3-screenshots.cjs` with dev server running.

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

- [x] Curve text follows a user-drawn Bézier and remains readable at
      0.25× / 1× / 4× zoom (Task 1 approved).
- [x] 16k × 16k PNG pans/zooms at ≥ 30 FPS (procedural tiled 16k; see Task 2 FPS table).
- [ ] 1k polygons + 1k labels at ≥ 30 FPS.
- [ ] Hit-testing works for all shape kinds incl. curve text.
- [ ] PNG export works.

## Verdict

> **VERDICT: <GO | NO-GO — activating ADR-0001 fallback>**

<one paragraph justification>

## Technical debt / carry-over to main project

- **StrictMode disabled** in `prototypes/001-curve-text-canvas/src/main.tsx` due to incomplete Pixi `Application` teardown in the React `useEffect` cleanup (double-mount under StrictMode leaves duplicate listeners/textures). Acceptable for this throwaway prototype; **main project must implement proper `destroy()` + listener removal before re-enabling StrictMode.**

## Lessons / snippets worth keeping for mainline

- Tiled 4096² sprites for 16k worlds; fit-all zoom is the FPS stress case, not rel. 0.25×.
- ...