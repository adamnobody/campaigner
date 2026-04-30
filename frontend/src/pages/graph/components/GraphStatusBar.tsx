import React from 'react';
import { Stack, Typography } from '@mui/material';

function formatNodeCount(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} узел`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} узла`;
  return `${n} узлов`;
}

function formatEdgeCount(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} связь`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} связи`;
  return `${n} связей`;
}

type Props = {
  nodeCount: number;
  edgeCount: number;
  zoomPercent: number;
};

export const GraphStatusBar: React.FC<Props> = ({ nodeCount, edgeCount, zoomPercent }) => (
  <Stack
    direction="row"
    flexWrap="wrap"
    alignItems="baseline"
    justifyContent="space-between"
    gap={1}
    sx={{
      py: 0.75,
      px: 0.25,
      mt: 0.5,
      borderTop: (t) => `1px solid ${t.palette.divider}`,
      opacity: 0.72,
    }}
  >
    <Typography variant="caption" color="text.secondary" component="div">
      {formatNodeCount(nodeCount)} · {formatEdgeCount(edgeCount)} · Масштаб {zoomPercent}%
    </Typography>
    <Typography variant="caption" color="text.secondary" component="div" sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
      Колесо — масштаб · Перетаскивание — панорама · Двойной клик — открыть
    </Typography>
  </Stack>
);
