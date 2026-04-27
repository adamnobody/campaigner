import React, { useMemo } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { shallow } from 'zustand/shallow';
import { createAppTheme } from './createAppTheme';
import { THEME_PRESETS } from './presets';

interface Props {
  children: React.ReactNode;
}

export const AppThemeProvider: React.FC<Props> = ({ children }) => {
  const {
    themePreset,
    surfaceMode,
    fontMode,
    uiDensity,
    motionMode,
    transparency,
    blur,
    borderRadius,
    customBodyFontFamily,
    customHeadingFontFamily,
    customFontCssUrl,
    panelPatternMode,
    panelPatternOpacity,
    panelPatternSize,
    panelPatternUrl,
    cardPatternMode,
    cardPatternOpacity,
    cardPatternSize,
    cardPatternUrl,
    customColorThemes,
  } = usePreferencesStore((state) => ({
    themePreset: state.themePreset,
    surfaceMode: state.surfaceMode,
    fontMode: state.fontMode,
    uiDensity: state.uiDensity,
    motionMode: state.motionMode,
    transparency: state.transparency,
    blur: state.blur,
    borderRadius: state.borderRadius,
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
    customColorThemes: state.customColorThemes,
  }), shallow);

  React.useEffect(() => {
    const id = 'campaigner-custom-font-css';
    const existing = document.getElementById(id);
    if (existing) {
      existing.remove();
    }
    if (!customFontCssUrl?.trim()) return;

    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = customFontCssUrl;
    document.head.appendChild(link);

    return () => {
      link.remove();
    };
  }, [customFontCssUrl]);

  const theme = useMemo(() => {
    const presets = customColorThemes.reduce<Record<string, typeof THEME_PRESETS[string]>>((acc, preset) => {
      acc[preset.id] = preset;
      return acc;
    }, { ...THEME_PRESETS });

    return createAppTheme({
      themePreset,
      surfaceMode,
      fontMode,
      uiDensity,
      motionMode,
      transparency,
      blur,
      borderRadius,
      customBodyFontFamily,
      customHeadingFontFamily,
      panelPatternMode,
      panelPatternOpacity,
      panelPatternSize,
      panelPatternUrl,
      cardPatternMode,
      cardPatternOpacity,
      cardPatternSize,
      cardPatternUrl,
    }, { presets });
  }, [
    themePreset,
    surfaceMode,
    fontMode,
    uiDensity,
    motionMode,
    transparency,
    blur,
    borderRadius,
    customBodyFontFamily,
    customHeadingFontFamily,
    panelPatternMode,
    panelPatternOpacity,
    panelPatternSize,
    panelPatternUrl,
    cardPatternMode,
    cardPatternOpacity,
    cardPatternSize,
    cardPatternUrl,
    customColorThemes,
  ]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};