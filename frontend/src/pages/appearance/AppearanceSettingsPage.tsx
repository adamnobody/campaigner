import React from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PaletteIcon from '@mui/icons-material/Palette';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import BookmarksIcon from '@mui/icons-material/Bookmarks';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { TabFade } from '@/components/ui/MotionSwitch';
import { shallow } from 'zustand/shallow';
import {
  usePreferencesStore,
  type AccentGlow,
  type BackgroundTone,
  type FontMode,
  type MotionMode,
  type PreferencesState,
  type ReadingLineHeight,
  type UiDensity,
} from '@/store/usePreferencesStore';
import { THEME_PRESETS, type ThemePresetDefinition } from '@/theme/presets';
import {
  INTERFACE_STYLE_ORDER,
  INTERFACE_STYLE_PROFILES,
  type InterfaceStyleId,
} from '@/theme/interfaceStyles';
import { AppearanceLivePreview } from './components/AppearanceLivePreview';
import { InlinePaletteEditor } from './components/InlinePaletteEditor';
import { FONT_PRESET_OPTIONS, getFontPreset } from './components/fontPresets';
import { READING_FONT_SIZE_OPTIONS } from '@/theme/appearanceTokens';
import {
  buildCustomColorTheme,
  toPortablePalette,
  type PaletteDraft,
} from './paletteHelpers';
import {
  createAppearanceThemeBundle,
  type AppearanceSnapshot,
  type AppearanceThemeBundle,
} from './themeBundleSchema';
import {
  chooseAppearanceThemeBundle,
  exportAppearanceThemeBundle,
} from './themeBundleFile';
import styles from './AppearanceSettingsPage.module.css';

type SectionId = 'style' | 'color' | 'text' | 'themes';

type SegmentOption<T extends string | number> = {
  value: T;
  label: string;
  swatch?: string;
};

const TONES: Array<{ value: BackgroundTone; hex: string }> = [
  { value: 'ink', hex: '#090b0f' },
  { value: 'graphite', hex: '#111419' },
  { value: 'warm', hex: '#12100d' },
  { value: 'blue', hex: '#0a0e18' },
];

const PALETTE_ORDER = [
  'obsidian-gold',
  'midnight-cyan',
  'royal-violet',
  'neon-magenta',
  'ember-crimson',
  'forest-emerald',
  'verdant-lime',
  'moonstone-silver',
  'parchment-ivory',
  'sable-rose',
  'deep-amber',
  'brass-smoke',
  'storm-indigo',
  'ashen-teal',
];

const SECTION_ICONS: Record<SectionId, React.ReactNode> = {
  style: <AutoAwesomeIcon fontSize="small" />,
  color: <PaletteIcon fontSize="small" />,
  text: <TextFieldsIcon fontSize="small" />,
  themes: <BookmarksIcon fontSize="small" />,
};

const SectionCard: React.FC<{
  title: string;
  meta?: string;
  flush?: boolean;
  children: React.ReactNode;
}> = ({ title, meta, flush, children }) => (
  <section className={`${styles.card} ${flush ? styles.cardFlush : ''}`}>
    <div className={styles.cardHeading}>
      <h2 className={styles.cardTitle}>{title}</h2>
      {meta ? <span className={styles.cardMeta}>{meta}</span> : null}
    </div>
    {children}
  </section>
);

const SettingRow: React.FC<{ label: string; hint: string; children: React.ReactNode }> = ({
  label,
  hint,
  children,
}) => (
  <div className={styles.settingRow}>
    <div>
      <div className={styles.settingLabel}>{label}</div>
      <div className={styles.settingHint}>{hint}</div>
    </div>
    {children}
  </div>
);

const Segments = <T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<SegmentOption<T>>;
  onChange: (value: T) => void;
}) => (
  <div className={styles.segments}>
    {options.map((option) => (
      <button
        className={`${styles.segment} ${value === option.value ? styles.segmentSelected : ''}`}
        key={option.value}
        type="button"
        aria-pressed={value === option.value}
        onClick={() => onChange(option.value)}
      >
        {option.swatch ? <span className={styles.toneDot} style={{ background: option.swatch }} /> : null}
        {option.label}
      </button>
    ))}
  </div>
);

const snapshotFrom = (store: PreferencesState): AppearanceSnapshot => ({
  interfaceStyle: store.interfaceStyle,
  themePreset: store.themePreset,
  backgroundTone: store.backgroundTone,
  accentGlow: store.accentGlow,
  fontMode: store.fontMode,
  fontPresetId: store.fontPresetId,
  uiDensity: store.uiDensity,
  motionMode: store.motionMode,
  readingFontSize: store.readingFontSize,
  readingLineHeight: store.readingLineHeight,
  readingColumnWidth: store.readingColumnWidth,
});

const safeFilePart = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '') || 'theme';

export const AppearanceSettingsPage: React.FC = () => {
  const { t } = useTranslation(['appearance', 'common']);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const goBack = () => {
    if (from && from !== '/appearance') {
      navigate(from);
      return;
    }
    if (typeof window.history.state?.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
      return;
    }
    navigate('/');
  };
  const appearance = usePreferencesStore((state) => state, shallow);
  const [section, setSection] = React.useState<SectionId>('style');
  const [themeName, setThemeName] = React.useState('');
  const [editingPaletteId, setEditingPaletteId] = React.useState<string | null>(null);
  const [editorRevision, setEditorRevision] = React.useState(0);
  const [deleteTarget, setDeleteTarget] = React.useState<
    { kind: 'theme' | 'palette'; id: string; name: string } | null
  >(null);
  const [importCandidate, setImportCandidate] = React.useState<AppearanceThemeBundle | null>(null);
  const [transferMessage, setTransferMessage] = React.useState<
    { severity: 'success' | 'error'; text: string } | null
  >(null);

  const {
    interfaceStyle,
    themePreset,
    backgroundTone,
    accentGlow,
    fontMode,
    fontPresetId,
    uiDensity,
    motionMode,
    readingFontSize,
    readingLineHeight,
    readingColumnWidth,
    customThemes,
    customColorThemes,
    selectedCustomThemeId,
    setThemePreset,
    setBackgroundTone,
    setAccentGlow,
    setFontMode,
    setFontPresetId,
    setUiDensity,
    setMotionMode,
    setReadingFontSize,
    setReadingLineHeight,
    setReadingColumnWidth,
    applyInterfaceStyle,
    applyAppearanceSnapshot,
    saveCurrentAsCustomTheme,
    applyCustomTheme,
    deleteCustomTheme,
    addCustomColorTheme,
    deleteCustomColorTheme,
    resetAppearance,
  } = appearance;

  const palettes = React.useMemo<Record<string, ThemePresetDefinition>>(
    () => ({
      ...THEME_PRESETS,
      ...Object.fromEntries(customColorThemes.map((palette) => [palette.id, palette])),
    }),
    [customColorThemes],
  );
  const currentPreset = palettes[themePreset] ?? THEME_PRESETS['obsidian-gold'];
  const currentTone = TONES.find((tone) => tone.value === backgroundTone) ?? TONES[0];
  const requestedFontPresetId = fontMode === 'serif'
    ? 'lore-serif'
    : fontMode === 'sans'
      ? 'clean-sans'
      : fontPresetId;
  const activeFontPresetId = getFontPreset(requestedFontPresetId).id;
  const activeFont = getFontPreset(activeFontPresetId);
  const numericLineHeight = readingLineHeight === 'tight' ? 1.55 : readingLineHeight === 'loose' ? 1.95 : 1.75;
  const editingPalette = customColorThemes.find((palette) => palette.id === editingPaletteId);
  const editingDraft: PaletteDraft | undefined = editingPalette
    ? {
        name: editingPalette.label,
        background: editingPalette.background,
        accent: editingPalette.accentMain,
        text: editingPalette.textPrimary,
      }
    : undefined;

  const styleLabel = (id: string) =>
    t(`appearance:styles.${id}.label`, { defaultValue: INTERFACE_STYLE_PROFILES[id as InterfaceStyleId]?.label ?? id });
  const paletteLabel = (id: string) =>
    t(`appearance:palettes.${id}`, { defaultValue: palettes[id]?.label ?? id });

  const sections: Array<{ id: SectionId; count?: number }> = [
    { id: 'style', count: INTERFACE_STYLE_ORDER.length },
    { id: 'color', count: PALETTE_ORDER.length + customColorThemes.length },
    { id: 'text' },
    { id: 'themes', count: customThemes.length },
  ];

  const summary = [
    { label: t('appearance:summary.style'), value: styleLabel(interfaceStyle) },
    {
      label: t('appearance:summary.paletteTone'),
      value: `${paletteLabel(themePreset)} · ${t(`appearance:tones.${backgroundTone}`)}`,
      accent: true,
    },
    {
      label: t('appearance:summary.text'),
      value: `${t(`appearance:fontModes.${fontMode}`)} · ${readingFontSize}px · ${t(`appearance:lineHeights.${readingLineHeight}`)}`,
    },
    {
      label: t('appearance:summary.densityGlow'),
      value: `${t(`appearance:densities.${uiDensity}`)} · ${t(`appearance:glows.${accentGlow}`)}`,
    },
    {
      label: t('appearance:summary.motionColumn'),
      value: `${t(`appearance:motions.${motionMode}`)} · ${readingColumnWidth}px`,
    },
  ];

  const savePalette = (draft: PaletteDraft) => {
    const id = editingPaletteId ?? `custom-${crypto.randomUUID()}`;
    addCustomColorTheme(buildCustomColorTheme(draft, id));
    setThemePreset(id);
    setEditingPaletteId(null);
    setEditorRevision((value) => value + 1);
  };

  const saveTheme = () => {
    if (!themeName.trim()) return;
    saveCurrentAsCustomTheme(themeName.trim());
    setThemeName('');
  };

  const exportBundle = async () => {
    try {
      const bundle = createAppearanceThemeBundle({
        active: snapshotFrom(appearance),
        customThemes: customThemes.map((theme) => ({
          name: theme.name,
          settings: theme.settings,
        })),
        customColorThemes: customColorThemes.map(toPortablePalette),
      });
      const result = await exportAppearanceThemeBundle(
        bundle,
        `campaigner-appearance-${safeFilePart(styleLabel(interfaceStyle))}.json`,
      );
      if (!result.cancelled) {
        setTransferMessage({ severity: 'success', text: t('appearance:transfer.exported') });
      }
    } catch (error) {
      setTransferMessage({
        severity: 'error',
        text: t('appearance:transfer.exportError', { error: error instanceof Error ? error.message : String(error) }),
      });
    }
  };

  const chooseImport = async () => {
    try {
      const result = await chooseAppearanceThemeBundle();
      if (!result.success) {
        if (result.message !== 'cancelled') {
          setTransferMessage({
            severity: 'error',
            text: t('appearance:transfer.invalid', { error: result.message }),
          });
        }
        return;
      }
      setTransferMessage(null);
      setImportCandidate(result.data);
    } catch (error) {
      setTransferMessage({
        severity: 'error',
        text: t('appearance:transfer.importError', { error: error instanceof Error ? error.message : String(error) }),
      });
    }
  };

  const confirmImport = () => {
    if (!importCandidate) return;
    importCandidate.customColorThemes.forEach((palette) => {
      addCustomColorTheme(buildCustomColorTheme(palette, palette.id), false);
    });
    const existingNames = new Set(customThemes.map((theme) => theme.name.trim().toLocaleLowerCase()));
    importCandidate.customThemes.forEach((theme) => {
      const normalizedName = theme.name.trim().toLocaleLowerCase();
      if (existingNames.has(normalizedName)) return;
      saveCurrentAsCustomTheme(theme.name, theme.settings);
      existingNames.add(normalizedName);
    });
    applyAppearanceSnapshot(importCandidate.active);
    setImportCandidate(null);
    setTransferMessage({ severity: 'success', text: t('appearance:transfer.imported') });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === 'theme') deleteCustomTheme(deleteTarget.id);
    else deleteCustomColorTheme(deleteTarget.id);
    if (editingPaletteId === deleteTarget.id) setEditingPaletteId(null);
    setDeleteTarget(null);
  };

  const renderStyle = () => (
    <>
      <SectionCard title={t('appearance:style.direction')} meta={t('appearance:style.meta')}>
        <div className={styles.styleGrid}>
          {INTERFACE_STYLE_ORDER.map((id) => {
            const profile = INTERFACE_STYLE_PROFILES[id];
            const palette = palettes[profile.recommendedPalettes[0]] ?? currentPreset;
            const selected = interfaceStyle === id;
            return (
              <button
                className={`${styles.styleTile} ${selected ? styles.styleTileSelected : ''}`}
                key={id}
                type="button"
                aria-pressed={selected}
                onClick={() => applyInterfaceStyle(id)}
              >
                <div
                  className={styles.styleSwatch}
                  style={{ background: `linear-gradient(150deg, ${palette.background}, ${palette.accentSoft})` }}
                >
                  <span style={{ position: 'absolute', top: 9, left: 9, width: 22, height: 3, borderRadius: 2, background: palette.accentMain }} />
                  <span style={{ position: 'absolute', right: 7, top: 5, color: palette.accentMain, opacity: selected ? 1 : 0 }}>✓</span>
                </div>
                <span className={styles.styleNameRow}>
                  <span className={styles.styleName}>{styleLabel(id)}</span>
                  <span className={styles.styleDot} style={{ background: palette.accentMain }} />
                </span>
                <span className={styles.styleDescription}>{t(`appearance:styles.${id}.description`)}</span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title={t('appearance:style.toneAndLight')} flush>
        <SettingRow label={t('appearance:style.backgroundTone')} hint={t('appearance:style.backgroundToneHint')}>
          <Segments
            value={backgroundTone}
            options={TONES.map((tone) => ({
              value: tone.value,
              label: t(`appearance:tones.${tone.value}`),
              swatch: tone.hex,
            }))}
            onChange={setBackgroundTone}
          />
        </SettingRow>
        <SettingRow label={t('appearance:style.accentGlow')} hint={t('appearance:style.accentGlowHint')}>
          <Segments
            value={accentGlow}
            options={(['none', 'soft', 'strong'] as AccentGlow[]).map((value) => ({
              value,
              label: t(`appearance:glows.${value}`),
            }))}
            onChange={setAccentGlow}
          />
        </SettingRow>
        <SettingRow label={t('appearance:style.density')} hint={t('appearance:style.densityHint')}>
          <Segments
            value={uiDensity}
            options={(['compact', 'comfortable', 'spacious'] as UiDensity[]).map((value) => ({
              value,
              label: t(`appearance:densities.${value}`),
            }))}
            onChange={setUiDensity}
          />
        </SettingRow>
        <SettingRow label={t('appearance:style.motion')} hint={t('appearance:style.motionHint')}>
          <Segments
            value={motionMode}
            options={(['full', 'reduced'] as MotionMode[]).map((value) => ({
              value,
              label: t(`appearance:motions.${value}`),
            }))}
            onChange={setMotionMode}
          />
        </SettingRow>
      </SectionCard>
    </>
  );

  const renderColor = () => (
    <>
      <SectionCard title={t('appearance:color.readyPalettes')} meta={t('appearance:color.active', { name: paletteLabel(themePreset) })}>
        <div className={styles.paletteGrid}>
          {[...PALETTE_ORDER, ...customColorThemes.map((palette) => palette.id)].map((id) => {
            const palette = palettes[id];
            if (!palette) return null;
            const selected = themePreset === id;
            const custom = id.startsWith('custom-');
            return (
              <div className={styles.paletteTile} key={id}>
                {custom ? (
                  <div className={styles.paletteActions}>
                    <button className={styles.paletteIconButton} type="button" aria-label={t('appearance:actions.editPalette')} onClick={() => setEditingPaletteId(id)}>
                      <EditOutlinedIcon sx={{ fontSize: 14 }} />
                    </button>
                    <button
                      className={styles.paletteIconButton}
                      type="button"
                      aria-label={t('appearance:actions.deletePalette')}
                      onClick={() => setDeleteTarget({ kind: 'palette', id, name: palette.label })}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                    </button>
                  </div>
                ) : null}
                <button className={styles.paletteButton} type="button" aria-pressed={selected} onClick={() => setThemePreset(id)}>
                  <span
                    className={`${styles.paletteSwatch} ${selected ? styles.paletteSelected : ''}`}
                    style={{ display: 'block', background: `linear-gradient(150deg, ${palette.background}, ${palette.accentSoft})` }}
                  >
                    <span style={{ position: 'absolute', left: 10, bottom: 10, width: 24, height: 3, borderRadius: 2, background: palette.accentMain }} />
                    {selected ? <span style={{ position: 'absolute', top: 7, right: custom ? 64 : 8, color: palette.accentMain }}>✓</span> : null}
                  </span>
                  <span className={styles.paletteName}>{paletteLabel(id)}</span>
                </button>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title={editingPalette ? t('appearance:color.editPalette', { name: editingPalette.label }) : t('appearance:color.customPalette')}
        meta={t('appearance:color.customMeta')}
      >
        <InlinePaletteEditor
          key={`${editingPaletteId ?? 'create'}-${editorRevision}`}
          initialValue={editingDraft}
          mode={editingPalette ? 'edit' : 'create'}
          onSave={savePalette}
          onCancelEdit={() => setEditingPaletteId(null)}
        />
      </SectionCard>
    </>
  );

  const renderText = () => (
    <SectionCard title={t('appearance:text.typography')} meta={`${activeFont.label} · ${readingFontSize}px · ${t(`appearance:lineHeights.${readingLineHeight}`)}`} flush>
      <div className={styles.readingPreview}>
        <h3 className={styles.readingTitle} style={{ fontFamily: activeFont.family, fontSize: 26 }}>
          {t('appearance:text.previewTitle')}
        </h3>
        <p
          className={styles.readingBody}
          style={{
            maxWidth: readingColumnWidth,
            fontFamily: activeFont.family,
            fontSize: readingFontSize,
            lineHeight: numericLineHeight,
          }}
        >
          {t('appearance:text.previewBody')}
        </p>
      </div>

      <SettingRow label={t('appearance:text.fontMode')} hint={t('appearance:text.fontModeHint')}>
        <Segments
          value={fontMode}
          options={(['serif', 'sans', 'custom'] as FontMode[]).map((value) => ({
            value,
            label: t(`appearance:fontModes.${value}`),
          }))}
          onChange={setFontMode}
        />
      </SettingRow>

      <SettingRow label={t('appearance:text.localPreset')} hint={t('appearance:text.localPresetHint')}>
        <div className={styles.fontGrid}>
          {FONT_PRESET_OPTIONS.map((preset) => (
            <button
              className={`${styles.fontTile} ${fontMode === 'custom' && fontPresetId === preset.id ? styles.fontTileSelected : ''}`}
              key={preset.id}
              type="button"
              aria-pressed={fontMode === 'custom' && fontPresetId === preset.id}
              onClick={() => {
                setFontPresetId(preset.id);
                setFontMode('custom');
              }}
            >
              <strong style={{ display: 'block', fontFamily: preset.family, fontSize: 14 }}>{t(`appearance:fontPresets.${preset.id}`)}</strong>
              <span style={{ display: 'block', marginTop: 6, fontFamily: preset.family, fontSize: 11, opacity: 0.58 }}>{preset.sample}</span>
            </button>
          ))}
        </div>
      </SettingRow>

      <SettingRow label={t('appearance:text.size')} hint={t('appearance:text.sizeHint')}>
        <Segments
          value={readingFontSize}
          options={READING_FONT_SIZE_OPTIONS.map((value) => ({ value, label: `Aa · ${value}` }))}
          onChange={setReadingFontSize}
        />
      </SettingRow>
      <SettingRow label={t('appearance:text.lineHeight')} hint={t('appearance:text.lineHeightHint')}>
        <Segments
          value={readingLineHeight}
          options={(['tight', 'normal', 'loose'] as ReadingLineHeight[]).map((value) => ({
            value,
            label: t(`appearance:lineHeights.${value}`),
          }))}
          onChange={setReadingLineHeight}
        />
      </SettingRow>
      <SettingRow label={t('appearance:text.columnWidth')} hint={t('appearance:text.columnWidthHint')}>
        <Segments
          value={readingColumnWidth}
          options={([620, 760, 900] as const).map((value) => ({
            value,
            label: `${t(`appearance:columnWidths.${value}`)} · ${value}px`,
          }))}
          onChange={setReadingColumnWidth}
        />
      </SettingRow>
    </SectionCard>
  );

  const renderThemes = () => (
    <>
      <SectionCard title={t('appearance:themes.saved')} meta={t('appearance:themes.count', { count: customThemes.length })}>
        <div className={styles.themeSave}>
          <div>
            <div className={styles.settingLabel}>{t('appearance:themes.saveCurrent')}</div>
            <div className={styles.settingHint}>{t('appearance:themes.saveCurrentHint')}</div>
          </div>
          <div className={styles.saveControls}>
            <TextField
              fullWidth
              size="small"
              value={themeName}
              onChange={(event) => setThemeName(event.target.value)}
              placeholder={t('appearance:themes.namePlaceholder')}
              inputProps={{ maxLength: 100 }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') saveTheme();
              }}
            />
            <Button variant="outlined" startIcon={<SaveOutlinedIcon />} disabled={!themeName.trim()} onClick={saveTheme}>
              {t('common:save')}
            </Button>
          </div>
        </div>

        {customThemes.length ? (
          <div className={styles.themesGrid}>
            {customThemes.map((theme) => {
              const active = selectedCustomThemeId === theme.id;
              return (
                <div className={`${styles.themeItem} ${active ? styles.themeItemActive : ''}`} key={theme.id}>
                  <span
                    style={{
                      width: 42,
                      height: 32,
                      flex: 'none',
                      border: '1px solid rgba(255,255,255,.08)',
                      borderRadius: 7,
                      background: `linear-gradient(150deg, ${palettes[theme.settings.themePreset]?.background ?? '#101216'}, ${palettes[theme.settings.themePreset]?.accentSoft ?? 'rgba(255,255,255,.08)'})`,
                    }}
                  />
                  <div className={styles.themeInfo}>
                    <div className={styles.themeName}>{theme.name}</div>
                    <div className={styles.themeMeta}>
                      {styleLabel(theme.settings.interfaceStyle)} · {paletteLabel(theme.settings.themePreset)}
                    </div>
                  </div>
                  <Button size="small" variant={active ? 'contained' : 'outlined'} onClick={() => applyCustomTheme(theme.id)}>
                    {active ? t('appearance:themes.active') : t('appearance:themes.apply')}
                  </Button>
                  <IconButton
                    size="small"
                    aria-label={t('appearance:actions.deleteTheme')}
                    onClick={() => setDeleteTarget({ kind: 'theme', id: theme.id, name: theme.name })}
                    sx={{ color: 'rgba(232,228,220,.32)', '&:hover': { color: '#e0705f' } }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.notice}>{t('appearance:themes.empty')}</div>
        )}
      </SectionCard>

      <SectionCard title={t('appearance:transfer.title')} meta={t('appearance:transfer.meta')} flush>
        <SettingRow label={t('appearance:transfer.file')} hint={t('appearance:transfer.fileHint')}>
          <div className={styles.segments}>
            <Button className={styles.segment} variant="outlined" startIcon={<DownloadOutlinedIcon />} onClick={exportBundle}>
              {t('appearance:transfer.export')}
            </Button>
            <Button className={styles.segment} variant="outlined" startIcon={<UploadFileOutlinedIcon />} onClick={chooseImport}>
              {t('appearance:transfer.import')}
            </Button>
          </div>
        </SettingRow>
        {transferMessage ? <Alert severity={transferMessage.severity}>{transferMessage.text}</Alert> : null}
      </SectionCard>
    </>
  );

  const sectionContent = {
    style: renderStyle,
    color: renderColor,
    text: renderText,
    themes: renderThemes,
  }[section]();

  return (
    <div
      className={styles.page}
      style={{
        '--appearance-accent': currentPreset.accentMain,
        '--appearance-accent-soft': currentPreset.accentSoft,
        '--appearance-accent-line': `rgba(${currentPreset.borderRgb}, .4)`,
      } as React.CSSProperties}
    >
      <aside className={styles.sidebar}>
        <button className={styles.back} type="button" onClick={goBack}>
          <ArrowBackIcon sx={{ fontSize: 18 }} />
          {from && from !== '/' ? t('common:back') : t('appearance:backHome')}
        </button>
        <div className={`${styles.eyebrow} ${styles.sidebarEyebrow}`}>{t('appearance:settings')}</div>
        <h1 className={styles.sidebarTitle}>{t('appearance:pageTitle')}</h1>
        <nav className={styles.nav} aria-label={t('appearance:pageTitle')}>
          {sections.map((item) => (
            <button
              className={`${styles.navButton} ${section === item.id ? styles.navButtonActive : ''}`}
              key={item.id}
              type="button"
              aria-current={section === item.id ? 'page' : undefined}
              onClick={() => setSection(item.id)}
            >
              {SECTION_ICONS[item.id]}
              <span>{t(`appearance:sections.${item.id}.title`)}</span>
              {item.count !== undefined ? <span className={styles.navCount}>{item.count}</span> : null}
            </button>
          ))}
        </nav>
        <div className={styles.sidebarNote}>{t('appearance:localOnly')}</div>
      </aside>

      <main className={styles.body}>
        <nav className={styles.compactTabs} aria-label={t('appearance:pageTitle')}>
          <button className={styles.back} type="button" onClick={goBack} style={{ margin: 0, padding: '0 8px' }}>
            <ArrowBackIcon sx={{ fontSize: 18 }} />
          </button>
          {sections.map((item) => (
            <button
              className={`${styles.compactTab} ${section === item.id ? styles.compactTabActive : ''}`}
              key={item.id}
              type="button"
              aria-current={section === item.id ? 'page' : undefined}
              onClick={() => setSection(item.id)}
            >
              {SECTION_ICONS[item.id]}
              {t(`appearance:sections.${item.id}.short`)}
              {item.count !== undefined ? <span className={styles.navCount}>{item.count}</span> : null}
            </button>
          ))}
        </nav>

        <div className={styles.workspace}>
          <div className={styles.content}>
            <div className={styles.contentInner}>
              <TabFade tab={section}>
              <header className={styles.pageHeader}>
                <div>
                  <div className={styles.eyebrow}>{styleLabel(interfaceStyle)} · {paletteLabel(themePreset)}</div>
                  <h1 className={styles.pageTitle}>{t(`appearance:sections.${section}.title`)}</h1>
                  <p className={styles.pageHint}>{t(`appearance:sections.${section}.hint`)}</p>
                </div>
                <button className={styles.ghostButton} type="button" onClick={resetAppearance} style={{ padding: '0 14px', whiteSpace: 'nowrap' }}>
                  <RestartAltIcon sx={{ mr: .75, fontSize: 16, verticalAlign: 'middle' }} />
                  {t('appearance:actions.reset')}
                </button>
              </header>
              {sectionContent}
              </TabFade>
            </div>
          </div>

          <aside className={styles.previewColumn}>
            <AppearanceLivePreview
              preset={currentPreset}
              tone={currentTone.hex}
              accentGlow={accentGlow}
              fontPresetId={activeFontPresetId}
              uiDensity={uiDensity}
              readingFontSize={readingFontSize}
              readingLineHeight={readingLineHeight}
              summary={summary}
            />
          </aside>
        </div>
      </main>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t(`appearance:confirmDelete.${deleteTarget?.kind ?? 'theme'}.title`)}</DialogTitle>
        <DialogContent>
          {t(`appearance:confirmDelete.${deleteTarget?.kind ?? 'theme'}.message`, { name: deleteTarget?.name })}
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setDeleteTarget(null)}>{t('common:cancel')}</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>{t('common:delete')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(importCandidate)} onClose={() => setImportCandidate(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('appearance:transfer.confirmTitle')}</DialogTitle>
        <DialogContent>
          <p style={{ marginTop: 0 }}>{t('appearance:transfer.confirmMessage')}</p>
          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>{t('appearance:transfer.bundleVersion')}</span>
              <span className={styles.summaryValue}>v{importCandidate?.version}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>{t('appearance:transfer.savedThemes')}</span>
              <span className={styles.summaryValue}>{importCandidate?.customThemes.length ?? 0}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>{t('appearance:transfer.customPalettes')}</span>
              <span className={styles.summaryValue}>{importCandidate?.customColorThemes.length ?? 0}</span>
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setImportCandidate(null)}>{t('common:cancel')}</Button>
          <Button variant="contained" onClick={confirmImport}>{t('appearance:transfer.confirm')}</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
