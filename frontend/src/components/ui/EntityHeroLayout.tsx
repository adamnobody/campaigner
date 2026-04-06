import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';

interface EntityHeroLayoutProps {
  bannerUrl?: string | null;
  avatarNode?: React.ReactNode;
  title: string;
  subtitle?: string;
  actionButtons?: React.ReactNode;
}

export const EntityHeroLayout: React.FC<EntityHeroLayoutProps> = ({
  bannerUrl,
  avatarNode,
  title,
  subtitle,
  actionButtons,
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 4, position: 'relative' }}>
      {/* Banner */}
      <Box
        sx={{
          position: 'relative',
          height: 240,
          mx: { xs: -2, md: -3 },
          mt: { xs: -2, md: -3 },
          mb: 3,
          borderRadius: { xs: 0, md: '0 0 16px 16px' },
          overflow: 'hidden',
          backgroundColor: alpha(theme.palette.primary.main, 0.05),
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '70%',
            background: `linear-gradient(transparent, ${theme.palette.background.default})`,
          },
        }}
      >
        {bannerUrl && (
          <Box
            component="img"
            src={bannerUrl}
            alt="Banner"
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </Box>

      {/* Content over banner */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'center', md: 'flex-end' },
          justifyContent: 'space-between',
          gap: 3,
          px: { xs: 1, md: 2 },
          mt: -10,
          position: 'relative',
          zIndex: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'center', md: 'flex-end' },
            gap: 3,
            textAlign: { xs: 'center', md: 'left' },
          }}
        >
          {avatarNode && (
            <Box
              sx={{
                p: 0.5,
                borderRadius: 4,
                backgroundColor: theme.palette.background.paper,
                boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.4)}`,
              }}
            >
              {avatarNode}
            </Box>
          )}
          <Box sx={{ mb: 1 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: theme.palette.text.primary,
                lineHeight: 1.1,
                mb: 0.5,
                textShadow: `0 2px 10px ${alpha(theme.palette.common.black, 0.5)}`,
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="subtitle1"
                sx={{
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                  fontStyle: 'italic',
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        {actionButtons && (
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            {actionButtons}
          </Box>
        )}
      </Box>
    </Box>
  );
};
