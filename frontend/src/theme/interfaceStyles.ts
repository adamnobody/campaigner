import type {
  AccentGlow,
  AppearanceFontMode,
  AppearanceMotionMode,
  AppearanceUiDensity,
  BackgroundTone,
  ReadingLineHeight,
} from './appearanceTokens';

export type InterfaceStyleId =
  | 'dark-fantasy'
  | 'high-fantasy'
  | 'sci-fi'
  | 'cyberpunk'
  | 'solarpunk'
  | 'steampunk'
  | 'noir-detective'
  | 'arcane-mystic'
  | 'imperial-chronicle'
  | 'industrial-brutal'
  | 'holographic'
  | 'scholar-manuscript';

export type InterfaceStyleDefaults = {
  backgroundTone: BackgroundTone;
  accentGlow: AccentGlow;
  fontMode: AppearanceFontMode;
  fontPresetId: string;
  uiDensity: AppearanceUiDensity;
  motionMode: AppearanceMotionMode;
  readingFontSize: number;
  readingLineHeight: ReadingLineHeight;
  readingColumnWidth: 620 | 760 | 900;
};

export type PaletteCompatibility = 'ideal' | 'good' | 'experimental';

export type InterfaceStyleProfile = {
  id: InterfaceStyleId;
  label: string;
  shortDescription: string;
  spotlight: string;
  recommendedPalettes: string[];
  compatiblePalettes: string[];
  defaults: InterfaceStyleDefaults;
};

export const INTERFACE_STYLE_ORDER: InterfaceStyleId[] = [
  'dark-fantasy',
  'high-fantasy',
  'sci-fi',
  'cyberpunk',
  'solarpunk',
  'steampunk',
  'noir-detective',
  'arcane-mystic',
  'imperial-chronicle',
  'industrial-brutal',
  'holographic',
  'scholar-manuscript',
];

export const INTERFACE_STYLE_PROFILES: Record<InterfaceStyleId, InterfaceStyleProfile> = {
  'dark-fantasy': {
    id: 'dark-fantasy',
    label: 'Dark Fantasy',
    shortDescription: 'Dark cinematic style tailored for lore and maps.',
    spotlight: 'Deep shadows, serif headlines, and a soft gold accent.',
    recommendedPalettes: ['obsidian-gold', 'brass-smoke'],
    compatiblePalettes: ['ember-crimson', 'royal-violet', 'deep-amber'],
    defaults: {
      backgroundTone: 'ink',
      accentGlow: 'soft',
      fontMode: 'serif',
      fontPresetId: 'lore-serif',
      uiDensity: 'comfortable',
      motionMode: 'full',
      readingFontSize: 16,
      readingLineHeight: 'normal',
      readingColumnWidth: 760,
    },
  },
  'high-fantasy': {
    id: 'high-fantasy',
    label: 'High Fantasy',
    shortDescription: 'Brighter epic look with a legendary atmosphere.',
    spotlight: 'Airy panels, soft glows, and vivid typography.',
    recommendedPalettes: ['moonstone-silver', 'parchment-ivory'],
    compatiblePalettes: ['obsidian-gold', 'sable-rose', 'deep-amber'],
    defaults: {
      backgroundTone: 'graphite',
      accentGlow: 'soft',
      fontMode: 'serif',
      fontPresetId: 'lore-serif',
      uiDensity: 'spacious',
      motionMode: 'full',
      readingFontSize: 17,
      readingLineHeight: 'loose',
      readingColumnWidth: 760,
    },
  },
  'sci-fi': {
    id: 'sci-fi',
    label: 'Sci-Fi',
    shortDescription: 'Clean tech UI for analytics and data.',
    spotlight: 'Geometry, crisp edges, and restrained motion.',
    recommendedPalettes: ['midnight-cyan', 'storm-indigo'],
    compatiblePalettes: ['ashen-teal', 'moonstone-silver', 'neon-magenta'],
    defaults: {
      backgroundTone: 'blue',
      accentGlow: 'none',
      fontMode: 'custom',
      fontPresetId: 'clean-sans',
      uiDensity: 'comfortable',
      motionMode: 'reduced',
      readingFontSize: 15,
      readingLineHeight: 'tight',
      readingColumnWidth: 760,
    },
  },
  cyberpunk: {
    id: 'cyberpunk',
    label: 'Cyberpunk',
    shortDescription: 'High contrast, neon, and aggressive accents.',
    spotlight: 'Bright signals, tight grids, and tense visual rhythm.',
    recommendedPalettes: ['neon-magenta', 'royal-violet'],
    compatiblePalettes: ['storm-indigo', 'ember-crimson', 'midnight-cyan'],
    defaults: {
      backgroundTone: 'ink',
      accentGlow: 'strong',
      fontMode: 'custom',
      fontPresetId: 'technical-mono',
      uiDensity: 'compact',
      motionMode: 'full',
      readingFontSize: 15,
      readingLineHeight: 'tight',
      readingColumnWidth: 760,
    },
  },
  solarpunk: {
    id: 'solarpunk',
    label: 'Solarpunk',
    shortDescription: 'Optimistic eco-tech with gentle futurism.',
    spotlight: 'Natural tones, airy grids, and calm dynamics.',
    recommendedPalettes: ['verdant-lime', 'forest-emerald'],
    compatiblePalettes: ['ashen-teal', 'midnight-cyan', 'moonstone-silver'],
    defaults: {
      backgroundTone: 'warm',
      accentGlow: 'soft',
      fontMode: 'sans',
      fontPresetId: 'clean-sans',
      uiDensity: 'spacious',
      motionMode: 'reduced',
      readingFontSize: 16,
      readingLineHeight: 'normal',
      readingColumnWidth: 760,
    },
  },
  steampunk: {
    id: 'steampunk',
    label: 'Steampunk',
    shortDescription: 'Industrial retro aesthetics and tactile textures.',
    spotlight: 'Brass accents, dense panels, and clear outlines.',
    recommendedPalettes: ['brass-smoke', 'deep-amber'],
    compatiblePalettes: ['obsidian-gold', 'ember-crimson', 'sable-rose'],
    defaults: {
      backgroundTone: 'warm',
      accentGlow: 'soft',
      fontMode: 'custom',
      fontPresetId: 'archive-pair',
      uiDensity: 'comfortable',
      motionMode: 'reduced',
      readingFontSize: 16,
      readingLineHeight: 'normal',
      readingColumnWidth: 760,
    },
  },
  'noir-detective': {
    id: 'noir-detective',
    label: 'Noir Detective',
    shortDescription: 'Strict dark minimalism focused on content.',
    spotlight: 'Near-monochrome, low noise, and firm contrast.',
    recommendedPalettes: ['moonstone-silver', 'ashen-teal'],
    compatiblePalettes: ['obsidian-gold', 'storm-indigo', 'parchment-ivory'],
    defaults: {
      backgroundTone: 'graphite',
      accentGlow: 'none',
      fontMode: 'sans',
      fontPresetId: 'clean-sans',
      uiDensity: 'compact',
      motionMode: 'reduced',
      readingFontSize: 15,
      readingLineHeight: 'normal',
      readingColumnWidth: 620,
    },
  },
  'arcane-mystic': {
    id: 'arcane-mystic',
    label: 'Arcane Mystic',
    shortDescription: 'Mystical look with glow and soft gradients.',
    spotlight: 'Violet–azure glows and smooth highlights.',
    recommendedPalettes: ['royal-violet', 'neon-magenta'],
    compatiblePalettes: ['midnight-cyan', 'sable-rose', 'storm-indigo'],
    defaults: {
      backgroundTone: 'blue',
      accentGlow: 'strong',
      fontMode: 'serif',
      fontPresetId: 'lore-serif',
      uiDensity: 'comfortable',
      motionMode: 'full',
      readingFontSize: 16,
      readingLineHeight: 'loose',
      readingColumnWidth: 760,
    },
  },
  'imperial-chronicle': {
    id: 'imperial-chronicle',
    label: 'Imperial Chronicle',
    shortDescription: 'Formal archival style for an in-world encyclopedia.',
    spotlight: 'Readable, neat borders, and steady rhythm.',
    recommendedPalettes: ['parchment-ivory', 'obsidian-gold'],
    compatiblePalettes: ['moonstone-silver', 'deep-amber', 'sable-rose'],
    defaults: {
      backgroundTone: 'warm',
      accentGlow: 'soft',
      fontMode: 'custom',
      fontPresetId: 'archive-pair',
      uiDensity: 'comfortable',
      motionMode: 'reduced',
      readingFontSize: 17,
      readingLineHeight: 'normal',
      readingColumnWidth: 760,
    },
  },
  'industrial-brutal': {
    id: 'industrial-brutal',
    label: 'Industrial Brutal',
    shortDescription: 'Utilitarian dense UI without ornament.',
    spotlight: 'Solid blocks, minimal rounding, and clear hierarchy.',
    recommendedPalettes: ['brass-smoke', 'ember-crimson'],
    compatiblePalettes: ['deep-amber', 'ashen-teal', 'storm-indigo'],
    defaults: {
      backgroundTone: 'graphite',
      accentGlow: 'none',
      fontMode: 'custom',
      fontPresetId: 'clean-sans',
      uiDensity: 'compact',
      motionMode: 'reduced',
      readingFontSize: 14,
      readingLineHeight: 'tight',
      readingColumnWidth: 620,
    },
  },
  holographic: {
    id: 'holographic',
    label: 'Holographic',
    shortDescription: 'Glass panels with cool shimmer and depth.',
    spotlight: 'Translucent layers and contour UI accents.',
    recommendedPalettes: ['midnight-cyan', 'neon-magenta'],
    compatiblePalettes: ['moonstone-silver', 'storm-indigo', 'royal-violet'],
    defaults: {
      backgroundTone: 'blue',
      accentGlow: 'strong',
      fontMode: 'custom',
      fontPresetId: 'technical-mono',
      uiDensity: 'comfortable',
      motionMode: 'full',
      readingFontSize: 15,
      readingLineHeight: 'normal',
      readingColumnWidth: 760,
    },
  },
  'scholar-manuscript': {
    id: 'scholar-manuscript',
    label: 'Scholar Manuscript',
    shortDescription: 'Calm document style for reading and notes.',
    spotlight: 'Warm tone, moderate contrast, and minimal motion.',
    recommendedPalettes: ['parchment-ivory', 'deep-amber'],
    compatiblePalettes: ['moonstone-silver', 'obsidian-gold', 'forest-emerald'],
    defaults: {
      backgroundTone: 'warm',
      accentGlow: 'none',
      fontMode: 'custom',
      fontPresetId: 'archive-pair',
      uiDensity: 'spacious',
      motionMode: 'reduced',
      readingFontSize: 18,
      readingLineHeight: 'loose',
      readingColumnWidth: 900,
    },
  },
};

export const getRecommendedPaletteForStyle = (styleId: InterfaceStyleId): string =>
  INTERFACE_STYLE_PROFILES[styleId].recommendedPalettes[0] || 'obsidian-gold';

export const PALETTE_STYLE_MATCH: Record<string, InterfaceStyleId> = {
  'obsidian-gold': 'dark-fantasy',
  'midnight-cyan': 'sci-fi',
  'royal-violet': 'arcane-mystic',
  'neon-magenta': 'cyberpunk',
  'ember-crimson': 'industrial-brutal',
  'forest-emerald': 'solarpunk',
  'verdant-lime': 'solarpunk',
  'moonstone-silver': 'high-fantasy',
  'parchment-ivory': 'scholar-manuscript',
  'sable-rose': 'imperial-chronicle',
  'deep-amber': 'steampunk',
  'brass-smoke': 'steampunk',
  'storm-indigo': 'holographic',
  'ashen-teal': 'noir-detective',
};

export const getStyleForPalette = (paletteId: string): InterfaceStyleId =>
  PALETTE_STYLE_MATCH[paletteId] || 'dark-fantasy';

export const getPaletteCompatibility = (
  styleId: InterfaceStyleId,
  paletteId: string,
): {
  level: PaletteCompatibility;
  label: string;
  hint: string;
} => {
  const profile = INTERFACE_STYLE_PROFILES[styleId];
  if (profile.recommendedPalettes.includes(paletteId)) {
    return {
      level: 'ideal',
      label: 'Perfect match',
      hint: 'This palette fully fits the selected style.',
    };
  }
  if (profile.compatiblePalettes.includes(paletteId)) {
    return {
      level: 'good',
      label: 'Good',
      hint: 'Stable pairing; the style character is preserved.',
    };
  }
  return {
    level: 'experimental',
    label: 'Experimental',
    hint: 'Works, but the style will feel unconventional.',
  };
};
