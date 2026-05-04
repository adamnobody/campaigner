export interface OnboardingStep {
  id: string;
  route?: string;
  selector: string;
}

export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'branch-selector',
    route: 'map',
    selector: '[data-tour="branch-selector"]',
  },
  {
    id: 'branch-create',
    route: 'map',
    selector: '[data-tour="branch-create"]',
  },
  {
    id: 'map-tools',
    route: 'map',
    selector: '[data-tour="map-toolbar"]',
  },
  {
    id: 'map-upload',
    route: 'map',
    selector: '[data-tour="map-upload"]',
  },
  {
    id: 'sidebar-characters',
    route: 'characters',
    selector: '[data-tour="sidebar-characters"]',
  },
  {
    id: 'sidebar-states',
    route: 'states',
    selector: '[data-tour="sidebar-states"]',
  },
  {
    id: 'sidebar-factions',
    route: 'factions',
    selector: '[data-tour="sidebar-factions"]',
  },
  {
    id: 'sidebar-notes',
    route: 'notes',
    selector: '[data-tour="sidebar-notes"]',
  },
  {
    id: 'sidebar-wiki',
    route: 'wiki',
    selector: '[data-tour="sidebar-wiki"]',
  },
  {
    id: 'sidebar-timeline',
    route: 'timeline',
    selector: '[data-tour="sidebar-timeline"]',
  },
  {
    id: 'sidebar-dogmas',
    route: 'dogmas',
    selector: '[data-tour="sidebar-dogmas"]',
  },
  {
    id: 'sidebar-dynasties',
    route: 'dynasties',
    selector: '[data-tour="sidebar-dynasties"]',
  },
  {
    id: 'sidebar-settings',
    route: 'settings',
    selector: '[data-tour="sidebar-settings"]',
  },
  {
    id: 'topbar-search',
    route: 'map',
    selector: '[data-tour="topbar-search"]',
  },
];
