import React from 'react';
import { Box } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import ImportContactsIcon from '@mui/icons-material/ImportContacts';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

export const EmptyStateIllustration: React.FC = () => (
  <Box
    sx={{
      position: 'relative',
      width: 280,
      height: 220,
      mx: 'auto',
      mb: 3,
    }}
  >
    {/* Central Book */}
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '6rem',
        color: 'primary.main',
        opacity: 0.15,
        animation: 'bookPulse 4s ease-in-out infinite',
        '@keyframes bookPulse': {
          '0%, 100%': { transform: 'translate(-50%, -50%) scale(1)' },
          '50%': { transform: 'translate(-50%, -50%) scale(1.05)' },
        },
      }}
    >
      <ImportContactsIcon sx={{ fontSize: 'inherit' }} />
    </Box>

    {/* Orbiting Icons */}
    <Box
      sx={{
        position: 'absolute',
        top: '10%',
        left: '20%',
        fontSize: '2.5rem',
        color: 'secondary.main',
        opacity: 0.2,
        animation: 'orbit1 8s linear infinite',
        '@keyframes orbit1': {
          '0%': { transform: 'rotate(0deg) translateX(90px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(90px) rotate(-360deg)' },
        },
      }}
    >
      <MapIcon />
    </Box>

    <Box
      sx={{
        position: 'absolute',
        bottom: '15%',
        right: '15%',
        fontSize: '2rem',
        color: 'primary.main',
        opacity: 0.2,
        animation: 'orbit2 10s linear infinite reverse',
        '@keyframes orbit2': {
          '0%': { transform: 'rotate(0deg) translateX(75px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(75px) rotate(-360deg)' },
        },
      }}
    >
      <AccountTreeIcon />
    </Box>

    {/* Sparkles */}
    {[...Array(6)].map((_, i) => (
      <Box
        key={i}
        sx={{
          position: 'absolute',
          width: 4,
          height: 4,
          borderRadius: '50%',
          backgroundColor: 'primary.main',
          top: `${20 + Math.random() * 60}%`,
          left: `${20 + Math.random() * 60}%`,
          opacity: 0.4,
          animation: `sparkle ${2 + i * 0.5}s ease-in-out infinite`,
          animationDelay: `${i * 0.3}s`,
          '@keyframes sparkle': {
            '0%, 100%': { opacity: 0.2, transform: 'scale(1)' },
            '50%': { opacity: 0.8, transform: 'scale(1.5)' },
          },
        }}
      />
    ))}
  </Box>
);
