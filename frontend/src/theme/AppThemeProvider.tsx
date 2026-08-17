import React, { useMemo } from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { enUS, ruRU } from '@mui/material/locale';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { createCampaignerTheme } from './createCampaignerTheme';

interface Props {
  children: React.ReactNode;
}

export const AppThemeProvider: React.FC<Props> = ({ children }) => {
  const { i18n } = useTranslation();
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
    () => createTheme(
      createCampaignerTheme(preferences),
      i18n.language.startsWith('ru') ? ruRU : enUS,
    ),
    [preferences, i18n.language],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};
