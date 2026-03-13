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
  } = usePreferencesStore();

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
  ]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};