import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import MapIcon from '@mui/icons-material/Map';
import ImageIcon from '@mui/icons-material/Image';
import { useTranslation } from 'react-i18next';
import type { CanvasObject } from '@/api/canvas';
import { asRecord, asString, hexToRgb, objectToUpsert, sxPanelRoot } from '../canvas/canvasModel';

type Props = {
  selectedObject: CanvasObject;
  onClose: () => void;
  onSave: (object: CanvasObject) => void;
  onDelete: () => void;
  onOpenLinkedScene?: () => void;
};

export const MapCardPanel: React.FC<Props> = ({
  selectedObject,
  onClose,
  onSave,
  onDelete,
  onOpenLinkedScene,
}) => {
  const theme = useTheme();
  const { t } = useTranslation(['map', 'common']);
  const isSceneContainer = selectedObject.kind === 'scene_container';
  const [title, setTitle] = useState(() => {
    const content = asRecord(selectedObject.contentJson);
    return asString(content.titleOverride, selectedObject.name ?? '');
  });
  const skipInitialSaveRef = useRef(true);

  useEffect(() => {
    const content = asRecord(selectedObject.contentJson);
    setTitle(asString(content.titleOverride, selectedObject.name ?? ''));
    skipInitialSaveRef.current = true;
  }, [selectedObject]);

  const payload = useMemo(() => {
    const trimmed = title.trim();
    return {
      ...selectedObject,
      name: trimmed || selectedObject.name,
      contentJson: {
        ...asRecord(selectedObject.contentJson),
        titleOverride: trimmed,
      },
    };
  }, [selectedObject, title]);

  useEffect(() => {
    if (skipInitialSaveRef.current) {
      skipInitialSaveRef.current = false;
      return;
    }
    const currentUpsert = JSON.stringify(objectToUpsert(selectedObject));
    const nextUpsert = JSON.stringify(objectToUpsert(payload));
    if (currentUpsert === nextUpsert) return;
    onSave(payload);
  }, [payload, onSave, selectedObject]);

  const panelTitle = isSceneContainer
    ? t('map:canvas.sceneContainer.selectionType')
    : t('map:cardPanel.imageTitle');
  const accent = isSceneContainer ? '#5ecfff' : '#c8a86a';

  return (
    <Box sx={{ ...sxPanelRoot(theme), backgroundColor: alpha(theme.palette.background.default, 0.94), backdropFilter: 'blur(20px)', borderColor: theme.campaigner.surface.border }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: `1px solid ${theme.campaigner.surface.border}` }}>
        <Box sx={{
          width: 40,
          height: 40,
          borderRadius: '8px',
          backgroundColor: `rgba(${hexToRgb(accent)}, 0.18)`,
          border: `2px solid ${accent}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: accent,
        }}>
          {isSceneContainer ? <MapIcon fontSize="small" /> : <ImageIcon fontSize="small" />}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontSize: '1.05rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {panelTitle}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('map:cardPanel.subtitle')}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }} aria-label={t('common:close')}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <TextField
          size="small"
          label={t('map:cardPanel.titleLabel')}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          fullWidth
          sx={{ mt: 1 }}
        />

        {isSceneContainer && selectedObject.linkedSceneId != null && onOpenLinkedScene && (
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={onOpenLinkedScene}
            fullWidth
            sx={{ mt: 2 }}
          >
            {t('map:canvas.sceneContainer.openAction')}
          </Button>
        )}
      </Box>

      <Box sx={{ p: 2, borderTop: `1px solid ${theme.campaigner.surface.border}`, backgroundColor: theme.campaigner.surface.subtle }}>
        <Button
          color="error"
          variant="outlined"
          size="small"
          startIcon={<DeleteIcon />}
          onClick={onDelete}
          fullWidth
        >
          {t('common:delete')}
        </Button>
      </Box>
    </Box>
  );
};
