import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box, Typography, TextField,
  Button, Chip, Select, MenuItem, FormControl,
  InputAdornment, Collapse, useTheme, alpha, CircularProgress, Alert, ButtonBase,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';
import GavelIcon from '@mui/icons-material/Gavel';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDogmaStore } from '@/store/useDogmaStore';
import { useUIStore } from '@/store/useUIStore';
import { useBranchStore } from '@/store/useBranchStore';
import { useTagStore } from '@/store/useTagStore';
import { DndButton } from '@/components/ui/DndButton';
import {
  CampaignerPage,
  CampaignerPageHeader,
  CampaignerSurface,
} from '@/components/ui/CampaignerPrimitives';
import { useDebounce } from '@/hooks/useDebounce';
import {
  DOGMA_CATEGORIES,
  DOGMA_IMPORTANCE,
  DOGMA_CATEGORY_ICONS,
} from '@campaigner/shared';
import type { Dogma } from '@campaigner/shared';
import { DogmaFormDialog } from '@/pages/dogmas/components/DogmaFormDialog';
import { DogmaListItem } from '@/pages/dogmas/components/DogmaListItem';

const PAGE_SIZE = 30;

export const DogmasPage: React.FC = () => {
  const { t } = useTranslation(['dogmas', 'common']);
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const theme = useTheme();
  const {
    dogmas, total, loading, loadingMore, error,
    fetchDogmas, createDogma, updateDogma, deleteDogma, setTags, clearError,
  } = useDogmaStore();
  const { showSnackbar, showConfirmDialog } = useUIStore();

  const activeBranchId = useBranchStore((s) => s.activeBranchId);
  const { tags, fetchTags, findOrCreateTagsByNames } = useTagStore();

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
  const [tagsStr, setTagsStr] = useState('');
  const [tagsInput, setTagsInput] = useState('');

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
  }, [pid, filterCategory, filterImportance, debouncedSearch, fetchDogmas, activeBranchId]);

  // Начальная загрузка без фильтров — узнаём общее количество
  useEffect(() => {
    fetchDogmas(pid, { limit: 1, offset: 0 }).then(() => {
      setTotalUnfiltered(useDogmaStore.getState().total);
    });
  }, [pid, fetchDogmas, activeBranchId]);

  useEffect(() => {
    fetchTags(pid).catch(() => {});
  }, [pid, activeBranchId, fetchTags]);

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
  const existingTagNames = tags.map((tag) => tag.name);

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
      label: t(`dogmas:categories.${key}`),
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
    setTagsStr('');
    setTagsInput('');
    setEditingDogma(null);
  };

  const handleOpenCreate = () => { clearError(); resetForm(); setDialogOpen(true); };

  const handleOpenEdit = (dogma: Dogma) => {
    clearError();
    setEditingDogma(dogma);
    setTitle(dogma.title);
    setCategory(dogma.category);
    setDescription(dogma.description || '');
    setImpact(dogma.impact || '');
    setExceptions(dogma.exceptions || '');
    setIsPublic(dogma.isPublic);
    setImportance(dogma.importance);
    setTagsStr((dogma.tags || []).map((tag: { name: string }) => tag.name).join(', '));
    setDialogOpen(true);
  };

  const mergeTagValues = (tagsString: string, pendingInput: string): string => {
    const committed = tagsString
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const pending = pendingInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    return Array.from(new Set([...committed, ...pending])).join(', ');
  };

  const saveTags = async (dogmaId: number, tagsString: string) => {
    const tagNames = tagsString.split(',').map(s => s.trim()).filter(Boolean);
    if (tagNames.length === 0) {
      await setTags(dogmaId, []);
      return;
    }
    const tagIds = await findOrCreateTagsByNames(pid, tagNames);
    await setTags(dogmaId, tagIds);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    const finalTags = mergeTagValues(tagsStr, tagsInput);
    try {
      if (editingDogma) {
        await updateDogma(editingDogma.id, {
          title, category: category as any, description, impact, exceptions,
          isPublic, importance: importance as any,
        });
        if (finalTags !== (editingDogma.tags || []).map((tag: { name: string }) => tag.name).join(', ')) {
          await saveTags(editingDogma.id, finalTags);
        }
        showSnackbar(t('dogmas:snackbar.updated', { name: title.trim() }), 'success');
      } else {
        const created = await createDogma({
          projectId: pid, title, category: category as any,
          description, impact, exceptions, isPublic,
          importance: importance as any,
          status: 'active', sortOrder: 0, color: '',
        });
        if (finalTags.trim()) await saveTags(created.id, finalTags);
        showSnackbar(t('dogmas:snackbar.created', { name: title.trim() }), 'success');
        // Обновить totalUnfiltered
        setTotalUnfiltered(prev => prev + 1);
      }
      setDialogOpen(false);
      resetForm();
      loadDogmas(false);
    } catch {
      showSnackbar(t('dogmas:snackbar.saveError'), 'error');
    }
  };

  const handleDelete = (id: number, name: string) => {
    showConfirmDialog(
      t('dogmas:confirm.deleteTitle'),
      t('dogmas:confirm.deleteMessage', { name }),
      async () => {
      try {
        await deleteDogma(id);
        showSnackbar(t('dogmas:snackbar.deleted', { name }), 'success');
        setTotalUnfiltered(prev => Math.max(0, prev - 1));
      } catch { showSnackbar(t('dogmas:snackbar.genericError'), 'error'); }
    });
  };

  const retryLoad = () => {
    clearError();
    setInitialized(false);
    loadDogmas(false);
  };

  if (!initialized && loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={28} />
          <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem', mt: 1.5 }}>
            {t('dogmas:states.loading')}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <CampaignerPage maxWidth={900}>
      <CampaignerPageHeader
        eyebrow={t('dogmas:page.eyebrow')}
        title={t('dogmas:page.title')}
        description={t('dogmas:page.subtitle')}
        actions={(
          <DndButton variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            {t('dogmas:list.addDogma')}
          </DndButton>
        )}
      />

      {(totalUnfiltered > 0 || hasFilters) ? (
        <CampaignerSurface
          sx={{
            p: 1.25,
            mb: 3.5,
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <TextField
            placeholder={t('dogmas:list.searchPlaceholder')}
            value={search} onChange={e => setSearch(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 220, maxWidth: 400 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            size="small"
          />

          <FormControl size="small" sx={{ minWidth: 190 }}>
            <Select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} displayEmpty>
              <MenuItem value="">{t('dogmas:list.allCategories')}</MenuItem>
              {DOGMA_CATEGORIES.map(cat => (
                <MenuItem key={cat} value={cat}>
                  {DOGMA_CATEGORY_ICONS[cat]} {t(`dogmas:categories.${cat}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select value={filterImportance} onChange={e => setFilterImportance(e.target.value)} displayEmpty>
              <MenuItem value="">{t('dogmas:list.anyImportance')}</MenuItem>
              {DOGMA_IMPORTANCE.map(imp => (
                <MenuItem key={imp} value={imp}>{t(`dogmas:importance.${imp}`)}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {hasFilters && (
            <Button variant="text" onClick={clearFilters} size="small">
              {t('common:reset')}
            </Button>
          )}

          <Typography sx={{
            color: 'text.disabled',
            ml: 'auto',
            px: 1,
            fontFamily: theme.campaigner.typography.mono,
            fontSize: '0.65rem',
          }}>
            {t('dogmas:list.count', { shown: dogmas.length, total })}
          </Typography>
        </CampaignerSurface>
      ) : null}

      {error && initialized ? (
        <Alert
          severity="error"
          variant="outlined"
          action={(
            <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={retryLoad}>
              {t('dogmas:states.retry')}
            </Button>
          )}
          sx={{ mb: 3, borderRadius: '12px' }}
        >
          {t('dogmas:states.error')}
        </Alert>
      ) : null}

      {dogmas.length === 0 && !loading && !error ? (
        hasFilters ? (
          <Box sx={{ py: 7, textAlign: 'center' }}>
            <SearchIcon sx={{ color: 'text.disabled', fontSize: 30 }} />
            <Typography sx={{ fontFamily: theme.campaigner.typography.display, fontSize: '1.5rem', mt: 1.5 }}>
              {t('dogmas:list.emptyFilteredTitle')}
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', mt: 1 }}>
              {t('dogmas:list.emptyFilteredDescription')}
            </Typography>
            <Button variant="outlined" onClick={clearFilters} sx={{ mt: 2.5 }}>
              {t('dogmas:list.emptyFilteredAction')}
            </Button>
          </Box>
        ) : (
          <Box
            sx={{
              mt: 1,
              py: { xs: 6, md: 7.5 },
              px: 4,
              textAlign: 'center',
              borderRadius: '16px',
              border: `1px dashed ${alpha(theme.palette.text.primary, 0.13)}`,
              backgroundColor: alpha(theme.palette.common.white, 0.012),
            }}
          >
            <GavelIcon sx={{ color: 'text.disabled', fontSize: 30 }} />
            <Typography sx={{
              fontFamily: theme.campaigner.typography.display,
              fontWeight: 600,
              fontSize: '1.5rem',
              mt: 1.25,
            }}>
              {t('dogmas:list.emptyNoDogmasTitle')}
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', lineHeight: 1.7, mt: 1, mx: 'auto', maxWidth: 440 }}>
              {t('dogmas:list.emptyNoDogmasDescription')}
            </Typography>
            <DndButton variant="outlined" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ mt: 2.5 }}>
              {t('dogmas:list.emptyNoDogmasAction')}
            </DndButton>
          </Box>
        )
      ) : dogmas.length > 0 ? (
        <>
          {groupedCategories.map((group) => {
            const collapsed = collapsedCategories.has(group.key);

            return (
              <Box key={group.key} sx={{ mb: 4 }}>
                <ButtonBase
                  onClick={() => toggleCategory(group.key)}
                  sx={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', gap: 1.25,
                    mb: 1.5, pb: 1,
                    borderBottom: `1px solid ${theme.campaigner.surface.border}`,
                    justifyContent: 'flex-start',
                  }}
                >
                  <Typography sx={{ fontSize: '1.05rem' }}>{group.icon}</Typography>
                  <Typography sx={{
                    fontFamily: theme.campaigner.typography.display, fontWeight: 600, fontSize: '1.35rem',
                    color: 'text.primary', flexGrow: 1,
                    textAlign: 'left',
                  }}>
                    {group.label}
                  </Typography>
                  <Chip label={`${group.dogmas.length}`} size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.62rem',
                      fontFamily: theme.campaigner.typography.mono,
                      backgroundColor: 'transparent',
                      border: `1px solid ${theme.campaigner.surface.border}`,
                      color: 'text.disabled',
                    }} />
                  {collapsed
                    ? <ExpandMoreIcon sx={{ color: 'text.secondary' }} />
                    : <ExpandLessIcon sx={{ color: 'text.secondary' }} />}
                </ButtonBase>

                <Collapse in={!collapsed}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    {group.dogmas.map((dogma) => (
                      <DogmaListItem
                        key={dogma.id}
                        dogma={dogma}
                        onEdit={handleOpenEdit}
                        onDelete={handleDelete}
                      />
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
                <CircularProgress size={22} aria-label={t('common:loading')} />
              )}
            </Box>
          )}
        </>
      ) : null}

      <DogmaFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editingDogma={editingDogma}
        title={title}
        setTitle={setTitle}
        category={category}
        setCategory={setCategory}
        description={description}
        setDescription={setDescription}
        impact={impact}
        setImpact={setImpact}
        exceptions={exceptions}
        setExceptions={setExceptions}
        isPublic={isPublic}
        setIsPublic={setIsPublic}
        importance={importance}
        setImportance={setImportance}
        tagsStr={tagsStr}
        setTagsStr={setTagsStr}
        tagsInput={tagsInput}
        setTagsInput={setTagsInput}
        existingTagNames={existingTagNames}
        onSave={handleSave}
      />
    </CampaignerPage>
  );
};
