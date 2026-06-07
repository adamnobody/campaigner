# Prototype 001 — Carry-over to mainline 0.3.1

## Purpose

This file lists work that was deferred from [prototype 001](./REPORT.md) and must be addressed (or explicitly re-deferred with justification) during mainline **0.3.1** implementation on PixiJS v8. The prototype verdict is **GO** — see [REPORT.md](./REPORT.md) — but these items were never in scope for the throwaway sandbox or were only partially validated. They map to gaps relative to [ADR-0001](../../adr/0001-canvas-rendering-technology.md) validation criteria.

## Carry-over items

### 1. Curve text click selection

**Origin:** Task 4 spec required selection for all shape kinds including curve text; Task 4 implementation only covered polygon / polyline / text. Called out in [REPORT.md](./REPORT.md) Task 4 and verdict section.

**Why it wasn't done in the prototype:** Task 4 was scoped to primitives mode; the curve-text demo lives in a separate mode in the prototype, and bridging the two modes was out of scope for a throwaway.

**Risk if ignored:** One of the five ADR-0001 acceptance criteria ("Click selection works for all shape kinds including curve text") is only partially verified — rendering and export are validated, click hit-testing is not.

**Suggested approach for mainline:** Glyph bbox union — when a `curveText` object is reconciled, store the per-glyph world-space oriented bboxes (or AABBs) alongside the display object; hit-test iterates glyphs and returns hit if any bbox contains the click point. Alternative: stroke-with-tolerance on the underlying Bézier (cheaper, less precise at glyph edges). Pick **glyph-bbox-union**; document if rejected.

**Verification idea:** Extend `verify-selection.cjs` (or its mainline successor) — place a curve-text object, click on a glyph mid-curve → assert selected; click 20 px off the curve → assert not selected; click in the bbox-of-the-whole-curve-string gap between glyphs on a sharp bend → assert not selected (this is the case where naive overall-bbox would fail).

---

### 2. Real 16 000 × 16 000 PNG background on min-spec hardware

**Origin:** Task 2 used a procedurally generated 16k backdrop, not a real PNG file decoded from disk. Noted in [REPORT.md](./REPORT.md) verdict.

**Why it wasn't done in the prototype:** Faster to iterate with a procedural texture; the prototype's purpose was rendering perf, not asset pipeline.

**Risk if ignored:** Real PNG decode + GPU texture upload at 16k² may hit:

- Browser/Chromium decode memory limits.
- GPU `MAX_TEXTURE_SIZE` (often 16384 on desktop, but 8192 or 4096 on some integrated GPUs and on Tauri's webview on older Windows).
- File-size / load-time issues that aren't visible with a procedural source.

**Suggested approach for mainline:** (1) Test with a real 16k PNG on a min-spec target (low-end integrated GPU, Tauri webview on Windows 10). (2) If `MAX_TEXTURE_SIZE` < 16384, implement tiled loading — split into 4096-px chunks at build time or on first load, render as adjacent sprites on the BackgroundLayer. (3) Lazy-load tiles based on viewport.

**Verification idea:** Load a real 16k PNG on the min-spec target; pan/zoom across full extent ≥ 30 FPS (mirrors Task 2 criterion). Add an automated check that queries `gl.getParameter(gl.MAX_TEXTURE_SIZE)` and switches to the tiled path when needed.

---

### 3. Incremental scene reconciliation

**Origin:** [REPORT.md](./REPORT.md) Task 5 finding — naive clear-and-rebuild costs ~1–2 s at 2000 objects; pan/zoom only stay at 60 FPS because the scene array doesn't change between frames.

**Why it wasn't done in the prototype:** Spec explicitly allowed naive reconciliation for the prototype.

**Risk if ignored:** Any operation that mutates the scene per frame — dragging an object, animating, live curve editing, multi-select drag — will trigger a full rebuild every frame and tank FPS. This will surface the moment we wire up real interaction in 0.3.1, not later.

**Suggested approach for mainline:** Replace clear-and-rebuild with a keyed diff: maintain `Map<id, PixiDisplayObject>`; on reconcile, walk the new scene array, reuse existing display objects by id (update properties in place), create for new ids, destroy for removed ids. Keep the reconciler pure / side-effect-free from React's perspective.

**Verification idea:** Spawn 2000 objects, drag one continuously for 3 seconds, assert FPS ≥ 30 throughout (extend `verify-stress.cjs`). Also benchmark: reconcile of unchanged scene should be < 1 ms, single-object update < 1 ms.

## Status tracking

| # | Item | Status | Mainline ticket | Resolved in |
| --- | --- | --- | --- | --- |
| 1 | Curve text click selection | **partial** | — | 0.3.5 text parity: select, handle edit, glyph bbox hit-test; arc-precision → `DEBT-012` |
| 2 | Real 16k PNG on min-spec | open | — | `DEBT-011` |
| 3 | Incremental reconciliation | open | — | `DEBT-C1` (`image` only partial) |
