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
  defaultName: string;
  onClose: () => void;
  onSave: (name: string, file: File) => void;
};

export const MapImageCardDialog: React.FC<Props> = ({
  open,
  defaultName,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation(['map', 'common']);
  const [name, setName] = useState(defaultName);
  const [file, setFile] = useState<File | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    if (!open) return;
    setName(defaultName);
    setFile(null);
    setNameError(null);
    setFileError(null);
    setCropOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [defaultName, open]);

  const handleSave = () => {
    const trimmed = name.trim();
    let hasError = false;
    if (!trimmed) {
      setNameError(t('map:imageCardDialog.nameRequired'));
      hasError = true;
    } else {
      setNameError(null);
    }
    if (!file) {
      setFileError(t('map:imageCardDialog.fileRequired'));
      hasError = true;
    } else {
      setFileError(null);
    }
    if (hasError || !file) return;
    onSave(trimmed, file);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {t('map:imageCardDialog.title')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('map:imageCardDialog.hint')}
          </Typography>

          <TextField
            fullWidth
            label={t('map:imageCardDialog.nameLabel')}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (event.target.value.trim()) setNameError(null);
            }}
            margin="normal"
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
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                event.target.value = '';
                if (!nextFile) return;
                setFile(nextFile);
                setFileError(null);
              }}
            />
            {file && previewUrl ? (
              <Box>
                <Box
                  component="img"
                  src={previewUrl}
                  alt={t('map:imageCardDialog.previewAlt')}
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
                    {t('map:imageCardDialog.crop')}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t('map:imageCardDialog.replaceImage')}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => {
                      setFile(null);
                      setFileError(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    {t('map:imageCardDialog.removeImage')}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Button
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                onClick={() => fileInputRef.current?.click()}
              >
                {t('map:imageCardDialog.pickImage')}
              </Button>
            )}
            {fileError && (
              <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                {fileError}
              </Typography>
            )}
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            {t('map:imageCardDialog.imageNote')}
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            {t('common:cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {t('map:imageCardDialog.create')}
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
