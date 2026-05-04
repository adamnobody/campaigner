import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import FilterListIcon from '@mui/icons-material/FilterList';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';

const btnSx = { textTransform: 'none' as const, fontWeight: 500 };

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
  /** Clears persisted positions for this branch (server); graph reverts to force layout. */
  onResetLayout: () => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  detailsOpen: boolean;
  onToggleDetails: () => void;
  detailsButtonBadge?: boolean;
};

export const GraphToolbar: React.FC<Props> = ({
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
  onResetLayout,
  filtersOpen,
  onToggleFilters,
  detailsOpen,
  onToggleDetails,
  detailsButtonBadge,
}) => {
  const { t } = useTranslation(['graph', 'common']);
  const theme = useTheme();
  const isNarrowToolbar = useMediaQuery(theme.breakpoints.down('lg'));

  const cameraRow = (
    <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1} useFlexGap>
      {isNarrowToolbar ? (
        <>
          <Tooltip title={t('graph:toolbar.zoomOut')}>
            <IconButton size="small" onClick={onZoomOut} aria-label={t('graph:toolbar.zoomOutAria')}>
              <RemoveIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Typography variant="caption" sx={{ minWidth: 44, textAlign: 'center' }}>
            {t('graph:toolbar.zoomPercent', { value: zoomPercent })}
          </Typography>
          <Tooltip title={t('graph:toolbar.zoomIn')}>
            <IconButton size="small" onClick={onZoomIn} aria-label={t('graph:toolbar.zoomInAria')}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('graph:toolbar.fit')}>
            <IconButton size="small" onClick={onFit} aria-label={t('graph:toolbar.fitAria')}>
              <CenterFocusStrongIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('graph:toolbar.resetView')}>
            <IconButton size="small" onClick={onResetView} aria-label={t('graph:toolbar.resetViewAria')}>
              <RestartAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={layoutPaused ? t('graph:toolbar.layoutToggleTooltipPaused') : t('graph:toolbar.layoutToggleTooltipRunning')}
          >
            <IconButton size="small" onClick={onToggleLayoutPaused} aria-label={t('graph:toolbar.layoutToggleAria')}>
              {layoutPaused ? <PlayCircleOutlineIcon fontSize="small" /> : <PauseCircleOutlineIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title={t('graph:toolbar.relayout')}>
            <Button size="small" variant="outlined" onClick={onRelayout} sx={{ minWidth: 0, px: 1, ...btnSx }}>
              {t('graph:toolbar.relayout')}
            </Button>
          </Tooltip>
          <Tooltip title={t('graph:toolbar.resetLayoutTooltip')}>
            <Button size="small" variant="outlined" color="warning" onClick={onResetLayout} sx={{ minWidth: 0, px: 1, ...btnSx }}>
              {t('graph:toolbar.resetLayout')}
            </Button>
          </Tooltip>
        </>
      ) : (
        <>
          <Stack direction="row" alignItems="center" spacing={0.25}>
            <Tooltip title={t('graph:toolbar.zoomOut')}>
              <span>
                <IconButton size="small" onClick={onZoomOut} aria-label={t('graph:toolbar.zoomOutAria')}>
                  <RemoveIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Typography variant="caption" sx={{ minWidth: 46, textAlign: 'center' }}>
              {t('graph:toolbar.zoomPercent', { value: zoomPercent })}
            </Typography>
            <Tooltip title={t('graph:toolbar.zoomIn')}>
              <span>
                <IconButton size="small" onClick={onZoomIn} aria-label={t('graph:toolbar.zoomInAria')}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
          <Button
            size="small"
            variant="outlined"
            startIcon={<CenterFocusStrongIcon />}
            onClick={onFit}
            sx={btnSx}
            aria-label={t('graph:toolbar.fitAria')}
          >
            {t('graph:toolbar.fit')}
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<RestartAltIcon />}
            onClick={onResetView}
            sx={btnSx}
            aria-label={t('graph:toolbar.resetViewAria')}
          >
            {t('graph:toolbar.resetView')}
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={layoutPaused ? <PlayCircleOutlineIcon /> : <PauseCircleOutlineIcon />}
            onClick={onToggleLayoutPaused}
            sx={btnSx}
            aria-label={t('graph:toolbar.layoutToggleAria')}
          >
            {layoutPaused ? t('graph:toolbar.layoutResume') : t('graph:toolbar.layoutPause')}
          </Button>
          <Button size="small" variant="outlined" onClick={onRelayout} sx={btnSx} aria-label={t('graph:toolbar.relayout')}>
            {t('graph:toolbar.relayout')}
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="warning"
            onClick={onResetLayout}
            sx={btnSx}
            aria-label={t('graph:toolbar.resetLayout')}
          >
            {t('graph:toolbar.resetLayout')}
          </Button>
        </>
      )}
    </Stack>
  );

  return (
    <Stack spacing={1.25}>
      <Stack direction="row" alignItems="center" flexWrap="wrap" useFlexGap gap={1}>
        <TextField
          size="small"
          label={t('graph:toolbar.searchLabel')}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t('graph:toolbar.searchPlaceholder')}
          sx={{ minWidth: { xs: '100%', sm: 220 }, flexGrow: { sm: 1 }, maxWidth: { sm: 400 } }}
        />
        <TextField
          size="small"
          label={t('graph:toolbar.limitLabel')}
          type="number"
          value={nodeLimit}
          onChange={(event) => onNodeLimitChange(Math.max(50, Number(event.target.value) || 300))}
          sx={{ width: 96 }}
          inputProps={{ min: 50, max: 800, step: 10 }}
        />
        <Tooltip title={filtersOpen ? t('graph:toolbar.filtersHide') : t('graph:toolbar.filtersShow')}>
          <Button
            size="small"
            variant={filtersOpen ? 'contained' : 'outlined'}
            onClick={() => onToggleFilters()}
            aria-pressed={filtersOpen}
            aria-label={t('graph:toolbar.filtersAria')}
            sx={{ textTransform: 'none', px: 1.25, fontWeight: 500 }}
          >
            <FilterListIcon sx={{ mr: isNarrowToolbar ? 0 : 0.5, fontSize: '1.1rem' }} />
            {!isNarrowToolbar ? t('graph:toolbar.filtersButton') : null}
          </Button>
        </Tooltip>
        <Tooltip title={detailsOpen ? t('graph:toolbar.detailsHide') : t('graph:toolbar.detailsShow')}>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <Button
              size="small"
              variant={detailsOpen ? 'contained' : 'outlined'}
              onClick={() => onToggleDetails()}
              aria-pressed={detailsOpen}
              aria-label={t('graph:toolbar.detailsAria')}
              sx={{ textTransform: 'none', px: 1.25, fontWeight: 500 }}
            >
              <InfoOutlinedIcon sx={{ mr: isNarrowToolbar ? 0 : 0.5, fontSize: '1.1rem' }} />
              {!isNarrowToolbar ? t('graph:toolbar.detailsButton') : null}
            </Button>
            {detailsButtonBadge ? (
              <Box
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  boxShadow: (th) => `0 0 0 2px ${th.palette.background.paper}`,
                }}
              />
            ) : null}
          </Box>
        </Tooltip>
        <Tooltip title={t('graph:toolbar.isolatedTooltip')}>
          <FormControlLabel
            control={<Switch checked={showIsolated} onChange={(event) => onShowIsolatedChange(event.target.checked)} size="small" />}
            label={t('graph:toolbar.isolatedLabel')}
            sx={{ ml: { xs: 0, md: 0.5 }, mr: 0 }}
          />
        </Tooltip>
      </Stack>
      {cameraRow}
    </Stack>
  );
};
