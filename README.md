# Campaigner

Монорепозиторий приложения для ведения и управления фэнтези/настольными кампаниями: проектами мира, персонажами, фракциями, династиями, заметками, вики, картами и таймлайном.

Документ написан как единая точка входа:
- для разработчика, который впервые открывает проект;
- для AI-агента, который будет выполнять задачи в этом репозитории.

---

## 1) Зачем создан проект

`Campaigner` решает практическую проблему кампейн-менеджмента: хранить и поддерживать в консистентном виде большой объем лора и связей между сущностями игрового мира.

Основная идея:
- один проект = один мир/кампания;
- данные структурированы по доменам (персонажи, фракции, карты, заметки и т.д.);
- backend и frontend работают на одном наборе контрактов из `shared`;
- приложение ориентировано на длительную эволюцию мира (ветки, импорт/экспорт, история, графы связей).

---

## 2) Что умеет система

Ключевые домены:
- **Projects**: контейнер кампаний, настройки проекта, импорт/экспорт.
- **Characters**: карточки персонажей, связи между персонажами, трейты.
- **Factions**: фракции, ранги, участники, межфракционные отношения.
- **Dynasties**: семейные связи, события династий.
- **Maps**: карты, маркеры, территории, графические привязки.
- **Notes + Wiki**: заметки, wiki-статьи и ссылки между ними.
- **Timeline**: события и хронология мира.
- **Tags + Search**: классификация и поиск по данным.
- **Branches**: overlay-ветвление данных для вариативных сценариев.

---

## 3) Технологический стек

### Backend
- `Node.js` + `TypeScript`
- `Express`
- `better-sqlite3` (SQLite)
- `Zod` (валидация)
- `Multer` (загрузки)

### Frontend
- `React 18` + `TypeScript`
- `Vite`
- `MUI 5`
- `Zustand`
- `React Router 6`
- `ReactFlow`

### Shared
- Пакет `@campaigner/shared`: схемы, типы, константы, контракты API.

### Desktop
- `Electron` (dev/build скрипты в корне).

---

## 4) Структура репозитория

```txt
campaigner/
  backend/      API + DB + бизнес-логика
  frontend/     UI-приложение
  shared/       общие контракты (источник правды для схем)
  scripts/      smoke/perf/doctor/db утилиты
  docs/         архитектурные и технические документы
  electron/     desktop-обертка
  data/         локальная БД и загрузки (runtime)
```

---

## 5) Архитектура и поток данных

Базовый поток:
1. UI вызывает API-клиенты из `frontend/src/api/*`.
2. Запрос приходит в `backend/src/routes/*`.
3. Route валидирует вход (Zod) и делегирует в controller.
4. Controller остается тонким и вызывает service.
5. Service выполняет доменную логику и работу с БД.
6. Ответ возвращается в стандартизированном формате API.

Ключевой принцип: **контракты полей и валидации должны быть согласованы через `shared`**, чтобы frontend/backend не расходились.

---

## 6) Быстрый старт (разработка)

### Требования
- Node.js (рекомендуется 22+, минимум 18+ для части скриптов).
- npm.

### Установка

```bash
npm install
```

Переменные окружения для backend: см. `backend/.env.example` (локально копируйте в `.env` в корне репозитория).

### Проверка окружения

```bash
npm run doctor
```

### Запуск проекта в dev-режиме

```bash
npm run dev
```

Команда поднимает:
- watch для `shared`;
- backend (`http://localhost:3001`);
- frontend (`http://localhost:5173`).

### Альтернативный запуск на Windows

Для ручного локального старта есть `start.bat` (проверки + запуск + автооткрытие браузера).

---

## 7) Основные команды (корень)

- `npm run dev` — общий dev-режим.
- `npm run build` — полная сборка монорепо.
- `npm run build:shared` / `build:backend` / `build:frontend` — сборка конкретного пакета.
- `npm run db:migrate` — миграции backend БД.
- `npm run doctor` — диагностика окружения/структуры/базовых рисков.
- `npm run smoke` — smoke API (нужен запущенный backend).
- `npm run smoke:frontend` — smoke frontend маршрутов.
- `npm run smoke:final` — API + frontend smoke.
- `npm run smoke:up` — подъем и прогон smoke в одном сценарии.
- `npm run perf:baseline` — baseline перформанса.
- `npm run perf:compare` — сравнение perf-отчетов.
- `npm run db:seed-demo` — сиды демо-данных.
- `npm run db:explain-hot` — explain-планы горячих SQL.

---

## 8) Порты, прокси, runtime-данные

- Backend по умолчанию: `3001` (`PORT`).
- Frontend (Vite): `5173`.
- Vite проксирует `/api` и `/uploads` на backend.

Runtime:
- БД: `data/campaigner.sqlite`
- Файлы загрузок: `data/uploads/*`

Backend автоматически создаёт нужные директории данных при старте.

---

## 9) Принципы разработки (обязательно)

### 9.1 Общие
- Не ломать существующее поведение без явного запроса.
- Держать **минимальный diff** (без лишнего «заодно»).
- Не дублировать контракты, когда есть `shared`.

### 9.2 Backend
- Слои: `routes -> controllers -> services -> db`.
- Валидация входа через Zod.
- Асинхронные обработчики через существующие утилиты (`asyncHandler`, `errorHandler`).

### 9.3 Frontend
- Состояние: `Zustand`; использовать узкие селекторы и `shallow` при необходимости.
- Стараться держать domain-local код рядом со страницей (`pages/<domain>`).
- В новом коде использовать canonical API импорты из `frontend/src/api/client.ts` и `frontend/src/api/<domain>.ts`.

### 9.4 Shared
- Новые поля домена сначала фиксируются в схемах/типах `shared`, затем синхронизируются на backend/frontend.

---

## 10) Качество и регрессии

Минимальный чек перед завершением значимых изменений:
1. `npm run build`
2. при API-изменениях: `npm run smoke` (или `npm run smoke:up`)
3. при UI-изменениях: `npm run smoke:frontend`
4. если трогали горячие пути: `npm run perf:baseline` + сверка с `docs/performance-regression-checklist.md`

Наблюдаемость:
- endpoint `GET /api/metrics/perf` для snapshot метрик запросов.

---

## 11) Как вносить изменения безопасно

Рекомендуемый workflow:
1. Проверить контекст задачи и затрагиваемые домены.
2. Внести минимальные правки в целевые файлы.
3. Если меняли контракты `shared`, обязательно пересобрать `shared`.
4. Прогнать релевантные проверки.
5. Убедиться, что нет побочных изменений в несвязанных зонах.

Антипаттерны:
- массовые структурные переезды без реальной пользы;
- смешивание крупного рефакторинга и изменения поведения в одном diff;
- добавление нового legacy-слоя без необходимости.

---

## 12) Раздел для AI-агента (важно)

Ниже — практические правила, чтобы агент работал с проектом предсказуемо.

### 12.1 Миссия агента
- Доставлять рабочий результат end-to-end.
- Беречь существующее поведение и архитектурные договоренности.
- Делать аккуратные, локальные изменения с понятной мотивацией.

### 12.2 Что читать перед правками
1. Этот `README.md`.
2. `AGENTS.md`.
3. `docs/architecture/conventions.md`.
4. Файлы конкретного домена, который меняется.

### 12.3 Обязательные инварианты
- Не дублировать схемы: источник контракта — `shared`.
- Для frontend API использовать `frontend/src/api/client.ts` и `frontend/src/api/<domain>.ts`.
- Domain-local компоненты не поднимать в глобальные `components/*` без подтвержденного переиспользования.
- Не выносить page-local transient state в global store без явной причины.

### 12.4 Правила изменения кода
- Делать минимальный diff.
- Не менять несвязанные файлы.
- Не отключать валидацию/лимиты «чтобы работало».
- Не добавлять тяжёлые зависимости без обоснования.
- После изменений запускать релевантные проверки.

### 12.5 Когда меняется `shared`
Если изменились схемы/типы/константы в `shared`:
1. выполнить `npm run build:shared` (или полный `npm run build`);
2. убедиться, что backend/frontend используют новые поля консистентно;
3. проверить, что не осталось старых несовместимых контрактов.

### 12.6 Минимальный checklist агента перед финалом
- [ ] Затронуты только необходимые файлы.
- [ ] Сборка/проверки для затронутых зон пройдены или явно описаны ограничения.
- [ ] Не создано архитектурного долга (legacy-imports, дубли контрактов, лишний global state).
- [ ] Изменение объяснено простым языком: что, почему, как проверено.

---

## 13) Полезные документы

- `AGENTS.md` — правила для агентов и контрибьюторов.
- `docs/architecture/conventions.md` — структурные и импортные конвенции.
- `docs/performance-regression-checklist.md` — быстрый контроль перф-регрессий.
- `PROJECT_TREE.md` — ориентир по файловой структуре.

---

## 14) Схема базы данных

Основная БД — SQLite, инициализация через `backend/src/db/connection.ts` + `backend/src/db/schema.ts`.

Где лежат миграции:
- `backend/src/db/migrations/*`
- запуск инициализации/миграций: `initializeDatabase()` из `backend/src/db/connection.ts`
- отдельный скрипт: `npm run db:migrate`

Текстовая диаграмма (укрупненно, по главным доменам):

```txt
projects
  ├─< characters ─< character_relationships >─ characters
  │                 └─< character_trait_assignments >─ character_traits
  ├─< notes ─< wiki_links (source_note_id / target_note_id)
  ├─< maps ─< map_markers
  │          └─< map_territories >─ factions
  ├─< timeline_events
  ├─< tags ─< tag_associations (polymorphic by entity_type/entity_id)
  ├─< dogmas
  ├─< factions ─< faction_ranks
  │             ├─< faction_members >─ characters
  │             ├─< faction_assets
  │             ├─< faction_policies
  │             └─< faction_relations (source_faction_id / target_faction_id)
  ├─< dynasties ─< dynasty_members >─ characters
  │              ├─< dynasty_family_links (source/target_character_id)
  │              └─< dynasty_events
  └─< scenario_branches ─< branch_overrides
                         ├─< branch_local_entities
                         └─< geo_story_events
```

Конвенции в текущей схеме:
- **ID**: почти везде `INTEGER PRIMARY KEY AUTOINCREMENT`.
- **Timestamps**: `created_at`/`updated_at` как `TEXT DEFAULT (datetime('now'))`; `updated_at` обновляется сервисами при `UPDATE`.
- **JSON-поля в TEXT**:
  - `map_territories.points` (сериализованные `rings`, есть legacy-формат);
  - `branch_overrides.patch_json`;
  - `branch_local_entities.payload_json`;
  - `geo_story_events.payload_json`.
- **Foreign keys**: активно используются (`ON DELETE CASCADE/SET NULL`), и принудительно включены через `PRAGMA foreign_keys = ON`.

Примечание по миграциям:
- в коде есть `001_create_maps_table.ts`, `002_*`, `003_*`, `004_*`;
- в `initializeDatabase()` явно вызываются `002`, `003`, `004` + `createTables`;
- `001` в текущем потоке инициализации напрямую не вызывается (исторический артефакт).

---

## 15) Карта: архитектура и особенности

### 15.1 Что реально используется сейчас

Текущая карта не на Leaflet: в коде нет `react-leaflet`, `ImageOverlay`, `CRS.Simple`.

Фактическая реализация:
- `frontend/src/pages/maps/MapPage.tsx` рендерит обычный `<img>` как подложку;
- поверх подложки рисуется `SVG`-слой (`MapTerritorySvg.tsx`) для территорий;
- маркеры — абсолютные DOM-элементы (`MapMarkerOnMap.tsx`);
- координаты нормализуются в диапазоне `0..1` (в API/БД) и показываются как проценты `0..100` на фронте.

### 15.2 Подложка карты

- пользователь загружает изображение через `POST /api/maps/:mapId/image`;
- backend сохраняет файл в `data/uploads/maps/*` и записывает `image_path`;
- frontend берет URL как `/api${imagePath}` и отображает картинку;
- пан/зум реализованы вручную (transform + wheel/mouse), без GIS-движка.

### 15.3 Территории

Модель территории:
- это не GeoJSON-объект, а `rings: Array<Array<{x,y}>>`;
- в БД хранится как JSON в `map_territories.points`;
- поддерживаются мультиконтуры (материк + анклавы);
- есть привязка к фракции (`factionId`);
- подпись рисуется по крупнейшему контуру (`getLargestRing`) прямо в SVG.

Цвета/визуал:
- у территории есть `color`, `borderColor`, `opacity`, `borderWidth`, `smoothing`;
- при выборе фракции в UI обычно задается/подтягивается цвет фракции, но это не жесткий DB-триггер: в таблице хранится собственный цвет территории.

### 15.4 Текущие ограничения

- маркеры визуально круглые (контейнер `borderRadius: 50%`);
- режима «свободных надписей» как отдельной сущности нет;
- рисование примитивов (линии/прямоугольники/окружности) отсутствует;
- режимы карты ограничены `select` и `draw_territory`.

---

## 16) API: структура эндпоинтов

Базовый префикс: ` /api`.

### 16.1 Паттерн URL

В проекте смешанный стиль:
- часть endpoint'ов использует вложенность (`/projects/:projectId/maps/root`, `/factions/:id/ranks`, `/dynasties/:id/events`);
- часть использует плоский ресурс + `projectId` в query (`/characters?projectId=...`, `/notes?projectId=...`, `/dogmas?projectId=...`).

То есть паттерн «все только под `/api/projects/:pid/...`» **не полностью соблюдается** в текущем коде.

### 16.2 Основные группы endpoint'ов

- `projects`: CRUD, map upload, import/export, demo.
- `characters`: CRUD, image, graph, relationships, tags.
- `notes`: CRUD, фильтрация/пагинация, tags.
- `maps`: root/tree/map CRUD, markers, territories, image upload.
- `timeline`: CRUD + reorder + tags.
- `dogmas`: CRUD + reorder + tags.
- `factions`: CRUD, image/banner, ranks/members/assets/relations/policies, graph, tags.
- `dynasties`: CRUD, image, members/family-links/events/graph-positions, tags.
- `wiki`: links + categories.
- `tags`, `search`, `branches`, `character-traits`, `upload`.

### 16.3 Формат ответов

Успех (базовый):

```json
{
  "success": true,
  "data": {},
  "message": "optional"
}
```

Ошибка:

```json
{
  "success": false,
  "error": "message",
  "details": {}
}
```

### 16.4 Пагинация

Единого формата для всех доменов пока нет:
- `characters`/`notes`: `data.items + total + page + limit + totalPages`;
- `factions`/`dynasties`: `data` (массив) + `total` на верхнем уровне;
- `dogmas`: `data: { items, total }`;
- часть endpoint'ов возвращает просто массив без пагинации.

---

## 17) Electron: детали работы

### 17.1 Dev vs Production

`electron/main.js` использует `app.isPackaged`:
- **dev**: `basePath = path.join(__dirname, '..')`;
- **production**: `basePath = process.resourcesPath`.

При этом в обоих режимах `main.js` поднимает backend из собранного файла:
- `backend/dist/index.js`
- и задает `NODE_ENV=production` для spawned-процесса.

Важно:
- `npm run electron:dev` предварительно делает `npm run build`, затем запускает Electron;
- «живого» Vite dev-сервера внутри electron-режима нет.

### 17.2 Как стартует backend

- `main.js` ищет системный `node` (`where node`/`which node`);
- спавнит `node backend/dist/index.js` с env:
  - `PORT=3001`
  - `DATABASE_PATH`
  - `FRONTEND_DIST_PATH`
  - `NODE_PATH`
- окно открывает `http://localhost:3001` (backend раздаёт frontend dist).

### 17.3 Health-check / readiness

Явного HTTP health-check (`fetch /api/health`) в `main.js` нет.

Текущая логика готовности:
- ожидание строк в `stdout` сервера (`Server`/`listening`/`port`);
- fallback-таймаут ~6 секунд, после которого окно открывается принудительно.

### 17.4 Пути к данным

- **Обычный backend dev (не Electron)**: БД по умолчанию `data/campaigner.sqlite` в корне репозитория.
- **Electron (dev и prod)**: `DATABASE_PATH` передается как `app.getPath('userData')/campaigner.sqlite`.

Итого: разделение «dev=корень, prod=userData» верно для режима standalone backend vs packaged Electron; в самом `main.js` userData используется в обоих electron-режимах.

### 17.5 Сборка desktop

- пакет собирается через `electron-builder` (`npm run electron:build`);
- в сборку включаются `backend/dist`, `frontend/dist`, `shared/dist`, `node_modules` (с фильтрами исключений).

---

## 18) Текущее состояние и план развития

### 18.1 Реализованные фичи (по состоянию кода)

| Фича | Статус | Основание в коде |
|---|---|---|
| Projects | Реализовано | `projects` API + import/export/demo |
| Characters + Traits | Реализовано | `character*` + `character_traits*` таблицы и роуты |
| Factions + Relations | Реализовано | `factions`, `faction_relations`, ranks/members/assets/policies |
| Maps + Territories | Реализовано | `maps`, `map_markers`, `map_territories`, полный UI-модуль |
| Timeline | Реализовано | `timeline_events` + reorder/tags |
| Notes + Wiki | Реализовано | `notes`, `wiki_links`, markdown flow |
| Dynasties | Реализовано | `dynasties`, members/family-links/events |
| Electron | Реализовано | `electron/main.js`, `electron-builder` конфиг |

### 18.2 Запланированные задачи (по приоритету)

Явного файла roadmap в репозитории не найдено; таблица ниже зафиксирована как рабочий план из текущего запроса.

| Приоритет | Задача | Краткое описание | Статус |
|---|---|---|---|
| P1 | Государства | Выделить государства в отдельный домен, не смешанный с фракциями; добавить отдельный пункт в `Sidebar` и соответствующие страницы/API. | Planned |
| P1 | Амбиции фракций | Добавить карточки-амбиции в стиле trait-системы персонажей, с набором примерно 25-35 предустановленных вариантов и возможностью расширения. | Planned |
| P1 | Политика-шкалы | Переработать блок политик после отделения амбиций: сделать шкалы и более явную метрику состояния вместо текущего плоского списка. | Planned |
| P2 | Структурированные активы | Перевести активы фракций из свободного текста в структурированные числовые поля, чтобы строить графики и сравнения между фракциями. | Planned |
| P2 | Рисование прямыми линиями | Добавить режим рисования на карте «как в Pax Historia»: линейные/контурные инструменты вместо текущей опоры на круглые маркеры. | Planned |
| P2 | Надписи на карте | Добавить самостоятельные текстовые метки на карте, не привязанные к территории или маркеру. | Planned |
| P2 | Примитивы на карте | Добавить примитивы (в первую очередь прямоугольники/«полки») с опциональной подписью для схем и аннотаций. | Planned |

---

## 19) Известные legacy-особенности

- `MUI 5` — базовый UI-стек проекта; в текущем репозитории это принципиальная технологическая опора.
- В legacy-участках могут встречаться прямые `fetch` (в т.ч. вне API-клиентов), поэтому при рефакторинге стоит проверять вызовы через поиск по коду.

---

## 20) Shared: внутренняя структура

Внутри `shared/src`:
- `schemas/` — Zod-схемы доменов;
- `types/index.ts` — производные TS-типы и интерфейсы API-ответов;
- `constants.ts` — лимиты, enum-like константы, словари;
- `index.ts` — верхнеуровневый реэкспорт (`schemas`, `types`, `constants`).

### Пошаговый пример: добавление нового домена в `shared`

1. Создать Zod-схему в `shared/src/schemas/<domain>.schema.ts`.
2. Экспортировать схему из `shared/src/schemas/index.ts`.
3. В `shared/src/types/index.ts` добавить типы через `z.infer`/`z.input`.
4. Убедиться, что `shared/src/index.ts` продолжает реэкспортировать `schemas/types/constants`.
5. Выполнить `npm run build:shared`.
6. Подключить новые типы и схемы в backend (валидация роутов/сервисов) и frontend (`frontend/src/api/*`, store, UI).

Мини-шаблон:

```ts
// shared/src/schemas/example.schema.ts
export const exampleSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
});

// shared/src/types/index.ts
export type Example = z.infer<typeof exampleSchema>;
```

---

## 21) Frontend: навигация и структура страниц

Роутинг описан в `frontend/src/App.tsx`:
- корневой layout: `Route path="/" element={<AppLayout />}`;
- главная: `/`;
- глобальная страница внешнего вида: `/appearance`;
- проектный контур: `/project/:projectId/*`.

Основные маршруты внутри проекта:
- `/project/:projectId/map` и `/project/:projectId/map/:mapId`;
- `/project/:projectId/characters`, `/characters/new`, `/characters/:characterId`, `/characters/graph`;
- `/project/:projectId/factions`, `/factions/new`, `/factions/:factionId`;
- `/project/:projectId/dynasties`, `/dynasties/new`, `/dynasties/:dynastyId`;
- `/project/:projectId/notes`, `/notes/:noteId`, `/wiki`, `/wiki/graph`, `/timeline`, `/dogmas`, `/settings`.

Как устроен `Sidebar` (`frontend/src/components/layout/Sidebar.tsx`):
- всегда есть глобальные пункты: «Все кампании» (`/`) и «Внешний вид» (`/appearance`);
- в контексте проекта показывается project-local меню (`map`, `characters`, `factions`, `notes`, `wiki`, `timeline`, `dogmas`, `dynasties`) и «Настройки проекта»;
- активный пункт определяется через `location.pathname.startsWith(...)`.

Паттерн страницы домена (по реальному коду `pages/*`):
- list-page (`FactionsPage`, `DogmasPage`, `DynastiesPage`) с фильтрами, поиском, empty state, иногда infinite scroll;
- detail-page (`FactionDetailPage`, `DynastyDetailPage`, `CharacterDetailPage`) с hero-блоком, формой и табами;
- domain-local подкомпоненты в `frontend/src/pages/<feature>/components/*` (и при необходимости `hooks/`), без преждевременного выноса в глобальные `components`.

---

## 22) Zustand stores

Локация сторов: `frontend/src/store/*` (папки `frontend/src/stores/*` в текущем коде нет).

Доменные CRUD-сторы:
- `useProjectStore.ts` — проекты, текущий проект, CRUD и загрузка карты проекта.
- `useCharacterStore.ts` — персонажи, связи, граф персонажей, теги.
- `useCharacterTraitsStore.ts` — справочник traits и назначения trait персонажу.
- `useFactionStore.ts` — фракции, ранги, участники, активы, связи, теги.
- `useDynastyStore.ts` — династии, участники, семейные связи, события, сохранение позиций дерева.
- `useNoteStore.ts` — заметки, текущая заметка, теги.
- `useTimelineStore.ts` — события таймлайна, reorder, теги.
- `useDogmaStore.ts` — догмы, фильтрация/offset-подгрузка, reorder, теги.
- `useWikiStore.ts` — wiki links и категории.
- `useMapStore.ts` — карты/маркеры/tree (частично legacy, т.к. основной map-flow в `MapPage` идёт через domain hooks и API напрямую).
- `useTagStore.ts` — справочник тегов + helper `findOrCreateTagsByNames`.
- `useBranchStore.ts` — ветки сценариев, активная ветка проекта, синхронизация с localStorage.

UI/предпочтения:
- `useUIStore.ts` — sidebar/search/snackbar/confirm dialog.
- `usePreferencesStore.ts` — тема, плотность UI, motion, фон, паттерны, кастомные темы (persist + debounced storage).
- `useStyleStore.ts` — legacy-стильные параметры (persist).
- `useOnboardingStore.ts` — прогресс онбординга по проектам (persist).

Служебные файлы:
- `branchStorage.ts` — хранение active branch per project в localStorage.
- `debouncedStorage.ts` — debounced storage-адаптер для Zustand persist.

---

## 23) Dogmas

В контексте Campaigner «догмы» — это фундаментальные правила мироустройства: аксиомы, ограничения и законы мира (магия, общество, космология и т.д.).

Что видно в backend (`backend/src/routes/dogma.routes.ts` + `backend/src/services/dogma.service.ts`):
- CRUD endpoint'ы для догм (`/api/dogmas`);
- фильтры по `category`, `importance`, `status`, `search`, плюс `limit/offset`;
- поддержка branch overlay через `branchId` (в get/update/delete/reorder);
- отдельные операции `reorder` и `/:id/tags`.

Что видно во frontend (`frontend/src/pages/dogmas/DogmasPage.tsx` + `pages/dogmas/components/*`):
- список догм по категориям с группировкой и сворачиванием секций;
- карточка догмы содержит важность, публичность, влияние, исключения, теги;
- форма догмы включает поля `category`, `importance`, `isPublic`, `impact`, `exceptions`, `icon`;
- UI-подача явно позиционирует догмы как «законы и правила мира».

Примечание: в репозитории маршрутный файл называется `dogma.routes.ts` (единственное число), а не `dogmas*.ts`.

---

## 24) Страница фракции: секции

Страница фракции (`frontend/src/pages/factions/FactionDetailPage.tsx`) организована табами `EntityTabs`:
- `overview` — обзор и основная форма;
- `structure` — структура фракции;
- `politics` — политика и межфракционные связи;
- `assets` — активы.

Содержимое по табам:

`overview`:
- левая сводка (тип, строй, статус, столица, территория, даты, теги, загрузка герба/фона);
- секция «Основная информация» (название, тип, stateType, parentFaction, цвета и т.д.);
- секция «Описание и история».

`structure`:
- секция «Ранги» (CRUD рангов);
- секция «Члены» (добавление/удаление участников, переход к персонажу).

`politics`:
- секция «Амбиции и политика» (`faction_policies` с фильтрами по типу/статусу и поиском);
- секция «Связи с фракциями» (relations CRUD, переход к другой фракции).

`assets`:
- секция «Активы» (CRUD, reorder, bootstrap default assets).

---

## 25) Branches

Текущая механика ветвления:
- сущность ветки: `scenario_branches` (`backend/src/services/branch.service.ts`);
- выбор/создание ветки на UI в `TopBar` + `useBranchStore`;
- активная ветка хранится per-project в localStorage (`branchStorage.ts`).

Как работает overlay:
- изменения не всегда пишутся в базовые таблицы;
- для branch-aware доменов формируются записи в `branch_overrides` (`upsert/delete`, `patch_json`);
- при чтении вызывается `BranchOverlayService.applyItemOverlay/applyListOverlay`.

Branch-aware в текущем коде:
- `notes`, `dogmas`, `timeline`, `map_markers`, `map_territories`.

Не branch-aware (по текущему API/сервисам):
- `characters`, `factions`, `dynasties`, `projects` и часть остальных доменов.

Степень завершенности:
- фича реализована как рабочий MVP для ограниченного набора доменов;
- в схеме есть задел (`branch_local_entities`, `geo_story_events`), но явных frontend/backend сценариев активного использования этих таблиц в текущем коде не обнаружено.

---

## 26) ReactFlow

Проверка текущего `frontend/src` показывает:
- **ReactFlow реально используется** в `frontend/src/pages/dynasties/components/FamilyTree.tsx` для интерактивного семейного дерева династии (узлы, связи, dagre layout, drag, сохранение координат);
- **граф персонажей** (`CharacterGraphPage.tsx`) реализован не на ReactFlow, а на `canvas` + force layout;
- **граф фракций** как отдельная ReactFlow-страница в текущем frontend-коде не найдена.

Итого: утверждение «ReactFlow используется для графов персонажей, фракций и династий» для текущего состояния репозитория неверно; подтверждено использование для династий.

---

## 27) Система тем и кастомизации

Основная страница кастомизации — `/appearance` (`frontend/src/pages/appearance/AppearanceSettingsPage.tsx`).

Что реально управляется с этой страницы:
- выбор пресета из `THEME_PRESETS`;
- режим поверхностей (`glass/solid`), прозрачность, blur, радиус;
- типографика (`serif/sans/custom`), плотность UI, motion;
- фон главной страницы;
- паттерны для `Paper` и `Card` (включая загрузку custom texture);
- сохранение пользовательских тем (`saveCurrentAsCustomTheme/applyCustomTheme/deleteCustomTheme`).

`usePreferencesStore` vs `useStyleStore`:
- `usePreferencesStore` (`frontend/src/store/usePreferencesStore.ts`) — основной и актуальный источник настроек внешнего вида, используется в `AppearanceSettingsPage` и `AppThemeProvider`;
- `useStyleStore` (`frontend/src/store/useStyleStore.ts`) — legacy-store с более узким набором полей, в основной странице кастомизации не используется.

Как формируется MUI theme:
- `AppThemeProvider` читает state из `usePreferencesStore` и через `useMemo` вызывает `createAppTheme(...)`;
- `createAppTheme` собирает `palette`, `typography`, `shape`, `spacing` и `components.styleOverrides` (Paper/Card/Dialog/AppBar/Drawer/Button и др.);
- в `custom` режиме можно подключить внешний CSS шрифта: `AppThemeProvider` добавляет `<link rel="stylesheet">` по `customFontCssUrl`.

Пользовательские темы:
- хранятся в `customThemes` внутри `usePreferencesStore` (persist ключ `campaigner-preferences`);
- snapshot включает почти все визуальные параметры (пресет, шрифты, паттерны, прозрачности, фон);
- применение темы подставляет snapshot в активный state и переключает `selectedCustomThemeId`.

---

## 28) Import / Export проектов

### 28.1 Endpoint'ы

- `GET /api/projects/:id/export` — выгрузка проекта JSON-файлом;
- `POST /api/projects/import` — импорт `ImportedProjectPayload`.

Frontend-обертки:
- `projectsApi.exportProject(id)` и `projectsApi.importProject(data)` в `frontend/src/api/projects.ts`.

### 28.2 Формат и состав export

Export формируется в `backend/src/services/project/projectExport.service.ts`:
- возвращается payload формата `ImportedProjectPayload` + `exportedAt`;
- версия экспорта сейчас `version: '2.0'`;
- включаются project/meta и коллекции доменов: characters, relationships, notes/folders, maps/markers/territories, timeline, tags/tagAssociations, wikiLinks, dogmas, factions (и связанные сущности), dynasties (и связанные сущности);
- бинарные ассеты сериализуются в base64 (`mapImageBase64`, `imageBase64` для map/character).

### 28.3 Как работает import

Import реализован транзакционно в `backend/src/services/project/projectImport.service.ts`:
- создается **новый** проект (имя с суффиксом `"(импорт)"`);
- создается main branch (`Каноничная ветвь`);
- для сущностей пересоздаются записи с **новыми ID**;
- соответствия старых->новых ID ведутся через `Map<number, number>` для каждого домена;
- связи и polymorphic tag associations восстанавливаются уже по remap ID;
- base64 ассеты сохраняются в файловую систему через `saveBase64ToFile(...)`.

### 28.4 На что смотреть при изменении доменных схем

При добавлении поля/сущности нужно синхронно обновлять:
1. `ImportedProjectPayload` в `shared` (тип + схема);
2. `importProjectSchema` в `backend/src/routes/project.routes.ts`;
3. `projectExport.service.ts` (включение в export);
4. `projectImport.service.ts` (вставка + remap зависимостей).

Если обновить только один слой, импорт/экспорт станет частично несовместимым.

---

## 29) Demo-проект

Есть два разных сценария демо-данных:

1) `POST /api/projects/demo`
- вызывает `ProjectController.createDemo` и дальше `ProjectService.createDemoProject()`;
- используется `demoProjectPayload` (`backend/src/services/project/demoProject.payload.ts`);
- payload минимальный: проект «Обучающая кампания», 1 wiki-заметка и 1 timeline-событие;
- после создания фронт обычно запускает онбординг (`HomePage.tsx`).

2) `npm run db:seed-demo`
- запускает `scripts/db/seed-demo.mjs`;
- создаёт отдельный проект и заполняет его большим synthetic-набором данных через API;
- по умолчанию: tags 16, characters 80, notes 260, timeline 120, factions 18, dynasties 8, markers 180, territories 28;
- сценарий ориентирован на perf/QA-нагрузку, а не на tutorial flow.

---

## 30) Tags (полиморфная система)

Хранилище:
- `tags` — словарь тегов в рамках проекта (`project_id`, `name`, `color`);
- `tag_associations` — полиморфные связи `tag_id + entity_type + entity_id`.

Поддерживаемые `entity_type`:
- по миграции `002_tag_associations_dynasty.ts`: `character`, `note`, `timeline_event`, `dogma`, `faction`, `dynasty`.

Примечание: если окружение не прошло миграции, в старой таблице может быть более узкий набор типов.

API:
- `GET /api/tags?projectId=...`
- `POST /api/tags`
- `DELETE /api/tags/:id`
- доменные endpoint'ы `/:id/tags` (characters/notes/timeline/dogmas/factions/dynasties) используют `TagService.setTagsForEntity(...)`.

Frontend store:
- `frontend/src/store/useTagStore.ts` держит справочник тегов;
- содержит helper `findOrCreateTagsByNames(projectId, names)`, чтобы удобно превращать пользовательский ввод в `tagIds`.

---

## 31) Search

Endpoint:
- `GET /api/search?projectId=...&q=...&limit=...`
- валидация limit ограничивает диапазон до `1..50`.

Поведение backend (`backend/src/services/search.service.ts`):
- поиск по `LIKE` в доменах: `characters`, `notes`, `map_markers`, `timeline_events`, `dogmas`, `factions`, `tags`;
- все запросы scoped по `project_id`;
- для заметок формируется snippet (`createSnippet`);
- финальная сортировка: exact match > startsWith > приоритет типа;
- контроллер возвращает пустой список, если нет `projectId` или пустой `q`.

UI:
- глобальный диалог `frontend/src/components/ui/SearchDialog.tsx`;
- поддерживает debounce ввода, клавиатурную навигацию и переход по `url` результата.

---

## 32) Wiki Graph

Что визуализируется:
- wiki-заметки (`noteType = 'wiki'`) как узлы;
- `wiki_links` как ребра между заметками;
- теги заметок используются как категории/цветовые маркеры.

Реализация:
- страница `frontend/src/pages/wiki/WikiGraphPage.tsx`;
- рендер на `HTML canvas` + force-directed physics (репульсия/пружины), pan/zoom/drag;
- двойной клик по узлу открывает заметку.

Источник данных:
- `notesApi.getAll(projectId, { noteType: 'wiki' })`;
- `wikiApi.getLinks(projectId)`.

Важно: отдельного backend endpoint `/api/wiki/graph` в текущем коде нет; граф собирается на фронте из `/api/notes` и `/api/wiki/links`.

---

## 33) Онбординг

Стор онбординга: `frontend/src/store/useOnboardingStore.ts`.

Что хранится:
- `activeProjectId`, `isActive`, `dismissed`, `version`;
- `progressByProject: Record<projectId, { stepIndex, completed }>`;
- persist-ключ: `campaigner-onboarding`.

Основные действия:
- `startForProject(projectId)` — старт/возобновление обучения;
- `nextStep()` — переход к следующему шагу;
- `stop()` — закрыть текущий walkthrough;
- `completeForProject(projectId)` — зафиксировать завершение.

UI слой:
- `frontend/src/components/onboarding/OnboardingOverlay.tsx` + `onboardingSteps.ts`;
- шаги могут задавать `route` и `selector`, overlay подсвечивает нужный DOM-элемент.

Что учитывать при добавлении нового домена:
- если домен должен быть частью tutorial flow, нужно явно добавить шаги в `onboardingSteps.ts` (route + стабильный selector);
- без этого `useOnboardingStore` о новом экране "не узнает", и пользователь его не увидит в цепочке обучения.

---

## 34) Краткое резюме

`Campaigner` — контрактно-ориентированный monorepo для управления сложным лором кампаний.  
Стабильность проекта держится на трёх опорах:
- единые схемы в `shared`,
- предсказуемые границы слоёв backend/frontend,
- инкрементальные изменения с минимальным diff и обязательными проверками.

