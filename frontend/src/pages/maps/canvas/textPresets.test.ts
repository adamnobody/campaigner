import { describe, expect, it } from 'vitest';
import {
  STANDARD_TEXT_PRESET_ID,
  STANDARD_TEXT_PRESET_STYLE,
  buildStandardTextPreset,
  createTextPresetId,
  findTextPreset,
  matchTextStylePreset,
  normalizePresetColor,
  removeTextPreset,
  resolveTextPresetStyleForCreate,
  textStyleMatchesPreset,
  upsertTextPreset,
  type MapTextStylePreset,
} from './textPresets';

const preset = (overrides: Partial<MapTextStylePreset> = {}): MapTextStylePreset => ({
  id: 'preset-1',
  name: 'Title',
  fontSize: 32,
  fill: '#ff0000',
  opacity: 0.9,
  ...overrides,
});

describe('textPresets', () => {
  it('upserts and removes presets', () => {
    const created = upsertTextPreset([], preset());
    expect(created).toHaveLength(1);
    const updated = upsertTextPreset(created, preset({ fontSize: 40 }));
    expect(updated[0].fontSize).toBe(40);
    expect(removeTextPreset(updated, 'preset-1')).toEqual([]);
  });

  it('finds preset by id and creates unique ids', () => {
    expect(findTextPreset([preset()], 'preset-1')).toEqual(preset());
    expect(findTextPreset([preset()], 'missing')).toBeNull();
    expect(typeof createTextPresetId()).toBe('string');
  });

  it('matches object style to preset and normalizes short hex colors', () => {
    const standard = buildStandardTextPreset('Standard');
    const title = preset({ fill: '#ffffff', fontSize: 36, opacity: 1 });
    expect(normalizePresetColor('#FFF')).toBe('#ffffff');
    expect(textStyleMatchesPreset({ fontSize: 36, fill: '#fff', opacity: 1 }, title)).toBe(true);
    expect(textStyleMatchesPreset({ fontSize: 28, fill: '#d20404', opacity: 1 }, title)).toBe(false);
    expect(matchTextStylePreset([title], { fontSize: 36, fill: '#ffffff', opacity: 1 }, standard)).toEqual(title);
    expect(matchTextStylePreset([title], STANDARD_TEXT_PRESET_STYLE, standard)).toEqual(standard);
    expect(matchTextStylePreset([title], { fontSize: 28, fill: '#d20404', opacity: 1 }, standard)).toBeNull();
  });

  it('resolves standard preset for create when active preset is missing', () => {
    const custom = preset({ id: 'custom', fontSize: 40, fill: '#ffffff', opacity: 0.8 });
    expect(resolveTextPresetStyleForCreate([custom], null)).toEqual(STANDARD_TEXT_PRESET_STYLE);
    expect(resolveTextPresetStyleForCreate([custom], STANDARD_TEXT_PRESET_ID)).toEqual(STANDARD_TEXT_PRESET_STYLE);
    expect(resolveTextPresetStyleForCreate([custom], 'custom')).toEqual({
      fontSize: 40,
      fill: '#ffffff',
      opacity: 0.8,
    });
    expect(findTextPreset([custom], null, buildStandardTextPreset('Standard'))?.id).toBe(STANDARD_TEXT_PRESET_ID);
  });
});
