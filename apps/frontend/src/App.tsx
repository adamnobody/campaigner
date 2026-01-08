import React, { useMemo, useState } from 'react';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { AppRouter } from './app/router';
import { makeTheme } from './theme/theme';

import { CommandPalette } from './shared/ui/CommandPalette';

export default function App() {
  const [mode] = useState<'light' | 'dark'>('dark'); // или 'light', или потом привяжем к настройкам
  const theme = useMemo(() => makeTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRouter />
      <CommandPalette />
    </ThemeProvider>
  );
}
