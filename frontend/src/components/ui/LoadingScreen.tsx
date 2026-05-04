import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, CircularProgress, Typography, Fade } from '@mui/material';
import { SPLASH_TIP_KEYS } from '@/components/ui/splashTipKeys';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  const { t } = useTranslation('common');
  const text = message ?? t('loading');
  const [tipIndex, setTipIndex] = useState(
    () => Math.floor(Math.random() * SPLASH_TIP_KEYS.length)
  );
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % SPLASH_TIP_KEYS.length);
        setFadeIn(true);
      }, 280);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const tipKey = SPLASH_TIP_KEYS[tipIndex];

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="400px"
      gap={2}
      px={2}
    >
      <CircularProgress size={48} color="primary" />
      <Typography variant="body1" color="text.secondary">
        {text}
      </Typography>
      <Box sx={{ maxWidth: 480, textAlign: 'center', minHeight: 64 }}>
        <Typography variant="overline" color="text.disabled" sx={{ letterSpacing: '0.1em' }}>
          {t('splash.tipsHeading')}
        </Typography>
        <Fade in={fadeIn} timeout={280}>
          <Typography
            key={tipKey}
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, lineHeight: 1.45 }}
          >
            {t(`splash.tips.${tipKey}`)}
          </Typography>
        </Fade>
      </Box>
    </Box>
  );
};
