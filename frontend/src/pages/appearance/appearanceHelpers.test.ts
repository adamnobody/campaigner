import { describe, expect, it } from 'vitest';
import {
  buildCustomColorTheme,
  getContrastRatio,
  normalizeHexColor,
  validatePaletteDraft,
} from './paletteHelpers';
import {
  createAppearanceThemeBundle,
  parseAppearanceThemeBundle,
  type AppearanceSnapshot,
} from './themeBundleSchema';

const snapshot: AppearanceSnapshot = {
  interfaceStyle: 'dark-fantasy',
  themePreset: 'obsidian-gold',
  backgroundTone: 'ink',
  accentGlow: 'soft',
  fontMode: 'serif',
  fontPresetId: 'lore-serif',
  uiDensity: 'comfortable',
  motionMode: 'full',
  readingFontSize: 15,
  readingLineHeight: 'normal',
  readingColumnWidth: 760,
};

describe('palette helpers', () => {
  it('normalizes short and long HEX colors', () => {
    expect(normalizeHexColor(' #AbC ')).toBe('#aabbcc');
    expect(normalizeHexColor('#AABBCC')).toBe('#aabbcc');
  });

  it('validates fields and computes WCAG contrast', () => {
    expect(validatePaletteDraft({
      name: 'Archive',
      background: '#111111',
      accent: '#c9a961',
      text: '#f4f4f4',
    })).toEqual({ name: true, background: true, accent: true, text: true });
    expect(getContrastRatio('#000000', '#ffffff')).toBe(21);
  });

  it('derives a complete store palette from three colors', () => {
    const palette = buildCustomColorTheme({
      name: '  Archive  ',
      background: '#123',
      accent: '#c9a961',
      text: '#ffffff',
    }, 'custom-archive');
    expect(palette).toMatchObject({
      id: 'custom-archive',
      label: 'Archive',
      background: '#112233',
      panelBaseRgb: '17, 34, 51',
      borderRgb: '201, 169, 97',
    });
  });
});

describe('appearance theme bundle schema', () => {
  it('round-trips a versioned JSON bundle', () => {
    const bundle = createAppearanceThemeBundle({
      active: snapshot,
      customThemes: [{ name: 'My archive', settings: snapshot }],
      customColorThemes: [{
        id: 'custom-archive',
        name: 'Archive',
        background: '#111111',
        accent: '#c9a961',
        text: '#f4f4f4',
      }],
    }, '2026-08-13T10:00:00.000Z');
    expect(parseAppearanceThemeBundle(JSON.stringify(bundle))).toEqual({
      success: true,
      data: bundle,
    });
  });

  it('rejects invalid versions and unsafe palette values', () => {
    const invalid = JSON.stringify({
      format: 'campaigner.appearance-theme-bundle',
      version: 2,
      exportedAt: '2026-08-13T10:00:00.000Z',
      active: snapshot,
      customThemes: [],
      customColorThemes: [{
        id: 'obsidian-gold',
        name: 'Override',
        background: 'url(file:///secret)',
        accent: '#ffffff',
        text: '#000000',
      }],
    });
    expect(parseAppearanceThemeBundle(invalid).success).toBe(false);
  });

  it('reports malformed JSON without throwing', () => {
    expect(parseAppearanceThemeBundle('{nope')).toEqual({
      success: false,
      message: 'invalid-json',
    });
  });
});
