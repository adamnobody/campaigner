import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  alpha,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import UploadIcon from '@mui/icons-material/Upload';
import ViewSidebarIcon from '@mui/icons-material/ViewSidebar';
import AppsIcon from '@mui/icons-material/Apps';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PaletteIcon from '@mui/icons-material/Palette';
import { DndButton } from '@/components/ui/DndButton';
import { TabFade } from '@/components/ui/MotionSwitch';
import { THEME_PRESETS, type ThemePresetDefinition } from '@/theme/presets';
import { usePreferencesStore, type CustomColorThemePreset } from '@/store/usePreferencesStore';
import {
  CreateColorThemeDialog,
  type CreateColorThemeValues,
} from '@/pages/appearance/components/CreateColorThemeDialog';
import { buildCustomColorTheme } from '@/pages/appearance/paletteHelpers';

export interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: CreateProjectWizardValue) => Promise<void>;
}

export interface CreateProjectWizardValue {
  name: string;
  description: string;
  coverFile: File | null;
  themePreset: string;
}

const BUILTIN_PALETTES = Object.values(THEME_PRESETS);

export const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({ open, onClose, onSubmit }) => {
  const theme = useTheme();
  const { t } = useTranslation(['projects', 'common']);
  const { themePreset, customColorThemes, setThemePreset, addCustomColorTheme } = usePreferencesStore((state) => ({
    themePreset: state.themePreset,
    customColorThemes: state.customColorThemes,
    setThemePreset: state.setThemePreset,
    addCustomColorTheme: state.addCustomColorTheme,
  }));
  const [step, setStep] = useState(0);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>();
  const [selectedTheme, setSelectedTheme] = useState(themePreset);
  const [pendingCustomPalette, setPendingCustomPalette] = useState<CustomColorThemePreset | null>(null);
  const [customPaletteOpen, setCustomPaletteOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const palettes = React.useMemo<ThemePresetDefinition[]>(
    () => [...BUILTIN_PALETTES, ...customColorThemes, ...(pendingCustomPalette ? [pendingCustomPalette] : [])],
    [customColorThemes, pendingCustomPalette],
  );
  const currentPalette = palettes.find((palette) => palette.id === selectedTheme) ?? palettes[0];

  React.useEffect(() => {
    if (!open) return;
    setStep(0);
    setNewName('');
    setNewDescription('');
    setCoverFile(null);
    setCoverPreview(undefined);
    setSelectedTheme(themePreset);
    setPendingCustomPalette(null);
  }, [open, themePreset]);

  React.useEffect(() => () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
  }, [coverPreview]);

  const handleCover = (file: File | undefined) => {
    if (!file) return;
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleClose = () => {
    if (!creating) onClose();
  };

  const handleFinish = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await onSubmit({
        name: newName.trim(),
        description: newDescription.trim(),
        coverFile,
        themePreset: selectedTheme,
      });
      if (pendingCustomPalette && selectedTheme === pendingCustomPalette.id) {
        addCustomColorTheme(pendingCustomPalette);
      } else {
        setThemePreset(selectedTheme);
      }
    } finally {
      setCreating(false);
    }
  };

  const saveCustomPalette = (values: CreateColorThemeValues) => {
    const palette = buildCustomColorTheme(values, `custom-${crypto.randomUUID()}`);
    setPendingCustomPalette(palette);
    setSelectedTheme(palette.id);
    setCustomPaletteOpen(false);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          style: {
            background: '#0e1116',
            backgroundColor: '#0e1116',
            backgroundImage: 'none',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            opacity: 1,
          },
          sx: {
            overflow: 'hidden',
            position: 'relative',
            background: '#0e1116 !important',
            backgroundColor: '#0e1116 !important',
            backgroundImage: 'none !important',
            backdropFilter: 'none !important',
            WebkitBackdropFilter: 'none !important',
            opacity: 1,
            isolation: 'isolate',
          },
        }}
        slotProps={{
          backdrop: {
            style: {
              backgroundColor: 'rgba(5,6,9,.96)',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
            },
            sx: {
              backgroundColor: 'rgba(5,6,9,.92)',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
            },
          },
        }}
      >
        <Box aria-hidden sx={{ position: 'absolute', inset: 0, zIndex: 0, backgroundColor: '#0e1116', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', zIndex: 1, inset: '0 0 auto', height: 1, background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.58)}, transparent)` }} />
        <Box sx={{ position: 'relative', zIndex: 1, backgroundColor: '#0e1116', px: { xs: 2.5, md: 4.25 }, pt: 3.5, pb: 2.5, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography variant="overline" sx={{ color: 'primary.main' }}>
              {step === 0 ? t('projects:createDialog.steps.library') : t('projects:createDialog.steps.appearance', { current: step, total: 2 })}
            </Typography>
            <Typography variant="h4" sx={{ pt: 0.8, fontSize: { xs: '1.75rem', md: '2rem' } }}>
              {step === 0 ? t('projects:createDialog.title') : step === 1 ? t('projects:createDialog.navigation.title') : t('projects:createDialog.palette.title')}
            </Typography>
            {step > 0 ? (
              <Typography sx={{ pt: 1, color: 'text.secondary', fontSize: 13.5, lineHeight: 1.7, maxWidth: 560 }}>
                {step === 1 ? t('projects:createDialog.navigation.description') : t('projects:createDialog.palette.description')}
              </Typography>
            ) : null}
          </Box>
          <IconButton onClick={handleClose} disabled={creating} aria-label={t('common:close')}><CloseIcon fontSize="small" /></IconButton>
        </Box>

        <DialogContent sx={{ position: 'relative', zIndex: 1, backgroundColor: '#0e1116', px: { xs: 2.5, md: 4.25 }, py: 0 }}>
          <TabFade tab={String(step)}>
          {step === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
              <Box>
                <Typography variant="overline" sx={{ color: 'text.secondary' }}>{t('projects:createDialog.fields.nameLabel')}</Typography>
                <TextField autoFocus fullWidth value={newName} onChange={(event) => setNewName(event.target.value)} placeholder={t('projects:createDialog.fields.namePlaceholder')} sx={{ mt: 0.75 }} />
              </Box>
              <Box>
                <Typography variant="overline" sx={{ color: 'text.secondary' }}>{t('projects:createDialog.fields.descriptionLabel')}</Typography>
                <TextField fullWidth multiline rows={3} value={newDescription} onChange={(event) => setNewDescription(event.target.value)} placeholder={t('projects:createDialog.fields.descriptionPlaceholder')} sx={{ mt: 0.75 }} />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, pb: 0.75 }}>
                  <Typography variant="overline" sx={{ color: 'text.secondary' }}>{t('projects:createDialog.cover.title')}</Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: 11.5 }}>{t('projects:createDialog.cover.optional')}</Typography>
                </Box>
                <Box component="label" sx={{ display: 'flex', alignItems: 'center', gap: 1.75, p: 1.5, borderRadius: '12px', border: `1px dashed ${alpha(theme.palette.primary.main, 0.35)}`, backgroundColor: alpha(theme.palette.primary.main, 0.035), cursor: 'pointer' }}>
                  <Box sx={{ width: 58, height: 72, borderRadius: '29px 29px 8px 8px', border: '1px solid rgba(255,255,255,.1)', overflow: 'hidden', display: 'grid', placeItems: 'center', background: coverPreview ? `url(${coverPreview}) center/cover` : 'rgba(255,255,255,.025)', flexShrink: 0 }}>
                    {!coverPreview ? <PaletteIcon sx={{ color: 'text.secondary', fontSize: 19 }} /> : null}
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontSize: 13 }}>{coverFile?.name ?? t('projects:createDialog.cover.pick')}</Typography>
                    <Typography sx={{ pt: 0.4, color: 'text.secondary', fontSize: 11.5 }}>{t('projects:createDialog.cover.hint')}</Typography>
                  </Box>
                  <Button component="span" variant="outlined" startIcon={<UploadIcon />} size="small">{t('projects:createDialog.cover.button')}</Button>
                  <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => handleCover(event.target.files?.[0])} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.25, p: 1.75, border: '1px solid rgba(255,255,255,.07)', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,.015)' }}>
                <AutoAwesomeIcon sx={{ color: 'primary.main', fontSize: 18, mt: 0.2 }} />
                <Typography sx={{ color: 'text.secondary', fontSize: 12.5, lineHeight: 1.65 }}><strong>{t('projects:createDialog.tipPrefix')}</strong> {t('projects:createDialog.tipText')}</Typography>
              </Box>
            </Box>
          ) : null}

          {step === 1 ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.25 }}>
              <Box sx={{ p: 2.25, borderRadius: '16px', border: `1px solid ${theme.palette.primary.main}`, backgroundColor: alpha(theme.palette.primary.main, 0.065) }}>
                <Box sx={{ height: 158, borderRadius: '11px', border: '1px solid rgba(255,255,255,.07)', backgroundColor: '#0a0c10', overflow: 'hidden', display: 'flex', mb: 2 }}>
                  <Box sx={{ width: 78, borderRight: '1px solid rgba(255,255,255,.07)', p: 1.25 }}><Box sx={{ height: 9, bgcolor: alpha(theme.palette.primary.main, 0.35), borderRadius: 1 }} /></Box>
                  <Box sx={{ flex: 1, p: 1.5 }}><Box sx={{ width: '55%', height: 13, bgcolor: 'rgba(232,228,220,.35)', borderRadius: 1, mb: 1.5 }} /><Box sx={{ height: 5, bgcolor: 'rgba(255,255,255,.08)', borderRadius: 1, mb: 0.75 }} /><Box sx={{ height: 5, width: '70%', bgcolor: 'rgba(255,255,255,.08)', borderRadius: 1 }} /></Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}><CheckCircleIcon sx={{ color: 'primary.main', fontSize: 20 }} /><Box><Typography variant="h6">{t('projects:createDialog.navigation.sidebar')}</Typography><Typography sx={{ color: 'text.secondary', fontSize: 12.5, lineHeight: 1.65, pt: 0.75 }}>{t('projects:createDialog.navigation.sidebarDescription')}</Typography></Box></Box>
              </Box>
              <Box aria-disabled sx={{ p: 2.25, borderRadius: '16px', border: '1px solid rgba(255,255,255,.07)', backgroundColor: 'rgba(255,255,255,.012)', opacity: 0.48, position: 'relative' }}>
                <Typography variant="overline" sx={{ position: 'absolute', top: 12, right: 14, color: 'primary.main' }}>{t('projects:createDialog.navigation.soon')}</Typography>
                <Box sx={{ height: 158, borderRadius: '11px', border: '1px solid rgba(255,255,255,.07)', backgroundColor: '#0a0c10', display: 'grid', placeItems: 'center', mb: 2 }}><Box sx={{ display: 'flex', gap: 0.5, p: 0.75, border: '1px solid rgba(255,255,255,.1)', borderRadius: 2 }}>{Array.from({ length: 5 }).map((_, index) => <Box key={index} sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: index === 4 ? 'primary.main' : 'rgba(255,255,255,.1)' }} />)}</Box></Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}><AppsIcon sx={{ fontSize: 20 }} /><Box><Typography variant="h6">{t('projects:createDialog.navigation.island')}</Typography><Typography sx={{ color: 'text.secondary', fontSize: 12.5, lineHeight: 1.65, pt: 0.75 }}>{t('projects:createDialog.navigation.islandDescription')}</Typography></Box></Box>
              </Box>
            </Box>
          ) : null}

          {step === 2 ? (
            <Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))', md: 'repeat(5, minmax(0,1fr))' }, gap: 1.5 }}>
                {palettes.map((palette) => {
                  const selected = palette.id === selectedTheme;
                  return (
                    <Box component="button" type="button" key={palette.id} onClick={() => setSelectedTheme(palette.id)} sx={{ appearance: 'none', p: 0, overflow: 'hidden', borderRadius: '12px', border: `1px solid ${selected ? palette.accentMain : 'rgba(255,255,255,.07)'}`, background: selected ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.015)', color: 'inherit', cursor: 'pointer' }}>
                      <Box sx={{ height: 62, display: 'grid', placeItems: 'center', background: `linear-gradient(150deg, ${palette.background}, ${palette.accentSoft})`, borderBottom: `2px solid ${palette.accentMain}` }}>{selected ? <CheckCircleIcon sx={{ color: palette.textPrimary }} /> : null}</Box>
                      <Typography sx={{ minHeight: 42, display: 'grid', placeItems: 'center', px: 1, fontFamily: theme.campaigner.typography.display, fontWeight: 600, fontSize: 13 }}>{palette.label}</Typography>
                    </Box>
                  );
                })}
                <Box component="button" type="button" onClick={() => setCustomPaletteOpen(true)} sx={{ minHeight: 106, borderRadius: '12px', border: `1px dashed ${alpha(theme.palette.primary.main, 0.4)}`, bgcolor: alpha(theme.palette.primary.main, 0.04), color: 'primary.main', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Box><AddIcon /><Typography sx={{ fontSize: 11.5 }}>{t('projects:createDialog.palette.add')}</Typography></Box></Box>
              </Box>
              <Box sx={{ mt: 2.5, p: 1.75, borderRadius: '12px', border: '1px solid rgba(255,255,255,.07)', backgroundColor: 'rgba(255,255,255,.015)', display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography variant="overline" sx={{ color: 'text.secondary' }}>{t('projects:createDialog.palette.preview')}</Typography>
                <Box sx={{ px: 1.5, height: 28, display: 'flex', alignItems: 'center', gap: 0.75, borderRadius: '8px', color: currentPalette.accentMain, border: `1px solid ${alpha(currentPalette.accentMain, 0.3)}`, backgroundColor: alpha(currentPalette.accentMain, 0.08) }}><Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: currentPalette.accentMain }} />{t('projects:defaultMainBranchName')}</Box>
                <Box sx={{ px: 1.5, height: 28, display: 'flex', alignItems: 'center', borderRadius: '8px', bgcolor: currentPalette.accentMain, color: '#12140f', fontSize: 11.5 }}>{t('projects:createDialog.palette.previewButton')}</Box>
                <Typography sx={{ ml: 'auto', color: 'text.secondary', fontSize: 11.5 }}>{currentPalette.label}</Typography>
              </Box>
            </Box>
          ) : null}
          </TabFade>
        </DialogContent>

        <DialogActions sx={{ position: 'relative', zIndex: 1, backgroundColor: '#0e1116', mt: 0, px: { xs: 2.5, md: 4.25 }, py: 2.5, borderTop: '1px solid rgba(255,255,255,.07)', justifyContent: 'space-between' }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 11.5, display: { xs: 'none', md: 'block' } }}>
            {step === 0 ? t('projects:createDialog.storageHint') : step === 1 ? t('projects:createDialog.navigation.fixedHint') : t('projects:createDialog.palette.fixedHint', { name: currentPalette.label })}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
            {step > 0 ? <Button startIcon={<ArrowBackIcon />} onClick={() => setStep((value) => value - 1)} disabled={creating}>{t('common:back')}</Button> : <Button onClick={handleClose} disabled={creating}>{t('common:cancel')}</Button>}
            {step < 2 ? <DndButton variant="contained" endIcon={<ArrowForwardIcon />} onClick={() => setStep((value) => value + 1)} disabled={!newName.trim()}>{t('common:continue')}</DndButton> : <DndButton variant="contained" loading={creating} onClick={handleFinish}>{creating ? t('projects:createDialog.creating') : t('projects:createDialog.submit')}</DndButton>}
          </Box>
        </DialogActions>
      </Dialog>
      <CreateColorThemeDialog open={customPaletteOpen} onClose={() => setCustomPaletteOpen(false)} onSave={saveCustomPalette} />
    </>
  );
};