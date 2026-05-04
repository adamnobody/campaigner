import React from 'react';
import { Box, IconButton, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import type { ReplaceFactionCustomMetrics } from '@campaigner/shared';

interface CustomMetricsEditorProps {
  metrics: ReplaceFactionCustomMetrics['metrics'];
  onChange: (metrics: ReplaceFactionCustomMetrics['metrics']) => void;
}

export const CustomMetricsEditor: React.FC<CustomMetricsEditorProps> = ({ metrics, onChange }) => {
  const { t } = useTranslation(['factions', 'common']);
  const updateRow = (index: number, key: 'name' | 'value' | 'unit', value: string | number) => {
    onChange(
      metrics.map((metric, i) =>
        i === index
          ? {
              ...metric,
              [key]: key === 'unit' ? (String(value).trim() || null) : value,
            }
          : metric
      )
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {metrics.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('factions:metrics.customNone')}
        </Typography>
      ) : null}
      {metrics.map((metric, index) => (
        <Box key={`${metric.name}-${index}`} sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 1 }}>
          <TextField
            label={t('factions:customMetrics.name')}
            value={metric.name}
            onChange={(event) => updateRow(index, 'name', event.target.value)}
          />
          <TextField
            label={t('factions:customMetrics.value')}
            type="number"
            value={metric.value}
            onChange={(event) => updateRow(index, 'value', Number(event.target.value || 0))}
          />
          <TextField
            label={t('factions:customMetrics.unit')}
            value={metric.unit ?? ''}
            onChange={(event) => updateRow(index, 'unit', event.target.value)}
          />
          <IconButton onClick={() => onChange(metrics.filter((_, i) => i !== index))} sx={{ mt: 1 }}>
            <DeleteIcon />
          </IconButton>
        </Box>
      ))}
      <Box>
        <IconButton
          onClick={() =>
            onChange([
              ...metrics,
              { name: '', value: 0, unit: null, sortOrder: metrics.length },
            ])
          }
        >
          <AddIcon />
        </IconButton>
      </Box>
    </Box>
  );
};
