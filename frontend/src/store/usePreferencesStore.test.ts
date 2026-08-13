import { describe, expect, it } from 'vitest';
import {
  migratePreferencesState,
  removeCustomColorTheme,
  type CustomColorThemePreset,
} from './usePreferencesStore';

const palette = (id: string): CustomColorThemePreset => ({
  id,
  label: id,
  background: '#000',
  backgroundAccent: '#111',
  panelBaseRgb: '0 0 0',
  borderRgb: '20 20 20',
  textPrimary: '#fff',
  textSecondary: '#ddd',
  muted: '#999',
  accentMain: '#fc0',
  accentSoft: '#db0',
  accentStrong: '#fe0',
  success: '#0c0',
  warning: '#f90',
  error: '#f00',
});

const snapshotKeys = [
  'accentGlow',
  'backgroundTone',
  'fontMode',
  'fontPresetId',
  'interfaceStyle',
  'motionMode',
  'readingColumnWidth',
  'readingFontSize',
  'readingLineHeight',
  'themePreset',
  'uiDensity',
];

describe('migratePreferencesState', () => {
  it('preserves useful legacy preferences and defaults new fields', () => {
    const result = migratePreferencesState({
      interfaceStyle: 'sci-fi',
      themePreset: 'midnight-cyan',
      fontMode: 'sans',
      uiDensity: 'compact',
      motionMode: 'reduced',
      surfaceMode: 'glass',
      customColorThemes: [palette('custom-cyan')],
      customThemes: [],
    });

    expect(result).toMatchObject({
      interfaceStyle: 'sci-fi',
      themePreset: 'midnight-cyan',
      backgroundTone: 'ink',
      accentGlow: 'soft',
      fontMode: 'sans',
      fontPresetId: 'lore-serif',
      uiDensity: 'compact',
      motionMode: 'reduced',
      readingFontSize: 16,
      readingLineHeight: 'normal',
      readingColumnWidth: 760,
    });
    expect(result.customColorThemes).toEqual([palette('custom-cyan')]);
    expect(result).not.toHaveProperty('surfaceMode');
  });

  it('normalizes legacy saved themes to the exact scalar snapshot', () => {
    const result = migratePreferencesState({
      selectedCustomThemeId: 'saved-1',
      customThemes: [{
        id: 'saved-1',
        name: '  Reader  ',
        createdAt: '2026-08-13T00:00:00.000Z',
        settings: {
          interfaceStyle: 'scholar-manuscript',
          themePreset: 'parchment-ivory',
          fontMode: 'serif',
          uiDensity: 'spacious',
          motionMode: 'reduced',
          readingFontSize: 99,
          transparency: 0.8,
          panelPatternMode: 'dots',
        },
      }],
    });

    expect(result.selectedCustomThemeId).toBe('saved-1');
    expect(result.customThemes[0]?.name).toBe('Reader');
    expect(result.customThemes[0]?.settings).toMatchObject({
      interfaceStyle: 'scholar-manuscript',
      themePreset: 'parchment-ivory',
      fontMode: 'serif',
      uiDensity: 'spacious',
      motionMode: 'reduced',
      readingFontSize: 18,
    });
    expect(Object.keys(result.customThemes[0]?.settings ?? {}).sort()).toEqual(snapshotKeys);
  });
});

describe('removeCustomColorTheme', () => {
  it('falls back safely when deleting the active custom palette', () => {
    const state = migratePreferencesState({
      themePreset: 'custom-cyan',
      selectedCustomThemeId: 'saved-1',
      customColorThemes: [palette('custom-cyan'), palette('custom-violet')],
      customThemes: [{
        id: 'saved-1',
        name: 'Cyan',
        createdAt: '',
        settings: {
          themePreset: 'custom-cyan',
        },
      }],
    });

    const result = removeCustomColorTheme(state, 'custom-cyan');

    expect(result.themePreset).toBe('obsidian-gold');
    expect(result.selectedCustomThemeId).toBeNull();
    expect(result.customColorThemes.map(({ id }) => id)).toEqual(['custom-violet']);
    expect(result.customThemes[0]?.settings.themePreset).toBe('obsidian-gold');
  });
});
