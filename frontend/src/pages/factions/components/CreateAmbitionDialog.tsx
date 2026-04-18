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
import type { Ambition } from '@campaigner/shared';
import { LIMITS } from '@campaigner/shared';
import { DndButton } from '@/components/ui/DndButton';
import { useUIStore } from '@/store/useUIStore';
import { useAmbitionsStore } from '@/store/useAmbitionsStore';
import { apiClient } from '@/api/client';
import { uploadAssetUrl } from '@/utils/uploadAssetUrl';

interface CreateAmbitionDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: number;
  editingAmbition?: Ambition | null;
}

interface UploadAmbitionResponse {
  success: boolean;
  data?: { path?: string };
}

const ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/webp',
] as const;
/** MIME + расширения: часть браузеров не выставляет type для jpeg при выборе файла. */
const ACCEPT_HINT = 'image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp';

const IMAGE_EXT_RE = /\.(jpe?g|png|webp)$/i;

export const CreateAmbitionDialog: React.FC<CreateAmbitionDialogProps> = ({
  open,
  onClose,
  projectId,
  editingAmbition,
}) => {
  const createAmbition = useAmbitionsStore((s) => s.createAmbition);
  const updateAmbition = useAmbitionsStore((s) => s.updateAmbition);
  const updateExclusions = useAmbitionsStore((s) => s.updateExclusions);
  const catalog = useAmbitionsStore((s) => s.catalog);
  const showSnackbar = useUIStore((s) => s.showSnackbar);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [excludedIds, setExcludedIds] = useState<number[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const previewUrl = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    return editingAmbition?.iconPath || undefined;
  }, [file, editingAmbition?.iconPath]);

  useEffect(() => {
    return () => {
      if (file && previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [file, previewUrl]);

  useEffect(() => {
    if (!open) return;
    setName(editingAmbition?.name ?? '');
    setDescription(editingAmbition?.description ?? '');
    setExcludedIds(editingAmbition?.exclusions ?? []);
    setFile(null);
    setSubmitting(false);
  }, [open, editingAmbition]);

  const availableAmbitionOptions = useMemo(
    () =>
      catalog
        .filter((ambition) => ambition.id !== editingAmbition?.id)
        .map((ambition) => ({ id: ambition.id, name: ambition.name })),
    [catalog, editingAmbition?.id]
  );
  const selectedAmbitionOptions = useMemo(() => {
    const selected = new Set(excludedIds);
    return availableAmbitionOptions.filter((option) => selected.has(option.id));
  }, [availableAmbitionOptions, excludedIds]);

  const canSubmit = name.trim().length > 0 && description.trim().length > 0 && !submitting;

  const validateFile = (candidate: File): string | null => {
    const mimeOk = ACCEPTED_MIME_TYPES.includes(
      candidate.type as (typeof ACCEPTED_MIME_TYPES)[number]
    );
    const extOk = IMAGE_EXT_RE.test(candidate.name);
    const unknownMime =
      candidate.type === '' ||
      candidate.type === 'application/octet-stream';
    if (!mimeOk && !(unknownMime && extOk) && !extOk) {
      return 'Допустимые форматы: jpg, jpeg, png, webp';
    }
    if (candidate.size > LIMITS.MAX_FILE_SIZE) {
      return `Максимальный размер файла: ${Math.round(LIMITS.MAX_FILE_SIZE / (1024 * 1024))}MB`;
    }
    return null;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    event.target.value = '';
    if (!selected) return;
    const error = validateFile(selected);
    if (error) {
      showSnackbar(error, 'error');
      return;
    }
    setFile(selected);
  };

  const handleSave = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      let iconPath = editingAmbition?.iconPath ?? '';
      if (file) {
        const formData = new FormData();
        formData.append('ambitionImage', file);
        const uploadRes = await apiClient.post<UploadAmbitionResponse>('/upload/ambitions', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        iconPath = uploadRes.data?.data?.path ?? iconPath;
      }

      if (editingAmbition) {
        await updateAmbition(editingAmbition.id, {
          name: name.trim(),
          description: description.trim(),
          iconPath,
        });
        await updateExclusions(editingAmbition.id, excludedIds);
        showSnackbar('Амбиция обновлена', 'success');
      } else {
        await createAmbition({
          projectId,
          name: name.trim(),
          description: description.trim(),
          iconPath,
          excludedIds,
        });
        showSnackbar('Амбиция создана', 'success');
      }

      onClose();
    } catch (error: unknown) {
      showSnackbar(error instanceof Error ? error.message : 'Не удалось сохранить амбицию', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editingAmbition ? 'Редактировать амбицию' : 'Новая амбиция'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          required
          label="Название"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 200))}
          margin="normal"
          inputProps={{ maxLength: 200 }}
        />
        <TextField
          fullWidth
          required
          multiline
          rows={4}
          label="Описание"
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 10000))}
          margin="normal"
          inputProps={{ maxLength: 10000 }}
        />
        <Box sx={{ mt: 2 }}>
          <Autocomplete
            multiple
            options={availableAmbitionOptions}
            value={selectedAmbitionOptions}
            getOptionLabel={(option) => option.name}
            onChange={(_, value) => setExcludedIds(value.map((item) => item.id))}
            renderInput={(params) => (
              <TextField {...params} label="Исключает амбиции:" placeholder="Выберите амбиции" />
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
            Загрузить иконку
            <input type="file" hidden accept={ACCEPT_HINT} onChange={handleFileChange} />
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Допустимые форматы: jpeg, jpg, png, webp. Максимум:{' '}
            {Math.round(LIMITS.MAX_FILE_SIZE / (1024 * 1024))}
            MB
          </Typography>
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
              alt="Ambition preview"
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <IconButton
              size="small"
              onClick={() => setFile(null)}
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
        <Button onClick={onClose} color="inherit" disabled={submitting}>
          Отмена
        </Button>
        <DndButton variant="contained" onClick={handleSave} loading={submitting} disabled={!canSubmit}>
          {editingAmbition ? 'Сохранить' : 'Создать'}
        </DndButton>
      </DialogActions>
    </Dialog>
  );
};
