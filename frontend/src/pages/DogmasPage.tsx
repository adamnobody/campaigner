import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box, Typography, Paper, TextField, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Chip, Select, MenuItem, FormControl,
  InputAdornment, Collapse, Tooltip, Switch,
  FormControlLabel, InputLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import GavelIcon from '@mui/icons-material/Gavel';
import { useParams } from 'react-router-dom';
import { useDogmaStore } from '@/store/useDogmaStore';
import { useUIStore } from '@/store/useUIStore';
import { tagsApi } from '@/api/axiosClient';
import { DndButton } from '@/components/ui/DndButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';
import {
  DOGMA_CATEGORIES,
  DOGMA_IMPORTANCE,
  DOGMA_CATEGORY_LABELS,
  DOGMA_CATEGORY_ICONS,
  DOGMA_IMPORTANCE_LABELS,
} from '@campaigner/shared';
import type { Dogma } from '@campaigner/shared';

const IMPORTANCE_COLORS: Record<string, string> = {
  fundamental: 'rgba(255,107,107,0.8)',
  major: 'rgba(255,200,100,0.8)',
  minor: 'rgba(130,130,255,0.6)',
};

const PAGE_SIZE = 30;

export const DogmasPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const {
    dogmas, total, loading, loadingMore,
    fetchDogmas, createDogma, updateDogma, deleteDogma, setTags,
  } = useDogmaStore();
  const { showSnackbar, showConfirmDialog } = useUIStore();

  // Флаг: была ли хотя бы одна успешная загрузка (чтобы отличить "ещё не грузили" от "загрузили и пусто")
  const [initialized, setInitialized] = useState(false);

  // Dialog form
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDogma, setEditingDogma] = useState<Dogma | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('other');
  const [description, setDescription] = useState('');
  const [impact, setImpact] = useState('');
  const [exceptions, setExceptions] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [importance, setImportance] = useState<string>('major');
  const [icon, setIcon] = useState('');
  const [tagsStr, setTagsStr] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterImportance, setFilterImportance] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Для отслеживания: есть ли вообще догмы (без фильтров)
  const [totalUnfiltered, setTotalUnfiltered] = useState(0);

  // Infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Стабильная функция загрузки (без dogmas.length в deps)
  const loadDogmas = useCallback(async (append = false) => {
    const offset = append ? useDogmaStore.getState().dogmas.length : 0;
    await fetchDogmas(pid, {
      category: filterCategory || undefined,
      importance: filterImportance || undefined,
      search: debouncedSearch || undefined,
      limit: PAGE_SIZE,
      offset,
      append,
    });
    setInitialized(true);
  }, [pid, filterCategory, filterImportance, debouncedSearch, fetchDogmas]);

  // Начальная загрузка без фильтров — узнаём общее количество
  useEffect(() => {
    fetchDogmas(pid, { limit: 1, offset: 0 }).then(() => {
      setTotalUnfiltered(useDogmaStore.getState().total);
    });
  }, [pid, fetchDogmas]);

  // Загрузка при смене фильтров
  useEffect(() => {
    setInitialized(false);
    loadDogmas(false);
  }, [loadDogmas]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const state = useDogmaStore.getState();
        if (entries[0].isIntersecting && !state.loadingMore && !state.loading && state.dogmas.length < state.total) {
          loadDogmas(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [loadDogmas]);

  // Есть ли активные фильтры
  const hasFilters = !!(debouncedSearch || filterCategory || filterImportance);

  // Group by category
  const groupedCategories: { key: string; label: string; icon: string; dogmas: Dogma[] }[] = [];
  const categoryMap = new Map<string, Dogma[]>();
  for (const d of dogmas) {
    const key = d.category || 'other';
    if (!categoryMap.has(key)) categoryMap.set(key, []);
    categoryMap.get(key)!.push(d);
  }

  const categoryOrder = DOGMA_CATEGORIES as readonly string[];
  const sortedKeys = [...categoryMap.keys()].sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  );

  for (const key of sortedKeys) {
    groupedCategories.push({
      key,
      label: DOGMA_CATEGORY_LABELS[key] || key,
      icon: DOGMA_CATEGORY_ICONS[key] || '📋',
      dogmas: categoryMap.get(key)!,
    });
  }

  const toggleCategory = (key: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const clearFilters = () => {
    setSearch('');
    setFilterCategory('');
    setFilterImportance('');
  };

  // ==================== Form ====================

  const resetForm = () => {
    setTitle('');
    setCategory('other');
    setDescription('');
    setImpact('');
    setExceptions('');
    setIsPublic(true);
    setImportance('major');
    setIcon('');
    setTagsStr('');
    setEditingDogma(null);
  };

  const handleOpenCreate = () => { resetForm(); setDialogOpen(true); };

  const handleOpenEdit = (dogma: Dogma) => {
    setEditingDogma(dogma);
    setTitle(dogma.title);
    setCategory(dogma.category);
    setDescription(dogma.description || '');
    setImpact(dogma.impact || '');
    setExceptions(dogma.exceptions || '');
    setIsPublic(dogma.isPublic);
    setImportance(dogma.importance);
    setIcon(dogma.icon || '');
    setTagsStr((dogma.tags || []).map((t: any) => t.name).join(', '));
    setDialogOpen(true);
  };

  const saveTags = async (dogmaId: number, tagsString: string) => {
    const tagNames = tagsString.split(',').map(s => s.trim()).filter(Boolean);
    if (tagNames.length === 0) {
      await setTags(dogmaId, []);
      return;
    }
    const existingRes = await tagsApi.getAll(pid);
    const existingTags: any[] = existingRes.data.data || [];
    const tagIds: number[] = [];
    for (const name of tagNames) {
      const existing = existingTags.find((t: any) => t.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        tagIds.push(existing.id);
      } else {
        const newRes = await tagsApi.create({ name, projectId: pid });
        tagIds.push(newRes.data.data.id);
      }
    }
    await setTags(dogmaId, tagIds);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    try {
      if (editingDogma) {
        await updateDogma(editingDogma.id, {
          title, category: category as any, description, impact, exceptions,
          isPublic, importance: importance as any, icon,
        });
        if (tagsStr !== (editingDogma.tags || []).map((t: any) => t.name).join(', ')) {
          await saveTags(editingDogma.id, tagsStr);
        }
        showSnackbar('Догма обновлена', 'success');
      } else {
        const created = await createDogma({
          projectId: pid, title, category: category as any,
          description, impact, exceptions, isPublic,
          importance: importance as any, icon,
          status: 'active', sortOrder: 0, color: '',
        });
        if (tagsStr.trim()) await saveTags(created.id, tagsStr);
        showSnackbar('Догма создана', 'success');
        // Обновить totalUnfiltered
        setTotalUnfiltered(prev => prev + 1);
      }
      setDialogOpen(false);
      resetForm();
      loadDogmas(false);
    } catch {
      showSnackbar('Ошибка сохранения', 'error');
    }
  };

  const handleDelete = (id: number, name: string) => {
    showConfirmDialog('Удалить догму', `Удалить "${name}"?`, async () => {
      try {
        await deleteDogma(id);
        showSnackbar('Догма удалена', 'success');
        setTotalUnfiltered(prev => Math.max(0, prev - 1));
      } catch { showSnackbar('Ошибка', 'error'); }
    });
  };

  // ==================== Render ====================

  // Первая загрузка — показываем спиннер
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
            Догмы мира
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', mt: 0.5 }}>
            Фундаментальные законы и правила мироустройства
          </Typography>
        </Box>
        <DndButton variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Добавить догму
        </DndButton>
      </Box>

      {/* Filters — видны если есть хотя бы одна догма в проекте или активны фильтры */}
      {(totalUnfiltered > 0 || hasFilters) && (
        <Box display="flex" gap={2} mb={3} alignItems="center" flexWrap="wrap">
          <TextField
            placeholder="Поиск догм..."
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
            <Select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} displayEmpty
              sx={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
                color: '#fff',
              }}>
              <MenuItem value="">Все категории</MenuItem>
              {DOGMA_CATEGORIES.map(cat => (
                <MenuItem key={cat} value={cat}>
                  {DOGMA_CATEGORY_ICONS[cat]} {DOGMA_CATEGORY_LABELS[cat]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select value={filterImportance} onChange={e => setFilterImportance(e.target.value)} displayEmpty
              sx={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
                color: '#fff',
              }}>
              <MenuItem value="">Любая важность</MenuItem>
              {DOGMA_IMPORTANCE.map(imp => (
                <MenuItem key={imp} value={imp}>{DOGMA_IMPORTANCE_LABELS[imp]}</MenuItem>
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
            {dogmas.length} из {total}
          </Typography>
        </Box>
      )}

      {/* Content */}
      {dogmas.length === 0 && !loading ? (
        hasFilters ? (
          /* Пустой результат фильтрации */
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
          /* Вообще нет догм в проекте */
          <EmptyState
            icon={<GavelIcon sx={{ fontSize: 64 }} />}
            title="Догм пока нет"
            description="Определите фундаментальные законы вашего мира — как работает магия, какие правила общества, что определяет реальность"
            actionLabel="Добавить догму"
            onAction={handleOpenCreate}
          />
        )
      ) : (
        <>
          {/* Dogmas grouped by category */}
          {groupedCategories.map((group) => {
            const collapsed = collapsedCategories.has(group.key);

            return (
              <Box key={group.key} sx={{ mb: 3 }}>
                {/* Category header */}
                <Box
                  onClick={() => toggleCategory(group.key)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer',
                    mb: 1.5, py: 1, px: 2,
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderRadius: 2,
                    border: '1px solid rgba(255,255,255,0.06)',
                    transition: 'all 0.15s',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      borderColor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <Typography sx={{ fontSize: '1.4rem' }}>{group.icon}</Typography>
                  <Typography sx={{
                    fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '1.1rem',
                    color: 'rgba(255,255,255,0.85)', flexGrow: 1,
                  }}>
                    {group.label}
                  </Typography>
                  <Chip label={`${group.dogmas.length}`} size="small"
                    sx={{
                      height: 22, fontSize: '0.75rem',
                      backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
                    }} />
                  {collapsed
                    ? <ExpandMoreIcon sx={{ color: 'rgba(255,255,255,0.3)' }} />
                    : <ExpandLessIcon sx={{ color: 'rgba(255,255,255,0.3)' }} />}
                </Box>

                <Collapse in={!collapsed}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pl: 1 }}>
                    {group.dogmas.map((dogma) => (
                      <Paper
                        key={dogma.id}
                        sx={{
                          p: 2.5,
                          backgroundColor: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderLeft: `4px solid ${IMPORTANCE_COLORS[dogma.importance] || 'rgba(130,130,255,0.6)'}`,
                          borderRadius: 2,
                          transition: 'all 0.15s',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.07)',
                            borderColor: 'rgba(255,255,255,0.15)',
                            '& .dogma-actions': { opacity: 1 },
                          },
                        }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                            {/* Title row */}
                            <Box display="flex" alignItems="center" gap={1} mb={0.5} flexWrap="wrap">
                              {dogma.icon && (
                                <Typography sx={{ fontSize: '1.2rem' }}>{dogma.icon}</Typography>
                              )}
                              <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '1.05rem' }}>
                                {dogma.title}
                              </Typography>
                              <Chip
                                label={DOGMA_IMPORTANCE_LABELS[dogma.importance]}
                                size="small"
                                sx={{
                                  height: 20, fontSize: '0.65rem', fontWeight: 600,
                                  backgroundColor: IMPORTANCE_COLORS[dogma.importance] || 'rgba(130,130,255,0.2)',
                                  color: '#fff', borderRadius: 1,
                                }}
                              />
                              {!dogma.isPublic && (
                                <Tooltip title="Не известна жителям мира">
                                  <VisibilityOffIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} />
                                </Tooltip>
                              )}
                            </Box>

                            {/* Description */}
                            {dogma.description && (
                              <Typography variant="body2" sx={{
                                color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', mt: 0.5,
                                overflow: 'hidden', textOverflow: 'ellipsis',
                                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                              }}>
                                {dogma.description}
                              </Typography>
                            )}

                            {/* Impact */}
                            {dogma.impact && (
                              <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                                <Typography variant="caption" sx={{
                                  color: 'rgba(255,200,100,0.7)', fontWeight: 600, flexShrink: 0,
                                }}>
                                  Влияние:
                                </Typography>
                                <Typography variant="caption" sx={{
                                  color: 'rgba(255,255,255,0.4)',
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                  {dogma.impact}
                                </Typography>
                              </Box>
                            )}

                            {/* Exceptions */}
                            {dogma.exceptions && (
                              <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                                <Typography variant="caption" sx={{
                                  color: 'rgba(255,107,107,0.7)', fontWeight: 600, flexShrink: 0,
                                }}>
                                  Исключения:
                                </Typography>
                                <Typography variant="caption" sx={{
                                  color: 'rgba(255,255,255,0.4)',
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                  {dogma.exceptions}
                                </Typography>
                              </Box>
                            )}

                            {/* Tags */}
                            {dogma.tags && dogma.tags.length > 0 && (
                              <Box display="flex" gap={0.5} mt={1} flexWrap="wrap">
                                {dogma.tags.map((tag: any) => (
                                  <Chip key={tag.id} label={tag.name} size="small" sx={{
                                    height: 20, fontSize: '0.65rem', fontWeight: 600,
                                    backgroundColor: tag.color || 'rgba(130,130,255,0.2)',
                                    color: '#fff', borderRadius: 1,
                                  }} />
                                ))}
                              </Box>
                            )}
                          </Box>

                          {/* Actions */}
                          <Box className="dogma-actions" display="flex" alignItems="center" gap={0}
                            sx={{ opacity: 0, transition: 'opacity 0.15s', flexShrink: 0, ml: 1 }}>
                            <Tooltip title="Редактировать">
                              <IconButton size="small" onClick={() => handleOpenEdit(dogma)}
                                sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: '#fff' } }}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Удалить">
                              <IconButton size="small" onClick={() => handleDelete(dogma.id, dogma.title)}
                                sx={{ color: 'rgba(255,100,100,0.4)', '&:hover': { color: 'rgba(255,100,100,0.8)' } }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </Collapse>
              </Box>
            );
          })}

          {/* Infinite scroll sentinel */}
          {dogmas.length < total && (
            <Box ref={sentinelRef} sx={{ py: 3, textAlign: 'center' }}>
              {loadingMore && (
                <Typography sx={{ color: 'rgba(255,255,255,0.4)' }}>Загрузка...</Typography>
              )}
            </Box>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}>
        <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>
          {editingDogma ? 'Редактировать догму' : 'Новая догма'}
        </DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth label="Формулировка *" value={title}
            onChange={e => setTitle(e.target.value)} margin="normal"
            placeholder="напр. Магия питается лунным светом" />

          <Box display="flex" gap={2} mt={1}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Категория</InputLabel>
              <Select value={category} onChange={e => setCategory(e.target.value)} label="Категория">
                {DOGMA_CATEGORIES.map(cat => (
                  <MenuItem key={cat} value={cat}>
                    {DOGMA_CATEGORY_ICONS[cat]} {DOGMA_CATEGORY_LABELS[cat]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Важность</InputLabel>
              <Select value={importance} onChange={e => setImportance(e.target.value)} label="Важность">
                {DOGMA_IMPORTANCE.map(imp => (
                  <MenuItem key={imp} value={imp}>{DOGMA_IMPORTANCE_LABELS[imp]}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TextField fullWidth label="Иконка (эмодзи)" value={icon}
            onChange={e => setIcon(e.target.value)} margin="normal"
            placeholder="напр. ⚡ 🌙 ⚔️"
            sx={{ maxWidth: 200 }} />

          <TextField fullWidth label="Описание" value={description}
            onChange={e => setDescription(e.target.value)} margin="normal"
            multiline rows={4}
            placeholder="Подробное описание правила, его нюансы..." />

          <TextField fullWidth label="Влияние на мир" value={impact}
            onChange={e => setImpact(e.target.value)} margin="normal"
            multiline rows={3}
            placeholder="Как это правило влияет на жизнь, политику, войны..." />

          <TextField fullWidth label="Исключения" value={exceptions}
            onChange={e => setExceptions(e.target.value)} margin="normal"
            multiline rows={2}
            placeholder="Известные исключения из этого правила..." />

          <Box display="flex" alignItems="center" gap={2} mt={2}>
            <FormControlLabel
              control={
                <Switch checked={isPublic} onChange={e => setIsPublic(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: 'rgba(78,205,196,0.9)' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: 'rgba(78,205,196,0.5)' },
                  }} />
              }
              label={
                <Box display="flex" alignItems="center" gap={0.5}>
                  {isPublic
                    ? <VisibilityIcon sx={{ fontSize: 18, color: 'rgba(78,205,196,0.8)' }} />
                    : <VisibilityOffIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }} />}
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    {isPublic ? 'Известна жителям мира' : 'Скрыта от жителей мира'}
                  </Typography>
                </Box>
              }
            />
          </Box>

          <TextField fullWidth label="Теги (через запятую)" value={tagsStr}
            onChange={e => setTagsStr(e.target.value)} margin="normal"
            placeholder="напр. магия, луна, ограничения" />

          {tagsStr.trim() && (
            <Box display="flex" gap={0.5} flexWrap="wrap" mt={1}>
              {tagsStr.split(',').map((t, i) => {
                const trimmed = t.trim();
                return trimmed ? (
                  <Chip key={i} label={trimmed} size="small"
                    sx={{ backgroundColor: 'rgba(130,130,255,0.2)', color: '#fff', fontSize: '0.75rem' }} />
                ) : null;
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Отмена</Button>
          <DndButton variant="contained" onClick={handleSave} disabled={!title.trim()}>
            {editingDogma ? 'Сохранить' : 'Создать'}
          </DndButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};