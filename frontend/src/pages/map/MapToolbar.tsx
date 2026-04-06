import React from 'react';
import {
  Box, Typography, Button, IconButton,
  Chip, Tooltip, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PentagonIcon from '@mui/icons-material/Pentagon';
import MouseIcon from '@mui/icons-material/Mouse';
import UndoIcon from '@mui/icons-material/Undo';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import type { MapMode } from './mapUtils';
import type { MapData } from './mapUtils';

export type MapToolbarProps = {
  mapBreadcrumbs: MapData[];
  onNavigateToParent: () => void;
  onNavigateToBreadcrumb: (index: number) => void;
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
  drawingCompletedRingsCount: number;
  drawingPointsCount: number;
  onUndoLastPoint: () => void;
  onCompleteContour: () => void;
  onFinishDrawing: () => void;
  onCancelDrawing: () => void;
  zoomDisplay: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  markersCount: number;
  territoriesCount: number;
  onUploadMap: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export const MapToolbar: React.FC<MapToolbarProps> = ({
  mapBreadcrumbs,
  onNavigateToParent,
  onNavigateToBreadcrumb,
  mode,
  onModeChange,
  drawingCompletedRingsCount,
  drawingPointsCount,
  onUndoLastPoint,
  onCompleteContour,
  onFinishDrawing,
  onCancelDrawing,
  zoomDisplay,
  onZoomIn,
  onZoomOut,
  onResetView,
  markersCount,
  territoriesCount,
  onUploadMap,
}) => (
  <Box data-tour="map-toolbar" display="flex" justifyContent="space-between" alignItems="center" mb={1}>
    <Box display="flex" alignItems="center" gap={1}>
      {mapBreadcrumbs.length > 1 && (
        <IconButton size="small" onClick={onNavigateToParent} sx={{ color: 'rgba(255,255,255,0.5)' }}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
      )}
      <Box display="flex" alignItems="center" gap={0.5}>
        {mapBreadcrumbs.map((bc, i) => {
          const isLast = i === mapBreadcrumbs.length - 1;
          return (
            <React.Fragment key={bc.id}>
              {i > 0 && <Typography sx={{ color: 'rgba(255,255,255,0.2)', mx: 0.5 }}>›</Typography>}
              <Typography
                onClick={isLast ? undefined : () => onNavigateToBreadcrumb(i)}
                sx={{
                  fontFamily: '"Cinzel", serif',
                  fontWeight: isLast ? 700 : 400,
                  fontSize: isLast ? '1.55rem' : '1.05rem',
                  color: isLast ? '#fff' : 'rgba(255,255,255,0.4)',
                  cursor: isLast ? 'default' : 'pointer',
                  ...(!isLast && { '&:hover': { color: 'rgba(255,255,255,0.7)' } }),
                }}
              >
                {bc.name}
              </Typography>
            </React.Fragment>
          );
        })}
      </Box>
    </Box>

    <Box display="flex" gap={1} alignItems="center">
      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={(_, v: MapMode | null) => {
          if (v) onModeChange(v);
        }}
        size="small"
        sx={{
          '& .MuiToggleButton-root': {
            color: 'rgba(255,255,255,0.5)',
            borderColor: 'rgba(255,255,255,0.15)',
            px: 1.5, py: 0.5,
            '&.Mui-selected': {
              color: '#fff',
              backgroundColor: 'rgba(78,205,196,0.15)',
              borderColor: 'rgba(78,205,196,0.4)',
            },
          },
        }}
      >
        <ToggleButton value="select">
          <Tooltip title="Режим выбора">
            <MouseIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton value="draw_territory">
          <Tooltip title="Рисовать территорию">
            <PentagonIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>

      {mode === 'draw_territory' && (
        <Box display="flex" gap={0.5} alignItems="center">
          <Chip
            label={`${drawingCompletedRingsCount} конт. · ${drawingPointsCount} т.к.`}
            size="small" variant="outlined"
            sx={{ borderColor: 'rgba(78,205,196,0.3)', color: '#4ECDC4' }}
          />
          <IconButton size="small" onClick={onUndoLastPoint} disabled={drawingPointsCount === 0}
            sx={{ color: 'rgba(255,255,255,0.5)' }}>
            <UndoIcon fontSize="small" />
          </IconButton>
          <Button size="small" variant="outlined" startIcon={<AddIcon />}
            onClick={onCompleteContour} disabled={drawingPointsCount < 3}
            sx={{ borderColor: 'rgba(78,205,196,0.45)', color: '#4ECDC4', fontWeight: 600,
              '&:hover': { borderColor: '#4ECDC4', backgroundColor: 'rgba(78,205,196,0.08)' },
              '&.Mui-disabled': { borderColor: 'rgba(78,205,196,0.15)', color: 'rgba(78,205,196,0.25)' } }}>
            Контур готов
          </Button>
          <Button size="small" variant="contained" startIcon={<CheckIcon />}
            onClick={onFinishDrawing}
            disabled={drawingCompletedRingsCount === 0 && drawingPointsCount < 3}
            sx={{ backgroundColor: '#4ECDC4', color: '#000', fontWeight: 600,
              '&:hover': { backgroundColor: '#45b7aa' },
              '&.Mui-disabled': { backgroundColor: 'rgba(78,205,196,0.2)', color: 'rgba(0,0,0,0.3)' } }}>
            Сохранить
          </Button>
          <Button size="small" variant="outlined" onClick={onCancelDrawing}
            sx={{ borderColor: 'rgba(255,100,100,0.3)', color: 'rgba(255,100,100,0.7)' }}>
            Отмена
          </Button>
        </Box>
      )}

      <Box display="flex" gap={0.5} sx={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 1, p: 0.5 }}>
        <IconButton size="small" onClick={onZoomOut} sx={{ color: '#fff' }}><ZoomOutIcon fontSize="small" /></IconButton>
        <Typography sx={{ color: '#fff', fontSize: '0.9rem', lineHeight: '30px', px: 1, minWidth: 40, textAlign: 'center' }}>
          {Math.round(zoomDisplay * 100)}%
        </Typography>
        <IconButton size="small" onClick={onZoomIn} sx={{ color: '#fff' }}><ZoomInIcon fontSize="small" /></IconButton>
        <IconButton size="small" onClick={onResetView} sx={{ color: '#fff' }}><CenterFocusStrongIcon fontSize="small" /></IconButton>
      </Box>

      <Chip icon={<DragIndicatorIcon sx={{ fontSize: 14 }} />}
        label={`${markersCount} маркеров · ${territoriesCount} территорий`}
        size="small" variant="outlined"
        sx={{
          borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)',
          '& .MuiChip-label': { fontSize: '0.8rem' },
        }} />

      <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} size="small"
        data-tour="map-upload"
        sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
        Загрузить карту
        <input type="file" hidden accept="image/*" onChange={onUploadMap} />
      </Button>
    </Box>
  </Box>
);
