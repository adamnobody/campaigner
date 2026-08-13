import React from 'react';
import { Box, Button, IconButton, TextField, Typography, alpha, useTheme } from '@mui/material';
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
  const theme = useTheme();
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
        <Box
          key={`${metric.name}-${index}`}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr auto', sm: '2fr 1fr 1fr auto' },
            gap: 1,
            p: 1.5,
            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.background.paper, 0.28),
          }}
        >
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
          <IconButton
            aria-label={t('common:delete')}
            onClick={() => onChange(metrics.filter((_, i) => i !== index))}
            sx={{ alignSelf: 'center', color: 'error.main' }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ))}
      <Box>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() =>
            onChange([
              ...metrics,
              { name: '', value: 0, unit: null, sortOrder: metrics.length },
            ])
          }
        >
          {t('factions:customMetrics.add')}
        </Button>
      </Box>
    </Box>
  );
};
