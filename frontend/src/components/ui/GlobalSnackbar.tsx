import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useUIStore } from '@/store/useUIStore';

export const GlobalSnackbar: React.FC = () => {
  const { snackbar, hideSnackbar } = useUIStore();

  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={4000}
      onClose={hideSnackbar}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={hideSnackbar}
        severity={snackbar.severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
};