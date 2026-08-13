# Appearance theme engine
- `AppThemeProvider` now always builds one MUI theme through `createCampaignerTheme`; the route-aware legacy fork and remote custom-font injection were removed.
- Pure preference-to-token mapping lives in `frontend/src/theme/appearanceTokens.ts`, using built-in/custom color presets, background tone, glow strength, bundled font preset IDs, density, motion, and reading metrics.
- `theme.campaigner` exposes surface, glow, typography, density, motion, and reading tokens. Markdown note preview and wiki article reading surfaces consume the reading tokens.
- Legacy `createAppTheme.ts` and `muiTheme.ts` were removed after confirming no imports remained.