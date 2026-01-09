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
  Link as MUILink,
  Drawer,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import WallpaperOutlinedIcon from '@mui/icons-material/WallpaperOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PaletteIcon from '@mui/icons-material/Palette';
import defaultProjectsBg from '../assets/projects-bg.jpeg'
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
  blurPx: number; // 0..20
  brightnessPct: number; // 50..150
  contrastPct: number; // 50..150
};

const BG_LS_KEY = 'projectsBg:v1';

const BG_DEFAULTS: ProjectsBgSettings = {
  enabled: true,
  imageDataUrl: defaultProjectsBg,
  blurPx: 0,
  brightnessPct: 100,
  contrastPct: 100,
};


function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** ===== Theme settings (Projects UI only) =====
 * Глобальный primary уходит через window.__setThemeSettings({ primary })
 * Цвет "панелей проектов" делаем локальным (только для ProjectsPage) и храним в localStorage.
 */

type ProjectsUiSettings = {
  projectCardColor: string; // base overlay color for project cards
};

const PROJECTS_UI_KEY = 'ui.projectsUi:v1';

const PROJECTS_UI_DEFAULTS: ProjectsUiSettings = {
  projectCardColor: '#14181C', // тёмный базовый
};

function loadProjectsUi(): ProjectsUiSettings {
  try {
    const raw = localStorage.getItem(PROJECTS_UI_KEY);
    if (!raw) return PROJECTS_UI_DEFAULTS;
    const obj = JSON.parse(raw) as Partial<ProjectsUiSettings> | null;
    const projectCardColor = typeof obj?.projectCardColor === 'string' ? obj.projectCardColor : PROJECTS_UI_DEFAULTS.projectCardColor;
    return { projectCardColor };
  } catch {
    return PROJECTS_UI_DEFAULTS;
  }
}

function saveProjectsUi(s: ProjectsUiSettings) {
  try {
    localStorage.setItem(PROJECTS_UI_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

/** ===== Theme helpers (window MVP) ===== */

function getInitialPrimary(): string {
  const w = window as any;
  if (typeof w.__getThemeSettings === 'function') {
    const s = w.__getThemeSettings() as undefined | { primary?: string };
    if (s?.primary) return s.primary;
  }
  const s = w.__themeSettings as undefined | { primary?: string };
  return s?.primary ?? '#7C8CFF';
}

function applyPrimary(primary: string) {
  const w = window as any;
  const fn = w.__setThemeSettings as undefined | ((patch: { primary: string }) => void);
  if (fn) fn({ primary });
}

/** ===== Image helpers (canvas compression) ===== */

function loadBgSettings(): ProjectsBgSettings {
  try {
    const raw = localStorage.getItem(BG_LS_KEY);
    if (!raw) return BG_DEFAULTS;

    const obj = JSON.parse(raw) as Partial<ProjectsBgSettings> | null;

    const imageDataUrl =
      typeof obj?.imageDataUrl === 'string' && obj.imageDataUrl.trim().length > 0
        ? obj.imageDataUrl
        : BG_DEFAULTS.imageDataUrl;

    // если enabled не задан — берём дефолт (true)
    const enabled = obj?.enabled === undefined ? BG_DEFAULTS.enabled : Boolean(obj.enabled);

    return {
      enabled: Boolean(enabled) && Boolean(imageDataUrl),
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
  const comma = dataUrl.indexOf(',');
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Math.floor((b64.length * 3) / 4);
}

type CompressOptions = {
  maxSidePx: number;
  mime: 'image/jpeg' | 'image/webp';
  qualityStart: number;
  qualityMin: number;
  qualityStep: number;
  targetBytes: number;
};

async function compressImageToDataUrl(file: File, opts: CompressOptions): Promise<string> {
  const inputDataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(inputDataUrl);

  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;

  if (!srcW || !srcH) throw new Error('Invalid image dimensions');

  const scale = Math.min(1, opts.maxSidePx / Math.max(srcW, srcH));
  const dstW = Math.max(1, Math.round(srcW * scale));
  const dstH = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = dstW;
  canvas.height = dstH;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Cannot get 2D context');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyCtx = ctx as any;
  if ('imageSmoothingEnabled' in anyCtx) anyCtx.imageSmoothingEnabled = true;
  if ('imageSmoothingQuality' in anyCtx) anyCtx.imageSmoothingQuality = 'high';

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, dstW, dstH);
  ctx.drawImage(img, 0, 0, dstW, dstH);

  let q = opts.qualityStart;
  let out = canvas.toDataURL(opts.mime, q);

  while (dataUrlBytesApprox(out) > opts.targetBytes && q > opts.qualityMin) {
    q = Math.max(opts.qualityMin, q - opts.qualityStep);
    out = canvas.toDataURL(opts.mime, q);
  }

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

/** ===== Small UI: color picker row ===== */

function ColorPickerRow(props: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const { label, value, onChange } = props;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Выберите цвет
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={(theme) => ({
            width: 40,
            height: 34,
            borderRadius: 1.5,
            backgroundColor: value,
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: `0 0 0 3px ${
              theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.9)'
            }`,
          })}
        />
        <Box
          component="input"
          type="color"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          sx={{
            width: 44,
            height: 34,
            border: 'none',
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
          }}
        />
      </Box>
    </Box>
  );
}

/** ===== Page ===== */

export function ProjectsPage() {
  const nav = useNavigate();
  const { projects, loadProjects, createProject, deleteProject } = useAppStore();

  // Theme panel state
  const [themePanelOpen, setThemePanelOpen] = useState(false);

  // Global theme primary
  const [primary, setPrimary] = useState<string>(() => getInitialPrimary());

  // Projects UI (local) settings
  const [projectsUi, setProjectsUi] = useState<ProjectsUiSettings>(() => loadProjectsUi());

  useEffect(() => {
    saveProjectsUi(projectsUi);
  }, [projectsUi]);

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
      const next: ProjectsBgSettings = { ...prev, ...partial };
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

  // Use user-selected card base color
  const cardBase = projectsUi.projectCardColor;

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

      {/* Background */}
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

      {/* Edge fade / vignette */}
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

      {/* Right-edge toggle button */}
      <Box
        sx={{
          position: 'fixed',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 6,
        }}
      >
        <Tooltip title="Цвета интерфейса">
          <IconButton
            onClick={() => setThemePanelOpen((v) => !v)}
            sx={(theme) => ({
              borderRadius: '12px 0 0 12px',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRight: 'none',
              background:
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(180deg, rgba(18,20,26,0.85), rgba(12,14,18,0.85))'
                  : 'rgba(255,255,255,0.9)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
              backdropFilter: 'blur(8px)',
              px: 1.25,
              gap: 0.5,
            })}
          >
            <PaletteIcon fontSize="small" />
            {themePanelOpen ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Theme settings drawer */}
      <Drawer
        anchor="right"
        open={themePanelOpen}
        onClose={() => setThemePanelOpen(false)}
        PaperProps={{
          sx: (theme) => ({
            width: 340,
            borderLeft: '1px solid rgba(255,255,255,0.10)',
            background:
              theme.palette.mode === 'dark'
                ? 'linear-gradient(180deg, rgba(18,20,26,0.92), rgba(12,14,18,0.92))'
                : 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(10px)',
          }),
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography
            sx={{
              fontFamily: '"IBM Plex Serif", ui-serif, Georgia, serif',
              fontWeight: 700,
              mb: 1,
            }}
          >
            Цвета интерфейса
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Изменения применяются глобально (primary) и локально (панели проектов).
          </Typography>

          <Stack spacing={2}>
            <ColorPickerRow
              label="Primary (кнопки/акценты)"
              value={primary}
              onChange={(next) => {
                setPrimary(next);
                applyPrimary(next); // live apply
              }}
            />

            <ColorPickerRow
              label="Панели проектов (карточки)"
              value={projectsUi.projectCardColor}
              onChange={(next) => {
                setProjectsUi((prev) => ({ ...prev, projectCardColor: next }));
              }}
            />

            <Box sx={{ pt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Primary влияет на кнопки и акценты везде (включая ProjectWorkspacePage). Цвет панелей влияет только на список проектов.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                onClick={() => {
                  const defPrimary = '#7C8CFF';
                  const defCard = '#14181C';
                  setPrimary(defPrimary);
                  applyPrimary(defPrimary);
                  setProjectsUi({ projectCardColor: defCard });
                }}
              >
                Сбросить
              </Button>

              <Button variant="contained" onClick={() => setThemePanelOpen(false)}>
                Готово
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Drawer>

      {/* Content + footer (full height column) */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Container sx={{ py: 3, flex: '1 0 auto' }}>
          {/* Brand header */}
          <Box sx={{ mb: 2.5 }}>
            <Typography
              variant="h3"
              sx={(theme) => ({
                fontWeight: 700,
                letterSpacing: '0.02em',
                lineHeight: 1.05,
                color: theme.palette.text.primary,
                textShadow: bg.enabled ? '0 1px 10px rgba(0,0,0,0.25)' : 'none',
              })}
            >
              Campaigner
            </Typography>
            <Typography
              variant="subtitle1"
              sx={(theme) => ({
                mt: 0.5,
                maxWidth: 720,
                color: theme.palette.text.secondary,
                textShadow: bg.enabled ? '0 1px 10px rgba(0,0,0,0.18)' : 'none',
              })}
            >
              Среда для создания интерактивных карт вашего мира
            </Typography>
          </Box>

          {/* Top row: title + actions */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h5">Проекты</Typography>

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

          <List sx={{ display: 'grid', gap: 1.25 }}>
            {projects.map((p) => (
              <ListItemButton
                key={p.id}
                onClick={() => nav(`/projects/${p.id}`)}
                sx={(theme) => ({
                  borderRadius: 2,
                  px: 2,
                  py: 1.5,
                  alignItems: 'stretch',
                  gap: 1.5,

                  // base color comes from user
                  background:
                    theme.palette.mode === 'dark'
                      ? `linear-gradient(135deg, ${cardBase}EE 0%, ${cardBase}D6 55%, ${cardBase}CC 100%)`
                      : `linear-gradient(135deg, ${cardBase}EE 0%, ${cardBase}D6 55%, ${cardBase}CC 100%)`,

                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.20)',
                  backdropFilter: 'blur(6px)',

                  transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',

                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 14px 40px rgba(0,0,0,0.28)',
                    borderColor: 'rgba(255,255,255,0.14)',
                  },

                  '&:active': {
                    transform: 'translateY(-1px)',
                  },
                })}
              >
                <ListItemText
                  primary={
                    <Typography
                      sx={{
                        fontFamily: '"IBM Plex Serif", ui-serif, Georgia, serif',
                        fontWeight: 700,
                        fontSize: '1.15rem',
                        lineHeight: 1.2,
                      }}
                    >
                      {p.name}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ mt: 0.35, display: 'flex', flexDirection: 'column', gap: 0.35 }}>
                      <Typography
                        component="div"
                        sx={{
                          fontSize: '0.9rem',
                          color: 'rgba(255,255,255,0.78)',
                        }}
                      >
                        <Box
                          component="span"
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            px: 1,
                            py: 0.25,
                            mr: 1,
                            borderRadius: 999,
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            letterSpacing: '0.02em',
                            color: 'rgba(255,255,255,0.9)',
                            background:
                              'linear-gradient(90deg, rgba(120,140,255,0.22) 0%, rgba(80,200,255,0.12) 100%)',
                            border: '1px solid rgba(255,255,255,0.10)',
                          }}
                        >
                          {SYSTEM_LABELS[p.system] || p.system}
                        </Box>

                        <Box component="span" sx={{ color: 'rgba(255,255,255,0.65)' }}>
                          {p.path}
                        </Box>
                      </Typography>
                    </Box>
                  }
                />

                <Tooltip title="Удалить проект">
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeletingProject(p);
                      setDeleteOpen(true);
                    }}
                    sx={{
                      alignSelf: 'center',
                      color: 'rgba(255,255,255,0.7)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      backgroundColor: 'rgba(0,0,0,0.15)',
                      '&:hover': {
                        color: 'rgba(255,255,255,0.9)',
                        backgroundColor: 'rgba(0,0,0,0.28)',
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </ListItemButton>
            ))}
          </List>

          {/* Create dialog */}
          <Dialog open={open} onClose={() => {
            setOpen(false);
            setName('');
            setRootPath('');
            setSystem('generic');
          }} fullWidth maxWidth="sm">
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
                  placeholder="C:\\Users\\You\\Documents\\DnDCampaigns"
                  value={rootPath}
                  onChange={(e) => setRootPath(e.target.value)}
                  margin="dense"
                />
                <Typography variant="caption" color="text.secondary">
                  Если путь не указан, проект будет создан в Documents\\CampaignerProjects.
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setOpen(false);
                setName('');
                setRootPath('');
                setSystem('generic');
              }}>Отмена</Button>
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

        {/* Footer (ProjectsPage only) */}
        <Box
          component="footer"
          sx={(theme) => ({
            flex: '0 0 auto',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            background:
              theme.palette.mode === 'dark'
                ? 'linear-gradient(180deg, rgba(10,12,16,0.0) 0%, rgba(10,12,16,0.55) 100%)'
                : 'linear-gradient(180deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.75) 100%)',
            backdropFilter: 'blur(8px)',
          })}
        >
          <Container
            sx={{
              py: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontFamily: '"IBM Plex Serif", ui-serif, Georgia, serif',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  lineHeight: 1.1,
                }}
              >
                Campaigner
              </Typography>

              <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Среда для создания интерактивных карт вашего мира
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  ·
                </Typography>

                <MUILink
                  href="https://github.com/adamnobody"
                  target="_blank"
                  rel="noreferrer"
                  underline="hover"
                  variant="caption"
                  sx={{ color: 'text.secondary' }}
                >
                  GitHub: @adamnobody
                </MUILink>
              </Box>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
              © {new Date().getFullYear()}
            </Typography>
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
