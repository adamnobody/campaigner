import React from 'react';
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
          Cancel
        </Button>
        <Button onClick={handleConfirm} variant="contained" color="error">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};