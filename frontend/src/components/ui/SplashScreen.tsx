import React, { useEffect, useState } from 'react';
import { Box, Typography, LinearProgress, Fade } from '@mui/material';

const quotes = [
  'Описание начинается в воображении писателя, но должно заканчиваться в воображении читателя',
  'Упс... Похоже, мои плохие идеи работают лучше, чем хорошие.',
  'Не забывайте почаще спать.',
  'Всё, что мне нужно, — это лист бумаги и что-нибудь, на чём можно писать, и тогда я смогу перевернуть мир с ног на голову',
  'Писатель талантлив, если он умеет представить новое привычным, а привычное новым',
];

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  // Progress bar animation
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
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

  // Rotating quotes
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setQuoteIndex(prev => (prev + 1) % quotes.length);
        setFadeIn(true);
      }, 400);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

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
      {/* Title */}
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
        Campaigner
      </Typography>

      {/* Progress bar */}
      <Box sx={{ width: { xs: '80%', md: '500px' }, mb: 4 }}>
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

      {/* Quote */}
      <Box sx={{ height: 60, display: 'flex', alignItems: 'center' }}>
        <Fade in={fadeIn} timeout={400}>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.45)',
              fontStyle: 'italic',
              textAlign: 'center',
              maxWidth: 500,
              px: 2,
              fontSize: '0.85rem',
            }}
          >
            {quotes[quoteIndex]}
          </Typography>
        </Fade>
      </Box>
    </Box>
  );
};