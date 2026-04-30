import React, { useMemo } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { usePreferencesStore } from '@/store/usePreferencesStore';

type Side = 'left' | 'right';

type Props = {
  side: Side;
  /** Панель всегда смонтирована; при закрытии схлопывается по ширине. */
  open: boolean;
  panelWidth?: number;
  children: React.ReactNode;
};

/**
 * Боковая панель графа (desktop): ширина + opacity + лёгкий slide.
 * Учитывает «Внешний вид → Анимации» (Плавные / Минимальные) и prefers-reduced-motion.
 */
export const AnimatedGraphSidePanel: React.FC<Props> = ({ side, open, panelWidth = 300, children }) => {
  const theme = useTheme();
  const motionMode = usePreferencesStore((s) => s.motionMode);
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)', { noSsr: true });

  const { durationMs, translatePx } = useMemo(() => {
    const smooth = motionMode === 'full' && !prefersReducedMotion;
    return {
      durationMs: smooth ? 215 : 76,
      translatePx: smooth ? 8 : 0,
    };
  }, [motionMode, prefersReducedMotion]);

  const easing = theme.transitions.easing.easeInOut;

  const transition = theme.transitions.create(['width', 'minWidth', 'maxWidth', 'opacity', 'transform'], {
    duration: durationMs,
    easing,
  });

  const slideClosed = side === 'left' ? `translateX(-${translatePx}px)` : `translateX(${translatePx}px)`;

  return (
    <Box
      sx={{
        width: open ? panelWidth : 0,
        minWidth: open ? panelWidth : 0,
        maxWidth: open ? panelWidth : 0,
        opacity: open ? 1 : 0,
        transform: open ? 'translateX(0)' : slideClosed,
        overflow: 'hidden',
        pointerEvents: open ? 'auto' : 'none',
        transition,
        alignSelf: 'stretch',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          width: panelWidth,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
