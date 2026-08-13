# Campaigner core
- Offline, single-user desktop worldbuilding app; collaboration features are forbidden.
- Production architecture is Tauri + Rust (`src-tauri/`), React/TypeScript/Vite (`frontend/`), and shared Zod schemas/types (`shared/`). Legacy backend/electron modules are removed.
- Current roadmap focus: v0.3.1 unified canvas; accepted canvas decisions are ADR 0001–0004.
- Rust/backend details: `mem:backend/core`.
- Frontend/API boundaries: `mem:frontend/core`.
- Completion checks: `mem:task_completion`.