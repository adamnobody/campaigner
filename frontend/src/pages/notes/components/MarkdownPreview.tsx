import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { SxProps, Theme } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useNavigate } from 'react-router-dom';

interface MarkdownPreviewProps {
  content: string;
  isMarkdown: boolean;
  wikiNotes: { id: number; title: string }[];
  projectId: number;
  scrollRef?: React.Ref<HTMLDivElement>;
}

const markdownStyles: SxProps<Theme> = (theme) => ({
  width: '100%',
  maxWidth: theme.campaigner.reading.columnWidth,
  mx: 'auto',
  color: 'text.secondary',
  fontFamily: theme.campaigner.reading.fontFamily,
  fontSize: `${theme.campaigner.reading.fontSize}px`,
  lineHeight: theme.campaigner.reading.lineHeight,
  '& h1': { fontFamily: theme.campaigner.typography.display, color: 'primary.main', fontSize: '1.8rem', mt: 3, mb: 1, borderBottom: '1px solid', borderColor: 'divider', pb: 1 },
  '& h2': { fontFamily: theme.campaigner.typography.display, color: 'primary.main', fontSize: '1.4rem', mt: 2.5, mb: 1 },
  '& h3': { fontFamily: theme.campaigner.typography.display, color: 'primary.main', fontSize: '1.15rem', mt: 2, mb: 0.5 },
  '& p': { mb: 1.5, lineHeight: 'inherit' },
  '& a': { color: 'primary.main', textDecoration: 'underline', textDecorationColor: 'currentColor' },
  '& code': { backgroundColor: 'action.hover', padding: '2px 6px', borderRadius: '4px', fontFamily: theme.campaigner.typography.mono, fontSize: '0.85em' },
  '& pre': { backgroundColor: 'rgba(0,0,0,0.4)', p: 2, borderRadius: 2, overflow: 'auto', border: '1px solid', borderColor: 'divider', '& code': { backgroundColor: 'transparent', p: 0 } },
  '& blockquote': { borderLeft: '3px solid', borderColor: 'primary.main', pl: 2, ml: 0, opacity: 0.85, fontStyle: 'italic' },
  '& ul, & ol': { pl: 3, mb: 1.5 },
  '& li': { mb: 0.5, lineHeight: 'inherit' },
  '& table': { borderCollapse: 'collapse', width: '100%', mb: 2 },
  '& th, & td': { border: '1px solid rgba(255,255,255,0.1)', px: 2, py: 1, textAlign: 'left' },
  '& th': { backgroundColor: 'rgba(255,255,255,0.05)', fontWeight: 600 },
  '& hr': { border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', my: 3 },
  '& img': { maxWidth: '100%', borderRadius: 1 },
  '& strong': { color: 'text.primary', fontWeight: 700 },
  '& em': { color: 'text.primary' },
});

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content, isMarkdown, wikiNotes, projectId, scrollRef,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation(['notes', 'common']);
  const wikiNotesMap = React.useMemo(() => {
    return new Map(wikiNotes.map((note) => [note.id, note.title]));
  }, [wikiNotes]);

  return (
    <Box ref={scrollRef} sx={{ height: '100%', overflow: 'auto', p: 3 }}>
      <Box sx={markdownStyles}>
      {isMarkdown ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            a: ({ href, children }) => {
              if (href?.startsWith('/__note__/')) {
                const noteIdStr = href.replace('/__note__/', '');
                const targetNoteId = parseInt(noteIdStr, 10);
                const found = wikiNotesMap.get(targetNoteId);

                if (!Number.isNaN(targetNoteId) && found) {
                  return (
                    <a
                      href={href}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/project/${projectId}/notes/${targetNoteId}`);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {children}
                    </a>
                  );
                }

                return (
                  <span
                    style={{
                      color: '#FF6B6B',
                      borderBottom: '1px dashed rgba(255,107,107,0.4)',
                      cursor: 'not-allowed',
                    }}
                  >
                    {children}
                  </span>
                );
              }

              if (href && href.startsWith('/project/')) {
                return (
                  <a
                    href={href}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(href);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {children}
                  </a>
                );
              }

              return (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              );
            },
          }}
          skipHtml={false}
        >
          {content || `*${t('notes:preview.emptyMarkdown')}*`}
        </ReactMarkdown>
      ) : (
        <Typography
          component="pre"
          sx={{
            whiteSpace: 'pre-wrap',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            lineHeight: 'inherit',
            color: 'inherit',
          }}
        >
          {content || t('notes:preview.empty')}
        </Typography>
      )}
      </Box>
    </Box>
  );
};
