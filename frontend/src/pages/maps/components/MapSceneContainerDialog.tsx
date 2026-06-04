import React, { useState, useRef } from 'react';
import {
  Box, Typography, TextField, Button, Dialog,
  DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useTranslation } from 'react-i18next';

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (mapName: string, file: File) => void;
};

export const MapSceneContainerDialog: React.FC<Props> = ({
  open,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation(['map', 'common']);
  const [mapName, setMapName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSave = () => {
    if (!mapName.trim() || !file) return;
    onSave(mapName, file);
    setMapName('');
    setFile(null);
  };

  const handleClose = () => {
    setMapName('');
    setFile(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}>
      <DialogTitle sx={{ fontFamily: '"Cinzel", serif', color: 'text.primary' }}>
        {t('map:childMap.createTitle', { defaultValue: 'Создать карту' })}
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label={t('map:markerDialog.fieldTitle', { defaultValue: 'Название' })}
          value={mapName}
          onChange={e => setMapName(e.target.value)}
          margin="normal"
          variant="outlined"
          sx={{ mb: 2 }}
        />

        <Box sx={{ mt: 1, p: 2, border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 1, textAlign: 'center' }}>
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          {file ? (
            <Box>
              <Typography variant="body2" color="text.primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                {file.name}
              </Typography>
              <Button size="small" variant="outlined" color="error" onClick={() => setFile(null)}>
                {t('common:clear', { defaultValue: 'Очистить' })}
              </Button>
            </Box>
          ) : (
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={() => fileInputRef.current?.click()}
            >
              {t('map:markerDialog.pickImage', { defaultValue: 'Выбрать изображение фоном' })}
            </Button>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          {t('common:cancel', { defaultValue: 'Отмена' })}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={!mapName.trim() || !file}
        >
          {t('common:save', { defaultValue: 'Сохранить' })}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
