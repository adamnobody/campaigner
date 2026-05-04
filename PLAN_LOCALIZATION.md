План локализации проекта
Общие правила для агента
Главные ограничения
Не переписывать архитектуру приложения сверх необходимости.
Не переводить пользовательские данные:
названия персонажей;
названия государств;
названия фракций;
пользовательские описания;
данные проектов.
Переводить только UI:
кнопки;
заголовки;
меню;
placeholder;
empty/loading/error states;
toast/snackbar;
validation messages;
labels в формах;
tab names;
dialog titles.
Не делать машинный перевод в коде через условия вида:
tsx

{language === "ru" ? "Создать" : "Create"}
Использовать i18n-ключи.
Английский язык должен быть fallback.
Русский язык должен включаться автоматически, если системная локаль русская.
Для всех остальных системных языков по умолчанию должен быть английский.
Если пользователь вручную выбрал язык, системная локаль больше не должна переопределять выбор.
После каждого этапа должны проходить:
bash

npx tsc --noEmit -p frontend/tsconfig.json
npm run build:frontend
git diff --check
Если есть desktop build script, после этапа интеграции с Electron дополнительно:

bash

npm run build:desktop
или актуальная команда из package.json.

Этап 1 — Аудит текущих строк и выбор i18n-архитектуры
Цель
Понять, где в проекте находятся пользовательские строки, какие библиотеки уже есть, и подготовить минимальный план внедрения без массового хаоса.

Действия агента
Проверить зависимости:
bash

cat frontend/package.json
cat package.json
Проверить, есть ли уже i18n-библиотеки:
bash

grep -R "i18n\|i18next\|react-i18next" -n frontend/src frontend/package.json package.json
Найти основные hardcoded UI-строки в frontend/src.
Примерные команды:

bash

grep -R "\"[А-Яа-яЁё][^\"]*\"" -n frontend/src --include="*.tsx" --include="*.ts"
grep -R "'[А-Яа-яЁё][^']*'" -n frontend/src --include="*.tsx" --include="*.ts"
Составить список основных зон перевода:
project/home page;
app shell/navigation;
characters;
factions;
states;
dynasties;
map;
graph;
policies;
ambitions;
common dialogs;
common buttons;
errors/loading/empty states.
Результат этапа
Агент должен вывести краткий отчёт:

text

Найдены/не найдены существующие i18n-зависимости.
Основные зоны с русскими UI-строками:
- ...
Рекомендованная структура словарей:
- ...
Коммит
На этом этапе коммит не обязателен, если код не менялся.

Этап 2 — Установка и базовая интеграция i18n
Цель
Добавить инфраструктуру локализации без массового перевода всех экранов.

Рекомендуемая библиотека
Использовать:

text

i18next
react-i18next
Если зависимостей ещё нет, установить:

bash

cd frontend
npm install i18next react-i18next
Структура файлов
Создать:

text

frontend/src/i18n/
  index.ts
  types.ts
  language.ts
  locales/
    en/
      common.json
    ru/
      common.json
На первом этапе можно начать с common.json, но желательно сразу предусмотреть расширение по доменам:

text

frontend/src/i18n/locales/en/
  common.json
  navigation.json
  projects.json
  characters.json
  factions.json
  states.json
  dynasties.json
  map.json
  graph.json
  ambitions.json
  policies.json

frontend/src/i18n/locales/ru/
  common.json
  navigation.json
  projects.json
  characters.json
  factions.json
  states.json
  dynasties.json
  map.json
  graph.json
  ambitions.json
  policies.json
Если проект большой, лучше сразу использовать domain-based JSON-файлы.

Базовые namespace
Рекомендованные namespaces:

text

common
navigation
projects
characters
factions
states
dynasties
map
graph
ambitions
policies
settings
errors
Тип языка
Создать тип:

typescript

export type AppLanguage = "en" | "ru";
Логика определения языка
Правило:

text

1. Если есть сохранённый язык — использовать его.
2. Если сохранённого языка нет:
   - если системная локаль начинается с ru — использовать ru;
   - иначе использовать en.
В минимальном варианте можно использовать navigator.language.

Позже, если Electron API уже аккуратно настроен, можно заменить/дополнить через app.getLocale().

Хранение выбора
Для первого этапа допустимо использовать:

text

localStorage
Ключ:

text

app.language
Допустимые значения:

text

en
ru
DoD этапа
text

- i18next и react-i18next подключены.
- Приложение обёрнуто в i18n provider/инициализацию.
- Есть ru/en словари.
- Работает fallback на en.
- Язык выбирается автоматически при первом запуске.
- Сохранённый язык имеет приоритет над системным.
- tsc OK.
- build:frontend OK.
- git diff --check OK.
Коммит
text

feat(i18n): add localization infrastructure
Этап 3 — Переключатель языка
Цель
Добавить пользователю явный контроль языка.

Где разместить
Минимально для v0.2.0:

На главной странице проектов / стартовом экране.
Если есть общий header/app shell — добавить туда тоже или предусмотреть компонент.
Рекомендуемый компонент:

text

frontend/src/components/LanguageSwitcher.tsx
или если есть shared/common components:

text

frontend/src/shared/components/LanguageSwitcher.tsx
Поведение
Переключатель должен:

показывать текущий язык;
позволять выбрать Русский / English;
немедленно менять язык интерфейса;
сохранять выбор в localStorage;
не требовать перезапуска приложения.
Варианты UI
Минимальный:

text

Language: English / Русский
Лучше:

text

🌐 English
🌐 Русский
или select:

text

[ English ▼ ]
DoD этапа
text

- На стартовой/главной странице есть переключатель языка.
- Выбор языка сохраняется.
- После перезапуска выбранный язык сохраняется.
- UI меняет язык без перезагрузки.
- tsc OK.
- build:frontend OK.
- git diff --check OK.
Коммит
text

feat(i18n): add language switcher
Этап 4 — Перевод common UI и навигации
Цель
Перевести базовую оболочку приложения и самые частые строки.

Что переводить первым
Common
Ключи вроде:

text

common.create
common.edit
common.save
common.delete
common.cancel
common.close
common.confirm
common.back
common.next
common.search
common.loading
common.error
common.empty
common.notFound
common.yes
common.no
common.add
common.remove
common.name
common.description
common.type
common.status
common.actions
common.unknown
common.none
Navigation
text

navigation.projects
navigation.characters
navigation.factions
navigation.states
navigation.dynasties
navigation.map
navigation.graph
navigation.ambitions
navigation.policies
navigation.settings
Dialogs
text

common.confirmDeleteTitle
common.confirmDeleteMessage
common.unsavedChanges
common.deleteWarning
Правила именования ключей
Использовать стабильные semantic keys, а не текстовые ключи.

Хорошо:

text

common.save
factions.detail.title
states.policies.empty
Плохо:

text

"Сохранить"
"Создать новую фракцию"
DoD этапа
text

- Базовые кнопки и действия используют t().
- Основная навигация переведена.
- Главная страница проектов переведена.
- Общие loading/error/empty состояния переведены.
- Русский UI визуально не деградировал.
- Английский UI понятен.
- tsc OK.
- build:frontend OK.
- git diff --check OK.
Коммит
text

feat(i18n): localize common UI and navigation
Этап 5 — Перевод домена проектов и desktop-оболочки
Цель
Перевести всё, что пользователь видит до открытия проекта и вокруг desktop-режима.

Scope
Перевести:

список проектов;
создание проекта;
открытие проекта;
удаление проекта;
ошибки загрузки проекта;
пустое состояние;
desktop-specific labels, если есть;
about/version labels, если есть;
путь к данным, если отображается;
кнопки импорта/экспорта, если есть.
Примеры ключей
text

projects.title
projects.create
projects.open
projects.delete
projects.emptyTitle
projects.emptyDescription
projects.createDialog.title
projects.createDialog.nameLabel
projects.createDialog.namePlaceholder
projects.errors.loadFailed
projects.errors.createFailed
projects.errors.deleteFailed
DoD этапа
text

- Стартовый путь пользователя полностью локализован.
- Пользователь может запустить приложение на английской системе и увидеть английский стартовый UI.
- Переключение на русский восстанавливает прежний понятный русский UI.
- tsc OK.
- build:frontend OK.
- git diff --check OK.
Коммит
text

feat(i18n): localize project home flow
Этап 6 — Перевод основных сущностей
Цель
Перевести основные разделы проекта.

Разбить на подэтапы
Чтобы не получить огромный дифф, лучше делать отдельными PR/коммитами.

Этап 6.1 — Characters
Scope:

список персонажей;
карточка персонажа;
форма создания/редактирования;
traits;
relationships, если есть;
loading/error/empty states;
validation.
Коммит:

text

feat(i18n): localize character UI
Этап 6.2 — Factions and States
Scope:

фракции;
государства;
разделение factions/states;
политики государств;
амбиции, если часть UI уже рядом;
формы;
tabs;
dialogs;
empty/error states.
Коммит:

text

feat(i18n): localize factions and states UI
Этап 6.3 — Dynasties
Scope:

список династий;
детали;
форма;
связи с персонажами;
empty/error states.
Коммит:

text

feat(i18n): localize dynasty UI
Этап 6.4 — Map
Scope:

карта;
инструменты рисования;
границы;
labels;
подсказки;
ошибки сохранения/загрузки;
действия редактирования.
Коммит:

text

feat(i18n): localize map UI
Этап 6.5 — Graph
Scope:

общий граф сущностей;
фильтры;
empty states;
graph controls;
relationship labels в UI;
ошибки загрузки графа.
Коммит:

text

feat(i18n): localize entity graph UI
Этап 6.6 — Ambitions and Policies
Scope:

политики государств;
амбиции;
карточки амбиций;
формы;
статусы;
empty/error states.
Коммит:

text

feat(i18n): localize ambitions and policies UI
Общий DoD для этапа 6
text

- Основные разделы приложения используют i18n-ключи.
- Русский и английский интерфейс покрывают основные сценарии.
- Не осталось массового русского hardcode в ключевых .tsx.
- tsc OK.
- build:frontend OK.
- git diff --check OK.
Этап 7 — Electron locale integration
Цель
Если в проекте уже есть Electron preload/main структура, аккуратно получать системную локаль через Electron.

Предпочтительное поведение
Frontend должен иметь возможность получить locale из Electron, но не должен падать в browser/dev mode.

Логика:

text

1. Если доступен Electron locale API — использовать его.
2. Иначе использовать navigator.language.
3. Если ничего нет — fallback en.
Main process
Добавить IPC handler в Electron main process:

javascript

ipcMain.handle("app:get-locale", () => {
  return app.getLocale();
});
Preload
Экспортировать безопасный API:

javascript

contextBridge.exposeInMainWorld("appLocale", {
  getLocale: () => ipcRenderer.invoke("app:get-locale"),
});
Frontend
Использовать API опционально:

typescript

window.appLocale?.getLocale?.()
Важно: типизировать window.appLocale, чтобы TypeScript не ругался.

DoD этапа
text

- В desktop production locale берётся через Electron app.getLocale().
- В dev/browser режиме работает fallback через navigator.language.
- Приложение не падает, если Electron API недоступен.
- Выбор пользователя всё равно имеет приоритет.
- tsc OK.
- build:frontend OK.
- desktop build OK, если скрипт существует.
- git diff --check OK.
Коммит
text

feat(electron): detect system locale for i18n
Этап 8 — Аудит оставшихся hardcoded UI-строк
Цель
Найти оставшиеся русские строки в UI и решить, что с ними делать.

Команды
bash

grep -R "\"[А-Яа-яЁё][^\"]*\"" -n frontend/src --include="*.tsx" --include="*.ts"
grep -R "'[А-Яа-яЁё][^']*'" -n frontend/src --include="*.tsx" --include="*.ts"
grep -R ">[А-Яа-яЁё][^<]*<" -n frontend/src --include="*.tsx"
Что не обязательно переводить
Можно оставить, если это:

тестовые данные;
enum values, которые не показываются напрямую;
комментарии;
dev-only сообщения;
пользовательский seed content, если он не часть UI;
строки внутри уже русских locale JSON.
Что обязательно перевести
всё, что видно пользователю;
ошибки;
labels;
placeholders;
dialogs;
tabs;
tooltips;
empty states.
Результат
Агент должен сделать отчёт:

text

Оставшиеся русские строки:
- допустимые:
  - ...
- требующие перевода:
  - ...
После этого перевести оставшиеся важные строки.

DoD этапа
text

- В ключевых UI-компонентах нет русских hardcoded строк вне locale-файлов.
- Остаточные строки объяснены.
- tsc OK.
- build:frontend OK.
- git diff --check OK.
Коммит
text

refactor(i18n): replace remaining hardcoded UI strings
Этап 9 — Проверка английского UX
Цель
Проверить, что английский интерфейс не просто “переведён”, а реально читаем.

Что проверить вручную
Первый запуск на не-русской локали
Ожидается:

text

English UI
Первый запуск на русской локали
Ожидается:

text

Русский UI
Ручной выбор
Ожидается:

text

Пользователь выбрал English -> после перезапуска English.
Пользователь выбрал Русский -> после перезапуска Русский.
Основной smoke
Проверить на обоих языках:

text

1. Открыть стартовый экран.
2. Создать проект.
3. Открыть проект.
4. Создать персонажа.
5. Создать государство.
6. Создать фракцию.
7. Открыть карту.
8. Открыть граф.
9. Открыть политики.
10. Открыть амбиции.
11. Закрыть приложение.
12. Открыть снова.
DoD этапа
text

- Основной smoke проходит на ru.
- Основной smoke проходит на en.
- Переключение языка не ломает состояние проекта.
- Нет видимых ключей вида common.save вместо текста.
- Нет критичных layout-проблем из-за длинных английских строк.
- tsc OK.
- build:frontend OK.
- desktop build OK.
- git diff --check OK.
Коммит
Если были правки:

text

fix(i18n): polish English localization
Если правок не было — коммит не нужен.

Этап 10 — Документация локализации
Цель
Оставить понятную инструкцию, как добавлять новые строки после v0.2.0.

Где документировать
Варианты:

text

docs/I18N.md
или раздел в существующем README.

Что описать
markdown

# Localization

Supported languages:

- English: `en`
- Russian: `ru`

Default behavior:

- Russian system locale -> Russian UI.
- Any other system locale -> English UI.
- User-selected language overrides system locale.

Adding a new translation:

1. Add semantic key to the relevant namespace.
2. Add value in `en`.
3. Add value in `ru`.
4. Use `useTranslation(namespace)` in component.
5. Do not hardcode visible UI strings in TSX.

Fallback language:

- English.
DoD этапа
text

- Документация добавлена.
- Новому разработчику понятно, куда добавлять ключи.
- tsc OK.
- build:frontend OK.
- git diff --check OK.
Коммит
text

docs(i18n): document localization workflow
Финальный Definition of Done для всей локализации
Локализация считается завершённой для v0.2.0, если:

text

- Поддерживаются языки en и ru.
- Английский является fallback.
- При первом запуске:
  - ru system locale -> ru;
  - any other locale -> en.
- Ручной выбор языка доступен на главной странице/стартовом экране.
- Ручной выбор сохраняется между запусками.
- Основной UI переведён.
- Пользовательские данные не переводятся и не изменяются.
- В ключевых .tsx/.ts файлах нет массового hardcoded русского UI.
- Основной smoke проходит на ru.
- Основной smoke проходит на en.
- TypeScript check проходит.
- Frontend build проходит.
- Desktop build не сломан.
- git diff --check проходит.
- Добавлена краткая документация по i18n.
Рекомендуемый порядок коммитов
text

feat(i18n): add localization infrastructure
feat(i18n): add language switcher
feat(i18n): localize common UI and navigation
feat(i18n): localize project home flow
feat(i18n): localize character UI
feat(i18n): localize factions and states UI
feat(i18n): localize dynasty UI
feat(i18n): localize map UI
feat(i18n): localize entity graph UI
feat(i18n): localize ambitions and policies UI
feat(electron): detect system locale for i18n
refactor(i18n): replace remaining hardcoded UI strings
fix(i18n): polish English localization
docs(i18n): document localization workflow
Если диффы будут маленькие, некоторые коммиты можно объединить. Но не стоит делать один гигантский коммит на весь перевод.