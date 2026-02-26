import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, TextField, IconButton,
  ToggleButtonGroup, ToggleButton, Divider, Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import ReactMarkdown from 'react-markdown';
import { useParams, useNavigate } from 'react-router-dom';
import { useNoteStore } from '@/store/useNoteStore';
import { useUIStore } from '@/store/useUIStore';
import { useDebounce } from '@/hooks/useDebounce';
import { DndButton } from '@/components/ui/DndButton';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export const NoteEditorPage: React.FC = () => {
  const { projectId, noteId } = useParams<{ projectId: string; noteId: string }>();
  const pid = parseInt(projectId!);
  const nid = parseInt(noteId!);
  const navigate = useNavigate();
  const { currentNote, fetchNote, updateNote } = useNoteStore();
  const { showSnackbar } = useUIStore();

  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchNote(nid);
  }, [nid, fetchNote]);

  useEffect(() => {
    if (currentNote) {
      setTitle(currentNote.title);
      setContent(currentNote.content);
      setHasChanges(false);
    }
  }, [currentNote]);

  const handleSave = useCallback(async () => {
    if (!hasChanges) return;
    setSaving(true);
    try {
      await updateNote(nid, { title, content });
      setHasChanges(false);
      showSnackbar('Note saved', 'success');
    } catch {
      showSnackbar('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }, [nid, title, content, hasChanges, updateNote, showSnackbar]);

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  const handleTogglePin = async () => {
    if (!currentNote) return;
    try {
      await updateNote(nid, { isPinned: !currentNote.isPinned });
      showSnackbar(currentNote.isPinned ? 'Unpinned' : 'Pinned', 'success');
    } catch {
      showSnackbar('Failed', 'error');
    }
  };

  if (!currentNote) return <LoadingScreen />;

  return (
    <Box sx={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate(`/project/${pid}/notes`)}>
            <ArrowBackIcon />
          </IconButton>
          <TextField
            value={title}
            onChange={(e) => { setTitle(e.target.value); setHasChanges(true); }}
            variant="standard"
            sx={{
              '& .MuiInput-input': { fontSize: '1.5rem', fontFamily: '"Cinzel", serif', fontWeight: 600 },
              minWidth: 300,
            }}
          />
          <Chip label={currentNote.format.toUpperCase()} size="small" variant="outlined" />
          <IconButton onClick={handleTogglePin} color={currentNote.isPinned ? 'primary' : 'default'}>
            {currentNote.isPinned ? <PushPinIcon /> : <PushPinOutlinedIcon />}
          </IconButton>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, v) => v && setMode(v)}
            size="small"
          >
            <ToggleButton value="edit"><EditIcon fontSize="small" sx={{ mr: 0.5 }} /> Edit</ToggleButton>
            <ToggleButton value="preview"><VisibilityIcon fontSize="small" sx={{ mr: 0.5 }} /> Preview</ToggleButton>
          </ToggleButtonGroup>
          <DndButton
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            loading={saving}
            disabled={!hasChanges}
            size="small"
          >
            Save
          </DndButton>
        </Box>
      </Box>

      {hasChanges && (
        <Typography variant="caption" color="warning.main" sx={{ mb: 1 }}>
          ● Unsaved changes (Ctrl+S to save)
        </Typography>
      )}

      {/* Content */}
      <Paper sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
        {mode === 'edit' ? (
          <TextField
            value={content}
            onChange={(e) => { setContent(e.target.value); setHasChanges(true); }}
            multiline
            fullWidth
            variant="standard"
            InputProps={{ disableUnderline: true }}
            sx={{
              '& .MuiInput-input': {
                fontFamily: currentNote.format === 'md' ? '"Fira Code", monospace' : '"Crimson Text", serif',
                fontSize: '1rem',
                lineHeight: 1.8,
              },
              minHeight: '100%',
            }}
            placeholder="Start writing..."
          />
        ) : (
          <Box sx={{
            '& h1, & h2, & h3': { fontFamily: '"Cinzel", serif', color: 'primary.main' },
            '& a': { color: 'primary.main' },
            '& code': { backgroundColor: 'rgba(201, 169, 89, 0.1)', padding: '2px 6px', borderRadius: 4 },
            '& pre': { backgroundColor: 'rgba(0,0,0,0.3)', p: 2, borderRadius: 2, overflow: 'auto' },
            '& blockquote': { borderLeft: '3px solid', borderColor: 'primary.main', pl: 2, ml: 0, opacity: 0.8 },
          }}>
            {currentNote.format === 'md' ? (
              <ReactMarkdown>{content}</ReactMarkdown>
            ) : (
              <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                {content}
              </Typography>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};