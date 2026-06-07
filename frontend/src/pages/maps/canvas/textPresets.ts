export type MapTextStylePreset = {
  id: string;
  name: string;
  fontSize: number;
  fill: string;
  opacity: number;
};

export const STANDARD_TEXT_PRESET_ID = '__standard__';

export const STANDARD_TEXT_PRESET_STYLE = {
  fontSize: 28,
  fill: '#f8d7a4',
  opacity: 1,
} as const;

export const buildStandardTextPreset = (name: string): MapTextStylePreset => ({
  id: STANDARD_TEXT_PRESET_ID,
  name,
  ...STANDARD_TEXT_PRESET_STYLE,
});

export const isUserTextPreset = (presetId: string | null): boolean => (
  Boolean(presetId && presetId !== STANDARD_TEXT_PRESET_ID)
);

export const listTextPresetsWithStandard = (
  userPresets: MapTextStylePreset[],
  standardName: string,
): MapTextStylePreset[] => [
  buildStandardTextPreset(standardName),
  ...userPresets.filter((preset) => preset.id !== STANDARD_TEXT_PRESET_ID),
];

const PRESETS_STORAGE_KEY = 'campaigner.mapTextPresets.v1';
const ACTIVE_PRESET_STORAGE_KEY = 'campaigner.mapTextActivePreset.v1';

type PresetsByProject = Record<string, MapTextStylePreset[]>;
type ActivePresetByProject = Record<string, string | null>;

const readJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown): void => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

export const loadTextPresets = (projectId: number): MapTextStylePreset[] => {
  const all = readJson<PresetsByProject>(PRESETS_STORAGE_KEY, {});
  const presets = all[String(projectId)];
  return Array.isArray(presets) ? presets : [];
};

export const saveTextPresets = (projectId: number, presets: MapTextStylePreset[]): void => {
  const all = readJson<PresetsByProject>(PRESETS_STORAGE_KEY, {});
  all[String(projectId)] = presets;
  writeJson(PRESETS_STORAGE_KEY, all);
};

export const loadActiveTextPresetId = (projectId: number): string | null => {
  const all = readJson<ActivePresetByProject>(ACTIVE_PRESET_STORAGE_KEY, {});
  const value = all[String(projectId)];
  return typeof value === 'string' ? value : null;
};

export const saveActiveTextPresetId = (projectId: number, presetId: string | null): void => {
  const all = readJson<ActivePresetByProject>(ACTIVE_PRESET_STORAGE_KEY, {});
  all[String(projectId)] = presetId;
  writeJson(ACTIVE_PRESET_STORAGE_KEY, all);
};

export const findTextPreset = (
  presets: MapTextStylePreset[],
  presetId: string | null,
  standardPreset?: MapTextStylePreset,
): MapTextStylePreset | null => {
  const resolvedId = presetId ?? STANDARD_TEXT_PRESET_ID;
  if (resolvedId === STANDARD_TEXT_PRESET_ID) return standardPreset ?? buildStandardTextPreset('Text');
  return presets.find((preset) => preset.id === resolvedId) ?? null;
};

export const resolveTextPresetStyleForCreate = (
  userPresets: MapTextStylePreset[],
  activePresetId: string | null,
): Pick<MapTextStylePreset, 'fontSize' | 'fill' | 'opacity'> => {
  const resolvedId = activePresetId ?? STANDARD_TEXT_PRESET_ID;
  if (resolvedId === STANDARD_TEXT_PRESET_ID) return STANDARD_TEXT_PRESET_STYLE;
  const preset = userPresets.find((item) => item.id === resolvedId);
  if (!preset) return STANDARD_TEXT_PRESET_STYLE;
  return {
    fontSize: preset.fontSize,
    fill: preset.fill,
    opacity: preset.opacity,
  };
};

export const normalizePresetColor = (value: string): string => {
  const trimmed = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(trimmed)) return trimmed;
  if (/^#[0-9a-f]{3}$/.test(trimmed)) {
    const [r, g, b] = trimmed.slice(1);
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return trimmed;
};

export const textStyleMatchesPreset = (
  style: Pick<MapTextStylePreset, 'fontSize' | 'fill' | 'opacity'>,
  preset: MapTextStylePreset,
): boolean => (
  style.fontSize === preset.fontSize
  && normalizePresetColor(style.fill) === normalizePresetColor(preset.fill)
  && Math.abs(style.opacity - preset.opacity) < 0.001
);

export const matchTextStylePreset = (
  presets: MapTextStylePreset[],
  style: Pick<MapTextStylePreset, 'fontSize' | 'fill' | 'opacity'>,
  standardPreset?: MapTextStylePreset,
): MapTextStylePreset | null => {
  const standard = standardPreset ?? buildStandardTextPreset('Text');
  if (textStyleMatchesPreset(style, standard)) return standard;
  return presets.find((preset) => textStyleMatchesPreset(style, preset)) ?? null;
};

export const createTextPresetId = (): string =>
  `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const upsertTextPreset = (
  presets: MapTextStylePreset[],
  preset: MapTextStylePreset,
): MapTextStylePreset[] => {
  const index = presets.findIndex((item) => item.id === preset.id);
  if (index < 0) return [...presets, preset];
  const next = [...presets];
  next[index] = preset;
  return next;
};

export const removeTextPreset = (
  presets: MapTextStylePreset[],
  presetId: string,
): MapTextStylePreset[] => presets.filter((preset) => preset.id !== presetId);
