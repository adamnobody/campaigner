# AGENTS.md — правила для ИИ-агентов и контрибьюторов

Краткий ориентир по репозиторию **campaigner**: монорепозиторий для кампейн-менеджмента (проекты, персонажи, фракции, династии, заметки, карты, таймлайн, вики). Полное дерево файлов см. в [README.md](./README.md).

> ⚠ **Репозиторий находится в активной миграции** с Electron + Express + `better-sqlite3` на **Tauri 2 + Rust + `rusqlite`**. До завершения миграции действуют дополнительные правила — см. раздел «Миграция на Tauri + Rust» ниже. В случае конфликта правила миграции имеют приоритет над общими правилами Backend/Electron.

---

## Стек и пакеты

| Пакет | Назначение | Статус |
|--------|------------|--------|
| `shared` | Общие Zod-схемы, константы, типы. Импорт: `@campaigner/shared`. | Активный (Zod остаётся для UI-форм) |
| `backend` | Express + TypeScript, SQLite (`better-sqlite3`), Zod, Multer. | **Frozen as oracle** — изменять только в рамках задач миграции |
| `frontend` | React 18, TypeScript, Vite, MUI 5, Zustand, React Router 6, ReactFlow. | Активный |
| `electron` | Desktop-обёртка через Electron + bundled Node. | **Frozen for removal** — не трогать без явной задачи |
| `src-tauri` | Rust core: commands, services, db, миграции, uploads. | Новый, в активной разработке |

После изменений в `shared` нужна сборка: `npm run build:shared` (или полный `npm run build`).

---

## Команды (корень репозитория)

### Текущие (legacy backend + Electron)

- **Разработка (web)**: `npm run dev` — shared watch + backend + frontend.
- **Сборка**: `npm run build`.
- **Миграции БД (Express backend)**: `npm run db:migrate`.
- **Проверка окружения**: `npm run doctor`.
- **Smoke API**: `npm run smoke` (нужен запущенный backend; для подъёма и прогона: `npm run smoke:up`).
- **Smoke фронта**: `npm run smoke:frontend` (нужен dev-сервер фронта при проверке маршрутов).
- **Smoke полный**: `npm run smoke:final`.
- **Перф-бейзлайн**: `npm run perf:baseline` (часто нужны `API_BASE`, `PROJECT_ID`; см. скрипт).
- **Сравнение отчётов**: `npm run perf:compare`.
- **Демо-данные**: `npm run db:seed-demo` (нужен доступный API).
- **План запросов SQLite**: `npm run db:explain-hot`.

### Tauri / Rust (добавляются по мере миграции)

- **Tauri dev**: `npm run tauri:dev` — Vite + Tauri shell, Rust ядро в режиме отладки.
- **Tauri build**: `npm run tauri:build`.
- **Rust проверки** (выполнять из `src-tauri/`): `cargo fmt`, `cargo clippy -- -D warnings`, `cargo test`.
- **Кодген TS-типов из Rust**: команда настраивается в `src-tauri/build.rs` / отдельный bin (`tauri-specta`); сгенерированные файлы должны быть **закоммичены** в `frontend/src/types/generated/`.

### Переменные окружения для миграции

- `VITE_TRANSPORT=http` — фронт ходит в Express (по умолчанию во время миграции).
- `VITE_TRANSPORT=tauri` — фронт ходит через `invoke` в Rust.

**Windows (PowerShell)** — переменные окружения задаются так, а не через `VAR=value cmd`:

```powershell
$env:API_BASE="http://localhost:3001/api"; npm run smoke
$env:VITE_TRANSPORT="tauri"; npm run tauri:dev
Архитектурные правила
Общие
Не ломать существующее поведение без явного запроса: рефакторинг и оптимизации должны сохранять функциональность.
Минимальный дифф: правки только по задаче; без «заодно причесал весь файл».
Дублирование контрактов API избегать: источник правды для полей сущностей — shared (для Zod-валидации форм) и Rust DTO + кодген (для серверных моделей по мере миграции).
На время миграции Express backend = поведенческий oracle: новый Rust-домен должен отвечать совместимо с Express по тем же сценариям, иначе это регрессия.
Backend Express (backend/src) — frozen as oracle
Слои: routes (схемы запросов, привязка к контроллерам) → controllers → services → db.
Асинхронные обработчики через существующие утилиты (asyncHandler, централизованный errorHandler).
Валидация входа — Zod (в т.ч. общие схемы из @campaigner/shared, где уместно).
SQL и миграции: db/schema.ts, db/migrations/. Новые горячие запросы — продумать индексы.
Лимиты списков/поиска и прочие ограничения — согласованы с Zod и сервисами (не обходить в одном месте только).
Во время миграции: новые HTTP-роуты не добавлять; правки только bug-fix, если того требует параллельная работа с Rust-портом.
Rust core (src-tauri/src) — активная разработка
См. подробный раздел «Миграция на Tauri + Rust» ниже. Кратко:

Слои: commands → services → db (зеркало Express).
SQLite через rusqlite (sync), не sqlx, не plugin-sql.
Все пути к данным — через единый модуль paths, опирающийся на Tauri app_data_dir(). Никаких хардкодов data/campaigner.sqlite.
Ошибки — typed enum AppError с serde; нормализация в формат фронта происходит в TS-адаптере, не в Rust.
Любой branch-aware домен идёт через BranchOverlayService — даже если для первого порта это заглушка.
Frontend (frontend/src)
Состояние: Zustand; для производительности — узкие селекторы и shallow из zustand/shallow, где подписка иначе тянет лишние ре-рендеры.
Тема и типографика: опираться на MUI theme и настройки из стора предпочтений, избегать захардкоженных семейств шрифтов в общих компонентах.
Тяжёлые поля (тема, длинный текст): локальный draft + debounce, где это уже принято в проекте (AppearanceSettingsPage, слайдеры и т.д.).
API: модули в frontend/src/api/; не плодить дублирующие клиенты без нужды.
Транспорт во время миграции: домены НЕ знают, HTTP это или Tauri. Все вызовы идут через единый Transport-интерфейс (frontend/src/api/transport/). Подробности — в разделе «Миграция».
Крупные страницы по возможности декомпозировать (подстраницы, pages/...), не раздувать один файл без причины.
Shared (shared/src)
Новые/изменённые поля сущностей: схемы Zod + экспорт типов; синхронизировать с бэкендом и фронтом.
Во время миграции: Zod остаётся источником правды для UI-форм и контракта Express API. Для Rust-команд источник правды — Rust DTO + кодген. Если поле есть в Zod, но нет в Rust DTO (или наоборот), это баг — синхронизировать, а не дублировать вручную.
Миграция на Tauri + Rust
Целевая архитектура (кратко)

campaigner/
  src-tauri/                  Rust core (новое)
    src/
      main.rs
      commands/<domain>.rs    = бывшие routes/controllers
      services/<domain>.rs    доменная логика
      db/{connection,paths,migrations}.rs
      models/                 DTO с serde + ts-rs/specta
      branch_overlay.rs       единая точка overlay
      error.rs                AppError enum
    migrations/*.sql
    tauri.conf.json
    Cargo.toml
  frontend/src/
    api/
      transport/
        index.ts              factory + интерфейс Transport
        http.ts               через axios → Express
        tauri.ts              через invoke → Rust
      <domain>.ts             использует transport, НЕ знает о реализации
    types/generated/          кодген из Rust (закоммичено)
  shared/                     Zod-схемы, остаются для UI-форм
  backend/, electron/         frozen, удаляются после полной миграции
Стратегия — strangler fig
Tauri shell поднимается рядом с Electron, не заменяя его сразу.
Домены переключаются на Rust по одному, через PR на каждый.
Пока домен не переключён — он продолжает работать через HTTP к Express.
Express считается поведенческим oracle: ответ Rust-команды для того же запроса должен совпадать (с поправкой на нормализацию ошибок).
Запрещено без явной задачи
Изменять backend/src/* сверх минимальных bug-fix, необходимых для миграции.
Изменять electron/* — слой заморожен под удаление.
Добавлять новые HTTP-роуты в Express.
Делать прямые вызовы invoke(...) из страниц, компонентов или сторов. Все Tauri-вызовы идут через frontend/src/api/transport/tauri.ts и существующие доменные модули frontend/src/api/<domain>.ts.
Дублировать Zod-схемы как рукописные Rust-структуры без подключения к codegen pipeline (tauri-specta / ts-rs).
Хардкодить пути к БД и uploads в Rust — только через модуль paths.
Менять формат ошибок Express «чтобы совпасть с Rust» или наоборот. Несоответствия покрывает TS-адаптер.
Обязательно для каждого портируемого домена
Rust service в src-tauri/src/services/<domain>.rs.
Rust commands в src-tauri/src/commands/<domain>.rs, зарегистрированы в main.rs.
DTO с #[derive(Serialize, Deserialize, Type)], типы сгенерированы в frontend/src/types/generated/ и закоммичены.
Обновлённый frontend/src/api/<domain>.ts через transport-абстракцию — без прямых invoke.
Поведенческий паритет с Express-API:
тот же запрос → та же форма ответа (с поправкой на нормализацию ошибок);
соответствующий smoke-сценарий проходит на сборке VITE_TRANSPORT=tauri.
Rust-проверки пройдены: cargo fmt, cargo clippy -- -D warnings, cargo test.
Если домен branch-aware (notes, dogmas, timeline, map_markers, map_territories) — проходит через BranchOverlayService, даже если на этом этапе это заглушка.
Транспортный слой (frontend)
Единый интерфейс Transport с методами вроде request<T>(operation, payload): Promise<T>.
Две реализации: httpTransport (axios → Express) и tauriTransport (invoke → Rust).
Выбор реализации — на этапе сборки через import.meta.env.VITE_TRANSPORT, не рантайм-флагом в каждом домене.
Доменные модули frontend/src/api/<domain>.ts пишутся в терминах Transport; смена реализации не требует правок в страницах/сторах.
Контракты и типы
Источник правды для Rust↔TS DTO — Rust + codegen.
Zod-схемы в shared/ остаются источником правды только для валидации форм на фронте.
Сгенерированные TS-типы лежат в frontend/src/types/generated/ и коммитятся в git.
Лимиты и константы из shared/src/constants.ts, которые нужны и Rust-сервисам, синхронизируются явно (либо через кодген, либо через ручной шаг с проверкой).
Данные и uploads
БД — в app_data_dir()/campaigner.sqlite, получаемая через модуль paths.
Uploads — в app_data_dir()/uploads/*, отдаются через custom protocol (например, campaigner://uploads/...), а не как статический /uploads HTTP-эндпоинт.
Миграция пользовательских данных из Electron-путей (%APPDATA%/<old-appId>/campaigner.sqlite) — отдельный явный сценарий с бэкапом, без перетирания существующих файлов.
Проверки на каждом этапе миграции
TypeScript/UI: минимум npm run build:shared && npm run build:frontend, при существенных правках — полный npm run build.
Rust: cargo fmt, cargo clippy -- -D warnings, cargo test в src-tauri/.
Поведение:
пока домен на HTTP — старый smoke применим;
после переключения домена на Tauri — Rust integration tests + frontend adapter tests + ручной сценарий из соответствующего smoke.
Данные: миграционные тесты на копии SQLite/uploads; не трогать пользовательские данные напрямую.
Чек-лист PR на портирование одного домена
 Rust service + commands + DTO + регистрация в main.rs.
 Сгенерированные TS-типы обновлены и закоммичены.
 frontend/src/api/<domain>.ts использует transport, не invoke напрямую.
 Сценарии работают и под VITE_TRANSPORT=http, и под VITE_TRANSPORT=tauri (для уже портированных доменов).
 cargo fmt && cargo clippy -- -D warnings && cargo test — зелёные.
 npm run build зелёный.
 Поведенческий паритет с Express подтверждён (smoke или ручной сценарий).
 Если домен branch-aware — overlay идёт через BranchOverlayService.
 Не затронуты несвязанные домены и страницы.
Тестирование и регрессии
После значимых изменений: npm run build с корня.
При работе с Express API: убедиться, что backend запущен; smoke — npm run smoke или npm run smoke:up.
При работе с Rust core: cargo test в src-tauri/ + ручной/smoke-сценарий через Tauri-сборку.
Документ по перф-регрессиям (если трогали горячие пути): docs/performance-regression-checklist.md.
Скрипты и данные
Вспомогательные сценарии — scripts/ (Node .mjs, кроссплатформенно).
База и загрузки бэкенда Express — см. backend/data/ (включая backend/data/uploads/); не коммитить личные дампы без необходимости.
База и загрузки Rust core — в Tauri app_data_dir() (на dev-машине; реальные пути не коммитятся).
Что агенту не делать без запроса
Не добавлять новые README/доки, кроме явно попросленных.
Не отключать проверки, лимиты и валидацию «чтобы заработало».
Не вводить новые тяжёлые зависимости без обсуждения (касается и npm, и Cargo.toml).
Не «улучшать» Express backend или Electron слой, если задача касается миграции.
Не размазывать invoke по компонентам/сторам — всегда через frontend/src/api/transport/tauri.ts.
Не вводить параллельные форматы ошибок: один Rust AppError, одна нормализация в TS-адаптере.
Краткий чеклист перед завершением задачи
Изменения в shared → npm run build:shared / полный build.
Изменения в Rust → cargo fmt && cargo clippy -- -D warnings && cargo test.
TypeScript-сборка пакетов проходит.
По возможности прогнать smoke или описать, почему сценарий не применим.
Поведение UI и API (HTTP и/или Tauri) для затронутых сценариев сохранено.
Если задача — портирование домена: пройден чек-лист из раздела «Миграция».
Структурные соглашения
Для структурных изменений, перемещения файлов, выбора между shared и domain-local кодом, а также для правил импортов API см.:

docs/architecture/conventions.md

Canonical API imports:

транспортный слой (legacy/HTTP) — frontend/src/api/client.ts
транспортный слой (миграция, абстракция) — frontend/src/api/transport/index.ts
доменные API — frontend/src/api/<domain>.ts
сгенерированные типы из Rust — frontend/src/types/generated/
Размещение кода (frontend):

frontend/src/components/ui/* — только переиспользуемые domain-agnostic UI-примитивы
frontend/src/components/forms/* — только переиспользуемые form-компоненты
frontend/src/components/layout/* — глобальный layout/navigation shell
frontend/src/pages/<feature>/ — route-level страницы (*Page.tsx) и локальный код: components/, при необходимости hooks/ (см. фактическую структуру в репозитории)
Если компонент используется только внутри одного домена/маршрута, его не нужно поднимать в глобальные components/*.

Размещение кода (Rust, src-tauri/src/):

commands/<domain>.rs — только тонкие Tauri-команды: парсинг входа, вызов сервиса, маппинг ошибки.
services/<domain>.rs — доменная логика и SQL.
db/ — connection, миграции, пути, общие хелперы.
models/ — DTO с serde и derive для кодгена.
branch_overlay.rs — единая реализация overlay для branch-aware доменов.
error.rs — AppError enum и From-импликации.
Сторы (frontend/src/store/*):

хранить там только global/cross-page state или доменный state, реально используемый несколькими экранами
не выносить в Zustand page-local modal state, локальные draft'ы форм, временные фильтры и другой ephemeral UI state без явной причины
Именование:

доменные папки — kebab-case
React-компоненты — PascalCase.tsx
hooks — useXxx.ts
stores — useXxxStore.ts
utility/helper файлы — camelCase.ts
Rust-модули и файлы — snake_case.rs
Rust-типы и DTO — PascalCase
Tauri commands — snake_case в Rust, мапятся в camelCase на TS-стороне через serde/specta настройки
Refactor policy:

предпочитать маленькие PR и минимальный diff
giant files декомпозировать постепенно (strangler pattern), а не переписывать целиком
не переносить файлы «на будущее», если переиспользование пока не подтверждено
при портировании домена не переписывать соседние домены «заодно» — отдельный PR на каждый
После структурных изменений запусти npm run tree перед коммитом.