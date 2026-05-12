# Architecture Conventions

Краткий набор практических правил для структурных изменений в репозитории `campaigner`.

Цель документа:
- уменьшать архитектурную энтропию,
- сохранять предсказуемость структуры,
- не плодить legacy-слои,
- делать рефакторинг инкрементально, без лишнего churn.

Этот документ не заменяет здравый смысл: если правило конфликтует с реальной пользой для проекта, изменение нужно отдельно обосновать в PR.

---

## 1. Общие принципы

### 1.1. Предпочтение — инкрементальным изменениям
- Предпочитать маленькие и средние PR.
- Не делать массовые переезды файлов без явной пользы.
- Не совмещать большой структурный рефактор и рискованное изменение поведения в одном PR.

### 1.2. Минимальный churn
- Не переносить файлы “на будущее”.
- Не делать массовый rename/import rewrite только ради косметики.
- Если можно улучшить структуру локально и безопасно — делать это локально.

### 1.3. Canonical path важнее привычки
- У каждого слоя должен быть основной, предсказуемый путь использования.
- Transitional/compatibility paths допустимы только как временная мера.

### 1.4. Shared только для реально shared
- Глобальные папки и общие слои должны содержать только то, что действительно переиспользуется.
- Domain-local код должен жить рядом со своим доменом.

### 1.5. Текущие домены проекта
На текущий момент основные домены приложения:
- projects / project dashboard / project settings
- branches
- maps
- characters / character traits
- notes / wiki
- timeline
- dogmas
- factions / states
- dynasties
- ambitions
- political scales
- graph / graph layout
- tags
- search
- uploads / assets
- appearance / preferences / onboarding

Если добавляется новый домен, сначала выбрать canonical placement в `shared`, `backend` и `frontend`, а не создавать параллельную структуру только в одном слое.

---

## 2. Frontend API Import Policy

Путь: `frontend/src/api/*`

### 2.1. Canonical API structure
- `frontend/src/api/client.ts` — транспортный слой:
  - `apiClient`
  - interceptors
  - базовые HTTP-настройки
  - общие transport helpers
- `frontend/src/api/<domain>.ts` — доменные API-клиенты:
  - `branches.ts`
  - `characters.ts`
  - `characterTraits.ts`
  - `dynasties.ts`
  - `factions.ts`
  - `maps.ts`
  - `notes.ts`
  - `projects.ts`
  - `timeline.ts`
  - `wiki.ts`
  - `dogmas.ts`
  - `ambitions.ts`
  - `politicalScales.ts`
  - `graphLayout.ts`
  - `search.ts`
  - `tags.ts`
  - `uploads.ts`
  - и т.д.
- `frontend/src/api/types.ts` — frontend-local типы API, если они не являются shared-контрактом.
- `frontend/src/api/withBranchParams.ts` — helper для branch-aware query params.

### 2.2. Naming of API files
- Простые доменные API-файлы обычно plural: `maps.ts`, `projects.ts`, `notes.ts`, `branches.ts`.
- Compound-домены используют `camelCase`: `characterTraits.ts`, `politicalScales.ts`, `graphLayout.ts`.
- Backend route path может быть kebab-case (`/api/character-traits`), но frontend module name остаётся TypeScript-friendly `camelCase`.

### 2.3. Rules
- Новый код **должен** импортировать API из canonical paths:
  - `@/api/client`
  - `@/api/maps`
  - `@/api/projects`
  - `@/api/notes`
  - `@/api/timeline`
  - `@/api/dogmas`
  - и т.д.
- Новый код **не должен** плодить параллельные обёртки над HTTP, дублирующие `apiClient` и доменные клиенты.
- Не смешивать в одном новом файле без необходимости:
  - transport logic
  - domain API

### 2.4. Good
```ts
import { apiClient } from '@/api/client';
import { mapsApi } from '@/api/maps';
import { notesApi } from '@/api/notes';
```

### 2.5. Bad
```ts
// Пример: обход доменных клиентов и дублирование транспорта
import axios from 'axios';
await axios.get('/api/maps');
```

---

## 3. Placement Policy

### 3.1. `frontend/src/components/*`
Глобальные компоненты должны быть **реально shared**.

#### `frontend/src/components/ui/*`
Использовать только для:
- domain-agnostic UI primitives
- reusable dialogs
- generic action buttons
- generic feedback/loading/error components
- shared entity UI primitives

Примеры:
- `ConfirmDialog`
- `DndButton`
- `EmptyState`
- `LoadingScreen`
- `EntityTabs`
- `EntityHeroLayout`

#### `frontend/src/components/forms/*`
Использовать только для:
- переиспользуемых form controls
- общих field wrappers
- shared input/autocomplete/select controls

#### `frontend/src/components/Layout/*`
Использовать только для:
- app shell
- global navigation
- sidebar/topbar/layout primitives

Текущая папка называется `Layout` с заглавной буквы. Не создавать параллельную `layout` без отдельной миграции.

#### Допустимые current shared folders
- `frontend/src/components/detail/*` — shared detail primitives.
- `frontend/src/components/exclusions/*` — shared exclusions UI.
- `frontend/src/components/onboarding/*` — global onboarding flow.

### 3.2. `frontend/src/pages/<domain>/*`
Использовать для domain-local кода:
- route-level page
- подкомпоненты страницы
- локальные hooks
- локальные helpers
- локальные constants/styles
- domain-specific dialogs/cards/panels

Если компонент используется только внутри одного домена или route-group, он должен жить рядом с этим доменом.

Для выросших доменов нормальна внутренняя структура `components/`, `hooks/`, `data/`, `types.ts`, если она уже подтверждена размером страницы.

### 3.3. Practical rule
Если сущность используется:
- в **2+ доменах / route-группах** → кандидат в `components/*`
- только в **одном домене** → должна жить в `pages/<domain>/*`

### 3.4. Не поднимать в shared преждевременно
Не переносить компонент в `components/*`, если:
- он пока используется только в одном месте,
- предполагаемое переиспользование только гипотетическое,
- перенос ухудшает локальность понимания домена.

### 3.5. Good
```txt
frontend/src/pages/maps/
  MapPage.tsx
  components/
    MapToolbar.tsx
    MapMarkerDialog.tsx
    mapUtils.ts
  hooks/
    useMapData.ts
    useMapNavigation.ts
```

если это используется только внутри maps-domain.

### 3.6. Bad
```txt
frontend/src/components/maps/
  MapToolbar.tsx
```

если `MapToolbar` нужен только `MapPage`.

### 3.7. Current frontend page domains
Route-level code сейчас живёт в:
- `frontend/src/pages/home`
- `frontend/src/pages/project-dashboard`
- `frontend/src/pages/project-settings`
- `frontend/src/pages/appearance`
- `frontend/src/pages/maps`
- `frontend/src/pages/characters`
- `frontend/src/pages/notes`
- `frontend/src/pages/wiki`
- `frontend/src/pages/timeline`
- `frontend/src/pages/dogmas`
- `frontend/src/pages/graph`
- `frontend/src/pages/factions`
- `frontend/src/pages/dynasties`

URL может отличаться от папки: например route `/project/:projectId/map` обслуживается доменом `pages/maps`, а `/states` переиспользует `pages/factions`.

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
- ключи/кэш/загрузки должны учитывать `projectId + branchId`
- branch context должен быть явным, а не “где-то подтягиваться неявно”

### 4.4. Current store shape
Сейчас `frontend/src/store/*` содержит:
- global/cross-page stores: `useBranchStore`, `useProjectStore`, `usePreferencesStore`, `useUIStore`, `useOnboardingStore`, `useStyleStore`
- domain stores: `useCharacterStore`, `useCharacterTraitsStore`, `useDynastyStore`, `useFactionStore`, `useDogmaStore`, `useNoteStore`, `useWikiStore`, `useTimelineStore`, `useMapStore`, `useTagStore`, `useAmbitionsStore`
- small infrastructure helpers: `branchStorage`, `debouncedStorage`, `useMapTerritoriesRefreshStore`

Новые stores должны соответствовать этой модели: либо global/cross-page state, либо реально переиспользуемый domain state.

### 4.5. Store consistency rules
- избегать `any` в публичных сигнатурах store methods
- придерживаться единообразного `loading/error` lifecycle
- использовать общие error helpers, если они уже есть
- не смешивать page orchestration и store responsibility без необходимости

---

## 5. Naming Conventions

### 5.1. Folders
- Доменные папки: `kebab-case`
  - `note-editor`
  - `character-graph`
- Новые PascalCase-папки не вводить без сильной причины.
- Существующая `frontend/src/components/Layout` — historical exception; не копировать этот паттерн в новые domain folders.

### 5.2. React components
- `PascalCase.tsx`
  - `MapToolbar.tsx`
  - `ThemePreviewCard.tsx`
  - `DogmaFormDialog.tsx`

### 5.3. Hooks
- `useXxx.ts`
  - `useMapNavigation.ts`
  - `useDebouncedDraft.ts`

### 5.4. Stores
- `useXxxStore.ts`
  - `useBranchStore.ts`
  - `useProjectStore.ts`

### 5.5. API files
- plural domain file names
  - `maps.ts`
  - `projects.ts`
  - `notes.ts`
  - `branches.ts`
- compound domain file names in camelCase
  - `characterTraits.ts`
  - `politicalScales.ts`
  - `graphLayout.ts`

### 5.6. Utility/helper files
- `camelCase.ts`
  - `mapUtils.ts`
  - `branchStorage.ts`
  - `onboardingSteps.ts`

### 5.7. Route pages
- `XxxPage.tsx`
  - `MapPage.tsx`
  - `WikiPage.tsx`
  - `AppearanceSettingsPage.tsx`

---

## 6. Compatibility / Legacy Policy

Иногда transitional слой полезен, если он уменьшает миграционный шок.  
Но такие слои должны быть явными и ограниченными.

### 6.1. Rules
- Любой compatibility/legacy слой должен быть явно помечен комментарием.
- Compatibility layer нельзя “тихо” расширять новым кодом.
- Legacy path существует только ради плавной миграции, а не как постоянный default.
- При любом изменении legacy-зоны нужно проверять:
  - можно ли сузить её роль,
  - можно ли перевести часть использования на canonical path.

### 6.2. Example
Ранее существовал re-export `frontend/src/api/axiosClient.ts`; он удалён после миграции импортов на canonical paths.

### 6.3. Sunset rule
Compatibility layer удаляют, когда новые импорты через него больше не появляются и оставшийся legacy usage исчез или несоразмерно мал относительно churn миграции.

---

## 7. Shared Package Policy

Путь: `shared/*`

### 7.1. Что хранить в `shared`
- контракты
- DTO
- Zod-схемы
- общие типы
- доменные константы, реально нужные и frontend, и backend

### 7.2. Чего не должно быть в `shared`
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

### 7.4. Current shared schemas
Сейчас shared-контракты покрывают:
- `project`, `branch`
- `character`, `character-trait`
- `dynasty`
- `faction`, `political-scale`, `policy`
- `map`
- `note`, `wiki`
- `timeline`
- `dogma`, `ambition`
- `graphLayout`
- `common`

Если новое поле сущности влияет и на frontend, и на backend, сначала обновлять Zod-схему в `shared`, затем сервисы/API/UI.

---

## 8. Backend Structure Policy

Путь: `backend/src/*`

### 8.1. Current baseline
Backend остаётся в layer-based структуре:
- `routes/*`
- `controllers/*`
- `services/*`
- `db/*`
- `middleware/*`

### 8.2. Role of layers
- `routes/*`:
  - wiring
  - request schema binding
  - route registration
- `controllers/*`:
  - thin adapters
  - parse/validate/delegate
- `services/*`:
  - domain logic
  - orchestration
  - DB interaction orchestration
- `db/*`:
  - schema
  - migrations
  - connection

### 8.3. Current route/API domains
Сейчас backend регистрирует API для:
- `/api/projects`
- `/api/branches`
- `/api/characters`
- `/api/character-traits`
- `/api/notes`
- `/api/wiki`
- `/api/timeline`
- `/api/dogmas`
- `/api/factions`
- `/api/dynasties`
- `/api/tags`
- `/api/search`
- `/api/upload` и static `/api/uploads`
- `/api/maps`, `/api/projects/:projectId/maps/*`, `/api/projects/:projectId/territories/*`
- `/api/ambitions`, `/api/factions/:factionId/ambitions`
- `/api/political-scales`, `/api/political-scale-assignments`

Для нового API-домена держать триаду `routes/<domain>.routes.ts` → `controllers/<domain>.controller.ts` → `services/<domain>.service.ts` или обоснованную service-папку.

### 8.4. Domain subfolders inside services
Подпапка внутри `services/<domain>/*` появляется, когда домен реально растёт и это уменьшает связность.

Current examples:
- `services/project/*`
- `services/map/*`
- `services/faction/*`
- `services/dynasty/*`
- `services/political-scale/*`

### 8.5. Trigger criteria
Домен — кандидат на internal module structure, если:
- service уже некомфортно большой,
- появились дополнительные `types` / `mappers` / `queries` / `helpers`,
- есть несколько связанных implementation files,
- разбиение реально уменьшает god-file, а не просто разносит строки по папкам

### 8.6. Rule
Не делать массовый backend rewrite ради “идеальной” архитектуры.  
Усложнять структуру только там, где это делает код проще, а не формально красивее.

---

## 9. Refactor Policy

### 9.1. Prefer
- маленькие PR
- usage-based moves
- opportunistic cleanup
- strangler pattern для giant files
- low-risk structural PR до high-risk behavioral/domain rewrites

### 9.2. Avoid
- массовые rename/import rewrites без ощутимого ROI
- перемещение файлов “на будущее”
- premature decomposition
- перенос большого количества shared/domain кода в одном PR
- одновременный большой structural и behavioral refactor в одном change set

### 9.3. Giant file policy
Если файл стал слишком большим:
- сначала выносить локальные hooks/helpers
- затем подкомпоненты
- оставлять route/page файл оркестратором
- не переписывать giant file целиком одним PR, если можно идти шагами

---

## 10. Practical DO / DON'T

### DO
- импортировать API из canonical domain files
- держать domain-local код рядом с доменом
- выносить в shared только доказанно reusable вещи
- делать маленькие структурные PR
- явно помечать transitional слои
- использовать usage confirmation перед переносом компонентов

### DON'T
- не плодить новые ad-hoc HTTP-клиенты вместо `@/api/client` и `@/api/<domain>`
- не класть one-page-only компонент в global `components/*`
- не выносить page-local ephemeral state в store без необходимости
- не делать full rewrite структуры без явного ROI
- не плодить новый legacy-слой поверх старого
- не переносить файлы “потому что вдруг потом пригодится”

---

## 11. Practical Examples

### Good API usage
```ts
import { apiClient } from '@/api/client';
import { mapsApi } from '@/api/maps';
import { notesApi } from '@/api/notes';
```

### Bad API usage
```ts
import axios from 'axios';
await axios.get('/api/maps');
```

### Good placement
```txt
frontend/src/pages/maps/
  MapPage.tsx
  components/
    MapToolbar.tsx
    MapMarkerDialog.tsx
    mapUtils.ts
  hooks/
    useMapData.ts
    useMapNavigation.ts
```

### Good shared placement
```txt
frontend/src/components/ui/
  ConfirmDialog.tsx
  EmptyState.tsx
  DndButton.tsx
```

### Bad placement
```txt
frontend/src/components/maps/
  MapMarkerDialog.tsx
```

если этот диалог нужен только maps-domain.

### Bad store usage
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
- весь backend целиком в module-based layout
- все `components/*` массово — только usage-proven кандидаты
- все stores сразу — сначала consistency, потом deeper changes
- naming через массовый rename всего проекта без функциональной пользы

---

## 13. Lightweight PR Checklist

Перед структурным PR проверь:

1. Это shared или domain-local?
2. Это canonical path или compatibility path?
3. Это global state или page-local state?
4. Этот move уменьшает хаос или просто создаёт churn?
5. Можно ли разбить изменение на меньшие PR?
6. Не смешал ли я structural refactor и risky behavior change в одном пакете?

Если ответы неочевидны — предпочесть более консервативный вариант.

---

## 14. Source of Truth

Если возникает конфликт между:
- удобством локального placement,
- желанием “сделать красиво”,
- и реальной поддерживаемостью,

предпочитать:
1. предсказуемость,
2. локальность доменной логики,
3. минимальный churn,
4. постепенную миграцию.
