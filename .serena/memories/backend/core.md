# Rust backend
- `src-tauri/src/commands/<domain>.rs`: thin Tauri command adapters.
- `services/<domain>.rs`: domain logic; `repositories/<domain>.rs`: SQL and row mapping; `models/*.rs`: serde/specta DTOs; `db/*` and `src-tauri/migrations/*`: connection/schema migrations.
- Upload persistence is centralized under `src-tauri/src/uploads/`; upload web paths use `/uploads/<known-subdir>/<filename>` and resolve only through validated `UploadSubdir`.
- Commands must be registered in runtime `src-tauri/src/lib.rs` and the Specta codegen catalog `src-tauri/src/specta.rs`.