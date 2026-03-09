import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  Box, Typography, Paper, TextField, IconButton,
  ToggleButtonGroup, ToggleButton, Chip, Divider, Tooltip,
  List, ListItem, ListItemText, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, Autocomplete, 
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
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import CodeIcon from '@mui/icons-material/Code';
import TitleIcon from '@mui/icons-material/Title';
import LinkIcon from '@mui/icons-material/Link';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useParams, useNavigate } from 'react-router-dom';
import { useNoteStore } from '@/store/useNoteStore';
import { useUIStore } from '@/store/useUIStore';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useHistory } from '@/hooks/useHistory';
import { DndButton } from '@/components/ui/DndButton';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { wikiApi, notesApi } from '@/api/axiosClient';
import type { Note } from '@campaigner/shared';

const AUTOSAVE_DELAY = 3000;

type EditorMode = 'edit' | 'preview' | 'split';

interface WikiLink {
  id: number;
  sourceNoteId: number;
  targetNoteId: number;
  sourceTitle: string;
  targetTitle: string;
  label: string;
}

export const NoteEditorPage: React.FC = () => {
  const { projectId, noteId } = useParams<{ projectId: string; noteId: string }>();
  const pid = parseInt(projectId!);
  const nid = parseInt(noteId!);
  const navigate = useNavigate();
  const { currentNote, fetchNote, updateNote } = useNoteStore();
  const { showSnackbar } = useUIStore();

  const [mode, setMode] = useState<EditorMode>('split');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving' | 'error'>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Wiki sidebar
  const [showLinks, setShowLinks] = useState(false);
  const [wikiLinks, setWikiLinks] = useState<WikiLink[]>([]);
  const [wikiNotes, setWikiNotes] = useState<{ id: number; title: string }[]>([]);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkTarget, setLinkTarget] = useState<{ id: number; title: string } | null>(null);
  const [linkLabel, setLinkLabel] = useState('');
  const [insertWikiDialogOpen, setInsertWikiDialogOpen] = useState(false);
  const [insertWikiTarget, setInsertWikiTarget] = useState<{ id: number; title: string } | null>(null);
  const [insertWikiLabel, setInsertWikiLabel] = useState('');
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
      if (initializedNoteIdRef.current !== currentNote.id) {
        initializedNoteIdRef.current = currentNote.id;
        setTitle(currentNote.title);
        setContent(currentNote.content);
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

  const loadWikiData = async () => {
    try {
      const [linksRes, notesRes] = await Promise.all([
        wikiApi.getLinks(pid, nid),
        notesApi.getAll(pid, { noteType: 'wiki', limit: 500 }),
      ]);
      setWikiLinks(linksRes.data.data || []);
      setWikiNotes((notesRes.data.data.items || []).map((n: any) => ({ id: n.id, title: n.title })));
    } catch {}
  };

  // Load all wiki notes for [[link]] resolution even for non-wiki notes
  useEffect(() => {
    notesApi.getAll(pid, { noteType: 'wiki', limit: 500 }).then(res => {
      setWikiNotes((res.data.data.items || []).map((n: any) => ({ id: n.id, title: n.title })));
    }).catch(() => {});
  }, [pid]);

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
      setInsertWikiTarget(null);
      setInsertWikiLabel(selected || '');
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
  const handleCreateLink = async () => {
    if (!linkTarget) return;
    try {
      await wikiApi.createLink({ projectId: pid, sourceNoteId: nid, targetNoteId: linkTarget.id, label: linkLabel.trim() });
      setLinkDialogOpen(false);
      setLinkTarget(null);
      setLinkLabel('');
      showSnackbar('Связь создана', 'success');
      loadWikiData();
    } catch (err: any) {
      showSnackbar(err.response?.data?.message || 'Связь уже существует', 'error');
    }
  };

  const handleInsertWikiLink = () => {
    if (!insertWikiTarget) return;

    const textarea = textareaRef.current;
    const { start, end } = insertWikiSelectionRef.current;

    const label = insertWikiLabel.trim() || insertWikiTarget.title;
    const insertion = `[[note:${insertWikiTarget.id}|${label}]]`;

    const newContent = content.substring(0, start) + insertion + content.substring(end);
    const newCursorPos = start + insertion.length;

    history.push(newContent, newCursorPos, newCursorPos);
    isUndoRedoRef.current = true;
    handleContentChange(newContent);

    setInsertWikiDialogOpen(false);
    setInsertWikiTarget(null);
    setInsertWikiLabel('');

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

  /** Pre-process [[wiki links]] into real markdown links */
  const processedContent = useMemo(() => {
    if (!content) return content;

    return content.replace(/$$\[([^$$]+?)\]\]/g, (_match, rawValue) => {
      const value = String(rawValue).trim();

      const noteIdMatch = value.match(/^note:(\d+)(?:\|(.+))?$/i);
      if (noteIdMatch) {
        const noteIdNum = parseInt(noteIdMatch[1], 10);
        const customLabel = noteIdMatch[2]?.trim();
        const foundById = wikiNotes.find((n) => n.id === noteIdNum);

        if (foundById) {
          const label = customLabel || foundById.title;
          return `[${label}](/project/${pid}/notes/${foundById.id})`;
        }

        const fallbackLabel = customLabel || `Статья #${noteIdNum}`;
        return `<span style="color:#FF6B6B;border-bottom:1px dashed rgba(255,107,107,0.4)">${fallbackLabel}</span>`;
      }

      const titleAliasMatch = value.match(/^([^|]+)\|(.+)$/);
      if (titleAliasMatch) {
        const targetTitle = titleAliasMatch[1].trim();
        const customLabel = titleAliasMatch[2].trim();
        const foundByTitle = wikiNotes.find(
          (n) => n.title.toLowerCase() === targetTitle.toLowerCase()
        );

        if (foundByTitle) {
          return `[${customLabel}](/project/${pid}/notes/${foundByTitle.id})`;
        }

        return `<span style="color:#FF6B6B;border-bottom:1px dashed rgba(255,107,107,0.4)">${customLabel}</span>`;
      }

      const foundByTitle = wikiNotes.find(
        (n) => n.title.toLowerCase() === value.toLowerCase()
      );

      if (foundByTitle) {
        return `[${value}](/project/${pid}/notes/${foundByTitle.id})`;
      }

      return `<span style="color:#FF6B6B;border-bottom:1px dashed rgba(255,107,107,0.4)">${value}</span>`;
    });
  }, [content, wikiNotes, pid]);

  useEffect(() => {
    console.log('CONTENT:', content);
    console.log('PROCESSED:', processedContent);
  }, [content, processedContent]);

  if (!currentNote) return <LoadingScreen />;

  const isMarkdown = currentNote.format === 'md';
  const isWiki = currentNote.noteType === 'wiki';

  const markdownStyles = {
    '& h1': { fontFamily: '"Cinzel", serif', color: 'primary.main', fontSize: '1.8rem', mt: 3, mb: 1, borderBottom: '1px solid rgba(201,169,89,0.2)', pb: 1 },
    '& h2': { fontFamily: '"Cinzel", serif', color: 'primary.main', fontSize: '1.4rem', mt: 2.5, mb: 1 },
    '& h3': { fontFamily: '"Cinzel", serif', color: 'primary.main', fontSize: '1.15rem', mt: 2, mb: 0.5 },
    '& p': { mb: 1.5, lineHeight: 1.8, color: 'rgba(255,255,255,0.85)' },
    '& a': { color: '#4ECDC4', textDecoration: 'underline', textDecorationColor: 'rgba(78,205,196,0.3)' },
    '& code': { backgroundColor: 'rgba(201,169,89,0.1)', padding: '2px 6px', borderRadius: '4px', fontFamily: '"Fira Code", monospace', fontSize: '0.85em' },
    '& pre': { backgroundColor: 'rgba(0,0,0,0.4)', p: 2, borderRadius: 2, overflow: 'auto', border: '1px solid rgba(255,255,255,0.06)', '& code': { backgroundColor: 'transparent', p: 0 } },
    '& blockquote': { borderLeft: '3px solid', borderColor: 'primary.main', pl: 2, ml: 0, opacity: 0.85, fontStyle: 'italic' },
    '& ul, & ol': { pl: 3, mb: 1.5 },
    '& li': { mb: 0.5, lineHeight: 1.7 },
    '& table': { borderCollapse: 'collapse', width: '100%', mb: 2 },
    '& th, & td': { border: '1px solid rgba(255,255,255,0.1)', px: 2, py: 1, textAlign: 'left' },
    '& th': { backgroundColor: 'rgba(255,255,255,0.05)', fontWeight: 600 },
    '& hr': { border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', my: 3 },
    '& img': { maxWidth: '100%', borderRadius: 1 },
    '& strong': { color: '#fff', fontWeight: 700 },
    '& em': { color: 'rgba(255,255,255,0.9)' },
  };

  const renderEditor = () => (
    <Box ref={editorScrollRef} onScroll={handleEditorScroll} sx={{ height: '100%', overflow: 'auto' }}>
      {isMarkdown && (
        <Box sx={{ display: 'flex', gap: 0.5, p: 1, borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', alignItems: 'center' }}>
          <Tooltip title="Отменить (Ctrl+Z)">
            <span>
              <IconButton size="small" onClick={handleUndo} disabled={!history.canUndo}
                sx={{ color: 'rgba(255,255,255,0.4)', '&.Mui-disabled': { color: 'rgba(255,255,255,0.12)' }, borderRadius: 1, width: 30, height: 30 }}>
                <UndoIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Повторить (Ctrl+Shift+Z)">
            <span>
              <IconButton size="small" onClick={handleRedo} disabled={!history.canRedo}
                sx={{ color: 'rgba(255,255,255,0.4)', '&.Mui-disabled': { color: 'rgba(255,255,255,0.12)' }, borderRadius: 1, width: 30, height: 30 }}>
                <RedoIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: 'rgba(255,255,255,0.08)' }} />
          <ToolbarButton icon={<TitleIcon />} tooltip="Заголовок" onClick={() => insertMarkdown('heading')} />
          <ToolbarButton icon={<FormatBoldIcon />} tooltip="Жирный (Ctrl+B)" onClick={() => insertMarkdown('bold')} />
          <ToolbarButton icon={<FormatItalicIcon />} tooltip="Курсив (Ctrl+I)" onClick={() => insertMarkdown('italic')} />
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: 'rgba(255,255,255,0.08)' }} />
          <ToolbarButton icon={<FormatListBulletedIcon />} tooltip="Список" onClick={() => insertMarkdown('list')} />
          <ToolbarButton icon={<FormatQuoteIcon />} tooltip="Цитата" onClick={() => insertMarkdown('quote')} />
          <ToolbarButton icon={<CodeIcon />} tooltip="Код" onClick={() => insertMarkdown('code')} />
          <ToolbarButton icon={<LinkIcon />} tooltip="Ссылка" onClick={() => insertMarkdown('link')} />
          <ToolbarButton icon={<HorizontalRuleIcon />} tooltip="Разделитель" onClick={() => insertMarkdown('hr')} />
          {isWiki && (
            <>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: 'rgba(255,255,255,0.08)' }} />
              <Tooltip title="Вики-ссылка [[...]]">
                <IconButton size="small" onClick={() => insertMarkdown('wikilink')}
                  sx={{ color: 'rgba(78,205,196,0.6)', borderRadius: 1, width: 30, height: 30,
                    '&:hover': { color: 'rgba(78,205,196,1)', backgroundColor: 'rgba(78,205,196,0.1)' } }}>
                  <MenuBookIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
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

  /** Custom renderer that resolves [[wiki links]] inside text nodes */
  const renderPreview = () => (
    <Box ref={previewScrollRef} sx={{ height: '100%', overflow: 'auto', p: 3, ...markdownStyles }}>
      {isMarkdown ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            a: ({ href, children }) => {
              // Internal wiki links — use React Router navigation
              if (href && href.startsWith('/project/')) {
                return (
                  <a
                    href={href}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(href);
                    }}
                    style={{ color: '#4ECDC4', textDecoration: 'underline', textDecorationColor: 'rgba(78,205,196,0.3)', cursor: 'pointer' }}
                  >
                    {children}
                  </a>
                );
              }
              return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
            },
          }}
          // Allow raw HTML for the red "not found" spans
          skipHtml={false}
        >
          {processedContent || '*Пусто...*'}
        </ReactMarkdown>
      ) : (
        <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: '"Crimson Text", serif', lineHeight: 1.8, color: 'rgba(255,255,255,0.85)' }}>
          {content || 'Пусто...'}
        </Typography>
      )}
    </Box>
  );

  /** Wiki links sidebar */
  const renderWikiSidebar = () => {
    if (!showLinks) return null;

    return (
      <Box sx={{
        width: 260, flexShrink: 0, borderLeft: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <Box sx={{ p: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <AccountTreeIcon sx={{ fontSize: 16, color: 'rgba(78,205,196,0.6)' }} />
            <Typography variant="subtitle2" sx={{ color: 'rgba(78,205,196,0.8)', fontWeight: 600, fontSize: '0.8rem' }}>
              Связи ({wikiLinks.length})
            </Typography>
          </Box>
          <Tooltip title="Добавить связь">
            <IconButton size="small" onClick={() => setLinkDialogOpen(true)}
              sx={{ color: 'rgba(78,205,196,0.5)', '&:hover': { color: 'rgba(78,205,196,1)' } }}>
              <AddIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
          {wikiLinks.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <AccountTreeIcon sx={{ fontSize: 32, color: 'rgba(255,255,255,0.08)', mb: 1 }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.25)', display: 'block' }}>
                Нет связей
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.15)', display: 'block', fontSize: '0.65rem' }}>
                Свяжите с другими вики-статьями
              </Typography>
            </Box>
          ) : (
            <List disablePadding dense>
              {wikiLinks.map(link => {
                const otherTitle = link.sourceNoteId === nid ? link.targetTitle : link.sourceTitle;
                const otherId = link.sourceNoteId === nid ? link.targetNoteId : link.sourceNoteId;
                return (
                  <ListItem
                    key={link.id}
                    secondaryAction={
                      <IconButton size="small" onClick={() => handleDeleteLink(link.id)}
                        sx={{ color: 'rgba(255,100,100,0.3)', '&:hover': { color: 'rgba(255,100,100,0.7)' } }}>
                        <DeleteIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    }
                    onClick={() => navigate(`/project/${pid}/notes/${otherId}`)}
                    sx={{
                      cursor: 'pointer', borderRadius: 1, mb: 0.5,
                      backgroundColor: 'rgba(78,205,196,0.04)',
                      border: '1px solid rgba(78,205,196,0.08)',
                      '&:hover': { backgroundColor: 'rgba(78,205,196,0.1)' },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography sx={{ fontSize: '0.8rem', color: '#fff', fontWeight: 500 }} noWrap>
                          {otherTitle}
                        </Typography>
                      }
                      secondary={link.label ? (
                        <Typography variant="caption" sx={{ color: 'rgba(78,205,196,0.5)', fontSize: '0.65rem' }}>
                          {link.label}
                        </Typography>
                      ) : null}
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>

        <Box sx={{ p: 1, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.6rem', display: 'block', textAlign: 'center' }}>
            Используйте [[note:ID|Текст]] или [[Название]]
          </Typography>
        </Box>
      </Box>
    );
  };

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
          {isWiki && ' · [[note:ID|Текст]] или [[Название]] — вики-ссылка'}
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
              <Box sx={{ width: '50%', height: '100%' }}>{renderPreview()}</Box>
            </>
          )}
          {mode === 'preview' && <Box sx={{ width: '100%', height: '100%' }}>{renderPreview()}</Box>}
        </Paper>

        {renderWikiSidebar()}
      </Box>

      <Dialog
        open={insertWikiDialogOpen}
        onClose={() => {
          setInsertWikiDialogOpen(false);
          setInsertWikiTarget(null);
          setInsertWikiLabel('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>
          Вставить вики-ссылку
        </DialogTitle>
        <DialogContent>
          <Autocomplete
            options={wikiNotes.filter((n) => n.id !== nid)}
            getOptionLabel={(opt) => opt.title}
            value={insertWikiTarget}
            onChange={(_, val) => {
              setInsertWikiTarget(val);
              if (val && !insertWikiLabel.trim()) {
                setInsertWikiLabel(val.title);
              }
            }}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Вики-статья *"
                margin="normal"
                placeholder="Выберите статью..."
              />
            )}
            noOptionsText="Нет статей"
          />

          <TextField
            fullWidth
            label="Текст ссылки"
            value={insertWikiLabel}
            onChange={(e) => setInsertWikiLabel(e.target.value)}
            margin="normal"
            placeholder="Текст, который будет показан в статье"
            helperText="Если ничего не указать, будет использовано название статьи"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setInsertWikiDialogOpen(false);
              setInsertWikiTarget(null);
              setInsertWikiLabel('');
            }}
            color="inherit"
          >
            Отмена
          </Button>
          <DndButton
            variant="contained"
            onClick={handleInsertWikiLink}
            disabled={!insertWikiTarget}
          >
            Вставить
          </DndButton>
        </DialogActions>
      </Dialog>

      {/* Add Link Dialog */}
      <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}>
        <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>Добавить связь</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={wikiNotes.filter(n => n.id !== nid)}
            getOptionLabel={(opt) => opt.title}
            value={linkTarget}
            onChange={(_, val) => setLinkTarget(val)}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            renderInput={(params) => (
              <TextField {...params} label="Вики-статья *" margin="normal" placeholder="Выберите статью..." />
            )}
            noOptionsText="Нет статей"
          />
          <TextField
            fullWidth label="Описание связи (опционально)" value={linkLabel}
            onChange={(e) => setLinkLabel(e.target.value)} margin="normal"
            placeholder="напр. столица, союзник, часть..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setLinkDialogOpen(false)} color="inherit">Отмена</Button>
          <DndButton variant="contained" onClick={handleCreateLink} disabled={!linkTarget}>
            Создать связь
          </DndButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const ToolbarButton: React.FC<{ icon: React.ReactNode; tooltip: string; onClick: () => void }> = ({ icon, tooltip, onClick }) => (
  <Tooltip title={tooltip}>
    <IconButton size="small" onClick={onClick}
      sx={{ color: 'rgba(255,255,255,0.4)', borderRadius: 1, width: 30, height: 30,
        '&:hover': { color: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(255,255,255,0.06)' } }}>
      {icon}
    </IconButton>
  </Tooltip>
);