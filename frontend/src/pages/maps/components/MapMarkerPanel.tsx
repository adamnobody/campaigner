import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Button, Divider, IconButton, useTheme, alpha } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DescriptionIcon from '@mui/icons-material/Description';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';
import MapIcon from '@mui/icons-material/Map';
import AddIcon from '@mui/icons-material/Add';
import type { CanvasObject } from '@/api/canvas';
import {
  MARKER_ICONS,
  markerFormFromObject,
  objectTransform,
  sxDivider,
  sxPanelRoot,
  sxSectionLabel,
  type NoteOption,
} from '../canvas/canvasModel';

type Props = {
  selectedMarker: CanvasObject;
  linkedNote: NoteOption | undefined;
  onClose: () => void;
  onNavigateToNote: (noteId: number) => void;
  onOpenChildMap?: () => void;
  onCreateChildMap?: () => void;
  onEditMarker: (marker: CanvasObject) => void;
  onDeleteMarker: (marker: CanvasObject) => void;
};

export const MapMarkerPanel: React.FC<Props> = ({
  selectedMarker,
  linkedNote,
  onClose,
  onNavigateToNote,
  onOpenChildMap,
  onCreateChildMap,
  onEditMarker,
  onDeleteMarker,
}) => {
  const form = markerFormFromObject(selectedMarker);
  const transform = objectTransform(selectedMarker);
  const hasChildMap = selectedMarker.linkedSceneId != null;
  const theme = useTheme();
  const { t } = useTranslation(['map', 'common']);

  return (
    <Box sx={{ ...sxPanelRoot(theme), backgroundColor: alpha(theme.palette.background.paper, 0.95), backdropFilter: 'blur(20px)' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: '50%',
          backgroundColor: form.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', flexShrink: 0,
          boxShadow: `0 0 12px ${alpha(form.color, 0.4)}`,
        }}>
          {form.icon ? (MARKER_ICONS[form.icon] || '📍') : '📍'}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {form.title}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('map:markerPanel.positionLabel', { x: transform.x.toFixed(1), y: transform.y.toFixed(1) })}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }} aria-label={t('common:close')}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {form.description && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={sxSectionLabel(theme)}>{t('map:markerPanel.sectionDescription')}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, lineHeight: 1.6 }}>
              {form.description}
            </Typography>
          </Box>
        )}
        <Divider sx={sxDivider(theme)} />
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={sxSectionLabel(theme)}>{t('map:markerPanel.sectionLinkedNote')}</Typography>
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
                  {t(`map:noteTypes.${linkedNote.noteType}`, { defaultValue: linkedNote.noteType })}
                </Typography>
              </Box>
              <OpenInNewIcon sx={{ fontSize: 16, color: alpha(theme.palette.primary.main, 0.5) }} />
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.disabled', mt: 0.5, fontStyle: 'italic' }}>
              {t('map:markerPanel.notLinked')}
            </Typography>
          )}
        </Box>
        <Divider sx={sxDivider(theme)} />
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={sxSectionLabel(theme)}>{t('map:markerPanel.sectionChildMap')}</Typography>
          {hasChildMap ? (
            <Box sx={{ mt: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<MapIcon />}
                disabled={!onOpenChildMap}
                onClick={() => onOpenChildMap?.()}
                sx={{ borderColor: alpha(theme.palette.secondary.main, 0.3), color: theme.palette.secondary.main, justifyContent: 'flex-start' }}
              >
                {t('map:markerPanel.openChildMap')}
              </Button>
            </Box>
          ) : (
            <Box sx={{ mt: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AddIcon />}
                size="small"
                disabled={!onCreateChildMap}
                onClick={() => onCreateChildMap?.()}
                sx={{ borderColor: theme.palette.divider, color: 'text.secondary', borderStyle: 'dashed', justifyContent: 'flex-start' }}
              >
                {t('map:markerPanel.createChildMap')}
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', gap: 1 }}>
        <Button fullWidth variant="outlined" startIcon={<EditIcon />} size="small"
          onClick={() => onEditMarker(selectedMarker)}
          sx={{ borderColor: theme.palette.divider, color: 'text.secondary' }}>
          {t('common:edit')}
        </Button>
        <Button variant="outlined" size="small"
          onClick={() => onDeleteMarker(selectedMarker)}
          aria-label={t('common:delete')}
          sx={{ borderColor: alpha(theme.palette.error.main, 0.2), color: alpha(theme.palette.error.main, 0.6), minWidth: 'auto', px: 1.5,
            '&:hover': { borderColor: alpha(theme.palette.error.main, 0.4), backgroundColor: alpha(theme.palette.error.main, 0.05) } }}>
          <DeleteIcon fontSize="small" />
        </Button>
      </Box>
    </Box>
  );
};
