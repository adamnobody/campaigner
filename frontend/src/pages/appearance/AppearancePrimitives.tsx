import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Slider,
  FormLabel,
  Paper,
  alpha,
  useTheme,
} from '@mui/material';
import type { ThemePreset } from '@/store/usePreferencesStore';

export const presetOrder: ThemePreset[] = [
  'obsidian-gold',
  'midnight-cyan',
  'royal-violet',
  'ember-crimson',
  'forest-emerald',
  'moonstone-silver',
  'sable-rose',
  'deep-amber',
  'storm-indigo',
  'ashen-teal',
];

export const safeRgba = (rgbString: string | undefined, opacity: number) => {
  if (!rgbString) return `rgba(128, 128, 128, ${opacity})`;
  if (rgbString.startsWith('rgb') || rgbString.startsWith('#') || rgbString.startsWith('hsl')) {
    return alpha(rgbString, opacity);
  }
  return `rgba(${rgbString}, ${opacity})`;
};

export const safeRgb = (rgbString: string | undefined) => {
  if (!rgbString) return 'rgb(128, 128, 128)';
  if (rgbString.startsWith('rgb') || rgbString.startsWith('#')) return rgbString;
  return `rgb(${rgbString})`;
};

interface PositionProps {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

export const FloatingOrb: React.FC<{
  color: string;
  size?: number;
} & PositionProps & { delay?: number }> = ({
  color,
  size = 300,
  top,
  right,
  bottom,
  left,
  delay = 0,
}) => (
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
      transform: 'scale(1)',
      opacity: 0.3,
      animation: `gentleFloat ${10 + delay}s ease-in-out infinite`,
      pointerEvents: 'none',
      zIndex: 0,
      '@keyframes gentleFloat': {
        '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
        '50%': { transform: 'translate(-15px, 15px) scale(1.05)' },
      },
    }}
  />
);

export const GlassCard: React.FC<{
  children: React.ReactNode;
  sx?: any;
  elevation?: number;
  interactive?: boolean;
}> = ({ children, sx = {}, elevation = 0, interactive = false }) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={elevation}
      sx={{
        background: `linear-gradient(135deg, 
          ${alpha(theme.palette.background.paper, 0.75)} 0%, 
          ${alpha(theme.palette.background.paper, 0.45)} 100%
        )`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.25)}`,
        borderRadius: 3,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        cursor: interactive ? 'pointer' : 'default',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          padding: '1px',
          background: `linear-gradient(135deg, 
            ${alpha(theme.palette.primary.main, 0.15)} 0%, 
            transparent 50%
          )`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 0.4s ease',
        },
        ...(interactive && {
          '&:hover': {
            transform: 'translateY(-2px)',
            borderColor: alpha(theme.palette.primary.main, 0.35),
            boxShadow: `
              0 12px 28px ${alpha(theme.palette.common.black, 0.25)},
              0 0 40px ${alpha(theme.palette.primary.main, 0.06)}
            `,
            '&::before': { opacity: 1 },
          },
        }),
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
};

export const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}> = ({ icon, title, subtitle }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: 2,
        bgcolor: 'primary.main',
        color: '#fff',
        boxShadow: (t: any) => `0 4px 12px ${alpha(t.palette.primary.main, 0.3)}`,
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography
        variant="h6"
        sx={{
          fontFamily: '"Cinzel", serif',
          fontWeight: 700,
          fontSize: '1.15rem',
          lineHeight: 1.2,
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  </Box>
);

export const AnimatedSlider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  valueLabelFormat?: (value: number) => string;
  disabled?: boolean;
  icon?: React.ReactNode;
  color?: string;
}> = ({ label, value, min, max, step, onChange, valueLabelFormat, disabled, icon, color }) => {
  const theme = useTheme();

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <FormLabel
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontWeight: 600,
            fontSize: '0.9rem',
            color: 'text.primary',
          }}
        >
          {icon}
          {label}
        </FormLabel>
        <Chip
          size="small"
          label={valueLabelFormat ? valueLabelFormat(value) : value}
          sx={{
            backgroundColor: alpha(color || theme.palette.primary.main, 0.12),
            color: color || theme.palette.primary.main,
            fontWeight: 700,
            fontSize: '0.75rem',
            height: 24,
            border: `1px solid ${alpha(color || theme.palette.primary.main, 0.25)}`,
            fontFamily: '"Roboto Mono", monospace',
          }}
        />
      </Box>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(_, v) => onChange(v as number)}
        valueLabelDisplay="auto"
        valueLabelFormat={valueLabelFormat}
        disabled={disabled}
        sx={{
          height: 6,
          '& .MuiSlider-thumb': {
            width: 20,
            height: 20,
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: `0 0 0 8px ${alpha(color || theme.palette.primary.main, 0.12)}`,
              transform: 'scale(1.15)',
            },
          },
          '& .MuiSlider-track': {
            background: `linear-gradient(90deg, ${color || theme.palette.primary.main}, ${
              color ? alpha(color, 0.6) : theme.palette.primary.light
            })`,
            border: 'none',
          },
          '& .MuiSlider-rail': {
            opacity: 0.15,
          },
        }}
      />
    </Box>
  );
};
