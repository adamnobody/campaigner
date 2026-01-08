import React, { useMemo, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material';
import type { NoteType } from '../../app/api';

export function CreateNoteDialog(props: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: { title: string; type: NoteType }) => Promise<void>;
}) {
  const { open, onClose, onCreate } = props;

  const [title, setTitle] = useState('');
  const [type, setType] = useState<NoteType>('md');

  const canCreate = useMemo(() => title.trim().length > 0, [title]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Новая заметка</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <TextField
          autoFocus
          fullWidth
          label="Название"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          margin="normal"
        />
        <TextField
          select
          fullWidth
          label="Тип"
          value={type}
          onChange={(e) => setType(e.target.value as NoteType)}
          margin="normal"
        >
          <MenuItem value="md">Markdown (.md)</MenuItem>
          <MenuItem value="txt">Text (.txt)</MenuItem>
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button
          variant="contained"
          disabled={!canCreate}
          onClick={async () => {
            await onCreate({ title: title.trim(), type });
            setTitle('');
            setType('md');
            onClose();
          }}
        >
          Создать
        </Button>
      </DialogActions>
    </Dialog>
  );
}
