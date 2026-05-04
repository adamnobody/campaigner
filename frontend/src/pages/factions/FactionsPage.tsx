import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Button,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputAdornment,
  Tooltip,
  Avatar,
  useTheme,
  alpha,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import GroupsIcon from '@mui/icons-material/Groups';
import CastleIcon from '@mui/icons-material/Castle';
import PeopleIcon from '@mui/icons-material/People';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFactionStore } from '@/store/useFactionStore';
import { useUIStore } from '@/store/useUIStore';
import { DndButton } from '@/components/ui/DndButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassCard } from '@/components/ui/GlassCard';
import { useDebounce } from '@/hooks/useDebounce';
import { routes } from '@/utils/routes';
import {
  FACTION_KIND_ICONS,
  FACTION_STATUS_ICONS,
  FACTION_STATUSES,
  FACTION_TYPE_ICONS,
  STATE_TYPE_ICONS,
} from '@campaigner/shared';
import type { Faction } from '@campaigner/shared';

const PAGE_SIZE = 40;

type FactionEntityType = 'state' | 'faction';

interface FactionsPageProps {
  entityType?: FactionEntityType;
}

export const FactionsPage: React.FC<FactionsPageProps> = ({ entityType = 'faction' }) => {
  const { t } = useTranslation(['factions', 'common']);
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const navigate = useNavigate();
  const theme = useTheme();
  const {
    factions,
    total,
    loading,
    loadingMore,
    fetchFactions,
    deleteFaction,
  } = useFactionStore();
  const { showSnackbar, showConfirmDialog } = useUIStore();

  const isStatePage = entityType === 'state';
  const listTitle = isStatePage ? t('factions:list.titleStates') : t('factions:list.titleFactions');
  const createLabel = isStatePage ? t('factions:list.createState') : t('factions:list.createFaction');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [filterStatus, setFilterStatus] = useState('');
  const [totalUnfiltered, setTotalUnfiltered] = useState(0);
  const [initialized, setInitialized] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const statusColors: Record<string, string> = useMemo(
    () => ({
      active: theme.palette.success.main,
      disbanded: theme.palette.text.secondary,
      secret: theme.palette.secondary.main,
      exiled: theme.palette.warning.main,
      destroyed: theme.palette.error.main,
    }),
    [theme]
  );

  const loadFactions = useCallback(
    async (append = false) => {
      const offset = append ? useFactionStore.getState().factions.length : 0;
      await fetchFactions(pid, {
        kind: entityType,
        status: filterStatus || undefined,
        search: debouncedSearch || undefined,
        limit: PAGE_SIZE,
        offset,
        append,
      });
      setInitialized(true);
    },
    [debouncedSearch, entityType, fetchFactions, filterStatus, pid]
  );

  useEffect(() => {
    fetchFactions(pid, { kind: entityType, limit: 1, offset: 0 }).then(() => {
      setTotalUnfiltered(useFactionStore.getState().total);
    });
  }, [entityType, fetchFactions, pid]);

  useEffect(() => {
    setInitialized(false);
    loadFactions(false);
  }, [loadFactions]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const state = useFactionStore.getState();
        if (
          entries[0].isIntersecting &&
          !state.loadingMore &&
          !state.loading &&
          state.factions.length < state.total
        ) {
          loadFactions(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [loadFactions]);

  const hasFilters = !!(debouncedSearch || filterStatus);
  const clearFilters = () => {
    setSearch('');
    setFilterStatus('');
  };

  const handleDelete = (id: number, name: string) => {
    showConfirmDialog(
      isStatePage ? t('factions:list.confirmDeleteTitleState') : t('factions:list.confirmDeleteTitleFaction'),
      t('factions:list.confirmDeleteMessage', { name }),
      async () => {
        try {
          await deleteFaction(id);
          showSnackbar(t('factions:snackbar.entityDeleted'), 'success');
          setTotalUnfiltered((prev) => Math.max(0, prev - 1));
        } catch {
          showSnackbar(t('factions:snackbar.deleteFailed'), 'error');
        }
      }
    );
  };

  const getSubtitle = (entity: Faction): string => {
    const parts: string[] = [];
    if (entity.type) {
      const typeLabel =
        entity.kind === 'state'
          ? t(`factions:stateTypes.${entity.type}`)
          : t(`factions:factionTypes.${entity.type}`);
      const icons = entity.kind === 'state' ? STATE_TYPE_ICONS : FACTION_TYPE_ICONS;
      parts.push(`${icons[entity.type] || ''} ${typeLabel}`.trim());
    }
    if (entity.motto) parts.push(`«${entity.motto}»`);
    if (entity.headquarters) parts.push(`📍 ${entity.headquarters}`);
    return parts.join(' · ');
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography
            sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '1.8rem', color: 'text.primary' }}
          >
            {listTitle}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {isStatePage ? t('factions:list.subtitleStates') : t('factions:list.subtitleFactions')}
          </Typography>
        </Box>
        <DndButton variant="contained" startIcon={<AddIcon />} onClick={() => navigate(routes.factionDetail(pid, entityType, 'new'))}>
          {createLabel}
        </DndButton>
      </Box>

      {(totalUnfiltered > 0 || hasFilters) && (
        <GlassCard sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder={isStatePage ? t('factions:list.searchStates') : t('factions:list.searchFactions')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
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
            <Select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} displayEmpty>
              <MenuItem value="">{t('factions:list.anyStatus')}</MenuItem>
              {FACTION_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {FACTION_STATUS_ICONS[status]} {t(`factions:factionStatuses.${status}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {hasFilters && (
            <Button
              variant="outlined"
              onClick={clearFilters}
              size="small"
              sx={{ borderColor: alpha(theme.palette.primary.main, 0.5), textTransform: 'none' }}
            >
              {t('common:reset')}
            </Button>
          )}

          <Typography variant="body2" sx={{ color: 'text.secondary', ml: 'auto' }}>
            {t('factions:list.count', { shown: factions.length, total })}
          </Typography>
        </GlassCard>
      )}

      {factions.length === 0 && !loading ? (
        hasFilters ? (
          <EmptyState
            icon={<SearchIcon sx={{ fontSize: 64 }} />}
            title={t('factions:list.emptyFilteredTitle')}
            description={t('factions:list.emptyFilteredDescription')}
            actionLabel={t('factions:list.resetFilters')}
            onAction={clearFilters}
          />
        ) : (
          <EmptyState
            icon={isStatePage ? <CastleIcon sx={{ fontSize: 64 }} /> : <GroupsIcon sx={{ fontSize: 64 }} />}
            title={isStatePage ? t('factions:list.emptyNoStatesTitle') : t('factions:list.emptyNoFactionsTitle')}
            description={
              isStatePage ? t('factions:list.emptyNoStatesDescription') : t('factions:list.emptyNoFactionsDescription')
            }
            actionLabel={createLabel}
            onAction={() => navigate(routes.factionDetail(pid, entityType, 'new'))}
          />
        )
      ) : (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              },
              gap: 2,
              pl: 1,
            }}
          >
            {factions.map((entity) => {
              const statusColor = statusColors[entity.status] || theme.palette.primary.main;
              const entityColor = entity.color || statusColor;
              const subtitle = getSubtitle(entity);
              return (
                <GlassCard
                  interactive
                  key={entity.id}
                  onClick={() => navigate(routes.factionDetail(pid, entity.kind, entity.id))}
                  sx={{
                    p: 0,
                    '&:hover': {
                      '& .entity-actions': { opacity: 1 },
                    },
                  }}
                >
                  <Box
                    sx={{
                      height: 4,
                      background: entity.color
                        ? `linear-gradient(90deg, ${entity.color}, ${entity.secondaryColor || entity.color})`
                        : `linear-gradient(90deg, ${statusColor}, transparent)`,
                    }}
                  />

                  <Box sx={{ p: 2.5 }}>
                    <Box display="flex" gap={2} alignItems="flex-start">
                      <Avatar
                        src={entity.imagePath || undefined}
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 2,
                          bgcolor: alpha(entityColor, 0.1),
                          color: entityColor,
                          fontSize: '1.8rem',
                          flexShrink: 0,
                        }}
                        variant="rounded"
                      >
                        {(entity.type
                          ? (entity.kind === 'state' ? STATE_TYPE_ICONS[entity.type] : FACTION_TYPE_ICONS[entity.type])
                          : FACTION_KIND_ICONS[entity.kind]) || '🏴'}
                      </Avatar>

                      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            color: 'text.primary',
                            fontSize: '1.05rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {entity.name}
                        </Typography>

                        {subtitle && (
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'text.secondary',
                              fontSize: '0.8rem',
                              mt: 0.25,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {subtitle}
                          </Typography>
                        )}

                        <Box display="flex" gap={0.5} mt={1} flexWrap="wrap" alignItems="center">
                          <Chip
                            label={`${FACTION_STATUS_ICONS[entity.status] || ''} ${t(`factions:factionStatuses.${entity.status}`)}`.trim()}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              backgroundColor: alpha(statusColor, 0.15),
                              color: statusColor,
                              borderRadius: 1,
                            }}
                          />
                          {(entity.memberCount ?? 0) > 0 && (
                            <Chip
                              icon={<PeopleIcon sx={{ fontSize: '14px !important', color: 'inherit !important' }} />}
                              label={entity.memberCount}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                backgroundColor: alpha(theme.palette.text.secondary, 0.1),
                                color: 'text.secondary',
                                borderRadius: 1,
                                '& .MuiChip-icon': { ml: '4px' },
                              }}
                            />
                          )}
                          {entity.parentFaction && (
                            <Chip
                              label={`↑ ${entity.parentFaction.name}`}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.6rem',
                                backgroundColor: alpha(theme.palette.primary.main, 0.15),
                                color: theme.palette.primary.main,
                                borderRadius: 1,
                              }}
                            />
                          )}
                        </Box>
                      </Box>

                      <Box
                        className="entity-actions"
                        display="flex"
                        flexDirection="column"
                        gap={0}
                        sx={{ opacity: 0, transition: 'opacity 0.15s', flexShrink: 0 }}
                      >
                        <Tooltip title={t('factions:list.tooltipOpen')}>
                          <IconButton size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('factions:list.tooltipDelete')}>
                          <IconButton
                            size="small"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDelete(entity.id, entity.name);
                            }}
                            sx={{
                              color: theme.palette.error.main,
                              '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {entity.description && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.8rem',
                          mt: 1.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {entity.description}
                      </Typography>
                    )}
                  </Box>
                </GlassCard>
              );
            })}
          </Box>

          {factions.length < total && (
            <Box ref={sentinelRef} sx={{ py: 3, textAlign: 'center' }}>
              {loadingMore && <Typography sx={{ color: 'text.secondary' }}>{t('factions:list.loadingMore')}</Typography>}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};
