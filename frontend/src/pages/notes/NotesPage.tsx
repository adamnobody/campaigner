import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, TextField,
  InputAdornment, Tabs, Tab, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, FormControl, InputLabel, Select, MenuItem,
  Autocomplete, Tooltip, useTheme, alpha,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PushPinIcon from '@mui/icons-material/PushPin';
import DescriptionIcon from '@mui/icons-material/Description';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNoteStore } from '@/store/useNoteStore';
import { useUIStore } from '@/store/useUIStore';
import { useBranchStore } from '@/store/useBranchStore';
import { useDebounce } from '@/hooks/useDebounce';
import { DndButton } from '@/components/ui/DndButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { GlassCard } from '@/components/ui/GlassCard';
import { tagsApi } from '@/api/tags';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ALLOWED_NOTE_FORMATS } from '@campaigner/shared';
import type { Note } from '@campaigner/shared';

export const NotesPage: React.FC = () => {
  const { t, i18n } = useTranslation(['notes', 'common']);
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const navigate = useNavigate();
  const theme = useTheme();
  const { notes, total, loading, fetchNotes, createNote, deleteNote, setTags } = useNoteStore();
  const { showSnackbar, showConfirmDialog } = useUIStore();

  const activeBranchId = useBranchStore((s) => s.activeBranchId);

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newFormat, setNewFormat] = useState<'md' | 'txt'>('md');
  const [newTagValues, setNewTagValues] = useState<string[]>([]);
  const debouncedSearch = useDebounce(search, 300);

  // Tags
  const [allTags, setAllTags] = useState<{ id: number; name: string; color: string }[]>([]);
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [tagsEditNote, setTagsEditNote] = useState<Note | null>(null);
  const [editTagValues, setEditTagValues] = useState<string[]>([]);

  const noteTypes = ['all', 'note', 'wiki', 'marker_note'];

  useEffect(() => {
    const noteType = tab === 0 ? undefined : noteTypes[tab];
    fetchNotes(pid, { search: debouncedSearch || undefined, noteType });
  }, [pid, fetchNotes, debouncedSearch, tab, activeBranchId]);

  useEffect(() => {
    tagsApi.getAll(pid).then(res => {
      setAllTags(res.data.data || []);
    }).catch(() => {});
  }, [pid]);

  const allTagNames = allTags.map(tag => tag.name);

  // ============ Resolve tag names → ids ============
  const resolveTagIds = async (tagNames: string[]): Promise<number[]> => {
    if (tagNames.length === 0) return [];
    const tagIds: number[] = [];
    for (const name of tagNames) {
      const existing = allTags.find(tag => tag.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        tagIds.push(existing.id);
      } else {
        const res = await tagsApi.create({ name, projectId: pid });
        const newTag = res.data.data;
        tagIds.push(newTag.id);
        setAllTags(prev => [...prev, newTag]);
      }
    }
    return tagIds;
  };

  // ============ Create ============
  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      const note = await createNote({
        projectId: pid,
        title: newTitle.trim(),
        content: '',
        format: newFormat,
        noteType: 'note',
        isPinned: false,
      });

      if (newTagValues.length > 0) {
        const tagIds = await resolveTagIds(newTagValues);
        if (tagIds.length > 0) await setTags(note.id, tagIds);
      }

      setCreateOpen(false);
      setNewTitle('');
      setNewTagValues([]);
      showSnackbar(t('notes:snackbar.created', { title: newTitle.trim() }), 'success');
      navigate(`/project/${pid}/notes/${note.id}`);
    } catch {
      showSnackbar(t('notes:snackbar.createError'), 'error');
    }
  };

  // ============ Delete ============
  const handleDelete = (id: number, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirmDialog(
      t('notes:confirm.deleteNoteTitle'),
      t('notes:confirm.deleteNoteMessage', { title }),
      async () => {
      try {
        await deleteNote(id);
        showSnackbar(t('notes:snackbar.deleted'), 'success');
      } catch {
        showSnackbar(t('notes:snackbar.deleteError'), 'error');
      }
    });
  };

  // ============ Edit tags ============
  const handleOpenTagsEdit = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    setTagsEditNote(note);
    setEditTagValues((note.tags || []).map((tag: { name: string }) => tag.name));
    setTagsDialogOpen(true);
  };

  const handleSaveTags = async () => {
    if (!tagsEditNote) return;
    try {
      const tagIds = await resolveTagIds(editTagValues);
      await setTags(tagsEditNote.id, tagIds);
      setTagsDialogOpen(false);
      setTagsEditNote(null);
      showSnackbar(t('notes:snackbar.tagsUpdated'), 'success');
    } catch {
      showSnackbar(t('notes:snackbar.deleteError'), 'error');
    }
  };

  const hasFilters = Boolean(debouncedSearch || tab !== 0);

  if (loading && notes.length === 0) return <LoadingScreen />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '1.8rem', color: 'text.primary' }}>
            {t('notes:list.title')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {t('notes:list.subtitle')}
          </Typography>
        </Box>
        <DndButton variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          {t('notes:list.newNote')}
        </DndButton>
      </Box>

      {/* Filters */}
      {(total > 0 || hasFilters) && (
        <GlassCard sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            placeholder={t('notes:list.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment>,
            }}
            size="small"
          />

          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
            <Tab label={t('notes:list.tabAll', { count: total })} />
            <Tab label={t('notes:list.tabNotes')} />
            <Tab label={t('notes:list.tabWiki')} />
            <Tab label={t('notes:list.tabMarkers')} />
          </Tabs>
        </GlassCard>
      )}

      {/* Content */}
      {notes.length === 0 && !loading ? (
        hasFilters ? (
          <EmptyState
            icon={<SearchIcon sx={{ fontSize: 64 }} />}
            title={t('notes:list.emptyFilteredTitle')}
            description={t('notes:list.emptyFilteredDescription')}
            actionLabel={t('notes:list.emptyFilteredAction')}
            onAction={() => { setSearch(''); setTab(0); }}
          />
        ) : (
          <EmptyState
            icon={<DescriptionIcon sx={{ fontSize: 64 }} />}
            title={t('notes:list.emptyNoNotesTitle')}
            description={t('notes:list.emptyNoNotesDescription')}
            actionLabel={t('notes:list.emptyNoNotesAction')}
            onAction={() => setCreateOpen(true)}
          />
        )
      ) : (
        <Grid container spacing={2}>
          {notes.map(note => (
            <Grid item xs={12} md={6} key={note.id}>
              <GlassCard
                interactive
                onClick={() => navigate(`/project/${pid}/notes/${note.id}`)}
                sx={{
                  height: '100%',
                  p: 2.5,
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    '& .card-actions': { opacity: 1 },
                  },
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 0, flex: 1 }}>
                    {note.isPinned && <PushPinIcon fontSize="small" color="primary" />}
                    <Typography variant="h6" noWrap sx={{ fontFamily: '"Cinzel", serif', fontWeight: 600, color: 'text.primary' }}>
                      {note.title}
                    </Typography>
                  </Box>
                  <Box className="card-actions" display="flex" gap={0} sx={{ opacity: 0, transition: 'opacity 0.15s' }}>
                    <Tooltip title={t('notes:list.tooltipEditTags')}>
                      <IconButton size="small" onClick={(e) => handleOpenTagsEdit(note, e)}
                        sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
                        <LocalOfferIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('notes:list.tooltipDelete')}>
                      <IconButton size="small" onClick={(e) => handleDelete(note.id, note.title, e)}
                        sx={{ color: theme.palette.error.main, '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) } }}>
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {note.content && (
                  <Box sx={{
                    mt: 1,
                    maxHeight: '7em',
                    overflow: 'hidden',
                    position: 'relative',
                    flexGrow: 1,
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0, left: 0, right: 0,
                      height: '2em',
                      background: `linear-gradient(transparent, ${theme.palette.background.paper})`,
                      pointerEvents: 'none',
                    },
                    '& h1, & h2, & h3': { fontFamily: '"Cinzel", serif', color: 'text.primary', fontSize: '1rem', fontWeight: 700, my: 0.5 },
                    '& p': { fontSize: '0.85rem', color: 'text.secondary', my: 0.3, lineHeight: 1.5 },
                    '& ul, & ol': { pl: 2.5, my: 0.3 },
                    '& li': { fontSize: '0.85rem', color: 'text.secondary', lineHeight: 1.5 },
                    '& strong': { color: 'text.primary' },
                    '& em': { color: 'text.secondary', fontStyle: 'italic' },
                    '& a': { color: theme.palette.primary.main },
                    '& code': { backgroundColor: alpha(theme.palette.text.primary, 0.1), px: 0.5, borderRadius: 0.5, fontSize: '0.8rem', color: 'text.primary' },
                    '& pre': { backgroundColor: alpha(theme.palette.background.default, 0.5), p: 1, borderRadius: 1, fontSize: '0.8rem', overflow: 'hidden' },
                    '& blockquote': { borderLeft: '2px solid', borderColor: theme.palette.primary.main, pl: 1, ml: 0, opacity: 0.8, color: 'text.secondary' },
                    '& hr': { border: 'none', borderTop: `1px solid ${theme.palette.divider}`, my: 0.5 },
                    '& img': { display: 'none' },
                  }}>
                    {note.format === 'md' ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, fontSize: '0.85rem' }}>
                        {note.content}
                      </Typography>
                    )}
                  </Box>
                )}

                <Box mt="auto" pt={1.5}>
                  {/* Tags */}
                  <Box display="flex" gap={0.5} flexWrap="wrap" alignItems="center">
                    <Chip label={note.format.toUpperCase()} size="small" variant="outlined"
                      sx={{ height: 22, fontSize: '0.65rem', color: 'text.secondary', borderColor: theme.palette.divider }} />
                    <Chip label={t(`notes:noteTypes.${note.noteType}`, { defaultValue: note.noteType })} size="small" color="primary" variant="outlined"
                      sx={{ height: 22, fontSize: '0.65rem' }} />
                    {note.tags?.map((tag) => (
                      <Chip key={tag.id ?? tag.name} label={tag.name} size="small"
                        sx={{ height: 22, fontSize: '0.65rem', fontWeight: 600, backgroundColor: tag.color ? alpha(tag.color, 0.15) : alpha(theme.palette.primary.main, 0.15), color: tag.color || theme.palette.primary.main, borderRadius: 1 }} />
                    ))}
                  </Box>

                  {/* No tags hint */}
                  {(!note.tags || note.tags.length === 0) && (
                    <Box
                      display="flex" alignItems="center" gap={0.5} mt={1}
                      onClick={(e) => handleOpenTagsEdit(note, e)}
                      sx={{ cursor: 'pointer', '&:hover': { '& .add-tag-text': { color: 'text.primary' } } }}
                    >
                      <LocalOfferIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography className="add-tag-text" variant="caption"
                        sx={{ color: 'text.secondary', transition: 'color 0.15s' }}>
                        {t('notes:list.addTagsHint')}
                      </Typography>
                    </Box>
                  )}

                  <Typography variant="caption" sx={{ color: 'text.disabled', mt: 1, display: 'block' }}>
                    {new Date(note.updatedAt).toLocaleDateString(i18n.language)}
                  </Typography>
                </Box>
              </GlassCard>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ============ Create Dialog ============ */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: theme.palette.background.paper, backgroundImage: 'none' } }}>
        <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>{t('notes:dialogs.createTitle')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth label={t('notes:dialogs.createFieldTitle')} value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)} margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>{t('notes:dialogs.createFieldFormat')}</InputLabel>
            <Select value={newFormat} label={t('notes:dialogs.createFieldFormat')} onChange={(e) => setNewFormat(e.target.value as 'md' | 'txt')}>
              {ALLOWED_NOTE_FORMATS.map(f => (
                <MenuItem key={f} value={f}>{f.toUpperCase()}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Autocomplete
            multiple freeSolo
            options={allTagNames}
            value={newTagValues}
            onChange={(_, vals) => setNewTagValues(vals)}
            renderTags={(value, getTagProps) =>
              value.map((opt, index) => (
                <Chip {...getTagProps({ index })} key={opt} label={opt} size="small"
                  sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.15), color: theme.palette.primary.main, fontSize: '0.75rem' }} />
              ))
            }
            renderInput={(params) => (
              <TextField {...params} label={t('notes:tagField.label')} margin="normal" placeholder={t('notes:tagField.placeholder')}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <LocalOfferIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
              />
            )}
            noOptionsText={t('notes:dialogs.newTagHint')}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setCreateOpen(false); setNewTitle(''); setNewTagValues([]); }} color="inherit">
            {t('common:cancel')}
          </Button>
          <DndButton variant="contained" onClick={handleCreate} disabled={!newTitle.trim()}>
            {t('common:create')}
          </DndButton>
        </DialogActions>
      </Dialog>

      {/* ============ Edit Tags Dialog ============ */}
      <Dialog open={tagsDialogOpen} onClose={() => setTagsDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: theme.palette.background.paper, backgroundImage: 'none' } }}>
        <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>
          {tagsEditNote ? t('notes:dialogs.tagsDialogTitle', { title: tagsEditNote.title }) : ''}
        </DialogTitle>
        <DialogContent>
          <Autocomplete
            multiple freeSolo
            options={allTagNames}
            value={editTagValues}
            onChange={(_, vals) => setEditTagValues(vals)}
            renderTags={(value, getTagProps) =>
              value.map((opt, index) => (
                <Chip {...getTagProps({ index })} key={opt} label={opt} size="small"
                  sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.15), color: theme.palette.primary.main, fontSize: '0.75rem' }} />
              ))
            }
            renderInput={(params) => (
              <TextField {...params} label={t('notes:tagField.label')} margin="normal" placeholder={t('notes:tagField.placeholder')}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <LocalOfferIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
              />
            )}
            noOptionsText={t('notes:dialogs.newTagHint')}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTagsDialogOpen(false)} color="inherit">{t('common:cancel')}</Button>
          <DndButton variant="contained" onClick={handleSaveTags}>
            {t('common:save')}
          </DndButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
