import { createTheme } from '@mui/material/styles';

const SERIF = '"IBM Plex Serif", ui-serif, Georgia, "Times New Roman", serif';

export function makeTheme(mode: 'light' | 'dark') {
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
      mode
    },
    shape: {
      borderRadius: 10
    }
  });
}
