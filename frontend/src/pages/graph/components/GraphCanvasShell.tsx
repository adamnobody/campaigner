import React from 'react';
import { Box, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';

type Props = {
  children: React.ReactNode;
};

/**
 * Обёртка холста: градиент, лёгкая сетка, рамка. Содержимое (canvas) поверх декора.
 */
export const GraphCanvasShell: React.FC<Props> = ({ children }) => {
  const theme = useTheme();
  const gridColor = alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.35 : 0.55);

  return (
    <Box
      sx={{
        position: 'relative',
        flex: 1,
        minWidth: 0,
        minHeight: { xs: 320, md: 0 },
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.divider, 0.85)}`,
        backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.25) : theme.palette.background.default,
        backgroundImage: `
          radial-gradient(ellipse 100% 70% at 50% 38%, ${alpha(theme.palette.primary.main, 0.07)} 0%, transparent 52%),
          linear-gradient(165deg, ${alpha(theme.palette.background.paper, 0.5)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)
        `,
        boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.common.white, theme.palette.mode === 'dark' ? 0.04 : 0.06)}`,
        touchAction: 'none',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          opacity: theme.palette.mode === 'dark' ? 0.28 : 0.4,
          pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(${gridColor} 1px, transparent 1px),
            linear-gradient(90deg, ${gridColor} 1px, transparent 1px)
          `,
          backgroundSize: '28px 28px',
        },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, width: '100%' }}>{children}</Box>
    </Box>
  );
};
