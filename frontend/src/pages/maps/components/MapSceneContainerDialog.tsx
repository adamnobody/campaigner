import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CropIcon from '@mui/icons-material/Crop';
import { useTranslation } from 'react-i18next';
import { MapBackgroundCropDialog } from './MapBackgroundCropDialog';

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
  const [nameError, setNameError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    if (!open) return;
    setMapName('');
    setFile(null);
    setNameError(null);
    setFileError(null);
    setCropOpen(false);
    resetFileInput();
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (nextFile) {
      setFile(nextFile);
      setFileError(null);
    }
  };

  const handleRemoveBackground = () => {
    setFile(null);
    setFileError(null);
    resetFileInput();
  };

  const handleSave = () => {
    const trimmed = mapName.trim();
    let hasError = false;
    if (!trimmed) {
      setNameError(t('map:sceneContainerDialog.nameRequired'));
      hasError = true;
    } else {
      setNameError(null);
    }
    if (!file) {
      setFileError(t('map:sceneContainerDialog.backgroundRequired'));
      hasError = true;
    } else {
      setFileError(null);
    }
    if (hasError || !file) return;
    onSave(trimmed, file);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ fontFamily: '"Cinzel", serif', color: 'text.primary' }}>
          {t('map:sceneContainerDialog.title')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('map:sceneContainerDialog.hint')}
          </Typography>

          <TextField
            fullWidth
            label={t('map:sceneContainerDialog.nameLabel')}
            value={mapName}
            onChange={(e) => {
              setMapName(e.target.value);
              if (e.target.value.trim()) setNameError(null);
            }}
            margin="normal"
            variant="outlined"
            error={Boolean(nameError)}
            helperText={nameError}
            autoFocus
          />

          <Box
            sx={{
              mt: 1,
              p: 2,
              border: '1px dashed',
              borderColor: fileError ? 'error.main' : 'rgba(255,255,255,0.2)',
              borderRadius: 1,
              textAlign: 'center',
            }}
          >
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {file && previewUrl ? (
              <Box>
                <Box
                  component="img"
                  src={previewUrl}
                  alt={t('map:sceneContainerDialog.previewAlt')}
                  sx={{
                    display: 'block',
                    width: '100%',
                    maxHeight: 220,
                    objectFit: 'contain',
                    borderRadius: 1,
                    mb: 1,
                    backgroundColor: 'rgba(0,0,0,0.25)',
                  }}
                />
                <Typography variant="body2" color="text.primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {file.name}
                </Typography>
                <Box display="flex" gap={1} justifyContent="center" flexWrap="wrap">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CropIcon />}
                    onClick={() => setCropOpen(true)}
                  >
                    {t('map:sceneContainerDialog.crop')}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t('map:sceneContainerDialog.replaceBackground')}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={handleRemoveBackground}
                  >
                    {t('map:sceneContainerDialog.removeBackground')}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Button
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                onClick={() => fileInputRef.current?.click()}
              >
                {t('map:sceneContainerDialog.pickBackground')}
              </Button>
            )}
            {fileError && (
              <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                {fileError}
              </Typography>
            )}
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            {t('map:sceneContainerDialog.backgroundNote')}
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} color="inherit">
            {t('common:cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {t('map:sceneContainerDialog.create')}
          </Button>
        </DialogActions>
      </Dialog>

      <MapBackgroundCropDialog
        open={cropOpen}
        file={file}
        onClose={() => setCropOpen(false)}
        onApply={setFile}
      />
    </>
  );
};
