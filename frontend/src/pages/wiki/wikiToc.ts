export type WikiTocLevel = 2 | 3 | 4;

export type WikiTocItem = {
  id: string;
  level: WikiTocLevel;
  text: string;
};

const HEADING_PATTERN = /^(#{2,4})[ \t]+(.+?)[ \t]*#*[ \t]*$/;
const FENCE_PATTERN = /^\s*(`{3,}|~{3,})/;

export function getWikiHeadingText(markdown: string): string {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[*_~]/g, '')
    .replace(/\\([\\`*_[\]{}()#+.!-])/g, '$1')
    .trim();
}

export function createWikiHeadingId(
  text: string,
  occurrences: Map<string, number>,
): string {
  const base = text
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/[\s-]+/g, '-') || 'section';
  const occurrence = (occurrences.get(base) ?? 0) + 1;
  occurrences.set(base, occurrence);
  return occurrence === 1 ? base : `${base}-${occurrence}`;
}

export function buildWikiToc(markdown: string): WikiTocItem[] {
  const occurrences = new Map<string, number>();
  const items: WikiTocItem[] = [];
  let fence: string | null = null;

  for (const line of markdown.split(/\r?\n/)) {
    const fenceMatch = line.match(FENCE_PATTERN);
    if (fenceMatch) {
      const marker = fenceMatch[1]!;
      if (!fence) fence = marker[0];
      else if (marker[0] === fence) fence = null;
      continue;
    }
    if (fence) continue;

    const heading = line.match(HEADING_PATTERN);
    if (!heading) continue;

    const text = getWikiHeadingText(heading[2]!);
    if (!text) continue;
    items.push({
      id: createWikiHeadingId(text, occurrences),
      level: heading[1]!.length as WikiTocLevel,
      text,
    });
  }

  return items;
}
