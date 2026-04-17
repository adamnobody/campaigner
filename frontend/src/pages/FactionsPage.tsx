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
import { useFactionStore } from '@/store/useFactionStore';
import { useUIStore } from '@/store/useUIStore';
import { DndButton } from '@/components/ui/DndButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassCard } from '@/components/ui/GlassCard';
import { useDebounce } from '@/hooks/useDebounce';
import { FACTION_STATUS_LABELS, FACTION_STATUS_ICONS, FACTION_STATUSES, STATE_TYPE_LABELS } from '@campaigner/shared';
import type { Faction } from '@campaigner/shared';

const PAGE_SIZE = 40;

type FactionEntityType = 'state' | 'faction';

interface FactionsPageProps {
  entityType?: FactionEntityType;
}

export const FactionsPage: React.FC<FactionsPageProps> = ({ entityType = 'faction' }) => {
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
  const entityLabel = isStatePage ? 'государство' : 'фракция';
  const entityLabelPlural = isStatePage ? 'Государства' : 'Фракции';
  const deletedMessage = isStatePage ? 'Государство удалено' : 'Фракция удалена';
  const createLabel = isStatePage ? 'Создать государство' : 'Создать фракцию';
  const listBasePath = isStatePage ? 'states' : 'factions';

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
        type: entityType,
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
    fetchFactions(pid, { type: entityType, limit: 1, offset: 0 }).then(() => {
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
      `Удалить ${entityLabel}`,
      `Удалить "${name}"? Связанные записи участия и связи тоже будут удалены.`,
      async () => {
        try {
          await deleteFaction(id);
          showSnackbar(deletedMessage, 'success');
          setTotalUnfiltered((prev) => Math.max(0, prev - 1));
        } catch {
          showSnackbar('Ошибка удаления', 'error');
        }
      }
    );
  };

  const getSubtitle = (entity: Faction): string => {
    const parts: string[] = [];
    if (entity.type === 'state' && entity.stateType) {
      parts.push(STATE_TYPE_LABELS[entity.stateType] || entity.customStateType || entity.stateType);
    }
    if (entity.motto) parts.push(`«${entity.motto}»`);
    if (entity.headquarters) parts.push(`📍 ${entity.headquarters}`);
    return parts.join(' · ');
  };

  if (!initialized && loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography sx={{ color: 'text.secondary' }}>Загрузка...</Typography>
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
            {entityLabelPlural}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {isStatePage
              ? 'Государственные образования вашего мира'
              : 'Внутренние объединения, организации и группировки'}
          </Typography>
        </Box>
        <DndButton variant="contained" startIcon={<AddIcon />} onClick={() => navigate(`/project/${pid}/${listBasePath}/new`)}>
          {createLabel}
        </DndButton>
      </Box>

      {(totalUnfiltered > 0 || hasFilters) && (
        <GlassCard sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder={isStatePage ? 'Поиск государств...' : 'Поиск фракций...'}
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
              <MenuItem value="">Любой статус</MenuItem>
              {FACTION_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {FACTION_STATUS_ICONS[status]} {FACTION_STATUS_LABELS[status]}
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
              Сброс
            </Button>
          )}

          <Typography variant="body2" sx={{ color: 'text.secondary', ml: 'auto' }}>
            {factions.length} из {total}
          </Typography>
        </GlassCard>
      )}

      {factions.length === 0 && !loading ? (
        hasFilters ? (
          <EmptyState
            icon={<SearchIcon sx={{ fontSize: 64 }} />}
            title="Ничего не найдено"
            description="Попробуйте изменить параметры поиска или фильтры"
            actionLabel="Сбросить фильтры"
            onAction={clearFilters}
          />
        ) : (
          <EmptyState
            icon={isStatePage ? <CastleIcon sx={{ fontSize: 64 }} /> : <GroupsIcon sx={{ fontSize: 64 }} />}
            title={isStatePage ? 'Государств пока нет' : 'Фракций пока нет'}
            description={
              isStatePage
                ? 'Создайте первое государство для вашего мира'
                : 'Создайте первую фракцию или внутреннюю группировку'
            }
            actionLabel={createLabel}
            onAction={() => navigate(`/project/${pid}/${listBasePath}/new`)}
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
                  onClick={() => navigate(`/project/${pid}/${listBasePath}/${entity.id}`)}
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
                        {entity.type === 'state' ? '🏰' : '👥'}
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
                            label={`${FACTION_STATUS_ICONS[entity.status] || ''} ${FACTION_STATUS_LABELS[entity.status] || entity.status}`}
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
                        <Tooltip title="Открыть">
                          <IconButton size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Удалить">
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
              {loadingMore && <Typography sx={{ color: 'text.secondary' }}>Загрузка...</Typography>}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};
