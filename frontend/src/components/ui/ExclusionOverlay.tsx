import React from 'react';
import { Box, Tooltip, alpha, useTheme } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';

interface ExclusionOverlayProps {
  tooltip: string;
  borderRadius?: number | string;
}

export const ExclusionOverlay: React.FC<ExclusionOverlayProps> = ({ tooltip, borderRadius = 2 }) => {
  const theme = useTheme();
  return (
    <Tooltip title={tooltip}>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius,
          zIndex: 12,
          bgcolor: alpha(theme.palette.error.main, 0.2),
          backgroundImage: `repeating-linear-gradient(135deg, transparent 0 9px, ${alpha(theme.palette.error.main, 0.12)} 9px 10px)`,
          border: `1px solid ${alpha(theme.palette.error.main, 0.4)}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          '@keyframes exclusionPulse': {
            '0%': { opacity: 0.72 },
            '50%': { opacity: 1 },
            '100%': { opacity: 0.72 },
          },
          animation: 'exclusionPulse 2.8s ease-in-out infinite',
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }}
      >
        <BlockIcon
          sx={{
            fontSize: 34,
            color: theme.palette.error.light,
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.7))',
          }}
        />
      </Box>
    </Tooltip>
  );
};
