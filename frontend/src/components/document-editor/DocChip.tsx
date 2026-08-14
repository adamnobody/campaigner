import React from 'react';
import { ButtonBase, alpha, useTheme } from '@mui/material';

export function DocChip({
  label,
  active = false,
  muted = false,
  icon,
  onClick,
}: {
  label: string;
  active?: boolean;
  muted?: boolean;
  icon?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const theme = useTheme();
  const gold = !muted && active;
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        height: 26,
        px: 1.15,
        gap: 0.7,
        borderRadius: '999px',
        border: '1px solid',
        borderColor: gold
          ? alpha(theme.palette.primary.main, 0.55)
          : theme.campaigner.surface.border,
        color: gold ? 'primary.main' : 'text.secondary',
        backgroundColor: gold ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
        fontSize: '0.62rem',
        fontWeight: 600,
        letterSpacing: '.08em',
        textTransform: 'uppercase',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {icon}
      {label}
    </ButtonBase>
  );
}
