// ==================== Лимиты ====================
export const LIMITS = {
  PROJECT_NAME_MIN: 1,
  PROJECT_NAME_MAX: 200,
  PROJECT_DESCRIPTION_MAX: 5000,
  CHARACTER_NAME_MIN: 1,
  CHARACTER_NAME_MAX: 200,
  CHARACTER_BIO_MAX: 50000,
  NOTE_TITLE_MIN: 1,
  NOTE_TITLE_MAX: 500,
  NOTE_CONTENT_MAX: 500000,
  TAG_NAME_MIN: 1,
  TAG_NAME_MAX: 100,
  MARKER_TITLE_MIN: 1,
  MARKER_TITLE_MAX: 200,
  MARKER_DESCRIPTION_MAX: 10000,
  DOGMA_TITLE_MIN: 1,
  DOGMA_TITLE_MAX: 300,
  DOGMA_DESCRIPTION_MAX: 100000,
  DOGMA_IMPACT_MAX: 50000,
  DOGMA_EXCEPTIONS_MAX: 50000,
  TIMELINE_EVENT_TITLE_MIN: 1,
  TIMELINE_EVENT_TITLE_MAX: 300,
  TIMELINE_EVENT_DESCRIPTION_MAX: 20000,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB для аватаров
  MAX_IMAGE_SIZE: 50 * 1024 * 1024, // 50MB для карт
  MAX_IMPORT_SIZE: 100 * 1024 * 1024, // 100MB для JSON импорта (base64 раздувает)
  MAX_TAGS_PER_ENTITY: 50,
  MAX_CONNECTIONS_PER_CHARACTER: 100,
} as const;

// ==================== Допустимые форматы ====================
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'] as const;
export const ALLOWED_NOTE_FORMATS = ['md', 'txt'] as const;

// ==================== Статусы ====================
export const CHARACTER_STATUSES = ['alive', 'dead', 'unknown', 'missing'] as const;
export const PROJECT_STATUSES = ['active', 'archived'] as const;
export const NOTE_TYPES = ['wiki', 'note', 'marker_note'] as const;

// ==================== Типы связей персонажей ====================
export const RELATIONSHIP_TYPES = [
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

// ==================== Цвета маркеров ====================
export const MARKER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
] as const;

// ==================== Иконки маркеров ====================
export const MARKER_ICONS = [
  'castle', 'city', 'village', 'tavern', 'dungeon',
  'forest', 'mountain', 'river', 'cave', 'temple',
  'ruins', 'port', 'bridge', 'tower', 'camp',
  'battlefield', 'mine', 'farm', 'graveyard', 'custom',
] as const;

// ==================== Догмы ====================
export const DOGMA_CATEGORIES = [
  'cosmology',
  'magic',
  'religion',
  'society',
  'politics',
  'economy',
  'history',
  'nature',
  'races',
  'technology',
  'other',
] as const;

export const DOGMA_IMPORTANCE = [
  'fundamental',
  'major',
  'minor',
] as const;

export const DOGMA_STATUSES = [
  'active',
  'deprecated',
  'hidden',
] as const;

export const DOGMA_CATEGORY_LABELS: Record<string, string> = {
  cosmology: 'Космология и физика мира',
  magic: 'Магия и сверхъестественное',
  religion: 'Религия и метафизика',
  society: 'Общество и уклад жизни',
  politics: 'Политика и законы',
  economy: 'Экономика и ресурсы',
  history: 'Историческая аксиома',
  nature: 'Природа и география',
  races: 'Расы и народы',
  technology: 'Технологии и ремёсла',
  other: 'Другое',
};

export const DOGMA_CATEGORY_ICONS: Record<string, string> = {
  cosmology: '🌌',
  magic: '✨',
  religion: '⛪',
  society: '🏛️',
  politics: '👑',
  economy: '💰',
  history: '📜',
  nature: '🌿',
  races: '🧝',
  technology: '⚙️',
  other: '📋',
};

export const DOGMA_IMPORTANCE_LABELS: Record<string, string> = {
  fundamental: 'Фундаментальная',
  major: 'Важная',
  minor: 'Второстепенная',
};

export const DOGMA_STATUS_LABELS: Record<string, string> = {
  active: 'Активна',
  deprecated: 'Устарела',
  hidden: 'Скрыта',
};

// ==================== Фракции ====================

export const FACTION_KINDS = ['state', 'faction'] as const;

export const FACTION_KIND_LABELS: Record<string, string> = {
  state: 'Государство',
  faction: 'Фракция',
};

export const FACTION_KIND_ICONS: Record<string, string> = {
  state: '🏛️',
  faction: '👥',
};

/** Категории указов (faction_policies), UI: «Указы». */
export const FACTION_DECREE_CATEGORY_LABELS: Record<string, string> = {
  economy: 'Экономика',
  military: 'Военное',
  social: 'Социальное',
  religion: 'Религия',
  foreign: 'Внешняя политика',
  other: 'Прочее',
};

export const STATE_POLITICAL_SCALE_GROUP_LABELS: Record<string, string> = {
  power: 'Власть и устройство',
  society: 'Общество',
  economy: 'Экономика',
  foreign: 'Внешняя политика',
};

export const FACTION_POLITICAL_SCALE_GROUP_LABELS: Record<string, string> = {
  authority: 'Отношение к власти',
  ideology: 'Идеология',
  methods: 'Методы',
  base: 'База',
};

export const FACTION_TYPES = [
  'guild',
  'order',
  'cult',
  'trade_house',
  'company',
  'military',
  'academy',
  'tribe',
  'criminal',
  'other',
] as const;

export const FACTION_TYPE_LABELS: Record<string, string> = {
  guild: 'Гильдия',
  order: 'Орден',
  cult: 'Культ',
  trade_house: 'Торговый дом',
  company: 'Компания',
  military: 'Армия / Военный орден',
  academy: 'Академия / Школа',
  tribe: 'Племя / Клан',
  criminal: 'Преступная организация',
  other: 'Другое',
};

export const FACTION_TYPE_ICONS: Record<string, string> = {
  guild: '⚒️',
  order: '🛡️',
  cult: '🕯️',
  trade_house: '💰',
  company: '🏢',
  military: '⚔️',
  academy: '📚',
  tribe: '🏕️',
  criminal: '🗡️',
  other: '🏴',
};

export const STATE_TYPES = [
  'empire',
  'kingdom',
  'republic',
  'federation',
  'principality',
  'theocracy',
  'city_state',
  'tribal_union',
  'other',
] as const;

export const STATE_TYPE_LABELS: Record<string, string> = {
  empire: 'Империя',
  kingdom: 'Королевство',
  republic: 'Республика',
  federation: 'Федерация',
  principality: 'Княжество',
  theocracy: 'Теократия',
  city_state: 'Город-государство',
  tribal_union: 'Племенной союз',
  other: 'Другое',
};

export const STATE_TYPE_ICONS: Record<string, string> = {
  empire: '👑',
  kingdom: '🏰',
  republic: '🏛️',
  federation: '🗺️',
  principality: '⚜️',
  theocracy: '✝️',
  city_state: '🏙️',
  tribal_union: '🛖',
  other: '🏴',
};

export type MetricKey =
  | 'treasury'
  | 'population'
  | 'army_size'
  | 'navy_size'
  | 'territory_km2'
  | 'annual_income'
  | 'annual_expenses'
  | 'members_count'
  | 'influence';

export interface MetricMeta {
  key: MetricKey;
  label: string;
  unit: string | null;
  min?: number;
  max?: number;
}

export const STATE_METRICS: MetricMeta[] = [
  { key: 'treasury', label: 'Казна', unit: null },
  { key: 'population', label: 'Население', unit: 'чел.' },
  { key: 'army_size', label: 'Армия', unit: 'чел.' },
  { key: 'navy_size', label: 'Флот', unit: 'чел.' },
  { key: 'territory_km2', label: 'Территория', unit: 'кв. км' },
  { key: 'annual_income', label: 'Доход в год', unit: null },
  { key: 'annual_expenses', label: 'Расход в год', unit: null },
];

export const FACTION_METRICS: MetricMeta[] = [
  { key: 'treasury', label: 'Казна', unit: null },
  { key: 'members_count', label: 'Численность', unit: 'чел.' },
  { key: 'influence', label: 'Влияние', unit: null, min: 0, max: 100 },
  { key: 'annual_income', label: 'Доход в год', unit: null },
  { key: 'annual_expenses', label: 'Расход в год', unit: null },
];

export function getMetricsForKind(kind: 'state' | 'faction'): MetricMeta[] {
  return kind === 'state' ? STATE_METRICS : FACTION_METRICS;
}

export const FACTION_STATUSES = [
  'active', 'disbanded', 'secret', 'exiled', 'destroyed',
] as const;

export const FACTION_STATUS_LABELS: Record<string, string> = {
  active: 'Активна',
  disbanded: 'Распущена',
  secret: 'Тайная',
  exiled: 'В изгнании',
  destroyed: 'Уничтожена',
};

export const FACTION_STATUS_ICONS: Record<string, string> = {
  active: '🟢',
  disbanded: '⚫',
  secret: '🔮',
  exiled: '🏃',
  destroyed: '💀',
};

export const FACTION_RELATION_TYPES = [
  'alliance', 'war', 'neutral', 'vassal', 'suzerain',
  'trade', 'rivalry', 'protectorate', 'federation', 'custom',
] as const;

export const FACTION_RELATION_LABELS: Record<string, string> = {
  alliance: 'Союз',
  war: 'Война',
  neutral: 'Нейтралитет',
  vassal: 'Вассал',
  suzerain: 'Сюзерен',
  trade: 'Торговля',
  rivalry: 'Соперничество',
  protectorate: 'Протекторат',
  federation: 'Федерация',
  custom: 'Другое',
};

export const FACTION_RELATION_COLORS: Record<string, string> = {
  alliance: 'rgba(78,205,196,0.7)',
  war: 'rgba(255,107,107,0.7)',
  neutral: 'rgba(180,180,180,0.5)',
  vassal: 'rgba(187,143,206,0.7)',
  suzerain: 'rgba(201,169,89,0.7)',
  trade: 'rgba(130,225,170,0.7)',
  rivalry: 'rgba(255,200,100,0.7)',
  protectorate: 'rgba(69,183,209,0.7)',
  federation: 'rgba(130,130,255,0.7)',
  custom: 'rgba(180,180,180,0.5)',
};

// ==================== Династии ====================

export const DYNASTY_STATUSES = [
  'active', 'extinct', 'exiled', 'declining', 'rising',
] as const;

export const DYNASTY_STATUS_LABELS: Record<string, string> = {
  active: 'Правящая',
  extinct: 'Угасшая',
  exiled: 'В изгнании',
  declining: 'В упадке',
  rising: 'Восходящая',
};

export const DYNASTY_STATUS_ICONS: Record<string, string> = {
  active: '👑',
  extinct: '💀',
  exiled: '🏃',
  declining: '📉',
  rising: '📈',
};

export const DYNASTY_FAMILY_RELATION_TYPES = [
  'parent', 'child', 'spouse', 'sibling',
] as const;

export const DYNASTY_FAMILY_RELATION_LABELS: Record<string, string> = {
  parent: 'Родитель',
  child: 'Ребёнок',
  spouse: 'Супруг(а)',
  sibling: 'Брат/Сестра',
};

export const DYNASTY_EVENT_IMPORTANCE = [
  'critical', 'major', 'normal', 'minor',
] as const;

export const DYNASTY_EVENT_IMPORTANCE_LABELS: Record<string, string> = {
  critical: 'Переломный момент',
  major: 'Важное',
  normal: 'Обычное',
  minor: 'Незначительное',
};

export const DYNASTY_EVENT_IMPORTANCE_COLORS: Record<string, string> = {
  critical: '#FF6B6B',
  major: '#F7DC6F',
  normal: '#82E0AA',
  minor: '#85C1E9',
};

/** Graph type id for the project (multi-entity) graph layout storage. */
export const PROJECT_GRAPH_LAYOUT_TYPE = 'project-graph' as const;