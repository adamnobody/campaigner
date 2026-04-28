import React from 'react';
import { Box, Checkbox, Divider, FormControl, FormControlLabel, InputLabel, MenuItem, Select, Switch, Typography } from '@mui/material';
import { GlassCard } from '@/components/ui/GlassCard';
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
  viewSettings: ProjectGraphViewSettings;
  onViewSettingsChange: (next: Partial<ProjectGraphViewSettings>) => void;
};

export const ProjectGraphFilters: React.FC<Props> = ({
  enabledNodeTypes,
  enabledEdgeKinds,
  onToggleNodeType,
  onToggleEdgeKind,
  viewSettings,
  onViewSettingsChange,
}) => (
  <GlassCard sx={{ p: 1.5 }}>
    <Typography sx={{ fontWeight: 700, mb: 0.8 }}>Фильтры</Typography>
    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Типы узлов</Typography>
    <Box display="flex" flexDirection="column" mb={1}>
      {GRAPH_NODE_TYPES.map((nodeType) => (
        <FormControlLabel
          key={nodeType}
          control={<Checkbox size="small" checked={enabledNodeTypes.has(nodeType)} onChange={() => onToggleNodeType(nodeType)} />}
          label={<Typography variant="body2">{GRAPH_NODE_TYPE_LABELS[nodeType]}</Typography>}
        />
      ))}
    </Box>
    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Типы связей</Typography>
    <Box display="flex" flexDirection="column">
      {GRAPH_EDGE_KINDS.map((edgeKind) => (
        <FormControlLabel
          key={edgeKind}
          control={<Checkbox size="small" checked={enabledEdgeKinds.has(edgeKind)} onChange={() => onToggleEdgeKind(edgeKind)} />}
          label={<Typography variant="body2">{GRAPH_EDGE_KIND_LABELS[edgeKind]}</Typography>}
        />
      ))}
    </Box>
    <Divider sx={{ my: 1 }} />
    <Typography sx={{ fontWeight: 700, mb: 0.8 }}>Отображение</Typography>
    <Box display="grid" gridTemplateColumns="1fr" gap={1}>
      <FormControl size="small">
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
      <FormControl size="small">
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
      <FormControl size="small">
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
      <FormControl size="small">
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
      <FormControl size="small">
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
      <FormControl size="small">
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
    </Box>
  </GlassCard>
);
