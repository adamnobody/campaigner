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
      minHeight="240px"
      gap={2}
      sx={{ 
        p: 4,
        textAlign: 'center',
        borderRadius: 3,
        border: `1px dashed ${alpha(theme.palette.divider, 0.5)}`,
        backgroundColor: alpha(theme.palette.background.paper, 0.3),
      }}
    >
      {icon && (
        <Box 
          sx={{ 
            fontSize: 48, 
            color: theme.palette.primary.main, 
            opacity: 0.8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
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
