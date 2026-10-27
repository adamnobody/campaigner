import React from 'react';
import {
  Paper,
  alpha,
  useTheme,
  type SxProps,
  type Theme,
} from '@mui/material';

export const GlassCard: React.FC<{
  children: React.ReactNode;
  sx?: SxProps<Theme>;
  elevation?: number;
  interactive?: boolean;
  onClick?: (event: React.SyntheticEvent<HTMLElement>) => void;
}> = ({ children, sx = {}, elevation = 0, interactive = false, onClick }) => {
  const theme = useTheme();
  const isInteractive = interactive || !!onClick;
  const baseSx: SxProps<Theme> = {
    background: theme.campaigner.surface.subtle,
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    border: `1px solid ${theme.campaigner.surface.border}`,
    borderRadius: '14px',
    transition: theme.campaigner.motion.transition,
    position: 'relative',
    overflow: 'hidden',
    cursor: isInteractive ? 'pointer' : 'default',
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      padding: '1px',
      background: `linear-gradient(135deg,
        ${alpha(theme.palette.primary.main, 0.15)} 0%,
        transparent 50%
      )`,
      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
      WebkitMaskComposite: 'xor',
      maskComposite: 'exclude',
      pointerEvents: 'none',
      opacity: 0,
      transition: 'opacity 0.4s ease',
    },
    ...(isInteractive && {
      '&:hover': {
        transform: 'translateY(-1px)',
        borderColor: alpha(theme.palette.primary.main, 0.35),
        backgroundColor: alpha(theme.palette.common.white, 0.032),
        boxShadow: theme.campaigner.glow.strength === 0
          ? '0 14px 34px rgba(0,0,0,.2)'
          : `0 14px 34px rgba(0,0,0,.2), 0 0 30px ${alpha(theme.palette.primary.main, theme.campaigner.glow.strength * 0.5)}`,
        '&::before': { opacity: 1 },
      },
    }),
    ...(onClick && {
      '&:focus-visible': {
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: 2,
      },
    }),
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!onClick || event.currentTarget !== event.target) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(event);
    }
  };

  return (
    <Paper
      elevation={elevation}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
      sx={[baseSx, sx] as SxProps<Theme>}
    >
      {children}
    </Paper>
  );
};
