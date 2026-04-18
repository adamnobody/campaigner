import React from 'react';
import { Box, TextField, Typography } from '@mui/material';

interface MetricInputProps {
  label: string;
  unit?: string | null;
  value: number | null;
  min?: number;
  max?: number;
  onChange: (value: number | null) => void;
}

export const MetricInput: React.FC<MetricInputProps> = ({ label, unit, value, min, max, onChange }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
      <TextField
        fullWidth
        label={label}
        type="number"
        value={value ?? ''}
        inputProps={{ min, max }}
        onChange={(event) => {
          const nextValue = event.target.value.trim();
          onChange(nextValue === '' ? null : Number(nextValue));
        }}
      />
      {unit ? (
        <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 56, mb: 1.5 }}>
          {unit}
        </Typography>
      ) : null}
    </Box>
  );
};
