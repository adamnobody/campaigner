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

type SurfaceMode = 'glass' | 'solid';
type FontMode = 'serif' | 'sans' | 'custom';
type UiDensity = 'compact' | 'comfortable' | 'spacious';
type MotionMode = 'full' | 'reduced';
type PatternMode = 'none' | 'dots' | 'grid' | 'diagonal' | 'custom';

export type InterfaceStyleDefaults = {
  surfaceMode: SurfaceMode;
  fontMode: FontMode;
  customFontCssUrl: string;
  customBodyFontFamily: string;
  customHeadingFontFamily: string;
  uiDensity: UiDensity;
  motionMode: MotionMode;
  transparency: number;
  blur: number;
  borderRadius: number;
  panelPatternMode: PatternMode;
  panelPatternOpacity: number;
  panelPatternSize: number;
  cardPatternMode: PatternMode;
  cardPatternOpacity: number;
  cardPatternSize: number;
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
      surfaceMode: 'glass',
      fontMode: 'custom',
      customFontCssUrl: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;800&family=Cormorant+Garamond:wght@400;500;600;700&display=swap',
      customBodyFontFamily: '"Cormorant Garamond", "Crimson Text", serif',
      customHeadingFontFamily: '"Cinzel", serif',
      uiDensity: 'comfortable',
      motionMode: 'full',
      transparency: 0.72,
      blur: 14,
      borderRadius: 14,
      panelPatternMode: 'none',
      panelPatternOpacity: 0.12,
      panelPatternSize: 28,
      cardPatternMode: 'none',
      cardPatternOpacity: 0.1,
      cardPatternSize: 22,
    },
  },
  'high-fantasy': {
    id: 'high-fantasy',
    label: 'High Fantasy',
    shortDescription: 'Brighter epic look with a legendary atmosphere.',
    spotlight: 'Airy panels, soft glows, and expressive typography.',
    recommendedPalettes: ['moonstone-silver', 'parchment-ivory'],
    compatiblePalettes: ['obsidian-gold', 'sable-rose', 'deep-amber'],
    defaults: {
      surfaceMode: 'glass',
      fontMode: 'custom',
      customFontCssUrl: 'https://fonts.googleapis.com/css2?family=Marcellus&family=EB+Garamond:wght@400;500;600;700&display=swap',
      customBodyFontFamily: '"EB Garamond", "Crimson Text", serif',
      customHeadingFontFamily: '"Marcellus", "Cinzel", serif',
      uiDensity: 'spacious',
      motionMode: 'full',
      transparency: 0.78,
      blur: 12,
      borderRadius: 16,
      panelPatternMode: 'dots',
      panelPatternOpacity: 0.09,
      panelPatternSize: 32,
      cardPatternMode: 'none',
      cardPatternOpacity: 0.08,
      cardPatternSize: 24,
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
      surfaceMode: 'solid',
      fontMode: 'custom',
      customFontCssUrl: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;800&family=Rajdhani:wght@400;500;600;700&display=swap',
      customBodyFontFamily: '"Rajdhani", "Inter", sans-serif',
      customHeadingFontFamily: '"Orbitron", "Rajdhani", sans-serif',
      uiDensity: 'comfortable',
      motionMode: 'reduced',
      transparency: 0.9,
      blur: 2,
      borderRadius: 10,
      panelPatternMode: 'grid',
      panelPatternOpacity: 0.1,
      panelPatternSize: 22,
      cardPatternMode: 'grid',
      cardPatternOpacity: 0.08,
      cardPatternSize: 20,
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
      surfaceMode: 'glass',
      fontMode: 'custom',
      customFontCssUrl: 'https://fonts.googleapis.com/css2?family=Oxanium:wght@400;500;600;700&family=Exo+2:wght@400;500;600;700&display=swap',
      customBodyFontFamily: '"Exo 2", "Inter", sans-serif',
      customHeadingFontFamily: '"Oxanium", "Exo 2", sans-serif',
      uiDensity: 'compact',
      motionMode: 'full',
      transparency: 0.66,
      blur: 16,
      borderRadius: 10,
      panelPatternMode: 'grid',
      panelPatternOpacity: 0.16,
      panelPatternSize: 18,
      cardPatternMode: 'diagonal',
      cardPatternOpacity: 0.15,
      cardPatternSize: 16,
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
      surfaceMode: 'glass',
      fontMode: 'custom',
      customFontCssUrl: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Nunito:wght@400;500;700&display=swap',
      customBodyFontFamily: '"Nunito", "Inter", sans-serif',
      customHeadingFontFamily: '"Manrope", "Nunito", sans-serif',
      uiDensity: 'spacious',
      motionMode: 'reduced',
      transparency: 0.8,
      blur: 8,
      borderRadius: 18,
      panelPatternMode: 'dots',
      panelPatternOpacity: 0.08,
      panelPatternSize: 34,
      cardPatternMode: 'none',
      cardPatternOpacity: 0.06,
      cardPatternSize: 26,
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
      surfaceMode: 'solid',
      fontMode: 'custom',
      customFontCssUrl: 'https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Crimson+Text:wght@400;600;700&display=swap',
      customBodyFontFamily: '"Crimson Text", "Georgia", serif',
      customHeadingFontFamily: '"Cinzel Decorative", "Cinzel", serif',
      uiDensity: 'comfortable',
      motionMode: 'reduced',
      transparency: 0.92,
      blur: 0,
      borderRadius: 8,
      panelPatternMode: 'diagonal',
      panelPatternOpacity: 0.12,
      panelPatternSize: 24,
      cardPatternMode: 'dots',
      cardPatternOpacity: 0.1,
      cardPatternSize: 18,
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
      surfaceMode: 'solid',
      fontMode: 'custom',
      customFontCssUrl: 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@400;500;600;700&display=swap',
      customBodyFontFamily: '"Source Sans 3", "Inter", sans-serif',
      customHeadingFontFamily: '"Libre Baskerville", "Georgia", serif',
      uiDensity: 'compact',
      motionMode: 'reduced',
      transparency: 0.95,
      blur: 0,
      borderRadius: 8,
      panelPatternMode: 'none',
      panelPatternOpacity: 0.06,
      panelPatternSize: 20,
      cardPatternMode: 'none',
      cardPatternOpacity: 0.06,
      cardPatternSize: 18,
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
      surfaceMode: 'glass',
      fontMode: 'custom',
      customFontCssUrl: 'https://fonts.googleapis.com/css2?family=Spectral:wght@400;500;600;700&family=Philosopher:wght@400;700&display=swap',
      customBodyFontFamily: '"Spectral", "Crimson Text", serif',
      customHeadingFontFamily: '"Philosopher", "Cinzel", serif',
      uiDensity: 'comfortable',
      motionMode: 'full',
      transparency: 0.74,
      blur: 16,
      borderRadius: 16,
      panelPatternMode: 'dots',
      panelPatternOpacity: 0.11,
      panelPatternSize: 30,
      cardPatternMode: 'none',
      cardPatternOpacity: 0.08,
      cardPatternSize: 24,
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
      surfaceMode: 'solid',
      fontMode: 'custom',
      customFontCssUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Serif+4:wght@400;500;600&display=swap',
      customBodyFontFamily: '"Source Serif 4", "Crimson Text", serif',
      customHeadingFontFamily: '"Playfair Display", "Cinzel", serif',
      uiDensity: 'comfortable',
      motionMode: 'reduced',
      transparency: 0.94,
      blur: 0,
      borderRadius: 10,
      panelPatternMode: 'grid',
      panelPatternOpacity: 0.08,
      panelPatternSize: 26,
      cardPatternMode: 'none',
      cardPatternOpacity: 0.08,
      cardPatternSize: 22,
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
      surfaceMode: 'solid',
      fontMode: 'custom',
      customFontCssUrl: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans+Condensed:wght@400;500;600&display=swap',
      customBodyFontFamily: '"IBM Plex Sans Condensed", "Inter", sans-serif',
      customHeadingFontFamily: '"Space Grotesk", "Inter", sans-serif',
      uiDensity: 'compact',
      motionMode: 'reduced',
      transparency: 0.96,
      blur: 0,
      borderRadius: 6,
      panelPatternMode: 'diagonal',
      panelPatternOpacity: 0.14,
      panelPatternSize: 14,
      cardPatternMode: 'grid',
      cardPatternOpacity: 0.1,
      cardPatternSize: 16,
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
      surfaceMode: 'glass',
      fontMode: 'custom',
      customFontCssUrl: 'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Chakra+Petch:wght@400;500;600;700&display=swap',
      customBodyFontFamily: '"Sora", "Inter", sans-serif',
      customHeadingFontFamily: '"Chakra Petch", "Sora", sans-serif',
      uiDensity: 'comfortable',
      motionMode: 'full',
      transparency: 0.68,
      blur: 18,
      borderRadius: 18,
      panelPatternMode: 'grid',
      panelPatternOpacity: 0.09,
      panelPatternSize: 28,
      cardPatternMode: 'dots',
      cardPatternOpacity: 0.08,
      cardPatternSize: 24,
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
      surfaceMode: 'solid',
      fontMode: 'custom',
      customFontCssUrl: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Merriweather:wght@400;700&display=swap',
      customBodyFontFamily: '"Lora", "Crimson Text", serif',
      customHeadingFontFamily: '"Merriweather", "Lora", serif',
      uiDensity: 'spacious',
      motionMode: 'reduced',
      transparency: 0.93,
      blur: 0,
      borderRadius: 12,
      panelPatternMode: 'none',
      panelPatternOpacity: 0.06,
      panelPatternSize: 24,
      cardPatternMode: 'none',
      cardPatternOpacity: 0.06,
      cardPatternSize: 22,
    },
  },
};

export const getRecommendedPaletteForStyle = (styleId: InterfaceStyleId): string => {
  const profile = INTERFACE_STYLE_PROFILES[styleId];
  return profile.recommendedPalettes[0] || 'obsidian-gold';
};

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

export const getStyleForPalette = (paletteId: string): InterfaceStyleId => {
  return PALETTE_STYLE_MATCH[paletteId] || 'dark-fantasy';
};

export const getPaletteCompatibility = (
  styleId: InterfaceStyleId,
  paletteId: string
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
