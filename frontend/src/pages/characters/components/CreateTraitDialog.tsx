import React, { useEffect, useMemo, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import { DndButton } from '@/components/ui/DndButton';
import { useCharacterTraitsStore } from '@/store/useCharacterTraitsStore';
import { useUIStore } from '@/store/useUIStore';
import { apiClient } from '@/api/client';
import { LIMITS } from '@campaigner/shared';
import { uploadAssetUrl } from '@/utils/uploadAssetUrl';

interface CreateTraitDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: number;
}

interface UploadTraitResponse {
  success: boolean;
  data?: {
    path?: string;
  };
}

const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const ACCEPT_HINT = 'image/jpeg,image/png,image/webp';

export const CreateTraitDialog: React.FC<CreateTraitDialogProps> = ({ open, onClose, projectId }) => {
  const traits = useCharacterTraitsStore((s) => s.traits);
  const createTrait = useCharacterTraitsStore((s) => s.createTrait);
  const showSnackbar = useUIStore((s) => s.showSnackbar);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [excludedIds, setExcludedIds] = useState<number[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const previewUrl = useMemo(() => {
    if (!file) return undefined;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!open) {
      setName('');
      setDescription('');
      setExcludedIds([]);
      setFile(null);
      setSubmitting(false);
    }
  }, [open]);

  const canSubmit = name.trim().length > 0 && description.trim().length > 0 && !submitting;

  const validateFile = (candidate: File): string | null => {
    if (!ACCEPTED_MIME_TYPES.includes(candidate.type as (typeof ACCEPTED_MIME_TYPES)[number])) {
      return 'Допустимые форматы: jpg, png, webp';
    }
    if (candidate.size > LIMITS.MAX_FILE_SIZE) {
      return `Максимальный размер файла: ${Math.round(LIMITS.MAX_FILE_SIZE / (1024 * 1024))}MB`;
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    e.target.value = '';
    if (!selected) return;

    const error = validateFile(selected);
    if (error) {
      showSnackbar(error, 'error');
      return;
    }

    setFile(selected);
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
  };

  const handleCancel = () => {
    if (submitting) return;
    onClose();
  };

  const availableTraitOptions = useMemo(
    () =>
      traits
        .filter((trait) => trait.projectId === projectId)
        .map((trait) => ({ id: trait.id, name: trait.name })),
    [traits, projectId]
  );
  const selectedTraitOptions = useMemo(() => {
    const selected = new Set(excludedIds);
    return availableTraitOptions.filter((option) => selected.has(option.id));
  }, [availableTraitOptions, excludedIds]);

  const handleCreate = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      let imagePath = '';

      if (file) {
        const formData = new FormData();
        formData.append('traitImage', file);
        const uploadRes = await apiClient.post<UploadTraitResponse>('/upload/traits', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imagePath = uploadRes.data?.data?.path ?? '';
      }

      await createTrait({
        projectId,
        name: name.trim(),
        description: description.trim(),
        imagePath,
        excludedIds,
      });

      showSnackbar('Черта создана', 'success');
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось создать черту';
      showSnackbar(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Новая черта характера</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          required
          label="Название"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 50))}
          margin="normal"
          inputProps={{ maxLength: 50 }}
        />
        <TextField
          fullWidth
          required
          multiline
          rows={4}
          label="Описание"
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 200))}
          margin="normal"
          inputProps={{ maxLength: 200 }}
        />
        <Box sx={{ mt: 2 }}>
          <Autocomplete
            multiple
            options={availableTraitOptions}
            value={selectedTraitOptions}
            getOptionLabel={(option) => option.name}
            onChange={(_, value) => setExcludedIds(value.map((item) => item.id))}
            renderInput={(params) => (
              <TextField {...params} label="Исключает черты:" placeholder="Выберите черты" />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  icon={<BlockIcon sx={{ fontSize: 16 }} />}
                  label={option.name}
                  size="small"
                  {...getTagProps({ index })}
                  key={option.id}
                />
              ))
            }
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} disabled={submitting}>
            Загрузить изображение
            <input type="file" hidden accept={ACCEPT_HINT} onChange={handleFileChange} />
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Допустимые форматы: jpg, png, webp. Максимум: {Math.round(LIMITS.MAX_FILE_SIZE / (1024 * 1024))}
            MB
          </Typography>
          {!file && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Без изображения будет использован буквенный аватар
            </Typography>
          )}
        </Box>

        {previewUrl && (
          <Box
            sx={{
              mt: 2,
              width: 120,
              height: 120,
              borderRadius: 1.5,
              overflow: 'hidden',
              position: 'relative',
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box
              component="img"
              src={uploadAssetUrl(previewUrl) ?? previewUrl}
              alt="Trait preview"
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <IconButton
              size="small"
              onClick={handleRemoveFile}
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                bgcolor: 'rgba(0,0,0,0.55)',
                color: '#fff',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleCancel} color="inherit" disabled={submitting}>
          Отмена
        </Button>
        <DndButton variant="contained" onClick={handleCreate} loading={submitting} disabled={!canSubmit}>
          Создать
        </DndButton>
      </DialogActions>
    </Dialog>
  );
};
