import React from 'react';
import {
  Box, Typography, TextField, Button, Dialog,
  DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, Autocomplete,
  Chip,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import MapIcon from '@mui/icons-material/Map';
import ImageIcon from '@mui/icons-material/Image';
import { DndButton } from '@/components/ui/DndButton';
import {
  MARKER_ICONS, MARKER_ICON_ENTRIES, MARKER_COLORS,
} from './mapUtils';
import type { MarkerIcon, Marker, NoteOption } from './mapUtils';

export type MapMarkerFormState = {
  title: string;
  description: string;
  icon: MarkerIcon;
  color: string;
  linkedNoteId: number | null;
  createChildMap: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  editingMarker: Marker | null;
  markerForm: MapMarkerFormState;
  setMarkerForm: React.Dispatch<React.SetStateAction<MapMarkerFormState>>;
  notes: NoteOption[];
  notesMap: Map<number, NoteOption>;
  childMapFile: File | null;
  childMapPreview: string | null;
  onChildMapFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearChildMapFile: () => void;
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
  childMapFile,
  childMapPreview,
  onChildMapFileChange,
  clearChildMapFile,
  onSave,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
    PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}>
    <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>
      {editingMarker ? 'Редактировать маркер' : 'Добавить маркер'}
    </DialogTitle>
    <DialogContent>
      <TextField fullWidth label="Название маркера" value={markerForm.title}
        onChange={e => setMarkerForm(prev => ({ ...prev, title: e.target.value }))} margin="normal" />
      <TextField fullWidth label="Описание" value={markerForm.description}
        onChange={e => setMarkerForm(prev => ({ ...prev, description: e.target.value }))}
        margin="normal" multiline rows={3} />

      <Autocomplete
        options={notes}
        getOptionLabel={o => o.title}
        value={notes.find(n => n.id === markerForm.linkedNoteId) || null}
        onChange={(_, v) => setMarkerForm(prev => ({ ...prev, linkedNoteId: v?.id || null }))}
        renderInput={params => (
          <TextField {...params} label="Привязанная заметка" margin="normal" placeholder="Начните вводить..." />
        )}
        renderOption={(props, option) => (
          <li {...props}>
            <Box display="flex" alignItems="center" gap={1}>
              <DescriptionIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} />
              <Typography>{option.title}</Typography>
              <Chip label={option.noteType} size="small" variant="outlined"
                sx={{ ml: 'auto', fontSize: '0.7rem', height: 20 }} />
            </Box>
          </li>
        )}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        noOptionsText="Нет заметок" clearText="Очистить" sx={{ mt: 1 }}
      />

      {!editingMarker && (
        <Box sx={{ mt: 2 }}>
          <Box
            onClick={() => {
              const next = !markerForm.createChildMap;
              setMarkerForm(prev => ({ ...prev, createChildMap: next }));
              if (!next) clearChildMapFile();
            }}
            sx={{
              p: 1.5, borderRadius: 1, cursor: 'pointer', transition: 'all 0.2s',
              backgroundColor: markerForm.createChildMap ? 'rgba(187,143,206,0.08)' : 'transparent',
              border: markerForm.createChildMap ? '1px solid rgba(187,143,206,0.3)' : '1px solid rgba(255,255,255,0.08)',
              '&:hover': { borderColor: 'rgba(187,143,206,0.4)' },
            }}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{
                width: 20, height: 20, borderRadius: '4px', transition: 'all 0.2s',
                border: markerForm.createChildMap ? '2px solid #BB8FCE' : '2px solid rgba(255,255,255,0.2)',
                backgroundColor: markerForm.createChildMap ? '#BB8FCE' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {markerForm.createChildMap && (
                  <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 700, lineHeight: 1 }}>✓</Typography>
                )}
              </Box>
              <Box>
                <Typography sx={{ color: markerForm.createChildMap ? '#BB8FCE' : 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.9rem' }}>
                  Создать вложенную карту
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>
                  Маркер станет входом на отдельную карту
                </Typography>
              </Box>
              <MapIcon sx={{ ml: 'auto', color: markerForm.createChildMap ? '#BB8FCE' : 'rgba(255,255,255,0.15)', fontSize: 20 }} />
            </Box>
          </Box>

          {markerForm.createChildMap && (
            <Box sx={{ mt: 1.5, ml: 0.5 }}>
              {childMapPreview ? (
                <>
                  <Box sx={{ width: '100%', height: 120, borderRadius: 1, overflow: 'hidden', border: '1px solid rgba(187,143,206,0.3)' }}>
                    <img src={childMapPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>{childMapFile?.name}</Typography>
                    <Button size="small" onClick={clearChildMapFile}
                      sx={{ color: 'rgba(255,100,100,0.6)', minWidth: 'auto', fontSize: '0.75rem' }}>Удалить</Button>
                  </Box>
                </>
              ) : (
                <Button component="label" fullWidth variant="outlined" startIcon={<ImageIcon />} size="small"
                  sx={{ borderColor: 'rgba(187,143,206,0.2)', color: 'rgba(187,143,206,0.6)', borderStyle: 'dashed', py: 1.5,
                    '&:hover': { borderColor: 'rgba(187,143,206,0.4)', backgroundColor: 'rgba(187,143,206,0.05)' } }}>
                  Загрузить изображение карты
                  <input type="file" hidden accept="image/*" onChange={onChildMapFileChange} />
                </Button>
              )}
            </Box>
          )}
        </Box>
      )}

      <FormControl fullWidth margin="normal">
        <InputLabel>Иконка</InputLabel>
        <Select value={markerForm.icon} label="Иконка"
          onChange={e => setMarkerForm(prev => ({ ...prev, icon: e.target.value as MarkerIcon }))}>
          {MARKER_ICON_ENTRIES.map(([key, emoji]) => (
            <MenuItem key={key} value={key}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography fontSize="1.2rem">{emoji}</Typography>
                <Typography>{key}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 2, mb: 1 }}>Цвет</Typography>
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
            {markerForm.title || 'Превью маркера'}
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
      <Button onClick={onClose} color="inherit">Отмена</Button>
      <DndButton variant="contained" onClick={onSave} disabled={!markerForm.title.trim()}>
        {editingMarker ? 'Сохранить' : 'Добавить'}
      </DndButton>
    </DialogActions>
  </Dialog>
);
