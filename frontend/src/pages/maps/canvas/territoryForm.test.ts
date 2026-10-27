import { describe, expect, it } from 'vitest';
import type { CanvasObject } from '@/api/canvas';
import {
  applyTerritoryFormToObject,
  buildTerritoryCreateInput,
  DEFAULT_TERRITORY_FORM,
  territoryEditRingsFromObject,
  territoryFormFromObject,
  territoryRingsFromObject,
  territoryTotalPointCount,
  withTerritoryEditRings,
} from './canvasModel';

const territoryObject = (overrides: Partial<CanvasObject> = {}): CanvasObject => ({
  id: 1,
  sceneId: 10,
  layerId: 2,
  kind: 'territory',
  name: 'North',
  zIndex: 0,
  transformJson: {},
  geometryJson: {
    rings: [[{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 8 }]],
  },
  styleJson: { fill: '#aabbcc', opacity: 0.5, stroke: '#112233', strokeWidth: 3 },
  contentJson: { description: 'Desc', factionId: 7, smoothing: 0.25 },
  resourcePath: null,
  linkedNoteId: null,
  linkedSceneId: null,
  isHidden: false,
  isLocked: false,
  ...overrides,
});

describe('territoryEditRings coordinate conversion', () => {
  it('applies transform offset on read', () => {
    const obj = territoryObject({
      transformJson: { x: 10, y: 20 },
      geometryJson: { rings: [[{ x: 5, y: 5 }]] },
    });
    const rings = territoryEditRingsFromObject(obj);
    expect(rings[0][0]).toEqual({ x: 15, y: 25 });
  });

  it('subtracts transform offset on write', () => {
    const obj = territoryObject({
      transformJson: { x: 10, y: 20 },
    });
    const updated = withTerritoryEditRings(obj, [[{ x: 15, y: 25 }]]);
    const rings = territoryRingsFromObject(updated);
    expect(rings[0][0]).toEqual({ x: 5, y: 5 });
  });

  it('keeps preview and reopened edit draft aligned for moved territories', () => {
    const obj = territoryObject({
      transformJson: { x: 10, y: 20 },
      geometryJson: { rings: [[{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 }]] },
    });
    const draft = territoryEditRingsFromObject(obj);
    const preview = withTerritoryEditRings(obj, draft);
    expect(territoryRingsFromObject(preview)[0][0]).toEqual({ x: 0, y: 0 });
    expect(territoryEditRingsFromObject(preview)).toEqual(draft);
  });
});

describe('territoryFormFromObject', () => {
  it('maps canvas fields to form state', () => {
    const form = territoryFormFromObject(territoryObject());
    expect(form).toMatchObject({
      name: 'North',
      description: 'Desc',
      color: '#aabbcc',
      opacity: 0.5,
      borderColor: '#112233',
      borderWidth: 3,
      smoothing: 0.25,
      factionId: 7,
    });
  });

  it('falls back to content_json when style_json is empty', () => {
    const form = territoryFormFromObject(territoryObject({
      styleJson: {},
      contentJson: {
        description: 'Legacy',
        factionId: 5,
        fill: '#112233',
        opacity: 0.33,
        borderColor: '#445566',
        borderWidth: 5,
        smoothing: 0.5,
      },
    }));
    expect(form).toMatchObject({
      description: 'Legacy',
      color: '#112233',
      opacity: 0.33,
      borderColor: '#445566',
      borderWidth: 5,
      smoothing: 0.5,
      factionId: 5,
    });
  });
});

describe('applyTerritoryFormToObject', () => {
  it('writes name, content_json, and style_json', () => {
    const updated = applyTerritoryFormToObject(territoryObject(), {
      ...DEFAULT_TERRITORY_FORM,
      name: '  East  ',
      description: 'New',
      color: '#ff0000',
      opacity: 0.8,
      borderColor: '#00ff00',
      borderWidth: 4,
      smoothing: 0.1,
      factionId: 3,
    });
    expect(updated.name).toBe('East');
    expect(updated.contentJson).toMatchObject({
      description: 'New',
      factionId: 3,
      smoothing: 0.1,
      fill: '#ff0000',
      opacity: 0.8,
      borderColor: '#00ff00',
      borderWidth: 4,
    });
    expect(updated.geometryJson).toEqual(territoryObject().geometryJson);
    expect(updated.styleJson).toMatchObject({
      fill: '#ff0000',
      opacity: 0.8,
      stroke: '#00ff00',
      strokeWidth: 4,
    });
  });
});

describe('buildTerritoryCreateInput', () => {
  it('creates territory payload with rings and form fields', () => {
    const points = [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }];
    const input = buildTerritoryCreateInput(10, 2, [points], {
      ...DEFAULT_TERRITORY_FORM,
      name: 'Realm',
      factionId: 9,
    });
    expect(input.kind).toBe('territory');
    expect(input.name).toBe('Realm');
    expect(input.geometryJson).toEqual({ rings: [points] });
    expect(input.contentJson).toMatchObject({
      factionId: 9,
      fill: DEFAULT_TERRITORY_FORM.color,
      opacity: DEFAULT_TERRITORY_FORM.opacity,
      borderColor: DEFAULT_TERRITORY_FORM.borderColor,
      borderWidth: DEFAULT_TERRITORY_FORM.borderWidth,
      smoothing: DEFAULT_TERRITORY_FORM.smoothing,
    });
  });
});

describe('territoryRingsFromObject', () => {
  it('parses rings and counts vertices', () => {
    const object = territoryObject({
      geometryJson: {
        rings: [
          [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }],
          [{ x: 10, y: 10 }, { x: 11, y: 10 }, { x: 10, y: 11 }, { x: 9, y: 10 }],
        ],
      },
    });
    expect(territoryRingsFromObject(object)).toHaveLength(2);
    expect(territoryTotalPointCount(object)).toBe(7);
  });
});
