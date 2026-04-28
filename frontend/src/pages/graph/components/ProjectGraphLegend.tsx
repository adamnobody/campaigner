import React from 'react';
import { Box, Typography } from '@mui/material';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  GRAPH_EDGE_KIND_COLORS,
  GRAPH_EDGE_KIND_LABELS,
  GRAPH_EDGE_KINDS,
  GRAPH_NODE_TYPE_COLORS,
  GRAPH_NODE_TYPE_LABELS,
  GRAPH_NODE_TYPES,
} from '@/pages/graph/types';

export const ProjectGraphLegend: React.FC = () => (
  <GlassCard sx={{ p: 1.5 }}>
    <Typography sx={{ fontWeight: 700, mb: 0.8 }}>Легенда</Typography>
    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Узлы</Typography>
    <Box mt={0.4} mb={1.2}>
      {GRAPH_NODE_TYPES.map((nodeType) => (
        <Box key={nodeType} display="flex" alignItems="center" gap={1} mb={0.4}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: GRAPH_NODE_TYPE_COLORS[nodeType] }} />
          <Typography variant="caption">{GRAPH_NODE_TYPE_LABELS[nodeType]}</Typography>
        </Box>
      ))}
    </Box>
    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Связи</Typography>
    <Box mt={0.4}>
      {GRAPH_EDGE_KINDS.map((edgeKind) => (
        <Box key={edgeKind} display="flex" alignItems="center" gap={1} mb={0.4}>
          <Box sx={{ width: 14, height: 2.5, borderRadius: 1, backgroundColor: GRAPH_EDGE_KIND_COLORS[edgeKind] }} />
          <Typography variant="caption">{GRAPH_EDGE_KIND_LABELS[edgeKind]}</Typography>
        </Box>
      ))}
    </Box>
  </GlassCard>
);
