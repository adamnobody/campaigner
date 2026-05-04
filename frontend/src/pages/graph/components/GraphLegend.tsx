import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';
import {
  GRAPH_EDGE_KIND_COLORS,
  GRAPH_EDGE_KINDS,
  GRAPH_NODE_TYPE_COLORS,
  GRAPH_NODE_TYPES,
} from '@/pages/graph/types';

/** Полная легенда типов узлов и рёбер (цвета из темы графа). */
export const GraphLegend: React.FC<{ dense?: boolean }> = ({ dense }) => {
  const { t } = useTranslation(['graph', 'common']);
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: dense ? 0.4 : 0.6 }}>
        {t('graph:legend.nodesSection')}
      </Typography>
      <Box sx={{ mb: dense ? 1 : 1.2 }}>
        {GRAPH_NODE_TYPES.map((nodeType) => (
          <Box key={nodeType} display="flex" alignItems="center" gap={1} mb={dense ? 0.25 : 0.4}>
            <Box sx={{ width: 10, height: 10, flexShrink: 0, borderRadius: '50%', backgroundColor: GRAPH_NODE_TYPE_COLORS[nodeType] }} />
            <Typography variant="caption">{t(`graph:nodeTypes.${nodeType}`)}</Typography>
          </Box>
        ))}
      </Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: dense ? 0.4 : 0.6 }}>
        {t('graph:legend.edgesSection')}
      </Typography>
      <Box>
        {GRAPH_EDGE_KINDS.map((edgeKind) => (
          <Box key={edgeKind} display="flex" alignItems="center" gap={1} mb={dense ? 0.25 : 0.4}>
            <Box
              sx={{
                width: 14,
                height: 2.5,
                flexShrink: 0,
                borderRadius: 1,
                backgroundColor: GRAPH_EDGE_KIND_COLORS[edgeKind],
              }}
            />
            <Typography variant="caption">{t(`graph:edgeKinds.${edgeKind}`)}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
