import React from 'react';
import {
  Box, Typography, IconButton, Chip, Tooltip, useTheme, alpha,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import type { Note, WikiLink } from '@campaigner/shared';
import { getPlainPreviewText } from './wikiPreviewText';
import { GlassCard } from '@/components/ui/GlassCard';

type Props = {
  note: Note;
  noteLinks: WikiLink[];
  onOpenArticle: () => void;
  onToggleTagCategory: (tagName: string) => void;
  onEditTags: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
};

export const WikiArticleCard: React.FC<Props> = ({
  note,
  noteLinks,
  onOpenArticle,
  onToggleTagCategory,
  onEditTags,
  onDelete,
}) => {
  const theme = useTheme();

  return (
    <GlassCard
      interactive
      onClick={onOpenArticle}
      sx={{
        minWidth: 0,
        width: '100%',
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        '&:hover': {
          '& .card-actions': { opacity: 1 },
        },
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1} sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontFamily: '"Cinzel", serif',
            fontWeight: 600,
            fontSize: '1.1rem',
            color: 'text.primary',
            flexGrow: 1,
            pr: 1,
            minWidth: 0,
          }}
          noWrap
        >
          {note.title}
        </Typography>

        <Box className="card-actions" display="flex" gap={0} sx={{ opacity: 0, transition: 'opacity 0.15s', flexShrink: 0 }}>
          <Tooltip title="Редактировать теги">
            <IconButton
              size="small"
              onClick={onEditTags}
              sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
            >
              <LocalOfferIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Удалить">
            <IconButton
              size="small"
              onClick={onDelete}
              sx={{ color: theme.palette.error.main, '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) } }}
            >
              <DeleteIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {note.content && (
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            fontSize: '0.85rem',
            lineHeight: 1.6,
            minWidth: 0,
            wordBreak: 'break-word',
          }}
        >
          {getPlainPreviewText(note.content).substring(0, 150)}
        </Typography>
      )}

      <Box mt="auto" pt={1.5}>
        {note.tags && note.tags.length > 0 && (
          <Box display="flex" gap={0.5} flexWrap="wrap" sx={{ minWidth: 0 }}>
            {(note.tags as { id: number; name: string; color?: string }[]).map((tag) => (
              <Chip
                key={tag.id}
                label={tag.name}
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleTagCategory(tag.name);
                }}
                sx={{
                  maxWidth: '100%',
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  backgroundColor: tag.color ? alpha(tag.color, 0.15) : alpha(theme.palette.primary.main, 0.15),
                  color: tag.color || theme.palette.primary.main,
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.8 },
                  '& .MuiChip-label': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  },
                }}
              />
            ))}
          </Box>
        )}

        {(!note.tags || note.tags.length === 0) && (
          <Box
            display="flex"
            alignItems="center"
            gap={0.5}
            onClick={(e) => {
              e.stopPropagation();
              onEditTags(e);
            }}
            sx={{ cursor: 'pointer', '&:hover': { '& .add-tag-text': { color: 'text.primary' } } }}
          >
            <LocalOfferIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography
              className="add-tag-text"
              variant="caption"
              sx={{ color: 'text.secondary', transition: 'color 0.15s' }}
            >
              + добавить теги
            </Typography>
          </Box>
        )}

        {noteLinks.length > 0 && (
          <Box mt={1.5} pt={1.5} borderTop={`1px solid ${theme.palette.divider}`} sx={{ minWidth: 0 }}>
            <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
              <AccountTreeIcon sx={{ fontSize: 14, color: theme.palette.primary.main }} />
              <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                Связи ({noteLinks.length})
              </Typography>
            </Box>
            <Box display="flex" flexDirection="column" gap={0.3}>
              {noteLinks.slice(0, 3).map((link) => {
                const otherTitle = link.sourceNoteId === note.id ? link.targetTitle : link.sourceTitle;
                const label = link.label ? ` (${link.label})` : '';
                return (
                  <Typography
                    key={link.id}
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.7rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      minWidth: 0,
                    }}
                  >
                    → {otherTitle}{label}
                  </Typography>
                );
              })}
              {noteLinks.length > 3 && (
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
                  +{noteLinks.length - 3} ещё
                </Typography>
              )}
            </Box>
          </Box>
        )}

        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 1 }}>
          {new Date(note.updatedAt).toLocaleDateString('ru-RU')}
        </Typography>
      </Box>
    </GlassCard>
  );
};
