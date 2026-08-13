import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Chip,
  IconButton,
  Typography,
  alpha,
  useTheme,
  type SxProps,
  type Theme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import LinkIcon from '@mui/icons-material/Link';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TocIcon from '@mui/icons-material/Toc';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import type { Note, WikiLink } from '@campaigner/shared';
import { notesApi } from '@/api/notes';
import { wikiApi } from '@/api/wiki';
import { useBranchStore } from '@/store/useBranchStore';
import { useUIStore } from '@/store/useUIStore';
import { DndButton } from '@/components/ui/DndButton';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { BranchEntityMissingDialog } from '@/components/ui/BranchEntityMissingDialog';
import { isNotFoundError } from '@/utils/error';
import {
  buildWikiToc,
  createWikiHeadingId,
  getWikiHeadingText,
  type WikiTocLevel,
} from './wikiToc';

type WikiNoteRef = { id: number; title: string };

const markdownStyles: SxProps<Theme> = (theme) => ({
  color: 'text.secondary',
  fontFamily: theme.campaigner.reading.fontFamily,
  fontSize: `${theme.campaigner.reading.fontSize}px`,
  lineHeight: theme.campaigner.reading.lineHeight,
  '& h1, & h2, & h3, & h4': {
    color: 'text.primary',
    fontFamily: theme.campaigner.typography.display,
    scrollMarginTop: 24,
  },
  '& h1': { fontSize: '2rem', mt: 4, mb: 1.5 },
  '& h2': { fontSize: '1.55rem', mt: 4, mb: 1.25, fontWeight: 600 },
  '& h3': { fontSize: '1.3rem', mt: 3, mb: 1, fontWeight: 600 },
  '& h4': { fontSize: '1.1rem', mt: 2.5, mb: 0.75, fontWeight: 600 },
  '& p': { my: 0, mb: 2, lineHeight: 'inherit' },
  '& a': {
    color: 'primary.main',
    textDecorationColor: 'rgba(201,169,89,.35)',
    textUnderlineOffset: '3px',
  },
  '& blockquote': {
    my: 3,
    mx: 0,
    py: 2,
    px: 3,
    borderLeft: '2px solid',
    borderColor: 'primary.main',
    borderRadius: '0 10px 10px 0',
    backgroundColor: 'rgba(201,169,89,.05)',
    fontFamily: theme.campaigner.reading.fontFamily,
    fontSize: '1.2rem',
  },
  '& blockquote p:last-child': { mb: 0 },
  '& code': {
    px: 0.75,
    py: 0.25,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,.06)',
    fontFamily: theme.campaigner.typography.mono,
    fontSize: '0.86em',
  },
  '& pre': {
    p: 2,
    mb: 2.5,
    overflowX: 'auto',
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,.24)',
  },
  '& pre code': { p: 0, backgroundColor: 'transparent' },
  '& ul, & ol': { mt: 0, mb: 2, pl: 3 },
  '& li': { mb: 0.75, lineHeight: 'inherit' },
  '& hr': { my: 4, border: 0, borderTop: '1px solid', borderColor: 'divider' },
  '& table': {
    display: 'block',
    width: '100%',
    mb: 3,
    overflowX: 'auto',
    borderCollapse: 'collapse',
  },
  '& th, & td': { px: 2, py: 1, border: '1px solid', borderColor: 'divider' },
  '& th': { color: 'text.primary', backgroundColor: 'rgba(255,255,255,.035)' },
  '& img': { display: 'block', maxWidth: '100%', my: 3, borderRadius: 2 },
});

function nodeText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join('');
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return nodeText(node.props.children);
  }
  return '';
}

function splitArticleMarkdown(content: string, title: string) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const firstHeading = lines[0]?.match(/^#\s+(.+?)\s*#*\s*$/);
  if (firstHeading && getWikiHeadingText(firstHeading[1]!) === title.trim()) {
    lines.shift();
  }

  const source = lines.join('\n').trim();
  if (!source) return { lead: '', body: '' };

  const blocks = source.split(/\n\s*\n/);
  const first = blocks[0]!.trim();
  const startsWithBlockSyntax = /^(#{1,6}\s|>|[-*+]\s|\d+\.\s|```|~~~|\|)/.test(first);
  if (startsWithBlockSyntax) return { lead: '', body: source };
  return { lead: first, body: blocks.slice(1).join('\n\n').trim() };
}

const WikiMarkdown: React.FC<{
  content: string;
  projectId: number;
  wikiNotes: WikiNoteRef[];
  anchorHeadings?: boolean;
}> = ({ content, projectId, wikiNotes, anchorHeadings = false }) => {
  const navigate = useNavigate();
  const noteTitles = useMemo(
    () => new Map(wikiNotes.map((note) => [note.id, note.title])),
    [wikiNotes],
  );
  const occurrences = new Map<string, number>();

  const renderHeading = (level: WikiTocLevel) => {
    const Heading = `h${level}` as 'h2' | 'h3' | 'h4';
    return ({ children }: { children?: React.ReactNode }) => {
      const id = anchorHeadings
        ? createWikiHeadingId(nodeText(children), occurrences)
        : undefined;
      return <Heading id={id}>{children}</Heading>;
    };
  };

  const components: Components = {
    h2: renderHeading(2),
    h3: renderHeading(3),
    h4: renderHeading(4),
    a: ({ href, children }) => {
      if (href?.startsWith('/__note__/')) {
        const targetId = Number.parseInt(href.slice('/__note__/'.length), 10);
        if (Number.isFinite(targetId) && noteTitles.has(targetId)) {
          return (
            <a
              href={`/project/${projectId}/wiki/${targetId}`}
              onClick={(event) => {
                event.preventDefault();
                navigate(`/project/${projectId}/wiki/${targetId}`);
              }}
            >
              {children}
            </a>
          );
        }
        return <span style={{ color: '#d87b7b', borderBottom: '1px dashed currentColor' }}>{children}</span>;
      }
      if (href?.startsWith('/project/')) {
        return (
          <a href={href} onClick={(event) => { event.preventDefault(); navigate(href); }}>
            {children}
          </a>
        );
      }
      if (href?.startsWith('#')) {
        return <a href={href}>{children}</a>;
      }
      return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
    },
  };

  return (
    <Box sx={markdownStyles}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
        skipHtml={false}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
};

export const WikiArticlePage: React.FC = () => {
  const { t, i18n } = useTranslation(['wiki', 'common']);
  const { projectId, noteId } = useParams<{ projectId: string; noteId: string }>();
  const projectNumber = Number.parseInt(projectId ?? '', 10);
  const noteNumber = Number.parseInt(noteId ?? '', 10);
  const navigate = useNavigate();
  const theme = useTheme();
  const showSnackbar = useUIStore((state) => state.showSnackbar);
  const activeBranchId = useBranchStore((state) => state.activeBranchId);
  const [article, setArticle] = useState<Note | null>(null);
  const [wikiNotes, setWikiNotes] = useState<WikiNoteRef[]>([]);
  const [links, setLinks] = useState<WikiLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMissing(false);
    setArticle(null);

    void Promise.all([
      notesApi.getById(noteNumber, projectNumber),
      notesApi.getAll(projectNumber, { noteType: 'wiki', limit: 500 }),
      wikiApi.getLinks(projectNumber, noteNumber),
    ]).then(([noteResponse, notesResponse, linksResponse]) => {
      if (cancelled) return;
      const note = noteResponse.data.data;
      if (note.noteType !== 'wiki') {
        setMissing(true);
        setLoading(false);
        return;
      }
      setArticle(note);
      setWikiNotes(notesResponse.data.data.items.map(({ id, title }) => ({ id, title })));
      setLinks(linksResponse.data.data ?? []);
      setLoading(false);
    }).catch((error: unknown) => {
      if (cancelled) return;
      setLoading(false);
      if (isNotFoundError(error)) {
        setMissing(true);
        return;
      }
      showSnackbar(t('wiki:article.loadError'), 'error');
    });

    return () => {
      cancelled = true;
    };
  }, [activeBranchId, noteNumber, projectNumber, showSnackbar, t]);

  const articleMarkdown = useMemo(
    () => splitArticleMarkdown(article?.content ?? '', article?.title ?? ''),
    [article],
  );
  const toc = useMemo(() => buildWikiToc(articleMarkdown.body), [articleMarkdown.body]);
  const relatedArticles = useMemo(() => links.map((link) => ({
    id: link.sourceNoteId === noteNumber ? link.targetNoteId : link.sourceNoteId,
    title: link.sourceNoteId === noteNumber ? link.targetTitle : link.sourceTitle,
    label: link.label,
  })), [links, noteNumber]);

  const closeMissing = () => {
    setMissing(false);
    navigate(`/project/${projectNumber}/wiki`, { replace: true });
  };

  if (loading) return <LoadingScreen />;

  if (!article) {
    return (
      <>
        {!missing && (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography color="text.secondary">{t('wiki:article.loadError')}</Typography>
            <DndButton sx={{ mt: 2 }} onClick={() => navigate(`/project/${projectNumber}/wiki`)}>
              {t('wiki:article.backToWiki')}
            </DndButton>
          </Box>
        )}
        <BranchEntityMissingDialog
          open={missing}
          entityName={t('wiki:article.entityName')}
          onClose={closeMissing}
        />
      </>
    );
  }

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
          <IconButton
            onClick={() => navigate(`/project/${projectNumber}/wiki`)}
            aria-label={t('wiki:article.backToWiki')}
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="body2" color="text.secondary" noWrap>
            {t('wiki:page.title')} <Box component="span" sx={{ opacity: 0.45, px: 0.75 }}>/</Box>
            <Box component="span" sx={{ color: 'text.primary' }}>{article.title}</Box>
          </Typography>
        </Box>
        <DndButton
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/project/${projectNumber}/notes/${article.id}`)}
          sx={{ flexShrink: 0, borderColor: alpha(theme.palette.primary.main, 0.45) }}
        >
          {t('wiki:article.edit')}
        </DndButton>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            lg: `minmax(0, ${theme.campaigner.reading.columnWidth}px) 296px`,
          },
          gap: { xs: 4, lg: 6.5 },
          alignItems: 'start',
          maxWidth: theme.campaigner.reading.columnWidth + 348,
          mx: 'auto',
          pb: 6,
        }}
      >
        <Box component="article" sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              pb: 1.75,
              color: 'primary.main',
              fontFamily: theme.campaigner.typography.mono,
              fontSize: '0.62rem',
              letterSpacing: '.18em',
              textTransform: 'uppercase',
            }}
          >
            {t('wiki:article.eyebrow')}
          </Typography>
          <Typography
            component="h1"
            sx={{
              m: 0,
              color: 'text.primary',
              fontFamily: theme.campaigner.typography.display,
              fontSize: { xs: '2.5rem', md: '3rem' },
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: '.01em',
            }}
          >
            {article.title}
          </Typography>

          {articleMarkdown.lead && (
            <Box sx={{ pt: 2.25, '& p': { color: 'text.secondary' } }}>
              <WikiMarkdown
                content={articleMarkdown.lead}
                projectId={projectNumber}
                wikiNotes={wikiNotes}
              />
            </Box>
          )}

          <Box sx={{ mt: 3.5, mb: 4, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography
              sx={{
                display: 'inline-block',
                pb: 1.5,
                mb: '-1px',
                borderBottom: '1px solid',
                borderColor: 'primary.main',
                color: 'text.primary',
                fontSize: '0.8rem',
              }}
            >
              {t('wiki:article.articleTab')}
            </Typography>
          </Box>

          {articleMarkdown.body ? (
            <WikiMarkdown
              content={articleMarkdown.body}
              projectId={projectNumber}
              wikiNotes={wikiNotes}
              anchorHeadings
            />
          ) : !articleMarkdown.lead ? (
            <Typography color="text.disabled" sx={{ fontStyle: 'italic' }}>
              {t('wiki:article.empty')}
            </Typography>
          ) : null}
        </Box>

        <Box
          component="aside"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3.25,
            position: { lg: 'sticky' },
            top: { lg: 24 },
            minWidth: 0,
          }}
        >
          {article.tags.length > 0 && (
            <Box>
              <RailHeading icon={<LocalOfferOutlinedIcon />} label={t('wiki:article.tags')} />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {article.tags.map((tag) => (
                  <Chip
                    key={tag.id}
                    label={tag.name}
                    size="small"
                    sx={{
                      maxWidth: '100%',
                      color: tag.color || 'primary.main',
                      border: '1px solid',
                      borderColor: tag.color
                        ? alpha(tag.color, 0.3)
                        : alpha(theme.palette.primary.main, 0.28),
                      backgroundColor: tag.color
                        ? alpha(tag.color, 0.07)
                        : alpha(theme.palette.primary.main, 0.06),
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {toc.length > 0 && (
            <Box>
              <RailHeading icon={<TocIcon />} label={t('wiki:article.contents')} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                {toc.map((item) => (
                  <Box
                    component="button"
                    type="button"
                    key={item.id}
                    onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}
                    sx={{
                      p: '7px 10px',
                      pl: `${10 + (item.level - 2) * 14}px`,
                      border: 0,
                      borderRadius: 1.5,
                      color: 'text.secondary',
                      background: 'transparent',
                      font: 'inherit',
                      fontSize: '0.78rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      '&:hover': { color: 'text.primary', backgroundColor: 'action.hover' },
                    }}
                  >
                    {item.text}
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {relatedArticles.length > 0 && (
            <Box>
              <RailHeading icon={<LinkIcon />} label={t('wiki:article.links')} />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {relatedArticles.map((related) => (
                  <Chip
                    key={related.id}
                    label={related.label ? `${related.title} · ${related.label}` : related.title}
                    size="small"
                    variant="outlined"
                    onClick={() => navigate(`/project/${projectNumber}/wiki/${related.id}`)}
                    sx={{
                      maxWidth: '100%',
                      borderColor: 'divider',
                      color: 'text.secondary',
                      cursor: 'pointer',
                      '&:hover': { color: 'primary.main', borderColor: 'primary.main' },
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <RailHeading icon={<ScheduleIcon />} label={t('wiki:article.timestamps')} />
            <Typography variant="caption" color="text.disabled" display="block">
              {t('wiki:article.created', {
                date: new Date(article.createdAt).toLocaleString(i18n.language),
              })}
            </Typography>
            <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5 }}>
              {t('wiki:article.updated', {
                date: new Date(article.updatedAt).toLocaleString(i18n.language),
              })}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const RailHeading: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 0.75,
      pb: 1.5,
      color: 'text.disabled',
      '& .MuiSvgIcon-root': { fontSize: 15 },
    }}
  >
    {icon}
    <Typography
      sx={{
        fontFamily: (theme) => theme.campaigner.typography.mono,
        fontSize: '0.6rem',
        letterSpacing: '.16em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </Typography>
  </Box>
);
