# AGENTS.md

Краткие правила для ИИ-агентов и контрибьюторов в репозитории `campaigner`.

## Текущая архитектура

Проект работает только в режиме **Tauri + Rust**:
- `frontend/` — React + TypeScript + Vite
- `src-tauri/` — Rust core (commands/services/repositories/models/db)
- `shared/` — общие Zod-схемы и TS-типы

`backend/` и `electron/` удалены и не используются.

## Базовые правила

- Делать минимальный дифф: менять только то, что требуется задачей.
- Не менять внешние контракты API без явного запроса.
- Не дублировать DTO вручную: использовать Rust DTO + codegen в `frontend/src/types/generated/`.
- Не вызывать `invoke` напрямую из страниц/компонентов/сторов — только через `frontend/src/api/`.
- Для branch-aware доменов использовать существующую branch-overlay логику Rust-слоя.

## Команды

Из корня:
- `npm run dev --workspace=frontend`
- `npm run tauri:dev`
- `npm run build:shared`
- `npm run build --workspace=frontend`
- `npm run build`
- `npm run tauri:build`
- `npm run tauri:codegen`

Из `src-tauri/`:
- `cargo fmt`
- `cargo clippy -- -D warnings`
- `cargo test`

## Размещение кода

Frontend:
- `frontend/src/api/*` — доменные API-модули
- `frontend/src/components/ui/*` — переиспользуемые UI-примитивы
- `frontend/src/pages/<feature>/*` — route-level страницы и локальные компоненты
- `frontend/src/store/*` — только global/cross-page состояние

Rust (`src-tauri/src/`):
- `commands/<domain>.rs` — тонкие Tauri-команды
- `services/<domain>.rs` — доменная логика
- `repositories/<domain>.rs` — SQL и доступ к данным
- `models/*` — DTO/типы для сериализации и codegen
- `db/*` — подключение, пути, миграции

## Завершение задачи

После значимых изменений:
- проверить сборку TS: `npm run build:shared` и `npm run build --workspace=frontend`
- проверить Rust: `cargo fmt`, `cargo clippy -- -D warnings`, `cargo test`
- если менялись Rust DTO/commands, выполнить `npm run tauri:codegen`
