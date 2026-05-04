import React, { useEffect, useState } from 'react';
import {
  Box, Typography, TextField, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Chip, Select, MenuItem, FormControl,
  InputAdornment, Collapse, Tooltip, InputLabel,
  Autocomplete, useTheme, alpha,
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
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTimelineStore } from '@/store/useTimelineStore';
import { useUIStore } from '@/store/useUIStore';
import { tagsApi } from '@/api/tags';
import { notesApi } from '@/api/notes';
import { DndButton } from '@/components/ui/DndButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassCard } from '@/components/ui/GlassCard';
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

interface NoteOption {
  id: number;
  title: string;
}

export const TimelinePage: React.FC = () => {
  const { t } = useTranslation(['timeline', 'common']);
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const navigate = useNavigate();
  const {
    events, loading, fetchEvents, createEvent, updateEvent,
    deleteEvent, reorderEvents,
  } = useTimelineStore();
  const { showSnackbar, showConfirmDialog } = useUIStore();
  const theme = useTheme();
  const eraColors = useEraColors();

  // Dialog form
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [era, setEra] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [existingTagNames, setExistingTagNames] = useState<string[]>([]);
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
    // Load notes for linking
    notesApi.getAll(pid, { limit: 500 }).then(res => {
      const items = res.data.data.items || res.data.data || [];
      const opts: NoteOption[] = items.map((n: any) => ({ id: n.id, title: n.title }));
      setAllNotes(opts);
      const m = new Map<number, string>();
      opts.forEach(n => m.set(n.id, n.title));
      setNotesMap(m);
    }).catch(() => {});

    tagsApi.getAll(pid).then((res) => {
      const tags = res.data.data || [];
      setExistingTagNames(tags.map((tag: { name: string }) => tag.name));
    }).catch(() => {
      setExistingTagNames([]);
    });
  }, [pid, fetchEvents]);

  // Eras list
  const allEras = [...new Set(events.map(e => e.era || ''))].filter(Boolean);

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

  const resetForm = () => {
    setTitle(''); setDescription(''); setEventDate('');
    setEra(''); setTagsStr(''); setTagsInput(''); setLinkedNoteId(null); setEditingEvent(null);
  };

  const handleOpenCreate = () => { resetForm(); setDialogOpen(true); };

  const handleOpenEdit = (event: TimelineEvent) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description || '');
    setEventDate(event.eventDate);
    setEra(event.era || '');
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
      await useTimelineStore.getState().setTags(eventId, []);
      return;
    }
    const existingRes = await tagsApi.getAll(pid);
    const existingTags: any[] = existingRes.data.data || [];
    const tagIds: number[] = [];
    for (const name of tagNames) {
      const existing = existingTags.find((tag: { name: string }) => tag.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        tagIds.push(existing.id);
      } else {
        const newRes = await tagsApi.create({ name, projectId: pid });
        tagIds.push(newRes.data.data.id);
      }
    }
    await useTimelineStore.getState().setTags(eventId, tagIds);
  };

  const handleSave = async () => {
    if (!title.trim() || !eventDate.trim()) return;
    const finalTags = mergeTagValues(tagsStr, tagsInput);
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, {
          title, description, eventDate, era, linkedNoteId,
        });
        if (finalTags !== (editingEvent.tags || []).map((tag) => tag.name).join(', ')) {
          await saveTags(editingEvent.id, finalTags);
        }
        showSnackbar(t('timeline:snackbar.eventUpdated', { title: title.trim() }), 'success');
      } else {
        const created = await createEvent({
          projectId: pid, title, description, eventDate, era,
          sortOrder: 0, linkedNoteId,
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

  if (loading && events.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>{t('common:loading')}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '1.8rem', color: '#fff' }}>
          {t('timeline:page.title')}
        </Typography>
        <DndButton variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          {t('timeline:page.addEvent')}
        </DndButton>
      </Box>

      {events.length === 0 ? (
        <EmptyState
          icon={<TimelineIcon sx={{ fontSize: 64 }} />}
          title={t('timeline:empty.title')}
          description={t('timeline:empty.description')}
          actionLabel={t('timeline:empty.action')}
          onAction={handleOpenCreate}
        />
      ) : (
        <>
          {/* Filters */}
          <Box display="flex" gap={2} mb={3} alignItems="center" flexWrap="wrap">
            <TextField
              placeholder={t('timeline:filters.searchPlaceholder')}
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

            {allEras.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <Select value={filterEra} onChange={e => setFilterEra(e.target.value)} displayEmpty
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
                    color: '#fff',
                  }}>
                  <MenuItem value="">{t('timeline:filters.allEras')}</MenuItem>
                  {allEras.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                </Select>
              </FormControl>
            )}

            {(search || filterEra) && (
              <Button variant="outlined" onClick={() => { setSearch(''); setFilterEra(''); }}
                size="small" sx={{ borderColor: 'rgba(130,130,255,0.4)', color: 'rgba(130,130,255,0.9)', textTransform: 'none' }}>
                {t('common:reset')}
              </Button>
            )}

            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
              {t('timeline:filters.countShown', { filtered: filtered.length, total: events.length })}
            </Typography>
          </Box>

          {/* Timeline */}
          <Box sx={{ position: 'relative', pl: 4 }}>
            {/* Vertical line */}
            <Box sx={{
              position: 'absolute', left: 15, top: 0, bottom: 0, width: 2,
              background: `linear-gradient(to bottom, ${alpha(theme.palette.primary.main, 0.4)}, ${alpha(theme.palette.primary.main, 0.1)})`,
            }} />

            {groupedEras.map((group, gi) => {
              const eraColor = eraColors[gi % eraColors.length];
              const eraKey = group.name || '__none__';
              const collapsed = collapsedEras.has(eraKey);

              return (
                <Box key={eraKey} sx={{ mb: 3 }}>
                  {/* Era header */}
                  {group.name && (
                    <Box onClick={() => toggleEra(eraKey)}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
                        ml: -4, mb: 1.5, position: 'relative',
                      }}>
                      <Box sx={{
                        width: 32, height: 32, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: eraColor, flexShrink: 0, zIndex: 1,
                        border: `3px solid ${theme.palette.background.default}`,
                      }}>
                        {collapsed
                          ? <ExpandMoreIcon sx={{ fontSize: 18, color: '#fff' }} />
                          : <ExpandLessIcon sx={{ fontSize: 18, color: '#fff' }} />}
                      </Box>
                      <Typography sx={{
                        fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '1.2rem',
                        color: eraColor,
                      }}>
                        {group.name}
                      </Typography>
                      <Chip label={`${group.events.length}`} size="small"
                        sx={{ height: 20, fontSize: '0.7rem', backgroundColor: alpha(theme.palette.common.white, 0.06), color: 'text.secondary' }} />
                    </Box>
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
                            position: 'relative', mb: 1.5, ml: -4,
                            display: 'flex', alignItems: 'flex-start', gap: 0,
                            opacity: dragId === event.id ? 0.4 : 1,
                            transition: 'opacity 0.15s',
                          }}>
                          {/* Dot */}
                          <Box sx={{
                            width: 32, minHeight: 32, display: 'flex', alignItems: 'flex-start',
                            justifyContent: 'center', pt: '12px', flexShrink: 0, zIndex: 1,
                          }}>
                            <Box sx={{
                              width: 12, height: 12, borderRadius: '50%',
                              backgroundColor: group.name ? eraColor : alpha(theme.palette.primary.main, 0.5),
                              border: `2px solid ${theme.palette.background.default}`,
                              transition: 'transform 0.15s',
                              transform: isDropTarget ? 'scale(1.8)' : 'scale(1)',
                            }} />
                          </Box>

                          {/* Card */}
                          <GlassCard interactive={true} sx={{
                            flexGrow: 1, p: 2, ml: 1,
                            backgroundColor: isDropTarget ? alpha(theme.palette.primary.main, 0.08) : undefined,
                            borderColor: isDropTarget ? alpha(theme.palette.primary.main, 0.4) : undefined,
                            '&:hover': {
                              '& .event-actions': { opacity: 1 },
                            },
                          }}>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                              <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                                <Box display="flex" alignItems="center" gap={1.5} mb={0.5} flexWrap="wrap">
                                  <Typography sx={{
                                    color: group.name ? eraColor : alpha(theme.palette.primary.main, 0.8),
                                    fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap',
                                  }}>
                                    {event.eventDate}
                                  </Typography>
                                  <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1rem' }}>
                                    {event.title}
                                  </Typography>
                                </Box>

                                {event.description && (
                                  <Typography variant="body2" sx={{
                                    color: 'text.secondary', fontSize: '0.85rem', mt: 0.5,
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
                                        fontSize: '0.8rem', color: alpha(theme.palette.warning.main, 0.8),
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
                                        height: 20, fontSize: '0.65rem', fontWeight: 600,
                                        backgroundColor: tag.color || alpha(theme.palette.primary.main, 0.2),
                                        color: theme.palette.text.primary, borderRadius: 1,
                                      }} />
                                    ))}
                                  </Box>
                                )}
                              </Box>

                              {/* Actions */}
                              <Box className="event-actions" display="flex" alignItems="center" gap={0}
                                sx={{ opacity: 0, transition: 'opacity 0.15s', flexShrink: 0, ml: 1 }}>
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
      )}

      {/* Event Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}>
        <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>
          {editingEvent ? t('timeline:dialog.editTitle') : t('timeline:dialog.createTitle')}
        </DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth label={t('timeline:dialog.titleLabel')} value={title}
            onChange={e => setTitle(e.target.value)} margin="normal"
            placeholder={t('timeline:dialog.titlePlaceholder')} />

          <TextField fullWidth label={t('timeline:dialog.dateLabel')} value={eventDate}
            onChange={e => setEventDate(e.target.value)} margin="normal"
            placeholder={t('timeline:dialog.datePlaceholder')}
            helperText={t('timeline:dialog.dateHelper')} />

          <Autocomplete
            freeSolo
            options={allEras}
            value={era}
            onChange={(_, val) => setEra(val || '')}
            onInputChange={(_, val) => setEra(val || '')}
            renderInput={(params) => (
              <TextField {...params} label={t('timeline:dialog.eraLabel')} margin="normal"
                placeholder={t('timeline:dialog.eraPlaceholder')}
                helperText={t('timeline:dialog.eraHelper')} />
            )}
            noOptionsText={t('timeline:dialog.eraNoOptions')}
            clearText={t('timeline:dialog.autocompleteClear')}
            sx={{
              '& .MuiAutocomplete-clearIndicator': { color: 'rgba(255,255,255,0.3)' },
              '& .MuiAutocomplete-popupIndicator': { color: 'rgba(255,255,255,0.3)' },
            }}
          />

          <TextField fullWidth label={t('timeline:dialog.descriptionLabel')} value={description}
            onChange={e => setDescription(e.target.value)} margin="normal"
            multiline rows={4} placeholder={t('timeline:dialog.descriptionPlaceholder')} />

          {/* Linked Note */}
          <Autocomplete
            options={allNotes}
            getOptionLabel={(opt) => opt.title}
            value={allNotes.find(n => n.id === linkedNoteId) || null}
            onChange={(_, val) => setLinkedNoteId(val ? val.id : null)}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            renderInput={(params) => (
              <TextField {...params} label={t('timeline:dialog.linkNoteLabel')} margin="normal"
                placeholder={t('timeline:dialog.linkNotePlaceholder')}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <DescriptionIcon sx={{ color: 'rgba(201,169,89,0.5)', fontSize: 18 }} />
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, opt) => (
              <li {...props} key={opt.id}>
                <Box display="flex" alignItems="center" gap={1}>
                  <DescriptionIcon sx={{ fontSize: 16, color: 'rgba(201,169,89,0.6)' }} />
                  <Typography variant="body2">{opt.title}</Typography>
                </Box>
              </li>
            )}
            noOptionsText={t('timeline:dialog.noteNoOptions')}
            clearText={t('timeline:dialog.autocompleteClear')}
            sx={{
              '& .MuiAutocomplete-clearIndicator': { color: 'rgba(255,255,255,0.3)' },
              '& .MuiAutocomplete-popupIndicator': { color: 'rgba(255,255,255,0.3)' },
            }}
          />

          {linkedNoteId && (
            <Box display="flex" alignItems="center" gap={1} mt={0.5} ml={1}>
              <DescriptionIcon sx={{ fontSize: 14, color: 'rgba(78,205,196,0.7)' }} />
              <Typography variant="caption" sx={{ color: 'rgba(78,205,196,0.7)' }}>
                {t('timeline:dialog.linkedPrefix')}{' '}
                {notesMap.get(linkedNoteId) || `#${linkedNoteId}`}
              </Typography>
            </Box>
          )}

          <TagAutocompleteField
            options={existingTagNames}
            value={tagsStr}
            pendingInput={tagsInput}
            label={t('timeline:tagField.label')}
            placeholder={t('timeline:tagField.placeholder')}
            helperText={t('timeline:tagField.helperText')}
            margin="normal"
            onValueChange={setTagsStr}
            onPendingInputChange={setTagsInput}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">{t('common:cancel')}</Button>
          <DndButton variant="contained" onClick={handleSave} disabled={!title.trim() || !eventDate.trim()}>
            {editingEvent ? t('common:save') : t('common:create')}
          </DndButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};