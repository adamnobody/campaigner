import type { CustomColorThemePreset } from '@/store/usePreferencesStore';

export const HEX_COLOR_PATTERN = /^#[\da-f]{6}$/i;

export type PaletteDraft = {
  name: string;
  background: string;
  accent: string;
  text: string;
};

export type PortablePalette = PaletteDraft & {
  id: string;
};

export const DEFAULT_PALETTE_DRAFT: PaletteDraft = {
  name: '',
  background: '#0f172a',
  accent: '#4f46e5',
  text: '#f8fafc',
};

export const QUICK_PALETTES: Array<PaletteDraft & { id: string }> = [
  { id: 'royal', name: 'Royal', background: '#0f172a', accent: '#4f46e5', text: '#f8fafc' },
  { id: 'emerald', name: 'Emerald', background: '#0e1a17', accent: '#2fa37a', text: '#f2f7f4' },
  { id: 'rose', name: 'Rose', background: '#1b1216', accent: '#d4657f', text: '#faf3f5' },
  { id: 'amber', name: 'Amber', background: '#1a1510', accent: '#d99a3c', text: '#faf6ee' },
  { id: 'slate', name: 'Slate', background: '#12151a', accent: '#8a97a8', text: '#f4f6f8' },
];

export const normalizeHexColor = (value: string): string => {
  const trimmed = value.trim();
  const short = trimmed.match(/^#([\da-f])([\da-f])([\da-f])$/i);
  if (short) {
    return `#${short.slice(1).map((part) => `${part}${part}`).join('').toLowerCase()}`;
  }
  return HEX_COLOR_PATTERN.test(trimmed) ? trimmed.toLowerCase() : trimmed;
};

export const hexToRgbTriplet = (value: string): string => {
  const hex = normalizeHexColor(value);
  if (!HEX_COLOR_PATTERN.test(hex)) return '128, 128, 128';
  return [1, 3, 5]
    .map((index) => Number.parseInt(hex.slice(index, index + 2), 16))
    .join(', ');
};

const luminance = (value: string): number | null => {
  const hex = normalizeHexColor(value);
  if (!HEX_COLOR_PATTERN.test(hex)) return null;
  const channels = [1, 3, 5].map((index) => {
    const channel = Number.parseInt(hex.slice(index, index + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

export const getContrastRatio = (left: string, right: string): number | null => {
  const leftLuminance = luminance(left);
  const rightLuminance = luminance(right);
  if (leftLuminance === null || rightLuminance === null) return null;
  const lighter = Math.max(leftLuminance, rightLuminance);
  const darker = Math.min(leftLuminance, rightLuminance);
  return (lighter + 0.05) / (darker + 0.05);
};

export const validatePaletteDraft = (draft: PaletteDraft) => ({
  name: draft.name.trim().length > 0 && draft.name.trim().length <= 80,
  background: HEX_COLOR_PATTERN.test(normalizeHexColor(draft.background)),
  accent: HEX_COLOR_PATTERN.test(normalizeHexColor(draft.accent)),
  text: HEX_COLOR_PATTERN.test(normalizeHexColor(draft.text)),
});

export const buildCustomColorTheme = (
  draft: PaletteDraft,
  id: string,
): CustomColorThemePreset => {
  const background = normalizeHexColor(draft.background);
  const accent = normalizeHexColor(draft.accent);
  const text = normalizeHexColor(draft.text);
  const accentRgb = hexToRgbTriplet(accent);
  const textRgb = hexToRgbTriplet(text);

  return {
    id,
    label: draft.name.trim(),
    background,
    backgroundAccent: `radial-gradient(circle at top left, rgba(${accentRgb}, 0.2), transparent 34%)`,
    panelBaseRgb: hexToRgbTriplet(background),
    borderRgb: accentRgb,
    textPrimary: text,
    textSecondary: `rgba(${textRgb}, 0.8)`,
    muted: `rgba(${textRgb}, 0.44)`,
    accentMain: accent,
    accentSoft: `rgba(${accentRgb}, 0.18)`,
    accentStrong: accent,
    success: '#7BD88F',
    warning: '#F6C177',
    error: '#FF7A7A',
  };
};

export const toPortablePalette = (palette: CustomColorThemePreset): PortablePalette => ({
  id: palette.id,
  name: palette.label,
  background: normalizeHexColor(palette.background),
  accent: normalizeHexColor(palette.accentMain),
  text: normalizeHexColor(palette.textPrimary),
});
