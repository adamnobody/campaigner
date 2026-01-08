import React, { useCallback, useMemo, useRef } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import LabelIcon from '@mui/icons-material/Label';
import LabelOffIcon from '@mui/icons-material/LabelOff';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import type { MarkerDTO } from '../../app/api';
import { MarkerPin } from '../markers/MarkerPin';

function clamp01(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function dist2(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function MapCanvas(props: {
  mapId: string;
  markers: MarkerDTO[];

  showLabels: boolean;
  onToggleLabels: () => void;

  onMapClick: (pos: { x: number; y: number }) => void;

  onMarkerClick: (marker: MarkerDTO, e: React.MouseEvent) => void;
  onMarkerDoubleClick: (marker: MarkerDTO, e: React.MouseEvent) => void;
  onMarkerContextMenu?: (marker: MarkerDTO, e: React.MouseEvent) => void;

  onMarkerMoveEnd: (markerId: string, pos: { x: number; y: number }) => void | Promise<void>;
  onMarkerMove?: (markerId: string, pos: { x: number; y: number }) => void;
}) {
  const {
    mapId,
    markers,
    showLabels,
    onToggleLabels,
    onMapClick,
    onMarkerClick,
    onMarkerDoubleClick,
    onMarkerContextMenu,
    onMarkerMoveEnd,
    onMarkerMove
  } = props;

  const src = useMemo(() => `/api/maps/${mapId}/file`, [mapId]);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const suppressNextClickRef = useRef(false);

  const dragRef = useRef<{
    markerId: string | null;
    pointerId: number | null;
    startClient: { x: number; y: number } | null;
    lastPos: { x: number; y: number } | null;
    dragging: boolean;
  }>({
    markerId: null,
    pointerId: null,
    startClient: null,
    lastPos: null,
    dragging: false
  });

  const clientToNormPos = useCallback((clientX: number, clientY: number) => {
    const el = contentRef.current;
    if (!el) return null;

    const rect = el.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;

    // rect уже “визуальный” (после zoom/pan), поэтому деление на rect.width/height даёт корректные 0..1
    const x = clamp01(px / rect.width);
    const y = clamp01(py / rect.height);
    return { x, y };
  }, []);

  const handleMapClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;

      // подавляем клик, который браузер генерит после drag
      if (suppressNextClickRef.current) {
        suppressNextClickRef.current = false;
        return;
      }

      const pos = clientToNormPos(e.clientX, e.clientY);
      if (!pos) return;

      onMapClick(pos);
    },
    [clientToNormPos, onMapClick]
  );

  const handleMarkerPointerDown = useCallback((markerId: string, e: React.PointerEvent) => {
    if (e.button !== 0) return;

    e.stopPropagation();
    e.preventDefault();

    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);

    dragRef.current.markerId = markerId;
    dragRef.current.pointerId = e.pointerId;
    dragRef.current.startClient = { x: e.clientX, y: e.clientY };
    dragRef.current.lastPos = null;
    dragRef.current.dragging = false;
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const st = dragRef.current;
      if (!st.markerId || st.pointerId !== e.pointerId || !st.startClient) return;

      const thresholdPx = 4;
      const movedEnough = dist2(st.startClient, { x: e.clientX, y: e.clientY }) >= thresholdPx * thresholdPx;

      const pos = clientToNormPos(e.clientX, e.clientY);
      if (!pos) return;

      if (movedEnough) st.dragging = true;
      if (!st.dragging) return;

      e.stopPropagation();
      e.preventDefault();

      st.lastPos = pos;
      onMarkerMove?.(st.markerId, pos);
    },
    [clientToNormPos, onMarkerMove]
  );

  const endDragIfAny = useCallback(
    async (e: React.PointerEvent) => {
      const st = dragRef.current;
      if (!st.markerId || st.pointerId !== e.pointerId) return;

      e.stopPropagation();
      e.preventDefault();

      const markerId = st.markerId;
      const wasDragging = st.dragging;
      const finalPos = st.lastPos;

      // если реально тянули — подавим следующий click по карте
      if (wasDragging) suppressNextClickRef.current = true;

      // reset state
      dragRef.current.markerId = null;
      dragRef.current.pointerId = null;
      dragRef.current.startClient = null;
      dragRef.current.lastPos = null;
      dragRef.current.dragging = false;

      if (!wasDragging || !finalPos) return;

      await onMarkerMoveEnd(markerId, finalPos);
    },
    [onMarkerMoveEnd]
  );

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <TransformWrapper
        minScale={0.1}
        maxScale={8}
        wheel={{ step: 0.1 }}
        panning={{ velocityDisabled: true }}
        doubleClick={{ disabled: true }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Toolbar */}
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
                bgcolor: 'rgba(82, 82, 82, 0.91)',
                boxShadow: 2,
                backdropFilter: 'blur(4px)'
              }}
            >
              <Tooltip title="Zoom in">
                <IconButton size="small" onClick={() => zoomIn()}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Zoom out">
                <IconButton size="small" onClick={() => zoomOut()}>
                  <RemoveIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Reset view">
                <IconButton size="small" onClick={() => resetTransform()}>
                  <CenterFocusStrongIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Box sx={{ width: 1, bgcolor: 'divider', mx: 0.5 }} />

              <Tooltip title={showLabels ? 'Скрыть подписи' : 'Показать подписи'}>
                <IconButton size="small" onClick={onToggleLabels}>
                  {showLabels ? <LabelOffIcon fontSize="small" /> : <LabelIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Box>

            <Box sx={{ width: '100%', height: '100%', bgcolor: '#e0e0e0', position: 'relative' }}>
              <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                <Box
                  ref={contentRef}
                  onClick={handleMapClick}
                  onPointerMove={handlePointerMove}
                  onPointerUp={endDragIfAny}
                  onPointerCancel={endDragIfAny}
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

                  {markers.map((m) => (
                    <MarkerPin
                      key={m.id}
                      marker={m}
                      showLabel={showLabels}
                      onClick={(e) => onMarkerClick(m, e)}
                      onDoubleClick={(e) => onMarkerDoubleClick(m, e)}
                      onContextMenu={(e) => onMarkerContextMenu?.(m, e)}
                      onPointerDown={(e) => handleMarkerPointerDown(m.id, e)}
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
