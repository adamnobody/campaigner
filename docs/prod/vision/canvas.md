# Canvas в Campaigner — продуктовое видение

## 1. Что такое Canvas в Campaigner

Canvas в Campaigner — универсальная рабочая поверхность для визуального мышления о проекте. Это не "доска отдельно" и не "карта отдельно", а единая модель сцен, которая может отображаться в разных режимах.

На уровне данных:

- **`root_canvas`** — один главный **Холст** проекта (рабочая поверхность без обязательного географического растра).
- **`map`** — географическая **Карта** (сцена с `background_path`, территориями, маркерами).
- Связь «карточка на Холсте → карта» — объект **`scene_container`** с `linked_scene_id` (см. ADR-0004).

Пользователь работает с одними и теми же объектами внутри сцены; режимы CV06 (будущее) меняют фильтр видимости, а не дублируют данные.

## 2. Чем Canvas НЕ является

- Canvas не является альтернативой wiki и заметкам.
- Canvas не является таблицей или базой данных.
- Canvas не является доской вдохновения в духе Milanote/Pinterest.
- Canvas не является отдельным продуктом: это часть проекта Campaigner.
- Canvas не является редактором графики.
- **Project Graph** (`/project/:id/graph`) — отдельная поверхность; в milestone Canvas architecture **не меняется**.

## 3. Базовые kinds объектов

Текущие kinds (миграция 017 + architecture 018):

- `image`, `text`, `curve_text`, `polygon`, `polyline`, `rectangle`, `ellipse`
- `territory` (семантический регион на **map**; в перспективе может слиться с `polygon`)
- `marker` (точка на **map**, вложенная карта через `linked_scene_id`)
- `icon` (**legacy**, поддержка существующих строк; на **map**)
- `group` (**structural**, группировка на **map** и **root_canvas**)
- **`scene_container`** (карточка **Карты** на **root_canvas**, `linked_scene_id` → сцена `map`)

Запланированы к добавлению (не в 0.3.2 architecture MVP):

- `note`, `file_ref` (0.3.2 product track SD01/SD02 — отдельно от architecture)
- `entity_ref`, `connection` (typed), `chart` — см. §6 и ADR-0004
- `region`, `board_link` — 0.4.x+

Явно отброшены:

- `color_swatch` — стиль, не объект.
- `quote` — `text` со стилем.
- `table` — не canvas.
- `wiki_ref` — частный случай `entity_ref`.
- `ink` / `freehand` — низкий ROI.

**Два способа открыть вложенную карту:**

| Механизм | Где | Смысл |
|----------|-----|--------|
| `marker` + `linked_scene_id` | На сцене **map** | Точка на карте → переход в дочернюю **map** |
| `scene_container` + `linked_scene_id` | На **root_canvas** | Карточка карты на Холсте → открыть **map** |

## 4. Режимы отображения

Одна `canvas_scene` в будущем отображается в одном из режимов (CV06, 0.4.x). Режим — фильтр видимости; объекты не дублируются.

- **Map mode** — географическая карта (`map`: фон + `territory` + `marker` + примитивы).
- **Relations mode** — `entity_ref` + `connection` (будущее).
- **Plot mode** — сюжетная доска (`scene_container` + `entity_ref` + `connection`; timeline позже).
- **Free mode** — всё видно.

В 0.3.1–0.3.2 режимы **не реализуются**; тип сцены `scene_type` задаёт продуктовую роль, не CV06 mode switch.

## 5. Дифференциаторы

- **Branch-aware Canvas** — переопределения ветки (DG02).
- **Living `entity_ref`** — будущее.
- **Typed `connection`** — будущее.
- **Nested geography** — marker drill-down + карточки `scene_container` на Холсте.
- **`region`** — 0.4.x+ (не путать с `territory` на map).

## 6. Этапность

| Веха | Статус | Содержание |
|------|--------|------------|
| **0.3.1** | ✅ closed | Pixi canvas, примитивы, curve text render, UI «Холст», route `/map`, migration 017 |
| **0.3.1.x parity** | ✅ closed | Маркеры, территории, nested maps (marker), breadcrumbs — [`docs/plans/0.3.1.x-canvas-parity.md`](../plans/0.3.1.x-canvas-parity.md) |
| **0.3.5 text parity** | ✅ closed | Inline edit, `MapTextPanel`, presets, curve handle UX, Delete key |
| **0.3.2 architecture (core)** | ✅ closed | ADR-0004 **Accepted**: migration 018, `scene_type`, `scene_container`, atomic create, kind matrix — [`docs/plans/0.3.2-canvas-architecture.md`](../plans/0.3.2-canvas-architecture.md) |
| **0.3.2 PR9** | ⏸ deferred | Legacy opt-in migrator (no silent migration) |
| **0.3.2+ product** | open | CV04 слои, SD01 Sidebar, SD02 Context panel, shape/image inspectors, `note`, `file_ref` |
- **0.4.x** — CV05 многоуровневые проекции, CV06 режимы, CV07 `entity_ref`, CV08 `connection`, CV09 `region` / `board_link`, CV10.
- **0.6.x+** — DG01 timeline (Plot), DG02 branches UI, DG03 Knowledge Graph как Relations mode.

**Снятый конфликт (2026-06):** `scene_container` ранее был отнесён только к 0.4.x (CV09). Карточка карты на Холсте перенесена в **0.3.2 architecture**, потому что без неё нельзя разделить Холст и географическую карту в модели. Полноценный Plot mode и `entity_ref` на доске остаются в 0.4.x.

Примечание по реализации: файл `MapPage.tsx`, route `/project/:id/map` и param `mapId` сохраняются; UI может называть страницу «Холст». Alias `/canvas` — **deferred**.

**Runtime debt** (reconciler, culling, shader dots) — отдельно: [`docs/canvas-debt.md`](../canvas-debt.md).  
**Актуальные UX gaps** — [`docs/canvas-functional-gaps.md`](../canvas-functional-gaps.md).

## 7. Принципы

- Не плодить per-kind таблицы: `canvas_object` + `kind` + JSON + FK.
- **Map** — `scene_type = map`, не отдельная product-сущность «maps».
- **`background_path` не определяет тип сцены** — тип задаёт `scene_type`.
- Не дублировать сущности проекта в canvas: `entity_ref` ссылается на оригинал (будущее).
- i18n обязателен для строк Canvas UI.
- **No silent migration** для legacy root-with-background.

## Источник истины

Этот документ — источник истины для продуктовых заходов по Canvas. При расхождении с ADR: архитектурные инварианты — в `docs/adr/ADR-0004-canvas-scene-types-and-scene-container.md` (и индекс `docs/prod/adr/README.md`); продуктовая этапность — здесь.
