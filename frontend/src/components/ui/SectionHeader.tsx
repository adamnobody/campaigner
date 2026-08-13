import React from 'react';
import { Box, Typography, alpha, useTheme } from '@mui/material';
import { isDesignSystemTheme } from '@/theme/designSystem';

export const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}> = ({ icon, title, subtitle }) => {
  const theme = useTheme();
  const isRedesign = isDesignSystemTheme(theme);

  return (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: isRedesign ? 34 : 40,
        height: isRedesign ? 34 : 40,
        borderRadius: isRedesign ? '9px' : 2,
        bgcolor: isRedesign ? alpha(theme.palette.primary.main, 0.09) : 'primary.main',
        color: isRedesign ? 'primary.main' : '#fff',
        border: isRedesign ? `1px solid ${alpha(theme.palette.primary.main, 0.2)}` : 'none',
        boxShadow: isRedesign ? 'none' : `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography
        variant="h6"
        sx={{
          fontFamily: isRedesign ? theme.campaigner.typography.display : '"Cinzel", serif',
          fontWeight: isRedesign ? 600 : 700,
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
