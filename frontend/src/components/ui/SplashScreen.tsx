import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, LinearProgress, Fade } from '@mui/material';
import { SPLASH_TIP_KEYS } from '@/components/ui/splashTipKeys';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { t } = useTranslation('common');
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(
    () => Math.floor(Math.random() * SPLASH_TIP_KEYS.length)
  );
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onFinish, 300);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [onFinish]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % SPLASH_TIP_KEYS.length);
        setFadeIn(true);
      }, 400);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const tipKey = SPLASH_TIP_KEYS[tipIndex];

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a14 70%, #000 100%)',
      }}
    >
      <Typography
        sx={{
          fontFamily: '"Cinzel", "Georgia", serif',
          fontWeight: 700,
          fontSize: { xs: '2.5rem', md: '3.5rem' },
          color: '#fff',
          letterSpacing: '0.05em',
          textShadow: '0 0 40px rgba(255,255,255,0.15)',
          mb: 4,
        }}
      >
        {t('appName')}
      </Typography>

      <Box sx={{ width: { xs: '80%', md: '500px' }, mb: 3 }}>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 3,
            borderRadius: 2,
            backgroundColor: 'rgba(255,255,255,0.1)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 2,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.3) 0%, rgba(130,170,255,0.8) 50%, rgba(255,255,255,0.3) 100%)',
              boxShadow: '0 0 15px rgba(130,170,255,0.5)',
            },
          }}
        />
      </Box>

      <Typography
        variant="overline"
        sx={{
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.12em',
          mb: 1,
          fontSize: '0.7rem',
        }}
      >
        {t('splash.tipsHeading')}
      </Typography>

      <Box sx={{ minHeight: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: 560, px: 2 }}>
        <Fade in={fadeIn} timeout={400}>
          <Typography
            variant="body2"
            key={tipKey}
            sx={{
              color: 'rgba(255,255,255,0.65)',
              textAlign: 'center',
              fontSize: '0.9rem',
              lineHeight: 1.45,
            }}
          >
            {t(`splash.tips.${tipKey}`)}
          </Typography>
        </Fade>
      </Box>
    </Box>
  );
};
