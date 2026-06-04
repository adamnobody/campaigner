import {
  Box,
  Breadcrumbs,
  Button,
  Chip,
  IconButton,
  Link,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import MouseIcon from '@mui/icons-material/Mouse';
import PlaceIcon from '@mui/icons-material/Place';
import PentagonIcon from '@mui/icons-material/Pentagon';
import LandscapeIcon from '@mui/icons-material/Landscape';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import GestureIcon from '@mui/icons-material/Gesture';
import PolylineIcon from '@mui/icons-material/Timeline';
import RectangleIcon from '@mui/icons-material/Crop75';
import EllipseIcon from '@mui/icons-material/PanoramaFishEye';
import ImageIcon from '@mui/icons-material/Image';
import CheckIcon from '@mui/icons-material/Check';
import UndoIcon from '@mui/icons-material/Undo';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslation } from 'react-i18next';
import type { CanvasMode } from '../canvas/canvasModel';
import type { NavigationEntry } from '../canvas/navigationStack';

type Props = {
  sceneName: string;
  navigationTrail: NavigationEntry[];
  onBreadcrumbNavigate: (sceneId: number, index: number) => void;
  onNavigationBack: () => void;
  mode: CanvasMode;
  onModeChange: (mode: CanvasMode) => void;
  zoomPercent: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  objectCount: number;
  markersCount: number;
  territoriesCount: number;
  selectedLabel: string | null;
  draftPointsCount: number;
  onUndoDraftPoint: () => void;
  onFinishTerritory: () => void;
  onCancelTerritory: () => void;
  territoryCompletedRingCount?: number;
  canFinishTerritoryDrawing?: boolean;
  onCompleteTerritoryRing?: () => void;
  territoryEditActive?: boolean;
  territoryEditLabel?: string;
  onSaveTerritoryShape?: () => void;
  onCancelTerritoryShape?: () => void;
  onAddImage: () => void;
};

export function MapToolbar({
  sceneName,
  navigationTrail,
  onBreadcrumbNavigate,
  onNavigationBack,
  mode,
  onModeChange,
  zoomPercent,
  onZoomIn,
  onZoomOut,
  onResetView,
  objectCount,
  markersCount,
  territoriesCount,
  selectedLabel,
  draftPointsCount,
  onUndoDraftPoint,
  onFinishTerritory,
  onCancelTerritory,
  territoryCompletedRingCount = 0,
  canFinishTerritoryDrawing = false,
  onCompleteTerritoryRing,
  territoryEditActive = false,
  territoryEditLabel,
  onSaveTerritoryShape,
  onCancelTerritoryShape,
  onAddImage,
}: Props) {
  const theme = useTheme();
  const { t } = useTranslation(['map', 'common']);
  const showBreadcrumbs = navigationTrail.length > 1;

  return (
    <Box data-tour="map-toolbar" display="flex" flexDirection="column" gap={0.5} mb={1}>
      {showBreadcrumbs && (
        <Box display="flex" alignItems="center" gap={0.5} minWidth={0}>
          <Tooltip title={t('map:canvas.breadcrumbs.back')}>
            <IconButton size="small" onClick={onNavigationBack} aria-label={t('map:canvas.breadcrumbs.back')}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Breadcrumbs
            aria-label={t('map:canvas.entityName')}
            sx={{ color: 'text.secondary', flex: 1, minWidth: 0 }}
          >
            {navigationTrail.map((entry, index) => {
              const isLast = index === navigationTrail.length - 1;
              const label = entry.via === 'root'
                ? t('map:breadcrumb.worldMap')
                : entry.label;
              if (isLast) {
                return (
                  <Typography key={entry.sceneId} variant="body2" color="text.primary" noWrap>
                    {label}
                  </Typography>
                );
              }
              return (
                <Link
                  key={entry.sceneId}
                  component="button"
                  type="button"
                  variant="body2"
                  underline="hover"
                  color="inherit"
                  onClick={() => onBreadcrumbNavigate(entry.sceneId, index)}
                  sx={{ cursor: 'pointer', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}
                  aria-label={t('map:canvas.breadcrumbs.navigateTo', { name: label })}
                >
                  {label}
                </Link>
              );
            })}
          </Breadcrumbs>
        </Box>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
        <Box minWidth={0}>
          <Typography
            sx={{
              fontFamily: '"Cinzel", serif',
              fontWeight: 700,
              fontSize: '1.55rem',
              color: 'text.primary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {sceneName || t('map:canvas.defaults.sceneName')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('map:canvas.toolbar.sceneStats', {
              count: objectCount,
              selected: selectedLabel ? t('map:canvas.toolbar.selectedWithName', { name: selectedLabel }) : '',
            })}
          </Typography>
        </Box>

        <Box display="flex" gap={1} alignItems="center" flexWrap="wrap" justifyContent="flex-end">
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, value: CanvasMode | null) => {
              if (value) onModeChange(value);
            }}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                color: 'text.secondary',
                borderColor: theme.palette.divider,
                px: 0.8,
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                  backgroundColor: alpha(theme.palette.primary.main, 0.15),
                },
              },
            }}
          >
            <ToggleButton value="select"><Tooltip title={t('map:canvas.toolbar.tooltipSelect')}><MouseIcon fontSize="small" /></Tooltip></ToggleButton>
            <ToggleButton value="marker"><Tooltip title={t('map:canvas.toolbar.tooltipMarker')}><PlaceIcon fontSize="small" /></Tooltip></ToggleButton>
            <ToggleButton value="text"><Tooltip title={t('map:canvas.toolbar.toolText')}><TextFieldsIcon fontSize="small" /></Tooltip></ToggleButton>
            <ToggleButton value="draw_territory"><Tooltip title={t('map:canvas.toolbar.tooltipDrawTerritory')}><LandscapeIcon fontSize="small" /></Tooltip></ToggleButton>
            <ToggleButton value="polygon"><Tooltip title={t('map:canvas.toolbar.toolPolygon')}><PentagonIcon fontSize="small" /></Tooltip></ToggleButton>
            <ToggleButton value="polyline"><Tooltip title={t('map:canvas.toolbar.toolPolyline')}><PolylineIcon fontSize="small" /></Tooltip></ToggleButton>
            <ToggleButton value="rectangle"><Tooltip title={t('map:canvas.toolbar.toolRectangle')}><RectangleIcon fontSize="small" /></Tooltip></ToggleButton>
            <ToggleButton value="ellipse"><Tooltip title={t('map:canvas.toolbar.toolEllipse')}><EllipseIcon fontSize="small" /></Tooltip></ToggleButton>
            <ToggleButton value="curve_text"><Tooltip title={t('map:canvas.toolbar.toolCurveText')}><GestureIcon fontSize="small" /></Tooltip></ToggleButton>
            <ToggleButton value="image"><Tooltip title={t('map:canvas.toolbar.toolImage')}><ImageIcon fontSize="small" /></Tooltip></ToggleButton>
          </ToggleButtonGroup>

          {territoryEditActive && territoryEditLabel && (
            <Box display="flex" gap={0.5} alignItems="center" flexWrap="wrap">
              <Chip size="small" color="warning" variant="outlined" label={territoryEditLabel} />
              <Button
                size="small"
                variant="contained"
                startIcon={<CheckIcon />}
                onClick={onSaveTerritoryShape}
              >
                {t('map:canvas.toolbar.save')}
              </Button>
              <Button size="small" variant="outlined" onClick={onCancelTerritoryShape}>
                {t('common:cancel')}
              </Button>
            </Box>
          )}

          {mode === 'draw_territory' && (
            <Box display="flex" gap={0.5} alignItems="center" flexWrap="wrap">
              <Chip
                size="small"
                variant="outlined"
                label={t('map:canvas.toolbar.drawingChip', {
                  rings: territoryCompletedRingCount,
                  points: draftPointsCount,
                })}
              />
              <IconButton size="small" onClick={onUndoDraftPoint} disabled={draftPointsCount === 0}>
                <UndoIcon fontSize="small" />
              </IconButton>
              <Button
                size="small"
                variant="outlined"
                disabled={draftPointsCount < 3}
                onClick={onCompleteTerritoryRing}
              >
                {t('map:canvas.toolbar.completeContour')}
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={<CheckIcon />}
                disabled={!canFinishTerritoryDrawing}
                onClick={onFinishTerritory}
              >
                {t('map:canvas.toolbar.save')}
              </Button>
              <Button size="small" variant="outlined" onClick={onCancelTerritory}>{t('common:cancel')}</Button>
            </Box>
          )}

          {(mode === 'polygon' || mode === 'polyline') && (
            <Box display="flex" gap={0.5} alignItems="center">
              <Chip
                size="small"
                variant="outlined"
                label={t('map:canvas.toolbar.drawingPoints', { count: draftPointsCount })}
              />
              <IconButton size="small" onClick={onUndoDraftPoint} disabled={draftPointsCount === 0}><UndoIcon fontSize="small" /></IconButton>
              <Button
                size="small"
                variant="contained"
                startIcon={<CheckIcon />}
                disabled={draftPointsCount < (mode === 'polyline' ? 2 : 3)}
                onClick={onFinishTerritory}
              >
                {t('map:canvas.toolbar.save')}
              </Button>
              <Button size="small" variant="outlined" onClick={onCancelTerritory}>{t('common:cancel')}</Button>
            </Box>
          )}

          <Chip
            size="small"
            variant="outlined"
            label={t('map:canvas.toolbar.statsChip', { markers: markersCount, territories: territoriesCount })}
            sx={{ '& .MuiChip-label': { fontSize: '0.8rem' } }}
          />

          <Box display="flex" gap={0.5} sx={{ backgroundColor: alpha(theme.palette.background.paper, 0.6), borderRadius: 1, p: 0.5 }}>
            <IconButton size="small" onClick={onZoomOut}><ZoomOutIcon fontSize="small" /></IconButton>
            <Typography sx={{ color: 'text.primary', fontSize: '0.9rem', lineHeight: '30px', px: 1, minWidth: 48, textAlign: 'center' }}>
              {t('map:canvas.toolbar.zoomPercent', { value: zoomPercent })}
            </Typography>
            <IconButton size="small" onClick={onZoomIn}><ZoomInIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={onResetView}><CenterFocusStrongIcon fontSize="small" /></IconButton>
          </Box>

          <Button variant="outlined" startIcon={<CloudUploadIcon />} size="small" onClick={onAddImage}>
            {t('map:canvas.toolbar.addImage')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
