import React from 'react';
import {
  Box,
  Typography,
  alpha,
  useTheme,
  type BoxProps,
  type SxProps,
  type Theme,
} from '@mui/material';

export function CampaignerPage({
  children,
  maxWidth = 1120,
  sx,
}: {
  children: React.ReactNode;
  maxWidth?: number | string;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box
      sx={[
        {
          width: '100%',
          maxWidth,
          mx: 'auto',
          px: { xs: 2, md: 5 },
          pb: 6,
          minWidth: 0,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}

export function CampaignerPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: { xs: 'flex-start', md: 'flex-end' },
        justifyContent: 'space-between',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2.5,
        py: { xs: 3, md: 4 },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {eyebrow ? (
          <Typography
            variant="overline"
            sx={{ display: 'block', color: 'primary.main', pb: 1.25 }}
          >
            {eyebrow}
          </Typography>
        ) : null}
        <Typography variant="h2" sx={{ fontSize: { xs: '2.15rem', md: '2.9rem' } }}>
          {title}
        </Typography>
        {description ? (
          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: '0.94rem',
              lineHeight: 1.75,
              maxWidth: 660,
              pt: 1.5,
            }}
          >
            {description}
          </Typography>
        ) : null}
      </Box>
      {actions ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {actions}
        </Box>
      ) : null}
    </Box>
  );
}

export function CampaignerSurface({ sx, ...props }: BoxProps) {
  const theme = useTheme();
  return (
    <Box
      {...props}
      sx={[
        {
          border: `1px solid ${theme.campaigner.surface.border}`,
          borderRadius: '14px',
          backgroundColor: theme.campaigner.surface.subtle,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}

export function CampaignerFieldRow({
  label,
  hint,
  children,
  sx,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}) {
  const theme = useTheme();
  return (
    <Box
      sx={[
        {
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '168px minmax(0, 1fr)' },
          gap: { xs: 1, md: 2.5 },
          alignItems: 'center',
          minHeight: 54,
          px: 2.25,
          py: 1.25,
          backgroundColor: alpha(theme.palette.common.white, 0.022),
          '& + &': {
            borderTop: `1px solid ${theme.campaigner.surface.border}`,
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box>
        <Typography sx={{ fontSize: '0.81rem', fontWeight: 400 }}>{label}</Typography>
        {hint ? (
          <Typography sx={{ color: 'text.secondary', fontSize: '0.7rem', pt: 0.35 }}>
            {hint}
          </Typography>
        ) : null}
      </Box>
      <Box sx={{ minWidth: 0 }}>{children}</Box>
    </Box>
  );
}
