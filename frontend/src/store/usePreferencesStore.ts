import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemePreset =
  | 'obsidian-gold'
  | 'midnight-cyan'
  | 'royal-violet'
  | 'ember-crimson'
  | 'forest-emerald'
  | 'moonstone-silver'
  | 'sable-rose'
  | 'deep-amber'
  | 'storm-indigo'
  | 'ashen-teal';

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

  homeBackgroundImage: string;
  homeBackgroundOpacity: number;

  setThemePreset: (value: ThemePreset) => void;
  setSurfaceMode: (value: SurfaceMode) => void;
  setFontMode: (value: FontMode) => void;
  setUiDensity: (value: UiDensity) => void;
  setMotionMode: (value: MotionMode) => void;
  setTransparency: (value: number) => void;
  setBlur: (value: number) => void;
  setBorderRadius: (value: number) => void;

  setHomeBackgroundImage: (value: string) => void;
  setHomeBackgroundOpacity: (value: number) => void;
  clearHomeBackgroundImage: () => void;

  resetAppearance: () => void;
}

const defaultPreferences = {
  themePreset: 'obsidian-gold' as ThemePreset,
  surfaceMode: 'glass' as SurfaceMode,
  fontMode: 'serif' as FontMode,
  uiDensity: 'comfortable' as UiDensity,
  motionMode: 'full' as MotionMode,
  transparency: 0.72,
  blur: 14,
  borderRadius: 14,

  homeBackgroundImage: '',
  homeBackgroundOpacity: 0.42,
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...defaultPreferences,

      setThemePreset: (value) => set({ themePreset: value }),
      setSurfaceMode: (value) => set({ surfaceMode: value }),
      setFontMode: (value) => set({ fontMode: value }),
      setUiDensity: (value) => set({ uiDensity: value }),
      setMotionMode: (value) => set({ motionMode: value }),
      setTransparency: (value) => set({ transparency: value }),
      setBlur: (value) => set({ blur: value }),
      setBorderRadius: (value) => set({ borderRadius: value }),

      setHomeBackgroundImage: (value) => set({ homeBackgroundImage: value }),
      setHomeBackgroundOpacity: (value) => set({ homeBackgroundOpacity: value }),
      clearHomeBackgroundImage: () => set({ homeBackgroundImage: '' }),

      resetAppearance: () => set({ ...defaultPreferences }),
    }),
    {
      name: 'campaigner-preferences',
      partialize: (state) => ({
        themePreset: state.themePreset,
        surfaceMode: state.surfaceMode,
        fontMode: state.fontMode,
        uiDensity: state.uiDensity,
        motionMode: state.motionMode,
        transparency: state.transparency,
        blur: state.blur,
        borderRadius: state.borderRadius,
        homeBackgroundImage: state.homeBackgroundImage,
        homeBackgroundOpacity: state.homeBackgroundOpacity,
      }),
    }
  )
);
