import React from 'react';
import { Box, Typography, alpha } from '@mui/material';

export const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}> = ({ icon, title, subtitle }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: 2,
        bgcolor: 'primary.main',
        color: '#fff',
        boxShadow: (t: any) => `0 4px 12px ${alpha(t.palette.primary.main, 0.3)}`,
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography
        variant="h6"
        sx={{
          fontFamily: '"Cinzel", serif',
          fontWeight: 700,
          fontSize: '1.15rem',
          lineHeight: 1.2,
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  </Box>
);
