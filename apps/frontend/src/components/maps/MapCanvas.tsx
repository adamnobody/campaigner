import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import LabelIcon from '@mui/icons-material/Label';
import LabelOffIcon from '@mui/icons-material/LabelOff';
import PolylineIcon from '@mui/icons-material/Polyline';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import type { MarkerDTO } from '../../app/api';
import { MarkerPin } from '../markers/MarkerPin';

function clamp01(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

const toSvgPoints = (points: { x: number; y: number }[]) => {
  return points.map(p => `${p.x * 100},${p.y * 100}`).join(' ');
};

const getPolygonCentroid = (points: { x: number; y: number }[]) => {
  let x = 0, y = 0;
  points.forEach(p => { x += p.x; y += p.y; });
  return { x: x / points.length, y: y / points.length };
};

export function MapCanvas(props: {
  mapId: string;
  markers: MarkerDTO[];

  showLabels: boolean;
  onToggleLabels: () => void;

  onMapClick: (pos: { x: number; y: number }) => void;

  onAreaCreated?: (area: { points: { x: number; y: number }[]; center: { x: number; y: number } }) => void;

  onMarkerClick: (marker: MarkerDTO, e: React.MouseEvent) => void;
  onMarkerDoubleClick: (marker: MarkerDTO, e: React.MouseEvent) => void;
  onMarkerContextMenu?: (marker: MarkerDTO, e: React.MouseEvent) => void;
}) {
  const {
    mapId,
    markers,
    showLabels,
    onToggleLabels,
    onMapClick,
    onAreaCreated,
    onMarkerClick,
    onMarkerDoubleClick,
    onMarkerContextMenu
  } = props;

  const src = useMemo(() => `/api/maps/${mapId}/file`, [mapId]);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;

      const el = contentRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      const x = clamp01(px / rect.width);
      const y = clamp01(py / rect.height);

      if (isDrawing) {
        setCurrentPoints(prev => [...prev, { x, y }]);
      } else {
        onMapClick({ x, y });
      }
    },
    [onMapClick, isDrawing]
  );

  const handleFinishDrawing = () => {
    if (currentPoints.length < 3) {
      alert('Нужно минимум 3 точки для области');
      return;
    }
    const center = getPolygonCentroid(currentPoints);
    onAreaCreated?.({ points: currentPoints, center });
    
    setIsDrawing(false);
    setCurrentPoints([]);
  };

  const handleCancelDrawing = () => {
    setIsDrawing(false);
    setCurrentPoints([]);
  };

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <TransformWrapper
        minScale={0.1}
        maxScale={8}
        wheel={{ step: 0.1 }}
        panning={{ disabled: isDrawing, velocityDisabled: true }} 
        doubleClick={{ disabled: true }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <Box
              sx={{
                position: 'absolute',
                zIndex: 10,
                right: 16,
                top: 16,
                display: 'flex',
                gap: 1,
                p: 0.5,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.9)',
                boxShadow: 2,
                backdropFilter: 'blur(4px)'
              }}
            >
              {!isDrawing ? (
                <>
                  <Tooltip title="Приблизить">
                    <IconButton size="small" onClick={() => zoomIn()}>
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Отдалить">
                    <IconButton size="small" onClick={() => zoomOut()}>
                      <RemoveIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Сброс вида">
                    <IconButton size="small" onClick={() => resetTransform()}>
                      <CenterFocusStrongIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Box sx={{ width: 1, bgcolor: 'divider', mx: 0.5 }} />

                  <Tooltip title={showLabels ? 'Скрыть подписи' : 'Показать подписи'}>
                    <IconButton size="small" onClick={onToggleLabels}>
                      {showLabels ? <LabelOffIcon /> : <LabelIcon />}
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Рисовать область (Area)">
                    <IconButton size="small" color="primary" onClick={() => setIsDrawing(true)}>
                      <PolylineIcon />
                    </IconButton>
                  </Tooltip>
                </>
              ) : (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      Рисование... ({currentPoints.length})
                    </Typography>
                  </Box>
                  <Tooltip title="Завершить (Enter)">
                    <IconButton size="small" color="success" onClick={handleFinishDrawing}>
                      <CheckIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Отмена (Esc)">
                    <IconButton size="small" color="error" onClick={handleCancelDrawing}>
                      <CloseIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>

            <Box
              sx={{
                width: '100%',
                height: '100%',
                bgcolor: '#e0e0e0',
                position: 'relative',
                cursor: isDrawing ? 'crosshair' : 'default'
              }}
            >
              <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                <Box
                  ref={contentRef}
                  onClick={handleClick}
                  sx={{ width: '100%', height: '100%', position: 'relative' }}
                >
                  <img
                    src={src}
                    alt="map"
                    style={{
                      display: 'block',
                      width: '100%',
                      height: 'auto',
                      userSelect: 'none',
                      pointerEvents: 'none'
                    }}
                    draggable={false}
                  />
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                      overflow: 'visible'
                    }}
                  >
                    {markers.map(m => {
                      if (!m.points || m.points.length === 0) return null;
                      return (
                        <polygon
                          key={`poly-${m.id}`}
                          points={toSvgPoints(m.points)}
                          fill={m.color}
                          fillOpacity={0.25}
                          stroke={m.color}
                          strokeWidth={0.2}
                          strokeDasharray="1 0.5"
                        />
                      );
                    })}
                    {isDrawing && currentPoints.length > 0 && (
                      <polyline
                        points={toSvgPoints(currentPoints)}
                        fill="none"
                        stroke="red"
                        strokeWidth={0.3}
                        strokeLinecap="round"
                      />
                    )}
                  </svg>
                  {markers.map((m) => (
                    <MarkerPin
                      key={m.id}
                      marker={m}
                      showLabel={showLabels}
                      onClick={(e) => onMarkerClick(m, e)}
                      onDoubleClick={(e) => onMarkerDoubleClick(m, e)}
                      onContextMenu={(e) => onMarkerContextMenu?.(m, e)}
                    />
                  ))}
                </Box>
              </TransformComponent>
            </Box>
          </>
        )}
      </TransformWrapper>
    </Box>
  );
}
