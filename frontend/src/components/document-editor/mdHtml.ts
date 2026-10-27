const BLOCK_HEADING = /^(#{2,4})\s+(.+)$/;
const BLOCK_QUOTE = /^>\s?(.*)$/;
const BLOCK_LIST = /^[-*]\s+(.+)$/;
const BLOCK_HR = /^---+$/;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function unescapeHtml(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function isInternalHref(href: string): boolean {
  return href.startsWith('/__note__/') || href.startsWith('/project/');
}

function inlineToHtml(text: string): string {
  let out = escapeHtml(text);
  out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, src) =>
    `<img alt="${alt}" src="${src}" data-upload="${src}">`);
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, href) => {
    const cls = isInternalHref(href) ? ' class="entity-pill"' : '';
    return `<a href="${href}"${cls}>${label}</a>`;
  });
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/~~([^~]+)~~/g, '<s>$1</s>');
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  return out;
}

function isBlockStart(line: string): boolean {
  return BLOCK_HEADING.test(line)
    || BLOCK_QUOTE.test(line)
    || BLOCK_LIST.test(line)
    || BLOCK_HR.test(line.trim());
}

export function mdToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;
    if (!line.trim()) {
      i += 1;
      continue;
    }
    if (BLOCK_HR.test(line.trim())) {
      out.push('<hr>');
      i += 1;
      continue;
    }
    const heading = line.match(BLOCK_HEADING);
    if (heading) {
      const level = heading[1]!.length;
      const text = heading[2]!.trim();
      const id = text
        .toLocaleLowerCase()
        .normalize('NFKD')
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        .trim()
        .replace(/[\s-]+/g, '-') || 'section';
      out.push(`<h${level} id="${id}">${inlineToHtml(text)}</h${level}>`);
      i += 1;
      continue;
    }
    if (BLOCK_QUOTE.test(line)) {
      const quoted: string[] = [];
      while (i < lines.length && BLOCK_QUOTE.test(lines[i]!)) {
        quoted.push(lines[i]!.replace(/^>\s?/, ''));
        i += 1;
      }
      const caption = quoted.length > 1 && quoted[quoted.length - 1]!.startsWith('— ')
        ? quoted.pop()!
        : null;
      const body = inlineToHtml(quoted.join('\n')).replace(/\n/g, '<br>');
      const footer = caption ? `<footer>${inlineToHtml(caption.slice(2))}</footer>` : '';
      out.push(`<blockquote><p>${body}</p>${footer}</blockquote>`);
      continue;
    }
    if (BLOCK_LIST.test(line)) {
      const items: string[] = [];
      while (i < lines.length && BLOCK_LIST.test(lines[i]!)) {
        items.push(`<li>${inlineToHtml(lines[i]!.replace(/^[-*]\s+/, ''))}</li>`);
        i += 1;
      }
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i]!.trim() && !isBlockStart(lines[i]!)) {
      para.push(lines[i]!);
      i += 1;
    }
    out.push(`<p>${inlineToHtml(para.join(' '))}</p>`);
  }

  return out.join('') || '<p><br></p>';
}

type AttrMap = Record<string, string>;

function parseAttrs(raw: string): AttrMap {
  const attrs: AttrMap = {};
  const re = /([a-zA-Z_:][\w:.-]*)(?:="([^"]*)")?/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw))) {
    attrs[match[1]!.toLowerCase()] = match[2] ?? '';
  }
  return attrs;
}

type HtmlNode =
  | { type: 'text'; value: string }
  | { type: 'element'; tag: string; attrs: AttrMap; children: HtmlNode[] };

function parseHtml(html: string): HtmlNode[] {
  const tokens = html.match(/<!--[\s\S]*?-->|<\/?[a-zA-Z][a-zA-Z0-9]*\b[^>]*>|[^<]+/g) ?? [];
  const root: HtmlNode[] = [];
  const stack: Array<{ tag: string; attrs: AttrMap; children: HtmlNode[] }> = [];

  const push = (node: HtmlNode) => {
    if (stack.length > 0) stack[stack.length - 1]!.children.push(node);
    else root.push(node);
  };

  for (const token of tokens) {
    if (token.startsWith('<!--')) continue;
    const open = token.match(/^<([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)\/?>$/);
    const close = token.match(/^<\/([a-zA-Z][a-zA-Z0-9]*)>$/);
    if (open) {
      const tag = open[1]!.toLowerCase();
      const attrs = parseAttrs(open[2] ?? '');
      const selfClosing = /\/?>$/.test(token) && (token.endsWith('/>') || tag === 'br' || tag === 'hr' || tag === 'img');
      if (selfClosing) {
        push({ type: 'element', tag, attrs, children: [] });
      } else {
        stack.push({ tag, attrs, children: [] });
      }
      continue;
    }
    if (close) {
      const tag = close[1]!.toLowerCase();
      while (stack.length > 0) {
        const frame = stack.pop()!;
        const node: HtmlNode = { type: 'element', tag: frame.tag, attrs: frame.attrs, children: frame.children };
        push(node);
        if (frame.tag === tag) break;
      }
      continue;
    }
    push({ type: 'text', value: unescapeHtml(token) });
  }
  while (stack.length > 0) {
    const frame = stack.pop()!;
    push({ type: 'element', tag: frame.tag, attrs: frame.attrs, children: frame.children });
  }
  return root;
}

function serializeInline(nodes: HtmlNode[]): string {
  return nodes.map((node) => {
    if (node.type === 'text') return node.value.replace(/\s+/g, ' ');
    const inner = serializeInline(node.children);
    switch (node.tag) {
      case 'br':
        return '\n';
      case 'strong':
      case 'b':
        return `**${inner}**`;
      case 'em':
      case 'i':
        return `*${inner}*`;
      case 's':
      case 'strike':
      case 'del':
        return `~~${inner}~~`;
      case 'code':
        return `\`${inner}\``;
      case 'a':
        return `[${inner}](${node.attrs.href ?? ''})`;
      case 'img':
        return `![${node.attrs.alt ?? ''}](${node.attrs['data-upload'] || node.attrs.src || ''})`;
      default:
        return inner;
    }
  }).join('');
}

function serializeBlocks(nodes: HtmlNode[], acc: string[]): void {
  for (const node of nodes) {
    if (node.type === 'text') {
      const text = node.value.trim();
      if (text) acc.push(text);
      continue;
    }
    switch (node.tag) {
      case 'h2':
      case 'h3':
      case 'h4':
        acc.push(`${'#'.repeat(Number(node.tag[1]))} ${serializeInline(node.children).trim()}`);
        break;
      case 'p':
      case 'div': {
        const text = serializeInline(node.children).trim();
        if (text) acc.push(text);
        break;
      }
      case 'blockquote': {
        const footer = node.children.find((child) => child.type === 'element' && child.tag === 'footer');
        const rest = node.children.filter((child) => !(child.type === 'element' && child.tag === 'footer'));
        const body = serializeInline(rest).trim();
        if (body) acc.push(body.split('\n').map((line) => `> ${line}`).join('\n'));
        if (footer && footer.type === 'element') {
          acc.push(`> — ${serializeInline(footer.children).trim()}`);
        }
        break;
      }
      case 'ul':
      case 'ol':
        for (const child of node.children) {
          if (child.type === 'element' && child.tag === 'li') {
            acc.push(`- ${serializeInline(child.children).trim()}`);
          }
        }
        break;
      case 'hr':
        acc.push('---');
        break;
      case 'li':
        acc.push(`- ${serializeInline(node.children).trim()}`);
        break;
      case 'aside':
        if (node.attrs['data-role'] === 'infobox') break;
        serializeBlocks(node.children, acc);
        break;
      default:
        serializeBlocks(node.children, acc);
    }
  }
}

export function htmlToMd(html: string): string {
  const normalized = html
    .replace(/&nbsp;/g, ' ')
    .replace(/<div><br\s*\/?><\/div>/gi, '')
    .replace(/<p><br\s*\/?><\/p>/gi, '');
  if (!normalized.replace(/<br\s*\/?>/gi, '').replace(/<[^>]+>/g, '').trim()) return '';
  const acc: string[] = [];
  serializeBlocks(parseHtml(normalized), acc);
  return acc.join('\n\n').trim();
}

export function isEmptyEditorHtml(html: string): boolean {
  return htmlToMd(html).trim().length === 0;
}
