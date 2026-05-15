# Architecture Conventions

Краткий набор практических правил для структурных изменений в репозитории `campaigner`.

Цель документа:
- уменьшать архитектурную энтропию,
- сохранять предсказуемость структуры,
- не плодить legacy-слои,
- делать рефакторинг инкрементально, без лишнего churn.

Этот документ не заменяет здравый смысл: если правило конфликтует с реальной пользой для проекта, изменение нужно отдельно обосновать в PR.

> ⚠ **Репозиторий в активной миграции** с Electron + Express + `better-sqlite3` на **Tauri 2 + Rust + `rusqlite`**. До завершения миграции:
> - правила миграции (раздел 15) имеют приоритет над общими правилами,
> - `backend/` и `electron/` находятся в режиме freeze,
> - новые домены реализуются в `src-tauri/`, см. `AGENTS.md` раздел «Миграция на Tauri + Rust».

---

## 1. Общие принципы

### 1.1. Предпочтение — инкрементальным изменениям
- Предпочитать маленькие и средние PR.
- Не делать массовые переезды файлов без явной пользы.
- Не совмещать большой структурный рефактор и рискованное изменение поведения в одном PR.
- В период миграции это особенно важно: один PR = один домен, не больше.

### 1.2. Минимальный churn
- Не переносить файлы «на будущее».
- Не делать массовый rename/import rewrite только ради косметики.
- Если можно улучшить структуру локально и безопасно — делать это локально.

### 1.3. Canonical path важнее привычки
- У каждого слоя должен быть основной, предсказуемый путь использования.
- Transitional/compatibility paths допустимы только как временная мера.
- В период миграции HTTP-транспорт через `@/api/client` считается transitional для портируемых доменов; canonical становится `@/api/transport/*`.

### 1.4. Shared только для реально shared
- Глобальные папки и общие слои должны содержать только то, что действительно переиспользуется.
- Domain-local код должен жить рядом со своим доменом.

### 1.5. Source of truth для контрактов
- До миграции домена: **Zod-схемы в `shared/`** — источник правды для API-контракта и UI-форм.
- После миграции домена: **Rust DTO в `src-tauri/src/models/`** — источник правды для API-контракта; **Zod-схемы в `shared/`** остаются только для валидации UI-форм.
- Дублировать модель руками между Rust и TS запрещено — типы генерируются через `tauri-specta` в `frontend/src/types/generated/`.

---

## 2. Frontend API Import Policy

Путь: `frontend/src/api/*`

### 2.1. Canonical API structure

В период миграции существует два уровня:

**Транспортный уровень:**
- `frontend/src/api/client.ts` — HTTP-транспорт (axios, interceptors, базовые настройки).
- `frontend/src/api/transport/` — транспортная абстракция для миграции:
  - `transport/index.ts` — экспорт активного `Transport`
  - `transport/types.ts` — интерфейс `Transport`, `TransportOperation`
  - `transport/http.ts` — реализация поверх `apiClient`
  - `transport/tauri.ts` — реализация поверх Tauri `invoke`

**Доменный уровень:**
- `frontend/src/api/<domain>.ts` — доменные API-клиенты:
  - `maps.ts`, `projects.ts`, `notes.ts`, `timeline.ts`, `dogmas.ts`, `tags.ts`, и т.д.

**Сгенерированные типы:**
- `frontend/src/types/generated/bindings.ts` — TS-типы и сигнатуры Rust-команд из `tauri-specta`. Файл коммитится в git, редактировать руками запрещено.

### 2.2. Rules

- Новый код **должен** импортировать API из canonical paths:
  - `@/api/client` — только если домен ещё не портирован и используется напрямую как legacy
  - `@/api/transport` — внутри доменных модулей `api/<domain>.ts` после миграции на абстракцию
  - `@/api/maps`, `@/api/projects`, `@/api/notes` — для страниц, сторов, компонентов
  - `@/types/generated/bindings` — для типов сущностей и сигнатур команд портированных доменов
- Новый код **не должен** плодить параллельные обёртки над HTTP, дублирующие `apiClient` и доменные клиенты.
- Не смешивать в одном новом файле без необходимости:
  - transport logic
  - domain API
- **Запрещено** делать прямые вызовы `invoke(...)` из страниц, сторов, компонентов. Все Tauri-вызовы идут через `transport/tauri.ts` и доменные модули.
- **Запрещено** редактировать `frontend/src/types/generated/*` вручную. При конфликте merge — всегда регенерация.

### 2.3. Good

```ts
// Страница / стор / компонент
import { mapsApi } from '@/api/maps';
import { notesApi } from '@/api/notes';
import type { Tag } from '@/types/generated/bindings';

// Доменный модуль api/<domain>.ts
import { transport } from '@/api/transport';
```

### 2.4. Bad

```ts
// Обход доменных клиентов и дублирование транспорта
import axios from 'axios';
await axios.get('/api/maps');

// Прямой invoke вне transport-слоя
import { invoke } from '@tauri-apps/api/core';
await invoke('tags_list', { projectId });

// Рукописный тип, который должен генериться из Rust
type Tag = { id: number; name: string; /* ... */ };
```

---

## 3. Placement Policy

### 3.1. `frontend/src/components/*`

Глобальные компоненты должны быть реально shared.

#### `frontend/src/components/ui/*`

Использовать только для:

- domain-agnostic UI primitives
- reusable dialogs
- generic action buttons
- generic feedback/loading/error components

Примеры:

- ConfirmDialog
- DndButton
- EmptyState
- LoadingScreen

#### `frontend/src/components/forms/*`

Использовать только для:

- переиспользуемых form controls
- общих field wrappers
- shared input/autocomplete/select controls

#### `frontend/src/components/layout/*`

Использовать только для:

- app shell
- global navigation
- sidebar/topbar/layout primitives

### 3.2. `frontend/src/pages/<domain>/*`

Использовать для domain-local кода:

- route-level page
- подкомпоненты страницы
- локальные hooks
- локальные helpers
- локальные constants/styles
- domain-specific dialogs/cards/panels

Если компонент используется только внутри одного домена или route-group, он должен жить рядом с этим доменом.

### 3.3. Practical rule

Если сущность используется:

- в 2+ доменах / route-группах → кандидат в `components/*`
- только в одном домене → должна жить в `pages/<domain>/*`

### 3.4. Не поднимать в shared преждевременно

Не переносить компонент в `components/*`, если:

- он пока используется только в одном месте,
- предполагаемое переиспользование только гипотетическое,
- перенос ухудшает локальность понимания домена.

### 3.5. Good

```txt
frontend/src/pages/map/
  MapToolbar.tsx
  MapMarkerDialog.tsx
  useMapData.ts
  useMapNavigation.ts
```

если это используется только внутри map-domain.

### 3.6. Bad

```txt
frontend/src/components/map/
  MapToolbar.tsx
```

если MapToolbar нужен только MapPage.

---

## 4. Store Policy

Путь: `frontend/src/store/*`

### 4.1. Что допустимо хранить в store

Store используется для:

- global app state
- cross-page state
- доменного state, который реально шарится между несколькими экранами
- состояния, которое должно переживать навигацию или быть доступным из разных частей UI

### 4.2. Что не нужно выносить в store

Не выносить в Zustand без явной причины:

- page-local modal flags
- локальные form drafts
- временные фильтры
- локальные search inputs
- краткоживущий transient UI state одной страницы

### 4.3. Branch-aware state

Если поток branch-aware:

- ключи/кэш/загрузки должны учитывать projectId + branchId
- branch context должен быть явным, а не «где-то подтягиваться неявно»
- на стороне Rust такой домен обязательно проходит через BranchOverlayService (см. раздел 15), даже если для первого портированного домена это заглушка

### 4.4. Store consistency rules

- избегать any в публичных сигнатурах store methods
- придерживаться единообразного loading/error lifecycle
- использовать общие error helpers, если они уже есть
- не смешивать page orchestration и store responsibility без необходимости
- сторы не должны знать, какой транспорт активен (HTTP или Tauri); они работают только через `@/api/<domain>`

---

## 5. Naming Conventions

### 5.1. Folders

Доменные папки: kebab-case

- note-editor
- character-graph

Новые PascalCase-папки не вводить без сильной причины.

### 5.2. React components

- PascalCase.tsx
- MapToolbar.tsx
- ThemePreviewCard.tsx
- DogmaFormDialog.tsx

### 5.3. Hooks

- useXxx.ts
- useMapNavigation.ts
- useDebouncedDraft.ts

### 5.4. Stores

- useXxxStore.ts
- useBranchStore.ts
- useProjectStore.ts

### 5.5. API files

plural domain file names

- maps.ts
- projects.ts
- notes.ts
- branches.ts

### 5.6. Utility/helper files

- camelCase.ts
- mapUtils.ts
- branchStorage.ts
- onboardingSteps.ts

### 5.7. Route pages

- XxxPage.tsx
- MapPage.tsx
- WikiPage.tsx
- AppearanceSettingsPage.tsx

### 5.8. Rust files и Tauri commands

- Rust-модули и файлы: snake_case.rs
- tag_service.rs
- branch_overlay.rs
- Rust-типы и DTO: PascalCase
- Tag, CreateTagInput, AppError
- Tauri commands в Rust: snake_case
- tags_list, tags_create, app_health

На TS-стороне команды мапятся в camelCase через serde/specta (`#[serde(rename_all = "camelCase")]` на структурах) — это обеспечивает совместимость с существующим контрактом Express.

---

## 6. Compatibility / Legacy Policy

Иногда transitional слой полезен, если он уменьшает миграционный шок.

Но такие слои должны быть явными и ограниченными.

### 6.1. Rules

- Любой compatibility/legacy слой должен быть явно помечен комментарием.
- Compatibility layer нельзя «тихо» расширять новым кодом.
- Legacy path существует только ради плавной миграции, а не как постоянный default.
- При любом изменении legacy-зоны нужно проверять:
  - можно ли сузить её роль,
  - можно ли перевести часть использования на canonical path.

### 6.2. Examples

- Ранее существовал re-export `frontend/src/api/axiosClient.ts`; он удалён после миграции импортов на canonical paths.
- В период миграции весь `backend/` считается legacy-слоем под удаление: используется как behavioral oracle, новые роуты не добавляются.
- В период миграции `electron/` заморожен для удаления после полного переезда на Tauri.

### 6.3. Sunset rule

Compatibility layer удаляют, когда новые импорты через него больше не появляются и оставшийся legacy usage исчез или несоразмерно мал относительно churn миграции.

Для миграции конкретно:

- `backend/<domain>` удаляется после того, как соответствующий домен полностью портирован в `src-tauri/` и все сценарии работают под `VITE_TRANSPORT=tauri`.
- `electron/` удаляется только после удаления `backend/` целиком.

---

## 7. Shared Package Policy

Путь: `shared/*`

### 7.1. Что хранить в shared

- контракты
- DTO
- Zod-схемы
- общие типы
- доменные константы, реально нужные и frontend, и backend

### 7.2. Чего не должно быть в shared

- frontend-only helpers
- backend-only implementation details
- business logic
- UI logic
- service-level logic

### 7.3. Current structure policy

Плоская структура:

- `shared/src/schemas/*`
- `shared/src/types/*`

допустима, пока остаётся читаемой.

Не дробить её на `schemas/<domain>/...` преждевременно.

### 7.4. Role during migration

- Zod-схемы в `shared/src/schemas/*` остаются источником правды для валидации форм на фронте и контракта Express API (пока он жив).
- После портирования домена в Rust источником правды для API-контракта становятся Rust DTO + сгенерированные TS-типы в `frontend/src/types/generated/`.
- Если поле есть в Rust DTO, но нет в соответствующей Zod-схеме (или наоборот) — это баг синхронизации. Не дублировать руками, а сверять явно (через codegen или contract tests).
- Константы из `shared/src/constants.ts`, нужные Rust-сервисам, синхронизируются через codegen или явный проверяемый шаг — не копируются руками.

---

## 8. Backend Structure Policy

Путь: `backend/src/*`

Раздел применим только к историческому Express backend. В период миграции backend заморожен — см. раздел 15. Для нового кода используется `src-tauri/` со своими правилами (раздел 16).

### 8.1. Current baseline

Backend остаётся в layer-based структуре:

- `routes/*`
- `controllers/*`
- `services/*`
- `db/*`
- `middleware/*`

### 8.2. Role of layers

`routes/*`:

- wiring
- request schema binding
- route registration

`controllers/*`:

- thin adapters
- parse/validate/delegate

`services/*`:

- domain logic
- orchestration
- DB interaction orchestration

`db/*`:

- schema
- migrations
- connection

### 8.3. Domain subfolders inside services

Подпапка внутри `services/<domain>/*` появляется, когда домен реально растёт и это уменьшает связность.

### 8.4. Trigger criteria

Домен — кандидат на internal module structure, если:

- service уже некомфортно большой,
- появились дополнительные types / mappers / queries / helpers,
- есть несколько связанных implementation files,
- разбиение реально уменьшает god-file, а не просто разносит строки по папкам

### 8.5. Rule

Не делать массовый backend rewrite ради «идеальной» архитектуры.

Усложнять структуру только там, где это делает код проще, а не формально красивее.

### 8.6. Freeze during migration

- Новые роуты, контроллеры, сервисы в Express не добавляются.
- Допустимы только bug-fix, нужные для корректной работы oracle-сценариев.
- Любая новая доменная функциональность реализуется в `src-tauri/`.

---

## 9. Refactor Policy

### 9.1. Prefer

- маленькие PR
- usage-based moves
- opportunistic cleanup
- strangler pattern для giant files
- low-risk structural PR до high-risk behavioral/domain rewrites
- в миграции: один PR = один домен, не более

### 9.2. Avoid

- массовые rename/import rewrites без ощутимого ROI
- перемещение файлов «на будущее»
- premature decomposition
- перенос большого количества shared/domain кода в одном PR
- одновременный большой structural и behavioral refactor в одном change set
- в миграции: «заодно перенести соседний домен» — отказывать всегда

### 9.3. Giant file policy

Если файл стал слишком большим:

- сначала выносить локальные hooks/helpers
- затем подкомпоненты
- оставлять route/page файл оркестратором
- не переписывать giant file целиком одним PR, если можно идти шагами

---

## 10. Practical DO / DON'T

**DO**

- импортировать API из canonical domain files
- держать domain-local код рядом с доменом
- выносить в shared только доказанно reusable вещи
- делать маленькие структурные PR
- явно помечать transitional слои
- использовать usage confirmation перед переносом компонентов
- в миграции: всегда проверять паритет с Express oracle для портированного домена
- в миграции: branch-aware домены всегда проводить через BranchOverlayService

**DON'T**

- не плодить новые ad-hoc HTTP-клиенты вместо `@/api/client` и `@/api/<domain>`
- не класть one-page-only компонент в global `components/*`
- не выносить page-local ephemeral state в store без необходимости
- не делать full rewrite структуры без явного ROI
- не плодить новый legacy-слой поверх старого
- не переносить файлы «потому что вдруг потом пригодится»
- не вызывать `invoke` напрямую из страниц/сторов/компонентов
- не редактировать `frontend/src/types/generated/*` руками
- не добавлять новые роуты в Express
- не хардкодить пути к БД и uploads в Rust

---

## 11. Practical Examples

**Good API usage**

```ts
import { apiClient } from '@/api/client';
import { mapsApi } from '@/api/maps';
import { notesApi } from '@/api/notes';
import type { Tag } from '@/types/generated/bindings';
```

**Bad API usage**

```ts
import axios from 'axios';
await axios.get('/api/maps');

import { invoke } from '@tauri-apps/api/core';
await invoke('tags_list', { projectId: 1 });
```

**Good placement**

```txt
frontend/src/pages/map/
  MapPage.tsx
  MapToolbar.tsx
  MapMarkerDialog.tsx
  useMapData.ts
  useMapNavigation.ts
  mapUtils.ts
```

**Good shared placement**

```txt
frontend/src/components/ui/
  ConfirmDialog.tsx
  EmptyState.tsx
  DndButton.tsx
```

**Good Rust layout**

```txt
src-tauri/src/
  main.rs
  paths.rs
  error.rs
  commands/
    tags.rs
  services/
    tag_service.rs
  models/
    tag.rs
  db/
    connection.rs
    migrations.rs
  branch_overlay.rs
```

**Bad placement**

```txt
frontend/src/components/map/
  MapMarkerDialog.tsx
```

если этот диалог нужен только map-domain.

**Bad Rust layout**

```txt
src-tauri/src/
  commands/
    tags.rs   // содержит SQL и доменную логику напрямую
```

Команды должны быть тонкими адаптерами; SQL и логика — в `services/`.

**Bad store usage**

```ts
const useSomethingStore = create(() => ({
  isSinglePageDialogOpen: false,
  localDraft: '',
}));
```

если это состояние нужно только одной странице.

---

## 12. What Not To Refactor Prematurely

Сейчас не стоит реорганизовывать только ради красоты:

- `scripts/*` — структура уже хорошая и читаемая
- `shared/src/schemas/*` — пока плоская структура остаётся удобной
- весь backend целиком в module-based layout (тем более во время freeze)
- все `components/*` массово — только usage-proven кандидаты
- все stores сразу — сначала consistency, потом deeper changes
- naming через массовый rename всего проекта без функциональной пользы
- структура `src-tauri/src/` до того, как портированы первые 3–4 домена и стало видно, какие модули реально нужны

---

## 13. Lightweight PR Checklist

Перед структурным PR проверь:

- Это shared или domain-local?
- Это canonical path или compatibility path?
- Это global state или page-local state?
- Этот move уменьшает хаос или просто создаёт churn?
- Можно ли разбить изменение на меньшие PR?
- Не смешал ли я structural refactor и risky behavior change в одном пакете?
- Если это миграционный PR — он касается ровно одного домена?
- Если это миграционный PR — сгенерированные TS-типы обновлены и закоммичены?

Если ответы неочевидны — предпочесть более консервативный вариант.

---

## 14. Source of Truth

Если возникает конфликт между:

- удобством локального placement,
- желанием «сделать красиво»,
- и реальной поддерживаемостью,

предпочитать:

- предсказуемость,
- локальность доменной логики,
- минимальный churn,
- постепенную миграцию.

В период миграции дополнительно:

- поведенческий паритет с Express oracle для портированных доменов важнее «более элегантной» Rust-архитектуры,
- единый codegen pipeline важнее «удобной» рукописной типизации.

---

## 15. Migration Policy (Tauri + Rust)

Раздел действует, пока репозиторий находится в активной миграции. После завершения миграции и удаления `backend/` + `electron/` раздел будет переработан или удалён.

### 15.1. Архитектурные роли слоёв в период миграции

| Слой | Статус | Что с ним делать |
|------|--------|------------------|
| `backend/` | freeze, oracle | только bug-fix для oracle-сценариев, новых роутов не добавлять |
| `electron/` | freeze, под удаление | не трогать без явной задачи |
| `src-tauri/` | активный | новые домены и вся новая серверная логика |
| `frontend/` | активный | UI, transport-абстракция, доменные API-модули |
| `shared/` | активный | Zod для UI-форм; для API-контракта портированных доменов источник правды смещается в Rust |

### 15.2. Strangler fig: правила переключения домена

Домен считается портированным, когда выполнено всё:

1. Rust service + commands + DTO с `specta::Type` в `src-tauri/`.
2. Миграция таблиц этого домена в `src-tauri/migrations/NNN_<domain>.sql`, повторяющая структуру из `backend/src/db/schema.ts` (включая индексы и FK).
3. Сгенерированные TS-типы в `frontend/src/types/generated/bindings.ts` обновлены и закоммичены.
4. `frontend/src/api/<domain>.ts` использует `transport.request(...)`, без прямых `invoke` и без прямых `axios`.
5. Внешние сигнатуры функций `frontend/src/api/<domain>.ts` НЕ изменились — сторы и страницы продолжают работать без правок.
6. Поведенческий паритет с Express подтверждён: те же входы → те же выходы (с поправкой на нормализацию ошибок).
7. Сценарии работают и под `VITE_TRANSPORT=http`, и под `VITE_TRANSPORT=tauri`.
8. Все Rust-проверки зелёные: `cargo fmt`, `cargo clippy -- -D warnings`, `cargo test`.
9. Если домен branch-aware — все запросы проходят через `BranchOverlayService`, даже если для первой версии это заглушка.
10. Чек-лист домена заполнен в `docs/migration/domain-checklists/<domain>.md`.

Пока не выполнено всё — домен считается полупортированным и `backend/<domain>` не удаляется.

### 15.3. Принцип Express-as-oracle

- В период миграции Express считается поведенческим эталоном.
- Если Rust-реализация отличается от Express по форме ответа, нормализации полей, валидации, обработке edge cases — это **регрессия Rust**, а не «недостаток Express».
- Исключение: явно задокументированное расхождение (например, формат ошибок — Rust возвращает `{code, message}`, нормализация в TS-адаптере). Такие расхождения должны быть перечислены в `docs/migration/known-divergences.md`.
- Express нельзя «подгонять» под Rust. Если хочется изменить поведение — это отдельная задача после удаления Express.

### 15.4. Транспортная абстракция

- Domain-модули `frontend/src/api/<domain>.ts` не знают, какой транспорт активен.
- Выбор реализации — на этапе сборки через `import.meta.env.VITE_TRANSPORT`:
  - `http` (по умолчанию) → `httpTransport`
  - `tauri` → `tauriTransport`
- Прямые `invoke(...)` вне `frontend/src/api/transport/tauri.ts` запрещены.
- Прямые `axios` или `fetch` вне `frontend/src/api/transport/http.ts` и `frontend/src/api/client.ts` запрещены.
- При портировании домена меняется только содержимое `api/<domain>.ts`. Сигнатуры, типы возврата, ошибки остаются такими же, как у Express-варианта (с учётом нормализации в TS-адаптере).

### 15.5. Контракты и codegen

- Источник правды для API-контракта портированного домена — Rust DTO в `src-tauri/src/models/<domain>.rs`.
- TS-типы генерируются через `tauri-specta` в `frontend/src/types/generated/bindings.ts`.
- Файл `bindings.ts` коммитится в git.
- При merge-конфликте в `bindings.ts` — **всегда регенерация**, никогда ручное слияние.
- Рукописные TS-типы, дублирующие то, что генерируется из Rust, запрещены. Если такой тип нужен (например, для маппинга на UI-форму) — он строится поверх генерируемого типа через `Pick`, `Omit`, `Partial`, не дублирует структуру.

### 15.6. Branch-aware domains

Branch-aware домены (notes, dogmas, timeline, map_markers, map_territories и другие, добавляемые позже):

- на стороне Rust **обязательно** проходят через `BranchOverlayService` в `src-tauri/src/branch_overlay.rs`.
- Для первого портируемого branch-aware домена `BranchOverlayService` может быть заглушкой (возвращающей основной branch), но архитектурная точка должна существовать.
- Запросы всегда несут явный `branch_id` (или его отсутствие, означающее «main»). Неявное чтение branch из глобального контекста на стороне Rust запрещено.
- Кэш во фронте для таких доменов ключуется по `projectId + branchId`, как и сейчас.

### 15.7. Что запрещено в период миграции

- Добавлять новые HTTP-роуты в Express.
- Изменять контракт Express API сверх минимальных bug-fix.
- Делать прямые вызовы `invoke(...)` из страниц, сторов, компонентов.
- Дублировать Zod-схемы как рукописные Rust-структуры без подключения к codegen.
- Хардкодить пути к БД и `uploads` в Rust — только через модуль `paths`.
- Переписывать смежные домены «заодно».
- Менять формат ошибок одной из сторон, чтобы «совпасть» с другой.
- Удалять `backend/<domain>` до выполнения всех условий из 15.2.
- Удалять `electron/` до полного удаления `backend/`.
- Редактировать `frontend/src/types/generated/*` вручную.

### 15.8. Известные расхождения

Если расхождение между Express и Rust сознательное — оно фиксируется в `docs/migration/known-divergences.md` с указанием:

- какой домен,
- какое поведение в Express,
- какое поведение в Rust,
- почему расхождение допустимо,
- когда планируется устранение (если планируется).

Незадокументированное расхождение = регрессия.

---

## 16. Rust Structure Policy

Путь: `src-tauri/src/*`

### 16.1. Baseline structure

```txt
src-tauri/
  Cargo.toml
  tauri.conf.json
  migrations/
    000_init.sql
    001_<domain>.sql
    ...
  src/
    main.rs
    paths.rs
    error.rs
    branch_overlay.rs
    commands/
      mod.rs
      app.rs
      <domain>.rs
    services/
      mod.rs
      <domain>_service.rs
    models/
      mod.rs
      <domain>.rs
    db/
      mod.rs
      connection.rs
      migrations.rs
  tests/
    <domain>.rs
```

### 16.2. Role of layers

`commands/<domain>.rs`:

- тонкие Tauri-команды
- парсинг входа, вызов сервиса, маппинг ошибки в AppError
- без SQL, без бизнес-логики

`services/<domain>_service.rs`:

- доменная логика
- SQL через rusqlite prepared statements
- вызовы BranchOverlayService для branch-aware доменов

`models/<domain>.rs`:

- DTO с `#[derive(Serialize, Deserialize, specta::Type, Clone)]`
- `#[serde(rename_all = "camelCase")]` на структурах для совместимости с Express-контрактом
- input-DTO (CreateXxxInput, UpdateXxxInput) и output-DTO в одном файле домена

`db/`:

- `connection.rs` — открытие соединения, PRAGMA, передача через `tauri::State`
- `migrations.rs` — runner, читает `migrations/*.sql`, ведёт `schema_migrations`
- НЕ содержит доменной логики

`paths.rs` — единая точка для путей через `app.path().app_data_dir()`. Никаких хардкодов.

`error.rs` — единый AppError enum, Serialize для отдачи на фронт, From для типовых ошибок.

`branch_overlay.rs` — единая реализация overlay для всех branch-aware доменов.

### 16.3. Layer rules

- Команда не делает SQL. Команда вызывает сервис.
- Сервис не знает про `tauri::State` напрямую — он получает `&Connection` или `&mut Connection` как параметр (или через тонкий wrapper).
- DTO не содержит логики — только данные и derive-атрибуты.
- Миграции не редактируются после применения. Изменение схемы — новая миграция с инкрементированным номером.

### 16.4. Naming rules для Rust

- Файлы и модули: snake_case
- Типы: PascalCase
- Tauri commands в Rust: snake_case, имена в формате `<domain>_<action>` (например, `tags_list`, `tags_create`)
- Поля DTO в Rust: snake_case, на фронт уходят в camelCase через `#[serde(rename_all = "camelCase")]`
- Миграционные файлы: `NNN_<domain>.sql`, номер монотонно растёт

### 16.5. Cargo dependencies policy

- Не добавлять новые крейты без обсуждения.
- Версии фиксировать в Cargo.toml; major-апгрейды экосистемы Tauri/specta — отдельной задачей.
- rusqlite — всегда с feature bundled, чтобы не зависеть от системного SQLite.
- Запрещено добавлять параллельные ORM (diesel, sqlx) — единственный SQL-слой это rusqlite.

### 16.6. Не структурировать преждевременно

Не выделять подпапки вроде `services/<domain>/queries/`, `services/<domain>/mappers/`, пока:

- домен реально не вырос до некомфортного размера,
- внутренняя декомпозиция реально уменьшает связность, а не размазывает её.

Структура должна расти под реальную нагрузку, а не под воображаемую.

### 16.7. Tests

- Unit-тесты сервисов — рядом, через `#[cfg(test)] mod tests` в том же файле, на in-memory SQLite (`:memory:`).
- Integration-тесты — в `src-tauri/tests/<domain>.rs`, тоже на in-memory SQLite с прогоном миграций.
- `cargo test` должен проходить целиком перед мержем любого Rust-PR.

---

## 17. Generated Code Policy

Путь: `frontend/src/types/generated/*`

### 17.1. Что лежит в generated/

- TS-типы Rust DTO (через tauri-specta)
- Сигнатуры Rust-команд для type-safe invoke
- Возможные вспомогательные re-export'ы, генерируемые тулчейном

### 17.2. Rules

- Файлы в `generated/` коммитятся в git.
- Файлы в `generated/` не редактируются вручную никогда.
- При расхождении между Rust и `bindings.ts` — регенерация, не ручная правка.
- При merge-конфликте в `generated/` — взять одну из сторон, регенерировать, закоммитить результат.
- Импорты из `generated/` идут только через canonical path:

```ts
import type { Tag } from '@/types/generated/bindings';
```

- Не создавать рукописные «удобные» обёртки над генерируемыми типами в самом `generated/`. Если нужны derived типы — они лежут в `frontend/src/api/<domain>.ts` или в коде домена.

### 17.3. Workflow генерации

- Генерация запускается автоматически при `tauri dev` (см. `docs/migration/codegen.md`).
- В CI генерация запускается отдельным шагом; расхождение между сгенерированным результатом и закоммиченным `bindings.ts` — ошибка сборки.

---

## 18. Migration PR Checklist

В дополнение к чек-листу из раздела 13, для миграционных PR (портирование домена в Rust):

- PR касается ровно одного домена?
- Создана/обновлена миграция в `src-tauri/migrations/NNN_<domain>.sql` с теми же таблицами/индексами/FK, что в `backend/src/db/schema.ts`?
- Rust DTO имеют `specta::Type` и `#[serde(rename_all = "camelCase")]`?
- Rust команды зарегистрированы в `main.rs` через `collect_commands!`?
- `frontend/src/types/generated/bindings.ts` регенерирован и закоммичен?
- `frontend/src/api/<domain>.ts` использует `transport.request(...)` без прямых invoke/axios?
- Внешние сигнатуры функций `api/<domain>.ts` не изменились?
- Сторы и страницы домена не правились (или правки минимальны и обоснованы)?
- Поведенческий паритет с Express подтверждён (smoke / ручной сценарий / contract test)?
- `cargo fmt && cargo clippy -- -D warnings && cargo test` проходят?
- `npm run build` проходит?
- Если домен branch-aware — overlay идёт через BranchOverlayService?
- Заполнен `docs/migration/domain-checklists/<domain>.md`?
- Если есть осознанные расхождения с Express — добавлены в `docs/migration/known-divergences.md`?
- Соседние домены не затронуты?

Если хоть один пункт не выполнен — PR не готов к мержу.
