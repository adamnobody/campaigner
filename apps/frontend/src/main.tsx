import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

import { AppRouter } from './app/router';
import { makeTheme } from './theme/theme';

function getInitialMode(): 'light' | 'dark' {
  const saved = localStorage.getItem('ui.theme');
  if (saved === 'light' || saved === 'dark') return saved;
  // дефолт: системная
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function Root() {
  const [mode, setMode] = React.useState<'light' | 'dark'>(() => getInitialMode());

  const theme = React.useMemo(() => makeTheme(mode), [mode]);

  const toggle = React.useCallback(() => {
    setMode((m) => {
      const next = m === 'light' ? 'dark' : 'light';
      localStorage.setItem('ui.theme', next);
      return next;
    });
  }, []);

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
