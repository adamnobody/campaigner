# Campaigner

Campaigner is a desktop worldbuilding app for campaigns: projects, characters, factions, dynasties, notes, maps, timeline, wiki, and tags.

The repository is **Tauri-only**:
- `frontend/` — React + TypeScript + Vite UI.
- `src-tauri/` — Rust core (commands, repositories, services, migrations, uploads).
- `shared/` — shared Zod schemas and TypeScript types.

## Requirements

- Node.js `>=22 <23`
- npm
- Rust toolchain (`cargo`)
- Tauri prerequisites for your OS

## Workspace Layout

```text
campaigner/
  frontend/      React app
  shared/        Shared schemas/types
  src-tauri/     Rust core for Tauri
  scripts/       Helper scripts (codegen, tree, etc.)
```

## Development

- UI only (Vite): `npm run dev --workspace=frontend`
- Tauri app: `npm run tauri:dev`

## Build

- Shared package: `npm run build:shared`
- Frontend package: `npm run build --workspace=frontend`
- Full workspace build: `npm run build`
- Tauri bundle: `npm run tauri:build`

## Rust Checks

Run inside `src-tauri/`:
- `cargo fmt`
- `cargo clippy -- -D warnings`
- `cargo test`

## Type Generation

Generate frontend bindings from Rust DTO/commands:
- `npm run tauri:codegen`

Generated files are committed in `frontend/src/types/generated/`.
