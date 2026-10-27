import React from 'react';
import { Box, Typography, alpha, useTheme } from '@mui/material';

export const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}> = ({ icon, title, subtitle }) => {
  const theme = useTheme();

  return (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 34,
        height: 34,
        borderRadius: '9px',
        bgcolor: alpha(theme.palette.primary.main, 0.09),
        color: 'primary.main',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        boxShadow: 'none',
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography
        variant="h6"
        sx={{
          fontFamily: theme.campaigner.typography.display,
          fontWeight: 600,
          fontSize: '1.15rem',
          lineHeight: 1.2,
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          variant="caption"
          sx={{ color: (theme) => alpha(theme.palette.text.secondary, 0.95), fontSize: '0.84rem', lineHeight: 1.45 }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  </Box>
  );
};
