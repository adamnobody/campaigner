import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box, Typography, Paper, TextField, IconButton,
  ToggleButtonGroup, ToggleButton, Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import SyncIcon from '@mui/icons-material/Sync';
import ReactMarkdown from 'react-markdown';
import { useParams, useNavigate } from 'react-router-dom';
import { useNoteStore } from '@/store/useNoteStore';
import { useUIStore } from '@/store/useUIStore';
import { DndButton } from '@/components/ui/DndButton';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

const AUTOSAVE_DELAY = 30000; // 30 секунд

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
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving' | 'error'>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasChangesRef = useRef(false);
  const titleRef = useRef('');
  const contentRef = useRef('');

  // Keep refs in sync
  useEffect(() => {
    hasChangesRef.current = hasChanges;
    titleRef.current = title;
    contentRef.current = content;
  }, [hasChanges, title, content]);

  useEffect(() => {
    fetchNote(nid);
  }, [nid, fetchNote]);

  useEffect(() => {
    if (currentNote) {
      setTitle(currentNote.title);
      setContent(currentNote.content);
      setHasChanges(false);
      setSaveStatus('saved');
    }
  }, [currentNote]);

  // Core save function
  const doSave = useCallback(async (isAuto: boolean = false) => {
    if (!hasChangesRef.current) return;

    setSaving(true);
    setSaveStatus('saving');
    try {
      await updateNote(nid, { title: titleRef.current, content: contentRef.current });
      setHasChanges(false);
      hasChangesRef.current = false;
      setSaveStatus('saved');
      setLastSaved(new Date());
      if (!isAuto) {
        showSnackbar('Заметка сохранена', 'success');
      }
    } catch {
      setSaveStatus('error');
      if (!isAuto) {
        showSnackbar('Ошибка сохранения', 'error');
      }
    } finally {
      setSaving(false);
    }
  }, [nid, updateNote, showSnackbar]);

  // Autosave timer — reset on every change
  const scheduleAutosave = useCallback(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = setTimeout(() => {
      doSave(true);
    }, AUTOSAVE_DELAY);
  }, [doSave]);

  // Handle changes
  const handleTitleChange = (value: string) => {
    setTitle(value);
    setHasChanges(true);
    setSaveStatus('unsaved');
    scheduleAutosave();
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    setHasChanges(true);
    setSaveStatus('unsaved');
    scheduleAutosave();
  };

  // Manual save
  const handleSave = useCallback(() => {
    doSave(false);
  }, [doSave]);

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

  // Save on unmount if there are changes
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      if (hasChangesRef.current) {
        // Fire and forget — best effort save on leave
        updateNote(nid, { title: titleRef.current, content: contentRef.current }).catch(() => {});
      }
    };
  }, [nid, updateNote]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasChangesRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const handleTogglePin = async () => {
    if (!currentNote) return;
    try {
      await updateNote(nid, { isPinned: !currentNote.isPinned });
      showSnackbar(currentNote.isPinned ? 'Откреплено' : 'Закреплено', 'success');
    } catch {
      showSnackbar('Ошибка', 'error');
    }
  };

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);
    if (diff < 10) return 'только что';
    if (diff < 60) return `${diff} сек. назад`;
    if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
    return lastSaved.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  if (!currentNote) return <LoadingScreen />;

  return (
    <Box sx={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => { navigate(`/project/${pid}/notes`); }}>
            <ArrowBackIcon />
          </IconButton>
          <TextField
            value={title}
            onChange={e => { handleTitleChange(e.target.value); }}
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
          {/* Save status indicator */}
          <Box display="flex" alignItems="center" gap={0.5}>
            {saveStatus === 'saved' && (
              <>
                <CloudDoneIcon sx={{ fontSize: 16, color: 'rgba(130,255,130,0.6)' }} />
                <Typography variant="caption" sx={{ color: 'rgba(130,255,130,0.6)' }}>
                  Сохранено {formatLastSaved()}
                </Typography>
              </>
            )}
            {saveStatus === 'unsaved' && (
              <>
                <Typography variant="caption" sx={{ color: 'rgba(255,200,100,0.8)' }}>
                  ● Несохранённые изменения
                </Typography>
              </>
            )}
            {saveStatus === 'saving' && (
              <>
                <SyncIcon sx={{ fontSize: 16, color: 'rgba(130,130,255,0.6)', animation: 'spin 1s linear infinite', '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } } }} />
                <Typography variant="caption" sx={{ color: 'rgba(130,130,255,0.6)' }}>
                  Сохранение...
                </Typography>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <CloudOffIcon sx={{ fontSize: 16, color: 'rgba(255,100,100,0.6)' }} />
                <Typography variant="caption" sx={{ color: 'rgba(255,100,100,0.6)' }}>
                  Ошибка сохранения
                </Typography>
              </>
            )}
          </Box>

          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, v) => { if (v) setMode(v); }}
            size="small"
          >
            <ToggleButton value="edit"><EditIcon fontSize="small" sx={{ mr: 0.5 }} /> Редактор</ToggleButton>
            <ToggleButton value="preview"><VisibilityIcon fontSize="small" sx={{ mr: 0.5 }} /> Просмотр</ToggleButton>
          </ToggleButtonGroup>
          <DndButton
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            loading={saving}
            disabled={!hasChanges}
            size="small"
          >
            Сохранить
          </DndButton>
        </Box>
      </Box>

      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.25)', mb: 1 }}>
        Автосохранение каждые 30 сек · Ctrl+S — сохранить вручную
      </Typography>

      {/* Content */}
      <Paper sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
        {mode === 'edit' ? (
          <TextField
            value={content}
            onChange={e => { handleContentChange(e.target.value); }}
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
            placeholder="Начните писать..."
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