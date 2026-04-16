import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createDebouncedStateStorage } from './debouncedStorage';
import {
  INTERFACE_STYLE_PROFILES,
  getRecommendedPaletteForStyle,
  type InterfaceStyleId,
} from '@/theme/interfaceStyles';

export type ThemePreset = string;

export type SurfaceMode = 'glass' | 'solid';
export type FontMode = 'serif' | 'sans' | 'custom';
export type UiDensity = 'compact' | 'comfortable' | 'spacious';
export type MotionMode = 'full' | 'reduced';
export type PatternMode = 'none' | 'dots' | 'grid' | 'diagonal' | 'custom';
export type InterfaceStyle = InterfaceStyleId;

export interface CustomThemeSnapshot {
  interfaceStyle: InterfaceStyle;
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
  customBodyFontFamily: string;
  customHeadingFontFamily: string;
  customFontCssUrl: string;
  panelPatternMode: PatternMode;
  panelPatternOpacity: number;
  panelPatternSize: number;
  panelPatternUrl: string;
  cardPatternMode: PatternMode;
  cardPatternOpacity: number;
  cardPatternSize: number;
  cardPatternUrl: string;
}

export interface SavedCustomTheme {
  id: string;
  name: string;
  createdAt: string;
  settings: CustomThemeSnapshot;
}

export interface PreferencesState {
  interfaceStyle: InterfaceStyle;
  autoApplyRecommendedPalette: boolean;
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
  customBodyFontFamily: string;
  customHeadingFontFamily: string;
  customFontCssUrl: string;
  panelPatternMode: PatternMode;
  panelPatternOpacity: number;
  panelPatternSize: number;
  panelPatternUrl: string;
  cardPatternMode: PatternMode;
  cardPatternOpacity: number;
  cardPatternSize: number;
  cardPatternUrl: string;
  customThemes: SavedCustomTheme[];
  selectedCustomThemeId: string | null;

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
  setCustomBodyFontFamily: (value: string) => void;
  setCustomHeadingFontFamily: (value: string) => void;
  setCustomFontCssUrl: (value: string) => void;
  setPanelPatternMode: (value: PatternMode) => void;
  setPanelPatternOpacity: (value: number) => void;
  setPanelPatternSize: (value: number) => void;
  setPanelPatternUrl: (value: string) => void;
  setCardPatternMode: (value: PatternMode) => void;
  setCardPatternOpacity: (value: number) => void;
  setCardPatternSize: (value: number) => void;
  setCardPatternUrl: (value: string) => void;
  setInterfaceStyle: (value: InterfaceStyle) => void;
  setAutoApplyRecommendedPalette: (value: boolean) => void;
  applyInterfaceStyle: (value: InterfaceStyle, options?: { useRecommendedPalette?: boolean }) => void;
  saveCurrentAsCustomTheme: (name: string) => void;
  applyCustomTheme: (id: string) => void;
  deleteCustomTheme: (id: string) => void;

  resetAppearance: () => void;
}

const defaultPreferences = {
  interfaceStyle: 'dark-fantasy' as InterfaceStyle,
  autoApplyRecommendedPalette: true,
  themePreset: 'obsidian-gold' as ThemePreset,
  surfaceMode: 'glass' as SurfaceMode,
  fontMode: 'custom' as FontMode,
  uiDensity: 'comfortable' as UiDensity,
  motionMode: 'full' as MotionMode,
  transparency: 0.72,
  blur: 14,
  borderRadius: 14,

  homeBackgroundImage: '',
  homeBackgroundOpacity: 0.42,
  customBodyFontFamily: '"Cormorant Garamond", "Crimson Text", serif',
  customHeadingFontFamily: '"Cinzel", serif',
  customFontCssUrl: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;800&family=Cormorant+Garamond:wght@400;500;600;700&display=swap',
  panelPatternMode: 'none' as PatternMode,
  panelPatternOpacity: 0.12,
  panelPatternSize: 28,
  panelPatternUrl: '',
  cardPatternMode: 'none' as PatternMode,
  cardPatternOpacity: 0.1,
  cardPatternSize: 22,
  cardPatternUrl: '',
  customThemes: [] as SavedCustomTheme[],
  selectedCustomThemeId: null as string | null,
};

const pickSnapshot = (state: PreferencesState): CustomThemeSnapshot => ({
  interfaceStyle: state.interfaceStyle,
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
  customBodyFontFamily: state.customBodyFontFamily,
  customHeadingFontFamily: state.customHeadingFontFamily,
  customFontCssUrl: state.customFontCssUrl,
  panelPatternMode: state.panelPatternMode,
  panelPatternOpacity: state.panelPatternOpacity,
  panelPatternSize: state.panelPatternSize,
  panelPatternUrl: state.panelPatternUrl,
  cardPatternMode: state.cardPatternMode,
  cardPatternOpacity: state.cardPatternOpacity,
  cardPatternSize: state.cardPatternSize,
  cardPatternUrl: state.cardPatternUrl,
});

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      ...defaultPreferences,

      setInterfaceStyle: (value) => set({ interfaceStyle: value, selectedCustomThemeId: null }),
      setAutoApplyRecommendedPalette: (value) => set({ autoApplyRecommendedPalette: value }),
      setThemePreset: (value) => set({ themePreset: value, selectedCustomThemeId: null }),
      setSurfaceMode: (value) => set({ surfaceMode: value, selectedCustomThemeId: null }),
      setFontMode: (value) => set({ fontMode: value, selectedCustomThemeId: null }),
      setUiDensity: (value) => set({ uiDensity: value, selectedCustomThemeId: null }),
      setMotionMode: (value) => set({ motionMode: value, selectedCustomThemeId: null }),
      setTransparency: (value) => set({ transparency: value, selectedCustomThemeId: null }),
      setBlur: (value) => set({ blur: value, selectedCustomThemeId: null }),
      setBorderRadius: (value) => set({ borderRadius: value, selectedCustomThemeId: null }),

      setHomeBackgroundImage: (value) => set({ homeBackgroundImage: value, selectedCustomThemeId: null }),
      setHomeBackgroundOpacity: (value) => set({ homeBackgroundOpacity: value, selectedCustomThemeId: null }),
      clearHomeBackgroundImage: () => set({ homeBackgroundImage: '', selectedCustomThemeId: null }),
      setCustomBodyFontFamily: (value) => set({ customBodyFontFamily: value, selectedCustomThemeId: null }),
      setCustomHeadingFontFamily: (value) => set({ customHeadingFontFamily: value, selectedCustomThemeId: null }),
      setCustomFontCssUrl: (value) => set({ customFontCssUrl: value, selectedCustomThemeId: null }),
      setPanelPatternMode: (value) => set({ panelPatternMode: value, selectedCustomThemeId: null }),
      setPanelPatternOpacity: (value) => set({ panelPatternOpacity: value, selectedCustomThemeId: null }),
      setPanelPatternSize: (value) => set({ panelPatternSize: value, selectedCustomThemeId: null }),
      setPanelPatternUrl: (value) => set({ panelPatternUrl: value, selectedCustomThemeId: null }),
      setCardPatternMode: (value) => set({ cardPatternMode: value, selectedCustomThemeId: null }),
      setCardPatternOpacity: (value) => set({ cardPatternOpacity: value, selectedCustomThemeId: null }),
      setCardPatternSize: (value) => set({ cardPatternSize: value, selectedCustomThemeId: null }),
      setCardPatternUrl: (value) => set({ cardPatternUrl: value, selectedCustomThemeId: null }),
      applyInterfaceStyle: (value, options) => {
        const profile = INTERFACE_STYLE_PROFILES[value];
        if (!profile) return;
        const recommendedPalette = getRecommendedPaletteForStyle(value);
        set({
          interfaceStyle: value,
          ...(options?.useRecommendedPalette ? { themePreset: recommendedPalette } : {}),
          ...profile.defaults,
          selectedCustomThemeId: null,
        });
      },

      saveCurrentAsCustomTheme: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return;

        const state = get();
        const theme: SavedCustomTheme = {
          id: `custom-${Date.now().toString(36)}`,
          name: trimmed,
          createdAt: new Date().toISOString(),
          settings: pickSnapshot(state),
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
          ...defaultPreferences,
          autoApplyRecommendedPalette: state.autoApplyRecommendedPalette,
          ...found.settings,
          interfaceStyle: found.settings.interfaceStyle ?? defaultPreferences.interfaceStyle,
          selectedCustomThemeId: found.id,
        });
      },

      deleteCustomTheme: (id) => set((prev) => ({
        customThemes: prev.customThemes.filter((t) => t.id !== id),
        selectedCustomThemeId: prev.selectedCustomThemeId === id ? null : prev.selectedCustomThemeId,
      })),

      resetAppearance: () => set({
        ...defaultPreferences,
        customThemes: get().customThemes,
        selectedCustomThemeId: null,
      }),
    }),
    {
      name: 'campaigner-preferences',
      storage: createJSONStorage(() => createDebouncedStateStorage(220)),
      partialize: (state) => ({
        interfaceStyle: state.interfaceStyle,
        autoApplyRecommendedPalette: state.autoApplyRecommendedPalette,
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
        customBodyFontFamily: state.customBodyFontFamily,
        customHeadingFontFamily: state.customHeadingFontFamily,
        customFontCssUrl: state.customFontCssUrl,
        panelPatternMode: state.panelPatternMode,
        panelPatternOpacity: state.panelPatternOpacity,
        panelPatternSize: state.panelPatternSize,
        panelPatternUrl: state.panelPatternUrl,
        cardPatternMode: state.cardPatternMode,
        cardPatternOpacity: state.cardPatternOpacity,
        cardPatternSize: state.cardPatternSize,
        cardPatternUrl: state.cardPatternUrl,
        customThemes: state.customThemes,
        selectedCustomThemeId: state.selectedCustomThemeId,
      }),
    }
  )
);
