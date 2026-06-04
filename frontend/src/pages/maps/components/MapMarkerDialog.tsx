import React from 'react';
import {
  Box, Typography, TextField, Button, Dialog,
  DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, Autocomplete,
  Chip, FormControlLabel, Checkbox,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useTranslation } from 'react-i18next';
import { DndButton } from '@/components/ui/DndButton';
import type { CanvasObject } from '@/api/canvas';
import {
  MARKER_ICONS, MARKER_ICON_ENTRIES, MARKER_COLORS,
  type MarkerFormState, type NoteOption,
} from '../canvas/canvasModel';

type Props = {
  open: boolean;
  onClose: () => void;
  editingMarker: CanvasObject | null;
  markerForm: MarkerFormState;
  setMarkerForm: React.Dispatch<React.SetStateAction<MarkerFormState>>;
  notes: NoteOption[];
  notesMap: Map<number, NoteOption>;
  canCreateNestedMap: boolean;
  createNestedMap: boolean;
  onCreateNestedMapChange: (value: boolean) => void;
  nestedMapImageName: string | null;
  onPickNestedMapImage: () => void;
  onClearNestedMapImage: () => void;
  onSave: () => void;
};

export const MapMarkerDialog: React.FC<Props> = ({
  open,
  onClose,
  editingMarker,
  markerForm,
  setMarkerForm,
  notes,
  notesMap,
  canCreateNestedMap,
  createNestedMap,
  onCreateNestedMapChange,
  nestedMapImageName,
  onPickNestedMapImage,
  onClearNestedMapImage,
  onSave,
}) => {
  const { t } = useTranslation(['map', 'common']);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}>
      <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>
        {editingMarker ? t('map:markerDialog.editTitle') : t('map:markerDialog.createTitle')}
      </DialogTitle>
      <DialogContent>
        <TextField fullWidth label={t('map:markerDialog.fieldTitle')} value={markerForm.title}
          onChange={e => setMarkerForm(prev => ({ ...prev, title: e.target.value }))} margin="normal" />
        <TextField fullWidth label={t('map:markerDialog.fieldDescription')} value={markerForm.description}
          onChange={e => setMarkerForm(prev => ({ ...prev, description: e.target.value }))}
          margin="normal" multiline rows={3} />

        <Autocomplete
          options={notes}
          getOptionLabel={o => o.title}
          value={notes.find(n => n.id === markerForm.linkedNoteId) || null}
          onChange={(_, v) => setMarkerForm(prev => ({ ...prev, linkedNoteId: v?.id || null }))}
          renderInput={params => (
            <TextField
              {...params}
              label={t('map:markerDialog.linkedNoteLabel')}
              margin="normal"
              placeholder={t('map:markerDialog.linkedNotePlaceholder')}
            />
          )}
          renderOption={(props, option) => (
            <li {...props}>
              <Box display="flex" alignItems="center" gap={1}>
                <DescriptionIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} />
                <Typography>{option.title}</Typography>
                <Chip
                  label={t(`map:noteTypes.${option.noteType}`, { defaultValue: option.noteType })}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 'auto', fontSize: '0.7rem', height: 20 }}
                />
              </Box>
            </li>
          )}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          noOptionsText={t('map:markerDialog.noNotes')}
          clearText={t('map:markerDialog.clear')}
          sx={{ mt: 1 }}
        />

        {canCreateNestedMap && (
          <Box mt={2} p={1.5} sx={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={createNestedMap}
                  onChange={(_, checked) => onCreateNestedMapChange(checked)}
                  size="small"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {t('map:markerDialog.createNestedMapTitle')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    {t('map:markerDialog.createNestedMapHint')}
                  </Typography>
                </Box>
              }
            />
            {createNestedMap && (
              <Box display="flex" gap={1} alignItems="center" flexWrap="wrap" mt={1}>
                <Button size="small" variant="outlined" startIcon={<CloudUploadIcon />} onClick={onPickNestedMapImage}>
                  {t('map:markerDialog.uploadChildMapImage')}
                </Button>
                {nestedMapImageName && (
                  <>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }} noWrap>
                      {nestedMapImageName}
                    </Typography>
                    <Button size="small" onClick={onClearNestedMapImage}>
                      {t('map:markerDialog.removeAttachment')}
                    </Button>
                  </>
                )}
              </Box>
            )}
          </Box>
        )}

        <FormControl fullWidth margin="normal">
          <InputLabel>{t('map:markerDialog.fieldIcon')}</InputLabel>
          <Select value={markerForm.icon} label={t('map:markerDialog.fieldIcon')}
            onChange={e => setMarkerForm(prev => ({ ...prev, icon: e.target.value as MarkerFormState['icon'] }))}>
            {MARKER_ICON_ENTRIES.map(([key, emoji]) => (
              <MenuItem key={key} value={key}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography fontSize="1.2rem">{emoji}</Typography>
                  <Typography>{t(`map:markerIcons.${key}`)}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 2, mb: 1 }}>{t('map:markerDialog.colorLabel')}</Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          {MARKER_COLORS.map(color => (
            <Box key={color} onClick={() => setMarkerForm(prev => ({ ...prev, color }))}
              sx={{
                width: 32, height: 32, borderRadius: '50%', backgroundColor: color, cursor: 'pointer',
                border: markerForm.color === color ? '3px solid #fff' : '2px solid transparent',
                transition: 'all 0.15s', '&:hover': { transform: 'scale(1.2)' },
              }} />
          ))}
        </Box>

        <Box display="flex" alignItems="center" gap={1} mt={2} p={1.5}
          sx={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 1 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: '50%', backgroundColor: markerForm.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
            boxShadow: `0 0 8px ${markerForm.color}80`,
          }}>
            {markerForm.icon ? (MARKER_ICONS[markerForm.icon] || '📍') : '📍'}
          </Box>
          <Box>
            <Typography sx={{ color: '#fff', fontWeight: 600 }}>
              {markerForm.title || t('map:markerDialog.previewFallback')}
            </Typography>
            {markerForm.linkedNoteId && (
              <Typography variant="caption" sx={{ color: '#4ECDC4' }}>
                📎 {notesMap.get(markerForm.linkedNoteId)?.title}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">{t('common:cancel')}</Button>
        <DndButton variant="contained" onClick={onSave} disabled={!markerForm.title.trim()}>
          {editingMarker ? t('common:save') : t('common:add')}
        </DndButton>
      </DialogActions>
    </Dialog>
  );
};
