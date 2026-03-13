import { create } from 'zustand';

export type ThemePreset = 'obsidian-gold' | 'midnight-cyan' | 'royal-violet' | 'ember-crimson';
export type SurfaceMode = 'glass' | 'solid';
export type FontMode = 'serif' | 'sans';
export type UiDensity = 'compact' | 'comfortable' | 'spacious';
export type MotionMode = 'full' | 'reduced';

export interface PreferencesState {
  themePreset: ThemePreset;
  surfaceMode: SurfaceMode;
  fontMode: FontMode;
  uiDensity: UiDensity;
  motionMode: MotionMode;
  transparency: number;
  blur: number;
  borderRadius: number;

  setThemePreset: (value: ThemePreset) => void;
  setSurfaceMode: (value: SurfaceMode) => void;
  setFontMode: (value: FontMode) => void;
  setUiDensity: (value: UiDensity) => void;
  setMotionMode: (value: MotionMode) => void;
  setTransparency: (value: number) => void;
  setBlur: (value: number) => void;
  setBorderRadius: (value: number) => void;
  resetAppearance: () => void;
}

const STORAGE_KEY = 'campaigner-preferences';

const defaultPreferences = {
  themePreset: 'obsidian-gold' as ThemePreset,
  surfaceMode: 'glass' as SurfaceMode,
  fontMode: 'serif' as FontMode,
  uiDensity: 'comfortable' as UiDensity,
  motionMode: 'full' as MotionMode,
  transparency: 0.72,
  blur: 14,
  borderRadius: 14,
};

const loadInitialState = () => {
  if (typeof window === 'undefined') return defaultPreferences;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPreferences;
    return { ...defaultPreferences, ...JSON.parse(raw) };
  } catch {
    return defaultPreferences;
  }
};

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  ...loadInitialState(),

  setThemePreset: (value) => set({ themePreset: value }),
  setSurfaceMode: (value) => set({ surfaceMode: value }),
  setFontMode: (value) => set({ fontMode: value }),
  setUiDensity: (value) => set({ uiDensity: value }),
  setMotionMode: (value) => set({ motionMode: value }),
  setTransparency: (value) => set({ transparency: value }),
  setBlur: (value) => set({ blur: value }),
  setBorderRadius: (value) => set({ borderRadius: value }),
  resetAppearance: () => set(defaultPreferences),
}));

usePreferencesStore.subscribe((state) => {
  try {
    const {
      themePreset,
      surfaceMode,
      fontMode,
      uiDensity,
      motionMode,
      transparency,
      blur,
      borderRadius,
    } = state;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        themePreset,
        surfaceMode,
        fontMode,
        uiDensity,
        motionMode,
        transparency,
        blur,
        borderRadius,
      })
    );
  } catch {
    // ignore
  }
});