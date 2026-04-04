import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Autocomplete,
} from '@mui/material';
import { DndButton } from '@/components/ui/DndButton';

interface WikiNoteOption {
  id: number;
  title: string;
}

interface InsertWikiLinkDialogProps {
  open: boolean;
  onClose: () => void;
  wikiNotes: WikiNoteOption[];
  currentNoteId: number;
  initialLabel: string;
  onInsert: (target: WikiNoteOption, label: string) => void;
}

export const InsertWikiLinkDialog: React.FC<InsertWikiLinkDialogProps> = ({
  open, onClose, wikiNotes, currentNoteId, initialLabel, onInsert,
}) => {
  const [target, setTarget] = useState<WikiNoteOption | null>(null);
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (open) {
      setTarget(null);
      setLabel(initialLabel);
    }
  }, [open, initialLabel]);

  const handleClose = () => {
    onClose();
  };

  const handleInsert = () => {
    if (!target) return;
    onInsert(target, label);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}
    >
      <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>
        Вставить вики-ссылку
      </DialogTitle>
      <DialogContent>
        <Autocomplete
          options={wikiNotes.filter((n) => n.id !== currentNoteId)}
          getOptionLabel={(opt) => opt.title}
          value={target}
          onChange={(_, val) => {
            setTarget(val);
            if (val && !label.trim()) {
              setLabel(val.title);
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
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          margin="normal"
          placeholder="Текст, который будет показан в статье"
          helperText="В текст будет вставлена markdown-ссылка на внутреннюю статью"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Отмена
        </Button>
        <DndButton variant="contained" onClick={handleInsert} disabled={!target}>
          Вставить
        </DndButton>
      </DialogActions>
    </Dialog>
  );
};
