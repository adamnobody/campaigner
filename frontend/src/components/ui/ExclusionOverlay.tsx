import React from 'react';
import { Box, Tooltip } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';

interface ExclusionOverlayProps {
  tooltip: string;
  borderRadius?: number | string;
}

export const ExclusionOverlay: React.FC<ExclusionOverlayProps> = ({ tooltip, borderRadius = 2 }) => {
  return (
    <Tooltip title={tooltip}>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius,
          zIndex: 12,
          bgcolor: 'rgba(220, 38, 38, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          '@keyframes exclusionPulse': {
            '0%': { opacity: 0.25 },
            '50%': { opacity: 0.5 },
            '100%': { opacity: 0.25 },
          },
          animation: 'exclusionPulse 2s ease-in-out infinite',
        }}
      >
        <BlockIcon
          sx={{
            fontSize: 40,
            color: '#fff',
            filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.6))',
          }}
        />
      </Box>
    </Tooltip>
  );
};
