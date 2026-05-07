import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  GRAPH_EDGE_KINDS,
  GRAPH_NODE_TYPES,
  type EdgeOpacityMode,
  type EdgeThicknessMode,
  type GraphEdgeKind,
  type GraphNodeType,
  type LabelVisibilityMode,
  type LayoutIntensityMode,
  type NodeSizeMode,
  type ProjectGraphViewSettings,
} from '@/pages/graph/types';

type Props = {
  enabledNodeTypes: Set<GraphNodeType>;
  enabledEdgeKinds: Set<GraphEdgeKind>;
  onToggleNodeType: (type: GraphNodeType) => void;
  onToggleEdgeKind: (kind: GraphEdgeKind) => void;
  onSelectAllNodeTypes: () => void;
  onSelectNoNodeTypes: () => void;
  onSelectAllEdgeKinds: () => void;
  onSelectNoEdgeKinds: () => void;
  viewSettings: ProjectGraphViewSettings;
  onViewSettingsChange: (next: Partial<ProjectGraphViewSettings>) => void;
};

const graphControlSx = { textTransform: 'none' as const, fontWeight: 500 };
const filterSectionSummarySx = { px: 1.5, minHeight: 40 };
const filterSectionDetailsSx = { px: 1.5, pt: 0, pb: 1.5 };
const filterOptionSx = { m: 0 };

export const GraphFiltersPanel: React.FC<Props> = ({
  enabledNodeTypes,
  enabledEdgeKinds,
  onToggleNodeType,
  onToggleEdgeKind,
  onSelectAllNodeTypes,
  onSelectNoNodeTypes,
  onSelectAllEdgeKinds,
  onSelectNoEdgeKinds,
  viewSettings,
  onViewSettingsChange,
}) => {
  const { t } = useTranslation(['graph', 'common']);
  const nodeSizeLabel = t('graph:filters.nodeSize');
  const nodeLabelsLabel = t('graph:filters.nodeLabels');
  const edgeLabelsLabel = t('graph:filters.edgeLabels');
  const edgeThicknessLabel = t('graph:filters.edgeThickness');
  const edgeOpacityLabel = t('graph:filters.edgeOpacity');
  const layoutIntensityLabel = t('graph:filters.layoutIntensity');

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <Typography sx={{ fontWeight: 700, mb: 1, flexShrink: 0 }}>{t('graph:filters.title')}</Typography>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.5 }}>
        <Accordion defaultExpanded disableGutters elevation={0} sx={{ bgcolor: 'transparent', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />} sx={filterSectionSummarySx}>
            <Typography variant="subtitle2">{t('graph:filters.nodeTypes')}</Typography>
          </AccordionSummary>
          <AccordionDetails sx={filterSectionDetailsSx}>
            <Stack direction="row" spacing={0.75} sx={{ mb: 1 }}>
              <Button size="small" variant="outlined" onClick={onSelectAllNodeTypes} sx={graphControlSx}>
                {t('graph:filters.selectAll')}
              </Button>
              <Button size="small" variant="outlined" onClick={onSelectNoNodeTypes} sx={graphControlSx}>
                {t('graph:filters.selectNone')}
              </Button>
            </Stack>
            <Stack spacing={0.25}>
              {GRAPH_NODE_TYPES.map((nodeType) => (
                <FormControlLabel
                  key={nodeType}
                  sx={filterOptionSx}
                  control={
                    <Checkbox size="small" checked={enabledNodeTypes.has(nodeType)} onChange={() => onToggleNodeType(nodeType)} />
                  }
                  label={<Typography variant="body2">{t(`graph:nodeTypes.${nodeType}`)}</Typography>}
                />
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion defaultExpanded disableGutters elevation={0} sx={{ bgcolor: 'transparent', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />} sx={filterSectionSummarySx}>
            <Typography variant="subtitle2">{t('graph:filters.edgeKinds')}</Typography>
          </AccordionSummary>
          <AccordionDetails sx={filterSectionDetailsSx}>
            <Stack direction="row" spacing={0.75} sx={{ mb: 1 }}>
              <Button size="small" variant="outlined" onClick={onSelectAllEdgeKinds} sx={graphControlSx}>
                {t('graph:filters.selectAll')}
              </Button>
              <Button size="small" variant="outlined" onClick={onSelectNoEdgeKinds} sx={graphControlSx}>
                {t('graph:filters.selectNone')}
              </Button>
            </Stack>
            <Stack spacing={0.25}>
              {GRAPH_EDGE_KINDS.map((edgeKind) => (
                <FormControlLabel
                  key={edgeKind}
                  sx={filterOptionSx}
                  control={<Checkbox size="small" checked={enabledEdgeKinds.has(edgeKind)} onChange={() => onToggleEdgeKind(edgeKind)} />}
                  label={<Typography variant="body2">{t(`graph:edgeKinds.${edgeKind}`)}</Typography>}
                />
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion defaultExpanded disableGutters elevation={0} sx={{ bgcolor: 'transparent', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />} sx={filterSectionSummarySx}>
            <Typography variant="subtitle2">{t('graph:filters.display')}</Typography>
          </AccordionSummary>
          <AccordionDetails sx={filterSectionDetailsSx}>
            <Stack spacing={1.25}>
              <FormControl size="small" fullWidth>
                <InputLabel>{nodeSizeLabel}</InputLabel>
                <Select
                  label={nodeSizeLabel}
                  value={viewSettings.nodeSize}
                  onChange={(event) => onViewSettingsChange({ nodeSize: event.target.value as NodeSizeMode })}
                >
                  <MenuItem value="small">{t('graph:filters.nodeSizeSmall')}</MenuItem>
                  <MenuItem value="medium">{t('graph:filters.nodeSizeMedium')}</MenuItem>
                  <MenuItem value="large">{t('graph:filters.nodeSizeLarge')}</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>{nodeLabelsLabel}</InputLabel>
                <Select
                  label={nodeLabelsLabel}
                  value={viewSettings.nodeLabels}
                  onChange={(event) => onViewSettingsChange({ nodeLabels: event.target.value as LabelVisibilityMode })}
                >
                  <MenuItem value="always">{t('graph:filters.nodeLabelsAlways')}</MenuItem>
                  <MenuItem value="on-hover">{t('graph:filters.nodeLabelsOnHover')}</MenuItem>
                  <MenuItem value="off">{t('graph:filters.nodeLabelsOff')}</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>{edgeLabelsLabel}</InputLabel>
                <Select
                  label={edgeLabelsLabel}
                  value={viewSettings.edgeLabels}
                  onChange={(event) => onViewSettingsChange({ edgeLabels: event.target.value as 'on-hover' | 'off' })}
                >
                  <MenuItem value="on-hover">{t('graph:filters.edgeLabelsOnHover')}</MenuItem>
                  <MenuItem value="off">{t('graph:filters.edgeLabelsOff')}</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>{edgeThicknessLabel}</InputLabel>
                <Select
                  label={edgeThicknessLabel}
                  value={viewSettings.edgeThickness}
                  onChange={(event) => onViewSettingsChange({ edgeThickness: event.target.value as EdgeThicknessMode })}
                >
                  <MenuItem value="thin">{t('graph:filters.edgeThicknessThin')}</MenuItem>
                  <MenuItem value="normal">{t('graph:filters.edgeThicknessNormal')}</MenuItem>
                  <MenuItem value="thick">{t('graph:filters.edgeThicknessThick')}</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>{edgeOpacityLabel}</InputLabel>
                <Select
                  label={edgeOpacityLabel}
                  value={viewSettings.edgeOpacity}
                  onChange={(event) => onViewSettingsChange({ edgeOpacity: event.target.value as EdgeOpacityMode })}
                >
                  <MenuItem value="low">{t('graph:filters.edgeOpacityLow')}</MenuItem>
                  <MenuItem value="medium">{t('graph:filters.edgeOpacityMedium')}</MenuItem>
                  <MenuItem value="high">{t('graph:filters.edgeOpacityHigh')}</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>{layoutIntensityLabel}</InputLabel>
                <Select
                  label={layoutIntensityLabel}
                  value={viewSettings.layoutIntensity}
                  onChange={(event) => onViewSettingsChange({ layoutIntensity: event.target.value as LayoutIntensityMode })}
                >
                  <MenuItem value="compact">{t('graph:filters.layoutCompact')}</MenuItem>
                  <MenuItem value="balanced">{t('graph:filters.layoutBalanced')}</MenuItem>
                  <MenuItem value="loose">{t('graph:filters.layoutLoose')}</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                sx={filterOptionSx}
                control={
                  <Switch
                    checked={viewSettings.focusSelectedNeighborhood}
                    onChange={(event) => onViewSettingsChange({ focusSelectedNeighborhood: event.target.checked })}
                  />
                }
                label={t('graph:filters.focusNeighborhood')}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>
        <Divider sx={{ my: 1 }} />
      </Box>
    </Box>
  );
};
