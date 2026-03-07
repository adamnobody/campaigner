import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, TextField,
  InputAdornment, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, Chip,
  Autocomplete, Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LinkIcon from '@mui/icons-material/Link';
import CategoryIcon from '@mui/icons-material/Category';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { useParams, useNavigate } from 'react-router-dom';
import { useNoteStore } from '@/store/useNoteStore';
import { useWikiStore } from '@/store/useWikiStore';
import { useTagStore } from '@/store/useTagStore';
import { useUIStore } from '@/store/useUIStore';
import { useDebounce } from '@/hooks/useDebounce';
import { DndButton } from '@/components/ui/DndButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import type { Note } from '@campaigner/shared';

export const WikiPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const navigate = useNavigate();

  const { notes, loading, fetchNotes, createNote, deleteNote, setTags } = useNoteStore();
  const { links, categories, fetchLinks, fetchCategories, createLink } = useWikiStore();
  const { tags, fetchTags, findOrCreateTagsByNames } = useTagStore();
  const { showSnackbar, showConfirmDialog } = useUIStore();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [tagsEditNote, setTagsEditNote] = useState<Note | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newTagsStr, setNewTagsStr] = useState('');
  const [editTagsStr, setEditTagsStr] = useState('');
  const [newTagsInput, setNewTagsInput] = useState('');
  const [editTagsInput, setEditTagsInput] = useState('');

  const [linkSource, setLinkSource] = useState<Note | null>(null);
  const [linkTarget, setLinkTarget] = useState<Note | null>(null);
  const [linkLabel, setLinkLabel] = useState('');

  const debouncedSearch = useDebounce(search, 300);

  const reload = async () => {
    await Promise.all([
      fetchNotes(pid, { noteType: 'wiki', search: debouncedSearch || undefined, limit: 500 }),
      fetchCategories(pid),
      fetchLinks(pid),
      fetchTags(pid),
    ]);
  };

  useEffect(() => {
    reload();
  }, [pid, debouncedSearch]);

  const resolveTagIds = async (tagsString: string): Promise<number[]> => {
    const tagNames = tagsString
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (tagNames.length === 0) return [];
    return await findOrCreateTagsByNames(pid, tagNames);
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

  const handleCreate = async () => {
    if (!newTitle.trim()) return;

    try {
      const note = await createNote({
        projectId: pid,
        title: newTitle.trim(),
        content: `# ${newTitle.trim()}\n\n`,
        format: 'md',
        noteType: 'wiki',
        isPinned: false,
      });

      const finalTagsStr = mergeTagValues(newTagsStr, newTagsInput);

      if (finalTagsStr.trim()) {
        const tagIds = await resolveTagIds(finalTagsStr);
        if (tagIds.length > 0) {
          await setTags(note.id, tagIds);
        }
      }

      setCreateOpen(false);
      setNewTitle('');
      setNewTagsStr('');
      setNewTagsInput('');
      showSnackbar('Статья создана', 'success');
      navigate(`/project/${pid}/notes/${note.id}`);
    } catch {
      showSnackbar('Ошибка создания', 'error');
    }
  };

  const handleDelete = (id: number, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirmDialog('Удалить статью', `Удалить "${title}"?`, async () => {
      try {
        await deleteNote(id);
        showSnackbar('Удалено', 'success');
        await Promise.all([fetchLinks(pid), fetchCategories(pid)]);
      } catch {
        showSnackbar('Ошибка', 'error');
      }
    });
  };

  const handleOpenTagsEdit = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    setTagsEditNote(note);
    setEditTagsStr((note.tags || []).map((t: any) => t.name).join(', '));
    setEditTagsInput('');
    setTagsDialogOpen(true);
  };

  const handleSaveTags = async () => {
    if (!tagsEditNote) return;

    try {
      const finalTagsStr = mergeTagValues(editTagsStr, editTagsInput);
      const tagIds = await resolveTagIds(finalTagsStr);
      await setTags(tagsEditNote.id, tagIds);
      setTagsDialogOpen(false);
      setTagsEditNote(null);
      setEditTagsStr('');
      setEditTagsInput('');
      showSnackbar('Теги обновлены', 'success');
      await reload();
    } catch {
      showSnackbar('Ошибка', 'error');
    }
  };

  const handleCreateLink = async () => {
    if (!linkSource || !linkTarget) return;

    try {
      await createLink({
        projectId: pid,
        sourceNoteId: linkSource.id,
        targetNoteId: linkTarget.id,
        label: linkLabel.trim(),
      });

      setLinkDialogOpen(false);
      setLinkSource(null);
      setLinkTarget(null);
      setLinkLabel('');
      showSnackbar('Связь создана', 'success');
      await fetchLinks(pid);
    } catch (err: any) {
      showSnackbar(err.message || 'Такая связь уже существует', 'error');
    }
  };

  const getLinksForNote = (noteId: number) => {
    return links.filter((l) => l.sourceNoteId === noteId || l.targetNoteId === noteId);
  };

  const existingTagNames = useMemo(() => tags.map((t) => t.name), [tags]);

  const filteredNotes = useMemo(() => {
    let result = notes;
    if (selectedCategory) {
      result = result.filter((n) =>
        n.tags?.some((t: any) => t.name === selectedCategory)
      );
    }
    return result;
  }, [notes, selectedCategory]);

  if (loading && notes.length === 0) return <LoadingScreen />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '1.8rem', color: '#fff' }}>
          Вики
        </Typography>
        <Box display="flex" gap={1}>
          <DndButton variant="outlined" startIcon={<AccountTreeIcon />} onClick={() => navigate(`/project/${pid}/wiki/graph`)}>
            Граф
          </DndButton>
          <DndButton variant="outlined" startIcon={<LinkIcon />} onClick={() => setLinkDialogOpen(true)}>
            Связать статьи
          </DndButton>
          <DndButton variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            Новая статья
          </DndButton>
        </Box>
      </Box>

      <Box display="flex" gap={2} mb={3} alignItems="center" flexWrap="wrap">
        <TextField
          placeholder="Поиск в вики..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            flexGrow: 1,
            maxWidth: 400,
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

        {categories.length > 0 && (
          <Box display="flex" gap={0.5} flexWrap="wrap" alignItems="center">
            <CategoryIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.3)', mr: 0.5 }} />
            <Chip
              label="Все"
              size="small"
              onClick={() => setSelectedCategory('')}
              sx={{
                backgroundColor: !selectedCategory ? 'rgba(130,130,255,0.3)' : 'rgba(255,255,255,0.06)',
                color: !selectedCategory ? '#fff' : 'rgba(255,255,255,0.5)',
                fontWeight: !selectedCategory ? 600 : 400,
                cursor: 'pointer',
                '&:hover': { backgroundColor: 'rgba(130,130,255,0.2)' },
              }}
            />
            {categories.map((cat) => (
              <Chip
                key={cat.name}
                label={`${cat.name} (${cat.count})`}
                size="small"
                onClick={() => setSelectedCategory(selectedCategory === cat.name ? '' : cat.name)}
                sx={{
                  backgroundColor: selectedCategory === cat.name ? 'rgba(130,130,255,0.3)' : 'rgba(255,255,255,0.06)',
                  color: selectedCategory === cat.name ? '#fff' : 'rgba(255,255,255,0.5)',
                  fontWeight: selectedCategory === cat.name ? 600 : 400,
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'rgba(130,130,255,0.2)' },
                }}
              />
            ))}
          </Box>
        )}

        {(search || selectedCategory) && (
          <Button
            variant="outlined"
            onClick={() => {
              setSearch('');
              setSelectedCategory('');
            }}
            size="small"
            sx={{ borderColor: 'rgba(130,130,255,0.4)', color: 'rgba(130,130,255,0.9)', textTransform: 'none' }}
          >
            Сброс
          </Button>
        )}

        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
          {filteredNotes.length} из {notes.length}
        </Typography>
      </Box>

      {notes.length === 0 ? (
        <EmptyState
          icon={<MenuBookIcon sx={{ fontSize: 64 }} />}
          title="Вики пуста"
          description="Создайте базу знаний вашего мира — локации, фракции, предметы, магия и многое другое"
          actionLabel="Создать статью"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <Box
          sx={{
            columnCount: { xs: 1, sm: 2, md: 3 },
            columnGap: '16px',
          }}
        >
          {filteredNotes.map((note) => {
            const noteLinks = getLinksForNote(note.id);

            return (
              <Box
                key={note.id}
                sx={{
                  breakInside: 'avoid',
                  mb: 2,
                  display: 'inline-block',
                  width: '100%',
                }}
              >
                <Card
                  sx={{
                    cursor: 'pointer',
                    width: '100%',
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
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography
                        sx={{
                          fontFamily: '"Cinzel", serif',
                          fontWeight: 600,
                          fontSize: '1.1rem',
                          color: '#fff',
                          flexGrow: 1,
                          pr: 1,
                        }}
                        noWrap
                      >
                        {note.title}
                      </Typography>
                      <Box className="card-actions" display="flex" gap={0} sx={{ opacity: 0, transition: 'opacity 0.15s' }}>
                        <Tooltip title="Редактировать теги">
                          <IconButton
                            size="small"
                            onClick={(e) => handleOpenTagsEdit(note, e)}
                            sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: 'rgba(201,169,89,0.8)' } }}
                          >
                            <LocalOfferIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Удалить">
                          <IconButton
                            size="small"
                            onClick={(e) => handleDelete(note.id, note.title, e)}
                            sx={{ color: 'rgba(255,100,100,0.4)', '&:hover': { color: 'rgba(255,100,100,0.8)' } }}
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {note.content && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255,255,255,0.5)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          fontSize: '0.85rem',
                          lineHeight: 1.6,
                        }}
                      >
                        {note.content.replace(/^#+ /gm, '').replace(/$$\[|$$\]/g, '').substring(0, 150)}
                      </Typography>
                    )}

                    {note.tags && note.tags.length > 0 && (
                      <Box display="flex" gap={0.5} mt={1.5} flexWrap="wrap">
                        {note.tags.map((tag: any) => (
                          <Chip
                            key={tag.id}
                            label={tag.name}
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCategory(selectedCategory === tag.name ? '' : tag.name);
                            }}
                            sx={{
                              height: 20,
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              backgroundColor: tag.color || 'rgba(130,130,255,0.2)',
                              color: '#fff',
                              borderRadius: 1,
                              cursor: 'pointer',
                              '&:hover': { opacity: 0.8 },
                            }}
                          />
                        ))}
                      </Box>
                    )}

                    {(!note.tags || note.tags.length === 0) && (
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={0.5}
                        mt={1.5}
                        onClick={(e) => handleOpenTagsEdit(note, e)}
                        sx={{ cursor: 'pointer', '&:hover': { '& .add-tag-text': { color: 'rgba(201,169,89,0.8)' } } }}
                      >
                        <LocalOfferIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.2)' }} />
                        <Typography
                          className="add-tag-text"
                          variant="caption"
                          sx={{ color: 'rgba(255,255,255,0.2)', transition: 'color 0.15s' }}
                        >
                          + добавить теги
                        </Typography>
                      </Box>
                    )}

                    {noteLinks.length > 0 && (
                      <Box mt={1.5} pt={1.5} borderTop="1px solid rgba(255,255,255,0.06)">
                        <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                          <AccountTreeIcon sx={{ fontSize: 14, color: 'rgba(78,205,196,0.6)' }} />
                          <Typography variant="caption" sx={{ color: 'rgba(78,205,196,0.6)', fontWeight: 600 }}>
                            Связи ({noteLinks.length})
                          </Typography>
                        </Box>
                        <Box display="flex" flexDirection="column" gap={0.3}>
                          {noteLinks.slice(0, 3).map((link) => {
                            const otherTitle = link.sourceNoteId === note.id ? link.targetTitle : link.sourceTitle;
                            const label = link.label ? ` (${link.label})` : '';
                            return (
                              <Typography
                                key={link.id}
                                variant="caption"
                                sx={{
                                  color: 'rgba(78,205,196,0.5)',
                                  fontSize: '0.7rem',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                → {otherTitle}{label}
                              </Typography>
                            );
                          })}
                          {noteLinks.length > 3 && (
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>
                              +{noteLinks.length - 3} ещё
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}

                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.25)', display: 'block', mt: 1 }}>
                      {new Date(note.updatedAt).toLocaleDateString('ru-RU')}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Box>
      )}

      <Dialog
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setNewTitle('');
          setNewTagsStr('');
          setNewTagsInput('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>Новая статья</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Название статьи *"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            margin="normal"
            placeholder="напр. Королевство Элдория"
          />

          <Autocomplete
            multiple
            freeSolo
            options={existingTagNames}
            value={newTagsStr ? newTagsStr.split(',').map((s) => s.trim()).filter(Boolean) : []}
            inputValue={newTagsInput}
            onInputChange={(_, value) => setNewTagsInput(value)}
            onChange={(_, vals) => setNewTagsStr(vals.join(', '))}
            renderTags={(value, getTagProps) =>
              value.map((opt, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={opt}
                  label={opt}
                  size="small"
                  sx={{ backgroundColor: 'rgba(130,130,255,0.2)', color: '#fff', fontSize: '0.75rem' }}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Теги (категории)"
                margin="normal"
                placeholder="Выберите или введите новые теги..."
                helperText="Теги используются как категории для фильтрации вики-статей"
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
            noOptionsText="Введите название нового тега"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setCreateOpen(false);
              setNewTitle('');
              setNewTagsStr('');
              setNewTagsInput('');
            }}
            color="inherit"
          >
            Отмена
          </Button>
          <DndButton variant="contained" onClick={handleCreate} disabled={!newTitle.trim()}>
            Создать
          </DndButton>
        </DialogActions>
      </Dialog>

      <Dialog
        open={tagsDialogOpen}
        onClose={() => {
          setTagsDialogOpen(false);
          setTagsEditNote(null);
          setEditTagsStr('');
          setEditTagsInput('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>
          Теги: {tagsEditNote?.title}
        </DialogTitle>
        <DialogContent>
          <Autocomplete
            multiple
            freeSolo
            options={existingTagNames}
            value={editTagsStr ? editTagsStr.split(',').map((s) => s.trim()).filter(Boolean) : []}
            inputValue={editTagsInput}
            onInputChange={(_, value) => setEditTagsInput(value)}
            onChange={(_, vals) => setEditTagsStr(vals.join(', '))}
            renderTags={(value, getTagProps) =>
              value.map((opt, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={opt}
                  label={opt}
                  size="small"
                  sx={{ backgroundColor: 'rgba(130,130,255,0.2)', color: '#fff', fontSize: '0.75rem' }}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Теги"
                margin="normal"
                placeholder="Выберите или введите..."
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
            noOptionsText="Введите название нового тега"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setTagsDialogOpen(false);
              setTagsEditNote(null);
              setEditTagsStr('');
              setEditTagsInput('');
            }}
            color="inherit"
          >
            Отмена
          </Button>
          <DndButton variant="contained" onClick={handleSaveTags}>
            Сохранить
          </DndButton>
        </DialogActions>
      </Dialog>

      <Dialog
        open={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>Связать статьи</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={notes}
            getOptionLabel={(opt) => opt.title}
            value={linkSource}
            onChange={(_, val) => setLinkSource(val)}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            renderInput={(params) => (
              <TextField {...params} label="Первая статья *" margin="normal" placeholder="Выберите статью..." />
            )}
            noOptionsText="Нет статей"
          />

          <Autocomplete
            options={notes.filter((n) => n.id !== linkSource?.id)}
            getOptionLabel={(opt) => opt.title}
            value={linkTarget}
            onChange={(_, val) => setLinkTarget(val)}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            renderInput={(params) => (
              <TextField {...params} label="Вторая статья *" margin="normal" placeholder="Выберите статью..." />
            )}
            noOptionsText="Нет статей"
          />

          <TextField
            fullWidth
            label="Описание связи (опционально)"
            value={linkLabel}
            onChange={(e) => setLinkLabel(e.target.value)}
            margin="normal"
            placeholder="напр. столица, союзник, часть..."
            helperText="Краткое описание отношения между статьями"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setLinkDialogOpen(false)} color="inherit">
            Отмена
          </Button>
          <DndButton variant="contained" onClick={handleCreateLink} disabled={!linkSource || !linkTarget}>
            Создать связь
          </DndButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};