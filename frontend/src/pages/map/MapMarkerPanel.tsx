import React from 'react';
import { Box, Typography, Button, Divider, IconButton, useTheme, alpha } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DescriptionIcon from '@mui/icons-material/Description';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';
import MapIcon from '@mui/icons-material/Map';
import ImageIcon from '@mui/icons-material/Image';
import AddIcon from '@mui/icons-material/Add';
import { MARKER_ICONS, sxDivider, sxSectionLabel, sxPanelRoot } from './mapUtils';
import type { Marker, NoteOption } from './mapUtils';

type Props = {
  selectedMarker: Marker;
  linkedNote: NoteOption | undefined;
  onClose: () => void;
  onNavigateToNote: (noteId: number) => void;
  onNavigateToChildMap: (childMapId: number) => void;
  onCreateChildMap: (marker: Marker) => void;
  onUploadChildMapImage: (marker: Marker, file: File) => void;
  onEditMarker: (marker: Marker) => void;
  onDeleteMarker: (marker: Marker) => void;
};

export const MapMarkerPanel: React.FC<Props> = ({
  selectedMarker,
  linkedNote,
  onClose,
  onNavigateToNote,
  onNavigateToChildMap,
  onCreateChildMap,
  onUploadChildMapImage,
  onEditMarker,
  onDeleteMarker,
}) => {
  const hasChildMap = !!selectedMarker.childMapId;
  const theme = useTheme();

  return (
    <Box sx={{ ...sxPanelRoot(theme), backgroundColor: alpha(theme.palette.background.paper, 0.95), backdropFilter: 'blur(20px)' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: '50%',
          backgroundColor: selectedMarker.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', flexShrink: 0,
          boxShadow: `0 0 12px ${alpha(selectedMarker.color, 0.4)}`,
        }}>
          {selectedMarker.icon ? (MARKER_ICONS[selectedMarker.icon] || '📍') : '📍'}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedMarker.title}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            X: {selectedMarker.x.toFixed(1)}% · Y: {selectedMarker.y.toFixed(1)}%
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {selectedMarker.description && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={sxSectionLabel(theme)}>Описание</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, lineHeight: 1.6 }}>
              {selectedMarker.description}
            </Typography>
          </Box>
        )}
        <Divider sx={sxDivider(theme)} />
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={sxSectionLabel(theme)}>Привязанная заметка</Typography>
          {linkedNote ? (
            <Box
              onClick={() => onNavigateToNote(linkedNote.id)}
              sx={{
                mt: 1, p: 1.5, borderRadius: 1,
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1,
                '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.15) },
              }}
            >
              <DescriptionIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ color: theme.palette.primary.main, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {linkedNote.title}
                </Typography>
                <Typography variant="caption" sx={{ color: alpha(theme.palette.primary.main, 0.6) }}>
                  {linkedNote.noteType === 'wiki' ? 'Вики-статья' : 'Заметка'}
                </Typography>
              </Box>
              <OpenInNewIcon sx={{ fontSize: 16, color: alpha(theme.palette.primary.main, 0.5) }} />
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.disabled', mt: 0.5, fontStyle: 'italic' }}>
              Не привязана
            </Typography>
          )}
        </Box>
        <Divider sx={sxDivider(theme)} />
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={sxSectionLabel(theme)}>Вложенная карта</Typography>
          {hasChildMap ? (
            <Box sx={{ mt: 1 }}>
              <Button fullWidth variant="outlined" startIcon={<MapIcon />}
                onClick={() => onNavigateToChildMap(selectedMarker.childMapId!)}
                sx={{ borderColor: alpha(theme.palette.secondary.main, 0.3), color: theme.palette.secondary.main, justifyContent: 'flex-start',
                  '&:hover': { borderColor: alpha(theme.palette.secondary.main, 0.5), backgroundColor: alpha(theme.palette.secondary.main, 0.08) } }}>
                Открыть вложенную карту
              </Button>
              <Button component="label" fullWidth variant="text" startIcon={<ImageIcon />} size="small"
                sx={{ mt: 0.5, color: 'text.secondary', justifyContent: 'flex-start' }}>
                Загрузить изображение
                <input type="file" hidden accept="image/*"
                  onChange={e => { const f = e.target.files?.[0]; if (f) onUploadChildMapImage(selectedMarker, f); }} />
              </Button>
            </Box>
          ) : (
            <Box sx={{ mt: 1 }}>
              <Button fullWidth variant="outlined" startIcon={<AddIcon />} size="small"
                onClick={() => onCreateChildMap(selectedMarker)}
                sx={{ borderColor: theme.palette.divider, color: 'text.secondary', borderStyle: 'dashed', justifyContent: 'flex-start',
                  '&:hover': { borderColor: alpha(theme.palette.secondary.main, 0.4), color: theme.palette.secondary.main } }}>
                Создать вложенную карту
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', gap: 1 }}>
        <Button fullWidth variant="outlined" startIcon={<EditIcon />} size="small"
          onClick={() => onEditMarker(selectedMarker)}
          sx={{ borderColor: theme.palette.divider, color: 'text.secondary' }}>
          Редактировать
        </Button>
        <Button variant="outlined" size="small"
          onClick={() => onDeleteMarker(selectedMarker)}
          sx={{ borderColor: alpha(theme.palette.error.main, 0.2), color: alpha(theme.palette.error.main, 0.6), minWidth: 'auto', px: 1.5,
            '&:hover': { borderColor: alpha(theme.palette.error.main, 0.4), backgroundColor: alpha(theme.palette.error.main, 0.05) } }}>
          <DeleteIcon fontSize="small" />
        </Button>
      </Box>
    </Box>
  );
};
