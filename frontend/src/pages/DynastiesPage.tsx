import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box, Typography, Paper, TextField, IconButton,
  Button, Chip, Select, MenuItem, FormControl,
  InputAdornment, Tooltip, Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PeopleIcon from '@mui/icons-material/People';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useParams, useNavigate } from 'react-router-dom';
import { useDynastyStore } from '@/store/useDynastyStore';
import { useUIStore } from '@/store/useUIStore';
import { DndButton } from '@/components/ui/DndButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';
import {
  DYNASTY_STATUSES,
  DYNASTY_STATUS_LABELS,
  DYNASTY_STATUS_ICONS,
} from '@campaigner/shared';
import type { Dynasty } from '@campaigner/shared';

const STATUS_COLORS: Record<string, string> = {
  active: 'rgba(201,169,89,0.7)',
  extinct: 'rgba(150,150,150,0.5)',
  exiled: 'rgba(255,200,100,0.7)',
  declining: 'rgba(255,107,107,0.6)',
  rising: 'rgba(78,205,196,0.7)',
};

export const DynastiesPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const navigate = useNavigate();
  const { dynasties, total, loading, fetchDynasties, deleteDynasty } = useDynastyStore();
  const { showSnackbar, showConfirmDialog } = useUIStore();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [filterStatus, setFilterStatus] = useState('');
  const [initialized, setInitialized] = useState(false);

  const loadDynasties = useCallback(async () => {
    await fetchDynasties(pid, {
      status: filterStatus || undefined,
      search: debouncedSearch || undefined,
    });
    setInitialized(true);
  }, [pid, filterStatus, debouncedSearch, fetchDynasties]);

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
    showConfirmDialog('Удалить династию', `Удалить "${name}"? Все члены и события тоже будут удалены.`, async () => {
      try {
        await deleteDynasty(id);
        showSnackbar('Династия удалена', 'success');
      } catch {
        showSnackbar('Ошибка удаления', 'error');
      }
    });
  };

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
            Династии
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', mt: 0.5 }}>
            Родословные линии и правящие дома вашего мира
          </Typography>
        </Box>
        <DndButton variant="contained" startIcon={<AddIcon />} onClick={() => navigate(`/project/${pid}/dynasties/new`)}>
          Создать династию
        </DndButton>
      </Box>

      {/* Filters */}
      {(dynasties.length > 0 || hasFilters) && (
        <Box display="flex" gap={2} mb={3} alignItems="center" flexWrap="wrap">
          <TextField
            placeholder="Поиск династий..."
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

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} displayEmpty
              sx={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
                color: '#fff',
              }}>
              <MenuItem value="">Любой статус</MenuItem>
              {DYNASTY_STATUSES.map(s => (
                <MenuItem key={s} value={s}>
                  {DYNASTY_STATUS_ICONS[s]} {DYNASTY_STATUS_LABELS[s]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {hasFilters && (
            <Button variant="outlined" onClick={clearFilters} size="small"
              sx={{ borderColor: 'rgba(130,130,255,0.4)', color: 'rgba(130,130,255,0.9)', textTransform: 'none' }}>
              Сброс
            </Button>
          )}

          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
            {dynasties.length} из {total}
          </Typography>
        </Box>
      )}

      {/* Content */}
      {dynasties.length === 0 && !loading ? (
        hasFilters ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <SearchIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.15)', mb: 2 }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem', mb: 1 }}>
              Ничего не найдено
            </Typography>
            <Button variant="outlined" onClick={clearFilters} size="small"
              sx={{ borderColor: 'rgba(130,130,255,0.4)', color: 'rgba(130,130,255,0.9)', textTransform: 'none' }}>
              Сбросить фильтры
            </Button>
          </Box>
        ) : (
          <EmptyState
            icon={<AccountTreeIcon sx={{ fontSize: 64 }} />}
            title="Династий пока нет"
            description="Создайте родословные линии — правящие дома, благородные семьи и древние роды"
            actionLabel="Создать династию"
            onAction={() => navigate(`/project/${pid}/dynasties/new`)}
          />
        )
      ) : (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 2.5,
        }}>
          {dynasties.map((dynasty) => (
            <Paper
              key={dynasty.id}
              onClick={() => navigate(`/project/${pid}/dynasties/${dynasty.id}`)}
              sx={{
                p: 0, overflow: 'hidden',
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 2, cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  borderColor: 'rgba(201,169,89,0.3)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  '& .dynasty-actions': { opacity: 1 },
                },
              }}
            >
              {/* Color bar */}
              <Box sx={{
                height: 4,
                background: dynasty.color
                  ? `linear-gradient(90deg, ${dynasty.color}, ${dynasty.secondaryColor || dynasty.color})`
                  : `linear-gradient(90deg, ${STATUS_COLORS[dynasty.status] || 'rgba(201,169,89,0.5)'}, transparent)`,
              }} />

              {/* Centered crest + name */}
              <Box sx={{ pt: 3, pb: 2, textAlign: 'center', position: 'relative' }}>
                {/* Actions top-right */}
                <Box className="dynasty-actions" sx={{
                  position: 'absolute', top: 8, right: 8,
                  opacity: 0, transition: 'opacity 0.15s',
                  display: 'flex', gap: 0,
                }}>
                  <Tooltip title="Открыть">
                    <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: '#fff' } }}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Удалить">
                    <IconButton size="small"
                      onClick={(e) => { e.stopPropagation(); handleDelete(dynasty.id, dynasty.name); }}
                      sx={{ color: 'rgba(255,100,100,0.4)', '&:hover': { color: 'rgba(255,100,100,0.8)' } }}>
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
                    bgcolor: 'rgba(201,169,89,0.1)',
                    border: '2px solid rgba(201,169,89,0.3)',
                    color: 'rgba(201,169,89,0.5)',
                    fontSize: '2rem',
                  }}
                >
                  👑
                </Avatar>

                {/* Name */}
                <Typography sx={{
                  fontFamily: '"Cinzel", serif', fontWeight: 700,
                  fontSize: '1.15rem', color: '#fff',
                  px: 2,
                }}>
                  {dynasty.name}
                </Typography>

                {/* Motto */}
                {dynasty.motto && (
                  <Typography sx={{
                    color: 'rgba(201,169,89,0.7)', fontStyle: 'italic',
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
                  label={`${DYNASTY_STATUS_ICONS[dynasty.status] || ''} ${DYNASTY_STATUS_LABELS[dynasty.status] || dynasty.status}`}
                  size="small"
                  sx={{
                    height: 22, fontSize: '0.7rem', fontWeight: 600,
                    backgroundColor: STATUS_COLORS[dynasty.status] || 'rgba(201,169,89,0.2)',
                    color: '#fff', borderRadius: 1,
                  }}
                />
                {(dynasty.memberCount ?? 0) > 0 && (
                  <Chip
                    icon={<PeopleIcon sx={{ fontSize: '14px !important', color: 'rgba(255,255,255,0.5) !important' }} />}
                    label={dynasty.memberCount}
                    size="small"
                    sx={{
                      height: 22, fontSize: '0.7rem',
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.5)', borderRadius: 1,
                      '& .MuiChip-icon': { ml: '4px' },
                    }}
                  />
                )}
                {dynasty.foundedDate && (
                  <Chip label={`📅 ${dynasty.foundedDate}`} size="small"
                    sx={{
                      height: 22, fontSize: '0.65rem',
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      color: 'rgba(255,255,255,0.4)', borderRadius: 1,
                    }}
                  />
                )}
              </Box>

              {/* Description preview */}
              {dynasty.description && (
                <Box sx={{ px: 2, pb: 2 }}>
                  <Typography variant="body2" sx={{
                    color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem',
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
                      backgroundColor: tag.color || 'rgba(201,169,89,0.15)',
                      color: 'rgba(255,255,255,0.6)', borderRadius: 1,
                    }} />
                  ))}
                  {dynasty.tags.length > 3 && (
                    <Chip label={`+${dynasty.tags.length - 3}`} size="small" sx={{
                      height: 18, fontSize: '0.6rem',
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      color: 'rgba(255,255,255,0.3)', borderRadius: 1,
                    }} />
                  )}
                </Box>
              )}
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};