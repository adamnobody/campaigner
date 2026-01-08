import React, { useEffect, useMemo, useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import {
  Box,
  Button,
  Drawer,
  IconButton,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { NoteDTO } from '../../app/api';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

const NOTE_MAX_BYTES = 300 * 1024;

function byteLengthUtf8(s: string) {
  // В браузере Buffer может отсутствовать, поэтому считаем через Blob
  return new Blob([s]).size;
}

export function NoteEditorDrawer(props: {
  open: boolean;
  note: NoteDTO | null;

  content: string;
  loading: boolean;

  onClose: () => void;

  // IMPORTANT: onChange должен обновлять draft в store (источник правды)
  onChange: (next: string) => void;

  // onSave сохраняет текущий content (из store) на backend
  onSave: () => Promise<void>;

  onDelete: () => Promise<void>;
}) {
  const { open, note, content, loading, onClose, onChange, onSave, onDelete } = props;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isMd = note?.type === 'md';

  const bytes = useMemo(() => byteLengthUtf8(content ?? ''), [content]);
  const overLimit = bytes > NOTE_MAX_BYTES;

  // при смене заметки/открытии — сбрасываем состояние автосейва/ошибок
  useEffect(() => {
    if (!open) return;
    setDirty(false);
    setSaveError(null);
  }, [open, note?.id]);

  // Автосейв (debounce 1000ms)
  useEffect(() => {
    if (!open) return;
    if (!note) return;
    if (loading) return;
    if (!dirty) return;
    if (saving) return;
    if (overLimit) return;

    const t = setTimeout(() => {
      (async () => {
        try {
          setSaving(true);
          setSaveError(null);
          await onSave();
          setDirty(false);
        } catch (e: any) {
          setSaveError(e?.message ?? 'Не удалось сохранить');
          // dirty оставляем true, пользователь может нажать "Сохранить" вручную
        } finally {
          setSaving(false);
        }
      })();
    }, 1000);

    return () => clearTimeout(t);
  }, [open, note, loading, dirty, saving, overLimit, content, onSave]);

  const headerTitle = note ? `${note.title} (${note.type.toUpperCase()})` : 'Заметка';

  const canEdit = !!note && !loading;
  const canSave = canEdit && !saving && !overLimit;

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { width: 560, maxWidth: '95vw' } }}
      >
        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" noWrap>
              {headerTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {note?.path ?? ''}
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Actions */}
        <Box sx={{ px: 2, pb: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="contained"
            disabled={!canSave}
            onClick={async () => {
              if (!note) return;
              try {
                setSaving(true);
                setSaveError(null);
                await onSave();
                setDirty(false);
              } catch (e: any) {
                setSaveError(e?.message ?? 'Не удалось сохранить');
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? 'Сохранение…' : 'Сохранить'}
          </Button>

          <Button
            color="error"
            disabled={!note || saving}
            onClick={() => setConfirmOpen(true)}
          >
            Удалить
          </Button>

          <Box sx={{ flex: 1 }} />

          <Typography variant="body2" color={overLimit ? 'error.main' : 'text.secondary'}>
            {Math.round(bytes / 1024)} KB / {Math.round(NOTE_MAX_BYTES / 1024)} KB
          </Typography>
        </Box>

        {/* Warnings / errors */}
        <Box sx={{ px: 2, pb: 1 }}>
          {overLimit && (
            <Alert severity="error">
              Превышен лимит размера заметки (300 KB). Уменьшите текст, чтобы сохранить.
            </Alert>
          )}
          {saveError && (
            <Alert severity="warning" sx={{ mt: overLimit ? 1 : 0 }}>
              {saveError}
            </Alert>
          )}
        </Box>

        {/* Editor area */}
        <Box sx={{ px: 2, pb: 2, flex: 1, overflow: 'auto' }}>
          {!note ? (
            <Typography color="text.secondary">Заметка не выбрана.</Typography>
          ) : loading ? (
            <Typography color="text.secondary">Загрузка…</Typography>
          ) : isMd ? (
            <div data-color-mode="light">
              <MDEditor
                value={content}
                onChange={(v) => {
                  onChange(v ?? '');
                  setDirty(true);
                }}
                height={720}
                preview="live"
              />
            </div>
          ) : (
            <TextField
              fullWidth
              multiline
              minRows={28}
              value={content}
              onChange={(e) => {
                onChange(e.target.value);
                setDirty(true);
              }}
            />
          )}
        </Box>
      </Drawer>

      {/* Confirm delete */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Удалить заметку?</DialogTitle>
        <DialogContent>
          Файл заметки будет удалён с диска. Действие необратимо.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Отмена</Button>
          <Button
            color="error"
            onClick={async () => {
              try {
                setSaving(true);
                await onDelete();
                setConfirmOpen(false);
                onClose();
              } finally {
                setSaving(false);
              }
            }}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
