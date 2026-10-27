import React, { useCallback, useEffect } from 'react';
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

  const handleConfirm = useCallback(() => {
    confirmDialog.onConfirm?.();
    hideConfirmDialog();
  }, [confirmDialog.onConfirm, hideConfirmDialog]);

  useEffect(() => {
    if (!confirmDialog.open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.defaultPrevented) return;
      if (event.isComposing) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      event.preventDefault();
      handleConfirm();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmDialog.open, handleConfirm]);

  return (
    <Dialog
      open={confirmDialog.open}
      onClose={hideConfirmDialog}
      PaperProps={{
        sx: { minWidth: 400 },
      }}
    >
      <DialogTitle sx={{
        fontFamily: (theme) => theme.campaigner.profile === 'design-system'
          ? theme.campaigner.typography.display
          : '"Cinzel", serif',
      }}>
        {confirmDialog.title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>{confirmDialog.message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={hideConfirmDialog} color="inherit">
          {t('cancel')}
        </Button>
        <Button onClick={handleConfirm} variant="contained" color="error" autoFocus>
          {t('confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};