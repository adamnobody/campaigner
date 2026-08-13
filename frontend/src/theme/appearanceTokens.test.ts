import { describe, expect, it } from 'vitest';
import { mapAppearanceTokens, type AppearanceThemePreferences } from './appearanceTokens';

const preferences: AppearanceThemePreferences = {
  interfaceStyle: 'sci-fi',
  themePreset: 'custom-test',
  backgroundTone: 'blue',
  accentGlow: 'strong',
  fontMode: 'custom',
  fontPresetId: 'technical-mono',
  uiDensity: 'compact',
  motionMode: 'reduced',
  readingFontSize: 20,
  readingLineHeight: 'tight',
  readingColumnWidth: 620,
  customColorThemes: [{
    id: 'custom-test',
    label: 'Custom test',
    background: '#000000',
    backgroundAccent: 'none',
    panelBaseRgb: '1, 2, 3',
    borderRgb: '4, 5, 6',
    textPrimary: '#ffffff',
    textSecondary: '#dddddd',
    muted: '#999999',
    accentMain: '#00aaff',
    accentSoft: '#004466',
    accentStrong: '#66ccff',
    success: '#00cc88',
    warning: '#ffaa00',
    error: '#ff3355',
  }],
};

describe('mapAppearanceTokens', () => {
  it('maps appearance preferences and custom palettes to runtime tokens', () => {
    const tokens = mapAppearanceTokens(preferences);

    expect(tokens.preset.id).toBe('custom-test');
    expect(tokens.surface).toEqual({
      base: 'rgb(4, 10, 15)',
      raised: 'rgb(4, 9, 14)',
      subtle: 'rgb(7, 15, 23)',
    });
    expect(Object.values(tokens.surface).some((value) => value.includes('color-mix'))).toBe(false);
    expect(tokens.glow.strength).toBe(0.3);
    expect(tokens.fonts.body).toContain('IBM Plex Mono');
    expect(tokens.spacing).toBe(7);
    expect(tokens.motion).toEqual({ duration: 0, transition: 'none' });
    expect(tokens.reading).toMatchObject({
      fontSize: 18,
      lineHeight: 1.55,
      columnWidth: 620,
    });
  });
});
