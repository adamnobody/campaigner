# Canvas & Asset — реестр долга и рисков

Документ фиксирует состояние **на конец захода 0.3.1** (рабочая копия + незакоммиченные canvas/asset изменения по git status).  
Используется для планирования **0.3.2**. Не заменяет ADR (`docs/prod/adr/`) и план (`docs/prod/plans/0.3.1-canvas/`).

**Расположение:** `docs/canvas-debt.md` (корень `docs/`, рядом с `docs/prod/`). Продуктовые ADR/планы остаются в `docs/prod/`; этот файл — операционный реестр runtime-долга, не архитектурное решение.

---

## Статус на конец 0.3.1

### Закрыто в заходе

- **Dotted background OOM:** наивный world-space grid (`redrawDots` по `viewport.getVisibleBounds()`) заменён на screen-space `TilingSprite` + одноразовый tile texture (`PixiMapCanvas.tsx`: `createDotTexture`, `updateDots`). Память от zoom-out не растёт квадратично.
- **Polyline:** явный `closed: false` при создании; рендер без замыкания контура (`canvasReconciler.ts`, `MapPage.tsx` / `canvasModel.ts`).
- **Canvas image pipeline:** `/uploads/maps/...` через `uploads_resolve_path` + `Assets.load`; исправлены «грязные» `asset.localhost` URL в persistence.
- **Image drag flicker:** partial incremental reconcile для `kind === 'image'` (`imageFingerprint`, `syncImageDisplay`, `loadImageTexture`); transform обновляется без destroy/recreate sprite.
- **Pan/zoom/drag/hotkeys/layout/auto-scene:** доработки `PixiMapCanvas.tsx`, `AppLayout.tsx`, `MapPage.tsx` (вне scope этого файла — без детализации).
- **Регрессия traits/ambitions 403:** причина — `convertFileSrc` на все пути в `uploadAssetUrl.ts`; исправлено семантическим резолвером (ветки 1–5, без whitelist папок) + vitest (`uploadAssetUrl.test.ts`).
- **Asset resolver tests:** первые vitest-тесты на `resolveUploadAssetUrl` (`frontend/src/utils/uploadAssetUrl.test.ts`).

### Открыто / переносится в 0.3.2+

См. таблицы ниже. Критично для планирования: **incremental reconciler только для image**, **viewport culling отсутствует**, **фон — TilingSprite с визуальными артефактами на extreme zoom**.

---

## Открытый долг

| ID | Категория | Описание | Источник (файл/функция) | Серьёзность | Предлагаемое решение | Целевая веха |
|----|-----------|----------|-------------------------|-------------|----------------------|--------------|
| **DEBT-A** | rendering | Dotted background: `TilingSprite` даёт артефакты тайлинга на extreme zoom out (блоки разной плотности, муар). OOM закрыт. | `PixiMapCanvas.tsx` — `createDotTexture`, `updateDots`, `TilingSprite` на `app.stage` | med | Fragment shader / fullscreen quad: процедурная dot-сетка в screen space, без дискретного tile; параметры (шаг, радиус, цвет) — uniform | 0.3.2 |
| **DEBT-B** | assets | Резолвер: ветка Windows/UNC для legacy abs paths; целевой инвариант — только `/uploads/...` в persistence. | `uploadAssetUrl.ts` — `isWindowsFilesystemPath`, ветка 3 | low | После проверки БД: удалить ветку 3; миграция «грязных» путей → `/uploads/...` | 0.3.2 |
| **DEBT-C1** | performance / architecture | **Incremental reconciler частичный:** только `image` имеет узкий fingerprint + in-place transform; остальные kinds при любом изменении `object` (включая `selected`) — `clearDisplay` + полный `drawObject`. | `canvasReconciler.ts` — `reconcilePixiObjects`, `imageFingerprint` vs `JSON.stringify({ object, selected })` | **high** | Fingerprint по полям: transform / geometry / style / content / resource отдельно; обновлять Pixi-ноды in-place по kind; selection — отдельный overlay или stroke без recreate геометрии | 0.3.2 |
| **DEBT-C2** | performance | **Viewport culling отсутствует:** все объекты в `objects[]` реконсилируются и остаются в сцене; hit-test тоже O(n) по всем объектам. | `canvasReconciler.ts` — `reconcilePixiObjects`; `hitTestObjects`; `PixiMapCanvas.tsx` — `useEffect` → reconcile при `[layers, objects, selectedObjectId]` | **high** (при больших сценах) | `viewport.getVisibleBounds()` + margin; `display.visible = false` или не создавать display вне bounds; spatial index для hit-test | 0.3.2 |
| **DEBT-C3** | rendering | Shader background (см. DEBT-A) — запланированная замена TilingSprite. | См. DEBT-A | med | См. DEBT-A | 0.3.2 |
| **DEBT-004** | performance | Смена selection пересоздаёт **все** non-image объекты: `selected` входит в fingerprint. | `canvasReconciler.ts` — fingerprint для `object.kind !== 'image'` | med | Вынести selection в отдельный слой/highlight; не включать `selected` в geometry fingerprint | 0.3.2 |
| **DEBT-005** | performance | `curve_text`: при каждом recreate — до N отдельных `Text` нод (по символу). | `canvasReconciler.ts` — `drawCurveText` | med | Bitmap/cache glyph run; или одна texture; incremental update позиций глифов | 0.3.2+ |
| **DEBT-006** | performance | Module-level `loadedImageTextures` без eviction. | `canvasReconciler.ts` — `loadedImageTextures` Map | med | LRU по objectId/url; destroy texture при удалении объекта | 0.3.2 |
| **DEBT-007** | architecture | Async `resolveUploadAssetUrl` / `Assets.load` в `drawObject` без отмены при быстром удалении/смене объекта (есть проверка `container.destroyed`, race всё ещё возможен). | `canvasReconciler.ts` — `drawObject` → `void resolveUploadAssetUrl(...)` | low | AbortController / generation token per `object.id` | 0.3.2 |
| **DEBT-008** | assets | Persisted `http(s)://asset.localhost/...` в `resourcePath` → resolver возвращает `undefined` + warn. | `uploadAssetUrl.ts` — ветка 1; `canvasReconciler.ts` — load path | med | One-time DB migration: strip asset URLs → `/uploads/...` | 0.3.2 |
| **DEBT-009** | assets | `useAssetUrl`: при смене `path` сбрасывает URL в `undefined` до завершения async resolve → возможный flicker в каталогах/аватарах. | `useAssetUrl.ts` — `setUrl(undefined)` в `useEffect` | low | Держать previous URL до resolve; или sync passthrough для ветки 4 (`/...`) | 0.3.2 |
| **DEBT-010** | architecture | Нет автоматических тестов canvas runtime (reconcile, hit-test, viewport, background). Только `uploadAssetUrl` vitest. | `frontend/package.json` — `test`; отсутствие `*.test.ts` в `pages/maps/canvas/` | med | Vitest/Playwright: reconcile fingerprint, hit-test, dot `updateDots` math | 0.3.2 |
| **DEBT-011** | performance | Carry-over prototype: реальный 16k×16k PNG на min-spec не валидирован (только client-side `MAX_TEXTURE_SIZE` check). | `MapPage.tsx` — `MAX_TEXTURE_SIZE`; `docs/prod/prototypes/001-curve-text-canvas/CARRYOVER.md` §2 | med | Tiled background sprites при `MAX_TEXTURE_SIZE` < dim; тест на целевом железе | 0.3.2 |
| **DEBT-012** | architecture | Carry-over: curve text hit-test — bbox union по глифам; текущий hit-test примитивный. | `canvasReconciler.ts` — `drawCurveText` hit boxes; CARRYOVER.md §1 | med | Glyph-oriented hitTest; тесты клика по дуге | 0.3.2 |
| **DEBT-013** | architecture | `WORLD_SIZE = 20000` захардкожен. | `PixiMapCanvas.tsx` — `WORLD_SIZE` | low | Из scene metadata или config | 0.3.2+ |
| **DEBT-014** | performance | Каждый `persistObject` → `canvasApi.reconcileScene` (IPC + DB), даже для простого drag end. | `MapPage.tsx` — `persistObject` | low | Debounce/batch upserts; локальный optimistic без reconcile на каждый move | 0.3.2+ |

**Примечание по DEBT-A:** описание артефактов на extreme zoom — из QA/обсуждения 0.3.1; в коде нет комментария TODO. Механизм артефактов подтверждён кодом: дискретный tile 64×64 + `tileScale`/`tilePosition` (`updateDots`).

**TODO/FIXME/HACK в canvas/asset коде:** по grep по `frontend/src/pages/maps/**`, `frontend/src/utils/uploadAssetUrl.ts`, `src-tauri/src/uploads/**` — **не найдено**.

---

## Риски (не баги сейчас, могут выстрелить)

| ID | Категория | Описание | Источник | Серьёзность | Предлагаемое решение | Целевая веха |
|----|-----------|----------|----------|-------------|----------------------|--------------|
| **RISK-001** | assets | **Unix legacy abs path в canvas DB:** путь вида `/Users/.../file.jpg` попадёт в ветку 4 (passthrough), **не** загрузится в Tauri WebView. Инвариант: новые записи — `/uploads/maps/...` (`canvasApi.uploadCanvasAsset` → `uploads_save_map_image` → `web_path_from`). | `uploadAssetUrl.ts` ветка 4; `frontend/src/api/canvas.ts` — `uploadCanvasAsset`; `src-tauri/src/uploads/web_path.rs` | low (записей нет) | При обнаружении в БД — SQL migration → `/uploads/...`; **не** добавлять Unix fs-ветку в резолвер | по факту |
| **RISK-002** | assets | Изменение `tauri.conf.json` (`assetProtocol.scope`, CSP) или глобального path resolver без регрессии по **всем** поверхностям с картинками. | `src-tauri/tauri.conf.json`; `uploadAssetUrl.ts`; `useAssetUrl.ts` | high (при изменении) | Чеклист: traits, ambitions, characters, factions, dynasties, appearance, canvas; vitest + ручной smoke | процесс |
| **RISK-003** | assets | Whitelist папок (`/traits/`, `/ambitions/`) в resolver — гарантированная будущая регрессия при новом public asset. | Историческая регрессия 0.3.1 (незакоммиченный `return convertFileSrc(path)`); отклонённый фикс | high (если повторить) | Только семантика пути (текущие ветки 1–5) | процесс |
| **RISK-004** | performance | Большая сцена (1000+ объектов): pan/zoom OK пока `objects` не меняется; любой edit/selection → полный recreate многих kinds → FPS просадка. | CARRYOVER.md §3; `canvasReconciler.ts`; `PixiMapCanvas.tsx` reconcile effect | med → high | DEBT-C1, DEBT-C2 | 0.3.2 |
| **RISK-005** | assets | `assetProtocol.scope` не включает `frontend/dist` / bundled public — **by design**; bundled грузятся через origin (`/traits/...`), не через asset protocol. Ошибочный `convertFileSrc` на public path → 403 (регрессия 0.3.1). | `tauri.conf.json` scope; `uploadAssetUrl.ts` | med (при ошибке resolver) | Процессное правило 2; ветка 4 passthrough | процесс |
| **RISK-006** | performance | Drag: во время drag позиция обновляется только в Pixi (`entry.display.position.set`), React `objects` — на pointer up (`PixiMapCanvas.tsx` → `onObjectMove` → `persistObject`). Если родитель часто ре-рендерит с тем же transform — лишние reconcile не идут; при изменении других props — может дернуть reconcile. | `PixiMapCanvas.tsx` — `handlePointerMove` / `handlePointerUp`; `MapPage.tsx` — `handleObjectMove` | low | Явный «drag preview» слой без reconcile до commit | 0.3.2+ |

---

## Процессные правила

### Правило 1

Изменения в `tauri.conf.json` (`assetProtocol.scope`, CSP, capabilities) **или** в общих helper'ах резолвинга путей/URL = обязательная проверка **ВСЕГО** приложения, где грузятся изображения, а не только текущей фичи. Asset protocol и path-резолверы глобальны.

### Правило 2

Не резолвить пути/URL через whitelist конкретных имён папок. Только по типу/семантике пути. Списки имён = гарантированная будущая регрессия. (Контекст: именно «списочное мышление» породило регрессию traits/ambitions в 0.3.1.)

---

## Закрытые в 0.3.1 (для истории)

| Проблема | Как закрыто |
|----------|-------------|
| Dotted background OOM при zoom out | `TilingSprite` screen-space вместо `Graphics` loop по world bounds (`PixiMapCanvas.tsx`) |
| Polyline замыкалась | `closed: false` + open path stroke в reconciler |
| Image не отображались / Cache warning | `Assets.load` + `resolveUploadAssetUrl` для `/uploads` |
| Image drag placeholder flicker | `imageFingerprint` + in-place sprite; texture cache `loadedImageTextures` |
| traits/ambitions 403 | Семантический `resolveUploadAssetUrl` (passthrough для `/...` public); откат `convertFileSrc` на все пути |
| Scrollbar / layout / auto-scene / pan / hotkeys | `AppLayout`, `MapPage`, `PixiMapCanvas` (см. QA 0.3.1) |

### Git-контекст (asset/canvas)

| Коммит / изменение | Суть |
|--------------------|------|
| `00a3e856b`, `09d5218e2` | asset protocol + `useAssetUrl` / `convertFileSrc` для `/uploads` |
| `9c0257cd6` | сужение `assetProtocol.scope` (убран `$HOME/**`) |
| `9a1d62c5a` | scope uploads + CSP `asset.localhost` |
| `1a618de31` | Tauri-only; `resolveUploadAssetUrl` fallback `return path` для non-uploads |
| Рабочая копия 0.3.1 | ошибочный `return convertFileSrc(path)` → регрессия; исправлено ветками 1–5 |

---

## Справка: семантика `resolveUploadAssetUrl` (текущая)

| Ветка | Условие | Результат |
|-------|---------|-----------|
| 1a | `asset.localhost` | `undefined` + warn |
| 1b | `http(s)` / `data:` / `blob:` | passthrough |
| 2 | `/uploads/...` | `uploads_resolve_path` → `convertFileSrc` |
| 3 | Windows drive / UNC | `convertFileSrc` (legacy) |
| 4 | `/...` (остальное) | passthrough (Vite `public/`) |
| 5 | без ведущего `/` | passthrough |

**Canvas persistence (подтверждено в коде):** `uploadCanvasAsset` → `uploads_save_map_image` → `web_path_from(UploadSubdir::Maps, ...)` → `/uploads/maps/<file>` в `resourcePath`. Сырые Unix abs paths в нормальном pipeline **не создаются**.

---

## Связанные документы

- `docs/prod/adr/0001-canvas-rendering-technology.md`
- `docs/prod/adr/0003-canvas-data-model.md`
- `docs/prod/plans/0.3.1-canvas/01-implementation-plan.md` (Stage 6 — incremental reconciler)
- `docs/prod/prototypes/001-curve-text-canvas/CARRYOVER.md`
- `docs/prod/vision/canvas.md`
- `frontend/src/utils/uploadAssetUrl.test.ts`

---

*Последнее обновление: конец захода 0.3.1. Код не менялся при создании этого файла.*
