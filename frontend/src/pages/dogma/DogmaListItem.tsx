import React from 'react';
import { Box, Typography, Paper, Chip, Tooltip, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { DOGMA_IMPORTANCE_LABELS } from '@campaigner/shared';
import type { Dogma } from '@campaigner/shared';
import { IMPORTANCE_COLORS } from './dogmaStyles';

type Props = {
  dogma: Dogma;
  onEdit: (dogma: Dogma) => void;
  onDelete: (id: number, title: string) => void;
};

export const DogmaListItem: React.FC<Props> = ({ dogma, onEdit, onDelete }) => (
  <Paper
    sx={{
      p: 2.5,
      backgroundColor: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderLeft: `4px solid ${IMPORTANCE_COLORS[dogma.importance] || 'rgba(130,130,255,0.6)'}`,
      borderRadius: 2,
      transition: 'all 0.15s',
      '&:hover': {
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderColor: 'rgba(255,255,255,0.15)',
        '& .dogma-actions': { opacity: 1 },
      },
    }}
  >
    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Box display="flex" alignItems="center" gap={1} mb={0.5} flexWrap="wrap">
          {dogma.icon && (
            <Typography sx={{ fontSize: '1.2rem' }}>{dogma.icon}</Typography>
          )}
          <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '1.05rem' }}>
            {dogma.title}
          </Typography>
          <Chip
            label={DOGMA_IMPORTANCE_LABELS[dogma.importance]}
            size="small"
            sx={{
              height: 20, fontSize: '0.65rem', fontWeight: 600,
              backgroundColor: IMPORTANCE_COLORS[dogma.importance] || 'rgba(130,130,255,0.2)',
              color: '#fff', borderRadius: 1,
            }}
          />
          {!dogma.isPublic && (
            <Tooltip title="Не известна жителям мира">
              <VisibilityOffIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} />
            </Tooltip>
          )}
        </Box>

        {dogma.description && (
          <Typography variant="body2" sx={{
            color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', mt: 0.5,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
          }}>
            {dogma.description}
          </Typography>
        )}

        {dogma.impact && (
          <Box display="flex" alignItems="center" gap={0.5} mt={1}>
            <Typography variant="caption" sx={{
              color: 'rgba(255,200,100,0.7)', fontWeight: 600, flexShrink: 0,
            }}>
              Влияние:
            </Typography>
            <Typography variant="caption" sx={{
              color: 'rgba(255,255,255,0.4)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {dogma.impact}
            </Typography>
          </Box>
        )}

        {dogma.exceptions && (
          <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
            <Typography variant="caption" sx={{
              color: 'rgba(255,107,107,0.7)', fontWeight: 600, flexShrink: 0,
            }}>
              Исключения:
            </Typography>
            <Typography variant="caption" sx={{
              color: 'rgba(255,255,255,0.4)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {dogma.exceptions}
            </Typography>
          </Box>
        )}

        {dogma.tags && dogma.tags.length > 0 && (
          <Box display="flex" gap={0.5} mt={1} flexWrap="wrap">
            {(dogma.tags as { id: number; name: string; color?: string }[]).map((tag) => (
              <Chip key={tag.id} label={tag.name} size="small" sx={{
                height: 20, fontSize: '0.65rem', fontWeight: 600,
                backgroundColor: tag.color || 'rgba(130,130,255,0.2)',
                color: '#fff', borderRadius: 1,
              }} />
            ))}
          </Box>
        )}
      </Box>

      <Box className="dogma-actions" display="flex" alignItems="center" gap={0}
        sx={{ opacity: 0, transition: 'opacity 0.15s', flexShrink: 0, ml: 1 }}>
        <Tooltip title="Редактировать">
          <IconButton size="small" onClick={() => onEdit(dogma)}
            sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: '#fff' } }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Удалить">
          <IconButton size="small" onClick={() => onDelete(dogma.id, dogma.title)}
            sx={{ color: 'rgba(255,100,100,0.4)', '&:hover': { color: 'rgba(255,100,100,0.8)' } }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  </Paper>
);
