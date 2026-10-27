# Tech stack
- Windows development environment; npm workspaces (`shared`, `frontend`), Node >=22 <23.
- Desktop runtime: Tauri 2.11, Rust 2021, SQLite through rusqlite 0.39 bundled.
- Rust DTO/codegen: serde + specta/tauri-specta; generated TypeScript bindings live in `frontend/src/types/generated/`.
- Frontend: React 18, TypeScript, Vite 5, MUI, Zustand, Zod; PixiJS 8/pixi-viewport for canvas.
- Shared contract package: `@campaigner/shared`, Zod 3 schemas and inferred types.