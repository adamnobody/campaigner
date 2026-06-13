import type { CanvasObject } from '@/api/canvas';
import { asNumber, asRecord, asString, CARD_OBJECT_DEFAULT_SIZE, objectTransform } from './canvasModel';

export const CARD_DEFAULT_SIZE = CARD_OBJECT_DEFAULT_SIZE;

export type CardObjectFormState = {
  width: number;
  height: number;
  x: number;
  y: number;
  title: string;
};

export const cardFormFromObject = (object: CanvasObject): CardObjectFormState => {
  const geometry = asRecord(object.geometryJson);
  const transform = objectTransform(object);
  const content = asRecord(object.contentJson);
  const titleOverride = asString(content.titleOverride, '').trim();
  return {
    width: asNumber(geometry.width, CARD_DEFAULT_SIZE.width),
    height: asNumber(geometry.height, CARD_DEFAULT_SIZE.height),
    x: transform.x,
    y: transform.y,
    title: titleOverride || object.name?.trim() || '',
  };
};

export const applyCardFormToObject = (
  object: CanvasObject,
  form: CardObjectFormState,
): CanvasObject => {
  const content = asRecord(object.contentJson);
  const trimmedTitle = form.title.trim();
  return {
    ...object,
    name: trimmedTitle || object.name,
    transformJson: {
      ...objectTransform(object),
      x: form.x,
      y: form.y,
    },
    geometryJson: {
      ...asRecord(object.geometryJson),
      width: Math.max(1, form.width),
      height: Math.max(1, form.height),
    },
    contentJson: {
      ...content,
      titleOverride: trimmedTitle,
    },
  };
};
