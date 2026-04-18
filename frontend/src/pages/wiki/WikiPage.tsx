import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, TextField,
  InputAdornment, Button, Chip,
  useTheme, alpha,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LinkIcon from '@mui/icons-material/Link';
import CategoryIcon from '@mui/icons-material/Category';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { useParams, useNavigate } from 'react-router-dom';
import { useNoteStore } from '@/store/useNoteStore';
import { useWikiStore } from '@/store/useWikiStore';
import { useTagStore } from '@/store/useTagStore';
import { useUIStore } from '@/store/useUIStore';
import { useDebounce } from '@/hooks/useDebounce';
import { DndButton } from '@/components/ui/DndButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { GlassCard } from '@/components/ui/GlassCard';
import type { Note } from '@campaigner/shared';
import { WikiArticleCard } from '@/pages/wiki/components/WikiArticleCard';
import {
  WikiCreateArticleDialog,
  WikiTagsDialog,
  WikiLinkArticlesDialog,
} from '@/pages/wiki/components/WikiDialogs';

export const WikiPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const navigate = useNavigate();
  const theme = useTheme();

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

  const hasFilters = Boolean(search || selectedCategory);

  if (loading && notes.length === 0) return <LoadingScreen />;

  return (
    <Box sx={{ minWidth: 0, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        mb={3}
        gap={2}
        flexWrap="wrap"
        sx={{ minWidth: 0 }}
      >
        <Box>
          <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '1.8rem', color: 'text.primary' }}>
            Вики
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            База знаний вашего мира
          </Typography>
        </Box>

        <Box display="flex" gap={1} flexWrap="wrap" sx={{ minWidth: 0 }}>
          <DndButton variant="outlined" startIcon={<AccountTreeIcon />} onClick={() => navigate(`/project/${pid}/wiki/graph`)} sx={{ borderColor: alpha(theme.palette.primary.main, 0.5) }}>
            Граф
          </DndButton>
          <DndButton variant="outlined" startIcon={<LinkIcon />} onClick={() => setLinkDialogOpen(true)} sx={{ borderColor: alpha(theme.palette.primary.main, 0.5) }}>
            Связать статьи
          </DndButton>
          <DndButton variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            Новая статья
          </DndButton>
        </Box>
      </Box>

      {/* Filters */}
      {(notes.length > 0 || hasFilters) && (
        <GlassCard sx={{ p: 2, mb: 3 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto' },
              gridTemplateAreas: {
                xs: `
                  "search"
                  "tags"
                  "meta"
                `,
                md: `
                  "search meta"
                  "tags meta"
                `,
              },
              gap: 2,
              alignItems: 'start',
              minWidth: 0,
              maxWidth: '100%',
            }}
          >
            <Box sx={{ gridArea: 'search', minWidth: 0, maxWidth: '100%' }}>
              <TextField
                fullWidth
                placeholder="Поиск в вики..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ gridArea: 'tags', minWidth: 0, maxWidth: '100%' }}>
              {categories.length > 0 && (
                <Box display="flex" gap={1} alignItems="flex-start" sx={{ minWidth: 0, maxWidth: '100%' }}>
                  <CategoryIcon sx={{ fontSize: 18, color: 'text.secondary', mt: '6px', flexShrink: 0 }} />
                  <Box
                    display="flex"
                    gap={0.75}
                    flexWrap="wrap"
                    alignItems="center"
                    sx={{
                      minWidth: 0,
                      maxWidth: '100%',
                      flex: 1,
                      overflow: 'hidden',
                    }}
                  >
                    <Chip
                      label="Все"
                      size="small"
                      onClick={() => setSelectedCategory('')}
                      sx={{
                        maxWidth: '100%',
                        backgroundColor: !selectedCategory ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.text.secondary, 0.1),
                        color: !selectedCategory ? theme.palette.primary.main : 'text.secondary',
                        fontWeight: !selectedCategory ? 600 : 400,
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.15) },
                      }}
                    />
                    {categories.map((cat) => (
                      <Chip
                        key={cat.name}
                        label={`${cat.name} (${cat.count})`}
                        size="small"
                        onClick={() => setSelectedCategory(selectedCategory === cat.name ? '' : cat.name)}
                        sx={{
                          maxWidth: '100%',
                          backgroundColor: selectedCategory === cat.name ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.text.secondary, 0.1),
                          color: selectedCategory === cat.name ? theme.palette.primary.main : 'text.secondary',
                          fontWeight: selectedCategory === cat.name ? 600 : 400,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.15) },
                          '& .MuiChip-label': {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>

            <Box
              sx={{
                gridArea: 'meta',
                display: 'flex',
                flexDirection: 'column',
                alignItems: { xs: 'flex-start', md: 'flex-end' },
                justifyContent: 'flex-start',
                gap: 1,
                minWidth: 0,
                maxWidth: '100%',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  textAlign: { xs: 'left', md: 'right' },
                  whiteSpace: 'nowrap',
                }}
              >
                {filteredNotes.length} из {notes.length}
              </Typography>

              {hasFilters && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('');
                  }}
                  size="small"
                  sx={{
                    borderColor: alpha(theme.palette.primary.main, 0.5),
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Сброс
                </Button>
              )}
            </Box>
          </Box>
        </GlassCard>
      )}

      {/* Content */}
      {notes.length === 0 && !loading ? (
        hasFilters ? (
          <EmptyState
            icon={<SearchIcon sx={{ fontSize: 64 }} />}
            title="Ничего не найдено"
            description="Попробуйте изменить параметры поиска или фильтры"
            actionLabel="Сбросить фильтры"
            onAction={() => { setSearch(''); setSelectedCategory(''); }}
          />
        ) : (
          <EmptyState
            icon={<MenuBookIcon sx={{ fontSize: 64 }} />}
            title="Вики пуста"
            description="Создайте базу знаний вашего мира — локации, фракции, предметы, магия и многое другое"
            actionLabel="Создать статью"
            onAction={() => setCreateOpen(true)}
          />
        )
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(3, minmax(0, 1fr))',
            },
            gap: 2,
            width: '100%',
            minWidth: 0,
            maxWidth: '100%',
            overflow: 'hidden',
          }}
        >
          {filteredNotes.map((note) => (
            <WikiArticleCard
              key={note.id}
              note={note}
              noteLinks={getLinksForNote(note.id)}
              onOpenArticle={() => navigate(`/project/${pid}/notes/${note.id}`)}
              onToggleTagCategory={(name) => setSelectedCategory(selectedCategory === name ? '' : name)}
              onEditTags={(e) => handleOpenTagsEdit(note, e)}
              onDelete={(e) => handleDelete(note.id, note.title, e)}
            />
          ))}
        </Box>
      )}

      <WikiCreateArticleDialog
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setNewTitle('');
          setNewTagsStr('');
          setNewTagsInput('');
        }}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        newTagsStr={newTagsStr}
        setNewTagsStr={setNewTagsStr}
        newTagsInput={newTagsInput}
        setNewTagsInput={setNewTagsInput}
        existingTagNames={existingTagNames}
        onCreate={handleCreate}
      />

      <WikiTagsDialog
        open={tagsDialogOpen}
        onClose={() => {
          setTagsDialogOpen(false);
          setTagsEditNote(null);
          setEditTagsStr('');
          setEditTagsInput('');
        }}
        tagsEditNote={tagsEditNote}
        editTagsStr={editTagsStr}
        setEditTagsStr={setEditTagsStr}
        editTagsInput={editTagsInput}
        setEditTagsInput={setEditTagsInput}
        existingTagNames={existingTagNames}
        onSave={handleSaveTags}
      />

      <WikiLinkArticlesDialog
        open={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        notes={notes}
        linkSource={linkSource}
        setLinkSource={setLinkSource}
        linkTarget={linkTarget}
        setLinkTarget={setLinkTarget}
        linkLabel={linkLabel}
        setLinkLabel={setLinkLabel}
        onCreateLink={handleCreateLink}
      />
    </Box>
  );
};
