import React from 'react';
import { Box, Typography } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import MapIcon from '@mui/icons-material/Map';
import { MARKER_ICONS } from './mapUtils';
import type { MapMode, Marker, NoteOption } from './mapUtils';

type Props = {
  marker: Marker;
  mode: MapMode;
  zoomDisplay: number;
  isSelected: boolean;
  isDraggingVisual: boolean;
  displayX: number;
  displayY: number;
  linkedNote: NoteOption | undefined;
  hasChildMap: boolean;
  onMarkerMouseDown: (e: React.MouseEvent, marker: Marker) => void;
  onMarkerClick: (e: React.MouseEvent, marker: Marker) => void;
  onMarkerDoubleClick: (e: React.MouseEvent, marker: Marker) => void;
};

export const MapMarkerOnMap: React.FC<Props> = ({
  marker,
  mode,
  zoomDisplay,
  isSelected,
  isDraggingVisual,
  displayX,
  displayY,
  linkedNote,
  hasChildMap,
  onMarkerMouseDown,
  onMarkerClick,
  onMarkerDoubleClick,
}) => (
  <Box
    onMouseDown={e => onMarkerMouseDown(e, marker)}
    onClick={e => onMarkerClick(e, marker)}
    onDoubleClick={e => onMarkerDoubleClick(e, marker)}
    sx={{
      position: 'absolute',
      left: `${displayX}%`,
      top: `${displayY}%`,
      transform: `translate(-50%, -50%) scale(${1 / zoomDisplay})`,
      willChange: 'transform',
      backfaceVisibility: 'hidden',
      cursor: mode === 'select' ? (isDraggingVisual ? 'grabbing' : 'grab') : 'crosshair',
      zIndex: isDraggingVisual ? 100 : isSelected ? 10 : 5,
      opacity: isDraggingVisual ? 0.85 : 1,
      transition: isDraggingVisual ? 'none' : 'transform 0.15s',
      pointerEvents: mode === 'select' ? 'auto' : 'none',
      '&:hover': {
        transform: `translate(-50%, -50%) scale(${1 / zoomDisplay * 1.15})`,
      },
      userSelect: 'none',
    }}
  >
    <Box sx={{
      width: 32, height: 32, borderRadius: '50%',
      backgroundColor: marker.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '16px',
      boxShadow: isDraggingVisual
        ? `0 0 16px ${marker.color}cc, 0 4px 16px rgba(0,0,0,0.7)`
        : `0 0 8px ${marker.color}80, 0 2px 8px rgba(0,0,0,0.5)`,
      border: isSelected ? '2px solid #fff' : '2px solid rgba(0,0,0,0.3)',
    }}>
      {marker.icon ? (MARKER_ICONS[marker.icon] || '📍') : '📍'}
    </Box>
    <Typography sx={{
      position: 'absolute', top: '100%', left: '50%',
      transform: 'translateX(-50%)', mt: '3px',
      fontSize: '13px', color: '#fff',
      textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)',
      whiteSpace: 'nowrap', fontWeight: 700, pointerEvents: 'none',
    }}>
      {marker.title}
    </Typography>
    {linkedNote && (
      <Box sx={{
        position: 'absolute', top: -8, right: -8, width: 14, height: 14,
        borderRadius: '50%', backgroundColor: '#4ECDC4',
        border: '1.5px solid rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <DescriptionIcon sx={{ fontSize: 8, color: '#fff' }} />
      </Box>
    )}
    {hasChildMap && (
      <Box sx={{
        position: 'absolute', top: -8, left: -8, width: 14, height: 14,
        borderRadius: '50%', backgroundColor: '#BB8FCE',
        border: '1.5px solid rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <MapIcon sx={{ fontSize: 8, color: '#fff' }} />
      </Box>
    )}
  </Box>
);
