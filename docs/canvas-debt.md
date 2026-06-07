# Canvas & Asset — реестр runtime-долга и рисков

Операционный реестр **performance / rendering / asset runtime** для Canvas.  
Не заменяет ADR (`docs/prod/adr/`) и product gaps (`docs/canvas-functional-gaps.md`).

**Актуально на:** 2026-06-07 (`testbed-rust` после 0.3.1.x parity, 0.3.2 architecture core, 0.3.5 text parity).

---

## Контекст

Функциональные вехи **0.3.1**, **0.3.1.x parity**, **0.3.5 text parity** и core **0.3.2 architecture** (migration 018, `scene_type`, `scene_container`) закрыты в коде.  
Этот файл отслеживает только **runtime debt**, не product UX gaps (inspectors, layers UI — см. `canvas-functional-gaps.md`).

---

## Открытый долг

| ID | Категория | Описание | Источник | Серьёзность | Целевая веха |
|----|-----------|----------|----------|-------------|--------------|
| **DEBT-C1** | performance / architecture | **Incremental reconciler частичный:** только `image` имеет узкий fingerprint + in-place transform; остальные kinds при изменении `object` (включая `selected`) — `clearDisplay` + полный `drawObject`. | `canvasReconciler.ts` | **high** | 0.3.2+ polish |
| **DEBT-C2** | performance | **Viewport culling отсутствует:** все объекты реконсилируются; hit-test O(n) по всем объектам. | `canvasReconciler.ts`, `hitTestObjects`, `PixiMapCanvas.tsx` | **high** | 0.3.2+ polish |
| **DEBT-004** | performance | Смена selection пересоздаёт non-image объекты: `selected` в fingerprint. | `canvasReconciler.ts` | med | 0.3.2+ polish |
| **DEBT-005** | performance | `curve_text`: до N отдельных `Text` нод на recreate. | `canvasReconciler.ts` — `drawCurveText` | med | 0.3.2+ |
| **DEBT-A / C3** | rendering | Dotted background: `TilingSprite` — артефакты тайлинга на extreme zoom (OOM закрыт). | `PixiMapCanvas.tsx` — `createDotTexture`, `updateDots` | med | shader / screen-space grid |
| **DEBT-006** | performance | `loadedImageTextures` без eviction. | `canvasReconciler.ts` | med | 0.3.2+ |
| **DEBT-007** | architecture | Async image load без отмены при быстром удалении объекта. | `canvasReconciler.ts` | low | 0.3.2+ |
| **DEBT-011** | performance | Реальный 16k×16k PNG на min-spec не валидирован. | `MapPage.tsx`, map background path | med | tiled sprites + hardware test |
| **DEBT-012** | architecture | Curve text hit-test — union glyph bboxes; нет arc-tolerance test suite. | `canvasReconciler.ts` — `drawCurveText` | med | glyph/arc hit-test + vitest |
| **DEBT-014** | performance | Каждый `persistObject` → `reconcileScene` (IPC), в т.ч. drag end. | `MapPage.tsx` | low | debounce/batch |
| **DEBT-B** | assets | Legacy Windows/UNC abs paths в resolver (ветка 3). | `uploadAssetUrl.ts` | low | DB cleanup + remove branch |
| **DEBT-008** | assets | Persisted `asset.localhost` URLs в `resourcePath`. | `uploadAssetUrl.ts` | med | one-time DB migration |
| **DEBT-009** | assets | `useAssetUrl` flicker при смене path. | `useAssetUrl.ts` | low | keep previous URL |
| **DEBT-013** | architecture | `WORLD_SIZE` / world bounds захардкожены для infinite canvas. | `mapBackground.ts`, `PixiMapCanvas.tsx` | low | scene metadata |

### DEBT-010 (частично закрыт)

Раньше: «нет vitest в `pages/maps/canvas/`».  
**Сейчас:** 15+ unit-файлов (navigation, territory, text, curve handles, viewport, tools).  
**Остаётся:** нет автотестов reconcile fingerprint, Pixi hit-test, `updateDots` math, E2E smoke.

---

## Риски

| ID | Описание | Митигация |
|----|----------|-----------|
| **RISK-002** | Изменение `tauri.conf.json` / global path resolver без регрессии по всем image surfaces | чеклист + vitest |
| **RISK-003** | Whitelist папок в resolver | только семантика путей (ветки 1–5) |
| **RISK-004** | 1000+ объектов: edit/selection → FPS просадка | DEBT-C1, DEBT-C2 |
| **RISK-005** | Ошибочный `convertFileSrc` на public `/traits/...` | процесс + ветка 4 passthrough |
| **RISK-006** | Object drag: preview vs prop reconcile races | text/curve use draft refs + skip effect reconcile during drag; shapes — position-only preview |

---

## Закрыто (история)

| Проблема | Как закрыто |
|----------|-------------|
| Dotted background OOM | `TilingSprite` screen-space (`PixiMapCanvas.tsx`) |
| Polyline auto-close | `closed: false` + open stroke |
| Image pipeline / drag flicker | `uploadAssetUrl` + `imageFingerprint` |
| traits/ambitions 403 | семантический resolver (ветки 1–5) |
| Curve text selection (carry-over #1) | mainline select + handle edit (0.3.5); arc-precision → DEBT-012 |
| Prototype sandbox code | `prototypes/` удалён 2026-06-07; SPEC/REPORT в `docs/prod/prototypes/001/` |

---

## Процессные правила

1. Изменения `tauri.conf.json` (asset protocol, CSP) или глобальных path helpers → smoke по **всем** image surfaces.
2. Не использовать whitelist имён папок в resolver — только семантика пути.

---

## Связанные документы

- [`docs/prod/adr/0001-canvas-rendering-technology.md`](prod/adr/0001-canvas-rendering-technology.md)
- [`docs/prod/adr/0003-canvas-data-model.md`](prod/adr/0003-canvas-data-model.md)
- [`docs/prod/adr/0004-canvas-scene-types-and-scene-container.md`](prod/adr/0004-canvas-scene-types-and-scene-container.md) (stub → canonical ADR)
- [`docs/prod/prototypes/001-curve-text-canvas/CARRYOVER.md`](prod/prototypes/001-curve-text-canvas/CARRYOVER.md)
- [`docs/canvas-functional-gaps.md`](canvas-functional-gaps.md)
- [`docs/prod/vision/canvas.md`](prod/vision/canvas.md)

*Последнее обновление: 2026-06-07.*
