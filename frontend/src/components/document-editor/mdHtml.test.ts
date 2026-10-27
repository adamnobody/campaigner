import { describe, expect, it } from 'vitest';
import { htmlToMd, mdToHtml } from './mdHtml';

describe('mdHtml', () => {
  it('round-trips headings, lists, quotes, and entity links', () => {
    const md = [
      'Lead paragraph with **bold** and *italic*.',
      '## What to check',
      '- Salt\n- Fire',
      '> The first dogma.\n> — Dogma #1',
      'See [Cassius Dor](/__note__/12).',
    ].join('\n\n');

    const html = mdToHtml(md);
    expect(html).toContain('<h2 id="what-to-check">');
    expect(html).toContain('class="entity-pill"');
    expect(html).toContain('<blockquote>');
    expect(htmlToMd(html)).toContain('## What to check');
    expect(htmlToMd(html)).toContain('[Cassius Dor](/__note__/12)');
    expect(htmlToMd(html)).toContain('- Salt');
  });

  it('treats empty editor html as empty markdown', () => {
    expect(htmlToMd('<p><br></p>')).toBe('');
    expect(htmlToMd('<div><br></div>')).toBe('');
  });
});
