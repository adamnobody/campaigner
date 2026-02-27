import React, { forwardRef } from 'react';
import { Button, ButtonProps, CircularProgress } from '@mui/material';

interface DndButtonProps extends ButtonProps {
  loading?: boolean;
}

export const DndButton = forwardRef<HTMLButtonElement, DndButtonProps>(
  ({ loading, disabled, children, sx, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        sx={{
          fontFamily: '"Cinzel", "Georgia", serif',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          ...sx,
        }}
        {...props}
      >
        {loading ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : null}
        {children}
      </Button>
    );
  }
);

DndButton.displayName = 'DndButton';