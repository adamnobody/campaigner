import React, { forwardRef } from 'react';
import { Button, ButtonProps, CircularProgress, useTheme } from '@mui/material';

interface DndButtonProps extends ButtonProps {
  loading?: boolean;
}

export const DndButton = forwardRef<HTMLButtonElement, DndButtonProps>(
  ({ loading, disabled, children, sx, ...props }, ref) => {
    const theme = useTheme();

    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        sx={{
          fontFamily: theme.campaigner.typography.body,
          fontWeight: 500,
          letterSpacing: 0,
          textTransform: 'none',
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