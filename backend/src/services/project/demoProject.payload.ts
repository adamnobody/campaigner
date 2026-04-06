import type { ImportedProjectPayload } from '@campaigner/shared';

export const demoProjectPayload: ImportedProjectPayload = {
  version: '1.0',
  project: {
    name: 'Обучающая кампания',
    description: 'Интерактивное обучение базовым механикам Campaigner',
    status: 'active',
  },
  notes: [
    {
      id: 1,
      folderId: null,
      title: 'Добро пожаловать',
      content: 'Это обучающая кампания. Пройдите шаги, чтобы освоить карты, заметки и связи.',
      format: 'md',
      noteType: 'wiki',
      isPinned: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  timelineEvents: [
    {
      id: 1,
      title: 'Начало обучения',
      description: 'Первый шаг в Campaigner',
      eventDate: '0001-01-01',
      sortOrder: 0,
      era: 'Tutorial',
      linkedNoteId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};
