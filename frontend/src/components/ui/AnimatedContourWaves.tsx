import React, { useMemo } from 'react';
import { Box, alpha } from '@mui/material';
import { useUIStore } from '@/store/useUIStore';

type AnimatedContourWavesProps = {
  accentColor: string;
  animate: boolean;
  scope?: 'home' | 'project';
  intensity?: number;
};

function contourDataUrl(accentColor: string, opacity: number, count: number, step: number) {
  const paths = Array.from({ length: count }, (_, index) => {
    const offset = index * step - 180;
    const phase = index * 0.72;
    const y1 = 40 + offset;
    const y2 = 250 + offset + Math.sin(phase) * 72;
    const y3 = 120 + offset + Math.cos(phase * 1.3) * 58;
    const y4 = 420 + offset + Math.sin(phase * 1.7) * 86;
    const y5 = 180 + offset + Math.cos(phase * 0.9) * 64;
    return `<path d="M -500 ${y1} C 180 ${y2}, 560 ${y3}, 980 ${y3} S 1740 ${y4}, 2360 ${y5} T 3300 ${y2}" />`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2400 1200" preserveAspectRatio="xMidYMid slice"><g fill="none" stroke="${alpha(accentColor, opacity)}" stroke-width="1.25">${paths}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function AnimatedContourWaves({
  accentColor,
  animate,
  scope = 'project',
  intensity = 1,
}: AnimatedContourWavesProps) {
  const sidebarWidth = useUIStore((state) => state.sidebarWidth);
  const layerA = useMemo(
    () => contourDataUrl(accentColor, 0.2 * intensity, 27, 48),
    [accentColor, intensity],
  );
  const layerB = useMemo(
    () => contourDataUrl(accentColor, 0.12 * intensity, 23, 64),
    [accentColor, intensity],
  );

  return (
    <Box
      aria-hidden
      sx={{
        position: 'fixed',
        top: scope === 'project' ? 66 : 0,
        left: scope === 'project' ? sidebarWidth : 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        transition: 'left 220ms cubic-bezier(.4,0,.2,1)',
        '@keyframes contourWaveA': {
          '0%': { transform: 'translate3d(-3%, -2%, 0) scale(1.08)' },
          '50%': { transform: 'translate3d(3%, 2.5%, 0) scale(1.12)' },
          '100%': { transform: 'translate3d(-3%, -2%, 0) scale(1.08)' },
        },
        '@keyframes contourWaveB': {
          '0%': { transform: 'translate3d(3%, 1%, 0) scale(1.12)' },
          '50%': { transform: 'translate3d(-3%, -2%, 0) scale(1.07)' },
          '100%': { transform: 'translate3d(3%, 1%, 0) scale(1.12)' },
        },
        '@keyframes contourBreathe': {
          '0%, 100%': { opacity: 0.42 },
          '50%': { opacity: 0.82 },
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: '-14%',
          backgroundImage: layerA,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.72,
          maskImage: 'radial-gradient(ellipse at 50% 46%, #000 42%, transparent 94%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 46%, #000 42%, transparent 94%)',
          animation: animate
            ? 'contourWaveA 17s ease-in-out infinite, contourBreathe 12s ease-in-out infinite'
            : 'none',
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: '-16%',
          backgroundImage: layerB,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.56,
          maskImage: 'radial-gradient(ellipse at 50% 52%, #000 34%, transparent 92%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 52%, #000 34%, transparent 92%)',
          animation: animate
            ? 'contourWaveB 23s ease-in-out infinite, contourBreathe 15s ease-in-out infinite reverse'
            : 'none',
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 38%, ${alpha(accentColor, 0.07 * intensity)}, transparent 68%)`,
        }}
      />
    </Box>
  );
}
