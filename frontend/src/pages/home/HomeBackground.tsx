import React from 'react';
import { Box, Fade } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MapIcon from '@mui/icons-material/Map';

interface PositionProps {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

const AnimatedGradientOrb: React.FC<
  { color: string; size?: number; delay?: number } & PositionProps
> = ({ color, size = 400, top, right, bottom, left, delay = 0 }) => (
  <Box
    sx={{
      position: 'absolute',
      width: size,
      height: size,
      ...(top && { top }),
      ...(right && { right }),
      ...(bottom && { bottom }),
      ...(left && { left }),
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      filter: 'blur(60px)',
      opacity: 0.4,
      animation: `float ${8 + delay}s ease-in-out infinite`,
      pointerEvents: 'none',
      zIndex: 0,
      '@keyframes float': {
        '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
        '33%': { transform: 'translate(30px, -30px) scale(1.05)' },
        '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
      },
    }}
  />
);

const MagicParticles: React.FC = () => (
  <Box
    sx={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 0,
      overflow: 'hidden',
      '&::before, &::after': {
        content: '""',
        position: 'absolute',
        width: '2px',
        height: '2px',
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: '50%',
        boxShadow: `
          100px 200px 0 0 rgba(201,169,89,0.8),
          300px 100px 0 0 rgba(155,124,255,0.6),
          500px 300px 0 0 rgba(78,205,196,0.7),
          700px 150px 0 0 rgba(214,93,93,0.5),
          200px 500px 0 0 rgba(80,200,120,0.6),
          600px 450px 0 0 rgba(230,162,60,0.7),
          900px 250px 0 0 rgba(214,132,164,0.5)
        `,
        animation: 'twinkle 12s ease-in-out infinite alternate',
      },
      '&::after': {
        boxShadow: `
          150px 350px 0 0 rgba(201,169,89,0.5),
          400px 250px 0 0 rgba(96,122,255,0.7),
          650px 400px 0 0 rgba(180,190,210,0.6),
          850px 350px 0 0 rgba(90,170,160,0.5),
          250px 150px 0 0 rgba(214,93,93,0.4)
        `,
        animationDelay: '6s',
      },
      '@keyframes twinkle': {
        '0%': { opacity: 0.3, transform: 'scale(1)' },
        '100%': { opacity: 1, transform: 'scale(1.2)' },
      },
    }}
  />
);

const FloatingIcon: React.FC<{
  icon: React.ReactNode;
  position: PositionProps;
  delay?: number;
}> = ({ icon, position, delay = 0 }) => (
  <Box
    sx={{
      position: 'absolute',
      ...position,
      opacity: 0.08,
      fontSize: '8rem',
      color: 'primary.main',
      animation: `gentleFloat ${10 + delay}s ease-in-out infinite`,
      pointerEvents: 'none',
      zIndex: 0,
      '@keyframes gentleFloat': {
        '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
        '50%': { transform: 'translateY(-20px) rotate(3deg)' },
      },
    }}
  >
    {icon}
  </Box>
);

export interface HomeBackgroundProps {
  homeBackgroundImage: string | null;
  homeBackgroundOpacity: number;
  parallaxLayerRef?: React.RefObject<HTMLDivElement | null>;
}

export const HomeBackground: React.FC<HomeBackgroundProps> = ({
  homeBackgroundImage,
  homeBackgroundOpacity,
  parallaxLayerRef,
}) => {
  const theme = useTheme();

  return (
    <>
      {/* Custom Background Image */}
      {homeBackgroundImage && (
        <Fade in={!!homeBackgroundImage} timeout={1000}>
          <Box
            ref={parallaxLayerRef}
            sx={{
              position: 'fixed',
              top: -20,
              left: -20,
              width: 'calc(100% + 40px)',
              height: 'calc(100% + 40px)',
              zIndex: 0,
              pointerEvents: 'none',
              backgroundImage: `url(${homeBackgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: homeBackgroundOpacity,
              transform: 'translate3d(0px, 0px, 0px)',
              transition: 'opacity 1s ease, transform 200ms ease-out',
              '@media (hover: none)': {
                transform: 'translate3d(0px, 0px, 0px) !important',
              },
            }}
          />
        </Fade>
      )}

      {/* Animated Gradient Orbs */}
      <AnimatedGradientOrb
        color={alpha(theme.palette.primary.main, 0.3)}
        size={500}
        top="10%"
        left="15%"
      />
      <AnimatedGradientOrb
        color={alpha(theme.palette.secondary.main, 0.2)}
        size={400}
        top="60%"
        right="10%"
        delay={2}
      />
      <AnimatedGradientOrb
        color={alpha(theme.palette.primary.main, 0.15)}
        size={300}
        bottom="20%"
        left="40%"
        delay={4}
      />

      {/* Magic Particles Effect */}
      <MagicParticles />

      {/* Floating Decorative Icons */}
      <FloatingIcon icon={<AutoAwesomeIcon />} position={{ top: '15%', right: '10%' }} delay={0} />
      <FloatingIcon icon={<MapIcon />} position={{ bottom: '25%', left: '8%' }} delay={3} />

      {/* Gradient Overlay for Readability */}
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background: homeBackgroundImage
            ? `linear-gradient(
                180deg,
                ${alpha(theme.palette.background.default, 0.85)} 0%,
                ${alpha(theme.palette.background.default, 0.65)} 40%,
                ${alpha(theme.palette.background.default, 0.9)} 100%
              )`
            : `linear-gradient(
                180deg,
                ${alpha(theme.palette.background.default, 0.75)} 0%,
                ${alpha(theme.palette.background.default, 0.55)} 45%,
                ${alpha(theme.palette.background.default, 0.88)} 100%
              )`,
        }}
      />
    </>
  );
};
