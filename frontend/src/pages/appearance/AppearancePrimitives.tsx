import React, { useCallback, useEffect, useRef, useState } from 'react';
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

export const AnimatedSlider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  onChangeCommitted?: (value: number) => void;
  debounceMs?: number;
  valueLabelFormat?: (value: number) => string;
  disabled?: boolean;
  icon?: React.ReactNode;
  color?: string;
}> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  onChangeCommitted,
  debounceMs = 180,
  valueLabelFormat,
  disabled,
  icon,
  color,
}) => {
  const theme = useTheme();
  const [localValue, setLocalValue] = useState(value);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingValueRef = useRef<number | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const flushPendingChange = useCallback((fallbackValue?: number) => {
    const nextValue = pendingValueRef.current ?? fallbackValue;
    if (nextValue === undefined) return;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    pendingValueRef.current = null;
    onChange(nextValue);
  }, [onChange]);

  useEffect(() => {
    return () => {
      flushPendingChange();
    };
  }, [flushPendingChange]);

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
          label={valueLabelFormat ? valueLabelFormat(localValue) : localValue}
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
        value={localValue}
        min={min}
        max={max}
        step={step}
        onChange={(_, v) => {
          const nextValue = v as number;
          setLocalValue(nextValue);
          if (disabled) return;

          if (debounceMs <= 0) {
            onChange(nextValue);
            return;
          }

          pendingValueRef.current = nextValue;
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          debounceTimerRef.current = setTimeout(() => {
            flushPendingChange(nextValue);
          }, debounceMs);
        }}
        onChangeCommitted={(_, v) => {
          const committedValue = v as number;
          flushPendingChange(committedValue);
          onChangeCommitted?.(committedValue);
        }}
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
