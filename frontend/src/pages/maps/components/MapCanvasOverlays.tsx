import { useMemo } from 'react';
import {
  Box,
  IconButton,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useTranslation } from 'react-i18next';
import type { CanvasLayer, CanvasObject } from '@/api/canvas';

type LayersPanelProps = {
  layers: CanvasLayer[];
  objects: CanvasObject[];
  updatingLayerId: number | null;
  onToggle: (layer: CanvasLayer) => void;
};

const panelSx = {
  position: 'absolute',
  zIndex: 1,
  borderRadius: '11px',
  border: '1px solid rgba(255,255,255,.07)',
  backgroundColor: 'rgba(11,13,17,.82)',
  backdropFilter: 'blur(4px)',
} as const;

export function MapLayersPanel({
  layers,
  objects,
  updatingLayerId,
  onToggle,
}: LayersPanelProps) {
  const { t } = useTranslation('map');
  const counts = useMemo(() => {
    const result = new Map<number, number>();
    objects.forEach((object) => {
      result.set(object.layerId, (result.get(object.layerId) ?? 0) + 1);
    });
    return result;
  }, [objects]);
  const orderedLayers = useMemo(
    () => [...layers].sort((left, right) => right.zIndex - left.zIndex),
    [layers],
  );

  if (orderedLayers.length === 0) return null;

  return (
    <Box sx={{ ...panelSx, right: 16, top: 16, width: 212, px: 1.5, pt: 1.5, pb: 1 }}>
      <Typography
        variant="overline"
        sx={{ display: 'block', color: 'text.disabled', px: 0.75, pb: 0.75 }}
      >
        {t('canvas.layers.title')}
      </Typography>
      {orderedLayers.map((layer) => {
        const actionLabel = layer.isHidden
          ? t('canvas.layers.show', { name: layer.name })
          : t('canvas.layers.hide', { name: layer.name });
        return (
          <Box
            key={layer.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              minHeight: 32,
              px: 0.25,
              borderRadius: '7px',
              '&:hover': { backgroundColor: 'rgba(255,255,255,.04)' },
            }}
          >
            <IconButton
              size="small"
              disabled={updatingLayerId === layer.id}
              onClick={() => onToggle(layer)}
              aria-label={actionLabel}
              title={actionLabel}
              sx={{ width: 28, height: 28, color: layer.isHidden ? 'text.disabled' : 'primary.main' }}
            >
              {layer.isHidden
                ? <VisibilityOffIcon sx={{ fontSize: 16 }} />
                : <VisibilityIcon sx={{ fontSize: 16 }} />}
            </IconButton>
            <Typography
              noWrap
              sx={{
                flex: 1,
                fontSize: '0.75rem',
                color: layer.isHidden ? 'text.disabled' : 'text.primary',
              }}
            >
              {layer.name}
            </Typography>
            <Typography
              sx={{
                fontFamily: (theme) => theme.campaigner.typography.mono,
                fontSize: '0.64rem',
                color: 'text.disabled',
              }}
            >
              {counts.get(layer.id) ?? 0}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

export function MapLegendPanel({ objects }: { objects: CanvasObject[] }) {
  const { t } = useTranslation('map');
  const theme = useTheme();
  const counts = useMemo(() => ({
    territory: objects.filter((object) => object.kind === 'territory' && !object.isHidden).length,
    polyline: objects.filter((object) => object.kind === 'polyline' && !object.isHidden).length,
    marker: objects.filter((object) => object.kind === 'marker' && !object.isHidden).length,
  }), [objects]);

  if (counts.territory + counts.polyline + counts.marker === 0) return null;

  const rows = [
    counts.territory > 0
      ? {
          key: 'territory',
          label: t('canvas.legend.territories'),
          marker: <Box sx={{ width: 14, height: 2, backgroundColor: alpha(theme.palette.primary.main, 0.7) }} />,
        }
      : null,
    counts.polyline > 0
      ? {
          key: 'polyline',
          label: t('canvas.legend.routes'),
          marker: <Box sx={{ width: 14, borderTop: `2px dashed ${alpha(theme.palette.text.primary, 0.35)}` }} />,
        }
      : null,
    counts.marker > 0
      ? {
          key: 'marker',
          label: t('canvas.legend.markers'),
          marker: <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'primary.main' }} />,
        }
      : null,
  ].filter((row): row is NonNullable<typeof row> => row !== null);

  return (
    <Box sx={{ ...panelSx, left: 16, bottom: 16, px: 2, py: 1.75 }}>
      <Typography
        variant="overline"
        sx={{ display: 'block', color: 'text.disabled', pb: 1 }}
      >
        {t('canvas.legend.title')}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {rows.map((row) => (
          <Box key={row.key} sx={{ display: 'flex', alignItems: 'center', gap: 1.1 }}>
            <Box sx={{ width: 14, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
              {row.marker}
            </Box>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
              {row.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
