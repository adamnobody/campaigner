import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  type SxProps,
  type Theme,
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import TitleIcon from '@mui/icons-material/Title';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import CodeIcon from '@mui/icons-material/Code';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import AddLinkIcon from '@mui/icons-material/AddLink';
import { createPortal } from 'react-dom';
import { htmlToMd, isEmptyEditorHtml, mdToHtml } from './mdHtml';
import { FloatingMenu, SelectionToolbar, visibleSlashItems, type SlashCommand } from './overlays';
import { resolveUploadAssetUrl } from '@/utils/uploadAssetUrl';

export type DocumentEntity = {
  id: string;
  label: string;
  href: string;
  group: string;
};

export type WorldTextEditorHandle = {
  insertHtml: (html: string) => void;
  insertMarkdown: (md: string) => void;
  focus: () => void;
};

type Props = {
  initialMarkdown: string;
  readOnly?: boolean;
  placeholder?: string;
  slashTitle?: string;
  slashItems: SlashCommand[];
  mentionItems?: DocumentEntity[];
  showSelectionToolbar?: boolean;
  onChange: (markdown: string) => void;
  onCommand?: (id: string) => void;
  onUploadImage?: (file: File) => Promise<{ path: string; url: string }>;
  onNavigate?: (href: string) => void;
  floatContent?: React.ReactNode;
};

function caretQuery(prefix: '/' | '@'): { query: string; rect: DOMRect } | null {
  const sel = window.getSelection();
  if (!sel?.rangeCount || !sel.isCollapsed) return null;
  const range = sel.getRangeAt(0);
  const node = range.startContainer;
  if (node.nodeType !== Node.TEXT_NODE || !node.textContent) return null;
  const text = node.textContent.slice(0, range.startOffset);
  const idx = text.lastIndexOf(prefix);
  if (idx < 0) return null;
  const before = text[idx - 1];
  if (idx > 0 && before && !/\s/.test(before)) return null;
  const query = text.slice(idx + 1);
  if (/\s/.test(query)) return null;
  const marker = document.createRange();
  marker.setStart(node, idx);
  marker.setEnd(node, range.startOffset);
  return { query, rect: marker.getBoundingClientRect() };
}

function deleteCaretQuery(prefix: '/' | '@'): void {
  const sel = window.getSelection();
  if (!sel?.rangeCount || !sel.isCollapsed) return;
  const range = sel.getRangeAt(0);
  const node = range.startContainer;
  if (node.nodeType !== Node.TEXT_NODE || !node.textContent) return;
  const text = node.textContent.slice(0, range.startOffset);
  const idx = text.lastIndexOf(prefix);
  if (idx < 0) return;
  const del = document.createRange();
  del.setStart(node, idx);
  del.setEnd(node, range.startOffset);
  del.deleteContents();
}

function insertHtmlAtCaret(html: string): void {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const temp = document.createElement('template');
  temp.innerHTML = html;
  const frag = temp.content;
  const last = frag.lastChild;
  range.insertNode(frag);
  if (last) {
    range.setStartAfter(last);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

async function withResolvedImages(html: string): Promise<string> {
  const paths = [...html.matchAll(/data-upload="([^"]+)"/g)].map((match) => match[1]!);
  let out = html;
  await Promise.all(paths.map(async (path) => {
    const url = await resolveUploadAssetUrl(path);
    if (url) out = out.replaceAll(`src="${path}"`, `src="${url}"`);
  }));
  return out;
}

const editorSx: SxProps<Theme> = (theme) => ({
  minHeight: 180,
  color: 'text.primary',
  fontFamily: theme.campaigner.reading.fontFamily,
  fontSize: `${theme.campaigner.reading.fontSize}px`,
  lineHeight: theme.campaigner.reading.lineHeight,
  outline: 'none',
  '&:empty:before, &[data-empty="true"]:before': {
    content: 'attr(data-placeholder)',
    color: alphaText(theme),
    pointerEvents: 'none',
  },
  '& p': { my: 0, mb: 1.75 },
  '& h2, & h3, & h4': {
    color: 'text.primary',
    fontFamily: theme.campaigner.typography.display,
    fontWeight: 600,
    scrollMarginTop: 24,
  },
  '& h2': { fontSize: '1.55rem', mt: 3.5, mb: 1.1 },
  '& h3': { fontSize: '1.25rem', mt: 2.75, mb: 0.9 },
  '& h4': { fontSize: '1.08rem', mt: 2.25, mb: 0.7 },
  '& ul, & ol': { mt: 0, mb: 2, pl: 3 },
  '& li': { mb: 0.55 },
  '& blockquote': {
    my: 2.5,
    mx: 0,
    py: 0.5,
    px: 2.25,
    borderLeft: '2px solid',
    borderColor: 'primary.main',
    color: 'text.secondary',
    fontStyle: 'italic',
  },
  '& blockquote footer': {
    mt: 1,
    fontStyle: 'normal',
    fontSize: '0.68rem',
    letterSpacing: '.14em',
    textTransform: 'uppercase',
    color: 'primary.main',
  },
  '& a.entity-pill': {
    color: 'primary.main',
    textDecoration: 'none',
    backgroundColor: 'rgba(201,169,89,.14)',
    borderRadius: '999px',
    px: 0.9,
    py: 0.15,
    mx: 0.15,
  },
  '& a:not(.entity-pill)': { color: 'primary.main' },
  '& hr': { my: 3, border: 0, borderTop: '1px solid', borderColor: 'divider' },
  '& img': { display: 'block', maxWidth: '100%', my: 2.5, borderRadius: 1.5 },
  '& code': {
    px: 0.6,
    py: 0.15,
    borderRadius: 0.75,
    backgroundColor: 'rgba(255,255,255,.06)',
    fontFamily: theme.campaigner.typography.mono,
    fontSize: '0.86em',
  },
});

function alphaText(theme: Theme): string {
  return theme.palette.text.disabled;
}

export const WorldTextEditor = forwardRef<WorldTextEditorHandle, Props>(function WorldTextEditor({
  initialMarkdown,
  readOnly = false,
  placeholder,
  slashTitle,
  slashItems,
  mentionItems = [],
  showSelectionToolbar = false,
  onChange,
  onCommand,
  onUploadImage,
  onNavigate,
  floatContent,
}, ref) {
  const hostRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [floatHost, setFloatHost] = useState<HTMLElement | null>(null);
  const [slash, setSlash] = useState<{ x: number; y: number; query: string } | null>(null);
  const [mention, setMention] = useState<{ x: number; y: number; query: string } | null>(null);
  const [selection, setSelection] = useState<{ x: number; y: number } | null>(null);
  const [menuIndex, setMenuIndex] = useState(0);

  const ensureFloatHost = useCallback(() => {
    const el = hostRef.current;
    if (!el || !floatContent) {
      setFloatHost(null);
      return;
    }
    let host = el.querySelector('[data-role="infobox"]') as HTMLElement | null;
    if (!host) {
      host = document.createElement('aside');
      host.dataset.role = 'infobox';
      host.contentEditable = 'false';
      host.style.cssText = 'float:right;width:248px;margin:0 0 18px 28px;';
      el.prepend(host);
    }
    setFloatHost(host);
  }, [floatContent]);

  const emit = useCallback(() => {
    const el = hostRef.current;
    if (!el) return;
    ensureFloatHost();
    onChange(htmlToMd(el.innerHTML));
    el.dataset.empty = isEmptyEditorHtml(el.innerHTML) ? 'true' : 'false';
  }, [ensureFloatHost, onChange]);

  const insertHtml = useCallback((html: string) => {
    hostRef.current?.focus();
    insertHtmlAtCaret(html);
    emit();
  }, [emit]);

  useImperativeHandle(ref, () => ({
    insertHtml,
    insertMarkdown: (md: string) => insertHtml(mdToHtml(md)),
    focus: () => hostRef.current?.focus(),
  }), [insertHtml]);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    let cancelled = false;
    void withResolvedImages(mdToHtml(initialMarkdown)).then((html) => {
      if (cancelled || !el) return;
      el.innerHTML = html;
      el.dataset.empty = isEmptyEditorHtml(html) ? 'true' : 'false';
      ensureFloatHost();
    });
    return () => {
      cancelled = true;
    };
    // Only hydrate from the note identity / first body.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    ensureFloatHost();
  }, [ensureFloatHost]);

  useEffect(() => {
    setMenuIndex(0);
  }, [slash?.query, mention?.query]);

  const closeMenus = () => {
    setSlash(null);
    setMention(null);
    setSelection(null);
  };

  const applySlash = (id: string) => {
    deleteCaretQuery('/');
    setSlash(null);
    if (id === 'heading') insertHtml('<h2></h2>');
    else if (id === 'list') document.execCommand('insertUnorderedList');
    else if (id === 'quote') insertHtml('<blockquote><p></p></blockquote>');
    else if (id === 'hr') insertHtml('<hr>');
    else if (id === 'definition') insertHtml('<p><strong></strong></p>');
    else if (id === 'code') document.execCommand('formatBlock', false, 'pre');
    else if (id === 'image') fileRef.current?.click();
    else onCommand?.(id);
    emit();
  };

  const applyMention = (entity: DocumentEntity) => {
    deleteCaretQuery('@');
    setMention(null);
    insertHtml(`<a class="entity-pill" href="${entity.href}">${entity.label}</a>&nbsp;`);
    onCommand?.(`mention:${entity.id}`);
  };

  const refreshSelection = () => {
    if (readOnly || !showSelectionToolbar) {
      setSelection(null);
      return;
    }
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !hostRef.current?.contains(sel.anchorNode)) {
      setSelection(null);
      return;
    }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (!rect.width && !rect.height) {
      setSelection(null);
      return;
    }
    setSelection({ x: rect.left + rect.width / 2, y: rect.top - 8 });
  };

  const slashVisible = slash ? visibleSlashItems(slashItems, slash.query) : [];
  const mentionVisible = mentionItems.filter((item) => {
    if (!mention) return false;
    const needle = mention.query.toLowerCase();
    return !needle || item.label.toLowerCase().includes(needle);
  });

  const onInput = () => {
    emit();
    const slashHit = caretQuery('/');
    const mentionHit = caretQuery('@');
    setSlash(slashHit ? { x: slashHit.rect.left, y: slashHit.rect.bottom + 8, query: slashHit.query } : null);
    setMention(mentionHit ? { x: mentionHit.rect.left, y: mentionHit.rect.bottom + 8, query: mentionHit.query } : null);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      closeMenus();
      return;
    }

    const menu = slash ? slashVisible : mention ? mentionVisible : null;
    if (!menu?.length) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      setMenuIndex((index) => (index + delta + menu.length) % menu.length);
      return;
    }

    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      const item = menu[menuIndex] ?? menu[0];
      if (!item) return;
      if (slash) applySlash(item.id);
      else {
        const entity = mentionItems.find((entry) => entry.id === item.id);
        if (entity) applyMention(entity);
      }
    }
  };

  const run = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    hostRef.current?.focus();
    emit();
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        ref={hostRef}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={onInput}
        onKeyDown={onKeyDown}
        onKeyUp={refreshSelection}
        onMouseUp={refreshSelection}
        onClick={(event) => {
          const target = event.target as HTMLElement;
          const anchor = target.closest('a');
          if (!anchor) return;
          if (readOnly && onNavigate && anchor.getAttribute('href')) {
            event.preventDefault();
            onNavigate(anchor.getAttribute('href')!);
          }
        }}
        sx={editorSx}
      />
      {floatHost && floatContent ? createPortal(floatContent, floatHost) : null}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file || !onUploadImage) return;
          const uploaded = await onUploadImage(file);
          insertHtml(`<img alt="" src="${uploaded.url}" data-upload="${uploaded.path}">`);
        }}
      />
      {!readOnly && slash ? (
        <FloatingMenu
          x={slash.x}
          y={slash.y}
          title={slashTitle}
          items={slashItems}
          query={slash.query}
          activeIndex={menuIndex}
          onHoverIndex={setMenuIndex}
          onPick={applySlash}
        />
      ) : null}
      {!readOnly && mention && mentionVisible.length > 0 ? (
        <FloatingMenu
          x={mention.x}
          y={mention.y}
          items={mentionVisible.map((item) => ({ id: item.id, label: item.label, hint: item.group }))}
          activeIndex={menuIndex}
          onHoverIndex={setMenuIndex}
          onPick={(id) => {
            const entity = mentionItems.find((item) => item.id === id);
            if (entity) applyMention(entity);
          }}
        />
      ) : null}
      {!readOnly && selection ? (
        <SelectionToolbar x={selection.x} y={selection.y}>
          <ToolbarIcon title="bold" onClick={() => run('bold')} icon={<FormatBoldIcon sx={{ fontSize: 16 }} />} />
          <ToolbarIcon title="italic" onClick={() => run('italic')} icon={<FormatItalicIcon sx={{ fontSize: 16 }} />} />
          <ToolbarIcon title="strike" onClick={() => run('strikeThrough')} icon={<StrikethroughSIcon sx={{ fontSize: 16 }} />} />
          <ToolbarIcon title="heading" onClick={() => run('formatBlock', 'h2')} icon={<TitleIcon sx={{ fontSize: 16 }} />} />
          <ToolbarIcon title="quote" onClick={() => run('formatBlock', 'blockquote')} icon={<FormatQuoteIcon sx={{ fontSize: 16 }} />} />
          <ToolbarIcon title="code" onClick={() => run('formatBlock', 'pre')} icon={<CodeIcon sx={{ fontSize: 16 }} />} />
          <ToolbarIcon title="image" onClick={() => fileRef.current?.click()} icon={<ImageOutlinedIcon sx={{ fontSize: 16 }} />} />
          <ToolbarIcon title="list" onClick={() => run('insertUnorderedList')} icon={<FormatListBulletedIcon sx={{ fontSize: 16 }} />} />
          <ToolbarIcon title="link" onClick={() => onCommand?.('entity-link')} icon={<AddLinkIcon sx={{ fontSize: 16 }} />} />
        </SelectionToolbar>
      ) : null}
    </Box>
  );
});

function ToolbarIcon({
  title,
  icon,
  onClick,
}: {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Tooltip title={title}>
      <IconButton
        size="small"
        onMouseDown={(event) => {
          event.preventDefault();
          onClick();
        }}
        sx={{ color: 'text.secondary' }}
      >
        {icon}
      </IconButton>
    </Tooltip>
  );
}
