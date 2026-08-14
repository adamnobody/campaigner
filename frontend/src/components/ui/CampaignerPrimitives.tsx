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
  maxWidth = 1640,
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
          px: { xs: 2, md: 5, lg: 6 },
          pb: 9,
          minWidth: 0,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}

export const campaignerPageHeaderPt = { xs: 3, md: 4.25 } as const;

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
        gap: { xs: 2.5, md: 5 },
        pt: campaignerPageHeaderPt,
        pb: 2.75,
        borderBottom: (theme) => `1px solid ${theme.campaigner.surface.border}`,
      }}
    >
      <Box sx={{ minWidth: 0, flex: '1 1 340px' }}>
        {eyebrow ? (
          <Typography
            variant="overline"
            sx={{ display: 'block', color: 'text.disabled', pb: 1 }}
          >
            {eyebrow}
          </Typography>
        ) : null}
        <Typography variant="h2" sx={{ fontSize: { xs: '2.15rem', md: '2.5rem' }, lineHeight: 1.02 }}>
          {title}
        </Typography>
        {description ? (
          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: '0.84rem',
              lineHeight: 1.6,
              maxWidth: 560,
              pt: 1.25,
              textWrap: 'pretty',
            }}
          >
            {description}
          </Typography>
        ) : null}
      </Box>
      {actions ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', flexShrink: 0 }}>
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
