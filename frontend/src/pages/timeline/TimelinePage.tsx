import React, { useEffect, useState } from 'react';
import {
  Box, Typography, TextField, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Chip, Select, MenuItem, FormControl,
  InputAdornment, Collapse, Tooltip,
  Autocomplete, useTheme, alpha, CircularProgress, Alert, ButtonBase,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';
import TimelineIcon from '@mui/icons-material/Timeline';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import DescriptionIcon from '@mui/icons-material/Description';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import ShieldIcon from '@mui/icons-material/Shield';
import FoundationIcon from '@mui/icons-material/Foundation';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTimelineStore } from '@/store/useTimelineStore';
import { useUIStore } from '@/store/useUIStore';
import { useBranchStore } from '@/store/useBranchStore';
import { useTagStore } from '@/store/useTagStore';
import { useCharacterStore } from '@/store/useCharacterStore';
import { notesApi } from '@/api/notes';
import { DndButton } from '@/components/ui/DndButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  CampaignerPage,
  CampaignerPageHeader,
  CampaignerSurface,
} from '@/components/ui/CampaignerPrimitives';
import { CatalogAside, CatalogColumns } from '@/components/catalog/CatalogLayout';
import { TagAutocompleteField } from '@/components/forms/TagAutocompleteField';
import { useDebounce } from '@/hooks/useDebounce';
import type { TimelineEvent } from '@campaigner/shared';

const useEraColors = () => {
  const theme = useTheme();
  return [
    alpha(theme.palette.primary.main, 0.6),
    alpha(theme.palette.secondary.main, 0.6),
    alpha(theme.palette.warning.main, 0.6),
    alpha(theme.palette.info.main, 0.6),
    alpha(theme.palette.error.main, 0.6),
    alpha(theme.palette.success.main, 0.6),
    alpha(theme.palette.primary.light, 0.6),
    alpha(theme.palette.secondary.light, 0.6),
  ];
};

/** Пресеты HEX для строки выбора цвета эпохи */
const ERA_COLOR_HEX_PRESETS = [
  '#5B9BD5', '#70AD47', '#FFC000', '#FF6B6B',
  '#9B59B6', '#3498DB', '#E67E22', '#1ABC9C',
] as const;
const FALLBACK_ERA_HEX = '#5B9BD5';

interface NoteOption {
  id: number;
  title: string;
  noteType?: string;
}

export const TimelinePage: React.FC = () => {
  const { t } = useTranslation(['timeline', 'common', 'navigation']);
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const navigate = useNavigate();
  const {
    events, loading, error, fetchEvents, createEvent, updateEvent,
    deleteEvent, reorderEvents, setTags, clearError,
  } = useTimelineStore();
  const { showSnackbar, showConfirmDialog } = useUIStore();
  const theme = useTheme();
  const activeBranchId = useBranchStore((s) => s.activeBranchId);
  const { tags, fetchTags, findOrCreateTagsByNames } = useTagStore();
  const fetchCharacters = useCharacterStore((s) => s.fetchCharacters);
  const characters = useCharacterStore((s) => s.characters);
  const eraColors = useEraColors();

  // Dialog form
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [era, setEra] = useState('');
  const [eraColor, setEraColor] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [linkedNoteId, setLinkedNoteId] = useState<number | null>(null);

  // Notes for linking
  const [allNotes, setAllNotes] = useState<NoteOption[]>([]);
  const [notesMap, setNotesMap] = useState<Map<number, string>>(new Map());

  // Filters
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [filterEra, setFilterEra] = useState('');
  const [collapsedEras, setCollapsedEras] = useState<Set<string>>(new Set());

  // Drag
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  useEffect(() => {
    fetchEvents(pid);
    void fetchCharacters(pid, { limit: 500 });
    // Load notes for linking
    notesApi.getAll(pid, { limit: 500 }).then(res => {
      const items = res.data.data.items || res.data.data || [];
      const opts: NoteOption[] = items.map((n: { id: number; title: string; noteType?: string }) => ({
        id: n.id,
        title: n.title,
        noteType: n.noteType,
      }));
      setAllNotes(opts);
      const m = new Map<number, string>();
      opts.forEach(n => m.set(n.id, n.title));
      setNotesMap(m);
    }).catch(() => {});

    fetchTags(pid).catch(() => {});
  }, [pid, fetchEvents, fetchTags, fetchCharacters, activeBranchId]);

  // Eras list
  const allEras = [...new Set(events.map(e => e.era || ''))].filter(Boolean);
  const allTagNames = tags.map((tag) => tag.name);

  // Filtered events
  const filtered = events.filter(e => {
    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase();
      if (!e.title.toLowerCase().includes(s) && !(e.description || '').toLowerCase().includes(s)
        && !e.eventDate.toLowerCase().includes(s)) return false;
    }
    if (filterEra && (e.era || '') !== filterEra) return false;
    return true;
  });

  // Group by era
  const groupedEras: { name: string; events: TimelineEvent[] }[] = [];
  const eraMap = new Map<string, TimelineEvent[]>();
  for (const e of filtered) {
    const key = e.era || '';
    if (!eraMap.has(key)) eraMap.set(key, []);
    eraMap.get(key)!.push(e);
  }
  for (const [name, evts] of eraMap) {
    groupedEras.push({ name, events: evts });
  }

  const displayColorForEraGroup = (
    group: { name: string; events: TimelineEvent[] },
    groupIndex: number,
  ): string => {
    const hex = group.events.map((ev) => ev.eraColor).find((c) => c && String(c).trim());
    if (hex) return hex;
    return eraColors[groupIndex % eraColors.length];
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setEventDate('');
    setEra(''); setEraColor(''); setTagsStr(''); setTagsInput(''); setLinkedNoteId(null); setEditingEvent(null);
  };

  const handleOpenCreate = () => { clearError(); resetForm(); setDialogOpen(true); };

  const handleOpenEdit = (event: TimelineEvent) => {
    clearError();
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description || '');
    setEventDate(event.eventDate);
    setEra(event.era || '');
    setEraColor((event.eraColor && String(event.eraColor).trim()) || '');
    setTagsStr((event.tags || []).map((tag) => tag.name).join(', '));
    setTagsInput('');
    setLinkedNoteId(event.linkedNoteId || null);
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

  const saveTags = async (eventId: number, tagsString: string) => {
    const tagNames = tagsString.split(',').map(s => s.trim()).filter(Boolean);
    if (tagNames.length === 0) {
      await setTags(eventId, []);
      return;
    }
    const tagIds = await findOrCreateTagsByNames(pid, tagNames);
    await setTags(eventId, tagIds);
  };

  const handleSave = async () => {
    if (!title.trim() || !eventDate.trim()) return;
    const trimmedEra = era.trim();
    const eraColorPayload = trimmedEra
      ? (eraColor.trim() || FALLBACK_ERA_HEX)
      : '';
    const finalTags = mergeTagValues(tagsStr, tagsInput);
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, {
          title, description, eventDate, era: trimmedEra, linkedNoteId,
          eraColor: eraColorPayload,
        });
        if (finalTags !== (editingEvent.tags || []).map((tag) => tag.name).join(', ')) {
          await saveTags(editingEvent.id, finalTags);
        }
        showSnackbar(t('timeline:snackbar.eventUpdated', { title: title.trim() }), 'success');
      } else {
        const created = await createEvent({
          projectId: pid, title, description, eventDate, era: trimmedEra,
          sortOrder: 0, linkedNoteId,
          eraColor: eraColorPayload,
        });
        if (finalTags.trim()) await saveTags(created.id, finalTags);
        showSnackbar(t('timeline:snackbar.eventCreated', { title: title.trim() }), 'success');
      }
      setDialogOpen(false);
      resetForm();
      fetchEvents(pid);
    } catch {
      showSnackbar(t('timeline:snackbar.saveError'), 'error');
    }
  };

  const handleDelete = (id: number, name: string) => {
    showConfirmDialog(
      t('timeline:confirm.deleteTitle'),
      t('timeline:confirm.deleteMessage', { title: name }),
      async () => {
        try {
          await deleteEvent(id);
          showSnackbar(t('timeline:snackbar.eventDeleted', { title: name }), 'success');
        } catch {
          showSnackbar(t('timeline:snackbar.error'), 'error');
        }
      },
    );
  };

  const handleUnlinkNote = async (eventId: number) => {
    try {
      await updateEvent(eventId, { linkedNoteId: null });
      showSnackbar(t('timeline:snackbar.noteUnlinked'), 'success');
      fetchEvents(pid);
    } catch { showSnackbar(t('timeline:snackbar.error'), 'error'); }
  };

  const toggleEra = (eraName: string) => {
    setCollapsedEras(prev => {
      const next = new Set(prev);
      if (next.has(eraName)) next.delete(eraName); else next.add(eraName);
      return next;
    });
  };

  const moveEvent = async (eventId: number, direction: 'up' | 'down') => {
    const idx = events.findIndex(e => e.id === eventId);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= events.length) return;
    const newOrder = events.map(e => e.id);
    [newOrder[idx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[idx]];
    try { await reorderEvents(pid, newOrder); } catch { showSnackbar(t('timeline:snackbar.reorderError'), 'error'); }
  };

  // Drag & drop
  const handleDragStart = (id: number) => setDragId(id);
  const handleDragOver = (e: React.DragEvent, id: number) => { e.preventDefault(); setDragOverId(id); };
  const handleDrop = async (targetId: number) => {
    if (dragId === null || dragId === targetId) { setDragId(null); setDragOverId(null); return; }
    const ids = events.map(e => e.id);
    const fromIdx = ids.indexOf(dragId);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx < 0 || toIdx < 0) { setDragId(null); setDragOverId(null); return; }
    ids.splice(fromIdx, 1);
    ids.splice(toIdx, 0, dragId);
    setDragId(null); setDragOverId(null);
    try { await reorderEvents(pid, ids); } catch { showSnackbar(t('timeline:snackbar.reorderError'), 'error'); }
  };

  const retryLoad = () => {
    clearError();
    fetchEvents(pid);
  };
  const dialogRowSx = {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: '140px minmax(0, 1fr)' },
    gap: { xs: 0.75, sm: 2.5 },
    alignItems: 'center',
    minHeight: 54,
    px: 2.25,
    py: 1.25,
    backgroundColor: alpha(theme.palette.common.white, 0.025),
    '& + &': { borderTop: `1px solid ${theme.campaigner.surface.border}` },
  };
  const dialogFieldSx = {
    '& .MuiInputBase-root': { fontSize: '0.82rem' },
    '& .MuiInputBase-input': { py: 0.5 },
  };

  if (loading && events.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={28} />
          <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem', mt: 1.5 }}>
            {t('timeline:states.loading')}
          </Typography>
        </Box>
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
              { label: t('timeline:aside.summaryEvents'), value: events.length },
              { label: t('timeline:aside.summaryEras'), value: allEras.length },
              { label: t('timeline:aside.summaryLinked'), value: events.filter((item) => item.linkedNoteId).length },
              { label: t('timeline:aside.summaryNoEra'), value: events.filter((item) => !item.era).length },
            ]}
            storedTitle={t('common:catalog.storedTitle')}
            storedBody={t('timeline:aside.storedBody')}
            linkedTitle={t('common:catalog.linkedTitle')}
            linked={[
              { label: t('navigation:menu.notes'), value: allNotes.filter((item) => item.noteType !== 'wiki').length },
              { label: t('navigation:menu.wiki'), value: allNotes.filter((item) => item.noteType === 'wiki').length },
              { label: t('navigation:menu.characters'), value: characters.length },
            ]}
          />
        )}
      >
      <CampaignerPageHeader
        eyebrow={t('timeline:page.eyebrow', { count: events.length })}
        title={t('timeline:page.title')}
        description={t('timeline:page.subtitle')}
        actions={(
          <DndButton variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            {t('timeline:page.addEvent')}
          </DndButton>
        )}
      />

      {error ? (
        <Alert
          severity="error"
          variant="outlined"
          action={(
            <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={retryLoad}>
              {t('timeline:states.retry')}
            </Button>
          )}
          sx={{ mb: 3, borderRadius: '12px' }}
        >
          {t('timeline:states.error')}
        </Alert>
      ) : null}

      {events.length === 0 && !error ? (
        <>
          <CampaignerSurface
            sx={{
              p: 1.25,
              display: 'flex',
              gap: 1,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <TextField
              placeholder={t('timeline:filters.searchPlaceholder')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ flexGrow: 1, minWidth: 220, maxWidth: 400 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
            <Typography
              sx={{
                color: 'text.disabled',
                ml: 'auto',
                px: 1,
                fontFamily: theme.campaigner.typography.mono,
                fontSize: '0.65rem',
              }}
            >
              {t('timeline:filters.countShown', { filtered: 0, total: 0 })}
            </Typography>
          </CampaignerSurface>
          <EmptyState
            icon={<TimelineIcon />}
            title={t('timeline:empty.title')}
            description={t('timeline:empty.description')}
            actionLabel={t('timeline:empty.action')}
            onAction={handleOpenCreate}
            templatesTitle={t('timeline:empty.templates.title')}
            templates={[
              {
                icon: <HourglassTopIcon />,
                title: t('timeline:empty.templates.era.title'),
                description: t('timeline:empty.templates.era.description'),
                onClick: handleOpenCreate,
              },
              {
                icon: <ShieldIcon />,
                title: t('timeline:empty.templates.war.title'),
                description: t('timeline:empty.templates.war.description'),
                onClick: handleOpenCreate,
              },
              {
                icon: <FoundationIcon />,
                title: t('timeline:empty.templates.foundation.title'),
                description: t('timeline:empty.templates.foundation.description'),
                onClick: handleOpenCreate,
              },
            ]}
          />
        </>
      ) : events.length > 0 ? (
        <>
          <CampaignerSurface
            sx={{
              p: 1.25,
              mb: 4,
              display: 'flex',
              gap: 1,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <TextField
              placeholder={t('timeline:filters.searchPlaceholder')}
              value={search} onChange={e => setSearch(e.target.value)}
              sx={{
                flexGrow: 1, minWidth: 220, maxWidth: 400,
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
              size="small"
            />

            {allEras.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <Select value={filterEra} onChange={e => setFilterEra(e.target.value)} displayEmpty>
                  <MenuItem value="">{t('timeline:filters.allEras')}</MenuItem>
                  {allEras.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                </Select>
              </FormControl>
            )}

            {(search || filterEra) && (
              <Button variant="text" onClick={() => { setSearch(''); setFilterEra(''); }} size="small">
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
              {t('timeline:filters.countShown', { filtered: filtered.length, total: events.length })}
            </Typography>
          </CampaignerSurface>

          {filtered.length === 0 ? (
            <Box sx={{ py: 7, textAlign: 'center' }}>
              <SearchIcon sx={{ color: 'text.disabled', fontSize: 30 }} />
              <Typography sx={{ fontFamily: theme.campaigner.typography.display, fontSize: '1.5rem', mt: 1.5 }}>
                {t('timeline:filters.emptyTitle')}
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', mt: 1 }}>
                {t('timeline:filters.emptyDescription')}
              </Typography>
              <Button variant="outlined" onClick={() => { setSearch(''); setFilterEra(''); }} sx={{ mt: 2.5 }}>
                {t('timeline:filters.reset')}
              </Button>
            </Box>
          ) : null}

          {/* Timeline */}
          <Box sx={{ display: filtered.length === 0 ? 'none' : 'block' }}>

            {groupedEras.map((group, gi) => {
              const eraColorResolved = displayColorForEraGroup(group, gi);
              const eraKey = group.name || '__none__';
              const collapsed = collapsedEras.has(eraKey);

              return (
                <Box key={eraKey} sx={{ mb: 4 }}>
                  {group.name && (
                    <ButtonBase
                      onClick={() => toggleEra(eraKey)}
                      sx={{
                        width: '100%',
                        display: 'flex', alignItems: 'center', gap: 1.25,
                        mb: 0.5, pb: 1,
                        borderBottom: `1px solid ${theme.campaigner.surface.border}`,
                        justifyContent: 'flex-start',
                      }}
                    >
                      {collapsed
                        ? <ExpandMoreIcon sx={{ fontSize: 19, color: 'text.disabled' }} />
                        : <ExpandLessIcon sx={{ fontSize: 19, color: 'text.disabled' }} />}
                      <Typography sx={{
                        fontFamily: theme.campaigner.typography.display,
                        fontWeight: 600,
                        fontSize: '1.5rem',
                        color: eraColorResolved,
                      }}>
                        {group.name}
                      </Typography>
                      <Chip label={`${group.events.length}`} size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.62rem',
                          fontFamily: theme.campaigner.typography.mono,
                          backgroundColor: 'transparent',
                          border: `1px solid ${theme.campaigner.surface.border}`,
                          color: 'text.disabled',
                        }} />
                    </ButtonBase>
                  )}

                  <Collapse in={!collapsed}>
                    {group.events.map((event) => {
                      const isDropTarget = dragOverId === event.id && dragId !== event.id;
                      const globalIdx = events.findIndex(e => e.id === event.id);
                      const noteName = event.linkedNoteId ? notesMap.get(event.linkedNoteId) : null;

                      return (
                        <Box key={event.id}
                          draggable
                          onDragStart={() => handleDragStart(event.id)}
                          onDragOver={e => handleDragOver(e, event.id)}
                          onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                          onDrop={() => handleDrop(event.id)}
                          sx={{
                            position: 'relative',
                            display: 'grid',
                            gridTemplateColumns: { xs: '20px minmax(0, 1fr)', sm: '110px 20px minmax(0, 1fr)' },
                            gap: { xs: 1.25, sm: 2 },
                            opacity: dragId === event.id ? 0.4 : 1,
                            transition: 'opacity 0.15s, background-color 0.15s',
                            borderRadius: '10px',
                            backgroundColor: isDropTarget ? alpha(theme.palette.primary.main, 0.06) : 'transparent',
                            '&:hover .event-actions, &:focus-within .event-actions': { opacity: 1 },
                          }}>
                          <Typography sx={{
                            display: { xs: 'none', sm: 'block' },
                            textAlign: 'right',
                            pt: 2.6,
                            fontFamily: theme.campaigner.typography.mono,
                            fontSize: '0.68rem',
                            letterSpacing: '.08em',
                            textTransform: 'uppercase',
                            color: 'text.disabled',
                          }}>
                            {event.eventDate}
                          </Typography>

                          <Box sx={{
                            width: 1,
                            minHeight: '100%',
                            justifySelf: 'center',
                            position: 'relative',
                            backgroundColor: theme.campaigner.surface.border,
                          }}>
                            <Box sx={{
                              position: 'absolute',
                              top: 27,
                              left: -3,
                              width: 7, height: 7, borderRadius: '50%',
                              backgroundColor: group.name ? eraColorResolved : alpha(theme.palette.primary.main, 0.5),
                              transition: 'transform 0.15s',
                              transform: isDropTarget ? 'scale(1.8)' : 'scale(1)',
                            }} />
                          </Box>

                          <GlassCard interactive={true} sx={{
                            p: '18px 0 22px',
                            border: 0,
                            borderRadius: 0,
                            backgroundColor: 'transparent',
                            boxShadow: 'none',
                          }}>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                              <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                                <Box display="flex" alignItems="center" gap={1.5} mb={0.5} flexWrap="wrap">
                                  <Typography sx={{
                                    display: { xs: 'block', sm: 'none' },
                                    color: group.name ? eraColorResolved : alpha(theme.palette.primary.main, 0.8),
                                    fontFamily: theme.campaigner.typography.mono,
                                    fontWeight: 400, fontSize: '0.68rem', whiteSpace: 'nowrap',
                                    letterSpacing: '.08em',
                                    textTransform: 'uppercase',
                                  }}>
                                    {event.eventDate}
                                  </Typography>
                                  <Typography sx={{ fontWeight: 400, color: 'text.primary', fontSize: '0.94rem' }}>
                                    {event.title}
                                  </Typography>
                                </Box>

                                {event.description && (
                                  <Typography variant="body2" sx={{
                                    color: 'text.secondary', fontSize: '0.8rem', lineHeight: 1.7, mt: 0.75,
                                    overflow: 'hidden', textOverflow: 'ellipsis',
                                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                                  }}>
                                    {event.description}
                                  </Typography>
                                )}

                                {/* Linked note */}
                                {event.linkedNoteId && (
                                  <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                                    <DescriptionIcon sx={{ fontSize: 14, color: alpha(theme.palette.warning.main, 0.7) }} />
                                    <Typography
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/project/${pid}/notes/${event.linkedNoteId}`);
                                      }}
                                      sx={{
                                        fontSize: '0.76rem', color: alpha(theme.palette.warning.main, 0.8),
                                        cursor: 'pointer', textDecoration: 'underline',
                                        textDecorationColor: alpha(theme.palette.warning.main, 0.3),
                                        '&:hover': {
                                          color: theme.palette.warning.main,
                                          textDecorationColor: alpha(theme.palette.warning.main, 0.7),
                                        },
                                      }}>
                                      {noteName || t('timeline:eventCard.noteFallback', { id: event.linkedNoteId })}
                                    </Typography>
                                    <Tooltip title={t('timeline:eventCard.unlinkNote')}>
                                      <IconButton size="small"
                                        onClick={(e) => { e.stopPropagation(); handleUnlinkNote(event.id); }}
                                        aria-label={t('timeline:eventCard.unlinkNote')}
                                        sx={{ color: 'text.disabled', p: 0.3, '&:hover': { color: alpha(theme.palette.error.main, 0.6) } }}>
                                        <LinkOffIcon sx={{ fontSize: 14 }} />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                )}

                                {/* Tags */}
                                {event.tags && event.tags.length > 0 && (
                                  <Box display="flex" gap={0.5} mt={1} flexWrap="wrap">
                                    {event.tags.map((tag) => (
                                      <Chip key={tag.id ?? tag.name} label={tag.name} size="small" sx={{
                                        height: 23, fontSize: '0.68rem', fontWeight: 400,
                                        backgroundColor: tag.color ? alpha(tag.color, 0.1) : alpha(theme.palette.common.white, 0.025),
                                        color: tag.color || theme.palette.text.secondary,
                                        border: `1px solid ${tag.color ? alpha(tag.color, 0.22) : theme.campaigner.surface.border}`,
                                        borderRadius: '20px',
                                      }} />
                                    ))}
                                  </Box>
                                )}
                              </Box>

                              {/* Actions */}
                              <Box className="event-actions" display="flex" alignItems="center" gap={0}
                                sx={{ opacity: { xs: 1, md: 0 }, transition: 'opacity 0.15s', flexShrink: 0, ml: 1 }}>
                                <Tooltip title={t('timeline:eventCard.moveUp')}>
                                  <IconButton size="small" onClick={() => moveEvent(event.id, 'up')}
                                    disabled={globalIdx === 0}
                                    aria-label={t('timeline:eventCard.moveUp')}
                                    sx={{ color: 'text.disabled', '&:hover': { color: 'text.primary' } }}>
                                    <KeyboardArrowUpIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={t('timeline:eventCard.moveDown')}>
                                  <IconButton size="small" onClick={() => moveEvent(event.id, 'down')}
                                    disabled={globalIdx === events.length - 1}
                                    aria-label={t('timeline:eventCard.moveDown')}
                                    sx={{ color: 'text.disabled', '&:hover': { color: 'text.primary' } }}>
                                    <KeyboardArrowDownIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={t('timeline:eventCard.edit')}>
                                  <IconButton size="small" onClick={() => handleOpenEdit(event)}
                                    aria-label={t('timeline:eventCard.edit')}
                                    sx={{ color: 'text.disabled', '&:hover': { color: 'text.primary' } }}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={t('timeline:eventCard.delete')}>
                                  <IconButton size="small" onClick={() => handleDelete(event.id, event.title)}
                                    aria-label={t('timeline:eventCard.delete')}
                                    sx={{ color: alpha(theme.palette.error.main, 0.4), '&:hover': { color: alpha(theme.palette.error.main, 0.8) } }}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={t('timeline:eventCard.drag')}>
                                  <Box sx={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'text.disabled' }} aria-hidden>
                                    <DragIndicatorIcon fontSize="small" />
                                  </Box>
                                </Tooltip>
                              </Box>
                            </Box>
                          </GlassCard>
                        </Box>
                      );
                    })}
                  </Collapse>
                </Box>
              );
            })}
          </Box>
        </>
      ) : null}
      </CatalogColumns>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            border: `1px solid ${theme.campaigner.surface.border}`,
            backgroundColor: theme.palette.background.paper,
            backgroundImage: 'none',
            boxShadow: '0 34px 90px rgba(0,0,0,.7)',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3.5,
            py: 2.5,
            borderBottom: `1px solid ${theme.campaigner.surface.border}`,
            fontFamily: theme.campaigner.typography.display,
            fontSize: '1.65rem',
            fontWeight: 600,
          }}
        >
          <span>{editingEvent ? t('timeline:dialog.editTitle') : t('timeline:dialog.createTitle')}</span>
          <IconButton onClick={() => setDialogOpen(false)} size="small" aria-label={t('common:cancel')}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3.5, pt: '24px !important', pb: 0 }}>
          <Box
            sx={{
              overflow: 'hidden',
              borderRadius: '12px',
              border: `1px solid ${theme.campaigner.surface.border}`,
            }}
          >
            <Box sx={dialogRowSx}>
              <Typography sx={{ fontSize: '0.81rem' }}>{t('timeline:dialog.titleLabel')}</Typography>
              <TextField
                autoFocus
                fullWidth
                variant="standard"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={t('timeline:dialog.titlePlaceholder')}
                InputProps={{ disableUnderline: true }}
                sx={dialogFieldSx}
              />
            </Box>
            <Box sx={dialogRowSx}>
              <Box>
                <Typography sx={{ fontSize: '0.81rem' }}>{t('timeline:dialog.dateLabel')}</Typography>
                <Typography sx={{ color: 'text.disabled', fontSize: '0.68rem', mt: 0.25 }}>
                  {t('timeline:dialog.dateHelper')}
                </Typography>
              </Box>
              <TextField
                fullWidth
                variant="standard"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                placeholder={t('timeline:dialog.datePlaceholder')}
                InputProps={{ disableUnderline: true }}
                sx={dialogFieldSx}
              />
            </Box>
            <Box sx={dialogRowSx}>
              <Typography sx={{ fontSize: '0.81rem' }}>{t('timeline:dialog.eraLabel')}</Typography>
              <Autocomplete
                freeSolo
                options={allEras}
                value={era}
                onChange={(_, val) => {
                  const name = val ?? '';
                  setEra(name);
                  if (name.trim()) {
                    const fromEvent = events.find(
                      (e) => (e.era || '') === name && e.eraColor && String(e.eraColor).trim(),
                    );
                    if (fromEvent?.eraColor) setEraColor(String(fromEvent.eraColor).trim());
                  } else {
                    setEraColor('');
                  }
                }}
                onInputChange={(_, val) => setEra(val || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="standard"
                    placeholder={t('timeline:dialog.eraPlaceholder')}
                    InputProps={{ ...params.InputProps, disableUnderline: true }}
                    sx={dialogFieldSx}
                  />
                )}
                noOptionsText={t('timeline:dialog.eraNoOptions')}
                clearText={t('timeline:dialog.autocompleteClear')}
              />
            </Box>
            <Box sx={dialogRowSx}>
              <Typography sx={{ fontSize: '0.81rem' }}>{t('timeline:dialog.linkNoteLabel')}</Typography>
              <Autocomplete
                options={allNotes}
                getOptionLabel={(opt) => opt.title}
                value={allNotes.find(n => n.id === linkedNoteId) || null}
                onChange={(_, val) => setLinkedNoteId(val ? val.id : null)}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="standard"
                    placeholder={t('timeline:dialog.linkNotePlaceholder')}
                    InputProps={{
                      ...params.InputProps,
                      disableUnderline: true,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <DescriptionIcon sx={{ color: 'primary.main', opacity: 0.5, fontSize: 17 }} />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                    sx={dialogFieldSx}
                  />
                )}
                renderOption={(props, opt) => (
                  <li {...props} key={opt.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <DescriptionIcon sx={{ fontSize: 16, color: 'primary.main', opacity: 0.6 }} />
                      <Typography variant="body2">{opt.title}</Typography>
                    </Box>
                  </li>
                )}
                noOptionsText={t('timeline:dialog.noteNoOptions')}
                clearText={t('timeline:dialog.autocompleteClear')}
              />
            </Box>
            <Box sx={{ ...dialogRowSx, alignItems: 'start' }}>
              <Typography sx={{ fontSize: '0.81rem', pt: 1 }}>{t('timeline:tagField.label')}</Typography>
              <TagAutocompleteField
                options={allTagNames}
                value={tagsStr}
                pendingInput={tagsInput}
                label=""
                placeholder={t('timeline:tagField.placeholder')}
                onValueChange={setTagsStr}
                onPendingInputChange={setTagsInput}
              />
            </Box>
          </Box>

          {era.trim() !== '' ? (
            <Box sx={{ mt: 2.5 }}>
              <Typography sx={{
                color: 'text.disabled',
                fontFamily: theme.campaigner.typography.mono,
                fontSize: '0.62rem',
                letterSpacing: '.12em',
                textTransform: 'uppercase',
                mb: 1.25,
              }}>
                {t('timeline:dialog.eraColorLabel')}
              </Typography>
              <Box display="flex" flexWrap="wrap" alignItems="center" gap={1}>
                {ERA_COLOR_HEX_PRESETS.map((hex) => (
                  <Box
                    key={hex}
                    component="button"
                    type="button"
                    onClick={() => setEraColor(hex)}
                    aria-label={hex}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '7px',
                      bgcolor: hex,
                      border: eraColor === hex
                        ? `2px solid ${theme.palette.text.primary}`
                        : `1px solid ${theme.campaigner.surface.border}`,
                      cursor: 'pointer',
                      p: 0,
                    }}
                  />
                ))}
                <TextField
                  type="color"
                  value={/^#[0-9A-Fa-f]{6}$/i.test(eraColor) ? eraColor : FALLBACK_ERA_HEX}
                  onChange={(e) => setEraColor(e.target.value)}
                  size="small"
                  sx={{ width: 62, '& input': { height: 28, p: 0, cursor: 'pointer' } }}
                  inputProps={{ 'aria-label': t('timeline:dialog.eraColorPickerAria') }}
                />
              </Box>
              <Typography sx={{ color: 'text.disabled', fontSize: '0.68rem', mt: 0.75 }}>
                {t('timeline:dialog.eraColorHelper')}
              </Typography>
            </Box>
          ) : null}

          {linkedNoteId ? (
            <Box display="flex" alignItems="center" gap={1} mt={2}>
              <DescriptionIcon sx={{ fontSize: 14, color: 'primary.main' }} />
              <Typography variant="caption" sx={{ color: 'primary.main' }}>
                {t('timeline:dialog.linkedPrefix')}{' '}
                {notesMap.get(linkedNoteId) || `#${linkedNoteId}`}
              </Typography>
            </Box>
          ) : null}

          <TextField
            fullWidth
            label={t('timeline:dialog.descriptionLabel')}
            value={description}
            onChange={e => setDescription(e.target.value)}
            multiline
            rows={4}
            placeholder={t('timeline:dialog.descriptionPlaceholder')}
            sx={{ mt: 2.5 }}
          />
          <Typography sx={{ color: 'text.disabled', fontSize: '0.68rem', mt: 1 }}>
            {t('timeline:tagField.helperText')}
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3.5,
            py: 2.25,
            mt: 2,
            borderTop: `1px solid ${theme.campaigner.surface.border}`,
          }}
        >
          <Button onClick={() => setDialogOpen(false)} color="inherit">{t('common:cancel')}</Button>
          <DndButton variant="contained" onClick={handleSave} disabled={!title.trim() || !eventDate.trim()}>
            {editingEvent ? t('common:save') : t('common:create')}
          </DndButton>
        </DialogActions>
      </Dialog>
    </CampaignerPage>
  );
};