import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box, Typography, TextField, IconButton,
  Button, Chip, Select, MenuItem, FormControl,
  InputAdornment, Tooltip, Avatar, useTheme, alpha,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PeopleIcon from '@mui/icons-material/People';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useParams, useNavigate } from 'react-router-dom';
import { useDynastyStore } from '@/store/useDynastyStore';
import { useBranchStore } from '@/store/useBranchStore';
import { useUIStore } from '@/store/useUIStore';
import { DndButton } from '@/components/ui/DndButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassCard } from '@/components/ui/GlassCard';
import { useDebounce } from '@/hooks/useDebounce';
import { routes } from '@/utils/routes';
import { useTranslation } from 'react-i18next';
import {
  DYNASTY_STATUSES,
  DYNASTY_STATUS_ICONS,
} from '@campaigner/shared';

export const DynastiesPage: React.FC = () => {
  const { t } = useTranslation(['dynasties', 'common']);
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const navigate = useNavigate();
  const theme = useTheme();
  const { dynasties, total, loading, fetchDynasties, deleteDynasty } = useDynastyStore();
  const { showSnackbar, showConfirmDialog } = useUIStore();
  const activeBranchId = useBranchStore((s) => s.activeBranchId);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [filterStatus, setFilterStatus] = useState('');
  const [initialized, setInitialized] = useState(false);

  const STATUS_COLORS: Record<string, string> = useMemo(() => ({
    active: theme.palette.success.main,
    extinct: theme.palette.text.secondary,
    exiled: theme.palette.warning.main,
    declining: theme.palette.error.main,
    rising: theme.palette.info.main,
  }), [theme]);

  const loadDynasties = useCallback(async () => {
    await fetchDynasties(pid, {
      status: filterStatus || undefined,
      search: debouncedSearch || undefined,
    });
    setInitialized(true);
  }, [pid, filterStatus, debouncedSearch, fetchDynasties, activeBranchId]);

  useEffect(() => {
    setInitialized(false);
    loadDynasties();
  }, [loadDynasties]);

  const hasFilters = !!(debouncedSearch || filterStatus);

  const clearFilters = () => {
    setSearch('');
    setFilterStatus('');
  };

  const handleDelete = (id: number, name: string) => {
    showConfirmDialog(
      t('dynasties:list.confirmDeleteTitle'),
      t('dynasties:list.confirmDeleteMessage', { name }),
      async () => {
      try {
        await deleteDynasty(id);
        showSnackbar(t('dynasties:snackbar.deleted'), 'success');
      } catch {
        showSnackbar(t('dynasties:snackbar.deleteFailed'), 'error');
      }
    });
  };

  if (!initialized && loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography sx={{ color: 'text.secondary' }}>{t('common:loading')}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '1.8rem', color: 'text.primary' }}>
            {t('dynasties:list.title')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {t('dynasties:list.subtitle')}
          </Typography>
        </Box>
        <DndButton variant="contained" startIcon={<AddIcon />} onClick={() => navigate(routes.dynastyDetail(pid, 'new'))}>
          {t('dynasties:list.create')}
        </DndButton>
      </Box>

      {/* Filters */}
      {(dynasties.length > 0 || hasFilters) && (
        <GlassCard sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder={t('dynasties:list.searchPlaceholder')}
            value={search} onChange={e => setSearch(e.target.value)}
            sx={{ flexGrow: 1, maxWidth: 400 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            size="small"
          />

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} displayEmpty>
              <MenuItem value="">{t('dynasties:list.anyStatus')}</MenuItem>
              {DYNASTY_STATUSES.map(s => (
                <MenuItem key={s} value={s}>
                  {DYNASTY_STATUS_ICONS[s]} {t(`dynasties:statuses.${s}`, { defaultValue: s })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {hasFilters && (
            <Button variant="outlined" onClick={clearFilters} size="small"
              sx={{ borderColor: alpha(theme.palette.primary.main, 0.5), textTransform: 'none' }}>
              {t('dynasties:list.resetFilters')}
            </Button>
          )}

          <Typography variant="body2" sx={{ color: 'text.secondary', ml: 'auto' }}>
            {t('dynasties:list.count', { shown: dynasties.length, total })}
          </Typography>
        </GlassCard>
      )}

      {/* Content */}
      {dynasties.length === 0 && !loading ? (
        hasFilters ? (
          <EmptyState
            icon={<SearchIcon sx={{ fontSize: 64 }} />}
            title={t('dynasties:list.emptyFilteredTitle')}
            description={t('dynasties:list.emptyFilteredDescription')}
            actionLabel={t('dynasties:list.emptyFilteredAction')}
            onAction={clearFilters}
          />
        ) : (
          <EmptyState
            icon={<AccountTreeIcon sx={{ fontSize: 64 }} />}
            title={t('dynasties:list.emptyNoDynastiesTitle')}
            description={t('dynasties:list.emptyNoDynastiesDescription')}
            actionLabel={t('dynasties:list.emptyNoDynastiesAction')}
            onAction={() => navigate(routes.dynastyDetail(pid, 'new'))}
          />
        )
      ) : (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 2.5,
        }}>
          {dynasties.map((dynasty) => {
            const statusColor = STATUS_COLORS[dynasty.status] || theme.palette.primary.main;
            const dynastyColor = dynasty.color || statusColor;

            return (
              <GlassCard
                interactive
                key={dynasty.id}
                onClick={() => navigate(routes.dynastyDetail(pid, dynasty.id))}
                sx={{
                  p: 0,
                  '&:hover': {
                    '& .dynasty-actions': { opacity: 1 },
                  },
                }}
              >
                {/* Color bar */}
                <Box sx={{
                  height: 4,
                  background: dynasty.color
                    ? `linear-gradient(90deg, ${dynasty.color}, ${dynasty.secondaryColor || dynasty.color})`
                    : `linear-gradient(90deg, ${statusColor}, transparent)`,
                }} />

                {/* Centered crest + name */}
                <Box sx={{ pt: 3, pb: 2, textAlign: 'center', position: 'relative' }}>
                  {/* Actions top-right */}
                  <Box className="dynasty-actions" sx={{
                    position: 'absolute', top: 8, right: 8,
                    opacity: 0, transition: 'opacity 0.15s',
                    display: 'flex', gap: 0,
                  }}>
                    <Tooltip title={t('dynasties:list.tooltipOpen')}>
                      <IconButton size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('dynasties:list.tooltipDelete')}>
                      <IconButton size="small"
                        onClick={(e) => { e.stopPropagation(); handleDelete(dynasty.id, dynasty.name); }}
                        sx={{ color: theme.palette.error.main, '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) } }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* Crest */}
                  <Avatar
                    src={dynasty.imagePath || undefined}
                    sx={{
                      width: 72, height: 72, mx: 'auto', mb: 1.5,
                      borderRadius: '50%',
                      bgcolor: alpha(dynastyColor, 0.1),
                      border: `2px solid ${alpha(dynastyColor, 0.3)}`,
                      color: dynastyColor,
                      fontSize: '2rem',
                    }}
                  >
                    👑
                  </Avatar>

                  {/* Name */}
                  <Typography sx={{
                    fontFamily: '"Cinzel", serif', fontWeight: 700,
                    fontSize: '1.15rem', color: 'text.primary',
                    px: 2,
                  }}>
                    {dynasty.name}
                  </Typography>

                  {/* Motto */}
                  {dynasty.motto && (
                    <Typography sx={{
                      color: theme.palette.primary.main, fontStyle: 'italic',
                      fontSize: '0.8rem', mt: 0.5, px: 2,
                    }}>
                      «{dynasty.motto}»
                    </Typography>
                  )}
                </Box>

                {/* Info row */}
                <Box sx={{
                  display: 'flex', justifyContent: 'center', gap: 1,
                  px: 2, pb: 2, flexWrap: 'wrap',
                }}>
                  <Chip
                    label={`${DYNASTY_STATUS_ICONS[dynasty.status] || ''} ${t(`dynasties:statuses.${dynasty.status}`, { defaultValue: dynasty.status })}`.trim()}
                    size="small"
                    sx={{
                      height: 22, fontSize: '0.7rem', fontWeight: 600,
                      backgroundColor: alpha(statusColor, 0.15),
                      color: statusColor, borderRadius: 1,
                    }}
                  />
                  {(dynasty.memberCount ?? 0) > 0 && (
                    <Chip
                      icon={<PeopleIcon sx={{ fontSize: '14px !important', color: 'inherit !important' }} />}
                      label={dynasty.memberCount}
                      size="small"
                      sx={{
                        height: 22, fontSize: '0.7rem',
                        backgroundColor: alpha(theme.palette.text.secondary, 0.1),
                        color: 'text.secondary', borderRadius: 1,
                        '& .MuiChip-icon': { ml: '4px' },
                      }}
                    />
                  )}
                  {dynasty.foundedDate && (
                    <Chip label={`📅 ${dynasty.foundedDate}`} size="small"
                      sx={{
                        height: 22, fontSize: '0.65rem',
                        backgroundColor: alpha(theme.palette.text.secondary, 0.1),
                        color: 'text.secondary', borderRadius: 1,
                      }}
                    />
                  )}
                </Box>

                {/* Description preview */}
                {dynasty.description && (
                  <Box sx={{ px: 2, pb: 2 }}>
                    <Typography variant="body2" sx={{
                      color: 'text.secondary', fontSize: '0.8rem',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      textAlign: 'center',
                    }}>
                      {dynasty.description}
                    </Typography>
                  </Box>
                )}

                {/* Tags */}
                {dynasty.tags && dynasty.tags.length > 0 && (
                  <Box display="flex" gap={0.5} justifyContent="center" px={2} pb={2} flexWrap="wrap">
                    {dynasty.tags.slice(0, 3).map((tag: any) => (
                      <Chip key={tag.id} label={tag.name} size="small" sx={{
                        height: 18, fontSize: '0.6rem',
                        backgroundColor: tag.color ? alpha(tag.color, 0.15) : alpha(theme.palette.primary.main, 0.15),
                        color: tag.color || theme.palette.primary.main, borderRadius: 1,
                      }} />
                    ))}
                    {dynasty.tags.length > 3 && (
                      <Chip label={`+${dynasty.tags.length - 3}`} size="small" sx={{
                        height: 18, fontSize: '0.6rem',
                        backgroundColor: alpha(theme.palette.text.secondary, 0.1),
                        color: 'text.secondary', borderRadius: 1,
                      }} />
                    )}
                  </Box>
                )}
              </GlassCard>
            );
          })}
        </Box>
      )}
    </Box>
  );
};
