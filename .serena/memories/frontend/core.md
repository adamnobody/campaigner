# Frontend boundaries
- Route pages under `frontend/src/pages/<feature>/`; reusable primitives under `frontend/src/components/ui/`; only cross-page state belongs in `frontend/src/store/`.
- All Tauri calls route through `frontend/src/api/*`; API modules map generated Rust DTOs to `@campaigner/shared` domain types.
- Generated bindings are produced into `frontend/src/types/generated/bindings.ts`; never edit them manually.
- Shared Zod contracts live under `shared/src/schemas/` with inferred exported types under `shared/src/types/`.