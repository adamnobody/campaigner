// src/features/projects/ProjectsBackgroundDialog.tsx
import * as React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Slider,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import type { ProjectsBgSettings } from '../../shared/hooks/useProjectsBackground';

type Props = {
  open: boolean;
  onClose: () => void;
  settings: ProjectsBgSettings;
  onPatch: (partial: Partial<ProjectsBgSettings>) => void;
  onPickImage: () => void;
  onReset: () => void;
  hasImage: boolean;
};

export function ProjectsBackgroundDialog(props: Props) {
  const { open, onClose, settings, onPatch, onPickImage, onReset, hasImage } = props;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Фон экрана проектов</DialogTitle>

      <DialogContent>
        <Stack spacing={2.25} sx={{ mt: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enabled && hasImage}
                  onChange={(e) => onPatch({ enabled: e.target.checked })}
                  disabled={!hasImage}
                />
              }
              label="Включить фон"
            />

            <Button variant="outlined" onClick={onPickImage}>
              Выбрать картинку
            </Button>
          </Stack>

          {!hasImage && (
            <Typography variant="body2" color="text.secondary">
              Картинка не выбрана. Нажмите «Выбрать картинку».
            </Typography>
          )}

          <Box>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              Размытие: {settings.blurPx}px
            </Typography>
            <Slider
              value={settings.blurPx}
              min={0}
              max={20}
              step={1}
              onChange={(_, v) => onPatch({ blurPx: v as number })}
              disabled={!settings.enabled || !hasImage}
            />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              Яркость: {settings.brightnessPct}%
            </Typography>
            <Slider
              value={settings.brightnessPct}
              min={50}
              max={150}
              step={1}
              onChange={(_, v) => onPatch({ brightnessPct: v as number })}
              disabled={!settings.enabled || !hasImage}
            />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              Контраст: {settings.contrastPct}%
            </Typography>
            <Slider
              value={settings.contrastPct}
              min={50}
              max={150}
              step={1}
              onChange={(_, v) => onPatch({ contrastPct: v as number })}
              disabled={!settings.enabled || !hasImage}
            />
          </Box>

          <Stack direction="row" spacing={1} justifyContent="space-between">
            <Button color="inherit" onClick={onReset}>
              Сбросить
            </Button>
            <Button
              color="error"
              onClick={() => onPatch({ enabled: false, imageDataUrl: null })}
              disabled={!hasImage}
            >
              Удалить картинку
            </Button>
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Готово
        </Button>
      </DialogActions>
    </Dialog>
  );
}
