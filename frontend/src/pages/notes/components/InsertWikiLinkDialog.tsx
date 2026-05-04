import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Autocomplete,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['notes', 'common']);
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
        {t('notes:wikiDialogs.insertTitle')}
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
              label={t('notes:wikiDialogs.insertArticleLabel')}
              margin="normal"
              placeholder={t('notes:wikiDialogs.insertArticlePlaceholder')}
            />
          )}
          noOptionsText={t('notes:wikiDialogs.insertNoOptions')}
        />

        <TextField
          fullWidth
          label={t('notes:wikiDialogs.insertLinkTextLabel')}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          margin="normal"
          placeholder={t('notes:wikiDialogs.insertLinkTextPlaceholder')}
          helperText={t('notes:wikiDialogs.insertLinkTextHelper')}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          {t('common:cancel')}
        </Button>
        <DndButton variant="contained" onClick={handleInsert} disabled={!target}>
          {t('notes:wikiDialogs.insertSubmit')}
        </DndButton>
      </DialogActions>
    </Dialog>
  );
};
