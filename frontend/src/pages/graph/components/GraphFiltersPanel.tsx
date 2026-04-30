import React from 'react';
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
  GRAPH_EDGE_KIND_LABELS,
  GRAPH_EDGE_KINDS,
  GRAPH_NODE_TYPE_LABELS,
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
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',
    }}
  >
    <Typography sx={{ fontWeight: 700, mb: 1, flexShrink: 0 }}>Фильтры</Typography>
    <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.5, mr: -0.5 }}>
      <Accordion defaultExpanded disableGutters elevation={0} sx={{ bgcolor: 'transparent', '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />} sx={{ px: 0, minHeight: 40 }}>
          <Typography variant="subtitle2">Типы узлов</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, pt: 0 }}>
          <Stack direction="row" spacing={0.75} sx={{ mb: 1 }}>
            <Button size="small" variant="outlined" onClick={onSelectAllNodeTypes} sx={graphControlSx}>
              Все
            </Button>
            <Button size="small" variant="outlined" onClick={onSelectNoNodeTypes} sx={graphControlSx}>
              Ни одного
            </Button>
          </Stack>
          <Stack spacing={0.25}>
            {GRAPH_NODE_TYPES.map((nodeType) => (
              <FormControlLabel
                key={nodeType}
                control={
                  <Checkbox size="small" checked={enabledNodeTypes.has(nodeType)} onChange={() => onToggleNodeType(nodeType)} />
                }
                label={<Typography variant="body2">{GRAPH_NODE_TYPE_LABELS[nodeType]}</Typography>}
              />
            ))}
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded disableGutters elevation={0} sx={{ bgcolor: 'transparent', '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />} sx={{ px: 0, minHeight: 40 }}>
          <Typography variant="subtitle2">Типы связей</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, pt: 0 }}>
          <Stack direction="row" spacing={0.75} sx={{ mb: 1 }}>
            <Button size="small" variant="outlined" onClick={onSelectAllEdgeKinds} sx={graphControlSx}>
              Все
            </Button>
            <Button size="small" variant="outlined" onClick={onSelectNoEdgeKinds} sx={graphControlSx}>
              Ни одного
            </Button>
          </Stack>
          <Stack spacing={0.25}>
            {GRAPH_EDGE_KINDS.map((edgeKind) => (
              <FormControlLabel
                key={edgeKind}
                control={<Checkbox size="small" checked={enabledEdgeKinds.has(edgeKind)} onChange={() => onToggleEdgeKind(edgeKind)} />}
                label={<Typography variant="body2">{GRAPH_EDGE_KIND_LABELS[edgeKind]}</Typography>}
              />
            ))}
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded disableGutters elevation={0} sx={{ bgcolor: 'transparent', '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />} sx={{ px: 0, minHeight: 40 }}>
          <Typography variant="subtitle2">Отображение</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, pt: 0 }}>
          <Stack spacing={1.25}>
            <FormControl size="small" fullWidth>
              <InputLabel>Размер узлов</InputLabel>
              <Select
                label="Размер узлов"
                value={viewSettings.nodeSize}
                onChange={(event) => onViewSettingsChange({ nodeSize: event.target.value as NodeSizeMode })}
              >
                <MenuItem value="small">Маленький</MenuItem>
                <MenuItem value="medium">Средний</MenuItem>
                <MenuItem value="large">Большой</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Подписи узлов</InputLabel>
              <Select
                label="Подписи узлов"
                value={viewSettings.nodeLabels}
                onChange={(event) => onViewSettingsChange({ nodeLabels: event.target.value as LabelVisibilityMode })}
              >
                <MenuItem value="always">Всегда</MenuItem>
                <MenuItem value="on-hover">При наведении</MenuItem>
                <MenuItem value="off">Выключено</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Подписи связей</InputLabel>
              <Select
                label="Подписи связей"
                value={viewSettings.edgeLabels}
                onChange={(event) => onViewSettingsChange({ edgeLabels: event.target.value as 'on-hover' | 'off' })}
              >
                <MenuItem value="on-hover">При наведении</MenuItem>
                <MenuItem value="off">Выключено</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Толщина связей</InputLabel>
              <Select
                label="Толщина связей"
                value={viewSettings.edgeThickness}
                onChange={(event) => onViewSettingsChange({ edgeThickness: event.target.value as EdgeThicknessMode })}
              >
                <MenuItem value="thin">Тонкие</MenuItem>
                <MenuItem value="normal">Обычные</MenuItem>
                <MenuItem value="thick">Толстые</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Прозрачность связей</InputLabel>
              <Select
                label="Прозрачность связей"
                value={viewSettings.edgeOpacity}
                onChange={(event) => onViewSettingsChange({ edgeOpacity: event.target.value as EdgeOpacityMode })}
              >
                <MenuItem value="low">Низкая</MenuItem>
                <MenuItem value="medium">Средняя</MenuItem>
                <MenuItem value="high">Высокая</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Интенсивность layout</InputLabel>
              <Select
                label="Интенсивность layout"
                value={viewSettings.layoutIntensity}
                onChange={(event) => onViewSettingsChange({ layoutIntensity: event.target.value as LayoutIntensityMode })}
              >
                <MenuItem value="compact">Компактно</MenuItem>
                <MenuItem value="balanced">Сбалансировано</MenuItem>
                <MenuItem value="loose">Свободно</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={viewSettings.focusSelectedNeighborhood}
                  onChange={(event) => onViewSettingsChange({ focusSelectedNeighborhood: event.target.checked })}
                />
              }
              label="Окружение выбранного"
            />
          </Stack>
        </AccordionDetails>
      </Accordion>
      <Divider sx={{ my: 1 }} />
    </Box>
  </Box>
);
