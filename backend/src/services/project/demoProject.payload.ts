import type { ImportedProjectPayload } from '@campaigner/shared';

export type DemoProjectLocale = 'en' | 'ru';

/** Matches `projects:defaultMainBranchName` in frontend locales. */
export function mainBranchLabelForLocale(locale: DemoProjectLocale): string {
  return locale === 'ru' ? 'Каноничная ветвь' : 'Canonical branch';
}

const now = () => new Date().toISOString();

export function getDemoProjectPayload(locale: DemoProjectLocale): ImportedProjectPayload {
  const isRu = locale === 'ru';

  return {
    version: '1.0',
    project: {
      name: isRu ? 'Обучающая кампания' : 'Tutorial campaign',
      description: isRu
        ? 'Интерактивное обучение базовым механикам Campaigner'
        : 'Hands-on introduction to Campaigner: maps, notes, wiki, and timeline.',
      status: 'active',
    },
    notes: [
      {
        id: 1,
        folderId: null,
        title: isRu ? 'Добро пожаловать' : 'Welcome',
        content: isRu
          ? 'Это обучающая кампания. Пройдите шаги, чтобы освоить карты, заметки, вики и таймлайн.'
          : 'This is a tutorial project. Follow the tour to learn maps, notes, wiki pages, and the timeline.',
        format: 'md',
        noteType: 'wiki',
        isPinned: true,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: 2,
        folderId: null,
        title: isRu ? 'Краткие подсказки' : 'Quick tips',
        content: isRu
          ? 'Откройте карту, создайте маркеры и привяжите к ним заметки. События таймлайна можно связать со страницами вики — так проще держать хронологию и лор в одном месте.'
          : 'Open the map, add markers, and link them to notes. Timeline events can link to wiki pages so chronology and lore stay connected.',
        format: 'md',
        noteType: 'note',
        isPinned: false,
        createdAt: now(),
        updatedAt: now(),
      },
    ],
    timelineEvents: [
      {
        id: 1,
        title: isRu ? 'Начало обучения' : 'Start of tutorial',
        description: isRu ? 'Первый шаг в Campaigner' : 'Your first step in Campaigner',
        eventDate: '0001-01-01',
        sortOrder: 0,
        era: isRu ? 'Обучение' : 'Tutorial',
        linkedNoteId: 1,
        createdAt: now(),
        updatedAt: now(),
      },
    ],
  };
}

/** @deprecated Prefer {@link getDemoProjectPayload} with an explicit locale. Russian content (legacy default). */
export const demoProjectPayload = getDemoProjectPayload('ru');
