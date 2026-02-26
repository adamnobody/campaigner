import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, TextField,
  InputAdornment, Tabs, Tab, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PushPinIcon from '@mui/icons-material/PushPin';
import DescriptionIcon from '@mui/icons-material/Description';
import { useParams, useNavigate } from 'react-router-dom';
import { useNoteStore } from '@/store/useNoteStore';
import { useUIStore } from '@/store/useUIStore';
import { useDebounce } from '@/hooks/useDebounce';
import { DndButton } from '@/components/ui/DndButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ALLOWED_NOTE_FORMATS } from '@campaigner/shared';

export const NotesPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const navigate = useNavigate();
  const { notes, total, loading, fetchNotes, createNote, deleteNote } = useNoteStore();
  const { showSnackbar, showConfirmDialog } = useUIStore();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newFormat, setNewFormat] = useState<'md' | 'txt'>('md');
  const debouncedSearch = useDebounce(search, 300);

  const noteTypes = ['all', 'note', 'wiki', 'marker_note'];

  useEffect(() => {
    const noteType = tab === 0 ? undefined : noteTypes[tab];
    fetchNotes(pid, { search: debouncedSearch || undefined, noteType });
  }, [pid, fetchNotes, debouncedSearch, tab]);

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
      setCreateOpen(false);
      setNewTitle('');
      showSnackbar('Note created', 'success');
      navigate(`/project/${pid}/notes/${note.id}`);
    } catch {
      showSnackbar('Failed to create note', 'error');
    }
  };

  const handleDelete = (id: number, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirmDialog('Delete Note', `Delete "${title}"?`, async () => {
      try {
        await deleteNote(id);
        showSnackbar('Note deleted', 'success');
      } catch {
        showSnackbar('Failed to delete', 'error');
      }
    });
  };

  if (loading && notes.length === 0) return <LoadingScreen />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h3">Notes</Typography>
        <DndButton variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          New Note
        </DndButton>
      </Box>

      <TextField
        fullWidth
        placeholder="Search notes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
        }}
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label={`All (${total})`} />
        <Tab label="Notes" />
        <Tab label="Wiki" />
        <Tab label="Marker Notes" />
      </Tabs>

      {notes.length === 0 ? (
        <EmptyState
          icon={<DescriptionIcon sx={{ fontSize: 64 }} />}
          title="No notes yet"
          description="Create notes, wiki articles, and documentation for your world"
          actionLabel="Create Note"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <Grid container spacing={2}>
          {notes.map(note => (
            <Grid item xs={12} sm={6} md={4} key={note.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' },
                }}
                onClick={() => navigate(`/project/${pid}/notes/${note.id}`)}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box display="flex" alignItems="center" gap={1}>
                      {note.isPinned && <PushPinIcon fontSize="small" color="primary" />}
                      <Typography variant="h6" noWrap>{note.title}</Typography>
                    </Box>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => handleDelete(note.id, note.title, e)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  {note.content && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {note.content}
                    </Typography>
                  )}
                  <Box display="flex" gap={0.5} mt={1.5} flexWrap="wrap" alignItems="center">
                    <Chip label={note.format.toUpperCase()} size="small" variant="outlined" />
                    <Chip label={note.noteType} size="small" color="primary" variant="outlined" />
                    {note.tags?.map(tag => (
                      <Chip key={tag.id} label={tag.name} size="small" sx={{ backgroundColor: tag.color, color: '#fff' }} />
                    ))}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Updated: {new Date(note.updatedAt).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Note</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Format</InputLabel>
            <Select value={newFormat} label="Format" onChange={(e) => setNewFormat(e.target.value as 'md' | 'txt')}>
              {ALLOWED_NOTE_FORMATS.map(f => (
                <MenuItem key={f} value={f}>{f.toUpperCase()}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} color="inherit">Cancel</Button>
          <DndButton variant="contained" onClick={handleCreate} disabled={!newTitle.trim()}>
            Create
          </DndButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};