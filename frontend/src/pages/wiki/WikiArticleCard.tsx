import React from 'react';
import {
  Box, Typography, Card, CardContent, IconButton, Chip, Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import type { Note } from '@campaigner/shared';
import type { WikiLink } from '@/store/useWikiStore';
import { getPlainPreviewText } from './wikiPreviewText';

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
}) => (
  <Card
    sx={{
      cursor: 'pointer',
      minWidth: 0,
      width: '100%',
      backgroundColor: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      transition: 'all 0.2s',
      '&:hover': {
        transform: 'translateY(-2px)',
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderColor: 'rgba(255,255,255,0.15)',
        '& .card-actions': { opacity: 1 },
      },
    }}
    onClick={onOpenArticle}
  >
    <CardContent sx={{ minWidth: 0 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1} sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontFamily: '"Cinzel", serif',
            fontWeight: 600,
            fontSize: '1.1rem',
            color: '#fff',
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
              sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: 'rgba(201,169,89,0.8)' } }}
            >
              <LocalOfferIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Удалить">
            <IconButton
              size="small"
              onClick={onDelete}
              sx={{ color: 'rgba(255,100,100,0.4)', '&:hover': { color: 'rgba(255,100,100,0.8)' } }}
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
            color: 'rgba(255,255,255,0.5)',
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

      {note.tags && note.tags.length > 0 && (
        <Box display="flex" gap={0.5} mt={1.5} flexWrap="wrap" sx={{ minWidth: 0 }}>
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
                backgroundColor: tag.color || 'rgba(130,130,255,0.2)',
                color: '#fff',
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
          mt={1.5}
          onClick={(e) => {
            e.stopPropagation();
            onEditTags(e);
          }}
          sx={{ cursor: 'pointer', '&:hover': { '& .add-tag-text': { color: 'rgba(201,169,89,0.8)' } } }}
        >
          <LocalOfferIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.2)' }} />
          <Typography
            className="add-tag-text"
            variant="caption"
            sx={{ color: 'rgba(255,255,255,0.2)', transition: 'color 0.15s' }}
          >
            + добавить теги
          </Typography>
        </Box>
      )}

      {noteLinks.length > 0 && (
        <Box mt={1.5} pt={1.5} borderTop="1px solid rgba(255,255,255,0.06)" sx={{ minWidth: 0 }}>
          <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
            <AccountTreeIcon sx={{ fontSize: 14, color: 'rgba(78,205,196,0.6)' }} />
            <Typography variant="caption" sx={{ color: 'rgba(78,205,196,0.6)', fontWeight: 600 }}>
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
                    color: 'rgba(78,205,196,0.5)',
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
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>
                +{noteLinks.length - 3} ещё
              </Typography>
            )}
          </Box>
        </Box>
      )}

      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.25)', display: 'block', mt: 1 }}>
        {new Date(note.updatedAt).toLocaleDateString('ru-RU')}
      </Typography>
    </CardContent>
  </Card>
);
