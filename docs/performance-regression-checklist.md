# Performance Regression Checklist

## Baseline capture

1. Start backend and frontend in dev mode.
2. Open the app and perform a short warm-up:
   - open `Appearance` page and move 3 sliders for 5-10 seconds;
   - drag markers/territory points on map for 10-15 seconds;
   - type quickly in note editor for 10-15 seconds.
3. Run backend baseline script:
   - `npm run perf:baseline`
   - optional: `PROJECT_ID=<id> npm run perf:baseline`
4. Save output into task notes before/after optimizations.

## Acceptance gates

- Theme settings drag feels responsive (no visible freezes longer than ~150ms).
- `Appearance` slider moves smoothly during continuous drag.
- Map marker/point drag remains smooth with multiple territories.
- Markdown editor typing in split mode does not stall on every keystroke.
- No new TypeScript or linter errors.

## Quick sanity suite

- `npm run build --workspace=frontend`
- `npm run build --workspace=backend`
- `npm run smoke` (optional but recommended before release)

## Runtime observability

- Check `GET /api/metrics/perf` after manual interaction.
- Investigate endpoints with highest `p95Ms` and `p99Ms`.
