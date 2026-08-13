import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  clampCropRect,
  cropImageFile,
  displayCropToNatural,
  fitImageToBox,
  loadImageFromFile,
  type CropRect,
} from '../canvas/mapImageCrop';

type Props = {
  open: boolean;
  file: File | null;
  onClose: () => void;
  onApply: (file: File) => void;
};

type DragMode =
  | { kind: 'move'; startX: number; startY: number; origin: CropRect }
  | { kind: 'resize'; handle: 'nw' | 'ne' | 'sw' | 'se'; startX: number; startY: number; origin: CropRect };

const PREVIEW_MAX_WIDTH = 520;
const PREVIEW_MAX_HEIGHT = 360;
const HANDLE_SIZE = 10;

const resizeFromHandle = (
  handle: 'nw' | 'ne' | 'sw' | 'se',
  origin: CropRect,
  dx: number,
  dy: number,
  bounds: { width: number; height: number },
): CropRect => {
  let { x, y, width, height } = origin;
  if (handle === 'nw') {
    x += dx;
    y += dy;
    width -= dx;
    height -= dy;
  } else if (handle === 'ne') {
    y += dy;
    width += dx;
    height -= dy;
  } else if (handle === 'sw') {
    x += dx;
    width -= dx;
    height += dy;
  } else {
    width += dx;
    height += dy;
  }
  return clampCropRect({ x, y, width, height }, bounds);
};

export const MapBackgroundCropDialog: React.FC<Props> = ({
  open,
  file,
  onClose,
  onApply,
}) => {
  const { t } = useTranslation(['map', 'common']);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [dragMode, setDragMode] = useState<DragMode | null>(null);
  const [applying, setApplying] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || !file) return;

    let cancelled = false;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    void loadImageFromFile(file).then((image) => {
      if (cancelled) return;
      const fitted = fitImageToBox(
        { width: image.width, height: image.height },
        PREVIEW_MAX_WIDTH,
        PREVIEW_MAX_HEIGHT,
      );
      setNaturalSize({ width: image.width, height: image.height });
      setDisplaySize(fitted);
      setCropRect({ x: 0, y: 0, width: fitted.width, height: fitted.height });
    }).catch(() => {
      if (!cancelled) onClose();
    });

    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
      setPreviewUrl(null);
      setCropRect(null);
      setDragMode(null);
    };
  }, [file, onClose, open]);

  const pointerToLocal = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  useEffect(() => {
    if (!dragMode || !cropRect) return;

    const onMove = (event: PointerEvent) => {
      const point = pointerToLocal(event.clientX, event.clientY);
      if (dragMode.kind === 'move') {
        const dx = point.x - dragMode.startX;
        const dy = point.y - dragMode.startY;
        setCropRect(clampCropRect({
          x: dragMode.origin.x + dx,
          y: dragMode.origin.y + dy,
          width: dragMode.origin.width,
          height: dragMode.origin.height,
        }, displaySize));
        return;
      }
      const dx = point.x - dragMode.startX;
      const dy = point.y - dragMode.startY;
      if (dragMode.handle === 'nw' || dragMode.handle === 'ne' || dragMode.handle === 'sw' || dragMode.handle === 'se') {
        setCropRect(resizeFromHandle(dragMode.handle, dragMode.origin, dx, dy, displaySize));
      }
    };

    const onUp = () => setDragMode(null);

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [cropRect, displaySize, dragMode, pointerToLocal]);

  const handleApply = async () => {
    if (!file || !cropRect) return;
    setApplying(true);
    try {
      const naturalCrop = displayCropToNatural(cropRect, displaySize, naturalSize);
      const cropped = await cropImageFile(file, naturalCrop);
      onApply(cropped);
      onClose();
    } catch (error) {
      console.error('[Map] crop background failed', error);
    } finally {
      setApplying(false);
    }
  };

  const startMove = (event: React.PointerEvent) => {
    if (!cropRect) return;
    event.preventDefault();
    event.stopPropagation();
    const point = pointerToLocal(event.clientX, event.clientY);
    setDragMode({
      kind: 'move',
      startX: point.x,
      startY: point.y,
      origin: cropRect,
    });
  };

  const startResize = (handle: 'nw' | 'ne' | 'sw' | 'se') => (event: React.PointerEvent) => {
    if (!cropRect) return;
    event.preventDefault();
    event.stopPropagation();
    const point = pointerToLocal(event.clientX, event.clientY);
    setDragMode({
      kind: 'resize',
      handle,
      startX: point.x,
      startY: point.y,
      origin: cropRect,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {t('map:sceneContainerDialog.cropTitle')}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('map:sceneContainerDialog.cropHint')}
        </Typography>
        {previewUrl && cropRect && (
          <Box
            ref={containerRef}
            sx={{
              position: 'relative',
              width: displaySize.width,
              height: displaySize.height,
              mx: 'auto',
              userSelect: 'none',
              touchAction: 'none',
            }}
          >
            <Box
              component="img"
              src={previewUrl}
              alt={t('map:sceneContainerDialog.previewAlt')}
              draggable={false}
              sx={{
                display: 'block',
                width: displaySize.width,
                height: displaySize.height,
                borderRadius: 1,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                left: cropRect.x,
                top: cropRect.y,
                width: cropRect.width,
                height: cropRect.height,
                border: '2px solid #4ecdc4',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
                cursor: 'move',
              }}
              onPointerDown={startMove}
            >
              {(['nw', 'ne', 'sw', 'se'] as const).map((handle) => (
                <Box
                  key={handle}
                  onPointerDown={startResize(handle)}
                  sx={{
                    position: 'absolute',
                    width: HANDLE_SIZE,
                    height: HANDLE_SIZE,
                    backgroundColor: '#4ecdc4',
                    border: '1px solid #0f172a',
                    borderRadius: '2px',
                    cursor: `${handle}-resize`,
                    ...(handle === 'nw' && { left: -HANDLE_SIZE / 2, top: -HANDLE_SIZE / 2 }),
                    ...(handle === 'ne' && { right: -HANDLE_SIZE / 2, top: -HANDLE_SIZE / 2 }),
                    ...(handle === 'sw' && { left: -HANDLE_SIZE / 2, bottom: -HANDLE_SIZE / 2 }),
                    ...(handle === 'se' && { right: -HANDLE_SIZE / 2, bottom: -HANDLE_SIZE / 2 }),
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={applying}>
          {t('common:cancel')}
        </Button>
        <Button onClick={() => { void handleApply(); }} variant="contained" disabled={applying || !cropRect}>
          {t('map:sceneContainerDialog.cropApply')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
