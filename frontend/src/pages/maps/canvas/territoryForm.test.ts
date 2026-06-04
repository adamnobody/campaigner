import { describe, expect, it } from 'vitest';
import type { CanvasObject } from '@/api/canvas';
import {
  applyTerritoryFormToObject,
  buildTerritoryCreateInput,
  DEFAULT_TERRITORY_FORM,
  territoryFormFromObject,
  territoryRingsFromObject,
  territoryTotalPointCount,
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
    });
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
    expect(input.contentJson).toMatchObject({ factionId: 9 });
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
