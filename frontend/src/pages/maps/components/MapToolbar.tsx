import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, IconButton,
  Chip, Tooltip, ToggleButton, ToggleButtonGroup,
  useTheme, alpha,
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
import { localizedRootMapDisplayedName, type MapData, type MapMode } from './mapUtils';

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
}) => {
  const theme = useTheme();
  const { t } = useTranslation(['map', 'common']);

  return (
    <Box data-tour="map-toolbar" display="flex" justifyContent="space-between" alignItems="center" mb={1}>
      <Box display="flex" alignItems="center" gap={1}>
        {mapBreadcrumbs.length > 1 && (
          <IconButton size="small" onClick={onNavigateToParent} sx={{ color: 'text.secondary' }}
            aria-label={t('map:toolbar.backParentAria')}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        )}
        <Box display="flex" alignItems="center" gap={0.5}>
          {mapBreadcrumbs.map((bc, i) => {
            const isLast = i === mapBreadcrumbs.length - 1;
            return (
              <React.Fragment key={bc.id}>
                {i > 0 && <Typography sx={{ color: 'text.disabled', mx: 0.5 }}>›</Typography>}
                <Typography
                  onClick={isLast ? undefined : () => onNavigateToBreadcrumb(i)}
                  sx={{
                    fontFamily: '"Cinzel", serif',
                    fontWeight: isLast ? 700 : 400,
                    fontSize: isLast ? '1.55rem' : '1.05rem',
                    color: isLast ? 'text.primary' : 'text.secondary',
                    cursor: isLast ? 'default' : 'pointer',
                    ...(!isLast && { '&:hover': { color: 'text.primary' } }),
                  }}
                >
                  {localizedRootMapDisplayedName(bc, t('map:breadcrumb.worldMap'))}
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
              color: 'text.secondary',
              borderColor: theme.palette.divider,
              px: 1.5, py: 0.5,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
                backgroundColor: alpha(theme.palette.primary.main, 0.15),
                borderColor: alpha(theme.palette.primary.main, 0.4),
              },
            },
          }}
        >
          <ToggleButton value="select">
            <Tooltip title={t('map:toolbar.tooltipSelectMode')}>
              <MouseIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="draw_territory">
            <Tooltip title={t('map:toolbar.tooltipDrawTerritory')}>
              <PentagonIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>

        {mode === 'draw_territory' && (
          <Box display="flex" gap={0.5} alignItems="center">
            <Chip
              label={t('map:toolbar.drawingChip', { rings: drawingCompletedRingsCount, points: drawingPointsCount })}
              size="small" variant="outlined"
              sx={{ borderColor: alpha(theme.palette.primary.main, 0.3), color: theme.palette.primary.main }}
            />
            <IconButton size="small" onClick={onUndoLastPoint} disabled={drawingPointsCount === 0}
              sx={{ color: 'text.secondary' }}>
              <UndoIcon fontSize="small" />
            </IconButton>
            <Button size="small" variant="outlined" startIcon={<AddIcon />}
              onClick={onCompleteContour} disabled={drawingPointsCount < 3}
              sx={{ borderColor: alpha(theme.palette.primary.main, 0.45), color: theme.palette.primary.main, fontWeight: 600,
                '&:hover': { borderColor: theme.palette.primary.main, backgroundColor: alpha(theme.palette.primary.main, 0.08) },
                '&.Mui-disabled': { borderColor: alpha(theme.palette.primary.main, 0.15), color: alpha(theme.palette.primary.main, 0.25) } }}>
              {t('map:toolbar.completeContour')}
            </Button>
            <Button size="small" variant="contained" startIcon={<CheckIcon />}
              onClick={onFinishDrawing}
              disabled={drawingCompletedRingsCount === 0 && drawingPointsCount < 3}
              sx={{ backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText, fontWeight: 600,
                '&:hover': { backgroundColor: theme.palette.primary.dark },
                '&.Mui-disabled': { backgroundColor: alpha(theme.palette.primary.main, 0.2), color: alpha(theme.palette.text.primary, 0.3) } }}>
              {t('common:save')}
            </Button>
            <Button size="small" variant="outlined" onClick={onCancelDrawing}
              sx={{ borderColor: alpha(theme.palette.error.main, 0.3), color: alpha(theme.palette.error.main, 0.7) }}>
              {t('common:cancel')}
            </Button>
          </Box>
        )}

        <Box display="flex" gap={0.5} sx={{ backgroundColor: alpha(theme.palette.background.paper, 0.6), borderRadius: 1, p: 0.5 }}>
          <IconButton size="small" onClick={onZoomOut} sx={{ color: 'text.secondary' }}><ZoomOutIcon fontSize="small" /></IconButton>
          <Typography sx={{ color: 'text.primary', fontSize: '0.9rem', lineHeight: '30px', px: 1, minWidth: 40, textAlign: 'center' }}>
            {t('map:toolbar.zoomPercent', { value: Math.round(zoomDisplay * 100) })}
          </Typography>
          <IconButton size="small" onClick={onZoomIn} sx={{ color: 'text.secondary' }}><ZoomInIcon fontSize="small" /></IconButton>
          <IconButton size="small" onClick={onResetView} sx={{ color: 'text.secondary' }}><CenterFocusStrongIcon fontSize="small" /></IconButton>
        </Box>

        <Chip icon={<DragIndicatorIcon sx={{ fontSize: 14 }} />}
          label={t('map:toolbar.statsChip', { markers: markersCount, territories: territoriesCount })}
          size="small" variant="outlined"
          sx={{
            borderColor: theme.palette.divider, color: 'text.secondary',
            '& .MuiChip-label': { fontSize: '0.8rem' },
          }} />

        <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} size="small"
          data-tour="map-upload"
          sx={{ borderColor: theme.palette.divider, color: 'text.secondary' }}>
          {t('map:toolbar.uploadMap')}
          <input type="file" hidden accept="image/*" onChange={onUploadMap} />
        </Button>
      </Box>
    </Box>
  );
};
