import React, { useMemo } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { shallow } from 'zustand/shallow';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { createCampaignerTheme } from './createCampaignerTheme';

interface Props {
  children: React.ReactNode;
}

export const AppThemeProvider: React.FC<Props> = ({ children }) => {
  const preferences = usePreferencesStore((state) => ({
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
    customColorThemes: state.customColorThemes,
  }), shallow);

  const theme = useMemo(
    () => createCampaignerTheme(preferences),
    [preferences],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};
