# Task completion
After substantive changes, run checks proportional to touched areas:
- TypeScript/shared: `npm run build:shared` and `npm run build --workspace=frontend`.
- Rust: from `src-tauri/`, `cargo fmt`, `cargo clippy -- -D warnings`, `cargo test`.
- Rust DTOs or Tauri commands: `npm run tauri:codegen` before frontend build.
- Prototype work: update its REPORT acceptance evidence/verdict.
- Rust DTO/command changes must not leave generated bindings stale.