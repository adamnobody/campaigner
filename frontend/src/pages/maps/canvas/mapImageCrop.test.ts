import { describe, expect, it } from 'vitest';
import {
  clampCropRect,
  displayCropToNatural,
  fitImageToBox,
} from './mapImageCrop';

describe('clampCropRect', () => {
  it('keeps rect inside bounds with minimum size', () => {
    expect(clampCropRect({ x: -10, y: 5, width: 500, height: 400 }, { width: 200, height: 150 }))
      .toEqual({ x: 0, y: 0, width: 200, height: 150 });
  });
});

describe('displayCropToNatural', () => {
  it('scales display crop to image pixels', () => {
    expect(displayCropToNatural(
      { x: 10, y: 20, width: 100, height: 50 },
      { width: 200, height: 100 },
      { width: 1000, height: 500 },
    )).toEqual({ x: 50, y: 100, width: 500, height: 250 });
  });
});

describe('fitImageToBox', () => {
  it('downscales large images to fit the box', () => {
    expect(fitImageToBox({ width: 2000, height: 1000 }, 400, 300)).toEqual({ width: 400, height: 200 });
  });
});
