import React from 'react';
import { Box, Typography, Chip, Tooltip, IconButton, alpha, useTheme } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
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
        p: { xs: 2, md: 2.5 },
        borderRadius: '12px',
        borderLeft: `2px solid ${importanceColor}`,
        backgroundColor: alpha(theme.palette.common.white, 0.018),
        '&:hover': {
          '& .dogma-actions': { opacity: 1 },
        },
        '&:focus-within .dogma-actions': { opacity: 1 },
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Box display="flex" alignItems="center" gap={1} mb={0.75} flexWrap="wrap">
            {dogma.icon && (
              <Typography sx={{ fontSize: '1.2rem' }}>{dogma.icon}</Typography>
            )}
            <Typography sx={{
              fontFamily: theme.campaigner.typography.display,
              fontWeight: 600,
              color: 'text.primary',
              fontSize: '1.22rem',
              lineHeight: 1.25,
            }}>
              {dogma.title}
            </Typography>
            <Chip
              label={t(`dogmas:importance.${dogma.importance}`)}
              size="small"
              sx={{
                height: 21, fontSize: '0.62rem', fontWeight: 500,
                fontFamily: theme.campaigner.typography.mono,
                letterSpacing: '.05em',
                textTransform: 'uppercase',
                backgroundColor: alpha(importanceColor, 0.1),
                color: importanceColor,
                border: `1px solid ${alpha(importanceColor, 0.22)}`,
              }}
            />
            <Tooltip title={dogma.isPublic ? t('dogmas:visibility.public') : t('dogmas:listItem.tooltipHidden')}>
              <Box sx={{ display: 'inline-flex' }}>
                {dogma.isPublic
                  ? <VisibilityIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
                  : <VisibilityOffIcon sx={{ fontSize: 15, color: 'text.secondary' }} />}
              </Box>
            </Tooltip>
          </Box>

          {dogma.description && (
            <Typography variant="body2" sx={{
              color: 'text.secondary', fontSize: '0.82rem', lineHeight: 1.7, mt: 0.5,
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
            }}>
              {dogma.description}
            </Typography>
          )}

          {dogma.impact && (
            <Box display="flex" alignItems="baseline" gap={0.75} mt={1.25}>
              <Typography variant="caption" sx={{
                color: theme.palette.warning.main, fontWeight: 500, flexShrink: 0,
                fontFamily: theme.campaigner.typography.mono,
                fontSize: '0.65rem',
                textTransform: 'uppercase',
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
            <Box display="flex" alignItems="baseline" gap={0.75} mt={0.5}>
              <Typography variant="caption" sx={{
                color: theme.palette.error.main, fontWeight: 500, flexShrink: 0,
                fontFamily: theme.campaigner.typography.mono,
                fontSize: '0.65rem',
                textTransform: 'uppercase',
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
                  height: 23, fontSize: '0.68rem', fontWeight: 400,
                  backgroundColor: tag.color ? alpha(tag.color, 0.1) : alpha(theme.palette.primary.main, 0.07),
                  color: tag.color || theme.palette.primary.main, borderRadius: 1,
                  border: `1px solid ${tag.color ? alpha(tag.color, 0.22) : alpha(theme.palette.primary.main, 0.2)}`,
                }} />
              ))}
            </Box>
          )}
        </Box>

        <Box className="dogma-actions" display="flex" alignItems="center" gap={0}
          sx={{ opacity: { xs: 1, md: 0 }, transition: 'opacity 0.15s', flexShrink: 0, ml: 1 }}>
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
