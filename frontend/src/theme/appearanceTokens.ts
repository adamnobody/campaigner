import { THEME_PRESETS, type ThemePresetDefinition } from './presets';

export type BackgroundTone = 'ink' | 'graphite' | 'warm' | 'blue';
export type AccentGlow = 'none' | 'soft' | 'strong';
export type AppearanceFontMode = 'serif' | 'sans' | 'custom';
export type AppearanceUiDensity = 'compact' | 'comfortable' | 'spacious';
export type AppearanceMotionMode = 'full' | 'reduced';
export type ReadingLineHeight = 'tight' | 'normal' | 'loose';

export interface AppearanceThemePreferences {
  interfaceStyle: string;
  themePreset: string;
  backgroundTone: BackgroundTone;
  accentGlow: AccentGlow;
  fontMode: AppearanceFontMode;
  fontPresetId: string;
  uiDensity: AppearanceUiDensity;
  motionMode: AppearanceMotionMode;
  readingFontSize: number;
  readingLineHeight: ReadingLineHeight;
  readingColumnWidth: 620 | 760 | 900;
  customColorThemes: ThemePresetDefinition[];
}

export const FONT_PRESETS = {
  'lore-serif': {
    display: '"Cormorant Garamond", "Crimson Text", Georgia, serif',
    body: '"Cormorant Garamond", "Crimson Text", Georgia, serif',
  },
  'clean-sans': {
    display: '"IBM Plex Sans", Roboto, Arial, sans-serif',
    body: '"IBM Plex Sans", Roboto, Arial, sans-serif',
  },
  'archive-pair': {
    display: '"Cormorant Garamond", "Crimson Text", Georgia, serif',
    body: '"IBM Plex Sans", Roboto, Arial, sans-serif',
  },
  'technical-mono': {
    display: '"IBM Plex Mono", ui-monospace, Consolas, monospace',
    body: '"IBM Plex Mono", ui-monospace, Consolas, monospace',
  },
} as const;

const TONE_TINT = {
  ink: '#050608',
  graphite: '#2a2d32',
  warm: '#2a1c12',
  blue: '#102437',
} as const;

const SPACING = { compact: 7, comfortable: 8, spacious: 10 } as const;
const GLOW_STRENGTH = { none: 0, soft: 0.16, strong: 0.3 } as const;
const READING_LINE_HEIGHT = { tight: 1.55, normal: 1.75, loose: 1.95 } as const;

type Rgb = [number, number, number];

const parseHex = (value: string): Rgb => {
  const normalized = value.replace('#', '');
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
};

const parseRgbTriplet = (value: string): Rgb => {
  const channels = value.split(',').map((channel) => Number.parseFloat(channel.trim()));
  return [
    Number.isFinite(channels[0]) ? channels[0] : 0,
    Number.isFinite(channels[1]) ? channels[1] : 0,
    Number.isFinite(channels[2]) ? channels[2] : 0,
  ];
};

const mixRgb = (base: Rgb, tint: Rgb, baseWeight: number): Rgb =>
  base.map((channel, index) =>
    Math.round(channel * baseWeight + tint[index] * (1 - baseWeight)),
  ) as Rgb;

const toRgb = ([red, green, blue]: Rgb) => `rgb(${red}, ${green}, ${blue})`;

function mapSurface(preset: ThemePresetDefinition, tone: BackgroundTone) {
  const panel = parseRgbTriplet(preset.panelBaseRgb);
  if (tone === 'ink') {
    return {
      base: preset.background,
      raised: toRgb(panel),
      subtle: toRgb(mixRgb(panel, parseHex('#050608'), 0.84)),
    };
  }
  const tint = parseHex(TONE_TINT[tone]);
  return {
    base: toRgb(mixRgb(parseHex(preset.background), tint, 0.72)),
    raised: toRgb(mixRgb(panel, tint, 0.78)),
    subtle: toRgb(mixRgb(panel, tint, 0.62)),
  };
}

export function mapAppearanceTokens(preferences: AppearanceThemePreferences) {
  const customPreset = preferences.customColorThemes.find(
    (preset) => preset.id === preferences.themePreset,
  );
  const preset =
    customPreset ??
    THEME_PRESETS[preferences.themePreset] ??
    THEME_PRESETS['obsidian-gold'];
  const fallbackFontId =
    preferences.fontMode === 'serif' ? 'lore-serif' : 'clean-sans';
  const fontId =
    preferences.fontMode === 'custom' ? preferences.fontPresetId : fallbackFontId;
  const fonts = FONT_PRESETS[fontId as keyof typeof FONT_PRESETS] ??
    FONT_PRESETS['lore-serif'];

  return {
    preset,
    surface: mapSurface(preset, preferences.backgroundTone),
    fonts: {
      ...fonts,
      mono: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Consolas, monospace',
    },
    spacing: SPACING[preferences.uiDensity],
    glow: {
      mode: preferences.accentGlow,
      strength: GLOW_STRENGTH[preferences.accentGlow],
    },
    motion: {
      duration: preferences.motionMode === 'reduced' ? 0 : 160,
      transition: preferences.motionMode === 'reduced'
        ? 'none'
        : '160ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
    reading: {
      fontSize: Math.min(18, Math.max(14, preferences.readingFontSize)),
      lineHeight: READING_LINE_HEIGHT[preferences.readingLineHeight],
      columnWidth: preferences.readingColumnWidth,
      fontFamily: fonts.body,
    },
  } as const;
}
