import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  Box, Typography, Paper, TextField, IconButton,
  ToggleButtonGroup, ToggleButton, Chip, Tooltip, useTheme, alpha,
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
import { useTranslation } from 'react-i18next';
import { useNoteStore } from '@/store/useNoteStore';
import { useUIStore } from '@/store/useUIStore';
import { useBranchStore } from '@/store/useBranchStore';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useHistory } from '@/hooks/useHistory';
import { DndButton } from '@/components/ui/DndButton';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { wikiApi } from '@/api/wiki';
import { notesApi } from '@/api/notes';
import { NoteEditorMarkdownToolbar } from '@/pages/notes/components/NoteEditorMarkdownToolbar';
import { NoteEditorWikiSidebar, type EditorWikiLink } from '@/pages/notes/components/NoteEditorWikiSidebar';
import { InsertWikiLinkDialog } from '@/pages/notes/components/InsertWikiLinkDialog';
import { CreateWikiLinkDialog } from '@/pages/notes/components/CreateWikiLinkDialog';
import { MarkdownPreview } from '@/pages/notes/components/MarkdownPreview';
import { shallow } from 'zustand/shallow';

const AUTOSAVE_DELAY = 3000;

type EditorMode = 'edit' | 'preview' | 'split';

export const NoteEditorPage: React.FC = () => {
  const { t, i18n } = useTranslation(['notes', 'common']);
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
  const theme = useTheme();
  const activeBranchId = useBranchStore((s) => s.activeBranchId);

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
  }, [nid, fetchNote, activeBranchId]);

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
      if (!isAuto) showSnackbar(t('notes:snackbar.saved', { title: titleRef.current.trim() }), 'success');
    } catch {
      setSaveStatus('error');
      if (!isAuto) showSnackbar(t('notes:snackbar.saveError'), 'error');
    } finally {
      setSaving(false);
    }
  }, [nid, updateNote, showSnackbar, t]);

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

    const ph = (key: string) => t(`notes:markdown.placeholders.${key}`);

    switch (type) {
      case 'bold': insertion = `**${selected || ph('bold')}**`; cursorOffset = selected ? insertion.length : 2; break;
      case 'italic': insertion = `*${selected || ph('italic')}*`; cursorOffset = selected ? insertion.length : 1; break;
      case 'heading': insertion = `## ${selected || ph('heading')}`; cursorOffset = insertion.length; break;
      case 'link': insertion = `[${selected || ph('linkText')}](url)`; cursorOffset = selected ? insertion.length - 1 : 1; break;
      case 'wikilink': insertion = `[[${selected || ph('wikiTitle')}]]`; cursorOffset = selected ? insertion.length : 2; break;
      case 'code':
        if (selected.includes('\n')) { insertion = `\`\`\`\n${selected || ph('code')}\n\`\`\``; }
        else { insertion = `\`${selected || ph('code')}\``; }
        cursorOffset = selected ? insertion.length : 1; break;
      case 'list': insertion = selected ? selected.split('\n').map(line => `- ${line}`).join('\n') : `- ${ph('listItem')}`; cursorOffset = insertion.length; break;
      case 'quote': insertion = selected ? selected.split('\n').map(line => `> ${line}`).join('\n') : `> ${ph('quote')}`; cursorOffset = insertion.length; break;
      case 'hr': insertion = '\n---\n'; cursorOffset = insertion.length; break;
      default: return;
    }

    const newContent = content.substring(0, start) + insertion + content.substring(end);
    const newCursorPos = start + cursorOffset;
    history.push(newContent, newCursorPos, newCursorPos);
    isUndoRedoRef.current = true;
    handleContentChange(newContent);
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(newCursorPos, newCursorPos); }, 0);
  }, [content, history, t]);

  // ==================== Wiki links ====================
  const handleCreateLink = async (target: { id: number; title: string }, label: string) => {
    try {
      await wikiApi.createLink({ projectId: pid, sourceNoteId: nid, targetNoteId: target.id, label: label.trim() });
      setLinkDialogOpen(false);
      showSnackbar(t('notes:snackbar.linkCreated'), 'success');
      loadWikiData();
    } catch (err: any) {
      showSnackbar(err.response?.data?.message || t('notes:snackbar.linkDuplicate'), 'error');
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
      await wikiApi.deleteLink(linkId, pid);
      showSnackbar(t('notes:snackbar.linkDeleted'), 'success');
      loadWikiData();
    } catch {
      showSnackbar(t('notes:snackbar.deleteError'), 'error');
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
      showSnackbar(currentNote.isPinned ? t('notes:snackbar.unpinned') : t('notes:snackbar.pinned'), 'success');
    } catch { showSnackbar(t('notes:snackbar.togglePinError'), 'error'); }
  };

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    const diff = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
    if (diff < 10) return t('notes:editor.saved.justNow');
    if (diff < 60) return t('notes:editor.saved.secondsAgo', { count: diff });
    if (diff < 3600) return t('notes:editor.saved.minutesAgo', { count: Math.floor(diff / 60) });
    return lastSaved.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' });
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
            color: 'text.primary',
          },
          minHeight: '100%',
        }}
        placeholder={t('notes:editor.placeholder')}
      />
    </Box>
  );

  return (
    <Box sx={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate(-1)} aria-label={t('notes:editor.backAria')}>
            <ArrowBackIcon />
          </IconButton>
          <TextField value={title} onChange={e => handleTitleChange(e.target.value)} variant="standard"
            sx={{ '& .MuiInput-input': { fontSize: '1.5rem', fontFamily: '"Cinzel", serif', fontWeight: 600, color: 'text.primary' }, minWidth: 300 }} />
          <Chip label={currentNote.format.toUpperCase()} size="small" variant="outlined" sx={{ color: 'text.secondary', borderColor: theme.palette.divider }} />
          {isWiki && <Chip label={t('notes:editor.wikiChip')} size="small" sx={{ backgroundColor: alpha(theme.palette.info.main, 0.2), color: theme.palette.info.main, fontWeight: 600 }} />}
          <IconButton onClick={handleTogglePin} color={currentNote.isPinned ? 'primary' : 'default'} aria-label={t('notes:editor.pinAria')}>
            {currentNote.isPinned ? <PushPinIcon /> : <PushPinOutlinedIcon />}
          </IconButton>
          {isWiki && (
            <Tooltip title={showLinks ? t('notes:editor.tooltipHideLinks') : t('notes:editor.tooltipShowLinks')}>
              <IconButton onClick={() => setShowLinks(!showLinks)}
                sx={{ color: showLinks ? theme.palette.info.main : 'text.disabled' }}>
                <AccountTreeIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Box display="flex" alignItems="center" gap={0.5}>
            {saveStatus === 'saved' && (
              <><CloudDoneIcon sx={{ fontSize: 16, color: alpha(theme.palette.success.main, 0.6) }} />
              <Typography variant="caption" sx={{ color: alpha(theme.palette.success.main, 0.6) }}>{t('notes:editor.saveStatusSaved', { time: formatLastSaved() })}</Typography></>
            )}
            {saveStatus === 'unsaved' && (
              <Typography variant="caption" sx={{ color: alpha(theme.palette.warning.main, 0.8) }}>{t('notes:editor.saveStatusUnsaved')}</Typography>
            )}
            {saveStatus === 'saving' && (
              <><SyncIcon sx={{ fontSize: 16, color: alpha(theme.palette.info.main, 0.6), animation: 'spin 1s linear infinite',
                '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } } }} />
              <Typography variant="caption" sx={{ color: alpha(theme.palette.info.main, 0.6) }}>{t('notes:editor.saveStatusSaving')}</Typography></>
            )}
            {saveStatus === 'error' && (
              <><CloudOffIcon sx={{ fontSize: 16, color: alpha(theme.palette.error.main, 0.6) }} />
              <Typography variant="caption" sx={{ color: alpha(theme.palette.error.main, 0.6) }}>{t('notes:editor.saveStatusError')}</Typography></>
            )}
          </Box>
          <ToggleButtonGroup value={mode} exclusive onChange={(_, v) => { if (v) setMode(v); }} size="small"
            sx={{
              '& .MuiToggleButton-root': {
                color: 'text.secondary',
                borderColor: theme.palette.divider,
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                  backgroundColor: alpha(theme.palette.primary.main, 0.15),
                },
              },
            }}>
            <ToggleButton value="edit"><EditIcon fontSize="small" sx={{ mr: 0.5 }} /> {t('notes:editor.modeEdit')}</ToggleButton>
            <ToggleButton value="split"><VerticalSplitIcon fontSize="small" sx={{ mr: 0.5 }} /> {t('notes:editor.modeSplit')}</ToggleButton>
            <ToggleButton value="preview"><VisibilityIcon fontSize="small" sx={{ mr: 0.5 }} /> {t('notes:editor.modePreview')}</ToggleButton>
          </ToggleButtonGroup>
          <DndButton variant="contained" startIcon={<SaveIcon />} onClick={handleSave} loading={saving} disabled={!hasChanges} size="small">
            {t('common:save')}
          </DndButton>
        </Box>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {t('notes:editor.hintBar', { wikiHint: isWiki ? t('notes:editor.hintBarWikiSuffix') : '' })}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {t('notes:editor.wordCount', { words: wordCount.words, chars: wordCount.chars })}
        </Typography>
      </Box>

      {/* Main area: editor + wiki sidebar */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex' }}>
        <Paper sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.paper }}>
          {mode === 'edit' && <Box sx={{ width: '100%', height: '100%' }}>{renderEditor()}</Box>}
          {mode === 'split' && (
            <>
              <Box sx={{ width: '50%', height: '100%', borderRight: `1px solid ${theme.palette.divider}` }}>{renderEditor()}</Box>
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