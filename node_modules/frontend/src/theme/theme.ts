import { createTheme } from '@mui/material/styles';

const SERIF = '"IBM Plex Serif", ui-serif, Georgia, "Times New Roman", serif';

export type ThemeSettings = {
  primary: string;   // например '#7C8CFF'
  secondary?: string;
};

const DEFAULT_SETTINGS: ThemeSettings = {
  primary: '#7C8CFF',
  secondary: '#4FC3F7',
};

export function makeTheme(mode: 'light' | 'dark', settings?: Partial<ThemeSettings>) {
  const s = { ...DEFAULT_SETTINGS, ...(settings ?? {}) };

  return createTheme({
    typography: {
      h1: { fontFamily: SERIF, fontWeight: 700, letterSpacing: '0.01em' },
      h2: { fontFamily: SERIF, fontWeight: 700, letterSpacing: '0.01em' },
      h3: { fontFamily: SERIF, fontWeight: 700, letterSpacing: '0.02em' },
      h4: { fontFamily: SERIF, fontWeight: 700, letterSpacing: '0.02em' },
      h5: { fontFamily: SERIF, fontWeight: 700, letterSpacing: '0.02em' },
      h6: { fontFamily: SERIF, fontWeight: 700, letterSpacing: '0.02em' },
      subtitle1: { fontFamily: SERIF, fontWeight: 400 },
      subtitle2: { fontFamily: SERIF, fontWeight: 400 },
    },
    palette: {
      mode,
      primary: { main: s.primary },
      secondary: { main: s.secondary! },
    },
    shape: {
      borderRadius: 10
    }
  });
}

export const THEME_DEFAULT_SETTINGS = DEFAULT_SETTINGS;
