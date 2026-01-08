import React, { useEffect, useMemo, useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import {
  Box,
  Button,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider
} from '@mui/material';
import type { NoteDTO } from '../../app/api';

const NOTE_MAX_BYTES = 300 * 1024;

function byteLengthUtf8(s: string) {
  return new Blob([s]).size;
}

export function NoteEditorPanel(props: {
  note: NoteDTO | null;
  content: string;
  loading: boolean;

  onClose: () => void;
  onChange: (next: string) => void;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const { note, content, loading, onClose, onChange, onSave, onDelete } = props;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isMd = note?.type === 'md';
  const bytes = useMemo(() => byteLengthUtf8(content ?? ''), [content]);
  const overLimit = bytes > NOTE_MAX_BYTES;

  useEffect(() => {
    setDirty(false);
    setSaveError(null);
  }, [note?.id]);

  // debounce autosave
  useEffect(() => {
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
        } finally {
          setSaving(false);
        }
      })();
    }, 1000);

    return () => clearTimeout(t);
  }, [note, loading, dirty, saving, overLimit, content, onSave]);

  const canEdit = !!note && !loading;
  const canSave = canEdit && !saving && !overLimit;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" noWrap>
              {note ? `${note.title} (${note.type.toUpperCase()})` : 'Заметка'}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {note?.path ?? ''}
            </Typography>
          </Box>

          <Button size="small" onClick={onClose}>
            Закрыть
          </Button>
        </Box>

        <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
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

        <Box sx={{ mt: 1 }}>
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
      </Box>

      <Divider />

      {/* Body */}
      <Box sx={{ p: 2, pt: 2, flex: 1, overflow: 'auto' }}>
        {!note ? (
          <Typography color="text.secondary">
            Выберите заметку слева (или создайте новую).
          </Typography>
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
              height={700}
              preview="live"
            />
          </div>
        ) : (
          <TextField
            fullWidth
            multiline
            minRows={26}
            value={content}
            onChange={(e) => {
              onChange(e.target.value);
              setDirty(true);
            }}
          />
        )}
      </Box>

      {/* Confirm delete */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Удалить заметку?</DialogTitle>
        <DialogContent>Файл заметки будет удалён с диска. Действие необратимо.</DialogContent>
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
    </Box>
  );
}
