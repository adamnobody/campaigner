# Tauri migration checklist

Use this when porting API domains from Express (HTTP) to Tauri IPC.

## Transport-agnostic API modules

- Domain modules live in `frontend/src/api/<domain>.ts`.
- Every public function calls `transport.request({ http: {...}, tauri: {...} })`.
- Do **not** import `apiClient` outside:
  - `frontend/src/api/client.ts`
  - `frontend/src/api/transport/http.ts`
  - `frontend/src/api/transport/httpMultipart.ts`
- Run `npm run lint:api-client` before opening a PR.

## Upload asset URLs

- Store **relative** paths in the DB (`/uploads/...`).
- Resolve for display with `resolveUploadAssetUrl()` or `useAssetUrl()` — never hand-build `/api/uploads/...` or `campaigner://...`.
- Tauri uses `uploads_resolve_path` + `convertFileSrc()`; web uses `/api/uploads/...`.

## Rust domain port (per feature)

1. Service + repository in `src-tauri/src/`.
2. `#[tauri::command]` in `src-tauri/src/commands/`.
3. Register in `src-tauri/src/lib.rs`.
4. Regenerate `frontend/src/types/generated/` (`npm run tauri:codegen`).
5. `cargo fmt`, `cargo clippy -- -D warnings`, `cargo test`.
6. Manual smoke under `npm run tauri:dev`.

## Not yet ported (HTTP-only)

- Project **export** / **import** (full payload) — `projectsApi.exportProject` / `importProject` throw in Tauri until implemented.

## Env

| Mode | Command | Env file |
|------|---------|----------|
| HTTP | `npm run dev` | `frontend/.env.development` → `VITE_TRANSPORT=http` |
| Tauri | `npm run tauri:dev` | `frontend/.env.tauri` → `VITE_TRANSPORT=tauri` |
