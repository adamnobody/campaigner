import { describe, expect, it } from 'vitest';
import {
  countWords,
  parseDocument,
  readingMinutes,
  serializeDocument,
} from './documentMeta';

describe('documentMeta', () => {
  it('round-trips wiki metadata without touching the body', () => {
    const body = '## How they noticed\n\nThe bells stopped.';
    const packed = serializeDocument({
      status: 'canon',
      category: 'phenomenon',
      cover: 'characters/cover.png',
      infobox: [{ key: 'WHERE', value: 'Tarn' }],
      playerVisible: true,
    }, body);
    expect(packed.startsWith('<!--campaigner:')).toBe(true);
    const parsed = parseDocument(packed);
    expect(parsed.body).toBe(body);
    expect(parsed.meta).toEqual({
      status: 'canon',
      category: 'phenomenon',
      cover: 'characters/cover.png',
      infobox: [{ key: 'WHERE', value: 'Tarn' }],
      playerVisible: true,
    });
  });

  it('treats notes without a comment as empty meta', () => {
    expect(parseDocument('# Hello\n\nWorld')).toEqual({
      meta: {},
      body: '# Hello\n\nWorld',
    });
  });

  it('counts words after stripping markup', () => {
    expect(countWords('**Hello** [Cassius](/__note__/1) world')).toBe(3);
    expect(readingMinutes(0)).toBe(0);
    expect(readingMinutes(200)).toBe(1);
  });
});
