import React from 'react';
import { Box } from '@mui/material';

interface PositionProps {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

export const FloatingOrb: React.FC<{
  color: string;
  size?: number;
  delay?: number;
} & PositionProps> = ({
  color,
  size = 300,
  top,
  right,
  bottom,
  left,
  delay = 0,
}) => (
  <Box
    sx={{
      position: 'absolute',
      width: size,
      height: size,
      ...(top && { top }),
      ...(right && { right }),
      ...(bottom && { bottom }),
      ...(left && { left }),
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      transform: 'scale(1)',
      opacity: 0.3,
      animation: `gentleFloat ${10 + delay}s ease-in-out infinite`,
      pointerEvents: 'none',
      zIndex: 0,
      '@keyframes gentleFloat': {
        '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
        '50%': { transform: 'translate(-15px, 15px) scale(1.05)' },
      },
    }}
  />
);
