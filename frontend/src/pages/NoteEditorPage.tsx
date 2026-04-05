import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  Box, Typography, Paper, TextField, IconButton,
  ToggleButtonGroup, ToggleButton, Chip, Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VerticalSplitIcon from '@mui/icons-material/VerticalSplit';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import SyncIcon from '@mui/icons-material/Sync';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { useParams, useNavigate } from 'react-router-dom';
import { useNoteStore } from '@/store/useNoteStore';
import { useUIStore } from '@/store/useUIStore';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useHistory } from '@/hooks/useHistory';
import { DndButton } from '@/components/ui/DndButton';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { wikiApi, notesApi } from '@/api/axiosClient';
import { NoteEditorMarkdownToolbar } from '@/pages/note-editor/NoteEditorMarkdownToolbar';
import { NoteEditorWikiSidebar, type EditorWikiLink } from '@/pages/note-editor/NoteEditorWikiSidebar';
import { InsertWikiLinkDialog } from '@/pages/note-editor/InsertWikiLinkDialog';
import { CreateWikiLinkDialog } from '@/pages/note-editor/CreateWikiLinkDialog';
import { MarkdownPreview } from '@/pages/note-editor/MarkdownPreview';
import { shallow } from 'zustand/shallow';

const AUTOSAVE_DELAY = 3000;

type EditorMode = 'edit' | 'preview' | 'split';

export const NoteEditorPage: React.FC = () => {
  const { projectId, noteId } = useParams<{ projectId: string; noteId: string }>();
  const pid = parseInt(projectId!);
  const nid = parseInt(noteId!);
  const navigate = useNavigate();
  const { currentNote, fetchNote, updateNote } = useNoteStore((state) => ({
    currentNote: state.currentNote,
    fetchNote: state.fetchNote,
    updateNote: state.updateNote,
  }), shallow);
  const showSnackbar = useUIStore((state) => state.showSnackbar);

  const [mode, setMode] = useState<EditorMode>('split');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving' | 'error'>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Wiki sidebar
  const [showLinks, setShowLinks] = useState(false);
  const [wikiLinks, setWikiLinks] = useState<EditorWikiLink[]>([]);
  const [wikiNotes, setWikiNotes] = useState<{ id: number; title: string }[]>([]);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [insertWikiDialogOpen, setInsertWikiDialogOpen] = useState(false);
  const [insertWikiInitialLabel, setInsertWikiInitialLabel] = useState('');
  const insertWikiSelectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasChangesRef = useRef(false);
  const titleRef = useRef('');
  const contentRef = useRef('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const isUndoRedoRef = useRef(false);

  const history = useHistory('');
  const initializedNoteIdRef = useRef<number | null>(null);
  const wikiNotesLoadedRef = useRef(false);

  useEffect(() => {
    hasChangesRef.current = hasChanges;
    titleRef.current = title;
    contentRef.current = content;
  }, [hasChanges, title, content]);

  useEffect(() => {
    if (mode === 'edit') {
      setPreviewContent(content);
      return;
    }
    const timer = setTimeout(() => setPreviewContent(content), 180);
    return () => clearTimeout(timer);
  }, [content, mode]);

  useEffect(() => {
    fetchNote(nid);
  }, [nid, fetchNote]);

  useEffect(() => {
    if (currentNote) {
      if (initializedNoteIdRef.current !== currentNote.id) {
        initializedNoteIdRef.current = currentNote.id;
        setTitle(currentNote.title);
        setContent(currentNote.content);
        setPreviewContent(currentNote.content);
        history.reset(currentNote.content);
        setHasChanges(false);
        setSaveStatus('saved');

        // Load wiki data if wiki note
        if (currentNote.noteType === 'wiki') {
          setShowLinks(true);
          loadWikiData();
        } else {
          setShowLinks(false);
        }
      }
    }
  }, [currentNote]);

  const loadWikiNotes = useCallback(async () => {
    try {
      const notesRes = await notesApi.getAll(pid, { noteType: 'wiki', limit: 500 });
      setWikiNotes((notesRes.data.data.items || []).map((n: any) => ({ id: n.id, title: n.title })));
      wikiNotesLoadedRef.current = true;
    } catch {
      // no-op
    }
  }, [pid]);

  const loadWikiData = useCallback(async () => {
    try {
      const [linksRes] = await Promise.all([
        wikiApi.getLinks(pid, nid),
      ]);
      setWikiLinks(linksRes.data.data || []);
      await loadWikiNotes();
    } catch {}
  }, [loadWikiNotes, nid, pid]);

  // Load all wiki notes for [[link]] resolution even for non-wiki notes
  useEffect(() => {
    wikiNotesLoadedRef.current = false;
    loadWikiNotes();
  }, [loadWikiNotes]);

  // ==================== Save ====================
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
      if (!isAuto) showSnackbar('Заметка сохранена', 'success');
    } catch {
      setSaveStatus('error');
      if (!isAuto) showSnackbar('Ошибка сохранения', 'error');
    } finally {
      setSaving(false);
    }
  }, [nid, updateNote, showSnackbar]);

  const scheduleAutosave = useCallback(() => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => doSave(true), AUTOSAVE_DELAY);
  }, [doSave]);

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
    if (!isUndoRedoRef.current) {
      const ta = textareaRef.current;
      history.push(value, ta?.selectionStart ?? value.length, ta?.selectionEnd ?? value.length);
    }
    isUndoRedoRef.current = false;
  };

  const handleSave = useCallback(() => doSave(false), [doSave]);

  // ==================== Undo / Redo ====================
  const handleUndo = useCallback(() => {
    const entry = history.undo();
    if (!entry) return;
    isUndoRedoRef.current = true;
    setContent(entry.value);
    setHasChanges(true);
    setSaveStatus('unsaved');
    scheduleAutosave();
    setTimeout(() => {
      const ta = textareaRef.current;
      if (ta) { ta.focus(); ta.setSelectionRange(entry.cursorStart, entry.cursorEnd); }
    }, 0);
  }, [history, scheduleAutosave]);

  const handleRedo = useCallback(() => {
    const entry = history.redo();
    if (!entry) return;
    isUndoRedoRef.current = true;
    setContent(entry.value);
    setHasChanges(true);
    setSaveStatus('unsaved');
    scheduleAutosave();
    setTimeout(() => {
      const ta = textareaRef.current;
      if (ta) { ta.focus(); ta.setSelectionRange(entry.cursorStart, entry.cursorEnd); }
    }, 0);
  }, [history, scheduleAutosave]);

  // ==================== Markdown insert ====================
  const insertMarkdown = useCallback((type: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);

    if (type === 'wikilink') {
      insertWikiSelectionRef.current = { start, end };
      setInsertWikiInitialLabel(selected || '');
      setInsertWikiDialogOpen(true);
      return;
    }

    let insertion = '';
    let cursorOffset = 0;

    switch (type) {
      case 'bold': insertion = `**${selected || 'жирный текст'}**`; cursorOffset = selected ? insertion.length : 2; break;
      case 'italic': insertion = `*${selected || 'курсив'}*`; cursorOffset = selected ? insertion.length : 1; break;
      case 'heading': insertion = `## ${selected || 'Заголовок'}`; cursorOffset = insertion.length; break;
      case 'link': insertion = `[${selected || 'текст'}](url)`; cursorOffset = selected ? insertion.length - 1 : 1; break;
      case 'wikilink': insertion = `[[${selected || 'Название статьи'}]]`; cursorOffset = selected ? insertion.length : 2; break;
      case 'code':
        if (selected.includes('\n')) { insertion = `\`\`\`\n${selected || 'код'}\n\`\`\``; }
        else { insertion = `\`${selected || 'код'}\``; }
        cursorOffset = selected ? insertion.length : 1; break;
      case 'list': insertion = selected ? selected.split('\n').map(line => `- ${line}`).join('\n') : '- элемент списка'; cursorOffset = insertion.length; break;
      case 'quote': insertion = selected ? selected.split('\n').map(line => `> ${line}`).join('\n') : '> цитата'; cursorOffset = insertion.length; break;
      case 'hr': insertion = '\n---\n'; cursorOffset = insertion.length; break;
      default: return;
    }

    const newContent = content.substring(0, start) + insertion + content.substring(end);
    const newCursorPos = start + cursorOffset;
    history.push(newContent, newCursorPos, newCursorPos);
    isUndoRedoRef.current = true;
    handleContentChange(newContent);
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(newCursorPos, newCursorPos); }, 0);
  }, [content, history]);

  // ==================== Wiki links ====================
  const handleCreateLink = async (target: { id: number; title: string }, label: string) => {
    try {
      await wikiApi.createLink({ projectId: pid, sourceNoteId: nid, targetNoteId: target.id, label: label.trim() });
      setLinkDialogOpen(false);
      showSnackbar('Связь создана', 'success');
      loadWikiData();
    } catch (err: any) {
      showSnackbar(err.response?.data?.message || 'Связь уже существует', 'error');
    }
  };

  const handleInsertWikiLink = (target: { id: number; title: string }, insertLabel: string) => {
    const textarea = textareaRef.current;
    const { start, end } = insertWikiSelectionRef.current;

    const label = insertLabel.trim() || target.title;
    const insertion = `[${label}](/__note__/${target.id})`;

    const newContent = content.substring(0, start) + insertion + content.substring(end);
    const newCursorPos = start + insertion.length;

    history.push(newContent, newCursorPos, newCursorPos);
    isUndoRedoRef.current = true;
    handleContentChange(newContent);

    setInsertWikiDialogOpen(false);

    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleDeleteLink = async (linkId: number) => {
    try {
      await wikiApi.deleteLink(linkId);
      showSnackbar('Связь удалена', 'success');
      loadWikiData();
    } catch {
      showSnackbar('Ошибка', 'error');
    }
  };

  // ==================== Hotkeys ====================
  useHotkeys(useMemo(() => [
    { key: 's', ctrl: true, handler: () => doSave(false) },
    { key: 'b', ctrl: true, handler: () => insertMarkdown('bold') },
    { key: 'i', ctrl: true, handler: () => insertMarkdown('italic') },
    { key: 'z', ctrl: true, handler: handleUndo },
    { key: 'z', ctrl: true, shift: true, handler: handleRedo },
    { key: 'y', ctrl: true, handler: handleRedo },
  ], [doSave, insertMarkdown, handleUndo, handleRedo]));

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      if (hasChangesRef.current) {
        updateNote(nid, { title: titleRef.current, content: contentRef.current }).catch(() => {});
      }
    };
  }, [nid, updateNote]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasChangesRef.current) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const handleEditorScroll = useCallback(() => {
    if (!editorScrollRef.current || !previewScrollRef.current || mode !== 'split') return;
    const editor = editorScrollRef.current;
    const preview = previewScrollRef.current;
    const ratio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1);
    preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
  }, [mode]);

  const handleTogglePin = async () => {
    if (!currentNote) return;
    try {
      await updateNote(nid, { isPinned: !currentNote.isPinned });
      showSnackbar(currentNote.isPinned ? 'Откреплено' : 'Закреплено', 'success');
    } catch { showSnackbar('Ошибка', 'error'); }
  };

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    const diff = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
    if (diff < 10) return 'только что';
    if (diff < 60) return `${diff} сек. назад`;
    if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
    return lastSaved.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };
  
  const wordCount = useMemo(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    return { words, chars: content.length };
  }, [content]);

  if (!currentNote) return <LoadingScreen />;

  const isMarkdown = currentNote.format === 'md';
  const isWiki = currentNote.noteType === 'wiki';

  const renderEditor = () => (
    <Box ref={editorScrollRef} onScroll={handleEditorScroll} sx={{ height: '100%', overflow: 'auto' }}>
      {isMarkdown && (
        <NoteEditorMarkdownToolbar
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onInsertMarkdown={insertMarkdown}
          isWiki={isWiki}
        />
      )}

      <TextField
        value={content}
        onChange={e => handleContentChange(e.target.value)}
        multiline fullWidth variant="standard"
        InputProps={{ disableUnderline: true }}
        inputRef={textareaRef}
        sx={{
          p: 2,
          '& .MuiInput-input': {
            fontFamily: isMarkdown ? '"Fira Code", monospace' : '"Crimson Text", serif',
            fontSize: isMarkdown ? '0.9rem' : '1rem',
            lineHeight: 1.8,
            color: 'rgba(255,255,255,0.9)',
          },
          minHeight: '100%',
        }}
        placeholder="Начните писать..."
      />
    </Box>
  );

  return (
    <Box sx={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <TextField value={title} onChange={e => handleTitleChange(e.target.value)} variant="standard"
            sx={{ '& .MuiInput-input': { fontSize: '1.5rem', fontFamily: '"Cinzel", serif', fontWeight: 600 }, minWidth: 300 }} />
          <Chip label={currentNote.format.toUpperCase()} size="small" variant="outlined" />
          {isWiki && <Chip label="WIKI" size="small" sx={{ backgroundColor: 'rgba(78,205,196,0.2)', color: '#4ECDC4', fontWeight: 600 }} />}
          <IconButton onClick={handleTogglePin} color={currentNote.isPinned ? 'primary' : 'default'}>
            {currentNote.isPinned ? <PushPinIcon /> : <PushPinOutlinedIcon />}
          </IconButton>
          {isWiki && (
            <Tooltip title={showLinks ? 'Скрыть связи' : 'Показать связи'}>
              <IconButton onClick={() => setShowLinks(!showLinks)}
                sx={{ color: showLinks ? 'rgba(78,205,196,0.8)' : 'rgba(255,255,255,0.3)' }}>
                <AccountTreeIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Box display="flex" alignItems="center" gap={0.5}>
            {saveStatus === 'saved' && (
              <><CloudDoneIcon sx={{ fontSize: 16, color: 'rgba(130,255,130,0.6)' }} />
              <Typography variant="caption" sx={{ color: 'rgba(130,255,130,0.6)' }}>Сохранено {formatLastSaved()}</Typography></>
            )}
            {saveStatus === 'unsaved' && (
              <Typography variant="caption" sx={{ color: 'rgba(255,200,100,0.8)' }}>● Несохранённые изменения</Typography>
            )}
            {saveStatus === 'saving' && (
              <><SyncIcon sx={{ fontSize: 16, color: 'rgba(130,130,255,0.6)', animation: 'spin 1s linear infinite',
                '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } } }} />
              <Typography variant="caption" sx={{ color: 'rgba(130,130,255,0.6)' }}>Сохранение...</Typography></>
            )}
            {saveStatus === 'error' && (
              <><CloudOffIcon sx={{ fontSize: 16, color: 'rgba(255,100,100,0.6)' }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,100,100,0.6)' }}>Ошибка сохранения</Typography></>
            )}
          </Box>
          <ToggleButtonGroup value={mode} exclusive onChange={(_, v) => { if (v) setMode(v); }} size="small">
            <ToggleButton value="edit"><EditIcon fontSize="small" sx={{ mr: 0.5 }} /> Код</ToggleButton>
            <ToggleButton value="split"><VerticalSplitIcon fontSize="small" sx={{ mr: 0.5 }} /> Сплит</ToggleButton>
            <ToggleButton value="preview"><VisibilityIcon fontSize="small" sx={{ mr: 0.5 }} /> Превью</ToggleButton>
          </ToggleButtonGroup>
          <DndButton variant="contained" startIcon={<SaveIcon />} onClick={handleSave} loading={saving} disabled={!hasChanges} size="small">
            Сохранить
          </DndButton>
        </Box>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.25)' }}>
          Автосохранение через 3 сек · Ctrl+S сохранить · Ctrl+Z отменить · Ctrl+Shift+Z повторить
          {isWiki && ' · [Текст ссылки](/__note__/ID) — внутренняя вики-ссылка'}
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.2)' }}>
          {wordCount.words} слов · {wordCount.chars} символов
        </Typography>
      </Box>

      {/* Main area: editor + wiki sidebar */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex' }}>
        <Paper sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', border: '1px solid rgba(255,255,255,0.06)' }}>
          {mode === 'edit' && <Box sx={{ width: '100%', height: '100%' }}>{renderEditor()}</Box>}
          {mode === 'split' && (
            <>
              <Box sx={{ width: '50%', height: '100%', borderRight: '1px solid rgba(255,255,255,0.08)' }}>{renderEditor()}</Box>
              <Box sx={{ width: '50%', height: '100%' }}>
                <MarkdownPreview content={previewContent} isMarkdown={isMarkdown} wikiNotes={wikiNotes} projectId={pid} scrollRef={previewScrollRef} />
              </Box>
            </>
          )}
          {mode === 'preview' && (
            <Box sx={{ width: '100%', height: '100%' }}>
              <MarkdownPreview content={previewContent} isMarkdown={isMarkdown} wikiNotes={wikiNotes} projectId={pid} scrollRef={previewScrollRef} />
            </Box>
          )}
        </Paper>

        {showLinks && (
          <NoteEditorWikiSidebar
            wikiLinks={wikiLinks}
            currentNoteId={nid}
            onNavigateToNote={(id) => navigate(`/project/${pid}/notes/${id}`)}
            onOpenCreateLink={() => setLinkDialogOpen(true)}
            onDeleteLink={handleDeleteLink}
          />
        )}
      </Box>

      <InsertWikiLinkDialog
        open={insertWikiDialogOpen}
        onClose={() => setInsertWikiDialogOpen(false)}
        wikiNotes={wikiNotes}
        currentNoteId={nid}
        initialLabel={insertWikiInitialLabel}
        onInsert={handleInsertWikiLink}
      />

      <CreateWikiLinkDialog
        open={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        wikiNotes={wikiNotes}
        currentNoteId={nid}
        onCreateLink={handleCreateLink}
      />
    </Box>
  );
};