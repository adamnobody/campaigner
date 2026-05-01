import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { useUIStore } from '@/store/useUIStore';

export const ConfirmDialog: React.FC = () => {
  const { t } = useTranslation('common');
  const { confirmDialog, hideConfirmDialog } = useUIStore();

  const handleConfirm = () => {
    confirmDialog.onConfirm?.();
    hideConfirmDialog();
  };

  return (
    <Dialog
      open={confirmDialog.open}
      onClose={hideConfirmDialog}
      PaperProps={{
        sx: { minWidth: 400 },
      }}
    >
      <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>
        {confirmDialog.title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>{confirmDialog.message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={hideConfirmDialog} color="inherit">
          {t('cancel')}
        </Button>
        <Button onClick={handleConfirm} variant="contained" color="error">
          {t('confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};