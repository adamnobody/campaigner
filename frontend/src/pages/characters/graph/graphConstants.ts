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

/** Keys aligned with `characters.json` → `relationshipTypes` and API `relationshipType`. */
export const RELATIONSHIP_TYPE_KEYS = [
  'ally',
  'enemy',
  'family',
  'friend',
  'rival',
  'mentor',
  'student',
  'lover',
  'spouse',
  'employer',
  'employee',
  'custom',
] as const;

export type RelationshipTypeKey = (typeof RELATIONSHIP_TYPE_KEYS)[number];

export const REL_COLORS: Record<string, string> = {
  ally: '#4ECDC4', enemy: '#FF6B6B', family: '#BB8FCE',
  friend: '#82E0AA', rival: '#F8C471', mentor: '#45B7D1',
  student: '#85C1E9', lover: '#FF82AB', spouse: '#FF82AB',
  employer: '#96CEB4', employee: '#98D8C8', custom: '#8282FF',
};

export const R = 24;
export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 5;
