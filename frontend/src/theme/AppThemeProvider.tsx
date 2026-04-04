import React, { useMemo } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { createAppTheme } from './createAppTheme';

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
  } = usePreferencesStore();

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
    });
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
  ]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};