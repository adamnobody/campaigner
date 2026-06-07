import { describe, expect, it } from 'vitest';
import type { CanvasObject } from '@/api/canvas';
import {
  applyTextContentToObject,
  applyTextFormToObject,
  applyTextStylePreset,
  curveTextGeometryFromObject,
  resolveTextContent,
  textFormFromObject,
} from './textObjectForm';
import type { MapTextStylePreset } from './textPresets';

const curveObject = (overrides: Partial<CanvasObject> = {}): CanvasObject => ({
  id: 2,
  sceneId: 1,
  layerId: 1,
  kind: 'curve_text',
  name: 'Curve text',
  zIndex: 0,
  transformJson: { x: 0, y: 0 },
  geometryJson: {
    start: { x: 0, y: 0 },
    control: { x: 140, y: -80 },
    end: { x: 280, y: 0 },
  },
  styleJson: { fill: '#aabbcc', fontSize: 24 },
  contentJson: { text: 'Arc' },
  resourcePath: null,
  linkedNoteId: null,
  linkedSceneId: null,
  isHidden: false,
  isLocked: false,
  ...overrides,
});

const baseObject = (overrides: Partial<CanvasObject> = {}): CanvasObject => ({
  id: 1,
  sceneId: 1,
  layerId: 1,
  kind: 'text',
  name: 'Text',
  zIndex: 0,
  transformJson: { x: 10, y: 20, rotation: 15, scaleX: 1, scaleY: 1 },
  geometryJson: { width: 160, height: 48 },
  styleJson: { fill: '#aabbcc', fontSize: 22, opacity: 0.8, stroke: '#112233' },
  contentJson: { text: 'Hello', note: 'keep-me' },
  resourcePath: null,
  linkedNoteId: 5,
  linkedSceneId: 9,
  isHidden: false,
  isLocked: false,
  ...overrides,
});

describe('resolveTextContent', () => {
  it('prefers content_json.text and falls back to label then name', () => {
    expect(resolveTextContent(baseObject())).toBe('Hello');
    expect(resolveTextContent(baseObject({ contentJson: { label: 'Legacy' } }))).toBe('Legacy');
    expect(resolveTextContent(baseObject({ contentJson: {}, name: 'Fallback' }))).toBe('Fallback');
  });
});

describe('textFormFromObject', () => {
  it('reads shared text fields from object', () => {
    expect(textFormFromObject(baseObject())).toEqual({
      text: 'Hello',
      fontSize: 22,
      fill: '#aabbcc',
      opacity: 0.8,
      x: 10,
      y: 20,
      rotation: 15,
    });
  });
});

describe('applyTextContentToObject', () => {
  it('updates content and name while preserving style and geometry', () => {
    const updated = applyTextContentToObject(baseObject(), 'New canvas label');
    expect(updated.contentJson).toMatchObject({ text: 'New canvas label', note: 'keep-me' });
    expect(updated.name).toBe('New canvas label');
    expect(updated.styleJson).toEqual(baseObject().styleJson);
    expect(updated.geometryJson).toEqual(baseObject().geometryJson);
  });
});

describe('applyTextStylePreset', () => {
  it('applies preset style without touching content', () => {
    const stylePreset: MapTextStylePreset = {
      id: 'preset-1',
      name: 'Title',
      fontSize: 36,
      fill: '#112233',
      opacity: 0.75,
    };
    const updated = applyTextStylePreset(baseObject(), stylePreset);
    expect(updated.styleJson).toMatchObject({ fontSize: 36, fill: '#112233', opacity: 0.75 });
    expect(updated.contentJson).toEqual(baseObject().contentJson);
  });
});

describe('applyTextFormToObject', () => {
  it('preserves unrelated content/style/geometry and linked ids for text', () => {
    const updated = applyTextFormToObject(baseObject(), {
      text: 'Updated label',
      fontSize: 30,
      fill: '#ffffff',
      opacity: 0.5,
      x: 40,
      y: 50,
      rotation: 0,
    });

    expect(updated.kind).toBe('text');
    expect(updated.linkedNoteId).toBe(5);
    expect(updated.linkedSceneId).toBe(9);
    expect(updated.contentJson).toMatchObject({ text: 'Updated label', note: 'keep-me' });
    expect(updated.styleJson).toMatchObject({ fill: '#ffffff', fontSize: 30, opacity: 0.5, stroke: '#112233' });
    expect(updated.geometryJson).toEqual({ width: 160, height: 48 });
    expect(updated.name).toBe('Updated label');
  });

  it('preserves curve geometry when inspector updates content/style only', () => {
    const curve = curveObject();
    const updated = applyTextFormToObject(curve, {
      ...textFormFromObject(curve),
      text: 'New curved label',
      fill: '#112233',
    });
    expect(updated.geometryJson).toEqual(curve.geometryJson);
    expect(updated.kind).toBe('curve_text');
  });

  it('updates bezier geometry for curve_text while preserving point paths', () => {
    const curve = baseObject({
      kind: 'curve_text',
      geometryJson: {
        start: { x: 0, y: 0 },
        control: { x: 100, y: -40 },
        end: { x: 200, y: 0 },
        extra: true,
      },
      contentJson: { text: 'Arc', legacy: 1 },
    });

    const geometry = curveTextGeometryFromObject(curve);
    const updated = applyTextFormToObject(
      curve,
      { ...textFormFromObject(curve), text: 'Curved' },
      { ...geometry, startX: 5, startY: 6, controlX: 7, controlY: 8, endX: 9, endY: 10 },
    );

    expect(updated.kind).toBe('curve_text');
    expect(updated.geometryJson).toMatchObject({
      extra: true,
      start: { x: 5, y: 6 },
      control: { x: 7, y: 8 },
      end: { x: 9, y: 10 },
    });
    expect(updated.contentJson).toMatchObject({ text: 'Curved', legacy: 1 });

    const pointPath = baseObject({
      kind: 'curve_text',
      geometryJson: {
        points: [{ x: 0, y: 0 }, { x: 50, y: 10 }, { x: 100, y: 0 }],
        start: { x: 1, y: 2 },
      },
    });
    const pointGeometry = curveTextGeometryFromObject(pointPath);
    expect(pointGeometry.hasExplicitPointPath).toBe(true);
    const preserved = applyTextFormToObject(
      pointPath,
      { ...textFormFromObject(pointPath), text: 'Path text' },
      { ...pointGeometry, endX: 999, endY: 999 },
    );
    expect(preserved.geometryJson).toEqual(pointPath.geometryJson);
  });
});
