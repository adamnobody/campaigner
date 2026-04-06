export interface OnboardingStep {
  id: string;
  route?: string;
  selector: string;
  title: string;
  description: string;
}

export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'map-tools',
    route: 'map',
    selector: '[data-tour="map-toolbar"]',
    title: 'Панель карты',
    description: 'Здесь находятся режимы работы с картой, масштаб и основные действия.',
  },
  {
    id: 'map-upload',
    route: 'map',
    selector: '[data-tour="map-upload"]',
    title: 'Загрузка карты',
    description: 'Загрузите изображение, чтобы начать расставлять маркеры и территории.',
  },
  {
    id: 'sidebar-characters',
    route: 'characters',
    selector: '[data-tour="sidebar-characters"]',
    title: 'Персонажи',
    description: 'Раздел для героев, связей и карточек персонажей.',
  },
  {
    id: 'sidebar-notes',
    route: 'notes',
    selector: '[data-tour="sidebar-notes"]',
    title: 'Заметки и вики',
    description: 'Создавайте заметки, связывайте статьи и формируйте лор мира.',
  },
];
