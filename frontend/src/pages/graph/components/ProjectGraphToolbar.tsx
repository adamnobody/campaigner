import React from 'react';
import { Box, FormControlLabel, IconButton, Switch, TextField, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { DndButton } from '@/components/ui/DndButton';

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  showIsolated: boolean;
  onShowIsolatedChange: (value: boolean) => void;
  nodeLimit: number;
  onNodeLimitChange: (value: number) => void;
  zoomPercent: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onFit: () => void;
  layoutPaused: boolean;
  onToggleLayoutPaused: () => void;
  onRelayout: () => void;
};

export const ProjectGraphToolbar: React.FC<Props> = ({
  search,
  onSearchChange,
  showIsolated,
  onShowIsolatedChange,
  nodeLimit,
  onNodeLimitChange,
  zoomPercent,
  onZoomIn,
  onZoomOut,
  onResetView,
  onFit,
  layoutPaused,
  onToggleLayoutPaused,
  onRelayout,
}) => (
  <Box display="flex" gap={1.2} alignItems="center" flexWrap="wrap" mb={1.2}>
    <TextField
      size="small"
      label="Поиск узлов"
      value={search}
      onChange={(event) => onSearchChange(event.target.value)}
      placeholder="Имя, название..."
      sx={{ minWidth: 220, flexGrow: 1 }}
    />
    <TextField
      size="small"
      label="Лимит"
      type="number"
      value={nodeLimit}
      onChange={(event) => onNodeLimitChange(Math.max(50, Number(event.target.value) || 300))}
      sx={{ width: 100 }}
      inputProps={{ min: 50, max: 800, step: 10 }}
    />
    <FormControlLabel
      control={<Switch checked={showIsolated} onChange={(event) => onShowIsolatedChange(event.target.checked)} />}
      label="Показывать изолированные"
    />
    <Box display="flex" alignItems="center" gap={0.4}>
      <Tooltip title="Уменьшить масштаб">
        <span><IconButton size="small" onClick={onZoomOut}><RemoveIcon fontSize="small" /></IconButton></span>
      </Tooltip>
      <Typography variant="caption" sx={{ minWidth: 46, textAlign: 'center' }}>
        {zoomPercent}%
      </Typography>
      <Tooltip title="Увеличить масштаб">
        <span><IconButton size="small" onClick={onZoomIn}><AddIcon fontSize="small" /></IconButton></span>
      </Tooltip>
    </Box>
    <DndButton variant="outlined" size="small" startIcon={<CenterFocusStrongIcon />} onClick={onFit}>
      Вписать
    </DndButton>
    <DndButton variant="outlined" size="small" startIcon={<RestartAltIcon />} onClick={onResetView}>
      Сбросить вид
    </DndButton>
    <DndButton
      variant="outlined"
      size="small"
      startIcon={layoutPaused ? <PlayCircleOutlineIcon /> : <PauseCircleOutlineIcon />}
      onClick={onToggleLayoutPaused}
    >
      {layoutPaused ? 'Разморозить' : 'Зафиксировать'}
    </DndButton>
    <DndButton variant="outlined" size="small" onClick={onRelayout}>
      Перерасставить
    </DndButton>
  </Box>
);
