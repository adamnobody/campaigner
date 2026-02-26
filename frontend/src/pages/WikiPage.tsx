import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, TextField,
  InputAdornment, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useParams, useNavigate } from 'react-router-dom';
import { useNoteStore } from '@/store/useNoteStore';
import { useUIStore } from '@/store/useUIStore';
import { useDebounce } from '@/hooks/useDebounce';
import { DndButton } from '@/components/ui/DndButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export const WikiPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const navigate = useNavigate();
  const { notes, total, loading, fetchNotes, createNote, deleteNote } = useNoteStore();
  const { showSnackbar, showConfirmDialog } = useUIStore();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    fetchNotes(pid, { noteType: 'wiki', search: debouncedSearch || undefined, limit: 100 });
  }, [pid, fetchNotes, debouncedSearch]);

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
      setCreateOpen(false);
      setNewTitle('');
      showSnackbar('Wiki article created', 'success');
      navigate(`/project/${pid}/notes/${note.id}`);
    } catch {
      showSnackbar('Failed to create', 'error');
    }
  };

  const handleDelete = (id: number, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirmDialog('Delete Wiki Article', `Delete "${title}"?`, async () => {
      try {
        await deleteNote(id);
        showSnackbar('Deleted', 'success');
      } catch {
        showSnackbar('Failed', 'error');
      }
    });
  };

  if (loading && notes.length === 0) return <LoadingScreen />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h3">Wiki</Typography>
        <DndButton variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          New Article
        </DndButton>
      </Box>

      <TextField
        fullWidth
        placeholder="Search wiki..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
        }}
      />

      {notes.length === 0 ? (
        <EmptyState
          icon={<MenuBookIcon sx={{ fontSize: 64 }} />}
          title="No wiki articles yet"
          description="Build a knowledge base for your world — lore, factions, locations, items, and more"
          actionLabel="Create Article"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <Grid container spacing={2}>
          {notes.map(note => (
            <Grid item xs={12} sm={6} md={4} key={note.id}>
              <Card
                sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}
                onClick={() => navigate(`/project/${pid}/notes/${note.id}`)}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="h6" noWrap>{note.title}</Typography>
                    <IconButton size="small" color="error" onClick={(e) => handleDelete(note.id, note.title, e)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  {note.content && (
                    <Typography variant="body2" color="text.secondary" sx={{
                      mt: 1, overflow: 'hidden', textOverflow: 'ellipsis',
                      display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical',
                    }}>
                      {note.content.replace(/^#+ /gm, '').substring(0, 200)}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Wiki Article</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth label="Article Title" value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)} margin="normal"
            placeholder="e.g. The Kingdom of Eldoria"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} color="inherit">Cancel</Button>
          <DndButton variant="contained" onClick={handleCreate} disabled={!newTitle.trim()}>Create</DndButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};