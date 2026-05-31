# Canvas в Campaigner — продуктовое видение

## 1. Что такое Canvas в Campaigner

Canvas в Campaigner — универсальная рабочая поверхность для визуального мышления о проекте. Это не "доска отдельно" и не "карта отдельно", а единая сцена, которая может отображаться в разных режимах.

На уровне модели это одна `canvas_scene`, которая не дублируется по типам задач. Пользователь работает с одними и теми же объектами, а режимы меняют способ просмотра и организации этого же набора данных.

## 2. Чем Canvas НЕ является

- Canvas не является альтернативой wiki и заметкам.
- Canvas не является таблицей или базой данных.
- Canvas не является доской вдохновения в духе Milanote/Pinterest.
- Canvas не является отдельным продуктом: это часть проекта Campaigner.
- Canvas не является редактором графики.

## 3. Базовые kinds объектов

Текущие kinds (остаются в модели):

- `image`
- `text` (включая `curve_text` как стиль)
- `polygon` (в перспективе поглощает `territory`)
- `polyline`
- `rectangle`
- `ellipse`
- `marker` / `icon`
- `group`
- `territory` (наследие; в будущем сольется с `polygon`)
- `curve_text` (наследие; в будущем стиль `text`)

Запланированы к добавлению в 0.3.2 - 0.4.x (не в этом заходе):

- `note`
- `entity_ref`
- `connection` (typed)
- `region`
- `scene_container`
- `board_link`
- `file_ref`

Явно отброшены:

- `color_swatch` — это стиль, не объект.
- `quote` — это `text` со стилем.
- `table` — не canvas, отдельная страница.
- `wiki_ref` — частный случай `entity_ref`.
- `ink` / `freehand` — низкий ROI.

## 4. Режимы отображения

Одна `canvas_scene` отображается в одном из четырех режимов. Режим — это фильтр видимости и опциональная компоновка; объекты не дублируются.

- **Map mode** — географическая карта (`image` background + `polygon` + `marker` + `curve_text`).
- **Relations mode** — граф сущностей и связей (`entity_ref` + `connection`).
- **Plot mode** — сюжетная доска (`scene_container` + `entity_ref` + `connection`, опционально timeline).
- **Free mode** — свободная доска (все видно).

Режимы планируются как CV06 в 0.4.x. В заходе 0.3.1 режимы не реализуются.

## 5. Дифференциаторы

- **Branch-aware Canvas** — отображение переопределений текущей ветки и diff между ветками (DG02).
- **Living `entity_ref`** — карточка-ссылка, подтягивающая актуальное состояние сущности.
- **Typed `connection`** — семантические связи между объектами.
- **Nested boards** через `board_link`.
- **`region` / `scene_container`** с семантикой.

## 6. Этапность

- **0.3.1** — база Canvas, примитивы, curve text, переименование UI "Map" -> "Canvas" / "Карта" -> "Холст", subtle dotted background, context menu, i18n, canvas-native image add, исправления zoom/scene-clear.
- **0.3.2** — слои (CV04), Sidebar 2.0 (SD01), Context panel (SD02), kind `note`, kind `file_ref`.
- **0.4.x** — CV05 многоуровневые проекции, CV06 режимы, CV07 `entity_ref`, CV08 typed `connection`, CV09 `region`/`scene_container`, CV10 `board_link`.
- **0.6.x+** — DG01 timeline scrubber (Plot mode), DG02 полноценный branches engine UI, DG03 Knowledge Graph как Relations mode.

Примечание по реализации 0.3.1: для минимального диффа оставляем имя файла `MapPage.tsx` и route `/map`, но экспортируемый UI-компонент называется `CanvasPage`.

## 7. Принципы

- Не плодить per-kind таблицы: все хранится в `canvas_object` через `kind` + `content_json` + `style_json`.
- Map — частный случай `canvas_scene`, а не отдельная сущность.
- Не вводить отдельные product type "map" и "moodboard"; это режимы одной модели.
- Не дублировать сущности проекта в canvas: `entity_ref` всегда ссылается на оригинал.
- i18n обязателен для всех строк UI в Canvas.

## Источник истины

Этот документ — источник истины для следующих заходов по Canvas. При расхождении с другими canvas-документами обновляется этот файл и связанные ссылки на него.
