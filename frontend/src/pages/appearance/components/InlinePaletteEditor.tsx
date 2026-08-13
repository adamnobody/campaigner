import React from 'react';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_PALETTE_DRAFT,
  QUICK_PALETTES,
  getContrastRatio,
  normalizeHexColor,
  validatePaletteDraft,
  type PaletteDraft,
} from '../paletteHelpers';
import styles from '../AppearanceSettingsPage.module.css';

type InlinePaletteEditorProps = {
  initialValue?: PaletteDraft;
  mode: 'create' | 'edit';
  onSave: (draft: PaletteDraft) => void;
  onCancelEdit: () => void;
};

const FIELDS = ['background', 'accent', 'text'] as const;

export const InlinePaletteEditor: React.FC<InlinePaletteEditorProps> = ({
  initialValue,
  mode,
  onSave,
  onCancelEdit,
}) => {
  const { t } = useTranslation('appearance');
  const [draft, setDraft] = React.useState<PaletteDraft>(initialValue ?? DEFAULT_PALETTE_DRAFT);

  React.useEffect(() => {
    setDraft(initialValue ?? DEFAULT_PALETTE_DRAFT);
  }, [initialValue]);

  const validation = validatePaletteDraft(draft);
  const valid = Object.values(validation).every(Boolean);
  const contrast = getContrastRatio(draft.background, draft.text);
  const preview = {
    background: normalizeHexColor(draft.background),
    accent: normalizeHexColor(draft.accent),
    text: normalizeHexColor(draft.text),
  };

  const update = (key: keyof PaletteDraft, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const save = () => {
    if (!valid) return;
    onSave({
      name: draft.name.trim(),
      background: preview.background,
      accent: preview.accent,
      text: preview.text,
    });
    if (mode === 'create') setDraft(DEFAULT_PALETTE_DRAFT);
  };

  return (
    <div className={styles.editorGrid}>
      <div className={styles.editorForm}>
        <TextField
          size="small"
          value={draft.name}
          onChange={(event) => update('name', event.target.value)}
          label={t('paletteEditor.name')}
          placeholder={t('paletteEditor.namePlaceholder')}
          error={draft.name.length > 0 && !validation.name}
          inputProps={{ maxLength: 80 }}
        />

        <div>
          <Typography sx={{ mb: 1, color: 'rgba(232,228,220,.42)', fontSize: 11.5 }}>
            {t('paletteEditor.startFrom')}
          </Typography>
          <div className={styles.editorQuick}>
            {QUICK_PALETTES.map((preset) => (
              <button
                className={styles.ghostButton}
                key={preset.id}
                type="button"
                onClick={() => setDraft({ ...preset, name: draft.name.trim() || preset.name })}
                style={{ padding: '0 12px', borderColor: `${preset.accent}66` }}
              >
                <span className={styles.styleDot} style={{ display: 'inline-block', marginRight: 7, background: preset.accent }} />
                {t(`paletteEditor.quick.${preset.id}`)}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.editorFields}>
          {FIELDS.map((field) => {
            const normalized = normalizeHexColor(draft[field]);
            return (
              <div className={styles.editorField} key={field}>
                <div>
                  <div className={styles.settingLabel}>{t(`paletteEditor.fields.${field}.label`)}</div>
                  <div className={styles.settingHint}>{t(`paletteEditor.fields.${field}.hint`)}</div>
                </div>
                <TextField
                  size="small"
                  value={draft[field]}
                  onChange={(event) => update(field, event.target.value)}
                  error={!validation[field]}
                  placeholder="#RRGGBB"
                  inputProps={{ maxLength: 7, spellCheck: false }}
                />
                <input
                  aria-label={t(`paletteEditor.fields.${field}.label`)}
                  className={styles.colorInput}
                  type="color"
                  value={validation[field] ? normalized : '#000000'}
                  onChange={(event) => update(field, event.target.value)}
                />
              </div>
            );
          })}
        </div>

        {contrast !== null && contrast < 4.5 ? (
          <Alert severity="warning">{t('paletteEditor.lowContrast', { ratio: contrast.toFixed(1) })}</Alert>
        ) : null}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="contained" disabled={!valid} onClick={save}>
            {mode === 'edit' ? t('paletteEditor.saveChanges') : t('paletteEditor.save')}
          </Button>
          {mode === 'edit' ? (
            <Button color="inherit" onClick={onCancelEdit}>{t('actions.cancelEdit')}</Button>
          ) : null}
          <Typography sx={{ color: 'rgba(232,228,220,.35)', fontSize: 11.5 }}>
            {t('paletteEditor.appliesImmediately')}
          </Typography>
        </Box>
      </div>

      <div
        className={styles.editorPreview}
        style={{ background: validation.background ? preview.background : '#0f172a' }}
      >
        <div className={styles.eyebrow} style={{ color: validation.accent ? preview.accent : '#8b5cf6' }}>
          {t('paletteEditor.preview')}
        </div>
        <h3 style={{ margin: '12px 0 4px', color: validation.text ? preview.text : '#f8fafc', font: '600 20px "Cormorant Garamond", serif' }}>
          {draft.name.trim() || t('paletteEditor.newTheme')}
        </h3>
        <p style={{ margin: 0, color: validation.text ? `${preview.text}a6` : '#f8fafca6', fontSize: 11.5 }}>
          {t('paletteEditor.previewHint')}
        </p>
        <div
          className={styles.editorPreviewCard}
          style={{
            color: validation.text ? preview.text : '#f8fafc',
            border: `1px solid ${validation.accent ? `${preview.accent}66` : '#8b5cf666'}`,
            background: validation.text ? `${preview.text}0d` : '#f8fafc0d',
          }}
        >
          <strong>{t('paletteEditor.projectCard')}</strong>
          <p style={{ margin: '7px 0 12px', opacity: 0.66, fontSize: 11 }}>
            {t('paletteEditor.projectCardHint')}
          </p>
          <button
            type="button"
            style={{
              minHeight: 27,
              padding: '0 11px',
              border: 0,
              borderRadius: 7,
              color: validation.background ? preview.background : '#0f172a',
              background: validation.accent ? preview.accent : '#8b5cf6',
              fontWeight: 600,
            }}
          >
            {t('paletteEditor.button')}
          </button>
        </div>
      </div>
    </div>
  );
};
