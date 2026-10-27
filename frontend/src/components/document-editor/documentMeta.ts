export type NoteKind = 'note' | 'idea' | 'scene' | 'question';
export type PublishStatus = 'draft' | 'canon';

export type InfoboxField = {
  key: string;
  value: string;
};

export type DocumentMeta = {
  kind?: NoteKind;
  status?: PublishStatus;
  category?: string;
  cover?: string;
  infobox?: InfoboxField[];
  aside?: string;
  playerVisible?: boolean;
};

const META_RE = /^<!--campaigner:([\s\S]*?)-->\s*/;
const KINDS = new Set<NoteKind>(['note', 'idea', 'scene', 'question']);
const STATUSES = new Set<PublishStatus>(['draft', 'canon']);

export function parseDocument(content: string): { meta: DocumentMeta; body: string } {
  const match = content.match(META_RE);
  if (!match) return { meta: {}, body: content };
  try {
    const raw = JSON.parse(match[1]!) as unknown;
    return { meta: normalizeMeta(raw), body: content.slice(match[0].length) };
  } catch {
    return { meta: {}, body: content };
  }
}

export function serializeDocument(meta: DocumentMeta, body: string): string {
  const compact = compactMeta(meta);
  if (Object.keys(compact).length === 0) return body;
  return `<!--campaigner:${JSON.stringify(compact)}-->\n${body}`;
}

function normalizeMeta(raw: unknown): DocumentMeta {
  if (!raw || typeof raw !== 'object') return {};
  const value = raw as Record<string, unknown>;
  const meta: DocumentMeta = {};
  if (typeof value.kind === 'string' && KINDS.has(value.kind as NoteKind)) {
    meta.kind = value.kind as NoteKind;
  }
  if (typeof value.status === 'string' && STATUSES.has(value.status as PublishStatus)) {
    meta.status = value.status as PublishStatus;
  }
  if (typeof value.category === 'string' && value.category.trim()) {
    meta.category = value.category.trim();
  }
  if (typeof value.cover === 'string' && value.cover.trim()) {
    meta.cover = value.cover.trim();
  }
  if (typeof value.aside === 'string' && value.aside.trim()) {
    meta.aside = value.aside;
  }
  if (typeof value.playerVisible === 'boolean') {
    meta.playerVisible = value.playerVisible;
  }
  if (Array.isArray(value.infobox)) {
    const fields = value.infobox
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const field = item as Record<string, unknown>;
        if (typeof field.key !== 'string' || !field.key.trim()) return null;
        return { key: field.key.trim(), value: typeof field.value === 'string' ? field.value : '' };
      })
      .filter((item): item is InfoboxField => item !== null);
    if (fields.length > 0) meta.infobox = fields;
  }
  return meta;
}

function compactMeta(meta: DocumentMeta): Record<string, unknown> {
  const compact: Record<string, unknown> = {};
  if (meta.kind && meta.kind !== 'note') compact.kind = meta.kind;
  if (meta.status && meta.status !== 'draft') compact.status = meta.status;
  if (meta.category) compact.category = meta.category;
  if (meta.cover) compact.cover = meta.cover;
  if (meta.aside?.trim()) compact.aside = meta.aside;
  if (meta.playerVisible) compact.playerVisible = true;
  if (meta.infobox?.some((field) => field.key.trim())) {
    compact.infobox = meta.infobox.filter((field) => field.key.trim());
  }
  return compact;
}

export function countWords(text: string): number {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~\-]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function readingMinutes(words: number): number {
  if (words <= 0) return 0;
  return Math.max(1, Math.round(words / 180));
}

export function countSections(markdown: string): number {
  return (markdown.match(/^#{2,4}\s+\S/gm) ?? []).length;
}

export function extractEntityLinks(markdown: string): Array<{ label: string; href: string }> {
  const links: Array<{ label: string; href: string }> = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(markdown))) {
    const href = match[2]!;
    if (href.startsWith('/__note__/') || href.startsWith('/project/')) {
      links.push({ label: match[1]!, href });
    }
  }
  return links;
}
