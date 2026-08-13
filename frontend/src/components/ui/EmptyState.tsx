import React from 'react';
import { Box, Typography, Button, alpha, useTheme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  const theme = useTheme();

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="280px"
      gap={1.5}
      sx={{ 
        p: 4,
        textAlign: 'center',
        borderRadius: '16px',
        border: '1px dashed rgba(255,255,255,.13)',
        backgroundColor: alpha(theme.palette.common.white, 0.012),
      }}
    >
      {icon && (
        <Box 
          sx={{ 
            fontSize: 48, 
            color: theme.palette.primary.main, 
            opacity: 0.55,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: 80,
            borderRadius: '14px',
            backgroundColor: alpha(theme.palette.primary.main, 0.06),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
            mb: 1
          }}
        >
          {icon}
        </Box>
      )}
      <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" maxWidth={400}>
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={onAction}
          sx={{ mt: 2, borderColor: alpha(theme.palette.primary.main, 0.5) }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};
