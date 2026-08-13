import { alpha, createTheme } from '@mui/material/styles';
import {
  mapAppearanceTokens,
  type AppearanceThemePreferences,
} from './appearanceTokens';

export function createCampaignerTheme(preferences: AppearanceThemePreferences) {
  const tokens = mapAppearanceTokens(preferences);
  const { preset, surface, fonts, glow, motion, reading } = tokens;
  const border = `rgba(${preset.borderRgb}, 0.18)`;
  const accentBackground = glow.strength === 0
    ? 'none'
    : `radial-gradient(circle at top left, ${alpha(preset.accentMain, glow.strength)}, transparent 34%)`;

  return createTheme({
    spacing: tokens.spacing,
    shape: {
      borderRadius: preferences.uiDensity === 'compact'
        ? 8
        : preferences.uiDensity === 'spacious'
          ? 12
          : 10,
    },
    transitions: {
      duration: {
        shortest: motion.duration,
        shorter: motion.duration,
        short: motion.duration,
        standard: motion.duration,
        complex: motion.duration,
        enteringScreen: motion.duration,
        leavingScreen: motion.duration,
      },
    },
    palette: {
      mode: 'dark',
      primary: {
        main: preset.accentMain,
        light: preset.accentStrong,
        dark: preset.accentMain,
        contrastText: surface.base,
      },
      secondary: {
        main: preset.accentStrong,
      },
      success: { main: preset.success },
      warning: { main: preset.warning },
      error: { main: preset.error },
      info: { main: preset.accentStrong },
      background: {
        default: surface.base,
        paper: surface.raised,
      },
      text: {
        primary: preset.textPrimary,
        secondary: preset.textSecondary,
        disabled: preset.muted,
      },
      divider: border,
    },
    campaigner: {
      profile: 'design-system',
      surface: {
        ...surface,
        border,
      },
      glow,
      typography: {
        ...fonts,
        reading: reading.fontFamily,
      },
      density: {
        spacing: tokens.spacing,
      },
      motion,
      reading,
    },
    typography: {
      fontFamily: fonts.body,
      h1: { fontFamily: fonts.display, fontWeight: 600, lineHeight: 1.05 },
      h2: { fontFamily: fonts.display, fontWeight: 600, lineHeight: 1.08 },
      h3: { fontFamily: fonts.display, fontWeight: 600, lineHeight: 1.1 },
      h4: { fontFamily: fonts.display, fontWeight: 600, lineHeight: 1.15 },
      h5: { fontFamily: fonts.display, fontWeight: 600, lineHeight: 1.2 },
      h6: { fontFamily: fonts.display, fontWeight: 600, lineHeight: 1.25 },
      body1: { fontFamily: fonts.body, fontWeight: 400, lineHeight: 1.7 },
      body2: { fontFamily: fonts.body, fontWeight: 400, lineHeight: 1.6 },
      button: {
        fontFamily: fonts.body,
        fontWeight: 500,
        textTransform: 'none',
        letterSpacing: 0,
      },
      caption: { fontFamily: fonts.body, fontWeight: 400 },
      overline: {
        fontFamily: fonts.mono,
        fontSize: '0.6rem',
        fontWeight: 400,
        letterSpacing: '0.16em',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            scrollBehavior: motion.duration === 0 ? 'auto' : 'smooth',
          },
          body: {
            backgroundColor: surface.base,
            backgroundImage: accentBackground,
            backgroundAttachment: 'fixed',
            textRendering: 'optimizeLegibility',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          },
          '*': {
            boxSizing: 'border-box',
          },
          ...(motion.duration === 0
            ? {
                '*, *::before, *::after': {
                  animationDuration: '0.01ms !important',
                  animationIterationCount: '1 !important',
                  transitionDuration: '0.01ms !important',
                  scrollBehavior: 'auto !important',
                },
              }
            : {}),
          '::selection': {
            backgroundColor: alpha(preset.accentMain, 0.28),
          },
          '::-webkit-scrollbar': {
            width: 6,
            height: 6,
          },
          '::-webkit-scrollbar-thumb': {
            background: alpha(preset.textPrimary, 0.14),
            borderRadius: 3,
          },
          '::-webkit-scrollbar-track': {
            background: 'transparent',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: surface.raised,
            border: `1px solid ${border}`,
            boxShadow: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: surface.raised,
            border: `1px solid ${border}`,
            transition: motion.transition,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: surface.raised,
            border: `1px solid ${border}`,
            boxShadow: '0 40px 100px rgba(0,0,0,.72)',
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontFamily: fonts.display,
            fontWeight: 600,
            fontSize: '1.65rem',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: surface.raised,
            borderBottom: `1px solid ${border}`,
            boxShadow: 'none',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            backgroundColor: surface.raised,
            borderRight: `1px solid ${border}`,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            minHeight: preferences.uiDensity === 'compact' ? 32 : 36,
            transition: motion.transition,
          },
          contained: {
            background: preset.accentMain,
            color: surface.base,
            boxShadow: glow.strength === 0
              ? 'none'
              : `0 10px 26px ${alpha(preset.accentMain, glow.strength)}`,
            '&:hover': {
              background: preset.accentStrong,
            },
          },
          outlined: {
            borderColor: alpha(preset.textPrimary, 0.12),
            color: preset.textSecondary,
            '&:hover': {
              borderColor: alpha(preset.accentMain, 0.4),
              backgroundColor: alpha(preset.accentMain, 0.07),
              color: preset.textPrimary,
            },
          },
          text: {
            color: preset.textSecondary,
            '&:hover': {
              color: preset.textPrimary,
              backgroundColor: alpha(preset.textPrimary, 0.04),
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: motion.transition,
            '&:hover': {
              backgroundColor: alpha(preset.textPrimary, 0.06),
              color: preset.textPrimary,
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: surface.subtle,
            transition: motion.transition,
            '& fieldset': {
              borderColor: alpha(preset.textPrimary, 0.09),
            },
            '&:hover fieldset': {
              borderColor: alpha(preset.textPrimary, 0.18),
            },
            '&.Mui-focused fieldset': {
              borderColor: alpha(preset.accentMain, 0.5),
              boxShadow: `0 0 0 2px ${alpha(preset.accentMain, 0.08)}`,
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontFamily: fonts.mono,
            fontSize: '0.72rem',
            letterSpacing: '0.08em',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            height: preferences.uiDensity === 'compact' ? 24 : 26,
            fontFamily: fonts.body,
            fontWeight: 400,
            backgroundColor: alpha(preset.textPrimary, 0.035),
            border: `1px solid ${alpha(preset.textPrimary, 0.09)}`,
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            minHeight: 38,
            borderBottom: `1px solid ${alpha(preset.textPrimary, 0.07)}`,
          },
          indicator: {
            height: 1,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            minHeight: 38,
            fontFamily: fonts.body,
            fontSize: '0.78rem',
            fontWeight: 400,
            textTransform: 'none',
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontFamily: fonts.body,
            backgroundColor: surface.raised,
            border: `1px solid ${border}`,
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: border,
          },
        },
      },
    },
  });
}
