import React from 'react';
import { Box, Paper } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import MapIcon from '@mui/icons-material/Map';
import ImportContactsIcon from '@mui/icons-material/ImportContacts';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

export const GlassCard: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  sx?: any;
  elevation?: number;
}> = ({ children, onClick, sx = {}, elevation = 0 }) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={elevation}
      onClick={onClick}
      sx={{
        background: `linear-gradient(135deg, 
          ${alpha(theme.palette.background.paper, 0.7)} 0%, 
          ${alpha(theme.palette.background.paper, 0.4)} 100%
        )`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
        borderRadius: 3,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          padding: '1px',
          background: `linear-gradient(135deg, 
            ${alpha(theme.palette.primary.main, 0.2)} 0%, 
            transparent 50%, 
            ${alpha(theme.palette.secondary.main, 0.1)} 100%
          )`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 0.4s ease',
        },
        '&:hover': {
          transform: 'translateY(-4px) scale(1.01)',
          borderColor: alpha(theme.palette.primary.main, 0.4),
          boxShadow: `
            0 20px 40px ${alpha(theme.palette.common.black, 0.3)},
            0 0 60px ${alpha(theme.palette.primary.main, 0.08)}
          `,
          '&::before': { opacity: 1 },
        },
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
};

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
