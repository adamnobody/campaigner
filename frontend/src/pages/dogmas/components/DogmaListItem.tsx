import React from 'react';
import { Box, Typography, Chip, Tooltip, IconButton, alpha, useTheme } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useTranslation } from 'react-i18next';
import type { Dogma } from '@campaigner/shared';
import { useImportanceColors } from './dogmaStyles';
import { GlassCard } from '@/components/ui/GlassCard';

type Props = {
  dogma: Dogma;
  onEdit: (dogma: Dogma) => void;
  onDelete: (id: number, title: string) => void;
};

export const DogmaListItem: React.FC<Props> = ({ dogma, onEdit, onDelete }) => {
  const { t } = useTranslation(['dogmas', 'common']);
  const theme = useTheme();
  const IMPORTANCE_COLORS = useImportanceColors();
  const importanceColor = IMPORTANCE_COLORS[dogma.importance] || theme.palette.primary.main;

  return (
    <GlassCard
      interactive
      sx={{
        p: 2.5,
        borderLeft: `4px solid ${importanceColor}`,
        '&:hover': {
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
            <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1.05rem' }}>
              {dogma.title}
            </Typography>
            <Chip
              label={t(`dogmas:importance.${dogma.importance}`)}
              size="small"
              sx={{
                height: 20, fontSize: '0.65rem', fontWeight: 600,
                backgroundColor: alpha(importanceColor, 0.15),
                color: importanceColor, borderRadius: 1,
              }}
            />
            {!dogma.isPublic && (
              <Tooltip title={t('dogmas:listItem.tooltipHidden')}>
                <VisibilityOffIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              </Tooltip>
            )}
          </Box>

          {dogma.description && (
            <Typography variant="body2" sx={{
              color: 'text.secondary', fontSize: '0.88rem', mt: 0.5,
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
            }}>
              {dogma.description}
            </Typography>
          )}

          {dogma.impact && (
            <Box display="flex" alignItems="center" gap={0.5} mt={1}>
              <Typography variant="caption" sx={{
                color: theme.palette.warning.main, fontWeight: 600, flexShrink: 0,
              }}>
                {t('dogmas:listItem.impactPrefix')}
              </Typography>
              <Typography variant="caption" sx={{
                color: 'text.secondary',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {dogma.impact}
              </Typography>
            </Box>
          )}

          {dogma.exceptions && (
            <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
              <Typography variant="caption" sx={{
                color: theme.palette.error.main, fontWeight: 600, flexShrink: 0,
              }}>
                {t('dogmas:listItem.exceptionsPrefix')}
              </Typography>
              <Typography variant="caption" sx={{
                color: 'text.secondary',
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
                  backgroundColor: tag.color ? alpha(tag.color, 0.15) : alpha(theme.palette.primary.main, 0.15),
                  color: tag.color || theme.palette.primary.main, borderRadius: 1,
                }} />
              ))}
            </Box>
          )}
        </Box>

        <Box className="dogma-actions" display="flex" alignItems="center" gap={0}
          sx={{ opacity: 0, transition: 'opacity 0.15s', flexShrink: 0, ml: 1 }}>
          <Tooltip title={t('dogmas:listItem.tooltipEdit')}>
            <IconButton size="small" onClick={() => onEdit(dogma)}
              sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('dogmas:listItem.tooltipDelete')}>
            <IconButton size="small" onClick={() => onDelete(dogma.id, dogma.title)}
              sx={{ color: theme.palette.error.main, '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) } }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </GlassCard>
  );
};
