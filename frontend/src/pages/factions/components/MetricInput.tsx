import React from 'react';
import { Box, InputBase, Typography, alpha, useTheme } from '@mui/material';

interface MetricInputProps {
  label: string;
  unit?: string | null;
  value: number | null;
  min?: number;
  max?: number;
  onChange: (value: number | null) => void;
}

export const MetricInput: React.FC<MetricInputProps> = ({ label, unit, value, min, max, onChange }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        minHeight: 112,
        p: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.55)}`,
        borderRadius: 2.5,
        bgcolor: alpha(theme.palette.background.paper, 0.32),
        transition: 'border-color 160ms ease, background-color 160ms ease',
        '&:focus-within': {
          borderColor: alpha(theme.palette.primary.main, 0.65),
          bgcolor: alpha(theme.palette.primary.main, 0.035),
        },
      }}
    >
      <Typography
        sx={{
          mb: 1,
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '0.65rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'text.secondary',
        }}
      >
        {label}
      </Typography>
      <Box display="flex" alignItems="baseline" gap={1}>
        <InputBase
        type="number"
          value={value ?? ''}
          inputProps={{ min, max, 'aria-label': label }}
          onChange={(event) => {
            const nextValue = event.target.value.trim();
            onChange(nextValue === '' ? null : Number(nextValue));
          }}
          sx={{
            flex: 1,
            minWidth: 0,
            fontFamily: '"Cormorant Garamond", serif',
            fontWeight: 600,
            fontSize: '2rem',
            lineHeight: 1,
            color: 'text.primary',
            '& input': { p: 0 },
          }}
        />
        {unit ? (
          <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0 }}>
            {unit}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
};
