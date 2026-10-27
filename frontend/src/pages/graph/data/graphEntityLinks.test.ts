import { describe, expect, it } from 'vitest';
import { hrefToGraphNodeId } from './graphEntityLinks';

describe('hrefToGraphNodeId', () => {
  const noteTypes = new Map<number, string>([
    [7, 'wiki'],
    [8, 'note'],
  ]);

  it('maps character and faction project links', () => {
    expect(hrefToGraphNodeId('/project/1/characters/42', noteTypes)).toBe('character:42');
    expect(hrefToGraphNodeId('/project/1/states/9', noteTypes)).toBe('faction:9');
    expect(hrefToGraphNodeId('/project/1/factions/9', noteTypes)).toBe('faction:9');
  });

  it('maps wiki and note links', () => {
    expect(hrefToGraphNodeId('/__note__/7', noteTypes)).toBe('wiki:7');
    expect(hrefToGraphNodeId('/__note__/8', noteTypes)).toBe('note:8');
    expect(hrefToGraphNodeId('/project/1/wiki/7', noteTypes)).toBe('wiki:7');
    expect(hrefToGraphNodeId('/project/1/notes/8', noteTypes)).toBe('note:8');
  });

  it('ignores unknown hrefs', () => {
    expect(hrefToGraphNodeId('https://example.com', noteTypes)).toBeNull();
    expect(hrefToGraphNodeId('/project/1/map/3', noteTypes)).toBeNull();
  });
});
