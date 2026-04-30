import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  const { t } = useTranslation('common');
  const text = message ?? t('loading');
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="400px"
      gap={2}
    >
      <CircularProgress size={48} color="primary" />
      <Typography variant="body1" color="text.secondary">
        {text}
      </Typography>
    </Box>
  );
};