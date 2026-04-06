export interface OnboardingStep {
  id: string;
  route?: string;
  selector: string;
  title: string;
  description: string;
}

export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'branch-selector',
    route: 'map',
    selector: '[data-tour="branch-selector"]',
    title: 'Активная ветка',
    description: 'Здесь переключается контекст what-if ветвления: основная (каноничная) ветвь или альтернативная.',
  },
  {
    id: 'branch-create',
    route: 'map',
    selector: '[data-tour="branch-create"]',
    title: 'Создание ветки',
    description: 'Создайте альтернативную ветку сценария, чтобы экспериментировать без изменения каноничной версии.',
  },
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
    id: 'sidebar-factions',
    route: 'factions',
    selector: '[data-tour="sidebar-factions"]',
    title: 'Фракции',
    description: 'Организации, ранги, участники и отношения между фракциями вашего мира.',
  },
  {
    id: 'sidebar-notes',
    route: 'notes',
    selector: '[data-tour="sidebar-notes"]',
    title: 'Заметки и вики',
    description: 'Создавайте заметки, связывайте статьи и формируйте лор мира.',
  },
  {
    id: 'sidebar-wiki',
    route: 'wiki',
    selector: '[data-tour="sidebar-wiki"]',
    title: 'Вики',
    description: 'Граф и структура знаний мира: статьи, связи и быстрый переход по лору.',
  },
  {
    id: 'sidebar-timeline',
    route: 'timeline',
    selector: '[data-tour="sidebar-timeline"]',
    title: 'Хронология',
    description: 'Упорядочивайте события по времени, стройте эпохи и историю кампании.',
  },
  {
    id: 'sidebar-dogmas',
    route: 'dogmas',
    selector: '[data-tour="sidebar-dogmas"]',
    title: 'Догмы',
    description: 'Фиксируйте правила мира: магия, космология, политика и другие фундаментальные нормы.',
  },
  {
    id: 'sidebar-dynasties',
    route: 'dynasties',
    selector: '[data-tour="sidebar-dynasties"]',
    title: 'Династии',
    description: 'Семейные линии, ключевые фигуры и важные династические события.',
  },
  {
    id: 'sidebar-settings',
    route: 'settings',
    selector: '[data-tour="sidebar-settings"]',
    title: 'Настройки проекта',
    description: 'Управление параметрами текущей кампании и служебными настройками проекта.',
  },
  {
    id: 'topbar-search',
    route: 'map',
    selector: '[data-tour="topbar-search"]',
    title: 'Глобальный поиск',
    description: 'Быстрый поиск по сущностям проекта (Ctrl+K): персонажи, заметки, события и другие материалы.',
  },
];
