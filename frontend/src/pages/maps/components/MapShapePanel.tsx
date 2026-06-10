import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
  ToggleButton,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import CategoryIcon from '@mui/icons-material/Category';
import Crop75Icon from '@mui/icons-material/Crop75';
import PanoramaFishEyeIcon from '@mui/icons-material/PanoramaFishEye';
import ChangeHistoryIcon from '@mui/icons-material/ChangeHistory';
import DiamondIcon from '@mui/icons-material/Diamond';
import TimelineIcon from '@mui/icons-material/Timeline';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import { useTranslation } from 'react-i18next';
import type { CanvasObject } from '@/api/canvas';
import {
  applyShapeFormToObject,
  shapeFormFromObject,
  type ShapeLabelPosition,
  type ShapeObjectFormState,
  type ShapeVariant,
} from '../canvas/shapeObjectForm';
import { objectToUpsert, hexToRgb, sxDivider, sxPanelRoot, sxSectionLabel } from '../canvas/canvasModel';

type Props = {
  selectedObject: CanvasObject;
  onClose: () => void;
  onSave: (object: CanvasObject) => void;
  onDelete: () => void;
};

const normalizeColorPickerValue = (value: string): string => {
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [r, g, b] = trimmed.slice(1);
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return '#5a7a9a';
};

const VARIANT_ICONS: Record<ShapeVariant, React.ReactNode> = {
  rectangle: <Crop75Icon fontSize="small" />,
  ellipse: <PanoramaFishEyeIcon fontSize="small" />,
  triangle: <ChangeHistoryIcon fontSize="small" />,
  diamond: <DiamondIcon fontSize="small" />,
  line: <TimelineIcon fontSize="small" />,
};

const VARIANTS: ShapeVariant[] = ['rectangle', 'ellipse', 'triangle', 'diamond', 'line'];
const LABEL_POSITIONS: ShapeLabelPosition[] = ['none', 'inside', 'above', 'below'];

export const MapShapePanel: React.FC<Props> = ({
  selectedObject,
  onClose,
  onSave,
  onDelete,
}) => {
  const theme = useTheme();
  const { t } = useTranslation(['map', 'common']);
  const [form, setForm] = useState<ShapeObjectFormState>(() => shapeFormFromObject(selectedObject));
  const skipInitialSaveRef = useRef(true);

  useEffect(() => {
    setForm(shapeFormFromObject(selectedObject));
    skipInitialSaveRef.current = true;
  }, [selectedObject]);

  const payload = useMemo(
    () => applyShapeFormToObject(selectedObject, form),
    [selectedObject, form],
  );

  useEffect(() => {
    if (skipInitialSaveRef.current) {
      skipInitialSaveRef.current = false;
      return;
    }
    const currentUpsert = JSON.stringify(objectToUpsert(selectedObject));
    const nextUpsert = JSON.stringify(objectToUpsert(payload));
    if (currentUpsert === nextUpsert) return;
    onSave(payload);
  }, [payload, onSave, selectedObject]);

  const updateForm = (patch: Partial<ShapeObjectFormState>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  return (
    <Box sx={{ ...sxPanelRoot(theme), backgroundColor: alpha(theme.palette.background.paper, 0.95), backdropFilter: 'blur(20px)' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{
          width: 40,
          height: 40,
          borderRadius: '8px',
          backgroundColor: `rgba(${hexToRgb(form.fill)}, 0.35)`,
          border: `2px solid ${form.stroke}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: form.stroke,
        }}>
          {VARIANT_ICONS[form.variant]}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {t('map:shapePanel.title')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t(`map:shapePanel.variants.${form.variant}`)}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }} aria-label={t('common:close')}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Typography variant="caption" sx={sxSectionLabel(theme)}>{t('map:shapePanel.sectionShape')}</Typography>
        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1, mb: 1.5 }}>
          {VARIANTS.map((variant) => (
            <ToggleButton
              key={variant}
              value={variant}
              selected={form.variant === variant}
              onChange={() => updateForm({ variant })}
              size="small"
              sx={{ px: 1, py: 0.5, textTransform: 'none', gap: 0.5 }}
            >
              {VARIANT_ICONS[variant]}
              <Typography variant="caption" fontWeight={600}>
                {t(`map:shapePanel.variants.${variant}`)}
              </Typography>
            </ToggleButton>
          ))}
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
          <TextField
            size="small"
            type="number"
            label={t('map:shapePanel.width')}
            value={Math.round(form.width)}
            onChange={(event) => updateForm({ width: Math.max(1, Number(event.target.value) || 1) })}
            fullWidth
            inputProps={{ min: 1, step: 1 }}
          />
          <TextField
            size="small"
            type="number"
            label={t('map:shapePanel.height')}
            value={Math.round(form.height)}
            onChange={(event) => updateForm({ height: Math.max(1, Number(event.target.value) || 1) })}
            fullWidth
            inputProps={{ min: 1, step: 1 }}
            disabled={form.variant === 'line'}
          />
        </Stack>

        <Divider sx={sxDivider(theme)} />

        <Typography variant="caption" sx={sxSectionLabel(theme)}>{t('map:shapePanel.sectionStyle')}</Typography>
        <Stack spacing={1.5} sx={{ mt: 1, mb: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              type="color"
              label={t('map:shapePanel.fill')}
              value={normalizeColorPickerValue(form.fill)}
              onChange={(event) => updateForm({ fill: event.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 120 }}
            />
            <TextField
              size="small"
              label={t('map:shapePanel.fillHex')}
              value={form.fill}
              onChange={(event) => updateForm({ fill: event.target.value })}
              fullWidth
            />
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              type="color"
              label={t('map:shapePanel.stroke')}
              value={normalizeColorPickerValue(form.stroke)}
              onChange={(event) => updateForm({ stroke: event.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 120 }}
            />
            <TextField
              size="small"
              label={t('map:shapePanel.strokeHex')}
              value={form.stroke}
              onChange={(event) => updateForm({ stroke: event.target.value })}
              fullWidth
            />
          </Stack>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {t('map:shapePanel.strokeWidth', { value: form.strokeWidth })}
            </Typography>
            <Slider
              size="small"
              min={0}
              max={12}
              step={1}
              value={form.strokeWidth}
              onChange={(_, value) => updateForm({ strokeWidth: value as number })}
            />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {t('map:shapePanel.opacity', { value: Math.round(form.opacity * 100) })}
            </Typography>
            <Slider
              size="small"
              min={0}
              max={1}
              step={0.05}
              value={form.opacity}
              onChange={(_, value) => updateForm({ opacity: value as number })}
            />
          </Box>
        </Stack>

        <Divider sx={sxDivider(theme)} />

        <Typography variant="caption" sx={sxSectionLabel(theme)}>{t('map:shapePanel.sectionText')}</Typography>
        <Stack spacing={1.5} sx={{ mt: 1, mb: 1.5 }}>
          <FormControl size="small" fullWidth>
            <InputLabel id="shape-label-position">{t('map:shapePanel.labelPosition')}</InputLabel>
            <Select
              labelId="shape-label-position"
              label={t('map:shapePanel.labelPosition')}
              value={form.labelPosition}
              onChange={(event) => updateForm({ labelPosition: event.target.value as ShapeLabelPosition })}
            >
              {LABEL_POSITIONS.map((position) => (
                <MenuItem key={position} value={position}>
                  {t(`map:shapePanel.labelPositions.${position}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            label={t('map:shapePanel.labelText')}
            value={form.labelText}
            onChange={(event) => updateForm({ labelText: event.target.value })}
            disabled={form.labelPosition === 'none'}
            fullWidth
            multiline
            minRows={1}
            maxRows={3}
          />
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              type="number"
              label={t('map:shapePanel.labelFontSize')}
              value={form.labelFontSize}
              onChange={(event) => updateForm({ labelFontSize: Math.max(8, Number(event.target.value) || 8) })}
              disabled={form.labelPosition === 'none'}
              sx={{ width: 120 }}
              inputProps={{ min: 8, max: 96, step: 1 }}
            />
            <TextField
              size="small"
              type="color"
              label={t('map:shapePanel.labelColor')}
              value={normalizeColorPickerValue(form.labelColor)}
              onChange={(event) => updateForm({ labelColor: event.target.value })}
              disabled={form.labelPosition === 'none'}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 120 }}
            />
            <ToggleButton
              value="bold"
              selected={form.labelFontWeight === 'bold'}
              onChange={() => updateForm({
                labelFontWeight: form.labelFontWeight === 'bold' ? 'normal' : 'bold',
              })}
              disabled={form.labelPosition === 'none'}
              aria-label={t('map:shapePanel.labelBold')}
              sx={{ px: 1.25 }}
            >
              <FormatBoldIcon fontSize="small" />
            </ToggleButton>
          </Stack>
        </Stack>

        <Divider sx={sxDivider(theme)} />

        <Typography variant="caption" sx={sxSectionLabel(theme)}>{t('map:shapePanel.sectionPosition')}</Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <TextField
            size="small"
            type="number"
            label="X"
            value={Math.round(form.x)}
            onChange={(event) => updateForm({ x: Number(event.target.value) || 0 })}
            fullWidth
          />
          <TextField
            size="small"
            type="number"
            label="Y"
            value={Math.round(form.y)}
            onChange={(event) => updateForm({ y: Number(event.target.value) || 0 })}
            fullWidth
          />
        </Stack>
      </Box>

      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button
          color="error"
          variant="outlined"
          size="small"
          startIcon={<DeleteIcon />}
          onClick={onDelete}
          fullWidth
        >
          {t('common:delete')}
        </Button>
      </Box>
    </Box>
  );
};
