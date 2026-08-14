import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createDebouncedStateStorage } from './debouncedStorage';
import {
  INTERFACE_STYLE_PROFILES,
  getRecommendedPaletteForStyle,
  type InterfaceStyleId,
} from '@/theme/interfaceStyles';
import { clampReadingFontSize } from '@/theme/appearanceTokens';

export type ThemePreset = string;

export type BackgroundTone = 'ink' | 'graphite' | 'warm' | 'blue';
export type AccentGlow = 'none' | 'soft' | 'strong';
export type FontMode = 'serif' | 'sans' | 'custom';
export type UiDensity = 'compact' | 'comfortable' | 'spacious';
export type MotionMode = 'full' | 'reduced';
export type ReadingLineHeight = 'tight' | 'normal' | 'loose';
export type ReadingColumnWidth = 620 | 760 | 900;
export type InterfaceStyle = InterfaceStyleId;

export interface CustomThemeSnapshot {
  interfaceStyle: InterfaceStyle;
  themePreset: ThemePreset;
  backgroundTone: BackgroundTone;
  accentGlow: AccentGlow;
  fontMode: FontMode;
  fontPresetId: string;
  uiDensity: UiDensity;
  motionMode: MotionMode;
  readingFontSize: number;
  readingLineHeight: ReadingLineHeight;
  readingColumnWidth: ReadingColumnWidth;
}

export interface SavedCustomTheme {
  id: string;
  name: string;
  createdAt: string;
  settings: CustomThemeSnapshot;
}

export interface CustomColorThemePreset {
  id: ThemePreset;
  label: string;
  background: string;
  backgroundAccent: string;
  panelBaseRgb: string;
  borderRgb: string;
  textPrimary: string;
  textSecondary: string;
  muted: string;
  accentMain: string;
  accentSoft: string;
  accentStrong: string;
  success: string;
  warning: string;
  error: string;
}

export interface PreferencesState {
  interfaceStyle: InterfaceStyle;
  themePreset: ThemePreset;
  backgroundTone: BackgroundTone;
  accentGlow: AccentGlow;
  fontMode: FontMode;
  fontPresetId: string;
  uiDensity: UiDensity;
  motionMode: MotionMode;
  readingFontSize: number;
  readingLineHeight: ReadingLineHeight;
  readingColumnWidth: ReadingColumnWidth;
  customThemes: SavedCustomTheme[];
  customColorThemes: CustomColorThemePreset[];
  selectedCustomThemeId: string | null;

  setInterfaceStyle: (value: InterfaceStyle) => void;
  setThemePreset: (value: ThemePreset) => void;
  setBackgroundTone: (value: BackgroundTone) => void;
  setAccentGlow: (value: AccentGlow) => void;
  setFontMode: (value: FontMode) => void;
  setFontPresetId: (value: string) => void;
  setUiDensity: (value: UiDensity) => void;
  setMotionMode: (value: MotionMode) => void;
  setReadingFontSize: (value: number) => void;
  setReadingLineHeight: (value: ReadingLineHeight) => void;
  setReadingColumnWidth: (value: ReadingColumnWidth) => void;
  applyInterfaceStyle: (value: InterfaceStyle) => void;
  applyAppearanceSnapshot: (value: unknown) => void;
  saveCurrentAsCustomTheme: (name: string, settings?: unknown) => void;
  applyCustomTheme: (id: string) => void;
  deleteCustomTheme: (id: string) => void;
  addCustomColorTheme: (theme: CustomColorThemePreset, activate?: boolean) => void;
  deleteCustomColorTheme: (id: ThemePreset) => void;

  resetAppearance: () => void;
}

type PersistedPreferences = CustomThemeSnapshot & Pick<
  PreferencesState,
  'customThemes' | 'customColorThemes' | 'selectedCustomThemeId'
>;

const DEFAULT_SNAPSHOT: CustomThemeSnapshot = {
  interfaceStyle: 'dark-fantasy' as InterfaceStyle,
  themePreset: 'obsidian-gold' as ThemePreset,
  backgroundTone: 'ink',
  accentGlow: 'soft',
  fontMode: 'serif' as FontMode,
  fontPresetId: 'lore-serif',
  uiDensity: 'comfortable' as UiDensity,
  motionMode: 'full' as MotionMode,
  readingFontSize: 20,
  readingLineHeight: 'normal',
  readingColumnWidth: 760,
};

const defaultPreferences: PersistedPreferences = {
  ...DEFAULT_SNAPSHOT,
  customThemes: [] as SavedCustomTheme[],
  customColorThemes: [] as CustomColorThemePreset[],
  selectedCustomThemeId: null as string | null,
};

const pickSnapshot = (state: PreferencesState): CustomThemeSnapshot => ({
  interfaceStyle: state.interfaceStyle,
  themePreset: state.themePreset,
  backgroundTone: state.backgroundTone,
  accentGlow: state.accentGlow,
  fontMode: state.fontMode,
  fontPresetId: state.fontPresetId,
  uiDensity: state.uiDensity,
  motionMode: state.motionMode,
  readingFontSize: state.readingFontSize,
  readingLineHeight: state.readingLineHeight,
  readingColumnWidth: state.readingColumnWidth,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const oneOf = <T extends string | number>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T => allowed.includes(value as T) ? value as T : fallback;

const nonEmptyString = (value: unknown, fallback: string): string =>
  typeof value === 'string' && value.trim() ? value : fallback;

const normalizeReadingFontSize = (value: unknown, fallback: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return clampReadingFontSize(value);
};

const bumpLegacyReadingSize = (size: number): number => {
  if (size <= 14) return 18;
  if (size === 15) return 18;
  if (size === 16) return 20;
  if (size === 17) return 22;
  if (size === 18) return 24;
  return clampReadingFontSize(size);
};

const isInterfaceStyle = (value: unknown): value is InterfaceStyle =>
  typeof value === 'string' && value in INTERFACE_STYLE_PROFILES;

export const normalizeCustomThemeSnapshot = (
  value: unknown,
  fallback: CustomThemeSnapshot = DEFAULT_SNAPSHOT
): CustomThemeSnapshot => {
  const source = isRecord(value) ? value : {};
  return {
    interfaceStyle: isInterfaceStyle(source.interfaceStyle)
      ? source.interfaceStyle
      : fallback.interfaceStyle,
    themePreset: nonEmptyString(source.themePreset, fallback.themePreset),
    backgroundTone: oneOf(
      source.backgroundTone,
      ['ink', 'graphite', 'warm', 'blue'] as const,
      fallback.backgroundTone
    ),
    accentGlow: oneOf(
      source.accentGlow,
      ['none', 'soft', 'strong'] as const,
      fallback.accentGlow
    ),
    fontMode: oneOf(
      source.fontMode,
      ['serif', 'sans', 'custom'] as const,
      fallback.fontMode
    ),
    fontPresetId: nonEmptyString(source.fontPresetId, fallback.fontPresetId),
    uiDensity: oneOf(
      source.uiDensity,
      ['compact', 'comfortable', 'spacious'] as const,
      fallback.uiDensity
    ),
    motionMode: oneOf(
      source.motionMode,
      ['full', 'reduced'] as const,
      fallback.motionMode
    ),
    readingFontSize: normalizeReadingFontSize(
      source.readingFontSize,
      fallback.readingFontSize
    ),
    readingLineHeight: oneOf(
      source.readingLineHeight,
      ['tight', 'normal', 'loose'] as const,
      fallback.readingLineHeight
    ),
    readingColumnWidth: oneOf(
      source.readingColumnWidth,
      [620, 760, 900] as const,
      fallback.readingColumnWidth
    ),
  };
};

const normalizeSavedCustomTheme = (value: unknown): SavedCustomTheme | null => {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || !value.id) return null;
  if (typeof value.name !== 'string' || !value.name.trim()) return null;

  return {
    id: value.id,
    name: value.name.trim(),
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : '',
    settings: normalizeCustomThemeSnapshot(value.settings),
  };
};

const normalizeColorTheme = (value: unknown): CustomColorThemePreset | null => {
  if (!isRecord(value)) return null;
  const keys: Array<keyof CustomColorThemePreset> = [
    'id',
    'label',
    'background',
    'backgroundAccent',
    'panelBaseRgb',
    'borderRgb',
    'textPrimary',
    'textSecondary',
    'muted',
    'accentMain',
    'accentSoft',
    'accentStrong',
    'success',
    'warning',
    'error',
  ];
  return keys.every((key) => typeof value[key] === 'string')
    ? value as unknown as CustomColorThemePreset
    : null;
};

export const migratePreferencesState = (
  persistedState: unknown,
  version = 0
): PersistedPreferences => {
  const wrapped = isRecord(persistedState) && isRecord(persistedState.state)
    ? persistedState.state
    : persistedState;
  const source = isRecord(wrapped) ? wrapped : {};
  const snapshot = normalizeCustomThemeSnapshot(source);
  const customThemes = Array.isArray(source.customThemes)
    ? source.customThemes
      .map(normalizeSavedCustomTheme)
      .filter((theme): theme is SavedCustomTheme => theme !== null)
    : [];
  const customColorThemes = Array.isArray(source.customColorThemes)
    ? source.customColorThemes
      .map(normalizeColorTheme)
      .filter((theme): theme is CustomColorThemePreset => theme !== null)
    : [];
  const selectedCustomThemeId = typeof source.selectedCustomThemeId === 'string'
    && customThemes.some((theme) => theme.id === source.selectedCustomThemeId)
    ? source.selectedCustomThemeId
    : null;

  const next = {
    ...snapshot,
    customThemes,
    customColorThemes,
    selectedCustomThemeId,
  };

  if (version < 3) {
    next.readingFontSize = bumpLegacyReadingSize(next.readingFontSize);
    next.customThemes = next.customThemes.map((theme) => ({
      ...theme,
      settings: {
        ...theme.settings,
        readingFontSize: bumpLegacyReadingSize(theme.settings.readingFontSize),
      },
    }));
  }

  return next;
};

export const removeCustomColorTheme = (
  state: PersistedPreferences,
  id: ThemePreset
): Pick<PersistedPreferences, 'themePreset' | 'customThemes' | 'customColorThemes' | 'selectedCustomThemeId'> => {
  const activePaletteDeleted = state.themePreset === id;
  return {
    themePreset: activePaletteDeleted ? DEFAULT_SNAPSHOT.themePreset : state.themePreset,
    customColorThemes: state.customColorThemes.filter((theme) => theme.id !== id),
    customThemes: state.customThemes.map((theme) => theme.settings.themePreset === id
      ? {
        ...theme,
        settings: { ...theme.settings, themePreset: DEFAULT_SNAPSHOT.themePreset },
      }
      : theme),
    selectedCustomThemeId: activePaletteDeleted ? null : state.selectedCustomThemeId,
  };
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      ...defaultPreferences,

      setInterfaceStyle: (value) => set({ interfaceStyle: value, selectedCustomThemeId: null }),
      setThemePreset: (value) => set({ themePreset: value, selectedCustomThemeId: null }),
      setBackgroundTone: (value) => set({ backgroundTone: value, selectedCustomThemeId: null }),
      setAccentGlow: (value) => set({ accentGlow: value, selectedCustomThemeId: null }),
      setFontMode: (value) => set({ fontMode: value, selectedCustomThemeId: null }),
      setFontPresetId: (value) => set({ fontPresetId: value, selectedCustomThemeId: null }),
      setUiDensity: (value) => set({ uiDensity: value, selectedCustomThemeId: null }),
      setMotionMode: (value) => set({ motionMode: value, selectedCustomThemeId: null }),
      setReadingFontSize: (value) => set((state) => ({
        readingFontSize: normalizeReadingFontSize(value, state.readingFontSize),
        selectedCustomThemeId: null,
      })),
      setReadingLineHeight: (value) => set({ readingLineHeight: value, selectedCustomThemeId: null }),
      setReadingColumnWidth: (value) => set({ readingColumnWidth: value, selectedCustomThemeId: null }),
      applyInterfaceStyle: (value) => {
        const profile = INTERFACE_STYLE_PROFILES[value];
        if (!profile) return;
        const profileDefaults = normalizeCustomThemeSnapshot(
          profile.defaults,
          pickSnapshot(get())
        );
        set({
          ...profileDefaults,
          interfaceStyle: value,
          themePreset: getRecommendedPaletteForStyle(value),
          selectedCustomThemeId: null,
        });
      },
      applyAppearanceSnapshot: (value) => set((state) => ({
        ...normalizeCustomThemeSnapshot(value, pickSnapshot(state)),
        selectedCustomThemeId: null,
      })),

      saveCurrentAsCustomTheme: (name, settings) => {
        const trimmed = name.trim();
        if (!trimmed) return;

        const state = get();
        const theme: SavedCustomTheme = {
          id: `custom-${crypto.randomUUID()}`,
          name: trimmed,
          createdAt: new Date().toISOString(),
          settings: normalizeCustomThemeSnapshot(settings, pickSnapshot(state)),
        };

        set((prev) => ({
          customThemes: [theme, ...prev.customThemes],
          selectedCustomThemeId: theme.id,
        }));
      },

      applyCustomTheme: (id) => {
        const state = get();
        const found = state.customThemes.find((t) => t.id === id);
        if (!found) return;
        set({
          ...normalizeCustomThemeSnapshot(found.settings),
          selectedCustomThemeId: found.id,
        });
      },

      deleteCustomTheme: (id) => set((prev) => ({
        customThemes: prev.customThemes.filter((t) => t.id !== id),
        selectedCustomThemeId: prev.selectedCustomThemeId === id ? null : prev.selectedCustomThemeId,
      })),
      addCustomColorTheme: (theme, activate = true) => set((prev) => ({
        customColorThemes: [...prev.customColorThemes.filter((item) => item.id !== theme.id), theme],
        ...(activate ? { themePreset: theme.id, selectedCustomThemeId: null } : {}),
      })),
      deleteCustomColorTheme: (id) => set((state) => removeCustomColorTheme(state, id)),

      resetAppearance: () => set({
        ...defaultPreferences,
        customThemes: get().customThemes,
        customColorThemes: get().customColorThemes,
        selectedCustomThemeId: null,
      }),
    }),
    {
      name: 'campaigner-preferences',
      storage: createJSONStorage(() => createDebouncedStateStorage(220)),
      version: 3,
      migrate: migratePreferencesState,
      partialize: (state) => ({
        interfaceStyle: state.interfaceStyle,
        themePreset: state.themePreset,
        backgroundTone: state.backgroundTone,
        accentGlow: state.accentGlow,
        fontMode: state.fontMode,
        fontPresetId: state.fontPresetId,
        uiDensity: state.uiDensity,
        motionMode: state.motionMode,
        readingFontSize: state.readingFontSize,
        readingLineHeight: state.readingLineHeight,
        readingColumnWidth: state.readingColumnWidth,
        customThemes: state.customThemes,
        customColorThemes: state.customColorThemes,
        selectedCustomThemeId: state.selectedCustomThemeId,
      }),
    }
  )
);
