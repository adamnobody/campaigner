import React, { useMemo } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Divider,
  Link,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Link as RouterLink } from 'react-router-dom';
import { alpha, useTheme } from '@mui/material/styles';
import { getOrderedMetaRows } from '@/pages/graph/formatNodeMeta';
import { GraphLegend } from '@/pages/graph/components/GraphLegend';
import {
  GRAPH_EDGE_KIND_LABELS,
  getNodeRoute,
  type GraphEdge,
  type GraphNode,
  type GraphNodeType,
} from '@/pages/graph/types';

const NODE_KIND_HEADER: Record<GraphNodeType, string> = {
  character: 'Персонаж',
  faction: 'Фракция или государство',
  dynasty: 'Династия',
  dogma: 'Догма',
  timeline: 'Событие',
  note: 'Заметка',
  wiki: 'Вики',
};

const btnSx = { textTransform: 'none' as const, fontWeight: 500 };

type Props = {
  projectId: number;
  selectedNode: GraphNode | null;
  connectedEdges: GraphEdge[];
  nodeById: Map<string, GraphNode>;
  onOpenEntity: () => void;
};

export const GraphDetailsPanel: React.FC<Props> = ({
  projectId,
  selectedNode,
  connectedEdges,
  nodeById,
  onOpenEntity,
}) => {
  const theme = useTheme();
  const metaRows = useMemo(() => (selectedNode ? getOrderedMetaRows(selectedNode) : []), [selectedNode]);

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.25 }}>
        {!selectedNode ? (
          <>
            <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Узел не выбран</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Кликните по узлу на графе, чтобы увидеть детали.
            </Typography>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>Легенда</Typography>
            <GraphLegend dense />
          </>
        ) : (
          <>
            <Chip
              size="small"
              label={NODE_KIND_HEADER[selectedNode.type]}
              sx={{
                mb: 1,
                fontWeight: 600,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
              }}
            />
            <Typography sx={{ fontWeight: 700, mb: 0.5, wordBreak: 'break-word' }}>{selectedNode.label}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {((): string => {
                const n = connectedEdges.length;
                if (n === 0) return 'На текущем наборе нет связей';
                if (n === 1) return '1 связь';
                if (n >= 2 && n <= 4) return `${n} связи`;
                return `${n} связей`;
              })()}
            </Typography>
            {metaRows.length > 0 ? (
              <Box sx={{ mb: 1.5 }}>
                {metaRows.map((row) => (
                  <Box key={row.key} display="flex" justifyContent="space-between" gap={1} sx={{ py: 0.25 }}>
                    <Typography variant="caption" color="text.secondary">
                      {row.label}
                    </Typography>
                    <Typography variant="caption" sx={{ textAlign: 'right' }}>
                      {row.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : null}
            <Button variant="contained" size="small" onClick={onOpenEntity} sx={{ ...btnSx, alignSelf: 'flex-start', mb: 2 }}>
              Открыть сущность
            </Button>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
              Ближайшие связи
            </Typography>
            <Box display="flex" flexDirection="column" gap={0.75} sx={{ mb: 2 }}>
              {connectedEdges.slice(0, 10).map((edge) => {
                const otherId = edge.source === selectedNode.id ? edge.target : edge.source;
                const neighbor = nodeById.get(otherId);
                if (!neighbor) return null;
                const kindHint = edge.label || GRAPH_EDGE_KIND_LABELS[edge.kind];
                return (
                  <Box key={edge.id}>
                    <Link
                      component={RouterLink}
                      to={getNodeRoute(projectId, neighbor)}
                      variant="body2"
                      underline="hover"
                      sx={{ fontWeight: 600, display: 'block', wordBreak: 'break-word' }}
                    >
                      {neighbor.label}
                    </Link>
                    {kindHint ? (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {kindHint}
                      </Typography>
                    ) : null}
                  </Box>
                );
              })}
            </Box>
            <Accordion defaultExpanded={false} disableGutters elevation={0} sx={{ bgcolor: 'transparent', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />} sx={{ px: 0, minHeight: 40 }}>
                <Typography variant="subtitle2">Легенда</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pt: 0 }}>
                <GraphLegend dense />
              </AccordionDetails>
            </Accordion>
          </>
        )}
      </Box>
    </Box>
  );
};
