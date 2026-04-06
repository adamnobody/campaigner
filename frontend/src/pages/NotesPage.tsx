import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, TextField,
  InputAdornment, Tabs, Tab, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, FormControl, InputLabel, Select, MenuItem,
  Autocomplete, Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PushPinIcon from '@mui/icons-material/PushPin';
import DescriptionIcon from '@mui/icons-material/Description';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { useParams, useNavigate } from 'react-router-dom';
import { useNoteStore } from '@/store/useNoteStore';
import { useUIStore } from '@/store/useUIStore';
import { useDebounce } from '@/hooks/useDebounce';
import { DndButton } from '@/components/ui/DndButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { tagsApi } from '@/api/tags';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ALLOWED_NOTE_FORMATS } from '@campaigner/shared';
import type { Note } from '@campaigner/shared';

export const NotesPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const navigate = useNavigate();
  const { notes, total, loading, fetchNotes, createNote, deleteNote, setTags } = useNoteStore();
  const { showSnackbar, showConfirmDialog } = useUIStore();

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
  }, [pid, fetchNotes, debouncedSearch, tab]);

  useEffect(() => {
    tagsApi.getAll(pid).then(res => {
      setAllTags(res.data.data || []);
    }).catch(() => {});
  }, [pid]);

  const allTagNames = allTags.map(t => t.name);

  // ============ Resolve tag names → ids ============
  const resolveTagIds = async (tagNames: string[]): Promise<number[]> => {
    if (tagNames.length === 0) return [];
    const tagIds: number[] = [];
    for (const name of tagNames) {
      const existing = allTags.find(t => t.name.toLowerCase() === name.toLowerCase());
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
      showSnackbar('Заметка создана', 'success');
      navigate(`/project/${pid}/notes/${note.id}`);
    } catch {
      showSnackbar('Ошибка создания', 'error');
    }
  };

  // ============ Delete ============
  const handleDelete = (id: number, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirmDialog('Удалить заметку', `Удалить "${title}"?`, async () => {
      try {
        await deleteNote(id);
        showSnackbar('Удалено', 'success');
      } catch {
        showSnackbar('Ошибка', 'error');
      }
    });
  };

  // ============ Edit tags ============
  const handleOpenTagsEdit = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    setTagsEditNote(note);
    setEditTagValues((note.tags || []).map((t: any) => t.name));
    setTagsDialogOpen(true);
  };

  const handleSaveTags = async () => {
    if (!tagsEditNote) return;
    try {
      const tagIds = await resolveTagIds(editTagValues);
      await setTags(tagsEditNote.id, tagIds);
      setTagsDialogOpen(false);
      setTagsEditNote(null);
      showSnackbar('Теги обновлены', 'success');
    } catch {
      showSnackbar('Ошибка', 'error');
    }
  };

  if (loading && notes.length === 0) return <LoadingScreen />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '1.8rem', color: '#fff' }}>
          Заметки
        </Typography>
        <DndButton variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          Новая заметка
        </DndButton>
      </Box>

      <TextField
        fullWidth
        placeholder="Поиск заметок..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
        }}
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label={`Все (${total})`} />
        <Tab label="Заметки" />
        <Tab label="Вики" />
        <Tab label="Маркеры" />
      </Tabs>

      {notes.length === 0 ? (
        <EmptyState
          icon={<DescriptionIcon sx={{ fontSize: 64 }} />}
          title="Заметок пока нет"
          description="Создавайте заметки, вики-статьи и документацию для вашего мира"
          actionLabel="Создать заметку"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <Grid container spacing={2}>
          {notes.map(note => (
            <Grid item xs={12} md={6} key={note.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  height: '100%',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    backgroundColor: 'rgba(255,255,255,0.07)',
                    borderColor: 'rgba(255,255,255,0.15)',
                    '& .card-actions': { opacity: 1 },
                  },
                }}
                onClick={() => navigate(`/project/${pid}/notes/${note.id}`)}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 0, flex: 1 }}>
                      {note.isPinned && <PushPinIcon fontSize="small" color="primary" />}
                      <Typography variant="h6" noWrap sx={{ fontFamily: '"Cinzel", serif', fontWeight: 600 }}>
                        {note.title}
                      </Typography>
                    </Box>
                    <Box className="card-actions" display="flex" gap={0} sx={{ opacity: 0, transition: 'opacity 0.15s' }}>
                      <Tooltip title="Редактировать теги">
                        <IconButton size="small" onClick={(e) => handleOpenTagsEdit(note, e)}
                          sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: 'rgba(201,169,89,0.8)' } }}>
                          <LocalOfferIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Удалить">
                        <IconButton size="small" onClick={(e) => handleDelete(note.id, note.title, e)}
                          sx={{ color: 'rgba(255,100,100,0.4)', '&:hover': { color: 'rgba(255,100,100,0.8)' } }}>
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
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0, left: 0, right: 0,
                        height: '2em',
                        background: 'linear-gradient(transparent, rgba(20,20,35,0.95))',
                        pointerEvents: 'none',
                      },
                      '& h1, & h2, & h3': { fontFamily: '"Cinzel", serif', color: 'primary.main', fontSize: '1rem', fontWeight: 700, my: 0.5 },
                      '& p': { fontSize: '0.85rem', color: 'text.secondary', my: 0.3, lineHeight: 1.5 },
                      '& ul, & ol': { pl: 2.5, my: 0.3 },
                      '& li': { fontSize: '0.85rem', color: 'text.secondary', lineHeight: 1.5 },
                      '& strong': { color: '#fff' },
                      '& em': { color: 'rgba(255,255,255,0.8)' },
                      '& a': { color: '#4ECDC4' },
                      '& code': { backgroundColor: 'rgba(201,169,89,0.1)', px: 0.5, borderRadius: 0.5, fontSize: '0.8rem' },
                      '& pre': { backgroundColor: 'rgba(0,0,0,0.3)', p: 1, borderRadius: 1, fontSize: '0.8rem', overflow: 'hidden' },
                      '& blockquote': { borderLeft: '2px solid', borderColor: 'primary.main', pl: 1, ml: 0, opacity: 0.8 },
                      '& hr': { border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', my: 0.5 },
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

                  {/* Tags */}
                  <Box display="flex" gap={0.5} mt={1.5} flexWrap="wrap" alignItems="center">
                    <Chip label={note.format.toUpperCase()} size="small" variant="outlined"
                      sx={{ height: 22, fontSize: '0.65rem' }} />
                    <Chip label={note.noteType} size="small" color="primary" variant="outlined"
                      sx={{ height: 22, fontSize: '0.65rem' }} />
                    {note.tags?.map((tag: any) => (
                      <Chip key={tag.id} label={tag.name} size="small"
                        sx={{ height: 22, fontSize: '0.65rem', fontWeight: 600, backgroundColor: tag.color || 'rgba(130,130,255,0.2)', color: '#fff', borderRadius: 1 }} />
                    ))}
                  </Box>

                  {/* No tags hint */}
                  {(!note.tags || note.tags.length === 0) && (
                    <Box
                      display="flex" alignItems="center" gap={0.5} mt={1}
                      onClick={(e) => handleOpenTagsEdit(note, e)}
                      sx={{ cursor: 'pointer', '&:hover': { '& .add-tag-text': { color: 'rgba(201,169,89,0.8)' } } }}
                    >
                      <LocalOfferIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.2)' }} />
                      <Typography className="add-tag-text" variant="caption"
                        sx={{ color: 'rgba(255,255,255,0.2)', transition: 'color 0.15s' }}>
                        + добавить теги
                      </Typography>
                    </Box>
                  )}

                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.25)', mt: 1, display: 'block' }}>
                    {new Date(note.updatedAt).toLocaleDateString('ru-RU')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ============ Create Dialog ============ */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}>
        <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>Новая заметка</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth label="Название *" value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)} margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Формат</InputLabel>
            <Select value={newFormat} label="Формат" onChange={(e) => setNewFormat(e.target.value as 'md' | 'txt')}>
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
                  sx={{ backgroundColor: 'rgba(130,130,255,0.2)', color: '#fff', fontSize: '0.75rem' }} />
              ))
            }
            renderInput={(params) => (
              <TextField {...params} label="Теги" margin="normal" placeholder="Выберите или введите..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <LocalOfferIcon sx={{ color: 'rgba(201,169,89,0.5)', fontSize: 18 }} />
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
              />
            )}
            noOptionsText="Введите новый тег"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setCreateOpen(false); setNewTitle(''); setNewTagValues([]); }} color="inherit">
            Отмена
          </Button>
          <DndButton variant="contained" onClick={handleCreate} disabled={!newTitle.trim()}>
            Создать
          </DndButton>
        </DialogActions>
      </Dialog>

      {/* ============ Edit Tags Dialog ============ */}
      <Dialog open={tagsDialogOpen} onClose={() => setTagsDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}>
        <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>
          Теги: {tagsEditNote?.title}
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
                  sx={{ backgroundColor: 'rgba(130,130,255,0.2)', color: '#fff', fontSize: '0.75rem' }} />
              ))
            }
            renderInput={(params) => (
              <TextField {...params} label="Теги" margin="normal" placeholder="Выберите или введите..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <LocalOfferIcon sx={{ color: 'rgba(201,169,89,0.5)', fontSize: 18 }} />
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
              />
            )}
            noOptionsText="Введите новый тег"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTagsDialogOpen(false)} color="inherit">Отмена</Button>
          <DndButton variant="contained" onClick={handleSaveTags}>
            Сохранить
          </DndButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};