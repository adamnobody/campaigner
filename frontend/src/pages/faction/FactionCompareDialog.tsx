import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '@mui/material/styles';
import { getMetricsForKind } from '@campaigner/shared';
import type { Faction, FactionCompareResult } from '@campaigner/shared';

interface FactionCompareDialogProps {
  open: boolean;
  kind: 'state' | 'faction';
  currentFactionId: number;
  factions: Faction[];
  onClose: () => void;
  onCompare: (factionIds: number[], metricKeys: string[]) => Promise<FactionCompareResult>;
}

const COLORS = ['#4e8a6e', '#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc948'];

export const FactionCompareDialog: React.FC<FactionCompareDialogProps> = ({
  open,
  kind,
  currentFactionId,
  factions,
  onClose,
  onCompare,
}) => {
  const theme = useTheme();
  const baseMetrics = useMemo(() => getMetricsForKind(kind), [kind]);
  const baseMetricKeys = useMemo(() => baseMetrics.map((metric) => metric.key), [baseMetrics]);
  const sameKindFactions = useMemo(() => factions.filter((faction) => faction.kind === kind), [factions, kind]);
  const [selectedFactionIds, setSelectedFactionIds] = useState<number[]>([currentFactionId]);
  const [selectedMetricKeys, setSelectedMetricKeys] = useState<string[]>(baseMetricKeys);
  const [chartType, setChartType] = useState<'bar' | 'radar'>('bar');
  const [result, setResult] = useState<FactionCompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [compareCache, setCompareCache] = useState<Record<string, FactionCompareResult>>({});

  const compactNumberFormatter = useMemo(
    () =>
      new Intl.NumberFormat('ru-RU', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }),
    []
  );
  const fullNumberFormatter = useMemo(() => new Intl.NumberFormat('ru-RU'), []);
  const radarPercentFormatter = useMemo(() => new Intl.NumberFormat('ru-RU', { style: 'percent', maximumFractionDigits: 0 }), []);
  const tooltipStyle = useMemo(
    () => ({
      backgroundColor: theme.palette.background.paper,
      borderColor: theme.palette.divider,
      color: theme.palette.text.primary,
      borderRadius: theme.shape.borderRadius,
    }),
    [theme]
  );
  const tooltipLabelStyle = useMemo(
    () => ({
      color: theme.palette.text.primary,
      fontWeight: 600,
    }),
    [theme]
  );
  const tooltipItemStyle = useMemo(
    () => ({
      color: theme.palette.text.secondary,
    }),
    [theme]
  );

  useEffect(() => {
    if (!open) {
      setCompareCache({});
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setSelectedFactionIds([currentFactionId]);
    setSelectedMetricKeys(baseMetricKeys);
    setResult(null);
    setCompareCache({});
  }, [open, currentFactionId, baseMetricKeys]);

  const availableCustomMetrics = useMemo(() => {
    const names = new Set<string>();
    for (const faction of sameKindFactions) {
      for (const metric of faction.customMetrics || []) {
        if (metric.name.trim()) {
          names.add(metric.name.trim());
        }
      }
    }
    return Array.from(names).sort();
  }, [sameKindFactions]);

  const runCompare = async () => {
    const sortedFactionIds = [...selectedFactionIds].sort((a, b) => a - b);
    const sortedMetricKeys = [...selectedMetricKeys].sort((a, b) => a.localeCompare(b));
    const cacheKey = `${sortedFactionIds.join(',')}|${sortedMetricKeys.join(',')}`;
    const cached = compareCache[cacheKey];
    if (cached) {
      setResult(cached);
      return;
    }
    setLoading(true);
    try {
      const compareResult = await onCompare(selectedFactionIds, selectedMetricKeys);
      setResult(compareResult);
      setCompareCache((prev) => ({ ...prev, [cacheKey]: compareResult }));
    } finally {
      setLoading(false);
    }
  };

  const radarData = useMemo(() => {
    if (!result) return [];
    return result.metrics.map((metric) => {
      const maxForMetric = Math.max(...metric.values.map((value) => value.value ?? 0), 0);
      const row: Record<string, number | string | null> = { metric: metric.label };
      for (const value of metric.values) {
        row[`f_${value.factionId}`] =
          value.value == null || maxForMetric === 0
            ? 0
            : value.value / maxForMetric;
        row[`f_real_${value.factionId}`] = value.value;
      }
      return row;
    });
  }, [result]);

  const radarTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const dataRow = payload[0]?.payload || {};
    return (
      <Box sx={{ bgcolor: 'background.paper', p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'text.primary', fontWeight: 600 }}>
          {String(dataRow.metric || '')}
        </Typography>
        {result?.factions.map((faction) => (
          <Typography key={faction.id} variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
            {faction.name}:{' '}
            {dataRow[`f_real_${faction.id}`] == null
              ? '—'
              : fullNumberFormatter.format(Number(dataRow[`f_real_${faction.id}`]))}
          </Typography>
        ))}
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Сравнение показателей</DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2 }}>
        <TextField
          select
          label="Сущности"
          SelectProps={{ multiple: true }}
          value={selectedFactionIds.map(String)}
          onChange={(event) => {
            const ids = (event.target.value as unknown as string[]).map(Number);
            setSelectedFactionIds(ids);
          }}
        >
          {sameKindFactions.map((faction) => (
            <MenuItem key={faction.id} value={String(faction.id)}>
              {faction.name}
            </MenuItem>
          ))}
        </TextField>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Базовые показатели
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {baseMetrics.map((metric) => (
              <FormControlLabel
                key={metric.key}
                control={
                  <Checkbox
                    checked={selectedMetricKeys.includes(metric.key)}
                    onChange={(event) => {
                      setSelectedMetricKeys((prev) =>
                        event.target.checked
                          ? [...prev, metric.key]
                          : prev.filter((key) => key !== metric.key)
                      );
                    }}
                  />
                }
                label={metric.label}
              />
            ))}
          </Box>
        </Box>

        {availableCustomMetrics.length ? (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Кастомные показатели
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {availableCustomMetrics.map((name) => {
                const key = `custom:${name}`;
                return (
                  <FormControlLabel
                    key={key}
                    control={
                      <Checkbox
                        checked={selectedMetricKeys.includes(key)}
                        onChange={(event) => {
                          setSelectedMetricKeys((prev) =>
                            event.target.checked ? [...prev, key] : prev.filter((metricKey) => metricKey !== key)
                          );
                        }}
                      />
                    }
                    label={name}
                  />
                );
              })}
            </Box>
          </Box>
        ) : null}

        <ToggleButtonGroup
          exclusive
          value={chartType}
          onChange={(_, value) => value && setChartType(value)}
          size="small"
        >
          <ToggleButton value="bar">Bar</ToggleButton>
          <ToggleButton value="radar">Radar</ToggleButton>
        </ToggleButtonGroup>

        {result ? (
          chartType === 'bar' ? (
            <Box sx={{ display: 'grid', gap: 2 }}>
              {result.metrics.map((metric) => (
                <Box key={metric.key} sx={{ height: 240 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {metric.label}
                  </Typography>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={result.factions.map((faction) => ({
                        name: faction.name,
                        value: metric.values.find((value) => value.factionId === faction.id)?.value ?? null,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis width={92} tickFormatter={(value) => compactNumberFormatter.format(Number(value) || 0)} />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        labelStyle={tooltipLabelStyle}
                        itemStyle={tooltipItemStyle}
                        formatter={(value) =>
                          value == null || typeof value !== 'number'
                            ? '—'
                            : fullNumberFormatter.format(value)
                        }
                      />
                      <Bar dataKey="value" fill="#4e8a6e" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ height: 420 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis domain={[0, 1]} tickFormatter={(value) => radarPercentFormatter.format(Number(value))} />
                  <Tooltip content={radarTooltip} />
                  <Legend />
                  {result.factions.map((faction, index) => (
                    <Radar
                      key={faction.id}
                      name={faction.name}
                      dataKey={`f_${faction.id}`}
                      stroke={COLORS[index % COLORS.length]}
                      fill={COLORS[index % COLORS.length]}
                      fillOpacity={0.25}
                    />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
            </Box>
          )
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
        <Button onClick={runCompare} variant="contained" disabled={loading || selectedFactionIds.length === 0 || selectedMetricKeys.length === 0}>
          Сравнить
        </Button>
      </DialogActions>
    </Dialog>
  );
};
