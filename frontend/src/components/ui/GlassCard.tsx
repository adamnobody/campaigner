import React from 'react';
import { Paper, alpha, useTheme } from '@mui/material';

export const GlassCard: React.FC<{
  children: React.ReactNode;
  sx?: any;
  elevation?: number;
  interactive?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}> = ({ children, sx = {}, elevation = 0, interactive = false, onClick }) => {
  const theme = useTheme();
  const isInteractive = interactive || !!onClick;

  return (
    <Paper
      elevation={elevation}
      onClick={onClick}
      sx={{
        background: `linear-gradient(135deg, 
          ${alpha(theme.palette.background.paper, 0.75)} 0%, 
          ${alpha(theme.palette.background.paper, 0.45)} 100%
        )`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.25)}`,
        borderRadius: 3,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
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
            transform: 'translateY(-2px)',
            borderColor: alpha(theme.palette.primary.main, 0.35),
            boxShadow: `
              0 12px 28px ${alpha(theme.palette.common.black, 0.25)},
              0 0 40px ${alpha(theme.palette.primary.main, 0.06)}
            `,
            '&::before': { opacity: 1 },
          },
        }),
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
};
