import React, { forwardRef } from 'react';
import { Button, ButtonProps, CircularProgress, useTheme } from '@mui/material';
import { isDesignSystemTheme } from '@/theme/designSystem';

interface DndButtonProps extends ButtonProps {
  loading?: boolean;
}

export const DndButton = forwardRef<HTMLButtonElement, DndButtonProps>(
  ({ loading, disabled, children, sx, ...props }, ref) => {
    const theme = useTheme();
    const isRedesign = isDesignSystemTheme(theme);

    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        sx={{
          fontFamily: isRedesign ? theme.campaigner.typography.body : '"Cinzel", "Georgia", serif',
          fontWeight: isRedesign ? 500 : 600,
          letterSpacing: isRedesign ? 0 : '0.05em',
          textTransform: isRedesign ? 'none' : 'uppercase',
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