import { describe, expect, it } from 'vitest';
import { factionDetailPath } from './canvasModel';

describe('factionDetailPath', () => {
  it('routes states to /states/:id', () => {
    expect(factionDetailPath(42, { id: 7, kind: 'state' })).toBe('/project/42/states/7');
  });

  it('routes factions to /factions/:id', () => {
    expect(factionDetailPath(42, { id: 9, kind: 'faction' })).toBe('/project/42/factions/9');
  });
});
