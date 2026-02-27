import React from 'react';
import { Button, ButtonProps, CircularProgress } from '@mui/material';

interface DndButtonProps extends ButtonProps {
  loading?: boolean;
}

export const DndButton: React.FC<DndButtonProps> = ({ loading, disabled, children, ...props }) => {
  return (
    <Button
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : null}
      {children}
    </Button>
  );
};