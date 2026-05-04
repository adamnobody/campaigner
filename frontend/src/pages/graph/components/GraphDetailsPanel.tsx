import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
import { getNodeRoute, type GraphEdge, type GraphNode } from '@/pages/graph/types';

const btnSx = { textTransform: 'none' as const, fontWeight: 500 };

type Props = {
  projectId: number;
  selectedNode: GraphNode | null;
  connectedEdges: GraphEdge[];
  nodeById: Map<string, GraphNode>;
  onOpenEntity: () => void;
};

function edgeKindI18nKey(kind: GraphEdge['kind']): string {
  return `graph:edgeKinds.${kind}`;
}

export const GraphDetailsPanel: React.FC<Props> = ({
  projectId,
  selectedNode,
  connectedEdges,
  nodeById,
  onOpenEntity,
}) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation(['graph', 'common']);
  const metaRows = useMemo(
    () => (selectedNode ? getOrderedMetaRows(selectedNode) : []),
    [selectedNode, i18n.language],
  );

  const connectionsLine = useMemo(() => {
    const n = connectedEdges.length;
    return t('graph:details.connections', { count: n });
  }, [connectedEdges.length, t, i18n.language]);

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
            <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{t('graph:details.notSelectedTitle')}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('graph:details.notSelectedHint')}
            </Typography>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>{t('graph:details.legendTitle')}</Typography>
            <GraphLegend dense />
          </>
        ) : (
          <>
            <Chip
              size="small"
              label={t(`graph:details.nodeKind.${selectedNode.type}`)}
              sx={{
                mb: 1,
                fontWeight: 600,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
              }}
            />
            <Typography sx={{ fontWeight: 700, mb: 0.5, wordBreak: 'break-word' }}>{selectedNode.label}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {connectionsLine}
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
              {t('graph:details.openEntity')}
            </Button>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
              {t('graph:details.nearestLinks')}
            </Typography>
            <Box display="flex" flexDirection="column" gap={0.75} sx={{ mb: 2 }}>
              {connectedEdges.slice(0, 10).map((edge) => {
                const otherId = edge.source === selectedNode.id ? edge.target : edge.source;
                const neighbor = nodeById.get(otherId);
                if (!neighbor) return null;
                const kindHint = edge.label || t(edgeKindI18nKey(edge.kind));
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
                <Typography variant="subtitle2">{t('graph:details.legendAccordion')}</Typography>
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
