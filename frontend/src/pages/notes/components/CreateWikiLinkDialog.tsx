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
  const { t } = useTranslation(['notes', 'common']);
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
      <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>{t('notes:wikiDialogs.createTitle')}</DialogTitle>
      <DialogContent>
        <Autocomplete
          options={wikiNotes.filter(n => n.id !== currentNoteId)}
          getOptionLabel={(opt) => opt.title}
          value={target}
          onChange={(_, val) => setTarget(val)}
          isOptionEqualToValue={(opt, val) => opt.id === val.id}
          renderInput={(params) => (
            <TextField {...params} label={t('notes:wikiDialogs.createArticleLabel')} margin="normal" placeholder={t('notes:wikiDialogs.createArticlePlaceholder')} />
          )}
          noOptionsText={t('notes:wikiDialogs.createNoOptions')}
        />
        <TextField
          fullWidth
          label={t('notes:wikiDialogs.createLabelField')}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          margin="normal"
          placeholder={t('notes:wikiDialogs.createLabelPlaceholder')}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">{t('common:cancel')}</Button>
        <DndButton variant="contained" onClick={handleCreate} disabled={!target}>
          {t('notes:wikiDialogs.createSubmit')}
        </DndButton>
      </DialogActions>
    </Dialog>
  );
};
