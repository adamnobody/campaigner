import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';

type PalettePreset = {
  key: string;
  name: string;
  background: string;
  accent: string;
  text: string;
};

export type CreateColorThemeValues = {
  name: string;
  background: string;
  accent: string;
  text: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (values: CreateColorThemeValues) => void;
  initialValues?: CreateColorThemeValues | null;
  mode?: 'create' | 'edit';
};

const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;

const CUSTOM_PALETTE_PRESETS: PalettePreset[] = [
  { key: 'violet', name: 'Royal Violet', background: '#0f1022', accent: '#8b5cf6', text: '#f6f4ff' },
  { key: 'emerald', name: 'Emerald Grove', background: '#0b1a16', accent: '#34d399', text: '#eefdf7' },
  { key: 'rose', name: 'Rose Ember', background: '#1b1116', accent: '#f472b6', text: '#fff1f8' },
  { key: 'amber', name: 'Amber Forge', background: '#1b140a', accent: '#f59e0b', text: '#fff7e8' },
  { key: 'slate', name: 'Slate Archive', background: '#111827', accent: '#60a5fa', text: '#f3f7ff' },
];

const normalizeHexColor = (value: string) => {
  const normalized = value.trim();
  if (!HEX_COLOR_REGEX.test(normalized)) return normalized;
  const raw = normalized.replace('#', '');
  if (raw.length === 3) {
    return `#${raw.split('').map((char) => `${char}${char}`).join('').toLowerCase()}`;
  }
  return `#${raw.toLowerCase()}`;
};

const parseHexToRgb = (hex: string): [number, number, number] | null => {
  const normalized = normalizeHexColor(hex);
  if (!HEX_COLOR_REGEX.test(normalized)) return null;
  const raw = normalized.replace('#', '');
  const red = Number.parseInt(raw.slice(0, 2), 16);
  const green = Number.parseInt(raw.slice(2, 4), 16);
  const blue = Number.parseInt(raw.slice(4, 6), 16);
  if ([red, green, blue].some((value) => Number.isNaN(value))) return null;
  return [red, green, blue];
};

const getRelativeLuminance = ([red, green, blue]: [number, number, number]) => {
  const transform = (channel: number) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * transform(red) + 0.7152 * transform(green) + 0.0722 * transform(blue);
};

const getContrastRatio = (leftHex: string, rightHex: string) => {
  const left = parseHexToRgb(leftHex);
  const right = parseHexToRgb(rightHex);
  if (!left || !right) return null;
  const leftLum = getRelativeLuminance(left);
  const rightLum = getRelativeLuminance(right);
  const lighter = Math.max(leftLum, rightLum);
  const darker = Math.min(leftLum, rightLum);
  return (lighter + 0.05) / (darker + 0.05);
};

const INITIAL_VALUES: CreateColorThemeValues = {
  name: '',
  background: '#0f172a',
  accent: '#4f46e5',
  text: '#f8fafc',
};

export const CreateColorThemeDialog: React.FC<Props> = ({
  open,
  onClose,
  onSave,
  initialValues,
  mode = 'create',
}) => {
  const theme = useTheme();
  const { t } = useTranslation(['appearance', 'common']);
  const [values, setValues] = React.useState<CreateColorThemeValues>(INITIAL_VALUES);

  React.useEffect(() => {
    if (open) {
      setValues(initialValues ?? INITIAL_VALUES);
      return;
    }
    if (!open) {
      setValues(INITIAL_VALUES);
    }
  }, [initialValues, open]);

  const normalizedBackground = normalizeHexColor(values.background);
  const normalizedAccent = normalizeHexColor(values.accent);
  const normalizedText = normalizeHexColor(values.text);
  const isNameValid = values.name.trim().length > 0;
  const hasValidHex =
    HEX_COLOR_REGEX.test(normalizedBackground) &&
    HEX_COLOR_REGEX.test(normalizedAccent) &&
    HEX_COLOR_REGEX.test(normalizedText);
  const contrast = getContrastRatio(normalizedBackground, normalizedText);
  const isLowContrast = contrast !== null && contrast < 4.5;

  const applyPreset = (preset: PalettePreset) => {
    const displayName = t(`appearance:createDialog.quickPresetNames.${preset.key}`);
    setValues((prev) => ({
      name: prev.name.trim() ? prev.name : displayName,
      background: preset.background,
      accent: preset.accent,
      text: preset.text,
    }));
  };

  const updateField = (field: keyof CreateColorThemeValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const save = () => {
    if (!isNameValid || !hasValidHex) return;
    onSave({
      name: values.name.trim(),
      background: normalizedBackground,
      accent: normalizedAccent,
      text: normalizedText,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 2.5,
          border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
          background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.92)}, ${alpha(theme.palette.background.default, 0.95)})`,
          boxShadow: `0 18px 40px ${alpha(theme.palette.common.black, 0.45)}`,
        },
      }}
    >
      <DialogTitle sx={{ px: 3, pt: 3, pb: 1.5 }}>
        <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: 'text.primary' }}>
          {mode === 'edit' ? t('appearance:createDialog.titleEdit') : t('appearance:createDialog.titleCreate')}
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: '0.86rem', color: 'text.secondary' }}>
          {t('appearance:createDialog.subtitle')}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ px: 3, pb: 2 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(280px, 0.92fr)' },
            gap: 2.5,
          }}
        >
          <Stack spacing={2.2}>
            <Box>
              <Typography sx={{ mb: 0.75, fontSize: '0.82rem', color: 'text.secondary', fontWeight: 600 }}>
                {t('appearance:createDialog.themeName')}
              </Typography>
              <TextField
                value={values.name}
                onChange={(event) => updateField('name', event.target.value)}
                fullWidth
                placeholder={t('appearance:createDialog.namePlaceholder')}
                error={!isNameValid && values.name.length > 0}
                helperText={!isNameValid && values.name.length > 0 ? t('appearance:createDialog.nameError') : ' '}
              />
            </Box>

            <Box>
              <Typography sx={{ mb: 1, fontSize: '0.82rem', color: 'text.secondary', fontWeight: 600 }}>
                {t('appearance:createDialog.quickPresets')}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {CUSTOM_PALETTE_PRESETS.map((preset) => (
                  <Chip
                    key={preset.key}
                    clickable
                    label={t(`appearance:createDialog.quickPresetNames.${preset.key}`).split(' ')[0]}
                    onClick={() => applyPreset(preset)}
                    sx={{
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      color: 'text.primary',
                      fontWeight: 600,
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1.4 }}>
              {[
                {
                  key: 'background' as const,
                  value: values.background,
                },
                {
                  key: 'accent' as const,
                  value: values.accent,
                },
                {
                  key: 'text' as const,
                  value: values.text,
                },
              ].map((item) => {
                const normalizedHex = normalizeHexColor(item.value);
                const isValid = HEX_COLOR_REGEX.test(normalizedHex);
                return (
                  <Box
                    key={item.key}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
                      backgroundColor: alpha(theme.palette.background.default, 0.46),
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.86rem' }}>{t(`appearance:createDialog.fields.${item.key}.title`)}</Typography>
                      <Box
                        sx={{
                          width: 22,
                          height: 22,
                          borderRadius: 999,
                          border: `1px solid ${alpha(theme.palette.common.white, 0.3)}`,
                          backgroundColor: isValid ? normalizedHex : '#000000',
                        }}
                      />
                    </Box>
                    <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary', mb: 1.1 }}>
                      {t(`appearance:createDialog.fields.${item.key}.description`)}
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 1 }}>
                      <TextField
                        size="small"
                        value={item.value}
                        onChange={(event) => updateField(item.key as keyof CreateColorThemeValues, event.target.value)}
                        placeholder={t('appearance:createDialog.hexPlaceholder')}
                        error={!isValid}
                        helperText={!isValid ? t('appearance:createDialog.invalidHex') : ' '}
                      />
                      <TextField
                        type="color"
                        size="small"
                        value={isValid ? normalizedHex : '#000000'}
                        onChange={(event) => updateField(item.key as keyof CreateColorThemeValues, event.target.value)}
                        sx={{ width: 62 }}
                      />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Stack>

          <Stack spacing={1.4}>
            <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', fontWeight: 600 }}>
              {t('appearance:createDialog.livePreview')}
            </Typography>
            <Box
              sx={{
                borderRadius: 2.5,
                p: 2,
                border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
                background: normalizedBackground,
                color: normalizedText,
                boxShadow: `0 14px 24px ${alpha(theme.palette.common.black, 0.35)}`,
              }}
            >
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: normalizedText }}>
                {values.name.trim() || t('appearance:createDialog.newThemeFallback')}
              </Typography>
              <Typography sx={{ mt: 0.75, color: alpha(normalizedText, 0.84), fontSize: '0.82rem' }}>
                {t('appearance:createDialog.previewCardLine')}
              </Typography>
              <Box
                sx={{
                  mt: 1.6,
                  p: 1.5,
                  borderRadius: 1.8,
                  backgroundColor: alpha(normalizedText, 0.06),
                  border: `1px solid ${alpha(normalizedAccent, 0.35)}`,
                }}
              >
                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: normalizedText }}>
                  {t('appearance:createDialog.previewProjectCard')}
                </Typography>
                <Typography sx={{ mt: 0.5, fontSize: '0.78rem', color: alpha(normalizedText, 0.8) }}>
                  {t('appearance:createDialog.previewProjectDesc')}
                </Typography>
                <Box sx={{ mt: 1.3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      px: 1.2,
                      py: 0.55,
                      borderRadius: 1.4,
                      backgroundColor: normalizedAccent,
                      color: normalizedText,
                      fontSize: '0.74rem',
                      fontWeight: 700,
                    }}
                  >
                    {t('appearance:createDialog.primaryButton')}
                  </Box>
                  <Chip
                    size="small"
                    label={t('appearance:createDialog.badgeSample')}
                    sx={{
                      border: `1px solid ${alpha(normalizedAccent, 0.5)}`,
                      backgroundColor: alpha(normalizedAccent, 0.16),
                      color: normalizedText,
                    }}
                  />
                </Box>
              </Box>
            </Box>
            {isLowContrast && (
              <Alert
                severity="warning"
                sx={{
                  borderRadius: 1.8,
                  backgroundColor: alpha(theme.palette.warning.main, 0.12),
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.32)}`,
                }}
              >
                {t('appearance:createDialog.lowContrast')}
              </Alert>
            )}
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 0.5, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          sx={{
            borderColor: alpha(theme.palette.common.white, 0.2),
            color: 'text.secondary',
            '&:hover': {
              borderColor: alpha(theme.palette.common.white, 0.34),
              backgroundColor: alpha(theme.palette.common.white, 0.04),
            },
          }}
        >
          {t('common:cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={save}
          disabled={!isNameValid || !hasValidHex}
          sx={{
            boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.34)}`,
            '&:hover': {
              boxShadow: `0 10px 24px ${alpha(theme.palette.primary.main, 0.42)}`,
            },
          }}
        >
          {mode === 'edit' ? t('appearance:createDialog.saveEdit') : t('appearance:createDialog.saveCreate')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
