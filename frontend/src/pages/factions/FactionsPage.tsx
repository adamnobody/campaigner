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
import PublicIcon from '@mui/icons-material/Public';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import ShieldIcon from '@mui/icons-material/Shield';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFactionStore } from '@/store/useFactionStore';
import { useBranchStore } from '@/store/useBranchStore';
import { useUIStore } from '@/store/useUIStore';
import { useCharacterStore } from '@/store/useCharacterStore';
import { useDynastyStore } from '@/store/useDynastyStore';
import { useTimelineStore } from '@/store/useTimelineStore';
import { DndButton } from '@/components/ui/DndButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { AssetAvatar } from '@/components/ui/AssetAvatar';
import { GlassCard } from '@/components/ui/GlassCard';
import { useDebounce } from '@/hooks/useDebounce';
import { routes } from '@/utils/routes';
import {
  CampaignerPage,
  CampaignerPageHeader,
  CampaignerSurface,
} from '@/components/ui/CampaignerPrimitives';
import { CatalogAside, CatalogColumns } from '@/components/catalog/CatalogLayout';
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
  const { t } = useTranslation(['factions', 'common', 'navigation']);
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
  const activeBranchId = useBranchStore((s) => s.activeBranchId);
  const fetchCharacters = useCharacterStore((s) => s.fetchCharacters);
  const characters = useCharacterStore((s) => s.characters);
  const fetchDynasties = useDynastyStore((s) => s.fetchDynasties);
  const dynasties = useDynastyStore((s) => s.dynasties);
  const fetchEvents = useTimelineStore((s) => s.fetchEvents);
  const events = useTimelineStore((s) => s.events);

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
    [debouncedSearch, entityType, fetchFactions, filterStatus, pid, activeBranchId]
  );

  useEffect(() => {
    fetchFactions(pid, { kind: entityType, limit: 1, offset: 0 }).then(() => {
      setTotalUnfiltered(useFactionStore.getState().total);
    });
  }, [entityType, fetchFactions, pid, activeBranchId]);

  useEffect(() => {
    void fetchCharacters(pid, { limit: 500 });
    void fetchDynasties(pid);
    void fetchEvents(pid);
  }, [pid, fetchCharacters, fetchDynasties, fetchEvents, activeBranchId]);

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
    <CampaignerPage>
      <CatalogColumns
        aside={(
          <CatalogAside
            summaryTitle={t('common:catalog.summary')}
            summary={[
              { label: t('factions:list.aside.summaryTotal'), value: totalUnfiltered },
              { label: t('factions:list.aside.summaryActive'), value: factions.filter((item) => item.status === 'active').length },
              { label: t('factions:list.aside.summaryRuler'), value: factions.filter((item) => item.rulerCharacterId).length },
              { label: t('factions:list.aside.summaryDynasty'), value: factions.filter((item) => item.rulingDynastyId).length },
            ]}
            storedTitle={t('common:catalog.storedTitle')}
            storedBody={t(isStatePage ? 'factions:list.aside.storedBodyStates' : 'factions:list.aside.storedBodyFactions')}
            linkedTitle={t('common:catalog.linkedTitle')}
            linked={[
              { label: t('navigation:menu.characters'), value: characters.length },
              { label: t('navigation:menu.dynasties'), value: dynasties.length },
              { label: t('navigation:menu.timeline'), value: events.length },
            ]}
          />
        )}
      >
      <CampaignerPageHeader
        eyebrow={`${listTitle} · ${totalUnfiltered}`}
        title={listTitle}
        description={isStatePage ? t('factions:list.subtitleStates') : t('factions:list.subtitleFactions')}
        actions={(
          <DndButton
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(routes.factionDetail(pid, entityType, 'new'))}
          >
            {createLabel}
          </DndButton>
        )}
      />

      <CampaignerSurface
          sx={{
            p: 1.25,
            mb: factions.length === 0 ? 0 : 3,
            display: 'flex',
            gap: 1.25,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
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
      </CampaignerSurface>

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
            templatesTitle={t('factions:list.templates.title')}
            templates={(isStatePage
              ? [
                  ['kingdom', <CastleIcon key="kingdom" />],
                  ['empire', <PublicIcon key="empire" />],
                  ['city', <LocationCityIcon key="city" />],
                ]
              : [
                  ['order', <ShieldIcon key="order" />],
                  ['guild', <StorefrontIcon key="guild" />],
                  ['cult', <LocalFireDepartmentIcon key="cult" />],
                ]
            ).map(([key, icon]) => ({
              icon,
              title: t(`factions:list.templates.${isStatePage ? 'states' : 'factions'}.${key}.title`),
              description: t(`factions:list.templates.${isStatePage ? 'states' : 'factions'}.${key}.description`),
              onClick: () => navigate(routes.factionDetail(pid, entityType, 'new')),
            }))}
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
                xl: 'repeat(3, 1fr)',
              },
              gap: 2.25,
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
                    minHeight: 220,
                    overflow: 'hidden',
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    background: `linear-gradient(145deg, ${alpha(entityColor, 0.08)}, ${alpha(
                      theme.palette.background.paper,
                      0.4
                    )} 48%)`,
                    '&:hover': {
                      '& .entity-actions': { opacity: 1 },
                      '& .entity-avatar': { transform: 'translateY(-2px) scale(1.03)' },
                    },
                  }}
                >
                  <Box
                    sx={{
                      height: 5,
                      background: entity.color
                        ? `linear-gradient(90deg, ${entity.color}, ${entity.secondaryColor || entity.color})`
                        : `linear-gradient(90deg, ${statusColor}, transparent)`,
                    }}
                  />

                  <Box sx={{ p: 2.75 }}>
                    <Box display="flex" gap={2} alignItems="flex-start">
                      <AssetAvatar
                        className="entity-avatar"
                        assetPath={entity.imagePath}
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: 2.5,
                          bgcolor: alpha(entityColor, 0.1),
                          color: entityColor,
                          border: `1px solid ${alpha(entityColor, 0.35)}`,
                          fontSize: '2rem',
                          flexShrink: 0,
                          transition: 'transform 180ms ease',
                        }}
                        variant="rounded"
                      >
                        {(entity.type
                          ? (entity.kind === 'state' ? STATE_TYPE_ICONS[entity.type] : FACTION_TYPE_ICONS[entity.type])
                          : FACTION_KIND_ICONS[entity.kind]) || '🏴'}
                      </AssetAvatar>

                      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                        <Typography
                          sx={{
                            fontFamily: '"Cormorant Garamond", serif',
                            fontWeight: 600,
                            color: 'text.primary',
                            fontSize: '1.45rem',
                            lineHeight: 1.1,
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
                              fontSize: '0.77rem',
                              mt: 0.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {subtitle}
                          </Typography>
                        )}

                        <Box display="flex" gap={0.75} mt={1.25} flexWrap="wrap" alignItems="center">
                          <Chip
                            label={`${FACTION_STATUS_ICONS[entity.status] || ''} ${t(`factions:factionStatuses.${entity.status}`)}`.trim()}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '0.68rem',
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
                          fontSize: '0.82rem',
                          lineHeight: 1.65,
                          mt: 2,
                          pt: 1.5,
                          borderTop: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
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
      </CatalogColumns>
    </CampaignerPage>
  );
};
