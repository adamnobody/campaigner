import React from 'react';
import { Paper, alpha, useTheme } from '@mui/material';
import { isDesignSystemTheme } from '@/theme/designSystem';

export const GlassCard: React.FC<{
  children: React.ReactNode;
  sx?: any;
  elevation?: number;
  interactive?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}> = ({ children, sx = {}, elevation = 0, interactive = false, onClick }) => {
  const theme = useTheme();
  const isInteractive = interactive || !!onClick;
  const isRedesign = isDesignSystemTheme(theme);

  return (
    <Paper
      elevation={elevation}
      onClick={onClick}
      sx={{
        background: isRedesign
          ? theme.campaigner.surface.subtle
          : `linear-gradient(135deg,
              ${alpha(theme.palette.background.paper, 0.75)} 0%,
              ${alpha(theme.palette.background.paper, 0.45)} 100%
            )`,
        backdropFilter: isRedesign ? 'none' : 'blur(20px)',
        WebkitBackdropFilter: isRedesign ? 'none' : 'blur(20px)',
        border: isRedesign
          ? `1px solid ${theme.campaigner.surface.border}`
          : `1px solid ${alpha(theme.palette.divider, 0.25)}`,
        borderRadius: isRedesign ? '14px' : 3,
        transition: isRedesign
          ? 'border-color 160ms ease, background-color 160ms ease, transform 160ms ease'
          : 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
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
            transform: isRedesign ? 'translateY(-1px)' : 'translateY(-2px)',
            borderColor: alpha(theme.palette.primary.main, 0.35),
            backgroundColor: isRedesign ? alpha(theme.palette.common.white, 0.032) : undefined,
            boxShadow: isRedesign
              ? '0 14px 34px rgba(0,0,0,.2)'
              : `0 12px 28px ${alpha(theme.palette.common.black, 0.25)},
                 0 0 40px ${alpha(theme.palette.primary.main, 0.06)}`,
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
