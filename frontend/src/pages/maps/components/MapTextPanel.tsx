import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';

import {

  Box,

  Typography,

  Button,

  Divider,

  IconButton,

  TextField,

  Slider,

  useTheme,

  alpha,

} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';

import CloseIcon from '@mui/icons-material/Close';

import TextFieldsIcon from '@mui/icons-material/TextFields';

import GestureIcon from '@mui/icons-material/Gesture';

import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';

import type { CanvasObject } from '@/api/canvas';

import {

  applyTextFormToObject,

  convertTextToCurveText,

  textFormFromObject,

  type TextObjectFormState,

} from '../canvas/textObjectForm';

import { canEditCurveTextBezierHandles, hasCurveTextPointPath } from '../canvas/curveTextHandles';

import {

  buildStandardTextPreset,

  STANDARD_TEXT_PRESET_ID,

  createTextPresetId,

  isUserTextPreset,

  listTextPresetsWithStandard,

  matchTextStylePreset,

  removeTextPreset,

  saveTextPresets,

  saveActiveTextPresetId,

  upsertTextPreset,

  type MapTextStylePreset,

} from '../canvas/textPresets';

import { MapTextPresetPicker } from './MapTextPresetPicker';

import { objectToUpsert, sxDivider, sxPanelRoot, sxSectionLabel } from '../canvas/canvasModel';



type Props = {

  projectId: number;

  selectedObject: CanvasObject;

  presets: MapTextStylePreset[];

  onPresetsChange: (presets: MapTextStylePreset[]) => void;

  onActivePresetChange: (presetId: string | null) => void;

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

  return '#f8d7a4';

};



export const MapTextPanel: React.FC<Props> = ({

  projectId,

  selectedObject,

  presets,

  onPresetsChange,

  onActivePresetChange,

  onClose,

  onSave,

  onDelete,

}) => {

  const theme = useTheme();

  const { t } = useTranslation(['map', 'common']);

  const isCurveText = selectedObject.kind === 'curve_text';

  const showCurveHandlesHint = isCurveText

    && (canEditCurveTextBezierHandles(selectedObject) || hasCurveTextPointPath(selectedObject));

  const [form, setForm] = useState<TextObjectFormState>(() => textFormFromObject(selectedObject));

  const [presetName, setPresetName] = useState('');

  const skipInitialSaveRef = useRef(true);



  useEffect(() => {

    setForm(textFormFromObject(selectedObject));

    skipInitialSaveRef.current = true;

  }, [selectedObject]);



  const payload = useMemo(

    () => applyTextFormToObject(selectedObject, form),

    [selectedObject, form],

  );

  const standardPreset = useMemo(

    () => buildStandardTextPreset(t('map:textPanel.presetStandard')),

    [t],

  );

  const matchedPreset = useMemo(

    () => matchTextStylePreset(presets, {

      fontSize: form.fontSize,

      fill: form.fill,

      opacity: form.opacity,

    }, standardPreset),

    [presets, form.fontSize, form.fill, form.opacity, standardPreset],

  );

  const matchedPresetId = matchedPreset?.id ?? null;



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



  const updateForm = (patch: Partial<TextObjectFormState>) => {

    setForm((current) => ({ ...current, ...patch }));

  };



  const handleConvertToCurveText = () => {

    onSave(convertTextToCurveText(selectedObject));

  };



  const applyPreset = (presetId: string) => {

    onActivePresetChange(presetId);

    saveActiveTextPresetId(projectId, presetId);

    const preset = listTextPresetsWithStandard(presets, t('map:textPanel.presetStandard'))

      .find((item) => item.id === presetId);

    if (!preset) return;

    updateForm({

      fontSize: preset.fontSize,

      fill: preset.fill,

      opacity: preset.opacity,

    });

  };



  const handleSavePreset = () => {

    const trimmed = presetName.trim() || t('map:textPanel.presetDefaultName', { index: presets.length + 1 });

    const preset: MapTextStylePreset = {

      id: createTextPresetId(),

      name: trimmed,

      fontSize: form.fontSize,

      fill: form.fill,

      opacity: form.opacity,

    };

    const next = upsertTextPreset(presets, preset);

    onPresetsChange(next);

    saveTextPresets(projectId, next);

    onActivePresetChange(preset.id);

    saveActiveTextPresetId(projectId, preset.id);

    setPresetName('');

  };



  const handleDeletePreset = () => {

    if (!isUserTextPreset(matchedPresetId)) return;

    const next = removeTextPreset(presets, matchedPresetId!);

    onPresetsChange(next);

    saveTextPresets(projectId, next);

    onActivePresetChange(STANDARD_TEXT_PRESET_ID);

    saveActiveTextPresetId(projectId, STANDARD_TEXT_PRESET_ID);

  };



  return (

    <Box sx={{

      ...sxPanelRoot(theme),

      backgroundColor: alpha(theme.palette.background.default, 0.94),

      backdropFilter: 'blur(20px)',

      borderColor: theme.campaigner.surface.border,

      overflow: 'hidden',

    }}

    >

      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: `1px solid ${theme.campaigner.surface.border}` }}>

        <Box sx={{

          width: 40,

          height: 40,

          borderRadius: '8px',

          backgroundColor: alpha(form.fill, 0.2),

          border: `2px solid ${form.fill}`,

          display: 'flex',

          alignItems: 'center',

          justifyContent: 'center',

          flexShrink: 0,

        }}

        >

          <TextFieldsIcon sx={{ fontSize: 20, color: form.fill }} />

        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>

          <Typography variant="h6" sx={{ color: 'text.primary', fontSize: '1.05rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>

            {isCurveText ? t('map:textPanel.titleCurve') : t('map:textPanel.titleText')}

          </Typography>

        </Box>

        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }} aria-label={t('common:close')}>

          <CloseIcon fontSize="small" />

        </IconButton>

      </Box>



      <Box sx={{

        flex: 1,

        overflowY: 'auto',

        overflowX: 'hidden',

        p: 2,

        display: 'flex',

        flexDirection: 'column',

        gap: 2,

        minWidth: 0,

      }}

      >

        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>

          {t('map:textPanel.inlineEditHint')}

        </Typography>



        {showCurveHandlesHint && (

          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>

            {hasCurveTextPointPath(selectedObject)

              ? t('map:textPanel.pointPathHint')

              : t('map:textPanel.curveHandlesHint')}

          </Typography>

        )}



        <Divider sx={sxDivider(theme)} />



        <Box sx={{ minWidth: 0 }}>

          <Typography variant="caption" sx={sxSectionLabel(theme)}>{t('map:textPanel.sectionPresets')}</Typography>

          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>

            <MapTextPresetPicker

              userPresets={presets}

              selectedPresetId={matchedPresetId}

              onSelectPreset={applyPreset}

            />

            <TextField

              size="small"

              fullWidth

              label={t('map:textPanel.presetName')}

              value={presetName}

              onChange={(event) => setPresetName(event.target.value)}

              placeholder={t('map:textPanel.presetNamePlaceholder')}

            />

            <Box sx={{ display: 'flex', gap: 1, minWidth: 0 }}>

              <Button

                size="small"

                variant="outlined"

                startIcon={<BookmarkAddIcon />}

                onClick={handleSavePreset}

                sx={{ flex: 1, minWidth: 0 }}

              >

                {t('map:textPanel.savePreset')}

              </Button>

              <Button

                size="small"

                color="error"

                variant="outlined"

                disabled={!isUserTextPreset(matchedPresetId)}

                onClick={handleDeletePreset}

                sx={{ flexShrink: 0 }}

              >

                {t('map:textPanel.deletePreset')}

              </Button>

            </Box>

          </Box>

        </Box>



        <Divider sx={sxDivider(theme)} />



        <Box sx={{ minWidth: 0 }}>

          <Typography variant="caption" sx={sxSectionLabel(theme)}>{t('map:textPanel.sectionStyle')}</Typography>

          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 0 }}>

            <TextField

              label={t('map:textPanel.fontSize')}

              type="number"

              size="small"

              fullWidth

              value={form.fontSize}

              onChange={(event) => updateForm({ fontSize: Math.max(8, Number(event.target.value) || 8) })}

              inputProps={{ min: 8, max: 200, step: 1 }}

            />

            <Box sx={{

              display: 'flex',

              gap: 1,

              alignItems: 'center',

              minWidth: 0,

              width: '100%',

            }}

            >

              <Box

                component="input"

                type="color"

                value={normalizeColorPickerValue(form.fill)}

                onChange={(event) => updateForm({ fill: event.target.value })}

                aria-label={t('map:textPanel.fillColor')}

                sx={{

                  width: 40,

                  height: 40,

                  flexShrink: 0,

                  p: 0,

                  border: `1px solid ${theme.palette.divider}`,

                  borderRadius: 1,

                  cursor: 'pointer',

                  bgcolor: 'transparent',

                  boxSizing: 'border-box',

                }}

              />

              <TextField

                label={t('map:textPanel.fillColor')}

                size="small"

                value={form.fill}

                onChange={(event) => updateForm({ fill: event.target.value })}

                sx={{ flex: '1 1 0', minWidth: 0, width: '100%' }}

              />

            </Box>

            <Box sx={{ minWidth: 0, px: 0.5 }}>

              <Typography variant="caption" color="text.secondary">

                {t('map:textPanel.opacity', { value: Math.round(form.opacity * 100) })}

              </Typography>

              <Slider

                size="small"

                min={0}

                max={1}

                step={0.05}

                value={form.opacity}

                onChange={(_, value) => updateForm({ opacity: value as number })}

                sx={{ width: '100%', boxSizing: 'border-box' }}

              />

            </Box>

          </Box>

        </Box>



        {!isCurveText && (

          <>

            <Divider sx={sxDivider(theme)} />

            <Button

              variant="outlined"

              startIcon={<GestureIcon />}

              onClick={handleConvertToCurveText}

              sx={{ alignSelf: 'flex-start', fontWeight: 600 }}

            >

              {t('map:textPanel.convertToCurveText')}

            </Button>

          </>

        )}

      </Box>



      <Box sx={{ p: 2, borderTop: `1px solid ${theme.campaigner.surface.border}`, backgroundColor: theme.campaigner.surface.subtle, minWidth: 0 }}>

        <Button

          fullWidth

          color="error"

          variant="outlined"

          size="small"

          startIcon={<DeleteIcon />}

          onClick={onDelete}

          sx={{ maxWidth: '100%' }}

        >

          {t('common:delete')}

        </Button>

      </Box>

    </Box>

  );

};


