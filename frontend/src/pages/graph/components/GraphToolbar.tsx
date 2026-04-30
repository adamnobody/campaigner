import React from 'react';
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
  filtersOpen,
  onToggleFilters,
  detailsOpen,
  onToggleDetails,
  detailsButtonBadge,
}) => {
  const theme = useTheme();
  const isNarrowToolbar = useMediaQuery(theme.breakpoints.down('lg'));

  const cameraRow = (
    <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1} useFlexGap>
      {isNarrowToolbar ? (
        <>
          <Tooltip title="Уменьшить масштаб">
            <IconButton size="small" onClick={onZoomOut} aria-label="Уменьшить масштаб">
              <RemoveIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Typography variant="caption" sx={{ minWidth: 44, textAlign: 'center' }}>
            {zoomPercent}%
          </Typography>
          <Tooltip title="Увеличить масштаб">
            <IconButton size="small" onClick={onZoomIn} aria-label="Увеличить масштаб">
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Вписать граф в область">
            <IconButton size="small" onClick={onFit} aria-label="Вписать">
              <CenterFocusStrongIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Сбросить вид камеры">
            <IconButton size="small" onClick={onResetView} aria-label="Сбросить вид">
              <RestartAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={layoutPaused ? 'Разморозить раскладку' : 'Зафиксировать раскладку'}>
            <IconButton size="small" onClick={onToggleLayoutPaused} aria-label="Зафиксировать">
              {layoutPaused ? <PlayCircleOutlineIcon fontSize="small" /> : <PauseCircleOutlineIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Перерасставить узлы">
            <Button size="small" variant="outlined" onClick={onRelayout} sx={{ minWidth: 0, px: 1, ...btnSx }}>
              Перерасставить
            </Button>
          </Tooltip>
        </>
      ) : (
        <>
          <Stack direction="row" alignItems="center" spacing={0.25}>
            <Tooltip title="Уменьшить масштаб">
              <span>
                <IconButton size="small" onClick={onZoomOut}>
                  <RemoveIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Typography variant="caption" sx={{ minWidth: 46, textAlign: 'center' }}>
              {zoomPercent}%
            </Typography>
            <Tooltip title="Увеличить масштаб">
              <span>
                <IconButton size="small" onClick={onZoomIn}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
          <Button size="small" variant="outlined" startIcon={<CenterFocusStrongIcon />} onClick={onFit} sx={btnSx}>
            Вписать
          </Button>
          <Button size="small" variant="outlined" startIcon={<RestartAltIcon />} onClick={onResetView} sx={btnSx}>
            Сбросить вид
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={layoutPaused ? <PlayCircleOutlineIcon /> : <PauseCircleOutlineIcon />}
            onClick={onToggleLayoutPaused}
            sx={btnSx}
          >
            {layoutPaused ? 'Разморозить' : 'Зафиксировать'}
          </Button>
          <Button size="small" variant="outlined" onClick={onRelayout} sx={btnSx}>
            Перерасставить
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
          label="Поиск узлов"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Имя, название…"
          sx={{ minWidth: { xs: '100%', sm: 220 }, flexGrow: { sm: 1 }, maxWidth: { sm: 400 } }}
        />
        <TextField
          size="small"
          label="Лимит"
          type="number"
          value={nodeLimit}
          onChange={(event) => onNodeLimitChange(Math.max(50, Number(event.target.value) || 300))}
          sx={{ width: 96 }}
          inputProps={{ min: 50, max: 800, step: 10 }}
        />
        <Tooltip title={filtersOpen ? 'Скрыть фильтры' : 'Показать фильтры'}>
          <Button
            size="small"
            variant={filtersOpen ? 'contained' : 'outlined'}
            onClick={() => onToggleFilters()}
            aria-pressed={filtersOpen}
            aria-label="Фильтры"
            sx={{ textTransform: 'none', px: 1.25, fontWeight: 500 }}
          >
            <FilterListIcon sx={{ mr: isNarrowToolbar ? 0 : 0.5, fontSize: '1.1rem' }} />
            {!isNarrowToolbar ? 'Фильтры' : null}
          </Button>
        </Tooltip>
        <Tooltip title={detailsOpen ? 'Скрыть детали и легенду' : 'Показать детали и легенду'}>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <Button
              size="small"
              variant={detailsOpen ? 'contained' : 'outlined'}
              onClick={() => onToggleDetails()}
              aria-pressed={detailsOpen}
              aria-label="Легенда и детали"
              sx={{ textTransform: 'none', px: 1.25, fontWeight: 500 }}
            >
              <InfoOutlinedIcon sx={{ mr: isNarrowToolbar ? 0 : 0.5, fontSize: '1.1rem' }} />
              {!isNarrowToolbar ? 'Детали' : null}
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
                  boxShadow: (t) => `0 0 0 2px ${t.palette.background.paper}`,
                }}
              />
            ) : null}
          </Box>
        </Tooltip>
        <Tooltip title="Показывать узлы без связей">
          <FormControlLabel
            control={<Switch checked={showIsolated} onChange={(event) => onShowIsolatedChange(event.target.checked)} size="small" />}
            label="Изолированные"
            sx={{ ml: { xs: 0, md: 0.5 }, mr: 0 }}
          />
        </Tooltip>
      </Stack>
      {cameraRow}
    </Stack>
  );
};
