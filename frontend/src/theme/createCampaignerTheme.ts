import { alpha, createTheme } from '@mui/material/styles';
import type { PreferencesState } from '@/store/usePreferencesStore';
import type { ThemePresetDefinition } from './presets';
import { createAppTheme } from './createAppTheme';
import { campaignerFonts, getCampaignerSurface } from './designSystem';

type ThemePreferences = Pick<
  PreferencesState,
  | 'themePreset'
  | 'surfaceMode'
  | 'fontMode'
  | 'uiDensity'
  | 'motionMode'
  | 'transparency'
  | 'blur'
  | 'borderRadius'
  | 'customBodyFontFamily'
  | 'customHeadingFontFamily'
  | 'panelPatternMode'
  | 'panelPatternOpacity'
  | 'panelPatternSize'
  | 'panelPatternUrl'
  | 'cardPatternMode'
  | 'cardPatternOpacity'
  | 'cardPatternSize'
  | 'cardPatternUrl'
>;

export function createCampaignerTheme(
  preferences: ThemePreferences,
  presets: Record<string, ThemePresetDefinition>,
) {
  const base = createAppTheme(preferences, { presets });
  const surface = getCampaignerSurface(base);
  const transition = preferences.motionMode === 'reduced'
    ? 'none'
    : '160ms cubic-bezier(0.4, 0, 0.2, 1)';

  return createTheme(base, {
    campaigner: {
      profile: 'design-system',
      surface,
      typography: campaignerFonts,
    },
    shape: {
      borderRadius: Math.min(18, Math.max(8, preferences.borderRadius)),
    },
    typography: {
      fontFamily: campaignerFonts.body,
      h1: { fontFamily: campaignerFonts.display, fontWeight: 600, lineHeight: 1.05 },
      h2: { fontFamily: campaignerFonts.display, fontWeight: 600, lineHeight: 1.08 },
      h3: { fontFamily: campaignerFonts.display, fontWeight: 600, lineHeight: 1.1 },
      h4: { fontFamily: campaignerFonts.display, fontWeight: 600, lineHeight: 1.15 },
      h5: { fontFamily: campaignerFonts.display, fontWeight: 600, lineHeight: 1.2 },
      h6: { fontFamily: campaignerFonts.display, fontWeight: 600, lineHeight: 1.25 },
      body1: { fontFamily: campaignerFonts.body, fontWeight: 300, lineHeight: 1.7 },
      body2: { fontFamily: campaignerFonts.body, fontWeight: 300, lineHeight: 1.6 },
      button: {
        fontFamily: campaignerFonts.body,
        fontWeight: 500,
        textTransform: 'none',
        letterSpacing: 0,
      },
      caption: { fontFamily: campaignerFonts.body, fontWeight: 300 },
      overline: {
        fontFamily: campaignerFonts.mono,
        fontSize: '0.6rem',
        fontWeight: 400,
        letterSpacing: '0.16em',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: base.palette.background.default,
            backgroundImage: 'none',
          },
          '::selection': {
            backgroundColor: alpha(base.palette.primary.main, 0.28),
          },
          '::-webkit-scrollbar': {
            width: 6,
            height: 6,
          },
          '::-webkit-scrollbar-thumb': {
            background: alpha(base.palette.common.white, 0.12),
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
            border: `1px solid ${surface.border}`,
            boxShadow: 'none',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: alpha(base.palette.background.default, 0.98),
            border: `1px solid ${alpha(base.palette.common.white, 0.1)}`,
            borderRadius: 18,
            boxShadow: '0 40px 100px rgba(0,0,0,.72)',
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontFamily: campaignerFonts.display,
            fontWeight: 600,
            fontSize: '1.65rem',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            minHeight: 36,
            borderRadius: 9,
            transition,
          },
          contained: {
            background: base.palette.primary.main,
            color: '#12140f',
            boxShadow: `0 10px 26px ${alpha(base.palette.primary.main, 0.16)}`,
            '&:hover': {
              background: base.palette.primary.light,
              boxShadow: `0 12px 30px ${alpha(base.palette.primary.main, 0.22)}`,
            },
          },
          outlined: {
            borderColor: alpha(base.palette.common.white, 0.1),
            color: base.palette.text.secondary,
            backgroundColor: alpha(base.palette.common.white, 0.02),
            '&:hover': {
              borderColor: alpha(base.palette.primary.main, 0.35),
              backgroundColor: alpha(base.palette.primary.main, 0.07),
              color: base.palette.text.primary,
            },
          },
          text: {
            color: base.palette.text.secondary,
            '&:hover': {
              color: base.palette.text.primary,
              backgroundColor: alpha(base.palette.common.white, 0.04),
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            transition,
            '&:hover': {
              backgroundColor: alpha(base.palette.common.white, 0.06),
              color: base.palette.text.primary,
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: alpha(base.palette.common.white, 0.018),
            borderRadius: 10,
            transition,
            '& fieldset': {
              borderColor: alpha(base.palette.common.white, 0.09),
            },
            '&:hover fieldset': {
              borderColor: alpha(base.palette.common.white, 0.18),
            },
            '&.Mui-focused fieldset': {
              borderColor: alpha(base.palette.primary.main, 0.5),
              boxShadow: `0 0 0 2px ${alpha(base.palette.primary.main, 0.08)}`,
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontFamily: campaignerFonts.mono,
            fontSize: '0.72rem',
            letterSpacing: '0.08em',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            height: 26,
            borderRadius: 20,
            fontFamily: campaignerFonts.body,
            fontWeight: 300,
            backgroundColor: alpha(base.palette.common.white, 0.035),
            border: `1px solid ${alpha(base.palette.common.white, 0.09)}`,
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            minHeight: 38,
            borderBottom: `1px solid ${alpha(base.palette.common.white, 0.07)}`,
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
            padding: '0 0 11px',
            marginRight: 26,
            minWidth: 0,
            fontFamily: campaignerFonts.body,
            fontSize: '0.78rem',
            fontWeight: 300,
            textTransform: 'none',
            color: alpha(base.palette.text.primary, 0.4),
            '&.Mui-selected': {
              color: base.palette.text.primary,
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontFamily: campaignerFonts.body,
            backgroundColor: alpha(base.palette.background.default, 0.96),
            border: `1px solid ${alpha(base.palette.common.white, 0.1)}`,
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: alpha(base.palette.common.white, 0.065),
          },
        },
      },
    },
  });
}
