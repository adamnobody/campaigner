import React from 'react';
import { Box, Button, Divider, Typography } from '@mui/material';
import { GlassCard } from '@/components/ui/GlassCard';
import { GRAPH_EDGE_KIND_LABELS, GRAPH_NODE_TYPE_LABELS, type GraphEdge, type GraphNode } from '@/pages/graph/types';

type Props = {
  selectedNode: GraphNode | null;
  connectedEdges: GraphEdge[];
  onOpen: () => void;
};

export const ProjectGraphNodePanel: React.FC<Props> = ({ selectedNode, connectedEdges, onOpen }) => {
  if (!selectedNode) {
    return (
      <GlassCard sx={{ p: 1.5 }}>
        <Typography sx={{ fontWeight: 700 }}>Узел не выбран</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Кликни по узлу на графе, чтобы увидеть детали.
        </Typography>
      </GlassCard>
    );
  }

  const metaEntries = Object.entries(selectedNode.meta).filter(([, value]) => value !== '' && value !== null && value !== undefined);

  return (
    <GlassCard sx={{ p: 1.5 }}>
      <Typography sx={{ fontWeight: 700, mb: 0.2 }}>{selectedNode.label}</Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
        {GRAPH_NODE_TYPE_LABELS[selectedNode.type]} · {connectedEdges.length} связей
      </Typography>
      {metaEntries.slice(0, 4).map(([key, value]) => (
        <Box key={key} display="flex" justifyContent="space-between" gap={1}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{key}</Typography>
          <Typography variant="caption">{String(value)}</Typography>
        </Box>
      ))}
      <Divider sx={{ my: 1 }} />
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Ближайшие связи</Typography>
      <Box mt={0.4} mb={1}>
        {connectedEdges.slice(0, 6).map((edge) => (
          <Typography key={edge.id} variant="caption" sx={{ display: 'block' }}>
            {edge.label || GRAPH_EDGE_KIND_LABELS[edge.kind]}
          </Typography>
        ))}
      </Box>
      <Button variant="outlined" size="small" onClick={onOpen}>Открыть</Button>
    </GlassCard>
  );
};
