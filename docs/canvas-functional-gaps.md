# Canvas — функциональные регрессии и дефекты

Аудит выполнен **read-only** по состоянию репозитория на 2026-05-31: последний коммит `HEAD` + незакоммиченные изменения canvas-захода (см. `git status`).

---

## Точка перехода «Карта» → «Холст»

### Закоммиченная опорная точка (backend)

| Поле | Значение |
|------|----------|
| **Коммит** | `75e093703` — `feat(canvas): scaffold destructive canvas backend replacement` |
| **Дата** | 2026-05-24 |
| **Суть** | Миграция `017_canvas_replacement.sql`, Rust-модели/репозитории/команды canvas; снята регистрация legacy map-команд. **Frontend в этом коммите не менялся.** |

### Фактический переход UI «Карта» → «Холст» (незакоммичено)

Переименование и замена страницы **ещё не в git history** — только в рабочей копии относительно `HEAD`.

| Поле | Значение |
|------|----------|
| **База сравнения** | `HEAD` (страница «Карта», i18n `"map": "Карта"`) |
| **Текущее состояние** | uncommitted diff + untracked файлы |
| **Переименование в меню** | `frontend/src/i18n/locales/ru/navigation.json`: `"Карта"` → `"Холст"`; en: `"Map"` → `"Canvas"` |
| **Route** | без изменений: `/project/:projectId/map` (`MapPage.tsx` экспортирует `CanvasPage`) |

**Удалены (D) относительно HEAD:**

- `frontend/src/pages/maps/components/MapMarkerDialog.tsx`
- `frontend/src/pages/maps/components/MapMarkerOnMap.tsx`
- `frontend/src/pages/maps/components/MapMarkerPanel.tsx`
- `frontend/src/pages/maps/components/MapTerritoryDialog.tsx`
- `frontend/src/pages/maps/components/MapTerritoryPanel.tsx`
- `frontend/src/pages/maps/components/MapTerritorySvg.tsx`
- `frontend/src/pages/maps/components/mapUtils.ts`
- `frontend/src/pages/maps/hooks/useMapData.ts`
- `frontend/src/pages/maps/hooks/useMapInitialFit.ts`
- `frontend/src/pages/maps/hooks/useMapInteractions.ts`
- `frontend/src/pages/maps/hooks/useMapMarkerCrud.ts`
- `frontend/src/pages/maps/hooks/useMapNavigation.ts`
- `frontend/src/pages/maps/hooks/useMapTerritoryCrud.ts`
- `frontend/src/pages/maps/hooks/useMapTerritoryDrawing.ts`
- `frontend/src/pages/maps/hooks/useMapViewport.ts`

**Сильно переписаны (M):**

- `frontend/src/pages/maps/MapPage.tsx`
- `frontend/src/pages/maps/components/MapToolbar.tsx`
- `frontend/src/i18n/locales/*/map.json`

**Добавлены (??, untracked):**

- `frontend/src/api/canvas.ts`
- `frontend/src/pages/maps/canvas/PixiMapCanvas.tsx`
- `frontend/src/pages/maps/canvas/canvasModel.ts`
- `frontend/src/pages/maps/canvas/canvasReconciler.ts`
- `frontend/src/pages/maps/components/MapCanvasContextMenu.tsx`

**Вывод:** опорная точка для регрессий — код страницы «Карта» в **`HEAD`** (`git show HEAD:frontend/src/pages/maps/...`). Всё перечисленное ниже из того кода, чего нет в текущем «Холсте».

---

## Что было на старой странице «Карта» (из `HEAD`)

### Настройки маркеров

Источники: `MapMarkerDialog.tsx`, `MapMarkerPanel.tsx`, `mapUtils.ts`, `useMapMarkerCrud.ts`, `MapMarkerOnMap.tsx`.

| Поле / контрол | Где | Примечание |
|----------------|-----|------------|
| **title** (название) | `MapMarkerDialog` — `TextField` `fieldTitle` | Обязательное при сохранении |
| **description** (описание) | `MapMarkerDialog` — `TextField` multiline `fieldDescription` | |
| **icon** (иконка) | `MapMarkerDialog` — `Select` `fieldIcon` | 19 значений из `MARKER_ICONS` в `mapUtils.ts`: castle, city, village, tavern, dungeon, forest, mountain, river, cave, temple, ruins, port, bridge, tower, camp, battlefield, mine, farm, graveyard, custom |
| **color** (цвет) | `MapMarkerDialog` — swatches `MARKER_COLORS` (12 hex-цветов) | |
| **linkedNoteId** (привязка к заметке) | `MapMarkerDialog` — `Autocomplete` по списку notes | |
| **createChildMap** (создать вложенную карту) | `MapMarkerDialog` — toggle, только при **создании** | |
| **child map image** (картинка вложенной карты) | `MapMarkerDialog` — file input при `createChildMap` | |
| **preview** (превью маркера) | `MapMarkerDialog` — блок с emoji + title + linked note | |
| **position (x, y)** | `MapMarkerPanel` — read-only caption | Не поле редактирования в диалоге |
| **linked note display + navigate** | `MapMarkerPanel` — секция `sectionLinkedNote` | |
| **child map: open / create / upload** | `MapMarkerPanel` — секция `sectionChildMap` | |
| **Edit / Delete** | `MapMarkerPanel` — кнопки → диалог / confirm | |

**Размер маркера (radius/scale):** не найдено в истории — на карте фиксированный круг 32×32 px (`MapMarkerOnMap.tsx`).

### Настройки территорий / полигонов

Источники: `MapTerritoryDialog.tsx`, `MapTerritoryPanel.tsx`, `useMapTerritoryCrud.ts`, `mapUtils.ts` (тип `Territory`).

| Поле / контрол | Где | Примечание |
|----------------|-----|------------|
| **name** (название) | `MapTerritoryDialog` — `TextField` `fieldName` | Обязательное |
| **description** | `MapTerritoryDialog` — `TextField` multiline | |
| **factionId** (владелец: государство/фракция) | `MapTerritoryDialog` — `Autocomplete`; при выборе подставляет `color` и `borderColor` | |
| **color** (заливка) | `MapTerritoryDialog` — swatches `TERRITORY_COLORS` (20 цветов) | |
| **opacity** (прозрачность) | `MapTerritoryDialog` — `Slider` 0.05–1, step 0.05 | |
| **borderColor** (обводка) | `MapTerritoryDialog` — swatches | |
| **borderWidth** (толщина обводки) | `MapTerritoryDialog` — `Slider` 0.5–5, step 0.5 | |
| **smoothing** (сглаживание контура) | `MapTerritoryDialog` — `Slider` 0–1, step 0.05 | |
| **preview SVG** | `MapTerritoryDialog` — превью с именем на полигоне | |
| **visual read-only** (fill, opacity, border, width) | `MapTerritoryPanel` — секция `sectionVisual` | |
| **ownership + navigate to faction** | `MapTerritoryPanel` — секция `sectionOwnership` | |
| **Edit settings** | `MapTerritoryPanel` — кнопка «Настройки» → `MapTerritoryDialog` | |
| **Edit shape** (редактирование вершин) | `MapTerritoryPanel` — кнопка `editShape`; `useMapTerritoryCrud` — `startEditingPoints`, insert/delete vertex | |
| **multi-ring** (несколько контуров) | `MapToolbar` — `completeContour`; `useMapTerritoryCrud` — `rings[]` | |

**Подпись территории на карте:** рендер имени на SVG (`MapTerritorySvg.tsx`, `territoryLabelMetrics` в `mapUtils.ts`) — не отдельное поле, но визуальная часть продукта.

### Флоу создания и редактирования (старая «Карта»)

**Маркер**

1. Режим `marker` в тулбаре (`MapToolbar`, `MapMode = 'marker'`).
2. Клик по карте → открывается **модалка** `MapMarkerDialog` (`openNewMarkerDialogAt` в `useMapInteractions.ts` / `useMapMarkerCrud.ts`).
3. Заполнение полей → Save → маркер на карте.
4. Выделение: клик в режиме `select` → **боковая панель** `MapMarkerPanel`.
5. Редактирование: кнопка Edit в панели → снова `MapMarkerDialog`.
6. Перемещение: drag в режиме `marker` (`useMapMarkerCrud.handleMarkerDragMove`).
7. Double-click при `childMapId` → навигация на вложенную карту (не edit-диалог).

**Территория**

1. Режим `draw_territory` в тулбаре.
2. Клики по карте → черновые точки; опционально «Complete contour» для второго кольца.
3. «Save» → **модалка** `MapTerritoryDialog` с настройками.
4. Выделение: клик по территории → **боковая панель** `MapTerritoryPanel`.
5. Редактирование настроек: кнопка в панели → `MapTerritoryDialog`.
6. Редактирование формы: «Edit shape» → режим вершин с insert/delete.

**Тулбар старой карты:** только `select` | `marker` | `draw_territory` (+ upload map image, breadcrumbs вложенных карт).

---

## РЕГРЕССИИ (было в «Карте», нет в «Холсте»)

| Что | Было (источник в истории) | Сейчас | Серьёзность |
|-----|---------------------------|--------|-------------|
| Диалог настроек маркера | `MapMarkerDialog.tsx` | Нет компонента; клик создаёт маркер с дефолтами (`MapPage.tsx` → `defaultMarkerObject`) | **high** |
| Поле title маркера | `MapMarkerDialog.fieldTitle` | Только дефолт `'Marker'` в `canvasModel.ts`; UI редактирования нет | **high** |
| Поле description маркера | `MapMarkerDialog.fieldDescription` | В `contentJson.description`, UI нет | **high** |
| Выбор icon (19 emoji) | `MapMarkerDialog.fieldIcon` + `MARKER_ICONS` | В `contentJson.icon`, reconciler рисует **круг без emoji** (`canvasReconciler.ts` marker branch) | **high** |
| Выбор color (12 swatches) | `MapMarkerDialog.colorLabel` | В `styleJson.fill`, UI нет; дефолт `#ff6b6b` | **high** |
| Привязка к заметке | `MapMarkerDialog.linkedNoteLabel` | Поле `linkedNoteId` в модели есть, UI нет | **high** |
| Вложенная карта у маркера | `MapMarkerDialog.createNestedMap*` + `MapMarkerPanel.sectionChildMap` | `linkedSceneId` в модели; UI и навигация по nested scenes нет | **high** |
| Боковая панель маркера | `MapMarkerPanel.tsx` | Мини-панель только kind/name/layer/z + Delete (`MapPage.tsx` ~584–611) | **high** |
| Подпись маркера на карте | `MapMarkerOnMap.tsx` — title под иконкой | Не рендерится | **med** |
| Бейджи note / child map на маркере | `MapMarkerOnMap.tsx` | Не рендерируются | **med** |
| Диалог настроек территории | `MapTerritoryDialog.tsx` | Нет; полигон создаётся с hardcoded style (`MapPage.createPolygon`) | **high** |
| name территории | `MapTerritoryDialog.fieldName` | `name: 'polygon'` при создании; UI редактирования нет | **high** |
| description территории | `MapTerritoryDialog.fieldDescription` | `defaultTerritoryObject` имеет `contentJson.description`, но **`createPolygon` использует kind `polygon`**, не `territory` | **high** |
| factionId / владелец | `MapTerritoryDialog.factionLabel` | В `defaultTerritoryObject.contentJson.factionId`, UI нет | **high** |
| fill / opacity / border / width | `MapTerritoryDialog` sliders + swatches | Hardcoded defaults при создании; UI нет | **high** |
| smoothing контура | `MapTerritoryDialog.smoothingSlider` | Не найдено в текущем canvas UI/модели polygon | **high** |
| Боковая панель территории | `MapTerritoryPanel.tsx` | Нет | **high** |
| Редактирование формы (вершины) | `MapTerritoryPanel.editShape` + `useMapTerritoryCrud` | Только **создание** нового polygon/polyline; edit vertices нет | **high** |
| Multi-ring (несколько контуров) | `MapToolbar.completeContour` | В polygon mode один контур (`PixiMapCanvas` drawing) | **med** |
| Подпись территории на карте | `MapTerritorySvg` + `territoryLabelMetrics` | Polygon без текстовой подписи в reconciler | **med** |
| Навигация к фракции из территории | `MapTerritoryPanel.sectionOwnership` | Нет | **med** |
| Breadcrumbs / nested maps | `MapToolbar` breadcrumbs, `useMapNavigation` | Нет breadcrumb nested scenes в новом UI | **med** |
| Upload map как фон карты | `MapToolbar.uploadMap` + `useMapMarkerCrud.handleUploadMap` | Заменено на «Add image» / canvas asset (`MapToolbar.onAddImage`); семантика другая | **low** |

**Итого регрессий: 22** (14 high, 6 med, 1 low).

---

## ДЕФЕКТЫ ДИЗАЙНА (сделано криво, не регрессия)

| Дефект | Сейчас | Как должно быть | Источник |
|--------|--------|-----------------|----------|
| Текст не редактируется после создания | Создание через toolbar/context menu; selection panel read-only; нет TextField/Dialog | Редактирование `contentJson.text` в инспекторе или inline | `MapPage.tsx`, `MapCanvasContextMenu.tsx` — нет edit handlers; `canvasReconciler.ts` только читает `content.text` |
| Context menu «Edit» — заглушка | `onEditSelected` → `setSelectedObjectId` + snackbar | Открытие панели свойств / inline edit | `MapPage.tsx:668–671`, `MapCanvasContextMenu.tsx:89–90` |
| `curve_text` — отдельная кнопка и kind | Toolbar toggle `curve_text`; `defaultTextObject(..., 'curve_text')`; отдельный `drawCurveText` | По vision: один `text` + параметр curvature (`docs/prod/vision/canvas.md` §3) | `MapToolbar.tsx:107`, `canvasModel.ts:121–137`, `canvasReconciler.ts:199` |
| `rectangle` и `ellipse` — две кнопки без настроек | Две toggle-кнопки; defaults only; selection panel без color/stroke | Общий shape-инспектор или единый kind `shape` | `MapToolbar.tsx:105–106`, `canvasModel.ts:140–177`, `MapPage.tsx:584–611` |
| Нет общего типа shape в UI | В модели отдельные kinds: `rectangle`, `ellipse`, `polygon`, `polyline` | ADR/vision допускает раздельные kinds, но UI должен давать style controls | `src-tauri/src/models/canvas.rs` `CANVAS_OBJECT_KINDS` |
| `polyline` — сомнительный UX без сценария в старой «Карте» | Кнопка + context menu + Ctrl+5; рисуется и как preset shape | В ADR — rivers/routes; в старой карте не было; кандидат на скрытие до 0.3.2 | `MapToolbar.tsx:104`, `docs/prod/adr/0001-canvas-rendering-technology.md` |
| `territory` kind мёртв в UI | `defaultTerritoryObject` есть, но `createPolygon` пишет `kind: 'polygon'` | Polygon draw → `territory` или единая модель с metadata | `canvasModel.ts:180–195`, `MapPage.tsx:329–350` |
| Маркер: данные в JSON, визуал не совпадает | `contentJson`/`styleJson` заполнены, reconciler игнорирует icon/title | Рендер emoji + label как в `MapMarkerOnMap` | `canvasModel.ts:80–95`, `canvasReconciler.ts:217–220` |
| Selection panel — не инспектор | Только name/kind/layer/z + delete | Context panel (SD02, 0.3.2) или минимальный property editor | `MapPage.tsx:584–611` |
| Нет resize handles | Drag только перемещает (`PixiMapCanvas` select drag) | Handles для width/height/radius (прототип Task 1 pattern) | `PixiMapCanvas.tsx:472–515` — нет scale/geometry edit |

**Итого дефектов дизайна: 10.**

---

## Матрица по типам объектов

Список kinds из тулбара / `CanvasMode` (`canvasModel.ts`, `MapToolbar.tsx`): **marker, text, polygon, polyline, rectangle, ellipse, curve_text, image**.  
Дополнительно в модели (`canvas.rs`): `territory`, `icon`, `group` — **не создаются из UI**.

| Тип | Создание | Выделение | Редакт. НАСТРОЕК (цвет/заливка/обводка/иконка/…) | Редакт. КОНТЕНТА (текст/заголовок) | Изменение размера | Удаление | Где открываются настройки |
|-----|----------|-----------|--------------------------------------------------|-------------------------------------|-------------------|----------|---------------------------|
| **marker** | Работает: toolbar / context menu / click (`MapPage.tsx:202–207`, `MapToolbar:101`) | Работает: click select (`PixiMapCanvas.tsx:400–403`) | **Нет** UI; defaults в `defaultMarkerObject` | **Нет** UI (`contentJson.title/description/icon`) | **Нет** (fixed `geometry.radius: 12`) | Работает: panel / context menu / confirm (`MapPage.tsx:375–387`) | **Нет** (read-only overlay ~584–611) |
| **text** | Работает: toolbar / context menu (`MapPage.tsx:210–215`) | Работает | **Нет** UI (`styleJson.fill`, `fontSize` только defaults) | **Нет** UI (`contentJson.text`) | **Нет** | Работает | **Нет** |
| **curve_text** | Работает: отдельная кнопка (`MapToolbar:107`) | Работает | **Нет** UI (`styleJson`, bezier `geometry`) | **Нет** UI | **Нет** (bezier control points не редактируются) | Работает | **Нет** |
| **polygon** | Работает: draw mode + finish (`PixiMapCanvas` + `MapPage.createPolygon`) | Работает | **Нет** UI (hardcoded fill/stroke/opacity) | **Нет** (name не редактируется) | **Нет** vertex edit | Работает | **Нет** |
| **territory** | **Нет** в UI (только helper `defaultTerritoryObject`, не вызывается) | Если объект в БД — рендер как polygon path | **Нет** UI | **Нет** | **Нет** | Работает (generic delete) | **Нет** |
| **polyline** | Работает: draw mode **или** preset shape (`MapPage.createPolyline`, `defaultShapeObject`) | Работает | **Нет** UI | **Нет** | **Нет** | Работает | **Нет** |
| **rectangle** | Работает: click / context menu (`MapPage.tsx:218–223`) | Работает | **Нет** UI | **Нет** | **Нет** (`geometry.width/height` fixed at create) | Работает | **Нет** |
| **ellipse** | Работает: click / context menu | Работает | **Нет** UI | **Нет** | **Нет** (`radiusX/radiusY` fixed) | Работает | **Нет** |
| **image** | Работает: toolbar / context menu + file picker (`MapPage.tsx:226–228, 277–311`) | Работает | **Частично**: opacity в `styleJson`, UI нет | N/A | **Нет** UI (размер из файла, не editable) | Работает | **Нет** |
| **icon** | **Нет** в UI | N/A | N/A | N/A | N/A | N/A | N/A |
| **group** | **Нет** в UI | N/A | N/A | N/A | N/A | N/A | N/A |

---

## Ответы на конкретные вопросы

### 1. ТЕКСТ: можно ли отредактировать содержимое после создания?

**Нет.**

- UI: selection panel показывает только meta + Delete (`MapPage.tsx:584–611`); context menu «Edit» лишь перевыбирает объект и показывает snackbar (`MapPage.tsx:668–671`).
- Нет TextField, Dialog, inline editor для `contentJson.text`.
- Reconciler читает `content.text` при отрисовке (`canvasReconciler.ts:201–208`), но запись из UI отсутствует.

### 2. CURVE TEXT: отдельный тип или text + curvature?

**Отдельный kind и отдельная кнопка.**

- Модель: `CanvasMode` включает `'curve_text'` отдельно от `'text'` (`canvasModel.ts:5–14`).
- Toolbar: две кнопки — `toolText` и `toolCurveText` (`MapToolbar.tsx:102, 107`).
- Backend kinds: `"text"` и `"curve_text"` раздельно (`canvas.rs:8–9`).
- `defaultTextObject` принимает `kind: 'text' | 'curve_text'` с разной geometry: text → `{width, height}`, curve_text → bezier `{start, control, end}` (`canvasModel.ts:121–137`).

**Можно ли слить в text + curvature?**

- **Технически частично:** поля `curvature` в модели **нет**; curve_text использует отдельную geometry (bezier points), не параметр на text.
- **Мешает:** разные `kind`, разная geometry schema, отдельный `drawCurveText` (`canvasReconciler.ts:97–129`), отдельные factory/hotkey/toolbar paths.
- Vision документирует слияние как будущее (`docs/prod/vision/canvas.md` §3).

### 3. RECTANGLE и CIRCLE (ellipse): две кнопки? Настройки? Общий shape?

- **Две отдельные кнопки:** `rectangle` и `ellipse` (`MapToolbar.tsx:105–106`).
- **Настроек нет:** только defaults `{ fill, opacity, stroke, strokeWidth }` в `defaultShapeObject` (`canvasModel.ts:152–164`); UI редактирования отсутствует.
- **Общего типа shape нет:** в `CANVAS_OBJECT_KINDS` — отдельные `"rectangle"` и `"ellipse"` (`canvas.rs:12–13`); общий `"shape"` не используется.

### 4. POLYLINE: где используется, нужна ли?

- **UI:** toolbar, context menu, hotkey Ctrl+5 (`MapToolbar.tsx:104`, `MapPage.tsx:468–477`, `MapCanvasContextMenu.tsx:82–84`).
- **Создание:** draw mode (≥2 points) или preset triangle-like polyline (`MapPage.createPolyline`, `defaultShapeObject` polyline branch).
- **Настроек нет.**
- **Продуктовый сценарий:** в старой «Карте» polyline **не было**. В ADR-0001 — «polylines (rivers, routes)»; в vision canvas — kind в модели; в прототипе 001 — demo tool.
- **Кандидат на удаление/скрытие в 0.3.1:** да, если приоритет — parity с «Картой»; для 0.3.2+ — оставить с инспектором stroke.

### 5. МАРКЕР: настройки СЕЙЧАС vs было

| Настройка | Было («Карта») | Сейчас («Холст») |
|-----------|----------------|------------------|
| title | Dialog | Default only, no UI |
| description | Dialog | JSON default, no UI |
| icon (19) | Dialog Select | JSON default `'custom'`, **не рисуется** |
| color (12 swatches) | Dialog | JSON default, no UI |
| linked note | Dialog Autocomplete | `linkedNoteId: null`, no UI |
| nested child map | Dialog + Panel | no UI |
| edit after create | Panel → Dialog | **Нет** |
| move | Drag in marker mode | Drag in select mode only |
| size | Fixed 32px (not configurable) | Fixed radius 12 in geometry |

### 6. ПОЛИГОН/ТЕРРИТОРИЯ: настройки СЕЙЧАС vs было

| Настройка | Было («Карта») | Сейчас («Холст») |
|-----------|----------------|------------------|
| name | Dialog | `'polygon'` hardcoded |
| description | Dialog | не используется (polygon `contentJson: {}`) |
| factionId | Dialog | не используется |
| fill / opacity | Dialog | hardcoded at create |
| border color / width | Dialog | hardcoded at create |
| smoothing | Dialog Slider | **отсутствует** |
| edit shape | Panel + vertex mode | **только create**, no edit |
| multi-ring | Toolbar completeContour | **нет** |
| label on map | SVG | **нет** |

---

## ВАЖНО для приоритизации 0.3.1.x

### Блокеры закрытия 0.3.1 (регрессии — восстановить parity с «Картой»)

1. **Маркер:** диалог/панель с title, description, icon, color, linked note; рендер icon + label на canvas; edit после создания.
2. **Территория/полигон:** диалог/панель с name, description, faction, fill, opacity, border, smoothing; edit vertices; label на полигоне.
3. **Nested maps / child scene у маркера** — если это было частью core map workflow (данные `childMapId` / `linkedSceneId`).
4. **Breadcrumbs nested scenes** — если nested maps восстанавливаются.

Без пунктов 1–2 переименование «Карта» → «Холст» **функционально ложно**: пользователь теряет основной workflow worldbuilding.

### Задачи 0.3.2 (дизайн / новые примитивы, не parity)

- Редактируемый plain text и унификация text / curve_text.
- Property inspector (Context panel SD02) для rectangle, ellipse, polyline, image.
- Resize handles, incremental reconciler (см. `docs/canvas-debt.md`).
- Решение по polyline: скрыть до инспектора или оставить с stroke UI.
- Слияние `territory` → `polygon` по vision (metadata в contentJson).

---

## Backend parity-аудит

Read-only проверка backend для восстановления parity «Карты» на canvas-модели.  
База: коммит `75e093703`, миграция `017_canvas_replacement.sql`, продуктовое решение — `polygon` + `contentJson` для территориальности, nested maps = CORE.

### A. Схема canvas_objects — хватает ли JSON-полей

**1. Колонки таблицы `canvas_object`** (миграция `017_canvas_replacement.sql:31–62`, модель `CanvasObject` в `canvas.rs:56–78`):

| Колонка | Тип | Назначение |
|---------|-----|------------|
| `id` | INTEGER PK | |
| `scene_id` | INTEGER FK → `canvas_scene` | |
| `layer_id` | INTEGER FK → `canvas_layer` | |
| `kind` | TEXT CHECK (11 kinds) | |
| `name` | TEXT | опциональное имя объекта |
| `z_index` | INTEGER | |
| `transform_json` | TEXT NOT NULL | позиция/rotation/scale |
| `geometry_json` | TEXT DEFAULT `'{}'` | форма (points, radius, bezier…) |
| `style_json` | TEXT DEFAULT `'{}'` | **свободный JSON** |
| `content_json` | TEXT DEFAULT `'{}'` | **свободный JSON** |
| `resource_path` | TEXT | путь к asset |
| `linked_note_id` | INTEGER FK → `notes(id)` | **отдельная колонка**, не JSON |
| `linked_scene_id` | INTEGER FK → `canvas_scene(id)` | вложенная сцена |
| `is_hidden`, `is_locked` | INTEGER | |
| `created_branch_id`, `created_at`, `updated_at` | | branch overlay |

**Да** — `content_json` и `style_json` хранят произвольные поля без изменения схемы. В Rust они типизированы как `serde_json::Value` (`canvas.rs:67–70`); при INSERT/UPDATE сериализуются как JSON-текст (`canvas.rs:612–615`, `702–706`).

**2. Влезают ли настройки маркера/полигона без миграции схемы?**

**Да**, с уточнениями по размещению полей:

| Поле | Куда класть (рекомендация по коду) | Комментарий |
|------|-----------------------------------|-------------|
| **Маркер: title, description, icon** | `content_json` | Аналог старых колонок `title`, `description`, `icon` |
| **Маркер: color** | `style_json.fill` (или `content_json.color`) | Отдельной колонки `color` нет (в старой `map_markers.color` была) |
| **Маркер: linkedNoteId** | **`linked_note_id` колонка** | FK на `notes`; не обязательно дублировать в JSON |
| **Полигон: name** | `name` и/или `content_json.name` | Оба поля есть |
| **Полигон: description, factionId, fill, opacity, borderColor, borderWidth, smoothing** | `content_json` | По продуктовому решению; backend не валидирует ключи |

Восстановление UI настроек = **frontend + вызовы `canvas_objects_update` / `canvas_reconcile_scene`**. ALTER TABLE **не нужен**.

---

### B. Заметки и фракции — живы ли связи

**3. `linkedNoteId` — JSON или FK? Команды резолва?**

- **Не JSON-only.** Колонка `linked_note_id INTEGER REFERENCES notes(id) ON DELETE SET NULL` (`017_canvas_replacement.sql:55`).
- DTO: `CreateCanvasObjectInput.linked_note_id`, `UpdateCanvasObjectInput.linked_note_id` (`canvas.rs:247–248`, `271–272`).
- Repository пишет колонку напрямую (`canvas.rs:617–618`, `712–714`); **отдельной валидации «note exists in project» в коде нет** — только SQLite FK (при `PRAGMA foreign_keys=ON` неверный id → ошибка INSERT/UPDATE).
- **Команды для фронта живы:** `notes_list`, `notes_get` (`commands/mod.rs:11`, `frontend/src/api/notes.ts:88–118`). Старый map UI использовал `notesApi.getAll(projectId)` (`useMapData.ts` в HEAD).

**4. `factionId` — фракции живы? Autocomplete и цвет?**

- **Да, не затронуты миграцией 017.** Таблица `factions` из `008_factions.sql` (поля `id`, `name`, `kind` ∈ {state, faction}, `color`, …). Миграция 017 дропает только `maps`, `map_markers`, `map_territories`.
- **Команды живы:** `factions_list`, `factions_get`, … (`commands/mod.rs:9`, `frontend/src/api/factions.ts:219+`). Старый map: `factionsApi.getAll(projectId)` → Autocomplete в `MapTerritoryDialog`.
- **Цвет фракции:** поле `factions.color` (`008_factions.sql:23`); доступен через `factions_get` / list.

**⚠️ Оговорка под решение «polygon, не territory»:** запросы, связывающие фракции с canvas-территориями, фильтруют **`co.kind = 'territory'`**:
- `canvas.rs` → `list_territory_summaries` (`canvas.rs:917`)
- `factions.rs` → `list_territories_internal`, `sync_state_territories` (`factions.rs:1606`, `2166`, `2189`)

Если UI создаёт `kind: 'polygon'`, **связь state↔territory на странице фракций и `listTerritorySummaries` не увидят объекты**, пока backend-запросы не расширят до `polygon` (или `IN ('territory','polygon')`). Это **доработка SQL в backend**, не миграция схемы.

---

### C. Вложенные карты — что снесено, что осталось, объём восстановления

**5. Как было в старой «Карте» (HEAD)**

Таблица **`maps`** (`015_maps.sql:1–13`):
- `parent_map_id` → FK на родительскую карту
- `parent_marker_id` → id маркера-«входа»
- `name`, `image_path`

Таблица **`map_markers`** (`015_maps.sql:15–32`):
- `child_map_id INTEGER REFERENCES maps(id)` — ссылка маркера на вложенную карту
- `linked_note_id` → notes

Команды (`HEAD:src-tauri/src/commands/maps.rs`):
- `maps_get_root`, `maps_get_tree`, `maps_get`, **`maps_create`**, `maps_update`, `maps_delete`
- `maps_markers_create/update` с полем `childMapId`

Frontend-flow (`useMapMarkerCrud.ts` в HEAD):
1. `mapApi.createMarker(...)`
2. если `createChildMap`: `mapApi.createMap({ parentMapId, parentMarkerId, name })`
3. `mapApi.updateMarker(markerId, { childMapId })`
4. опционально `mapApi.uploadMapImage(childMapId, file)`
5. навигация: `maps_get_tree` + breadcrumbs в `MapToolbar`

**6. Что снесла миграция 017**

```sql
DROP TABLE IF EXISTS map_territories;
DROP TABLE IF EXISTS map_markers;
DROP TABLE IF EXISTS maps;
```
(`017_canvas_replacement.sql:79–81`)

- Таблицы **`maps` / `map_markers` / `map_territories` удалены**.
- **Data migration отсутствует** — нет `INSERT INTO canvas_* SELECT FROM maps_*`.
- Legacy map-команды **дерегистрированы** в текущем `lib.rs` (только `canvas_*`, grep по `maps_` — пусто).

**7. Новая canvas-модель — nested scenes**

**Сцена (`canvas_scene`, `017:1–13`, `canvas.rs:21–34`):**
- `parent_scene_id` — родительская сцена (аналог `parent_map_id`)
- `parent_object_id` — FK на маркер-«вход» (аналог `parent_marker_id`)

**Объект (`canvas_object`):**
- `linked_scene_id` — FK на вложенную сцену (аналог `child_map_id`)

**Команды (зарегистрированы в `lib.rs:112–132`, обёрнуты в `frontend/src/api/canvas.ts`):**

| Операция | Команда | Параметры nested |
|----------|---------|------------------|
| Создать сцену | `canvas_scenes_create` | `parentSceneId`, `parentObjectId` (`CreateCanvasSceneInput`, `canvas.rs:122–133`) |
| Обновить объект | `canvas_objects_update` | `linkedSceneId` (`canvas.rs:271–272`) |
| Дерево сцен | `canvas_scenes_get_tree` | все сцены проекта (`canvas.rs:108–114`) |
| Фон сцены | `canvas_scenes_update` | `backgroundPath`; также `uploadSceneBackground` в API |

Repository `create_scene` пишет `parent_scene_id` и `parent_object_id` (`canvas.rs:177–185`).  
`update_object` пишет `linked_scene_id` (`canvas.rs:716–718`).

**Эквивалент старого flow (3 шага, без новых таблиц):**
1. `canvas_objects_create` — marker
2. `canvas_scenes_create` — `{ parentSceneId: current, parentObjectId: marker.id, name }`
3. `canvas_objects_update` — `{ id: marker.id, linkedSceneId: childScene.id }`
4. опционально `canvas_scenes_update` / image upload для фона дочерней сцены

Циклические FK (`parent_object_id` ↔ `linked_scene_id`) разрешаются порядком: сначала marker без link → scene с `parent_object_id` → update marker.

**8. Вывод по nested maps**

| Аспект | Вердикт |
|--------|---------|
| **Parity для новых данных (Track 1 UI)** | **(a) в основном frontend** — schema + CRUD-команды уже есть |
| **Backend blockers для nested maps** | **Нет** новых таблиц/миграций для greenfield-сценария |
| **Что НЕ восстановится автоматически** | Данные из старых `maps`/`map_markers` после прогона 017 — **без отдельной data-migration** |
| **Nice-to-have backend** | Атомарная команда «create child scene for marker»; опциональная миграция legacy→canvas для существующих БД |

**Ключевой ответ для Трека 1: (a)** — orchestration на фронте через `canvasApi.createScene` + `updateObject` + `getSceneTree`; **не (b)** в смысле новой схемы.

---

### D. Canvas-команды — хватает ли для update настроек

**9. Текущий набор команд** (`lib.rs:112–132`, `canvasApi`):

**Scenes:** get_root, get_tree, get, create, update, delete  
**Layers:** list, create, update, delete, reorder  
**Objects:** list, get, **create**, **update**, delete, reorder, bulk_upsert, bulk_delete, **reconcile_scene**  
**Extra:** list_territory_summaries, uploads для asset/background

**Достаточно для сохранения настроек маркера/полигона?** **Да.**

- `canvas_objects_update` — partial update любых переданных полей (`canvas.rs:639–744`).
- `canvas_reconcile_scene` — upsert массива с полным `content_json` / `style_json` (`UpsertCanvasObjectInput`, `canvas.rs:304–323`).
- Frontend уже использует reconcile для drag (`MapPage.tsx` → `canvasApi.reconcileScene`).

**10. Update принимает произвольный JSON или фиксированные поля?**

**Произвольный JSON** в рамках typed DTO:
- `transform_json`, `geometry_json`, `style_json`, `content_json` — тип `Value` / `Option<Value>`; repository сериализует as-is (`value_or_empty_object`).
- **Нет** whitelist ключей внутри JSON на уровне repository.
- Ограничения: `kind` должен быть из `CANVAS_OBJECT_KINDS` (`validate_object_kind`, `canvas.rs:1203–1211`); `layer_id`, FK на note/scene — при нарушении FK SQLite ошибка.

---

### E. Мёртвый kind `territory`

**11. Где упоминается `territory` в backend**

| Место | Файл |
|-------|------|
| CHECK constraint kinds | `017_canvas_replacement.sql:36` |
| `CANVAS_OBJECT_KINDS` | `canvas.rs:6` |
| `list_territory_summaries` | `canvas.rs:917` — `WHERE co.kind = 'territory'` |
| Faction↔territory sync | `factions.rs:1606`, `2166`, `2189` |
| Reconciler default colors | `canvasReconciler.ts:194–196` (frontend, не backend) |

**Если UI не создаёт `kind='territory'`:**

- **Ничего не «ломается»** на уровне INSERT/UPDATE — kind `'polygon'` валиден.
- `canvas_objects_list_territory_summaries` вернёт **пустой список** для polygon-only проектов.
- Faction state `territory_ids` sync **не найдёт** polygon-объекты (см. §B.4).
- **Миграция для удаления kind из CHECK не нужна** — достаточно не использовать; kind может остаться в allowlist для legacy rows / постепенного вымирания.

---

### Сводная таблица backend-готовности

| Parity-фича | Backend готов? | Нужна доработка backend? | Что именно |
|-------------|----------------|--------------------------|------------|
| **Маркер-настройки** (title, icon, color, description) | **Да** | **Нет** (schema) | `content_json` + `style_json`; persist через `canvas_objects_update` / `reconcile_scene` |
| **Полигон-настройки** (name, faction, fill, opacity, border, smoothing) | **Да** (storage) | **Да** (интеграции) | Storage в `content_json`/`name` без миграции; SQL в `factions.rs` + `list_territory_summaries` нужно расширить с `territory` → `polygon` |
| **Linked note** | **Да** | **Нет** | Колонка `linked_note_id` FK; `notes_list` / `notes_get` живы |
| **Faction** (список, цвет) | **Да** | **Частично** | `factions_*` живы; привязка polygon→faction в cross-domain queries — см. выше |
| **Вложенные карты** | **Да** (модель + CRUD) | **Нет для greenfield** | `canvas_scene.parent_*` + `linked_scene_id`; frontend orchestration; legacy data из `maps` не мигрируется 017 |
| **Update объекта** | **Да** | **Нет** | `canvas_objects_update`, `canvas_reconcile_scene` — произвольный JSON в DTO |

---

*Frontend parity-аудит: см. разделы выше. Backend parity-аудит добавлен read-only; код не менялся.*
