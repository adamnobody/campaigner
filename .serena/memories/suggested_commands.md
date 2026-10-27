# Suggested commands
From repository root:
- Frontend dev: `npm run dev --workspace=frontend`
- Tauri dev: `npm run tauri:dev`
- Shared build: `npm run build:shared`
- Frontend build: `npm run build --workspace=frontend`
- Full TS build: `npm run build`
- Rust-to-TS bindings: `npm run tauri:codegen`
From `src-tauri/`:
- Format: `cargo fmt`
- Lint: `cargo clippy -- -D warnings`
- Tests: `cargo test`
Windows shell is PowerShell; quote paths containing spaces.