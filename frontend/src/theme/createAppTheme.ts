import { alpha, createTheme } from '@mui/material/styles';
import { THEME_PRESETS } from './presets';
import type { PreferencesState } from '@/store/usePreferencesStore';
import type { ThemePresetDefinition } from './presets';

export const createAppTheme = (preferences: Pick<
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
>, options?: {
  presets?: Record<string, ThemePresetDefinition>;
}) => {
  const presetMap = options?.presets || THEME_PRESETS;
  const preset = presetMap[preferences.themePreset] || THEME_PRESETS['obsidian-gold'];

  const spacingBase =
    preferences.uiDensity === 'compact' ? 7 :
    preferences.uiDensity === 'spacious' ? 10 :
    8;

  const bodyFont =
    preferences.fontMode === 'custom'
      ? preferences.customBodyFontFamily || '"Inter", "Roboto", sans-serif'
      : preferences.fontMode === 'serif'
      ? '"Crimson Text", serif'
      : '"Inter", "Roboto", sans-serif';

  const uiFont =
    preferences.fontMode === 'custom'
      ? preferences.customBodyFontFamily || '"Inter", "Roboto", sans-serif'
      : '"Inter", "Roboto", sans-serif';
  const headingFont =
    preferences.fontMode === 'custom'
      ? preferences.customHeadingFontFamily || '"Cinzel", serif'
      : '"Cinzel", serif';
  const monoFont = '"Fira Code", monospace';

  const panelOpacity = preferences.surfaceMode === 'glass'
    ? preferences.transparency
    : 0.96;

  const blurAmount = preferences.surfaceMode === 'glass'
    ? preferences.blur
    : 0;

  const transitionDuration = preferences.motionMode === 'reduced' ? 0 : 180;

  const paperBackground = `rgba(${preset.panelBaseRgb}, ${panelOpacity})`;
  const softBackground = alpha(preset.textPrimary, 0.03);
  const borderColor = `rgba(${preset.borderRgb}, 0.18)`;
  const accentMainSoft = alpha(preset.accentMain, 0.78);
  const accentStrongSoft = alpha(preset.accentStrong, 0.72);
  const successSoft = alpha(preset.success, 0.86);
  const warningSoft = alpha(preset.warning, 0.86);
  const errorSoft = alpha(preset.error, 0.86);

  const buildPatternStyle = (
    mode: PreferencesState['panelPatternMode'],
    opacity: number,
    size: number,
    customUrl: string,
    color: string
  ): {
    backgroundImage?: string;
    backgroundSize?: string;
    backgroundRepeat?: string;
    backgroundPosition?: string;
  } => {
    if (mode === 'none') return {};
    if (mode === 'custom' && customUrl.trim()) {
      return {
        backgroundImage: `url("${customUrl}")`,
        backgroundSize: `${Math.max(8, size)}px ${Math.max(8, size)}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0',
      };
    }
    if (mode === 'dots') {
      return {
        backgroundImage: `radial-gradient(circle, ${alpha(color, opacity)} 1.2px, transparent 1.2px)`,
        backgroundSize: `${size}px ${size}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0',
      };
    }
    if (mode === 'grid') {
      return {
        backgroundImage: [
          `linear-gradient(to right, ${alpha(color, opacity)} 1px, transparent 1px)`,
          `linear-gradient(to bottom, ${alpha(color, opacity)} 1px, transparent 1px)`,
        ].join(', '),
        backgroundSize: `${size}px ${size}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0',
      };
    }
    if (mode === 'diagonal') {
      return {
        backgroundImage: `repeating-linear-gradient(45deg, ${alpha(color, opacity)} 0, ${alpha(color, opacity)} 2px, transparent 2px, transparent ${size}px)`,
        backgroundSize: 'auto',
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0',
      };
    }
    return {};
  };

  const panelPattern = buildPatternStyle(
    preferences.panelPatternMode,
    preferences.panelPatternOpacity,
    preferences.panelPatternSize,
    preferences.panelPatternUrl,
    preset.textPrimary
  );
  const cardPattern = buildPatternStyle(
    preferences.cardPatternMode,
    preferences.cardPatternOpacity,
    preferences.cardPatternSize,
    preferences.cardPatternUrl,
    preset.textPrimary
  );

  return createTheme({
    spacing: spacingBase,
    shape: {
      borderRadius: preferences.borderRadius,
    },
    palette: {
      mode: 'dark',
      primary: {
        main: accentMainSoft,
      },
      secondary: {
        main: accentStrongSoft,
      },
      success: {
        main: successSoft,
      },
      warning: {
        main: warningSoft,
      },
      error: {
        main: errorSoft,
      },
      background: {
        default: preset.background,
        paper: paperBackground,
      },
      text: {
        primary: preset.textPrimary,
        secondary: preset.textSecondary,
      },
      divider: borderColor,
    },
    typography: {
      fontFamily: uiFont,
      htmlFontSize: 16,
      h1: {
        fontFamily: headingFont,
        fontWeight: 700,
        lineHeight: 1.18,
        letterSpacing: '0.01em',
      },
      h2: {
        fontFamily: headingFont,
        fontWeight: 700,
        lineHeight: 1.22,
        letterSpacing: '0.01em',
      },
      h3: {
        fontFamily: headingFont,
        fontWeight: 600,
        lineHeight: 1.25,
      },
      h4: {
        fontFamily: headingFont,
        fontWeight: 600,
        lineHeight: 1.3,
      },
      h5: {
        fontFamily: headingFont,
        fontWeight: 600,
        lineHeight: 1.34,
      },
      h6: {
        fontFamily: headingFont,
        fontWeight: 600,
        lineHeight: 1.38,
      },
      body1: {
        fontFamily: bodyFont,
        fontSize: '1rem',
        lineHeight: 1.65,
        letterSpacing: '0.01em',
      },
      body2: {
        fontFamily: bodyFont,
        fontSize: '0.95rem',
        lineHeight: 1.58,
        letterSpacing: '0.01em',
      },
      button: {
        fontFamily: uiFont,
        textTransform: 'none',
        fontWeight: 600,
      },
      caption: {
        fontFamily: uiFont,
        fontSize: '0.82rem',
        lineHeight: 1.45,
        letterSpacing: '0.02em',
      },
      subtitle1: {
        fontFamily: uiFont,
        lineHeight: 1.5,
      },
      subtitle2: {
        fontFamily: uiFont,
        fontSize: '0.9rem',
        lineHeight: 1.45,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            scrollBehavior: 'smooth',
          },
          body: {
            backgroundColor: preset.background,
            backgroundImage: `
              ${preset.backgroundAccent},
              linear-gradient(180deg, rgba(255,255,255,0.015), rgba(255,255,255,0))
            `,
            backgroundAttachment: 'fixed',
            textRendering: 'optimizeLegibility',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          },
          '*': {
            boxSizing: 'border-box',
          },
          '::-webkit-scrollbar': {
            width: 10,
            height: 10,
          },
          '::-webkit-scrollbar-thumb': {
            background: alpha(accentMainSoft, 0.34),
            borderRadius: 999,
          },
          '::-webkit-scrollbar-track': {
            background: 'rgba(255,255,255,0.04)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: paperBackground,
            ...panelPattern,
            backdropFilter: blurAmount ? `blur(${blurAmount}px)` : 'none',
            border: `1px solid ${borderColor}`,
            transition: transitionDuration ? `background-color ${transitionDuration}ms ease, border-color ${transitionDuration}ms ease, transform ${transitionDuration}ms ease` : 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: paperBackground,
            ...cardPattern,
            backdropFilter: blurAmount ? `blur(${blurAmount}px)` : 'none',
            border: `1px solid ${borderColor}`,
            boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
            transition: transitionDuration ? `background-color ${transitionDuration}ms ease, border-color ${transitionDuration}ms ease, transform ${transitionDuration}ms ease, box-shadow ${transitionDuration}ms ease` : 'none',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            backgroundColor: paperBackground,
            backdropFilter: blurAmount ? `blur(${blurAmount}px)` : 'none',
            border: `1px solid ${borderColor}`,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: `rgba(${preset.panelBaseRgb}, ${Math.min(panelOpacity, 0.88)})`,
            backdropFilter: blurAmount ? `blur(${blurAmount}px)` : 'none',
            borderBottom: `1px solid ${borderColor}`,
            boxShadow: 'none',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            backgroundColor: `rgba(${preset.panelBaseRgb}, ${Math.min(panelOpacity, 0.9)})`,
            backdropFilter: blurAmount ? `blur(${blurAmount}px)` : 'none',
            borderRight: `1px solid ${borderColor}`,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: Math.max(10, preferences.borderRadius - 2),
            transition: transitionDuration ? `all ${transitionDuration}ms ease` : 'none',
          },
          contained: {
            background: `linear-gradient(180deg, ${accentMainSoft}, ${accentStrongSoft})`,
            color: preset.textPrimary,
            boxShadow: `0 6px 16px ${alpha(accentMainSoft, 0.18)}`,
            '&:hover': {
              background: `linear-gradient(180deg, ${accentStrongSoft}, ${accentMainSoft})`,
              boxShadow: `0 8px 20px ${alpha(accentMainSoft, 0.22)}`,
            },
          },
          outlined: {
            borderColor: alpha(accentMainSoft, 0.3),
            color: preset.textPrimary,
            backgroundColor: alpha(preset.textPrimary, 0.02),
            '&:hover': {
              borderColor: alpha(accentMainSoft, 0.42),
              backgroundColor: alpha(accentMainSoft, 0.07),
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: preset.textSecondary,
            transition: transitionDuration ? `all ${transitionDuration}ms ease` : 'none',
            '&:hover': {
              backgroundColor: alpha(accentMainSoft, 0.08),
              color: preset.textPrimary,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            backgroundColor: alpha(preset.textPrimary, 0.06),
            border: `1px solid ${alpha(accentMainSoft, 0.14)}`,
            color: preset.textSecondary,
            transition: transitionDuration ? `all ${transitionDuration}ms ease` : 'none',
          },
          filled: {
            backgroundColor: alpha(accentMainSoft, 0.13),
            color: preset.textPrimary,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: softBackground,
            backdropFilter: blurAmount ? `blur(${Math.max(0, blurAmount - 4)}px)` : 'none',
            transition: transitionDuration ? `all ${transitionDuration}ms ease` : 'none',
            '& fieldset': {
              borderColor: alpha(preset.textPrimary, 0.12),
            },
            '&:hover fieldset': {
              borderColor: alpha(accentMainSoft, 0.24),
            },
            '&.Mui-focused fieldset': {
              borderColor: accentMainSoft,
              boxShadow: `0 0 0 3px ${alpha(accentMainSoft, 0.1)}`,
            },
          },
          input: {
            color: preset.textPrimary,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: `rgba(${preset.panelBaseRgb}, 0.96)`,
            border: `1px solid ${borderColor}`,
            color: preset.textPrimary,
            backdropFilter: blurAmount ? `blur(${blurAmount}px)` : 'none',
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: borderColor,
          },
        },
      },
    },
  });
};