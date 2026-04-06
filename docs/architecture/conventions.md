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
  - `maps.ts`
  - `projects.ts`
  - `notes.ts`
  - `timeline.ts`
  - `dogmas.ts`
  - и т.д.

### 2.2. Compatibility layer
- `frontend/src/api/axiosClient.ts` — **compatibility layer only** для legacy-кода.
- Новый код не должен использовать `axiosClient.ts` как primary entrypoint.

### 2.3. Rules
- Новый код **должен** импортировать API из canonical paths:
  - `@/api/client`
  - `@/api/maps`
  - `@/api/projects`
  - `@/api/notes`
  - и т.д.
- Новый код **не должен**:
  - импортировать доменные API через `@/api/axiosClient`
  - добавлять новые domain re-exports в `axiosClient.ts`
- Если legacy-файл уже редактируется, допускается **opportunistic migration**:
  - по возможности заменить импорт с `axiosClient.ts` на canonical path
- Не смешивать:
  - transport logic
  - domain API
  - compatibility re-exports
  в одном новом файле без необходимости

### 2.4. Good
```ts
import { apiClient } from '@/api/client';
import { mapsApi } from '@/api/maps';
import { notesApi } from '@/api/notes';
```

### 2.5. Bad
```ts
import { mapsApi, notesApi } from '@/api/axiosClient';
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

Примеры:
- `ConfirmDialog`
- `DndButton`
- `EmptyState`
- `LoadingScreen`

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
- в **2+ доменах / route-группах** → кандидат в `components/*`
- только в **одном домене** → должна жить в `pages/<domain>/*`

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

если `MapToolbar` нужен только `MapPage`.

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

### 4.4. Store consistency rules
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
`frontend/src/api/axiosClient.ts`:
- допустим как compatibility-only
- недопустим как основной API entrypoint для нового кода

### 6.3. Sunset rule
Compatibility layer можно удалять, когда:
- новые импорты через него больше не появляются,
- оставшийся legacy usage мал и понятен,
- миграция не создаёт несоразмерный churn.

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

### 8.3. Domain subfolders inside services
Подпапка внутри `services/<domain>/*` появляется, когда домен реально растёт и это уменьшает связность.

### 8.4. Trigger criteria
Домен — кандидат на internal module structure, если:
- service уже некомфортно большой,
- появились дополнительные `types` / `mappers` / `queries` / `helpers`,
- есть несколько связанных implementation files,
- разбиение реально уменьшает god-file, а не просто разносит строки по папкам

### 8.5. Rule
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
- не импортировать новый код через `axiosClient.ts`
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
import { mapsApi, notesApi } from '@/api/axiosClient';
```

### Good placement
```txt
frontend/src/pages/map/
  MapPage.tsx
  MapToolbar.tsx
  MapMarkerDialog.tsx
  useMapData.ts
  useMapNavigation.ts
  mapUtils.ts
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
frontend/src/components/map/
  MapMarkerDialog.tsx
```

если этот диалог нужен только map-domain.

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
