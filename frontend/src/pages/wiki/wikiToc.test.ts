import { describe, expect, it } from 'vitest';
import { buildWikiToc } from './wikiToc';

describe('buildWikiToc', () => {
  it('extracts article headings with stable unique anchors', () => {
    expect(buildWikiToc([
      '# Магия крови',
      '## Происхождение',
      '### **Практика** и [цена](https://example.com)',
      '## Происхождение',
    ].join('\n'))).toEqual([
      { id: 'происхождение', level: 2, text: 'Происхождение' },
      { id: 'практика-и-цена', level: 3, text: 'Практика и цена' },
      { id: 'происхождение-2', level: 2, text: 'Происхождение' },
    ]);
  });

  it('ignores headings inside fenced code and levels outside the article TOC', () => {
    expect(buildWikiToc([
      '```md',
      '## Not a section',
      '```',
      '##### Too deep',
      '## Visible',
    ].join('\n'))).toEqual([
      { id: 'visible', level: 2, text: 'Visible' },
    ]);
  });
});
