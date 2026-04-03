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

interface CreateWikiLinkDialogProps {
  open: boolean;
  onClose: () => void;
  wikiNotes: WikiNoteOption[];
  currentNoteId: number;
  onCreateLink: (target: WikiNoteOption, label: string) => void;
}

export const CreateWikiLinkDialog: React.FC<CreateWikiLinkDialogProps> = ({
  open, onClose, wikiNotes, currentNoteId, onCreateLink,
}) => {
  const [target, setTarget] = useState<WikiNoteOption | null>(null);
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (open) {
      setTarget(null);
      setLabel('');
    }
  }, [open]);

  const handleClose = () => {
    onClose();
  };

  const handleCreate = () => {
    if (!target) return;
    onCreateLink(target, label);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}
    >
      <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>Добавить связь</DialogTitle>
      <DialogContent>
        <Autocomplete
          options={wikiNotes.filter(n => n.id !== currentNoteId)}
          getOptionLabel={(opt) => opt.title}
          value={target}
          onChange={(_, val) => setTarget(val)}
          isOptionEqualToValue={(opt, val) => opt.id === val.id}
          renderInput={(params) => (
            <TextField {...params} label="Вики-статья *" margin="normal" placeholder="Выберите статью..." />
          )}
          noOptionsText="Нет статей"
        />
        <TextField
          fullWidth
          label="Описание связи (опционально)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          margin="normal"
          placeholder="напр. столица, союзник, часть..."
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">Отмена</Button>
        <DndButton variant="contained" onClick={handleCreate} disabled={!target}>
          Создать связь
        </DndButton>
      </DialogActions>
    </Dialog>
  );
};
