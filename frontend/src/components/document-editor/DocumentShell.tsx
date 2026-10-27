import React from 'react';
import { Box, Typography, alpha, useTheme } from '@mui/material';

export function DocumentShell({
  children,
  inspector,
  focus,
  maxWidth = 760,
}: {
  children: React.ReactNode;
  inspector: React.ReactNode;
  focus?: boolean;
  maxWidth?: number;
}) {
  return (
    <Box sx={{ flex: 1, minHeight: 0, height: '100%', display: 'flex', overflow: 'hidden' }}>
      <Box sx={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
        <Box sx={{ width: '100%', maxWidth, mx: 'auto', px: { xs: 2.5, md: 4 }, py: { xs: 4, md: 5.5 } }}>
          {children}
        </Box>
      </Box>
      {focus ? null : inspector}
    </Box>
  );
}

export function Inspector({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Box
      component="aside"
      sx={{
        width: { xs: 0, md: 300 },
        display: { xs: 'none', md: 'block' },
        flexShrink: 0,
        height: '100%',
        overflow: 'auto',
        borderLeft: `1px solid ${theme.campaigner.surface.border}`,
        px: 2.25,
        py: 2.75,
      }}
    >
      {children}
    </Box>
  );
}

export function InspectorEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{
        color: 'primary.main',
        fontFamily: (theme) => theme.campaigner.typography.mono,
        fontSize: '0.62rem',
        letterSpacing: '.18em',
        textTransform: 'uppercase',
        pb: 2,
      }}
    >
      {children}
    </Typography>
  );
}

export function InspectorSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ pb: 2.75 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, pb: 1.25 }}>
        <Typography
          sx={{
            color: 'text.disabled',
            fontFamily: (theme) => theme.campaigner.typography.mono,
            fontSize: '0.6rem',
            letterSpacing: '.16em',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </Typography>
        {action}
      </Box>
      {children}
    </Box>
  );
}

export function InspectorStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.35 }}>
      <Typography sx={{ color: 'text.disabled', fontSize: '0.78rem' }}>{label}</Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem', textAlign: 'right' }}>{value}</Typography>
    </Box>
  );
}

export function InspectorHint({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: '10px',
        backgroundColor: alpha(theme.palette.common.white, 0.025),
        color: 'text.secondary',
        fontSize: '0.75rem',
        lineHeight: 1.55,
      }}
    >
      {children}
    </Box>
  );
}
