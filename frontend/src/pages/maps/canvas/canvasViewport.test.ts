import { describe, expect, it } from 'vitest';
import { applyPersistToViewport, persistFromViewport } from './canvasViewport';

type MockViewport = {
  screenWidth: number;
  screenHeight: number;
  x: number;
  y: number;
  scale: { x: number; y: number; set: (value: number) => void };
  position: { set: (x: number, y: number) => void };
  center: { x: number; y: number };
  setZoom: (scale: number, center?: boolean) => MockViewport;
  moveCenter: (x: number, y: number) => MockViewport;
};

const createMockViewport = (screenWidth: number, screenHeight: number, initialScale = 0.31): MockViewport => {
  let x = screenWidth / 2;
  let y = screenHeight / 2;
  let scale = initialScale;

  const api: MockViewport = {
    screenWidth,
    screenHeight,
    x,
    y,
    scale: {
      get x() {
        return scale;
      },
      get y() {
        return scale;
      },
      set(value: number) {
        scale = value;
      },
    },
    position: {
      set(nextX: number, nextY: number) {
        x = nextX;
        y = nextY;
      },
    },
    get center() {
      return {
        x: (screenWidth / scale) / 2 - x / scale,
        y: (screenHeight / scale) / 2 - y / scale,
      };
    },
    setZoom(nextScale: number, center = false) {
      const save = center ? { ...api.center } : null;
      scale = nextScale;
      if (center && save) {
        api.moveCenter(save.x, save.y);
      }
      return api;
    },
    moveCenter(centerX: number, centerY: number) {
      x = ((screenWidth / scale) / 2 - centerX) * scale;
      y = ((screenHeight / scale) / 2 - centerY) * scale;
      return api;
    },
  };

  return api;
};

describe('applyPersistToViewport', () => {
  it('centers map image when scale changes from a stale saved viewport', () => {
    const viewport = createMockViewport(1200, 900, 0.31);
    const target = { centerX: 1000, centerY: 750, scale: 0.42 };

    applyPersistToViewport(viewport as never, target);

    const persist = persistFromViewport(viewport as never);
    expect(persist.centerX).toBeCloseTo(1000, 1);
    expect(persist.centerY).toBeCloseTo(750, 1);
    expect(persist.scale).toBeCloseTo(0.42, 2);
  });
});
