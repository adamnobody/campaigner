import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import SearchIcon from '@mui/icons-material/Search';
import GroupsIcon from '@mui/icons-material/Groups';
import CastleIcon from '@mui/icons-material/Castle';
import PublicIcon from '@mui/icons-material/Public';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import ShieldIcon from '@mui/icons-material/Shield';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { factionsApi } from '@/api/factions';
import { mapApi } from '@/api/maps';
import { useFactionStore } from '@/store/useFactionStore';
import { useBranchStore } from '@/store/useBranchStore';
import { useUIStore } from '@/store/useUIStore';
import { useCharacterStore } from '@/store/useCharacterStore';
import { useDynastyStore } from '@/store/useDynastyStore';
import { DndButton } from '@/components/ui/DndButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { AssetAvatar } from '@/components/ui/AssetAvatar';
import { useDebounce } from '@/hooks/useDebounce';
import { routes } from '@/utils/routes';
import {
  CampaignerPage,
  CampaignerPageHeader,
  CampaignerSurface,
} from '@/components/ui/CampaignerPrimitives';
import { CatalogAside, CatalogColumns } from '@/components/catalog/CatalogLayout';
import {
  FACTION_STATUS_ICONS,
  FACTION_STATUSES,
} from '@campaigner/shared';
import type { Faction, MapTerritorySummary } from '@campaigner/shared';

const PAGE_SIZE = 500;

type FactionEntityType = 'state' | 'faction';
type SortKey = 'name' | 'place';

interface FactionsPageProps {
  entityType?: FactionEntityType;
}

const STATE_TYPE_CHIPS = [
  { id: '', labelKey: 'factions:list.filters.all' },
  { id: 'kingdom', labelKey: 'factions:list.filters.kingdoms' },
  { id: 'republic', labelKey: 'factions:list.filters.republics' },
  { id: 'city_state', labelKey: 'factions:list.filters.cities' },
] as const;

const FACTION_TYPE_CHIPS = [
  { id: '', labelKey: 'factions:list.filters.all' },
  { id: 'order', labelKey: 'factions:list.filters.orders' },
  { id: 'guild', labelKey: 'factions:list.filters.guilds' },
  { id: 'cult', labelKey: 'factions:list.filters.cults' },
] as const;

export const FactionsPage: React.FC<FactionsPageProps> = ({ entityType = 'faction' }) => {
  const { t, i18n } = useTranslation(['factions', 'common', 'navigation']);
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const navigate = useNavigate();
  const theme = useTheme();
  const {
    factions,
    loading,
    fetchFactions,
    fetchRelations,
    relations,
    deleteFaction,
  } = useFactionStore();
  const { showSnackbar, showConfirmDialog } = useUIStore();
  const activeBranchId = useBranchStore((s) => s.activeBranchId);
  const fetchCharacters = useCharacterStore((s) => s.fetchCharacters);
  const characters = useCharacterStore((s) => s.characters);
  const fetchDynasties = useDynastyStore((s) => s.fetchDynasties);
  const dynasties = useDynastyStore((s) => s.dynasties);

  const isStatePage = entityType === 'state';
  const listTitle = isStatePage ? t('factions:list.titleStates') : t('factions:list.titleFactions');
  const createLabel = isStatePage ? t('factions:list.createState') : t('factions:list.createFaction');
  const collator = useMemo(
    () => new Intl.Collator(i18n.language.startsWith('ru') ? 'ru' : 'en', { sensitivity: 'base' }),
    [i18n.language],
  );
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [totalUnfiltered, setTotalUnfiltered] = useState(0);
  const [linkedOtherCount, setLinkedOtherCount] = useState(0);
  const [territories, setTerritories] = useState<MapTerritorySummary[]>([]);
  const [initialized, setInitialized] = useState(false);

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

  const loadFactions = useCallback(async () => {
    await fetchFactions(pid, {
      kind: entityType,
      limit: PAGE_SIZE,
    });
    setTotalUnfiltered(useFactionStore.getState().total);
    setInitialized(true);
  }, [entityType, fetchFactions, pid, activeBranchId]);

  useEffect(() => {
    setInitialized(false);
    void loadFactions();
  }, [loadFactions]);

  useEffect(() => {
    void fetchCharacters(pid, { limit: 500 });
    void fetchDynasties(pid);
    void fetchRelations(pid);
    mapApi
      .getTerritorySummariesForProject(pid)
      .then((res) => setTerritories(res.data.data || []))
      .catch(() => setTerritories([]));
    factionsApi
      .getAll(pid, { kind: isStatePage ? 'faction' : 'state', limit: 1 })
      .then((res) => setLinkedOtherCount(res.data.total || 0))
      .catch(() => setLinkedOtherCount(0));
  }, [pid, fetchCharacters, fetchDynasties, fetchRelations, activeBranchId, isStatePage]);

  const typeLabel = useCallback((entity: Faction) => {
    if (!entity.type) return '';
    return entity.kind === 'state'
      ? t(`factions:stateTypes.${entity.type}`, { defaultValue: entity.type })
      : t(`factions:factionTypes.${entity.type}`, { defaultValue: entity.type });
  }, [t]);

  const rulerNameOf = useCallback((entity: Faction) => {
    if (entity.ruler?.name && entity.ruler.name !== '—') return entity.ruler.name;
    return characters.find((character) => character.id === entity.rulerCharacterId)?.name || '';
  }, [characters]);

  const displayed = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    const items = factions.filter((entity) => {
      if (filterType && entity.type !== filterType) return false;
      if (!isStatePage && filterStatus && entity.status !== filterStatus) return false;
      if (!query) return true;
      const haystack = [
        entity.name,
        entity.headquarters,
        entity.motto,
        typeLabel(entity),
        rulerNameOf(entity),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
    return [...items].sort((a, b) => {
      if (sortBy === 'place') {
        return collator.compare(a.headquarters || '', b.headquarters || '');
      }
      return collator.compare(a.name, b.name);
    });
  }, [collator, debouncedSearch, factions, filterStatus, filterType, isStatePage, rulerNameOf, sortBy, typeLabel]);

  const entityIds = useMemo(() => new Set(factions.map((item) => item.id)), [factions]);
  const onCanvasCount = useMemo(() => {
    const ids = new Set<number>();
    territories.forEach((territory) => {
      if (territory.factionId != null && entityIds.has(territory.factionId)) {
        ids.add(territory.factionId);
      }
    });
    return ids.size;
  }, [entityIds, territories]);
  const allianceCount = useMemo(() => {
    const ids = new Set<number>();
    relations.forEach((relation) => {
      if (relation.relationType !== 'alliance') return;
      if (entityIds.has(relation.sourceFactionId)) ids.add(relation.sourceFactionId);
      if (entityIds.has(relation.targetFactionId)) ids.add(relation.targetFactionId);
    });
    return ids.size;
  }, [entityIds, relations]);
  const conflictCount = useMemo(() => {
    const ids = new Set<number>();
    relations.forEach((relation) => {
      if (relation.relationType !== 'war') return;
      if (entityIds.has(relation.sourceFactionId)) ids.add(relation.sourceFactionId);
      if (entityIds.has(relation.targetFactionId)) ids.add(relation.targetFactionId);
    });
    return ids.size;
  }, [entityIds, relations]);

  const hasFilters = !!(debouncedSearch || filterType || (!isStatePage && filterStatus));
  const clearFilters = () => {
    setSearch('');
    setFilterType('');
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

  const typeChips = isStatePage ? STATE_TYPE_CHIPS : FACTION_TYPE_CHIPS;
  const emptyCell = t('factions:list.emptyValue');

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
            summary={isStatePage ? [
              { label: t('factions:list.aside.summaryTotal'), value: totalUnfiltered },
              { label: t('factions:list.aside.summaryOnCanvas'), value: onCanvasCount },
              { label: t('factions:list.aside.summaryAlliances'), value: allianceCount },
              { label: t('factions:list.aside.summaryConflicts'), value: conflictCount },
            ] : [
              { label: t('factions:list.aside.summaryTotal'), value: totalUnfiltered },
              { label: t('factions:list.aside.summaryActive'), value: factions.filter((item) => item.status === 'active').length },
              { label: t('factions:list.aside.summaryOnCanvas'), value: onCanvasCount },
              { label: t('factions:list.aside.summaryAlliances'), value: allianceCount },
            ]}
            storedTitle={t('common:catalog.storedTitle')}
            storedBody={t(isStatePage ? 'factions:list.aside.storedBodyStates' : 'factions:list.aside.storedBodyFactions')}
            linkedTitle={t('common:catalog.linkedTitle')}
            linked={isStatePage ? [
              { label: t('navigation:menu.dynasties'), value: dynasties.length },
              { label: t('navigation:menu.factions'), value: linkedOtherCount },
              { label: t('navigation:menu.map'), value: territories.length },
            ] : [
              { label: t('navigation:menu.characters'), value: characters.length },
              { label: t('navigation:menu.dynasties'), value: dynasties.length },
              { label: t('navigation:menu.states'), value: linkedOtherCount },
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
            sx={{ flexGrow: 1, minWidth: 220, maxWidth: 360 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            size="small"
          />

          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {typeChips.map((chip) => {
              const selected = filterType === chip.id;
              return (
                <Chip
                  key={chip.labelKey}
                  clickable
                  label={t(chip.labelKey)}
                  onClick={() => setFilterType(chip.id)}
                  variant={selected ? 'filled' : 'outlined'}
                  sx={{
                    height: 28,
                    fontWeight: selected ? 600 : 500,
                    color: selected ? 'primary.main' : 'text.secondary',
                    backgroundColor: selected ? alpha(theme.palette.primary.main, 0.16) : 'transparent',
                    borderColor: selected
                      ? alpha(theme.palette.primary.main, 0.45)
                      : alpha(theme.palette.divider, 0.7),
                  }}
                />
              );
            })}
          </Box>

          {!isStatePage ? (
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} displayEmpty>
                <MenuItem value="">{t('factions:list.anyStatus')}</MenuItem>
                {FACTION_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {FACTION_STATUS_ICONS[status]} {t(`factions:factionStatuses.${status}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}

          <FormControl size="small" sx={{ minWidth: 150, ml: { md: 'auto' } }}>
            <Select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortKey)}>
              <MenuItem value="name">{t('factions:list.sortByName')}</MenuItem>
              <MenuItem value="place">
                {isStatePage ? t('factions:list.sortByCapital') : t('factions:list.sortByHeadquarters')}
              </MenuItem>
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

          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('factions:list.count', { shown: displayed.length, total: totalUnfiltered })}
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
                  { key: 'kingdom', icon: <CastleIcon /> },
                  { key: 'empire', icon: <PublicIcon /> },
                  { key: 'city', icon: <LocationCityIcon /> },
                ]
              : [
                  { key: 'order', icon: <ShieldIcon /> },
                  { key: 'guild', icon: <StorefrontIcon /> },
                  { key: 'cult', icon: <LocalFireDepartmentIcon /> },
                ]
            ).map((item) => ({
              icon: item.icon,
              title: t(`factions:list.templates.${isStatePage ? 'states' : 'factions'}.${item.key}.title`),
              description: t(`factions:list.templates.${isStatePage ? 'states' : 'factions'}.${item.key}.description`),
              onClick: () => navigate(routes.factionDetail(pid, entityType, 'new')),
            }))}
          />
        )
      ) : displayed.length === 0 ? (
        <EmptyState
          icon={<SearchIcon sx={{ fontSize: 64 }} />}
          title={t('factions:list.emptyFilteredTitle')}
          description={t('factions:list.emptyFilteredDescription')}
          actionLabel={t('factions:list.resetFilters')}
          onAction={clearFilters}
        />
      ) : (
        <CampaignerSurface sx={{ overflow: 'hidden' }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'minmax(0, 1fr)',
                md: isStatePage
                  ? 'minmax(280px, 2.4fr) minmax(140px, 1fr) minmax(160px, 1fr) 40px'
                  : 'minmax(280px, 2.4fr) minmax(140px, 1fr) minmax(140px, 1fr) 40px',
              },
              gap: 2,
              px: 2,
              py: 1.25,
              borderBottom: `1px solid ${theme.campaigner.surface.border}`,
            }}
          >
            <Typography sx={{ color: 'text.disabled', fontSize: '0.62rem', letterSpacing: '.14em', textTransform: 'uppercase' }}>
              {isStatePage ? t('factions:list.columns.state') : t('factions:list.columns.faction')}
            </Typography>
            <Typography sx={{ color: 'text.disabled', fontSize: '0.62rem', letterSpacing: '.14em', textTransform: 'uppercase', display: { xs: 'none', md: 'block' } }}>
              {isStatePage ? t('factions:list.columns.capital') : t('factions:list.columns.headquarters')}
            </Typography>
            <Typography sx={{ color: 'text.disabled', fontSize: '0.62rem', letterSpacing: '.14em', textTransform: 'uppercase', display: { xs: 'none', md: 'block' } }}>
              {isStatePage ? t('factions:list.columns.ruler') : t('factions:list.columns.status')}
            </Typography>
            <span />
          </Box>

          {displayed.map((entity, index) => {
            const entityColor = entity.color || theme.palette.primary.main;
            const statusColor = statusColors[entity.status] || theme.palette.primary.main;
            const typeText = typeLabel(entity);
            const rulerName = rulerNameOf(entity);
            return (
              <Box
                key={entity.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(routes.factionDetail(pid, entity.kind, entity.id))}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigate(routes.factionDetail(pid, entity.kind, entity.id));
                  }
                }}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'minmax(0, 1fr) 40px',
                    md: isStatePage
                      ? 'minmax(280px, 2.4fr) minmax(140px, 1fr) minmax(160px, 1fr) 40px'
                      : 'minmax(280px, 2.4fr) minmax(140px, 1fr) minmax(140px, 1fr) 40px',
                  },
                  gap: 2,
                  alignItems: 'center',
                  px: 2,
                  py: 1.5,
                  cursor: 'pointer',
                  borderTop: index ? `1px solid ${alpha(theme.palette.divider, 0.45)}` : 0,
                  transition: 'background-color 160ms ease',
                  '&:hover, &:focus-visible': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    outline: 'none',
                    '& .entity-actions': { opacity: 1 },
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, minWidth: 0 }}>
                  <AssetAvatar
                    assetPath={entity.imagePath}
                    variant="rounded"
                    sx={{
                      width: 72,
                      height: 72,
                      flexShrink: 0,
                      borderRadius: 2,
                      bgcolor: alpha(entityColor, 0.1),
                      color: entityColor,
                      border: entity.imagePath
                        ? `1px solid ${alpha(entityColor, 0.28)}`
                        : `1px dashed ${alpha(theme.palette.primary.main, 0.28)}`,
                    }}
                  >
                    {entity.imagePath ? null : <ShieldOutlinedIcon sx={{ fontSize: 32 }} />}
                  </AssetAvatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontFamily: theme.campaigner.typography.display,
                        fontWeight: 600,
                        fontSize: '1.2rem',
                        lineHeight: 1.15,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entity.name}
                    </Typography>
                    <Typography
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.78rem',
                        mt: 0.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {typeText || emptyCell}
                    </Typography>
                  </Box>
                </Box>

                <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem', display: { xs: 'none', md: 'block' } }}>
                  {entity.headquarters?.trim() || emptyCell}
                </Typography>

                {isStatePage ? (
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem', display: { xs: 'none', md: 'block' } }}>
                    {rulerName || emptyCell}
                  </Typography>
                ) : (
                  <Box sx={{ display: { xs: 'none', md: 'block' } }}>
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
                  </Box>
                )}

                <Box className="entity-actions" sx={{ opacity: 0, transition: 'opacity 0.15s' }}>
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
            );
          })}
        </CampaignerSurface>
      )}
      </CatalogColumns>
    </CampaignerPage>
  );
};
