import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  Box, Typography, Paper, TextField, IconButton,
  Button, Chip, Select, MenuItem, FormControl,
  InputAdornment, Tooltip, Avatar, InputLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import GroupsIcon from '@mui/icons-material/Groups';
import PeopleIcon from '@mui/icons-material/People';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useParams, useNavigate } from 'react-router-dom';
import { useFactionStore } from '@/store/useFactionStore';
import { useUIStore } from '@/store/useUIStore';
import { DndButton } from '@/components/ui/DndButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';
import {
  FACTION_TYPES,
  FACTION_TYPE_LABELS,
  FACTION_TYPE_ICONS,
  FACTION_STATUSES,
  FACTION_STATUS_LABELS,
  FACTION_STATUS_ICONS,
  STATE_TYPE_LABELS,
} from '@campaigner/shared';
import type { Faction } from '@campaigner/shared';

const PAGE_SIZE = 40;

const STATUS_COLORS: Record<string, string> = {
  active: 'rgba(78,205,196,0.7)',
  disbanded: 'rgba(150,150,150,0.5)',
  secret: 'rgba(187,143,206,0.7)',
  exiled: 'rgba(255,200,100,0.7)',
  destroyed: 'rgba(255,107,107,0.7)',
};

export const FactionsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const navigate = useNavigate();
  const {
    factions, total, loading, loadingMore,
    fetchFactions, deleteFaction,
  } = useFactionStore();
  const { showSnackbar, showConfirmDialog } = useUIStore();

  // Filters
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Track unfiltered total
  const [totalUnfiltered, setTotalUnfiltered] = useState(0);
  const [initialized, setInitialized] = useState(false);

  // Infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadFactions = useCallback(async (append = false) => {
    const offset = append ? useFactionStore.getState().factions.length : 0;
    await fetchFactions(pid, {
      type: filterType || undefined,
      status: filterStatus || undefined,
      search: debouncedSearch || undefined,
      limit: PAGE_SIZE,
      offset,
      append,
    });
    setInitialized(true);
  }, [pid, filterType, filterStatus, debouncedSearch, fetchFactions]);

  // Unfiltered total
  useEffect(() => {
    fetchFactions(pid, { limit: 1, offset: 0 }).then(() => {
      setTotalUnfiltered(useFactionStore.getState().total);
    });
  }, [pid, fetchFactions]);

  // Load on filter change
  useEffect(() => {
    setInitialized(false);
    loadFactions(false);
  }, [loadFactions]);

  // Infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const state = useFactionStore.getState();
        if (entries[0].isIntersecting && !state.loadingMore && !state.loading && state.factions.length < state.total) {
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

  const hasFilters = !!(debouncedSearch || filterType || filterStatus);

  const clearFilters = () => {
    setSearch('');
    setFilterType('');
    setFilterStatus('');
  };

  const handleDelete = (id: number, name: string) => {
    showConfirmDialog('Удалить фракцию', `Удалить "${name}"? Все члены и связи тоже будут удалены.`, async () => {
      try {
        await deleteFaction(id);
        showSnackbar('Фракция удалена', 'success');
        setTotalUnfiltered(prev => Math.max(0, prev - 1));
      } catch {
        showSnackbar('Ошибка удаления', 'error');
      }
    });
  };

  const getFactionSubtitle = (f: Faction): string => {
    const parts: string[] = [];
    if (f.type === 'state' && f.stateType) {
      parts.push(STATE_TYPE_LABELS[f.stateType] || f.customStateType || f.stateType);
    } else if (f.type === 'other' && f.customType) {
      parts.push(f.customType);
    }
    if (f.motto) parts.push(`«${f.motto}»`);
    if (f.headquarters) parts.push(`📍 ${f.headquarters}`);
    return parts.join(' · ');
  };

  // Group by type
  const grouped = useMemo(() => {
    const map = new Map<string, Faction[]>();
    for (const f of factions) {
      const key = f.type || 'other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(f);
    }

    const typeOrder = FACTION_TYPES as readonly string[];
    const sortedKeys = [...map.keys()].sort(
      (a, b) => typeOrder.indexOf(a) - typeOrder.indexOf(b)
    );

    return sortedKeys.map(key => ({
      key,
      label: FACTION_TYPE_LABELS[key] || key,
      icon: FACTION_TYPE_ICONS[key] || '🏴',
      factions: map.get(key)!,
    }));
  }, [factions]);

  // Loading state
  if (!initialized && loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>Загрузка...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '1.8rem', color: '#fff' }}>
            Фракции
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', mt: 0.5 }}>
            Организации, государства и объединения вашего мира
          </Typography>
        </Box>
        <DndButton variant="contained" startIcon={<AddIcon />} onClick={() => navigate(`/project/${pid}/factions/new`)}>
          Создать фракцию
        </DndButton>
      </Box>

      {/* Filters */}
      {(totalUnfiltered > 0 || hasFilters) && (
        <Box display="flex" gap={2} mb={3} alignItems="center" flexWrap="wrap">
          <TextField
            placeholder="Поиск фракций..."
            value={search} onChange={e => setSearch(e.target.value)}
            sx={{
              flexGrow: 1, maxWidth: 400,
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255,255,255,0.04)',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'rgba(255,255,255,0.3)' }} />
                </InputAdornment>
              ),
            }}
            size="small"
          />

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select value={filterType} onChange={e => setFilterType(e.target.value)} displayEmpty
              sx={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
                color: '#fff',
              }}>
              <MenuItem value="">Все типы</MenuItem>
              {FACTION_TYPES.map(t => (
                <MenuItem key={t} value={t}>
                  {FACTION_TYPE_ICONS[t]} {FACTION_TYPE_LABELS[t]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} displayEmpty
              sx={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
                color: '#fff',
              }}>
              <MenuItem value="">Любой статус</MenuItem>
              {FACTION_STATUSES.map(s => (
                <MenuItem key={s} value={s}>
                  {FACTION_STATUS_ICONS[s]} {FACTION_STATUS_LABELS[s]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {hasFilters && (
            <Button variant="outlined" onClick={clearFilters}
              size="small" sx={{ borderColor: 'rgba(130,130,255,0.4)', color: 'rgba(130,130,255,0.9)', textTransform: 'none' }}>
              Сброс
            </Button>
          )}

          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
            {factions.length} из {total}
          </Typography>
        </Box>
      )}

      {/* Content */}
      {factions.length === 0 && !loading ? (
        hasFilters ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <SearchIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.15)', mb: 2 }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem', mb: 1 }}>
              Ничего не найдено
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.9rem', mb: 2 }}>
              Попробуйте изменить параметры поиска или фильтры
            </Typography>
            <Button variant="outlined" onClick={clearFilters}
              size="small" sx={{ borderColor: 'rgba(130,130,255,0.4)', color: 'rgba(130,130,255,0.9)', textTransform: 'none' }}>
              Сбросить фильтры
            </Button>
          </Box>
        ) : (
          <EmptyState
            icon={<GroupsIcon sx={{ fontSize: 64 }} />}
            title="Фракций пока нет"
            description="Создайте организации вашего мира — гильдии, ордена, государства, культы и тайные общества"
            actionLabel="Создать фракцию"
            onAction={() => navigate(`/project/${pid}/factions/new`)}
          />
        )
      ) : (
        <>
          {grouped.map((group) => (
            <Box key={group.key} sx={{ mb: 4 }}>
              {/* Group header */}
              <Box display="flex" alignItems="center" gap={1.5} mb={2} px={1}>
                <Typography sx={{ fontSize: '1.4rem' }}>{group.icon}</Typography>
                <Typography sx={{
                  fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '1.1rem',
                  color: 'rgba(255,255,255,0.85)',
                }}>
                  {group.label}
                </Typography>
                <Chip label={`${group.factions.length}`} size="small"
                  sx={{
                    height: 22, fontSize: '0.75rem',
                    backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
                  }} />
              </Box>

              {/* Faction cards grid */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  lg: 'repeat(3, 1fr)',
                },
                gap: 2,
                pl: 1,
              }}>
                {group.factions.map((faction) => (
                  <Paper
                    key={faction.id}
                    onClick={() => navigate(`/project/${pid}/factions/${faction.id}`)}
                    sx={{
                      p: 0,
                      overflow: 'hidden',
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.07)',
                        borderColor: 'rgba(255,255,255,0.15)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        '& .faction-actions': { opacity: 1 },
                      },
                    }}
                  >
                    {/* Color bar */}
                    <Box sx={{
                      height: 4,
                      background: faction.color
                        ? `linear-gradient(90deg, ${faction.color}, ${faction.secondaryColor || faction.color})`
                        : `linear-gradient(90deg, ${STATUS_COLORS[faction.status] || 'rgba(130,130,255,0.5)'}, transparent)`,
                    }} />

                    <Box sx={{ p: 2.5 }}>
                      <Box display="flex" gap={2} alignItems="flex-start">
                        {/* Avatar / Emblem */}
                        <Avatar
                          src={faction.imagePath || undefined}
                          sx={{
                            width: 56, height: 56,
                            borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.06)',
                            color: 'rgba(255,255,255,0.3)',
                            fontSize: '1.8rem',
                            flexShrink: 0,
                          }}
                          variant="rounded"
                        >
                          {FACTION_TYPE_ICONS[faction.type] || '🏴'}
                        </Avatar>

                        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                          {/* Name */}
                          <Typography sx={{
                            fontWeight: 700, color: '#fff', fontSize: '1.05rem',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {faction.name}
                          </Typography>

                          {/* Subtitle */}
                          {getFactionSubtitle(faction) && (
                            <Typography variant="body2" sx={{
                              color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', mt: 0.25,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {getFactionSubtitle(faction)}
                            </Typography>
                          )}

                          {/* Badges row */}
                          <Box display="flex" gap={0.5} mt={1} flexWrap="wrap" alignItems="center">
                            {/* Status */}
                            <Chip
                              label={`${FACTION_STATUS_ICONS[faction.status] || ''} ${FACTION_STATUS_LABELS[faction.status] || faction.status}`}
                              size="small"
                              sx={{
                                height: 20, fontSize: '0.65rem', fontWeight: 600,
                                backgroundColor: STATUS_COLORS[faction.status] || 'rgba(130,130,255,0.2)',
                                color: '#fff', borderRadius: 1,
                              }}
                            />

                            {/* Member count */}
                            {(faction.memberCount ?? 0) > 0 && (
                              <Chip
                                icon={<PeopleIcon sx={{ fontSize: '14px !important', color: 'rgba(255,255,255,0.5) !important' }} />}
                                label={faction.memberCount}
                                size="small"
                                sx={{
                                  height: 20, fontSize: '0.65rem',
                                  backgroundColor: 'rgba(255,255,255,0.06)',
                                  color: 'rgba(255,255,255,0.5)', borderRadius: 1,
                                  '& .MuiChip-icon': { ml: '4px' },
                                }}
                              />
                            )}

                            {/* Parent */}
                            {faction.parentFaction && (
                              <Chip
                                label={`↑ ${faction.parentFaction.name}`}
                                size="small"
                                sx={{
                                  height: 20, fontSize: '0.6rem',
                                  backgroundColor: 'rgba(201,169,89,0.15)',
                                  color: 'rgba(201,169,89,0.8)', borderRadius: 1,
                                }}
                              />
                            )}
                          </Box>
                        </Box>

                        {/* Actions */}
                        <Box className="faction-actions" display="flex" flexDirection="column" gap={0}
                          sx={{ opacity: 0, transition: 'opacity 0.15s', flexShrink: 0 }}>
                          <Tooltip title="Открыть">
                            <IconButton size="small"
                              sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: '#fff' } }}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Удалить">
                            <IconButton size="small"
                              onClick={(e) => { e.stopPropagation(); handleDelete(faction.id, faction.name); }}
                              sx={{ color: 'rgba(255,100,100,0.4)', '&:hover': { color: 'rgba(255,100,100,0.8)' } }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      {/* Description preview */}
                      {faction.description && (
                        <Typography variant="body2" sx={{
                          color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', mt: 1.5,
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        }}>
                          {faction.description}
                        </Typography>
                      )}

                      {/* Tags */}
                      {faction.tags && faction.tags.length > 0 && (
                        <Box display="flex" gap={0.5} mt={1} flexWrap="wrap">
                          {faction.tags.slice(0, 4).map((tag: any) => (
                            <Chip key={tag.id} label={tag.name} size="small" sx={{
                              height: 18, fontSize: '0.6rem',
                              backgroundColor: tag.color || 'rgba(130,130,255,0.15)',
                              color: 'rgba(255,255,255,0.6)', borderRadius: 1,
                            }} />
                          ))}
                          {faction.tags.length > 4 && (
                            <Chip label={`+${faction.tags.length - 4}`} size="small" sx={{
                              height: 18, fontSize: '0.6rem',
                              backgroundColor: 'rgba(255,255,255,0.04)',
                              color: 'rgba(255,255,255,0.3)', borderRadius: 1,
                            }} />
                          )}
                        </Box>
                      )}
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Box>
          ))}

          {/* Infinite scroll sentinel */}
          {factions.length < total && (
            <Box ref={sentinelRef} sx={{ py: 3, textAlign: 'center' }}>
              {loadingMore && (
                <Typography sx={{ color: 'rgba(255,255,255,0.4)' }}>Загрузка...</Typography>
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};