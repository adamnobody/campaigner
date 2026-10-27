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
import LandscapeIcon from '@mui/icons-material/Landscape';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ImageIcon from '@mui/icons-material/Image';
import CheckIcon from '@mui/icons-material/Check';
import UndoIcon from '@mui/icons-material/Undo';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MapIcon from '@mui/icons-material/Map';
import { useTranslation } from 'react-i18next';
import { MapAddShapeMenu } from './MapAddShapeMenu';
import type { ShapeVariant } from '../canvas/shapeObjectForm';
import type { CanvasMode } from '../canvas/canvasModel';
import { isMapScene, isRootCanvasScene, isToolAllowedForSceneType, isToolbarToolVisible } from '../canvas/canvasTools';
import {
  formatNavigationBreadcrumbLabel,
  type NavigationEntry,
  type SceneTypeById,
} from '../canvas/navigationStack';

type Props = {
  sceneName: string;
  sceneType?: string | null;
  sceneTypesById: SceneTypeById;
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
  onAddImage: () => void;
  onAddShape: (variant: ShapeVariant) => void;
};

export function MapToolbar({
  sceneName,
  sceneType,
  sceneTypesById,
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
  onAddImage,
  onAddShape,
}: Props) {
  const theme = useTheme();
  const { t } = useTranslation(['map', 'common']);
  const showBreadcrumbs = navigationTrail.length > 1;
  const breadcrumbLabels = {
    root: t('map:canvas.breadcrumbs.rootCanvas'),
    fallbackMap: t('map:canvas.breadcrumbs.mapFallback'),
  };
  const sceneTypeLabel = isRootCanvasScene(sceneType)
    ? t('map:canvas.sceneType.root')
    : isMapScene(sceneType)
      ? t('map:canvas.sceneType.map')
      : null;

  const allowTool = (toolMode: CanvasMode) =>
    isToolAllowedForSceneType(toolMode, sceneType) && isToolbarToolVisible(toolMode);

  return (
    <Box data-tour="map-toolbar" display="flex" flexDirection="column" gap={1} mb={1.25}>
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
              const label = formatNavigationBreadcrumbLabel(entry, sceneTypesById, breadcrumbLabels);
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

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-end"
        gap={{ xs: 2, lg: 5 }}
        flexWrap="wrap"
      >
        <Box minWidth={0} display="flex" alignItems="center" gap={1}>
          <Box minWidth={0}>
            <Typography
              variant="overline"
              sx={{ display: 'block', color: 'text.disabled', mb: 0.75 }}
            >
              {isRootCanvasScene(sceneType)
                ? t('map:canvas.toolbar.sceneStatsRoot', {
                    count: objectCount,
                    selected: selectedLabel ? t('map:canvas.toolbar.selectedWithName', { name: selectedLabel }) : '',
                  })
                : t('map:canvas.toolbar.sceneStats', {
                    count: objectCount,
                    selected: selectedLabel ? t('map:canvas.toolbar.selectedWithName', { name: selectedLabel }) : '',
                  })}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <Typography
                sx={{
                  fontFamily: theme.campaigner.typography.display,
                  fontWeight: 600,
                  fontSize: { xs: '1.8rem', md: '2.1rem' },
                  lineHeight: 1.02,
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {sceneName || t('map:canvas.defaults.sceneName')}
              </Typography>
              {sceneTypeLabel && (
                <Chip
                  size="small"
                  label={sceneTypeLabel}
                  color={isRootCanvasScene(sceneType) ? 'primary' : 'default'}
                  variant="outlined"
                  sx={{
                    height: 24,
                    fontFamily: theme.campaigner.typography.mono,
                    fontSize: '0.65rem',
                    fontWeight: 400,
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  }}
                />
              )}
            </Box>
          </Box>
        </Box>

        <Box display="flex" gap={1.25} alignItems="center" flexWrap="wrap" justifyContent="flex-end">
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, value: CanvasMode | null) => {
              if (value) onModeChange(value);
            }}
            size="small"
            sx={{
              p: 0.375,
              border: `1px solid ${theme.campaigner.surface.border}`,
              borderRadius: '9px',
              backgroundColor: alpha(theme.palette.common.white, 0.025),
              '& .MuiToggleButton-root': {
                color: 'text.secondary',
                width: 30,
                height: 30,
                p: 0,
                border: 0,
                borderRadius: '7px !important',
                px: 0.8,
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                  backgroundColor: alpha(theme.palette.primary.main, 0.14),
                },
              },
            }}
          >
            {allowTool('select') && (
              <ToggleButton value="select">
                <Tooltip title={t('map:canvas.toolbar.tooltipSelect')}>
                  <MouseIcon fontSize="small" />
                </Tooltip>
              </ToggleButton>
            )}
            {allowTool('marker') && (
              <ToggleButton value="marker">
                <Tooltip title={t('map:canvas.toolbar.tooltipMarker')}>
                  <PlaceIcon fontSize="small" />
                </Tooltip>
              </ToggleButton>
            )}
            {allowTool('text') && (
              <ToggleButton value="text">
                <Tooltip title={t('map:canvas.toolbar.toolText')}>
                  <TextFieldsIcon fontSize="small" />
                </Tooltip>
              </ToggleButton>
            )}
            {allowTool('draw_territory') && (
              <ToggleButton value="draw_territory">
                <Tooltip title={t('map:canvas.toolbar.tooltipDrawTerritory')}>
                  <LandscapeIcon fontSize="small" />
                </Tooltip>
              </ToggleButton>
            )}
            {allowTool('rectangle') && (
              <MapAddShapeMenu onSelect={onAddShape} />
            )}
            {allowTool('image') && (
              <ToggleButton value="image">
                <Tooltip title={t('map:canvas.toolbar.toolImage')}>
                  <ImageIcon fontSize="small" />
                </Tooltip>
              </ToggleButton>
            )}
            {allowTool('scene_container') && (
              <ToggleButton value="scene_container">
                <Tooltip title={t('map:canvas.toolbar.toolSceneContainer')}>
                  <MapIcon fontSize="small" />
                </Tooltip>
              </ToggleButton>
            )}
          </ToggleButtonGroup>

          {(mode === 'polygon' || mode === 'polyline') && (
            <Box display="flex" gap={0.5} alignItems="center">
              <Chip
                size="small"
                variant="outlined"
                label={t('map:canvas.toolbar.drawingPoints', { count: draftPointsCount })}
              />
              <IconButton size="small" onClick={onUndoDraftPoint} disabled={draftPointsCount === 0}>
                <UndoIcon fontSize="small" />
              </IconButton>
              <Button
                size="small"
                variant="contained"
                startIcon={<CheckIcon />}
                disabled={draftPointsCount < (mode === 'polyline' ? 2 : 3)}
                onClick={onFinishTerritory}
              >
                {t('map:canvas.toolbar.save')}
              </Button>
              <Button size="small" variant="outlined" onClick={onCancelTerritory}>
                {t('common:cancel')}
              </Button>
            </Box>
          )}

          {isMapScene(sceneType) && (
            <Chip
              size="small"
              variant="outlined"
              label={t('map:canvas.toolbar.statsChip', { markers: markersCount, territories: territoriesCount })}
              sx={{ '& .MuiChip-label': { fontSize: '0.8rem' } }}
            />
          )}

          <Box
            display="flex"
            gap={0.25}
            sx={{
              alignItems: 'center',
              p: 0.375,
              border: `1px solid ${theme.campaigner.surface.border}`,
              borderRadius: '9px',
              backgroundColor: alpha(theme.palette.common.white, 0.025),
            }}
          >
            <IconButton size="small" onClick={onZoomOut}><ZoomOutIcon fontSize="small" /></IconButton>
            <Typography sx={{ color: 'text.secondary', fontFamily: theme.campaigner.typography.mono, fontSize: '0.72rem', lineHeight: '30px', px: 0.75, minWidth: 44, textAlign: 'center' }}>
              {t('map:canvas.toolbar.zoomPercent', { value: zoomPercent })}
            </Typography>
            <IconButton size="small" onClick={onZoomIn}><ZoomInIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={onResetView}><CenterFocusStrongIcon fontSize="small" /></IconButton>
          </Box>

          {!isMapScene(sceneType) && (
            <Button data-tour="map-upload" variant="contained" startIcon={<CloudUploadIcon />} size="small" onClick={onAddImage} sx={{ height: 38, px: 2 }}>
              {t('map:canvas.toolbar.addImage')}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
