import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

import { AppRouter } from './app/router';
import { makeTheme, THEME_DEFAULT_SETTINGS, type ThemeSettings } from './theme/theme';

function getInitialMode(): 'light' | 'dark' {
  const saved = localStorage.getItem('ui.theme');
  if (saved === 'light' || saved === 'dark') return saved;
  // дефолт: системная
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const THEME_SETTINGS_KEY = 'ui.themeSettings';

function getInitialThemeSettings(): ThemeSettings {
  try {
    const raw = localStorage.getItem(THEME_SETTINGS_KEY);
    if (!raw) return THEME_DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<ThemeSettings>;
    return { ...THEME_DEFAULT_SETTINGS, ...parsed };
  } catch {
    return THEME_DEFAULT_SETTINGS;
  }
}

function Root() {
  const [mode, setMode] = React.useState<'light' | 'dark'>(() => getInitialMode());

  const [themeSettings, setThemeSettings] = React.useState<ThemeSettings>(() => getInitialThemeSettings());
  const theme = React.useMemo(() => makeTheme(mode, themeSettings), [mode, themeSettings]);

  const toggle = React.useCallback(() => {
    setMode((m) => {
      const next = m === 'light' ? 'dark' : 'light';
      localStorage.setItem('ui.theme', next);
      return next;
    });
  }, []);

  React.useEffect(() => {
    (window as any).__setThemeSettings = (patch: Partial<ThemeSettings>) => {
      setThemeSettings((prev) => {
        const next = { ...prev, ...patch };
        localStorage.setItem(THEME_SETTINGS_KEY, JSON.stringify(next));
        return next;
      });
    };
    (window as any).__themeSettings = themeSettings;
  }, [themeSettings]);

  // пробросим toggle через window для простоты MVP, чтобы не плодить контексты
  React.useEffect(() => {
    (window as any).__toggleTheme = toggle;
    (window as any).__themeMode = mode;
  }, [toggle, mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRouter />
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
console.log('BOOT');
