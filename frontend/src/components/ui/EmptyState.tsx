import React from 'react';
import {
  Box,
  Typography,
  Button,
  ButtonBase,
  alpha,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export interface EmptyStateTemplate {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  templatesTitle?: string;
  templates?: readonly EmptyStateTemplate[];
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  templatesTitle,
  templates = [],
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ mt: 3.5 }}>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="300px"
        sx={{
          px: { xs: 3, md: 4 },
          py: 6.5,
          textAlign: 'center',
          borderRadius: '14px',
          border: `1px dashed ${alpha(theme.palette.text.primary, 0.085)}`,
          backgroundColor: alpha(theme.palette.common.white, 0.013),
        }}
      >
        {icon ? (
          <Box
            sx={{
              color: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: '15px',
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
              '& .MuiSvgIcon-root': { fontSize: 26 },
            }}
          >
            {icon}
          </Box>
        ) : null}
        <Typography sx={{ mt: icon ? 2.5 : 0, fontSize: '0.97rem', fontWeight: 500 }}>
          {title}
        </Typography>
        {description ? (
          <Typography
            sx={{
              mt: 1,
              color: 'text.secondary',
              maxWidth: 400,
              fontSize: '0.81rem',
              lineHeight: 1.6,
              textWrap: 'pretty',
            }}
          >
            {description}
          </Typography>
        ) : null}
        {actionLabel && onAction ? (
          <Button
            variant="outlined"
            startIcon={actionIcon ?? (templates.length > 0 ? <AddIcon /> : undefined)}
            onClick={onAction}
            sx={{
              mt: 2.75,
              height: 38,
              px: 1.9,
              borderColor: alpha(theme.palette.text.primary, 0.1),
              color: 'text.primary',
              backgroundColor: alpha(theme.palette.common.white, 0.035),
            }}
          >
            {actionLabel}
          </Button>
        ) : null}
      </Box>

      {templates.length > 0 ? (
        <Box sx={{ mt: 4 }}>
          {templatesTitle ? (
            <Typography sx={{ fontSize: '0.94rem', fontWeight: 500 }}>
              {templatesTitle}
            </Typography>
          ) : null}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(3, minmax(0, 1fr))',
              },
              gap: 1.75,
              mt: templatesTitle ? 1.75 : 0,
            }}
          >
            {templates.map((template) => (
              <ButtonBase
                key={template.title}
                onClick={template.onClick}
                sx={{
                  minHeight: 128,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  gap: 1.25,
                  p: 2.25,
                  textAlign: 'left',
                  borderRadius: '13px',
                  border: `1px solid ${alpha(theme.palette.text.primary, 0.07)}`,
                  backgroundColor: alpha(theme.palette.common.white, 0.014),
                  transition: theme.campaigner.motion.transition,
                  '&:hover, &:focus-visible': {
                    borderColor: alpha(theme.palette.primary.main, 0.35),
                    backgroundColor: alpha(theme.palette.primary.main, 0.045),
                    outline: 'none',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '9px',
                    color: 'primary.main',
                    backgroundColor: alpha(theme.palette.primary.main, 0.09),
                    '& .MuiSvgIcon-root': { fontSize: 18 },
                  }}
                >
                  {template.icon}
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.84rem', fontWeight: 500 }}>
                    {template.title}
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.65,
                      color: 'text.secondary',
                      fontSize: '0.78rem',
                      lineHeight: 1.5,
                      textWrap: 'pretty',
                    }}
                  >
                    {template.description}
                  </Typography>
                </Box>
              </ButtonBase>
            ))}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
};
