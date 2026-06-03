# AGENTS.md

Правила для ИИ-агентов и контрибьюторов в репозитории `campaigner`.
Читать в начале каждой сессии.

## Что такое Campaigner

Однопользовательское десктопное приложение для мастеров настольных RPG
и worldbuilding. Полностью офлайн, без коллаборации — **никогда**.

Текущий фокус: **v0.3.1 — переход на единый canvas** (roadmap CV01–CV03).
См. `docs/prod/adr/0001-canvas-rendering-technology.md`.

## Текущая архитектура

Проект работает только в режиме **Tauri + Rust**:
- `frontend/` — React + TypeScript + Vite
- `src-tauri/` — Rust core (commands/services/repositories/models/db)
- `shared/` — общие Zod-схемы и TS-типы

`backend/` и `electron/` удалены и не используются.

## Базовые правила

- Делать минимальный дифф: менять только то, что требуется задачей.
- Не менять внешние контракты API без явного запроса.
- Не дублировать DTO вручную: использовать Rust DTO + codegen в
  `frontend/src/types/generated/`.
- Не вызывать `invoke` напрямую из страниц/компонентов/сторов — только
  через `frontend/src/api/`.
- Для branch-aware доменов использовать существующую branch-overlay
  логику Rust-слоя.
- Не добавлять новые зависимости без обоснования (одно предложение
  «зачем» в PR-описании или ответе).
- Никаких коллаборативных фич: ни CRDT, ни websocket-синхронизации, ни
  «multi-user-aware» структур данных.
- Модель данных canvas/сцены — engine-agnostic. PixiJS-специфичные типы
  не должны протекать в store, persistence или React-компоненты вне
  тонкого canvas-моста.

## Процесс принятия решений

Архитектурно значимые решения фиксируются в **ADR** (Architecture
Decision Records) в `docs/prod/adr/`. Процесс и шаблон описаны в
`docs/prod/adr/README.md`.

Перед изменениями, затрагивающими архитектуру (рендеринг, модель данных,
схема БД, межмодульные контракты, undo/redo, миграции), агент обязан:

1. Прочитать релевантные ADR в `docs/prod/adr/`.
2. Прочитать соответствующий SPEC, если работа идёт в рамках прототипа
   (`docs/prod/prototypes/<NNN>/SPEC.md`).
3. Если решение не покрыто существующим ADR — остановиться и запросить
   решение у человека в формате **DECISION NEEDED** (см. ниже).

### Формат запроса решения

> **DECISION NEEDED**
> Context: <одно предложение>
> Options:
> 1. <вариант A> — tradeoff
> 2. <вариант B> — tradeoff
> Recommendation: <A или B и почему>

Не продолжать работу за точкой принятия решения без ответа.

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

Документация и прототипы:
- `docs/prod/adr/*` — Architecture Decision Records (immutable, append-only)
- `docs/prod/prototypes/<NNN>/` — SPEC и REPORT для sandbox-прототипов
- `prototypes/<NNN>/` — код sandbox-прототипов; **не входит** в основной
  build и не должен импортироваться из `frontend/` или `src-tauri/`

## Прототипы

Прототип — это **выбрасываемый sandbox** для снятия технического риска
до начала mainline-разработки. У каждого прототипа есть:

- SPEC в `docs/prod/prototypes/<NNN>/SPEC.md` — что и зачем делаем.
- REPORT в той же папке — результат, скриншоты, FPS, вердикт **GO/NO-GO**.
- Код в `prototypes/<NNN>/` с собственным `package.json`.

Правила работы в прототипе:
- Не интегрировать с основным кодом (ни SQLite, ни Tauri, ни общих
  модулей frontend).
- Минимум зависимостей; всё нестандартное — оправдывать в REPORT.md.
- Risk-first: первой делается самая рискованная задача из SPEC.
- При фундаментальном блокере — остановиться и записать его в REPORT.md
  до попыток обходных путей.

## Активные решения

| ADR  | Тема                          | Статус                                  |
|------|-------------------------------|-----------------------------------------|
| 0001 | Canvas rendering technology   | Accepted (validated prototype 001)      |
| 0002 | MapPage migration strategy    | Accepted                                |
| 0003 | Canvas data model             | Accepted                                |
| 0004 | Scene types & scene_container | Proposed — `docs/adr/ADR-0004-*.md`     |

## Активные прототипы

| #   | Тема                              | Статус       |
|-----|-----------------------------------|--------------|
| 001 | Curve text & canvas foundation    | In progress  |

## Завершение задачи

После значимых изменений:
- проверить сборку TS: `npm run build:shared` и
  `npm run build --workspace=frontend`
- проверить Rust: `cargo fmt`, `cargo clippy -- -D warnings`, `cargo test`
- если менялись Rust DTO/commands — выполнить `npm run tauri:codegen`
- если работа в рамках прототипа — обновить
  `docs/prod/prototypes/<NNN>/REPORT.md`
- если работа валидирует или меняет ADR — добавить пометку в раздел
  «Validation» соответствующего ADR (сам ADR не редактировать
  ретроактивно; при изменении решения — писать новый ADR со статусом
  «Supersedes ADR-XXXX»)