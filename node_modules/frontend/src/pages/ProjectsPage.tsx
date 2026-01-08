import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Slider,
  Stack,
  Switch,
  FormControlLabel,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import WallpaperOutlinedIcon from '@mui/icons-material/WallpaperOutlined';

import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../app/store';
import type { GameSystemType, ProjectDTO } from '../app/api';

const SYSTEM_LABELS: Record<GameSystemType, string> = {
  generic: 'Generic (Универсальная)',
  dnd5e: 'Dungeons & Dragons 5e',
  vtm: 'Vampire: The Masquerade',
  cyberpunk: 'Cyberpunk',
  wh40k_rt: 'Warhammer 40K: Rogue Trader'
};

/** ===== Projects background (localStorage) ===== */

type ProjectsBgSettings = {
  enabled: boolean;
  imageDataUrl: string | null;
  blurPx: number;          // 0..20
  brightnessPct: number;   // 50..150
  contrastPct: number;     // 50..150
};

const BG_LS_KEY = 'projectsBg:v1';

const BG_DEFAULTS: ProjectsBgSettings = {
  enabled: false,
  imageDataUrl: null,
  blurPx: 0,
  brightnessPct: 100,
  contrastPct: 100,
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function loadBgSettings(): ProjectsBgSettings {
  try {
    const raw = localStorage.getItem(BG_LS_KEY);
    if (!raw) return BG_DEFAULTS;
    const obj = JSON.parse(raw) as Partial<ProjectsBgSettings> | null;

    const imageDataUrl = typeof obj?.imageDataUrl === 'string' ? obj.imageDataUrl : null;
    const enabled = Boolean(obj?.enabled) && Boolean(imageDataUrl);

    return {
      enabled,
      imageDataUrl,
      blurPx: clamp(Number(obj?.blurPx ?? BG_DEFAULTS.blurPx), 0, 20),
      brightnessPct: clamp(Number(obj?.brightnessPct ?? BG_DEFAULTS.brightnessPct), 50, 150),
      contrastPct: clamp(Number(obj?.contrastPct ?? BG_DEFAULTS.contrastPct), 50, 150),
    };
  } catch {
    return BG_DEFAULTS;
  }
}

function saveBgSettings(s: ProjectsBgSettings) {
  try {
    localStorage.setItem(BG_LS_KEY, JSON.stringify(s));
  } catch {
    // переполнение localStorage — не критично, просто не сохраним
  }
}

/** ===== Image helpers (canvas compression) ===== */

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error('Failed to read file'));
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

function dataUrlBytesApprox(dataUrl: string): number {
  // data:[mime];base64,xxxx  -> bytes ~= base64_length * 3/4 (минус паддинг, но нам достаточно оценки)
  const comma = dataUrl.indexOf(',');
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Math.floor((b64.length * 3) / 4);
}

type CompressOptions = {
  maxSidePx: number;       // 1280..2560
  mime: 'image/jpeg' | 'image/webp';
  qualityStart: number;    // 0..1
  qualityMin: number;      // 0..1
  qualityStep: number;     // 0..1
  targetBytes: number;     // например 2_200_000
};

async function compressImageToDataUrl(file: File, opts: CompressOptions): Promise<string> {
  const inputDataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(inputDataUrl);

  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;

  if (!srcW || !srcH) {
    throw new Error('Invalid image dimensions');
  }

  const scale = Math.min(1, opts.maxSidePx / Math.max(srcW, srcH));
  const dstW = Math.max(1, Math.round(srcW * scale));
  const dstH = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = dstW;
  canvas.height = dstH;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Cannot get 2D context');

  // чуть улучшаем качество downscale в браузерах, где это поддерживается
  // (не везде типы TS знают эти поля)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyCtx = ctx as any;
  if ('imageSmoothingEnabled' in anyCtx) anyCtx.imageSmoothingEnabled = true;
  if ('imageSmoothingQuality' in anyCtx) anyCtx.imageSmoothingQuality = 'high';

  // Заполняем фоном (на случай PNG с прозрачностью)
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, dstW, dstH);

  ctx.drawImage(img, 0, 0, dstW, dstH);

  // Подбираем quality так, чтобы уложиться в targetBytes
  let q = opts.qualityStart;
  let out = canvas.toDataURL(opts.mime, q);

  while (dataUrlBytesApprox(out) > opts.targetBytes && q > opts.qualityMin) {
    q = Math.max(opts.qualityMin, q - opts.qualityStep);
    out = canvas.toDataURL(opts.mime, q);
  }

  // Если всё ещё слишком большой — уменьшаем размер ещё на шаг и повторяем (1 раз)
  if (dataUrlBytesApprox(out) > opts.targetBytes) {
    const scale2 = 0.85;
    const dstW2 = Math.max(1, Math.round(dstW * scale2));
    const dstH2 = Math.max(1, Math.round(dstH * scale2));
    canvas.width = dstW2;
    canvas.height = dstH2;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, dstW2, dstH2);
    ctx.drawImage(img, 0, 0, dstW2, dstH2);

    q = opts.qualityStart;
    out = canvas.toDataURL(opts.mime, q);
    while (dataUrlBytesApprox(out) > opts.targetBytes && q > opts.qualityMin) {
      q = Math.max(opts.qualityMin, q - opts.qualityStep);
      out = canvas.toDataURL(opts.mime, q);
    }
  }

  return out;
}

/** ===== Page ===== */

export function ProjectsPage() {
  const nav = useNavigate();
  const { projects, loadProjects, createProject, deleteProject } = useAppStore();

  // Create project state
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [rootPath, setRootPath] = useState('');
  const [system, setSystem] = useState<GameSystemType>('generic');

  // Delete confirm state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<ProjectDTO | null>(null);

  const canCreate = useMemo(() => name.trim().length > 0, [name]);

  // Background state
  const [bgOpen, setBgOpen] = useState(false);
  const [bg, setBg] = useState<ProjectsBgSettings>(() => loadBgSettings());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    saveBgSettings(bg);
  }, [bg]);

  const handleCreate = async () => {
    const rp = rootPath.trim();
    await createProject({
      name: name.trim(),
      system,
      ...(rp ? { rootPath: rp } : {})
    });

    setOpen(false);
    setName('');
    setRootPath('');
    setSystem('generic');
  };

  const handleClose = () => {
    setOpen(false);
    setName('');
    setRootPath('');
    setSystem('generic');
  };

  const hasBgImage = Boolean(bg.imageDataUrl);

  const bgFilters = `blur(${bg.blurPx}px) brightness(${bg.brightnessPct}%) contrast(${bg.contrastPct}%)`;

  const patchBg = (partial: Partial<ProjectsBgSettings>) => {
    setBg((prev) => {
      const next: ProjectsBgSettings = {
        ...prev,
        ...partial,
      };

      next.blurPx = clamp(next.blurPx, 0, 20);
      next.brightnessPct = clamp(next.brightnessPct, 50, 150);
      next.contrastPct = clamp(next.contrastPct, 50, 150);

      if (!next.imageDataUrl) next.enabled = false;

      return next;
    });
  };

  const resetBg = () => setBg(BG_DEFAULTS);

  const onPickImage = () => fileInputRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const dataUrl = await compressImageToDataUrl(file, {
        maxSidePx: 1920,
        mime: 'image/jpeg',
        qualityStart: 0.85,
        qualityMin: 0.55,
        qualityStep: 0.05,
        targetBytes: 2_200_000,
      });

      patchBg({ imageDataUrl: dataUrl, enabled: true });
    } catch (err) {
      console.error(err);
      alert('Не удалось обработать изображение');
    }
  };

  return (
    <Box
      sx={(theme) => ({
        position: 'relative',
        minHeight: '100vh',
        bgcolor: theme.palette.background.default,
        overflow: 'hidden',
      })}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        style={{ display: 'none' }}
      />

      {bg.enabled && bg.imageDataUrl && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            backgroundImage: `url(${bg.imageDataUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: 'scale(1.05)',
            filter: bgFilters,
          }}
        />
      )}

      {bg.enabled && bg.imageDataUrl && (
        <Box
          aria-hidden
          sx={(theme) => ({
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            pointerEvents: 'none',
            backgroundImage: `
              linear-gradient(to top, ${theme.palette.background.default} 0%, rgba(0,0,0,0) 35%),
              linear-gradient(to bottom, ${theme.palette.background.default} 0%, rgba(0,0,0,0) 35%),
              linear-gradient(to left, ${theme.palette.background.default} 0%, rgba(0,0,0,0) 35%),
              linear-gradient(to right, ${theme.palette.background.default} 0%, rgba(0,0,0,0) 35%),
              radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.35) 100%)
            `,
            opacity: theme.palette.mode === 'dark' ? 0.9 : 0.65,
          })}
        />
      )}

      <Box sx={{ position: 'relative', zIndex: 2 }}>
        <Container sx={{ py: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h4">Проекты</Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="Фон экрана проектов">
                <IconButton onClick={() => setBgOpen(true)} size="small">
                  <WallpaperOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Button variant="contained" onClick={() => setOpen(true)}>
                Создать проект
              </Button>
            </Box>
          </Box>

          <List dense>
            {projects.map((p) => (
              <ListItemButton
                key={p.id}
                onClick={() => nav(`/projects/${p.id}`)}
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <ListItemText
                  primary={p.name}
                  secondary={
                    <>
                      <Typography component="span" variant="caption" sx={{ fontWeight: 'bold', mr: 1 }}>
                        [{SYSTEM_LABELS[p.system] || p.system}]
                      </Typography>
                      {p.path}
                    </>
                  }
                />

                <Tooltip title="Удалить проект">
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(ev) => {
                      ev.preventDefault();
                      ev.stopPropagation();
                      setDeletingProject(p);
                      setDeleteOpen(true);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </ListItemButton>
            ))}
          </List>

          {/* Create dialog */}
          <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>Новый проект</DialogTitle>
            <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                autoFocus
                fullWidth
                label="Название"
                value={name}
                onChange={(e) => setName(e.target.value)}
                margin="normal"
              />

              <FormControl fullWidth>
                <InputLabel id="system-select-label">Игровая система</InputLabel>
                <Select
                  labelId="system-select-label"
                  value={system}
                  label="Игровая система"
                  onChange={(e: SelectChangeEvent) => setSystem(e.target.value as GameSystemType)}
                >
                  {Object.entries(SYSTEM_LABELS).map(([key, label]) => (
                    <MenuItem key={key} value={key}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box>
                <TextField
                  fullWidth
                  label="Путь (опционально, абсолютный)"
                  placeholder="C:\Users\You\Documents\DnDCampaigns"
                  value={rootPath}
                  onChange={(e) => setRootPath(e.target.value)}
                  margin="dense"
                />
                <Typography variant="caption" color="text.secondary">
                  Если путь не указан, проект будет создан в Documents\CampaignerProjects.
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Отмена</Button>
              <Button variant="contained" disabled={!canCreate} onClick={handleCreate}>
                Создать
              </Button>
            </DialogActions>
          </Dialog>

          {/* Delete confirm dialog */}
          <Dialog
            open={deleteOpen}
            onClose={() => {
              setDeleteOpen(false);
              setDeletingProject(null);
            }}
          >
            <DialogTitle>Удалить проект?</DialogTitle>
            <DialogContent>
              <Typography variant="body2">
                Проект <b>{deletingProject?.name}</b> будет удалён из списка приложения.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                Примечание: удаление файлов проекта на диске зависит от реализации на бэке.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  setDeleteOpen(false);
                  setDeletingProject(null);
                }}
              >
                Отмена
              </Button>
              <Button
                color="error"
                onClick={async () => {
                  if (!deletingProject) return;
                  await deleteProject(deletingProject.id);
                  setDeleteOpen(false);
                  setDeletingProject(null);
                }}
              >
                Удалить
              </Button>
            </DialogActions>
          </Dialog>

          {/* Background settings dialog */}
          <Dialog open={bgOpen} onClose={() => setBgOpen(false)} fullWidth maxWidth="xs">
            <DialogTitle>Фон экрана проектов</DialogTitle>
            <DialogContent sx={{ pt: 1 }}>
              <Stack spacing={2.25} sx={{ mt: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={bg.enabled && hasBgImage}
                        onChange={(e) => patchBg({ enabled: e.target.checked })}
                        disabled={!hasBgImage}
                      />
                    }
                    label="Включить фон"
                  />

                  <Button variant="outlined" onClick={onPickImage}>
                    Выбрать картинку
                  </Button>
                </Stack>

                {!hasBgImage && (
                  <Typography variant="body2" color="text.secondary">
                    Картинка не выбрана. Нажмите «Выбрать картинку».
                  </Typography>
                )}

                <Box>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Размытие: {bg.blurPx}px
                  </Typography>
                  <Slider
                    value={bg.blurPx}
                    min={0}
                    max={20}
                    step={1}
                    onChange={(_, v) => patchBg({ blurPx: v as number })}
                    disabled={!bg.enabled || !hasBgImage}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Яркость: {bg.brightnessPct}%
                  </Typography>
                  <Slider
                    value={bg.brightnessPct}
                    min={50}
                    max={150}
                    step={1}
                    onChange={(_, v) => patchBg({ brightnessPct: v as number })}
                    disabled={!bg.enabled || !hasBgImage}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Контраст: {bg.contrastPct}%
                  </Typography>
                  <Slider
                    value={bg.contrastPct}
                    min={50}
                    max={150}
                    step={1}
                    onChange={(_, v) => patchBg({ contrastPct: v as number })}
                    disabled={!bg.enabled || !hasBgImage}
                  />
                </Box>

                <Stack direction="row" spacing={1} justifyContent="space-between">
                  <Button color="inherit" onClick={resetBg}>
                    Сбросить
                  </Button>
                  <Button
                    color="error"
                    onClick={() => patchBg({ enabled: false, imageDataUrl: null })}
                    disabled={!hasBgImage}
                  >
                    Удалить картинку
                  </Button>
                </Stack>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setBgOpen(false)} variant="contained">
                Готово
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </Box>
  );
}
