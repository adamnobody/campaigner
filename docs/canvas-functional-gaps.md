# Canvas — актуальные functional gaps

**Статус:** синхронизировано с `testbed-rust` на **2026-06-07**.  
**Не заменяет:** ADR (`docs/prod/adr/`), vision (`docs/prod/vision/canvas.md`), runtime debt (`docs/canvas-debt.md`).

---

## Закрытые вехи

| Веха | Статус | Примечание |
|------|--------|------------|
| **0.3.1** canvas foundation | ✅ | Pixi canvas, migration 017, ADR-0001/0003 |
| **0.3.1.x** parity | ✅ | [`docs/plans/0.3.1.x-canvas-parity.md`](plans/0.3.1.x-canvas-parity.md) |
| **0.3.5** text parity | ✅ | `d8b0f4664` — inline edit, `MapTextPanel`, presets, curve handles, Delete |
| **0.3.2** architecture (core) | ✅ | migration 018, `scene_type`, `scene_container`, atomic create map+card |

### Закрытые темы (бывшие регрессии)

| Тема | Что восстановлено |
|------|-------------------|
| **Markers** | `MapMarkerDialog` / `MapMarkerPanel`, emoji+label render, edit, drag, child scene attach |
| **Territories** | `draw_territory`, dialog/panel, vertex edit, multi-ring, canvas labels, faction link |
| **Nested maps** | `canvas_markers_attach_child_scene`, navigation stack, breadcrumbs |
| **Navigation** | `navigationStack.ts`, marker + `scene_container` drill-down |
| **Text** | `MapTextPanel`, `MapInlineTextEditor`, style presets, bezier handle edit, Del delete |

> Исторический read-only аудит регрессий на 2026-05-31 (сравнение с pre-canvas `HEAD`) больше не актуален как рабочий чеклист. Контекст перехода «Карта» → «Холст» — в parity-плане и git-истории до `db4392890`.

---

## Открытые gaps (product / UX)

### Property inspectors (SD02-minimum, не реализовано)

| Kind | Gap |
|------|-----|
| `rectangle`, `ellipse` | нет UI для fill/stroke/size после создания |
| `polyline` | нет stroke UI; **product decision pending** (скрыть tool vs inspector) |
| `image` | opacity/size не редактируются в панели |

### Canvas chrome

- **Context menu «Edit»** для non-text kinds — не открывает полноценный inspector (в отличие от marker/territory/text panels при selection).
- **CV04 Layers UI** — `canvas_layer` в БД; панели toggle/reorder в UI нет.
- **Resize handles** для shapes/image — только move-drag, без geometry handles.

### Product scope (deferred / future)

| Тема | Статус |
|------|--------|
| `note`, `file_ref` kinds | future product track (SD01/SD02) |
| Unified `text` + `warp.mode` (слияние `text` / `curve_text`) | deferred; сейчас отдельные kinds, `curve_text` скрыт из toolbar |
| `entity_ref`, `connection`, `chart` | 0.4.x+ (ADR-0004, vision §6) |
| `territory` → `polygon` metadata merge | vision, не parity |

---

## Deferred architecture (не баги)

| Item | Статус |
|------|--------|
| **PR9** legacy opt-in migrator (root NULL + background → `root_canvas` + card + child `map`) | **deferred** — нет UI/команды |
| Route alias `/canvas` | deferred; route `/project/:id/map` сохранён |
| Silent / automatic legacy migration | explicitly out of scope (ADR-0004) |
| Offline migration старых SQL dumps `maps` → `canvas_*` | отдельная задача по необходимости |

---

## Runtime / performance

Не functional gaps — см. **[`docs/canvas-debt.md`](canvas-debt.md)**:

incremental reconciler, viewport culling, selection highlight, curve text glyph cache, dots shader, arc hit-test, 16k PNG, `persistObject` debounce.

---

## Связанные документы

- [`docs/prod/vision/canvas.md`](prod/vision/canvas.md)
- [`docs/plans/0.3.2-canvas-architecture.md`](plans/0.3.2-canvas-architecture.md)
- [`docs/canvas-debt.md`](canvas-debt.md)

*Последнее обновление: 2026-06-07 (documentation cleanup).*
