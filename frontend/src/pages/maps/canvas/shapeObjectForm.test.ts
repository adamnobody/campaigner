import { describe, expect, it } from 'vitest';
import type { CanvasObject } from '@/api/canvas';
import {
  applyShapeFormToObject,
  buildShapeCreateInput,
  inferShapeVariant,
  shapeFormFromObject,
  shapeLabelFromObject,
} from './shapeObjectForm';
import { shapeLabelPlacement } from './shapeLabel';

const baseObject = (patch: Partial<CanvasObject>): CanvasObject => ({
  id: 1,
  sceneId: 1,
  layerId: 1,
  kind: 'rectangle',
  name: 'Shape',
  zIndex: 0,
  transformJson: { x: 100, y: 200 },
  geometryJson: { width: 160, height: 100 },
  styleJson: { fill: '#5a7a9a', stroke: '#e8dcc8', strokeWidth: 2, opacity: 1 },
  contentJson: {},
  resourcePath: null,
  linkedNoteId: null,
  linkedSceneId: null,
  isHidden: false,
  isLocked: false,
  createdAt: '',
  updatedAt: '',
  ...patch,
});

describe('shapeObjectForm', () => {
  it('builds rectangle with label defaults', () => {
    const input = buildShapeCreateInput(1, 2, { x: 50, y: 60 }, 'rectangle');
    expect(input.kind).toBe('rectangle');
    expect(input.geometryJson).toEqual({ width: 160, height: 100 });
    expect(input.contentJson).toMatchObject({
      shapeVariant: 'rectangle',
      labelPosition: 'none',
      labelText: '',
    });
  });

  it('builds triangle as polygon preset', () => {
    const input = buildShapeCreateInput(1, 2, { x: 0, y: 0 }, 'triangle');
    expect(input.kind).toBe('polygon');
    expect((input.geometryJson as { points: unknown[] }).points).toHaveLength(3);
    expect(input.contentJson).toMatchObject({ shapeVariant: 'triangle' });
  });

  it('converts rectangle to ellipse while preserving label fields', () => {
    const object = baseObject({
      contentJson: {
        labelText: 'Gate',
        labelPosition: 'inside',
        labelFontSize: 22,
        labelColor: '#ffffff',
        shapeVariant: 'rectangle',
      },
    });
    const form = shapeFormFromObject(object);
    const updated = applyShapeFormToObject(object, { ...form, variant: 'ellipse', width: 140, height: 100 });
    expect(updated.kind).toBe('ellipse');
    expect(updated.geometryJson).toEqual({ radiusX: 70, radiusY: 50 });
    expect(shapeLabelFromObject(updated)).toMatchObject({
      labelText: 'Gate',
      labelPosition: 'inside',
      labelFontSize: 22,
      labelColor: '#ffffff',
    });
  });

  it('infers triangle from stored variant', () => {
    const object = baseObject({
      kind: 'polygon',
      geometryJson: {
        points: [{ x: 80, y: 0 }, { x: 160, y: 100 }, { x: 0, y: 100 }],
      },
      contentJson: { shapeVariant: 'triangle' },
    });
    expect(inferShapeVariant(object)).toBe('triangle');
  });

  it('defaults missing label fields to none', () => {
    expect(shapeLabelFromObject(baseObject({}))).toMatchObject({
      labelText: '',
      labelPosition: 'none',
    });
  });
});

describe('shapeLabel', () => {
  it('returns null when label is disabled', () => {
    expect(shapeLabelPlacement(baseObject({}))).toBeNull();
  });

  it('places inside label at shape center', () => {
    const placement = shapeLabelPlacement(baseObject({
      contentJson: {
        labelText: 'Room',
        labelPosition: 'inside',
        labelFontSize: 20,
        labelColor: '#fff',
      },
    }));
    expect(placement).toMatchObject({ x: 80, y: 50, text: 'Room', fontSize: 20 });
  });

  it('places above label outside top edge', () => {
    const placement = shapeLabelPlacement(baseObject({
      contentJson: {
        labelText: 'North',
        labelPosition: 'above',
        labelFontSize: 16,
      },
    }));
    expect(placement?.y).toBeLessThan(0);
  });
});
