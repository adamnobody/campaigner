export interface GNode {
  id: number;
  name: string;
  title: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface GEdge {
  source: number;
  target: number;
  type: string;
  description: string;
}

export const REL_LABELS: Record<string, string> = {
  ally: 'Союзник', enemy: 'Враг', family: 'Семья', friend: 'Друг',
  rival: 'Соперник', mentor: 'Наставник', student: 'Ученик',
  lover: 'Возлюбленный', spouse: 'Супруг', employer: 'Работодатель',
  employee: 'Работник', custom: 'Другое',
};

export const REL_COLORS: Record<string, string> = {
  ally: '#4ECDC4', enemy: '#FF6B6B', family: '#BB8FCE',
  friend: '#82E0AA', rival: '#F8C471', mentor: '#45B7D1',
  student: '#85C1E9', lover: '#FF82AB', spouse: '#FF82AB',
  employer: '#96CEB4', employee: '#98D8C8', custom: '#8282FF',
};

export const R = 24;
export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 5;
