# AGENTS.md — правила для ИИ-агентов и контрибьюторов

Краткий ориентир по репозиторию **campaigner**: монорепозиторий для кампейн-менеджмента и worldbuilding (проекты, ветки, персонажи, фракции/государства, династии, догмы, заметки, вики, карты, таймлайн, граф связей, настройки внешнего вида). Полное дерево файлов см. в [README.md](./README.md), актуальные структурные правила — в [docs/architecture/conventions.md](./docs/architecture/conventions.md).

---

## Стек и пакеты

| Пакет | Назначение |
|--------|------------|
| `shared` | Общие Zod-схемы, константы, типы. Импорт: `@campaigner/shared`. |
| `backend` | Express + TypeScript, SQLite (`better-sqlite3`), Zod, Multer. |
| `frontend` | React 18, TypeScript, Vite, MUI 5, Zustand, React Router 6, ReactFlow. |

Проект также собирается как Electron-приложение; desktop-runtime скрипты находятся в корневом `package.json` и `electron/`.

После изменений в `shared` нужна сборка: `npm run build:shared` (или полный `npm run build`).

---

## Команды (корень репозитория)

- **Разработка**: `npm run dev` — shared watch + backend + frontend.
- **Сборка**: `npm run build`.
- **Миграции БД**: `npm run db:migrate`.
- **Проверка окружения**: `npm run doctor`.
- **Smoke API**: `npm run smoke` (нужен запущенный backend; для подъёма и прогона: `npm run smoke:up`).
- **Smoke фронта**: `npm run smoke:frontend` (нужен dev-сервер фронта при проверке маршрутов).
- **Smoke полный**: `npm run smoke:final`.
- **Перф-бейзлайн**: `npm run perf:baseline` (часто нужны `API_BASE`, `PROJECT_ID`; см. скрипт).
- **Сравнение отчётов**: `npm run perf:compare`.
- **Демо-данные**: `npm run db:seed-demo` (нужен доступный API).
- **План запросов SQLite**: `npm run db:explain-hot`.
- **Electron dev/build**: `npm run electron:dev`, `npm run electron:build`.
- **Дерево проекта**: `npm run tree` (запускать после структурных изменений перед коммитом).

**Windows (PowerShell)** — переменные окружения задаются так, а не через `VAR=value cmd`:

```powershell
$env:API_BASE="http://localhost:3001/api"; npm run smoke
```

---

## Архитектурные правила

### Общие

- **Не ломать существующее поведение** без явного запроса: рефакторинг и оптимизации должны сохранять функциональность.
- **Минимальный дифф**: правки только по задаче; без «заодно причесал весь файл».
- Дублирование контрактов API избегать: источник правды для полей сущностей — **`shared`**.
- Новый домен сначала привязать к canonical placement в `shared`, `backend` и `frontend`; не создавать параллельные структуры только в одном слое.

### Backend (`backend/src`)

- Слои: **routes** (схемы запросов, привязка к контроллерам) → **controllers** → **services** → **db**.
- Асинхронные обработчики через существующие утилиты (`asyncHandler`, централизованный `errorHandler`).
- Валидация входа — Zod (в т.ч. общие схемы из `@campaigner/shared`, где уместно).
- SQL и миграции: `db/schema.ts`, `db/migrations/`. Новые горячие запросы — продумать индексы.
- Лимиты списков/поиска и прочие ограничения — согласованы с Zod и сервисами (не обходить в одном месте только).
- Для нового API-домена базовый путь: `routes/<domain>.routes.ts` → `controllers/<domain>.controller.ts` → `services/<domain>.service.ts`.
- Service-папки (`services/project/*`, `services/map/*`, `services/faction/*`, `services/dynasty/*`, `services/political-scale/*`) использовать только когда домен уже вырос и разделение снижает связность.

### Frontend (`frontend/src`)

- Состояние: **Zustand**; для производительности — **узкие селекторы** и **`shallow`** из `zustand/shallow`, где подписка иначе тянет лишние ре-рендеры.
- Тема и типографика: опираться на **MUI theme** и настройки из стора предпочтений, избегать захардкоженных семейств шрифтов в общих компонентах.
- Тяжёлые поля (тема, длинный текст): локальный draft + debounce, где это уже принято в проекте (`AppearanceSettingsPage`, слайдеры и т.д.).
- API: `frontend/src/api/client.ts` для транспорта, доменные клиенты в `frontend/src/api/<domain>.ts`; не плодить дублирующие HTTP-клиенты.
- Route-level код держать в `frontend/src/pages/<domain>/`; для выросших доменов использовать локальные `components/`, `hooks/`, `data/`, `types.ts`.
- Глобальные компоненты в `frontend/src/components/*` только если они реально shared. Текущий layout shell живёт в `frontend/src/components/Layout/*` — не создавать параллельный `layout/` без отдельной миграции.

### Shared (`shared/src`)

- Новые/изменённые поля сущностей: схемы Zod + экспорт типов; синхронизировать с бэкендом и фронтом.
- Текущая структура `shared/src/schemas/*` остаётся плоской; не дробить на `schemas/<domain>/...` без явной необходимости.

---

## Тестирование и регрессии

- После значимых изменений: `npm run build` с корня.
- При работе с API: убедиться, что backend запущен; smoke — `npm run smoke` или `npm run smoke:up`.
- Документ по перф-регрессиям (если трогали горячие пути): [docs/performance-regression-checklist.md](./docs/performance-regression-checklist.md).

---

## Скрипты и данные

- Вспомогательные сценарии — **`scripts/`** (Node `.mjs`, кроссплатформенно).
- База и загрузки бэкенда — см. `backend/data/` (включая `backend/data/uploads/`); не коммитить личные дампы без необходимости.

---

## Что агенту не делать без запроса

- Не добавлять новые README/доки, кроме явно попросленных.
- Не отключать проверки, лимиты и валидацию «чтобы заработало».
- Не вводить новые тяжёлые зависимости без обсуждения.

---

## Краткий чеклист перед завершением задачи

1. Изменения в `shared` → `npm run build:shared` / полный `build`.
2. TypeScript-сборка пакетов проходит.
3. По возможности прогнать smoke или описать, почему сценарий не применим.
4. Поведение UI и API для затронутых сценариев сохранено.

### Структурные соглашения

Для структурных изменений, перемещения файлов, выбора между shared и domain-local кодом, а также для правил импортов API см.:

- `docs/architecture/conventions.md`

- **Canonical API imports**:
  - транспортный слой — `frontend/src/api/client.ts`
  - доменные API — `frontend/src/api/<domain>.ts`
  - simple domain files обычно plural: `maps.ts`, `projects.ts`, `notes.ts`
  - compound domain files — `camelCase`: `characterTraits.ts`, `politicalScales.ts`, `graphLayout.ts`

- **Размещение кода**:
  - `frontend/src/components/ui/*` — только переиспользуемые domain-agnostic UI-примитивы
  - `frontend/src/components/forms/*` — только переиспользуемые form-компоненты
  - `frontend/src/components/Layout/*` — текущий глобальный layout/navigation shell
  - `frontend/src/components/detail/*`, `frontend/src/components/exclusions/*`, `frontend/src/components/onboarding/*` — существующие shared-зоны
  - `frontend/src/pages/<domain>/` — route-level страницы (`*Page.tsx`) и локальный код: `components/`, `hooks/`, при необходимости `data/`, `types.ts`
- Если компонент используется только внутри одного домена/маршрута, его **не нужно** поднимать в глобальные `components/*`.

- **Текущие frontend-домены (`frontend/src/pages/*`)**:
  - `home`, `project-dashboard`, `project-settings`, `appearance`
  - `maps`, `characters`, `notes`, `wiki`, `timeline`, `dogmas`, `graph`, `factions`, `dynasties`
  - URL не обязан совпадать с папкой: например `/project/:projectId/map` обслуживается `pages/maps`, а `/states` переиспользует `pages/factions`.

- **Сторы (`frontend/src/store/*`)**:
  - хранить там только global/cross-page state или доменный state, реально используемый несколькими экранами
  - не выносить в Zustand page-local modal state, локальные draft'ы форм, временные фильтры и другой ephemeral UI state без явной причины
  - branch-aware состояние должно явно учитывать `projectId + branchId`

- **Именование**:
  - доменные папки — `kebab-case`
  - React-компоненты — `PascalCase.tsx`
  - hooks — `useXxx.ts`
  - stores — `useXxxStore.ts`
  - utility/helper файлы — `camelCase.ts`
  - существующая `frontend/src/components/Layout` — historical exception, не паттерн для новых папок

- **Refactor policy**:
  - предпочитать маленькие PR и минимальный diff
  - giant files декомпозировать постепенно (strangler pattern), а не переписывать целиком
  - не переносить файлы “на будущее”, если переиспользование пока не подтверждено

- После структурных изменений запусти npm run tree перед коммитом