import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box, Typography, TextField, IconButton,
  Button, Chip, Select, MenuItem, FormControl,
  InputAdornment, Tooltip, useTheme, alpha,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PeopleIcon from '@mui/icons-material/People';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import { useParams, useNavigate } from 'react-router-dom';
import { useDynastyStore } from '@/store/useDynastyStore';
import { useBranchStore } from '@/store/useBranchStore';
import { useUIStore } from '@/store/useUIStore';
import { useCharacterStore } from '@/store/useCharacterStore';
import { useFactionStore } from '@/store/useFactionStore';
import { DndButton } from '@/components/ui/DndButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { AssetAvatar } from '@/components/ui/AssetAvatar';
import { GlassCard } from '@/components/ui/GlassCard';
import { useDebounce } from '@/hooks/useDebounce';
import { routes } from '@/utils/routes';
import { useTranslation } from 'react-i18next';
import {
  CampaignerPage,
  CampaignerPageHeader,
  CampaignerSurface,
} from '@/components/ui/CampaignerPrimitives';
import { CatalogAside, CatalogColumns } from '@/components/catalog/CatalogLayout';
import {
  DYNASTY_STATUSES,
  DYNASTY_STATUS_ICONS,
} from '@campaigner/shared';

export const DynastiesPage: React.FC = () => {
  const { t } = useTranslation(['dynasties', 'common', 'navigation']);
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const navigate = useNavigate();
  const theme = useTheme();
  const { dynasties, total, loading, fetchDynasties, deleteDynasty } = useDynastyStore();
  const { showSnackbar, showConfirmDialog } = useUIStore();
  const activeBranchId = useBranchStore((s) => s.activeBranchId);
  const fetchCharacters = useCharacterStore((s) => s.fetchCharacters);
  const characters = useCharacterStore((s) => s.characters);
  const fetchFactions = useFactionStore((s) => s.fetchFactions);
  const factions = useFactionStore((s) => s.factions);

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

  useEffect(() => {
    void fetchCharacters(pid, { limit: 500 });
    void fetchFactions(pid, { limit: 500 });
  }, [pid, fetchCharacters, fetchFactions, activeBranchId]);

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
    <CampaignerPage>
      <CatalogColumns
        aside={(
          <CatalogAside
            summaryTitle={t('common:catalog.summary')}
            summary={[
              { label: t('dynasties:list.aside.summaryTotal'), value: total },
              { label: t('dynasties:list.aside.summaryActive'), value: dynasties.filter((item) => item.status === 'active').length },
              { label: t('dynasties:list.aside.summaryFounder'), value: dynasties.filter((item) => item.founderId).length },
              { label: t('dynasties:list.aside.summaryLinked'), value: dynasties.filter((item) => item.linkedFactionId).length },
            ]}
            storedTitle={t('common:catalog.storedTitle')}
            storedBody={t('dynasties:list.aside.storedBody')}
            linkedTitle={t('common:catalog.linkedTitle')}
            linked={[
              { label: t('navigation:menu.characters'), value: characters.length },
              { label: t('navigation:menu.states'), value: factions.filter((item) => item.kind === 'state').length },
              { label: t('navigation:menu.factions'), value: factions.filter((item) => item.kind === 'faction').length },
            ]}
          />
        )}
      >
      <CampaignerPageHeader
        eyebrow={t('dynasties:list.eyebrow', { count: total })}
        title={t('dynasties:list.title')}
        description={t('dynasties:list.subtitle')}
        actions={(
          <DndButton
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(routes.dynastyDetail(pid, 'new'))}
          >
            {t('dynasties:list.create')}
          </DndButton>
        )}
      />

      <CampaignerSurface
          sx={{
            p: 1.25,
            mb: dynasties.length === 0 ? 0 : 3,
            display: 'flex',
            gap: 1.25,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
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
      </CampaignerSurface>

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
            templatesTitle={t('dynasties:list.templates.title')}
            templates={[
              {
                icon: <MilitaryTechIcon />,
                title: t('dynasties:list.templates.ruling.title'),
                description: t('dynasties:list.templates.ruling.description'),
                onClick: () => navigate(routes.dynastyDetail(pid, 'new')),
              },
              {
                icon: <Diversity3Icon />,
                title: t('dynasties:list.templates.noble.title'),
                description: t('dynasties:list.templates.noble.description'),
                onClick: () => navigate(routes.dynastyDetail(pid, 'new')),
              },
              {
                icon: <HistoryEduIcon />,
                title: t('dynasties:list.templates.ancient.title'),
                description: t('dynasties:list.templates.ancient.description'),
                onClick: () => navigate(routes.dynastyDetail(pid, 'new')),
              },
            ]}
          />
        )
      ) : (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' },
          gap: 2.25,
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
                  minHeight: 260,
                  overflow: 'hidden',
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                  background: `radial-gradient(circle at 50% 0%, ${alpha(dynastyColor, 0.13)}, transparent 48%), ${alpha(
                    theme.palette.background.paper,
                    0.35
                  )}`,
                  '&:hover': {
                    '& .dynasty-actions': { opacity: 1 },
                    '& .dynasty-crest': { transform: 'translateY(-3px) scale(1.04)' },
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
                  <AssetAvatar
                    className="dynasty-crest"
                    assetPath={dynasty.imagePath}
                    sx={{
                      width: 82, height: 82, mx: 'auto', mb: 1.75,
                      borderRadius: '50%',
                      bgcolor: alpha(dynastyColor, 0.1),
                      border: `2px solid ${alpha(dynastyColor, 0.3)}`,
                      boxShadow: `0 12px 32px ${alpha(dynastyColor, 0.12)}`,
                      color: dynastyColor,
                      fontSize: '2rem',
                      transition: 'transform 180ms ease',
                    }}
                  >
                    👑
                  </AssetAvatar>

                  {/* Name */}
                  <Typography sx={{
                    fontFamily: '"Cormorant Garamond", serif', fontWeight: 600,
                    fontSize: '1.55rem', lineHeight: 1.1, color: 'text.primary',
                    px: 2,
                  }}>
                    {dynasty.name}
                  </Typography>

                  {/* Motto */}
                  {dynasty.motto && (
                    <Typography sx={{
                      color: theme.palette.primary.main, fontStyle: 'italic',
                      fontFamily: '"Cormorant Garamond", serif',
                      fontSize: '1rem', mt: 0.65, px: 2,
                    }}>
                      «{dynasty.motto}»
                    </Typography>
                  )}
                </Box>

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

                {dynasty.description && (
                  <Box sx={{ px: 2.5, pb: 2 }}>
                    <Typography variant="body2" sx={{
                      color: 'text.secondary', fontSize: '0.8rem', lineHeight: 1.65,
                      pt: 1.5, borderTop: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
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
      </CatalogColumns>
    </CampaignerPage>
  );
};
