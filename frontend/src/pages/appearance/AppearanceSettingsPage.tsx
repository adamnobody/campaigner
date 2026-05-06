import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  FormLabel,
  Switch,
  Divider,
  Button,
  Chip,
  IconButton,
  TextField,
  Avatar,
  Fade,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';
import BlurOnIcon from '@mui/icons-material/BlurOn';
import AnimationIcon from '@mui/icons-material/Animation';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import LayersIcon from '@mui/icons-material/Layers';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import WallpaperIcon from '@mui/icons-material/Wallpaper';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ImageIcon from '@mui/icons-material/Image';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TuneIcon from '@mui/icons-material/Tune';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import SaveIcon from '@mui/icons-material/Save';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import TextureIcon from '@mui/icons-material/Texture';
import FontDownloadIcon from '@mui/icons-material/FontDownload';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { shallow } from 'zustand/shallow';
import { THEME_PRESETS } from '@/theme/presets';
import { DndButton } from '@/components/ui/DndButton';
import { motion } from 'framer-motion';

import {
  presetOrder,
  safeRgba,
  AnimatedSlider,
} from '@/pages/appearance/components/AppearancePrimitives';
import { FloatingOrb } from '@/components/ui/FloatingOrb';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AppearanceLivePreview } from '@/pages/appearance/components/AppearanceLivePreview';
import { FONT_PRESET_OPTIONS } from '@/pages/appearance/components/fontPresets';
import { useDebouncedDraft } from '@/pages/appearance/components/useDebouncedDraft';
import { CreateColorThemeDialog, type CreateColorThemeValues } from '@/pages/appearance/components/CreateColorThemeDialog';
import {
  INTERFACE_STYLE_ORDER,
  INTERFACE_STYLE_PROFILES,
  getPaletteCompatibility,
  type InterfaceStyleId,
} from '@/theme/interfaceStyles';

export const AppearanceSettingsPage: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation(['appearance', 'common']);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);
  const [customThemeName, setCustomThemeName] = useState('');
  const [customPaletteDialogOpen, setCustomPaletteDialogOpen] = useState(false);
  const [editingPaletteId, setEditingPaletteId] = useState<string | null>(null);
  const [editingPaletteValues, setEditingPaletteValues] = useState<CreateColorThemeValues | null>(null);
  const [selectedFontPresetId, setSelectedFontPresetId] = useState('default-inter-cinzel');

  const {
    interfaceStyle,
    autoApplyRecommendedPalette,
    themePreset,
    surfaceMode,
    fontMode,
    uiDensity,
    motionMode,
    transparency,
    blur,
    borderRadius,
    homeBackgroundImage,
    homeBackgroundOpacity,
    customBodyFontFamily,
    customHeadingFontFamily,
    customFontCssUrl,
    panelPatternMode,
    panelPatternOpacity,
    panelPatternSize,
    panelPatternUrl,
    cardPatternMode,
    cardPatternOpacity,
    cardPatternSize,
    cardPatternUrl,
    customThemes,
    customColorThemes,
    selectedCustomThemeId,
    setThemePreset,
    setSurfaceMode,
    setFontMode,
    setUiDensity,
    setMotionMode,
    setTransparency,
    setBlur,
    setBorderRadius,
    setHomeBackgroundImage,
    setHomeBackgroundOpacity,
    clearHomeBackgroundImage,
    setCustomBodyFontFamily,
    setCustomHeadingFontFamily,
    setCustomFontCssUrl,
    setPanelPatternMode,
    setPanelPatternOpacity,
    setPanelPatternSize,
    setPanelPatternUrl,
    setCardPatternMode,
    setCardPatternOpacity,
    setCardPatternSize,
    setCardPatternUrl,
    setAutoApplyRecommendedPalette,
    applyInterfaceStyle,
    saveCurrentAsCustomTheme,
    applyCustomTheme,
    deleteCustomTheme,
    addCustomColorTheme,
    resetAppearance,
  } = usePreferencesStore((state) => ({
    interfaceStyle: state.interfaceStyle,
    autoApplyRecommendedPalette: state.autoApplyRecommendedPalette,
    themePreset: state.themePreset,
    surfaceMode: state.surfaceMode,
    fontMode: state.fontMode,
    uiDensity: state.uiDensity,
    motionMode: state.motionMode,
    transparency: state.transparency,
    blur: state.blur,
    borderRadius: state.borderRadius,
    homeBackgroundImage: state.homeBackgroundImage,
    homeBackgroundOpacity: state.homeBackgroundOpacity,
    customBodyFontFamily: state.customBodyFontFamily,
    customHeadingFontFamily: state.customHeadingFontFamily,
    customFontCssUrl: state.customFontCssUrl,
    panelPatternMode: state.panelPatternMode,
    panelPatternOpacity: state.panelPatternOpacity,
    panelPatternSize: state.panelPatternSize,
    panelPatternUrl: state.panelPatternUrl,
    cardPatternMode: state.cardPatternMode,
    cardPatternOpacity: state.cardPatternOpacity,
    cardPatternSize: state.cardPatternSize,
    cardPatternUrl: state.cardPatternUrl,
    customThemes: state.customThemes,
    customColorThemes: state.customColorThemes,
    selectedCustomThemeId: state.selectedCustomThemeId,
    setThemePreset: state.setThemePreset,
    setSurfaceMode: state.setSurfaceMode,
    setFontMode: state.setFontMode,
    setUiDensity: state.setUiDensity,
    setMotionMode: state.setMotionMode,
    setTransparency: state.setTransparency,
    setBlur: state.setBlur,
    setBorderRadius: state.setBorderRadius,
    setHomeBackgroundImage: state.setHomeBackgroundImage,
    setHomeBackgroundOpacity: state.setHomeBackgroundOpacity,
    clearHomeBackgroundImage: state.clearHomeBackgroundImage,
    setCustomBodyFontFamily: state.setCustomBodyFontFamily,
    setCustomHeadingFontFamily: state.setCustomHeadingFontFamily,
    setCustomFontCssUrl: state.setCustomFontCssUrl,
    setPanelPatternMode: state.setPanelPatternMode,
    setPanelPatternOpacity: state.setPanelPatternOpacity,
    setPanelPatternSize: state.setPanelPatternSize,
    setPanelPatternUrl: state.setPanelPatternUrl,
    setCardPatternMode: state.setCardPatternMode,
    setCardPatternOpacity: state.setCardPatternOpacity,
    setCardPatternSize: state.setCardPatternSize,
    setCardPatternUrl: state.setCardPatternUrl,
    setAutoApplyRecommendedPalette: state.setAutoApplyRecommendedPalette,
    applyInterfaceStyle: state.applyInterfaceStyle,
    saveCurrentAsCustomTheme: state.saveCurrentAsCustomTheme,
    applyCustomTheme: state.applyCustomTheme,
    deleteCustomTheme: state.deleteCustomTheme,
    addCustomColorTheme: state.addCustomColorTheme,
    resetAppearance: state.resetAppearance,
  }), shallow);

  const allThemePresets = React.useMemo(() => {
    const customMap = customColorThemes.reduce<Record<string, typeof THEME_PRESETS[string]>>((acc, preset) => {
      acc[preset.id] = preset;
      return acc;
    }, {});
    return {
      ...THEME_PRESETS,
      ...customMap,
    };
  }, [customColorThemes]);
  const paletteOrder = React.useMemo(
    () => [...presetOrder, ...customColorThemes.map((preset) => preset.id)],
    [customColorThemes]
  );
  const currentPreset = allThemePresets[themePreset] || THEME_PRESETS['obsidian-gold'];
  const currentStyleProfile = INTERFACE_STYLE_PROFILES[interfaceStyle];
  const currentPaletteCompatibilityRaw = getPaletteCompatibility(interfaceStyle, themePreset);
  const currentPaletteCompatibility = {
    level: currentPaletteCompatibilityRaw.level,
    label: t(`appearance:paletteCompatibility.${currentPaletteCompatibilityRaw.level}.label`),
    hint: t(`appearance:paletteCompatibility.${currentPaletteCompatibilityRaw.level}.hint`),
  };
  const themePresetLabel = (id: string, fallback: string) =>
    t(`appearance:themePresets.${id}.label`, { defaultValue: fallback });
  const interfaceStyleLabel = (id: InterfaceStyleId) =>
    t(`appearance:interfaceStyles.${id}.label`, { defaultValue: INTERFACE_STYLE_PROFILES[id].label });
  const compatibilityColor: Record<'ideal' | 'good' | 'experimental', 'success' | 'info' | 'warning'> = {
    ideal: 'success',
    good: 'info',
    experimental: 'warning',
  };

  const commitCustomFontCssUrl = useCallback((value: string) => {
    setCustomFontCssUrl(value);
    setFontMode('custom');
  }, [setCustomFontCssUrl, setFontMode]);
  const commitCustomBodyFontFamily = useCallback((value: string) => {
    setCustomBodyFontFamily(value);
    setFontMode('custom');
  }, [setCustomBodyFontFamily, setFontMode]);
  const commitCustomHeadingFontFamily = useCallback((value: string) => {
    setCustomHeadingFontFamily(value);
    setFontMode('custom');
  }, [setCustomHeadingFontFamily, setFontMode]);

  const {
    draft: homeBackgroundImageDraft,
    isPending: isHomeBackgroundImagePending,
    setDraftImmediately: setHomeBackgroundImageDraftImmediately,
    setDraftValue: setHomeBackgroundImageDraft,
    flushDraft: flushHomeBackgroundImageDraft,
  } = useDebouncedDraft(homeBackgroundImage || '', setHomeBackgroundImage);
  const {
    draft: customFontCssUrlDraft,
    isPending: isCustomFontCssUrlPending,
    setDraftValue: setCustomFontCssUrlDraft,
    flushDraft: flushCustomFontCssUrlDraft,
  } = useDebouncedDraft(customFontCssUrl, commitCustomFontCssUrl);
  const {
    draft: customBodyFontFamilyDraft,
    isPending: isCustomBodyFontFamilyPending,
    setDraftValue: setCustomBodyFontFamilyDraft,
    flushDraft: flushCustomBodyFontFamilyDraft,
  } = useDebouncedDraft(customBodyFontFamily, commitCustomBodyFontFamily);
  const {
    draft: customHeadingFontFamilyDraft,
    isPending: isCustomHeadingFontFamilyPending,
    setDraftValue: setCustomHeadingFontFamilyDraft,
    flushDraft: flushCustomHeadingFontFamilyDraft,
  } = useDebouncedDraft(customHeadingFontFamily, commitCustomHeadingFontFamily);
  const {
    draft: panelPatternUrlDraft,
    isPending: isPanelPatternUrlPending,
    setDraftImmediately: setPanelPatternUrlDraftImmediately,
    setDraftValue: setPanelPatternUrlDraft,
    flushDraft: flushPanelPatternUrlDraft,
  } = useDebouncedDraft(panelPatternUrl, setPanelPatternUrl);
  const {
    draft: cardPatternUrlDraft,
    isPending: isCardPatternUrlPending,
    setDraftImmediately: setCardPatternUrlDraftImmediately,
    setDraftValue: setCardPatternUrlDraft,
    flushDraft: flushCardPatternUrlDraft,
  } = useDebouncedDraft(cardPatternUrl, setCardPatternUrl);

  const renderApplyingHint = (isPending: boolean) => (
    <Typography
      component="span"
      sx={{
        color: 'info.main',
        fontSize: '0.82rem',
        fontWeight: 600,
        visibility: isPending ? 'visible' : 'hidden',
      }}
    >
      {t('appearance:applying')}
    </Typography>
  );

  const buildPatternPreviewStyle = (
    mode: 'none' | 'dots' | 'grid' | 'diagonal' | 'custom',
    opacity: number,
    size: number,
    customUrl: string
  ): {
    backgroundImage?: string;
    backgroundSize?: string;
    backgroundRepeat?: string;
    backgroundPosition?: string;
  } => {
    if (mode === 'none') return {};
    if (mode === 'custom' && customUrl.trim()) {
      return {
        backgroundImage: `url("${customUrl}")`,
        backgroundSize: `${Math.max(8, size)}px ${Math.max(8, size)}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0',
      };
    }
    if (mode === 'dots') {
      return {
        backgroundImage: `radial-gradient(circle, ${alpha(currentPreset.textPrimary, opacity)} 1.2px, transparent 1.2px)`,
        backgroundSize: `${size}px ${size}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0',
      };
    }
    if (mode === 'grid') {
      return {
        backgroundImage: [
          `linear-gradient(to right, ${alpha(currentPreset.textPrimary, opacity)} 1px, transparent 1px)`,
          `linear-gradient(to bottom, ${alpha(currentPreset.textPrimary, opacity)} 1px, transparent 1px)`,
        ].join(', '),
        backgroundSize: `${size}px ${size}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0',
      };
    }
    if (mode === 'diagonal') {
      return {
        backgroundImage: `repeating-linear-gradient(45deg, ${alpha(currentPreset.textPrimary, opacity)} 0, ${alpha(currentPreset.textPrimary, opacity)} 2px, transparent 2px, transparent ${size}px)`,
        backgroundSize: 'auto',
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0',
      };
    }
    return {};
  };

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleBackgroundFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp,image/avif,image/gif';

    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          setHomeBackgroundImageDraftImmediately(result);
          setHomeBackgroundImage(result);
        }
      };
      reader.readAsDataURL(file);
    };

    input.click();
  };

  const handlePatternFileUpload = (target: 'panel' | 'card') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp,image/svg+xml';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== 'string') return;
        if (target === 'panel') {
          setPanelPatternMode('custom');
          setPanelPatternUrlDraftImmediately(result);
          setPanelPatternUrl(result);
        } else {
          setCardPatternMode('custom');
          setCardPatternUrlDraftImmediately(result);
          setCardPatternUrl(result);
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleSaveCustomTheme = () => {
    if (!customThemeName.trim()) return;
    saveCurrentAsCustomTheme(customThemeName.trim());
    setCustomThemeName('');
  };

  const applyFontPreset = (presetId: string) => {
    const preset = FONT_PRESET_OPTIONS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedFontPresetId(preset.id);
    setCustomFontCssUrl(preset.cssUrl);
    setCustomBodyFontFamily(preset.bodyFamily);
    setCustomHeadingFontFamily(preset.headingFamily);
    setFontMode('custom');
  };

  const hexToRgbTriplet = (hex: string) => {
    const normalized = hex.trim().replace('#', '');
    const full = normalized.length === 3
      ? normalized.split('').map((char) => `${char}${char}`).join('')
      : normalized;
    if (full.length !== 6) return '120, 130, 150';
    const red = Number.parseInt(full.slice(0, 2), 16);
    const green = Number.parseInt(full.slice(2, 4), 16);
    const blue = Number.parseInt(full.slice(4, 6), 16);
    if ([red, green, blue].some((value) => Number.isNaN(value))) return '120, 130, 150';
    return `${red}, ${green}, ${blue}`;
  };

  const buildCustomPaletteId = () => `custom-${Date.now().toString(36)}`;

  const handleSaveCustomPalette = (values: CreateColorThemeValues) => {
    const accentRgb = hexToRgbTriplet(values.accent);
    const textRgb = hexToRgbTriplet(values.text);
    const paletteId = editingPaletteId || buildCustomPaletteId();

    addCustomColorTheme({
      id: paletteId,
      label: values.name,
      background: values.background,
      backgroundAccent: `radial-gradient(circle at top left, rgba(${accentRgb}, 0.2), transparent 34%)`,
      panelBaseRgb: hexToRgbTriplet(values.background),
      borderRgb: accentRgb,
      textPrimary: values.text,
      textSecondary: `rgba(${textRgb}, 0.8)`,
      muted: `rgba(${textRgb}, 0.44)`,
      accentMain: values.accent,
      accentSoft: `rgba(${accentRgb}, 0.18)`,
      accentStrong: values.accent,
      success: '#7BD88F',
      warning: '#F6C177',
      error: '#FF7A7A',
    });
    setThemePreset(paletteId);
    setCustomPaletteDialogOpen(false);
    setEditingPaletteId(null);
    setEditingPaletteValues(null);
  };

  const handleCreatePaletteOpen = () => {
    setEditingPaletteId(null);
    setEditingPaletteValues(null);
    setCustomPaletteDialogOpen(true);
  };

  const handleEditPaletteOpen = (presetId: string) => {
    const palette = customColorThemes.find((item) => item.id === presetId);
    if (!palette) return;
    setEditingPaletteId(palette.id);
    setEditingPaletteValues({
      name: palette.label,
      background: palette.background,
      accent: palette.accentMain,
      text: palette.textPrimary,
    });
    setCustomPaletteDialogOpen(true);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        py: { xs: 2, md: 4 },
        px: { xs: 1, md: 2 },
      }}
    >
      {/* Atmospheric Background */}
      <FloatingOrb color={alpha(theme.palette.primary.main, 0.2)} size={500} top="5%" left="-10%" />
      <FloatingOrb color={alpha(theme.palette.secondary.main, 0.15)} size={400} bottom="10%" right="-5%" delay={3} />

      {/* Main Content */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1400,
          mx: 'auto',
          minWidth: 0,
        }}
      >
        {/* HERO HEADER */}
        <Fade in={isLoaded} timeout={800}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', md: 'center' },
              gap: 2,
              mb: 4,
              flexWrap: 'wrap',
            }}
          >
            <Box
              sx={{
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? 'none' : 'translateY(20px)',
                transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.35)}`,
                  }}
                >
                  <TuneIcon sx={{ fontSize: '1.5rem' }} />
                </Avatar>
                
                <Box>
                  <Typography
                    sx={{
                      fontFamily: '"Cinzel", serif',
                      fontWeight: 900,
                      fontSize: { xs: '1.8rem', md: '2.2rem' },
                      background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.primary.main} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      lineHeight: 1.2,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {t('appearance:page.title')}
                  </Typography>
                  
                  <Typography
                    sx={{ 
                      color: 'text.secondary', 
                      mt: 0.5, 
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <AutoAwesomeIcon sx={{ fontSize: '1rem', color: 'primary.main' }} />
                    {t('appearance:page.subtitle')}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <DndButton
              variant="outlined"
              startIcon={<RestartAltIcon />}
              onClick={resetAppearance}
              sx={{
                fontWeight: 600,
                borderColor: alpha(theme.palette.warning.main, 0.5),
                color: theme.palette.warning.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.warning.main, 0.08),
                  borderColor: theme.palette.warning.main,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.25)}`,
                },
              }}
            >
              {t('appearance:actions.resetStyle')}
            </DndButton>
          </Box>
        </Fade>

        {/* MAIN GRID LAYOUT */}
        <Fade in={isLoaded} timeout={1200}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.3fr) minmax(380px, 0.7fr)' },
              gap: 3,
              minWidth: 0,
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'none' : 'translateY(30px)',
              transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s`,
            }}
          >
            {/* LEFT COLUMN */}
            <Stack spacing={3} sx={{ minWidth: 0 }}>

              <GlassCard sx={{ p: 3 }}>
                <SectionHeader
                  icon={<AutoAwesomeIcon sx={{ fontSize: '1.2rem' }} />}
                  title={t('appearance:sections.interfaceType.title')}
                  subtitle={t('appearance:sections.interfaceType.subtitle')}
                />

                <Box
                  sx={{
                    mb: 2,
                    p: 1.5,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.35)}`,
                    backgroundColor: alpha(theme.palette.background.paper, 0.45),
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    alignItems: 'center',
                  }}
                >
                  <Chip size="small" label={t('appearance:chips.activeStyle', { name: interfaceStyleLabel(interfaceStyle) })} color="primary" />
                  <Chip
                    size="small"
                    label={t('appearance:chips.palettePrefix', { label: currentPaletteCompatibility.label })}
                    color={compatibilityColor[currentPaletteCompatibility.level]}
                    variant={currentPaletteCompatibility.level === 'ideal' ? 'filled' : 'outlined'}
                  />
                  <Typography sx={{ color: alpha(theme.palette.text.secondary, 0.97), fontSize: '0.9rem', lineHeight: 1.55 }}>
                    {currentPaletteCompatibility.hint}
                  </Typography>
                  <FormControlLabel
                    sx={{ ml: 'auto' }}
                    control={
                      <Switch
                        size="small"
                        checked={autoApplyRecommendedPalette}
                        onChange={(event) => setAutoApplyRecommendedPalette(event.target.checked)}
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: '0.86rem', color: alpha(theme.palette.text.secondary, 0.97), lineHeight: 1.45 }}>
                        {t('appearance:autoPalette.label')}
                      </Typography>
                    }
                  />
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 1.5,
                  }}
                >
                  {INTERFACE_STYLE_ORDER.map((styleId) => {
                    const profile = INTERFACE_STYLE_PROFILES[styleId];
                    const selected = styleId === interfaceStyle;
                    const compatibility = getPaletteCompatibility(styleId, themePreset);
                    const recId = profile.recommendedPalettes[0];
                    const recommendedPaletteName = themePresetLabel(recId, THEME_PRESETS[recId]?.label ?? recId);

                    return (
                      <Box
                        key={styleId}
                        onClick={() => applyInterfaceStyle(styleId, { useRecommendedPalette: autoApplyRecommendedPalette })}
                        sx={{
                          borderRadius: 2,
                          p: 1.5,
                          cursor: 'pointer',
                          border: `1px solid ${
                            selected
                              ? alpha(theme.palette.primary.main, 0.7)
                              : alpha(theme.palette.divider, 0.35)
                          }`,
                          backgroundColor: selected
                            ? alpha(theme.palette.primary.main, 0.12)
                            : alpha(theme.palette.background.paper, 0.35),
                          transition: 'all 0.25s ease',
                          '&:hover': {
                            borderColor: alpha(theme.palette.primary.main, 0.6),
                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                            transform: 'translateY(-2px)',
                          },
                        }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="center" gap={1} mb={0.75}>
                          <Typography sx={{ fontWeight: 800, fontSize: '0.86rem' }}>{interfaceStyleLabel(styleId)}</Typography>
                          <Chip
                            size="small"
                            label={t(`appearance:paletteCompatibility.${compatibility.level}.label`)}
                            color={compatibilityColor[compatibility.level]}
                            variant={compatibility.level === 'ideal' ? 'filled' : 'outlined'}
                          />
                        </Box>

                        <Typography sx={{ color: alpha(theme.palette.text.secondary, 0.98), fontSize: '0.9rem', lineHeight: 1.55, mb: 0.75 }}>
                          {t(`appearance:interfaceStyles.${styleId}.shortDescription`)}
                        </Typography>
                        <Typography sx={{ color: alpha(theme.palette.text.secondary, 0.94), fontSize: '0.84rem', lineHeight: 1.5, mb: 1 }}>
                          {t(`appearance:interfaceStyles.${styleId}.spotlight`)}
                        </Typography>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ color: alpha(theme.palette.text.secondary, 0.97), fontSize: '0.84rem', lineHeight: 1.45 }}>
                            {t('appearance:recommendedPalette', { name: recommendedPaletteName })}
                          </Typography>
                          <Button
                            size="small"
                            onClick={(event) => {
                              event.stopPropagation();
                              applyInterfaceStyle(styleId);
                            }}
                          >
                            {t('appearance:styleOnly')}
                          </Button>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </GlassCard>

              {/* COLOR THEMES SECTION */}
              <GlassCard sx={{ p: 3 }}>
                <SectionHeader
                  icon={<PaletteIcon sx={{ fontSize: '1.2rem' }} />}
                  title={t('appearance:sections.colorTheme.title')}
                  subtitle={t('appearance:sections.colorTheme.subtitle', { count: paletteOrder.length })}
                />

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
                    gap: 2,
                  }}
                >
                  {paletteOrder.map((presetId, index) => {
                    const preset = allThemePresets[presetId];
                    const selected = presetId === themePreset;
                    const hovered = hoveredPreset === presetId;
                    const isCustomPalette = customColorThemes.some((item) => item.id === presetId);
                    if (!preset) return null;

                    return (
                      <Tooltip
                        key={preset.id}
                        title={themePresetLabel(preset.id, preset.label)}
                        arrow
                        placement="top"
                      >
                        <Box
                          onClick={() => {
                            setThemePreset(preset.id);
                          }}
                          onMouseEnter={() => setHoveredPreset(preset.id)}
                          onMouseLeave={() => setHoveredPreset(null)}
                          sx={{
                            cursor: 'pointer',
                            borderRadius: 2.5,
                            overflow: 'hidden',
                            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                            transform: hovered ? 'translateY(-4px) scale(1.03)' : 'scale(1)',
                            border: `2px solid ${
                              selected 
                                ? theme.palette.primary.main 
                                : hovered 
                                  ? alpha(theme.palette.primary.main, 0.5)
                                  : 'transparent'
                            }`,
                            boxShadow: selected
                              ? `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}, inset 0 0 20px ${alpha(theme.palette.primary.main, 0.1)}`
                              : hovered
                                ? `0 8px 20px ${alpha(theme.palette.common.black, 0.3)}`
                                : '0 2px 8px rgba(0,0,0,0.1)',
                            opacity: isLoaded ? 1 : 0,
                            animation: isLoaded ? `fadeInUp 0.6s ease ${index * 0.05}s both` : 'none',
                            '@keyframes fadeInUp': {
                              '0%': { opacity: 0, transform: 'translateY(20px)' },
                              '100%': { opacity: 1, transform: 'translateY(0)' },
                            },
                            position: 'relative',
                          }}
                        >
                          <Box
                            sx={{
                              height: 72,
                              background: preset.backgroundAccent,
                              borderBottom: `1px solid ${safeRgba(preset.borderRgb, 0.3)}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative',
                              overflow: 'hidden',
                              '&::after': {
                                content: '""',
                                position: 'absolute',
                                inset: 0,
                                background: `radial-gradient(circle at 30% 30%, ${safeRgba(preset.borderRgb, 0.15)}, transparent 60%)`,
                              },
                            }}
                          >
                            {isCustomPalette && (
                              <IconButton
                                size="small"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleEditPaletteOpen(preset.id);
                                }}
                                sx={{
                                  position: 'absolute',
                                  top: 6,
                                  right: 6,
                                  zIndex: 2,
                                  width: 24,
                                  height: 24,
                                  color: alpha(theme.palette.common.white, 0.85),
                                  backgroundColor: alpha(theme.palette.common.black, 0.28),
                                  border: `1px solid ${alpha(theme.palette.common.white, 0.24)}`,
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.28),
                                    color: theme.palette.common.white,
                                  },
                                }}
                              >
                                <EditIcon sx={{ fontSize: '0.9rem' }} />
                              </IconButton>
                            )}
                            {selected && (
                              <motion.div
                                initial={{ scale: 0, rotate: -180, opacity: 0 }}
                                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                transition={{ 
                                  duration: 0.4, 
                                  ease: [0.68, -0.55, 0.265, 1.55] 
                                }}
                                style={{ 
                                  position: 'absolute', 
                                  top: '50%', 
                                  left: '50%', 
                                  transform: 'translate(-50%, -50%)',
                                  zIndex: 1,
                                  color: '#fff'
                                }}
                              >
                                <CheckCircleOutlineIcon sx={{ fontSize: '2rem' }} />
                              </motion.div>
                            )}
                          </Box>

                          <Box
                            sx={{
                              p: 1.5,
                              backgroundColor: alpha(theme.palette.background.default, 0.5),
                              textAlign: 'center',
                            }}
                          >
                            <Typography
                              sx={{
                                fontWeight: selected ? 800 : 600,
                                fontSize: '0.86rem',
                                color: selected ? theme.palette.primary.main : 'text.primary',
                                letterSpacing: '0.03em',
                                lineHeight: 1.2,
                              }}
                            >
                              {themePresetLabel(preset.id, preset.label)}
                            </Typography>
                            
                            {selected && (
                              <Box
                                component="span"
                                sx={{
                                  display: 'inline-block',
                                  mt: 0.5,
                                  px: 1,
                                  py: 0.25,
                                  borderRadius: 1,
                                  backgroundColor: alpha(theme.palette.primary.main, 0.15),
                                  color: theme.palette.primary.main,
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  letterSpacing: '0.05em',
                                }}
                              >
                                {t('appearance:sections.colorTheme.activeBadge')}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Tooltip>
                    );
                  })}
                  <Box
                    onClick={handleCreatePaletteOpen}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 2.5,
                      minHeight: 112,
                      border: `2px dashed ${alpha(theme.palette.primary.main, 0.45)}`,
                      backgroundColor: alpha(theme.palette.primary.main, 0.06),
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      transition: 'all 0.25s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.12),
                        borderColor: theme.palette.primary.main,
                        transform: 'translateY(-3px)',
                      },
                    }}
                  >
                    <AddIcon sx={{ fontSize: '1.5rem', color: 'primary.main' }} />
                    <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: 'primary.main' }}>
                      {t('appearance:sections.addPalette')}
                    </Typography>
                  </Box>
                </Box>
              </GlassCard>

              {/* BACKGROUND SECTION */}
              <GlassCard sx={{ p: 3 }}>
                <SectionHeader
                  icon={<WallpaperIcon sx={{ fontSize: '1.2rem' }} />}
                  title={t('appearance:sections.background.title')}
                  subtitle={t('appearance:sections.background.subtitle')}
                />

                <Stack spacing={2.5}>
                  <TextField
                    fullWidth
                    label={t('appearance:sections.background.imageUrl')}
                    value={homeBackgroundImageDraft}
                    onChange={(e) => setHomeBackgroundImageDraft(e.target.value)}
                    onBlur={() => flushHomeBackgroundImageDraft()}
                    placeholder={t('appearance:sections.background.imageUrlPlaceholder')}
                    helperText={
                      <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{t('appearance:sections.background.imageHelper')}</span>
                        {renderApplyingHint(isHomeBackgroundImagePending)}
                      </Box>
                    }
                    InputProps={{
                      startAdornment: <ImageIcon sx={{ mr: 1, color: 'action.active' }} />,
                    }}
                  />

                  <Box display="flex" gap={1.5} flexWrap="wrap">
                    <DndButton
                      variant="outlined"
                      startIcon={<UploadFileIcon />}
                      onClick={handleBackgroundFileUpload}
                      sx={{
                        fontWeight: 600,
                        flex: 1,
                        minWidth: 160,
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.25)}`,
                        },
                      }}
                    >
                      {t('appearance:sections.background.uploadFile')}
                    </DndButton>

                    <Button
                      variant="outlined"
                      color="inherit"
                      startIcon={<DeleteOutlineIcon />}
                      onClick={() => {
                        setHomeBackgroundImageDraftImmediately('');
                        clearHomeBackgroundImage();
                      }}
                      disabled={!homeBackgroundImageDraft}
                      sx={{
                        fontWeight: 600,
                        flex: 1,
                        minWidth: 140,
                        borderColor: homeBackgroundImageDraft ? alpha(theme.palette.error.main, 0.5) : undefined,
                        color: homeBackgroundImageDraft ? theme.palette.error.main : undefined,
                        '&:hover:not(:disabled)': {
                          backgroundColor: alpha(theme.palette.error.main, 0.08),
                          borderColor: theme.palette.error.main,
                        },
                      }}
                    >
                      {t('appearance:sections.background.clearBackground')}
                    </Button>
                  </Box>

                  <AnimatedSlider
                    label={t('appearance:sections.background.opacity')}
                    value={homeBackgroundOpacity}
                    min={0.1}
                    max={1}
                    step={0.01}
                    onChange={setHomeBackgroundOpacity}
                    valueLabelFormat={(v) => `${Math.round(v * 100)}%`}
                    disabled={!homeBackgroundImageDraft}
                    icon={<BlurOnIcon sx={{ fontSize: '1rem' }} />}
                    color={theme.palette.secondary.main}
                  />

                  {/* Preview Box */}
                  <Box
                    sx={{
                      position: 'relative',
                      p: 3,
                      borderRadius: 3,
                      border: `2px dashed ${alpha(theme.palette.divider, 0.4)}`,
                      background: homeBackgroundImageDraft
                        ? `
                          linear-gradient(rgba(0,0,0,0.32), rgba(0,0,0,0.48)),
                          url(${homeBackgroundImageDraft})
                        `
                        : alpha(theme.palette.action.hover, 0.05),
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      minHeight: 180,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      overflow: 'hidden',
                      transition: 'all 0.4s ease',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        background: homeBackgroundImageDraft ? 'none' : `
                          repeating-linear-gradient(
                            45deg,
                            transparent,
                            transparent 10px,
                            rgba(255,255,255,0.02) 10px,
                            rgba(255,255,255,0.02) 20px
                          )
                        `,
                      },
                    }}
                  >
                    {!homeBackgroundImageDraft && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          textAlign: 'center',
                        }}
                      >
                        <ImageIcon sx={{ fontSize: 48, color: 'divider', mb: 1, opacity: 0.5 }} />
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                          {t('appearance:sections.background.dropHint')}
                        </Typography>
                      </Box>
                    )}
                    
                    <Box
                      sx={{
                        position: 'relative',
                        zIndex: 1,
                        backgroundColor: alpha(theme.palette.background.default, 0.75),
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2,
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <ImageIcon fontSize="small" sx={{ color: 'primary.main' }} />
                      <Typography sx={{ color: 'text.primary', fontWeight: 600, fontSize: '0.9rem' }}>
                        {t('appearance:sections.background.previewTitle')}
                      </Typography>
                      <Chip
                        size="small"
                        label={homeBackgroundImageDraft ? t('appearance:sections.background.chipSet') : t('appearance:sections.background.chipUnset')}
                        color={homeBackgroundImageDraft ? 'success' : 'default'}
                        sx={{ ml: 'auto', fontWeight: 700 }}
                      />
                    </Box>
                  </Box>
                </Stack>
              </GlassCard>

              {/* SURFACE SETTINGS */}
              <GlassCard sx={{ p: 3 }}>
                <SectionHeader
                  icon={<LayersIcon sx={{ fontSize: '1.2rem' }} />}
                  title={t('appearance:sections.surfaces.title')}
                  subtitle={t('appearance:sections.surfaces.subtitle')}
                />

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <FormLabel
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      mb: 1.5,
                      color: 'text.primary',
                    }}
                  >
                    <DragIndicatorIcon sx={{ fontSize: '1rem' }} />
                    {t('appearance:sections.surfaces.panelStyle')}
                  </FormLabel>
                  <ToggleButtonGroup
                    exclusive
                    value={surfaceMode}
                    onChange={(_, value) => value && setSurfaceMode(value)}
                    fullWidth
                    sx={{
                      '& .MuiToggleButton-root': {
                        py: 1.5,
                        fontWeight: 600,
                        borderRadius: 2,
                        border: `2px solid ${alpha(theme.palette.divider, 0.3)}`,
                        transition: 'all 0.3s ease',
                        '&.Mui-selected': {
                          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                          color: '#fff',
                          borderColor: theme.palette.primary.main,
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.35)}`,
                          '&:hover': {
                            backgroundColor: `${theme.palette.primary.dark}`,
                          },
                        },
                        '&:not(.Mui-selected):hover': {
                          borderColor: alpha(theme.palette.primary.main, 0.5),
                          backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        },
                      },
                    }}
                  >
                    <ToggleButton value="glass">{t('appearance:sections.surfaces.glass')}</ToggleButton>
                    <ToggleButton value="solid">{t('appearance:sections.surfaces.solid')}</ToggleButton>
                  </ToggleButtonGroup>
                </FormControl>

                <AnimatedSlider
                  label={t('appearance:sections.surfaces.transparency')}
                  value={transparency}
                  min={0.35}
                  max={0.95}
                  step={0.01}
                  onChange={setTransparency}
                  valueLabelFormat={(v) => `${Math.round(v * 100)}%`}
                  icon={<BlurOnIcon sx={{ fontSize: '1rem' }} />}
                />

                <AnimatedSlider
                  label={t('appearance:sections.surfaces.blur')}
                  value={blur}
                  min={0}
                  max={24}
                  step={1}
                  onChange={setBlur}
                  valueLabelFormat={(v) => `${v}px`}
                  icon={<BlurOnIcon sx={{ fontSize: '1rem' }} />}
                  color={theme.palette.secondary.main}
                />

                <AnimatedSlider
                  label={t('appearance:sections.surfaces.cornerRadius')}
                  value={borderRadius}
                  min={6}
                  max={24}
                  step={1}
                  onChange={setBorderRadius}
                  valueLabelFormat={(v) => `${v}px`}
                  icon={<DragIndicatorIcon sx={{ fontSize: '1rem' }} />}
                  color={theme.palette.success.main}
                />
              </GlassCard>

              {/* TYPOGRAPHY SECTION */}
              <GlassCard sx={{ p: 3 }}>
                <SectionHeader
                  icon={<TextFieldsIcon sx={{ fontSize: '1.2rem' }} />}
                  title={t('appearance:sections.typography.title')}
                  subtitle={t('appearance:sections.typography.subtitle')}
                />

                <Stack spacing={3}>
                  <FormControl fullWidth>
                    <FormLabel
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        mb: 1.5,
                        color: 'text.primary',
                      }}
                    >
                      <TextFieldsIcon sx={{ fontSize: '1rem' }} />
                      {t('appearance:sections.typography.bodyFont')}
                    </FormLabel>
                    <ToggleButtonGroup
                      exclusive
                      value={fontMode}
                      onChange={(_, value) => value && setFontMode(value)}
                      fullWidth
                      sx={{
                        '& .MuiToggleButton-root': {
                          py: 1.5,
                          fontWeight: 600,
                          fontFamily: fontMode === 'serif'
                            ? '"Cinzel", "Georgia", serif'
                            : fontMode === 'custom'
                            ? customBodyFontFamily
                            : '"Inter", "Roboto", sans-serif',
                          borderRadius: 2,
                          border: `2px solid ${alpha(theme.palette.divider, 0.3)}`,
                          transition: 'all 0.3s ease',
                          '&.Mui-selected': {
                            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                            color: '#fff',
                            borderColor: theme.palette.primary.main,
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.35)}`,
                          },
                          '&:not(.Mui-selected):hover': {
                            borderColor: alpha(theme.palette.primary.main, 0.5),
                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                          },
                        },
                      }}
                    >
                      <ToggleButton value="serif">{t('appearance:sections.typography.serif')}</ToggleButton>
                      <ToggleButton value="sans">{t('appearance:sections.typography.sans')}</ToggleButton>
                      <ToggleButton value="custom">{t('appearance:sections.typography.custom')}</ToggleButton>
                    </ToggleButtonGroup>
                  </FormControl>

                  <FormControl fullWidth>
                    <FormLabel
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        mb: 1.5,
                        color: 'text.primary',
                      }}
                    >
                      <LayersIcon sx={{ fontSize: '1rem' }} />
                      {t('appearance:sections.typography.uiDensity')}
                    </FormLabel>
                    <ToggleButtonGroup
                      exclusive
                      value={uiDensity}
                      onChange={(_, value) => value && setUiDensity(value)}
                      fullWidth
                      sx={{
                        '& .MuiToggleButton-root': {
                          py: 1.2,
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          borderRadius: 2,
                          border: `2px solid ${alpha(theme.palette.divider, 0.3)}`,
                          transition: 'all 0.3s ease',
                          '&.Mui-selected': {
                            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                            color: '#fff',
                            borderColor: theme.palette.primary.main,
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.35)}`,
                          },
                          '&:not(.Mui-selected):hover': {
                            borderColor: alpha(theme.palette.primary.main, 0.5),
                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                          },
                        },
                      }}
                    >
                      <ToggleButton value="compact">{t('appearance:sections.typography.compact')}</ToggleButton>
                      <ToggleButton value="comfortable">{t('appearance:sections.typography.comfortable')}</ToggleButton>
                      <ToggleButton value="spacious">{t('appearance:sections.typography.spacious')}</ToggleButton>
                    </ToggleButtonGroup>
                  </FormControl>

                  <FormControl fullWidth>
                    <FormLabel
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        mb: 1.5,
                        color: 'text.primary',
                      }}
                    >
                      <AnimationIcon sx={{ fontSize: '1rem' }} />
                      {t('appearance:sections.typography.animations')}
                    </FormLabel>
                    <ToggleButtonGroup
                      exclusive
                      value={motionMode}
                      onChange={(_, value) => value && setMotionMode(value)}
                      fullWidth
                      sx={{
                        '& .MuiToggleButton-root': {
                          py: 1.5,
                          fontWeight: 600,
                          borderRadius: 2,
                          border: `2px solid ${alpha(theme.palette.divider, 0.3)}`,
                          transition: 'all 0.3s ease',
                          '&.Mui-selected': {
                            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                            color: '#fff',
                            borderColor: theme.palette.primary.main,
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.35)}`,
                          },
                          '&:not(.Mui-selected):hover': {
                            borderColor: alpha(theme.palette.primary.main, 0.5),
                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                          },
                        },
                      }}
                    >
                      <ToggleButton value="full">{t('appearance:sections.typography.motionFull')}</ToggleButton>
                      <ToggleButton value="reduced">{t('appearance:sections.typography.motionReduced')}</ToggleButton>
                    </ToggleButtonGroup>
                  </FormControl>
                </Stack>
              </GlassCard>

              <GlassCard sx={{ p: 3 }}>
                <SectionHeader
                  icon={<FontDownloadIcon sx={{ fontSize: '1.2rem' }} />}
                  title={t('appearance:sections.customFonts.title')}
                  subtitle={t('appearance:sections.customFonts.subtitle')}
                />

                <Stack spacing={2.5}>
                  <FormControl fullWidth>
                    <InputLabel id="font-preset-select-label">{t('appearance:sections.customFonts.presetLabel')}</InputLabel>
                    <Select
                      labelId="font-preset-select-label"
                      value={selectedFontPresetId}
                      label={t('appearance:sections.customFonts.presetLabel')}
                      onChange={(e) => applyFontPreset(e.target.value)}
                    >
                      {FONT_PRESET_OPTIONS.map((preset) => (
                        <MenuItem key={preset.id} value={preset.id}>
                          {t(`appearance:fontPresets.${preset.id}.label`, { defaultValue: preset.label })}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label={t('appearance:sections.customFonts.cssUrl')}
                    value={customFontCssUrlDraft}
                    onChange={(e) => setCustomFontCssUrlDraft(e.target.value)}
                    onBlur={() => flushCustomFontCssUrlDraft()}
                    placeholder={t('appearance:sections.customFonts.cssUrlPlaceholder')}
                    helperText={
                      <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{t('appearance:sections.customFonts.cssHelper')}</span>
                        {renderApplyingHint(isCustomFontCssUrlPending)}
                      </Box>
                    }
                  />

                  <TextField
                    fullWidth
                    label={t('appearance:sections.customFonts.bodyFamily')}
                    value={customBodyFontFamilyDraft}
                    onChange={(e) => setCustomBodyFontFamilyDraft(e.target.value)}
                    onBlur={() => flushCustomBodyFontFamilyDraft()}
                    placeholder={t('appearance:sections.customFonts.bodyPlaceholder')}
                    helperText={renderApplyingHint(isCustomBodyFontFamilyPending)}
                  />

                  <TextField
                    fullWidth
                    label={t('appearance:sections.customFonts.headingFamily')}
                    value={customHeadingFontFamilyDraft}
                    onChange={(e) => setCustomHeadingFontFamilyDraft(e.target.value)}
                    onBlur={() => flushCustomHeadingFontFamilyDraft()}
                    placeholder={t('appearance:sections.customFonts.headingPlaceholder')}
                    helperText={renderApplyingHint(isCustomHeadingFontFamilyPending)}
                  />

                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.08) }}>
                    <Typography sx={{ fontSize: '0.9rem', color: alpha(theme.palette.text.secondary, 0.96), lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: t('appearance:sections.customFonts.localHint') }} />
                  </Box>
                </Stack>
              </GlassCard>

              <GlassCard sx={{ p: 3 }}>
                <SectionHeader
                  icon={<TextureIcon sx={{ fontSize: '1.2rem' }} />}
                  title={t('appearance:sections.patterns.title')}
                  subtitle={t('appearance:sections.patterns.subtitle')}
                />

                <Stack spacing={3}>
                  <Box>
                    <FormLabel sx={{ mb: 1.2, display: 'block', fontWeight: 600 }}>{t('appearance:sections.patterns.panelLabel')}</FormLabel>
                    <ToggleButtonGroup
                      exclusive
                      value={panelPatternMode}
                      onChange={(_, value) => value && setPanelPatternMode(value)}
                      fullWidth
                    >
                      <ToggleButton value="none">{t('appearance:patternModes.none')}</ToggleButton>
                      <ToggleButton value="dots">{t('appearance:patternModes.dots')}</ToggleButton>
                      <ToggleButton value="grid">{t('appearance:patternModes.grid')}</ToggleButton>
                      <ToggleButton value="diagonal">{t('appearance:patternModes.diagonal')}</ToggleButton>
                      <ToggleButton value="custom">{t('appearance:patternModes.custom')}</ToggleButton>
                    </ToggleButtonGroup>
                    <AnimatedSlider
                      label={t('appearance:sections.patterns.density')}
                      value={panelPatternSize}
                      min={8}
                      max={64}
                      step={1}
                      onChange={setPanelPatternSize}
                      valueLabelFormat={(v) => `${v}px`}
                      icon={<TextureIcon sx={{ fontSize: '1rem' }} />}
                    />
                    <AnimatedSlider
                      label={t('appearance:sections.patterns.opacity')}
                      value={panelPatternOpacity}
                      min={0.03}
                      max={0.5}
                      step={0.01}
                      onChange={setPanelPatternOpacity}
                      valueLabelFormat={(v) => `${Math.round(v * 100)}%`}
                      icon={<TextureIcon sx={{ fontSize: '1rem' }} />}
                    />
                    {panelPatternMode === 'custom' && (
                      <Stack spacing={1.2}>
                        <TextField
                          fullWidth
                          label={t('appearance:sections.patterns.panelUrl')}
                          value={panelPatternUrlDraft}
                          onChange={(e) => setPanelPatternUrlDraft(e.target.value)}
                          onBlur={() => flushPanelPatternUrlDraft()}
                          placeholder={t('appearance:sections.background.imageUrlPlaceholder')}
                          helperText={renderApplyingHint(isPanelPatternUrlPending)}
                        />
                        <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => handlePatternFileUpload('panel')}>
                          {t('appearance:sections.patterns.uploadPanel')}
                        </Button>
                      </Stack>
                    )}

                    <Box
                      sx={{
                        mt: 2,
                        p: 1.5,
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.divider, 0.35)}`,
                        backgroundColor: alpha(theme.palette.background.paper, 0.65),
                        ...buildPatternPreviewStyle(
                          panelPatternMode,
                          panelPatternOpacity,
                          panelPatternSize,
                          panelPatternUrlDraft
                        ),
                      }}
                    >
                      <Typography sx={{ fontSize: '0.9rem', color: alpha(theme.palette.text.secondary, 0.97), mb: 1, lineHeight: 1.55 }}>
                        {t('appearance:sections.patterns.previewPanel')}
                      </Typography>
                      <Box
                        sx={{
                          p: 1.2,
                          borderRadius: 1.5,
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                          backgroundColor: alpha(theme.palette.background.default, 0.35),
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography sx={{ fontWeight: 600 }}>{t('appearance:sections.patterns.panelSample')}</Typography>
                        <Chip size="small" label={t(`appearance:patternModes.${panelPatternMode}`)} />
                      </Box>
                    </Box>
                  </Box>

                  <Divider />

                  <Box>
                    <FormLabel sx={{ mb: 1.2, display: 'block', fontWeight: 600 }}>{t('appearance:sections.patterns.cardLabel')}</FormLabel>
                    <ToggleButtonGroup
                      exclusive
                      value={cardPatternMode}
                      onChange={(_, value) => value && setCardPatternMode(value)}
                      fullWidth
                    >
                      <ToggleButton value="none">{t('appearance:patternModes.none')}</ToggleButton>
                      <ToggleButton value="dots">{t('appearance:patternModes.dots')}</ToggleButton>
                      <ToggleButton value="grid">{t('appearance:patternModes.grid')}</ToggleButton>
                      <ToggleButton value="diagonal">{t('appearance:patternModes.diagonal')}</ToggleButton>
                      <ToggleButton value="custom">{t('appearance:patternModes.custom')}</ToggleButton>
                    </ToggleButtonGroup>
                    <AnimatedSlider
                      label={t('appearance:sections.patterns.density')}
                      value={cardPatternSize}
                      min={8}
                      max={64}
                      step={1}
                      onChange={setCardPatternSize}
                      valueLabelFormat={(v) => `${v}px`}
                      icon={<TextureIcon sx={{ fontSize: '1rem' }} />}
                    />
                    <AnimatedSlider
                      label={t('appearance:sections.patterns.opacity')}
                      value={cardPatternOpacity}
                      min={0.03}
                      max={0.5}
                      step={0.01}
                      onChange={setCardPatternOpacity}
                      valueLabelFormat={(v) => `${Math.round(v * 100)}%`}
                      icon={<TextureIcon sx={{ fontSize: '1rem' }} />}
                    />
                    {cardPatternMode === 'custom' && (
                      <Stack spacing={1.2}>
                        <TextField
                          fullWidth
                          label={t('appearance:sections.patterns.cardUrl')}
                          value={cardPatternUrlDraft}
                          onChange={(e) => setCardPatternUrlDraft(e.target.value)}
                          onBlur={() => flushCardPatternUrlDraft()}
                          placeholder={t('appearance:sections.background.imageUrlPlaceholder')}
                          helperText={renderApplyingHint(isCardPatternUrlPending)}
                        />
                        <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => handlePatternFileUpload('card')}>
                          {t('appearance:sections.patterns.uploadCard')}
                        </Button>
                      </Stack>
                    )}

                    <Box
                      sx={{
                        mt: 2,
                        p: 1.5,
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.divider, 0.35)}`,
                        backgroundColor: alpha(theme.palette.background.paper, 0.65),
                        ...buildPatternPreviewStyle(
                          cardPatternMode,
                          cardPatternOpacity,
                          cardPatternSize,
                          cardPatternUrlDraft
                        ),
                      }}
                    >
                      <Typography sx={{ fontSize: '0.9rem', color: alpha(theme.palette.text.secondary, 0.97), mb: 1, lineHeight: 1.55 }}>
                        {t('appearance:sections.patterns.previewCard')}
                      </Typography>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          border: `1px solid ${alpha(theme.palette.secondary.main, 0.35)}`,
                          backgroundColor: alpha(theme.palette.background.default, 0.32),
                          boxShadow: '0 6px 14px rgba(0,0,0,0.18)',
                        }}
                      >
                        <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{t('appearance:sections.patterns.cardSample')}</Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
                          {t('appearance:sections.patterns.cardSampleDesc')}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Stack>
              </GlassCard>

              <GlassCard sx={{ p: 3 }}>
                <SectionHeader
                  icon={<SaveIcon sx={{ fontSize: '1.2rem' }} />}
                  title={t('appearance:sections.customThemes.title')}
                  subtitle={t('appearance:sections.customThemes.subtitle')}
                />

                <Stack spacing={2}>
                  <Box display="flex" gap={1.2}>
                    <TextField
                      fullWidth
                      label={t('appearance:sections.customThemes.nameLabel')}
                      value={customThemeName}
                      onChange={(e) => setCustomThemeName(e.target.value)}
                      placeholder={t('appearance:sections.customThemes.namePlaceholder')}
                    />
                    <DndButton
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveCustomTheme}
                      disabled={!customThemeName.trim()}
                    >
                      {t('common:save')}
                    </DndButton>
                  </Box>

                  <Stack spacing={1}>
                    {customThemes.length === 0 && (
                      <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                        {t('appearance:sections.customThemes.empty')}
                      </Typography>
                    )}
                    {customThemes.map((customTheme) => {
                      const active = selectedCustomThemeId === customTheme.id;
                      return (
                        <Box
                          key={customTheme.id}
                          sx={{
                            p: 1.2,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            border: `1px solid ${active ? alpha(theme.palette.success.main, 0.5) : alpha(theme.palette.divider, 0.4)}`,
                            bgcolor: active ? alpha(theme.palette.success.main, 0.08) : alpha(theme.palette.background.paper, 0.4),
                          }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700, color: 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {customTheme.name}
                            </Typography>
                            <Typography sx={{ fontSize: '0.86rem', color: alpha(theme.palette.text.secondary, 0.97), lineHeight: 1.45 }}>
                              {new Date(customTheme.createdAt).toLocaleString()}
                            </Typography>
                          </Box>
                          <Button size="small" variant={active ? 'contained' : 'outlined'} onClick={() => applyCustomTheme(customTheme.id)}>
                            {active ? t('appearance:sections.customThemes.active') : t('appearance:sections.customThemes.apply')}
                          </Button>
                          <IconButton size="small" onClick={() => deleteCustomTheme(customTheme.id)} sx={{ color: 'error.main' }}>
                            <DeleteForeverIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      );
                    })}
                  </Stack>
                </Stack>
              </GlassCard>
            </Stack>

            {/* RIGHT COLUMN */}
            <Stack
              spacing={3}
              sx={{
                minWidth: 0,
                position: { xs: 'static', lg: 'sticky' },
                top: { lg: 88 },
                alignSelf: 'start',
                height: 'fit-content',
              }}
            >
              
              {/* LIVE PREVIEW CARD */}
              <AppearanceLivePreview currentPreset={currentPreset} />

              {/* CURRENT PARAMETERS CARD */}
              <GlassCard sx={{ p: 3 }}>
                <SectionHeader
                  icon={<TuneIcon sx={{ fontSize: '1.2rem' }} />}
                  title={t('appearance:sections.currentParams.title')}
                  subtitle={t('appearance:sections.currentParams.subtitle')}
                />

                <Stack spacing={1.5}>
                  {[
                    { id: 'interfaceType', label: t('appearance:summary.labels.interfaceType'), value: interfaceStyleLabel(interfaceStyle), color: theme.palette.secondary.main },
                    { id: 'autoPalette', label: t('appearance:summary.labels.autoPalette'), value: autoApplyRecommendedPalette ? t('appearance:summary.on') : t('appearance:summary.off'), color: theme.palette.info.main },
                    { id: 'paletteMatch', label: t('appearance:summary.labels.paletteMatch'), value: currentPaletteCompatibility.label, color: theme.palette.info.main },
                    { id: 'preset', label: t('appearance:summary.labels.preset'), value: themePresetLabel(themePreset, currentPreset.label), color: theme.palette.primary.main },
                    { id: 'surface', label: t('appearance:summary.labels.surface'), value: surfaceMode === 'glass' ? t('appearance:sections.surfaces.glass') : t('appearance:sections.surfaces.solid'), color: theme.palette.info.main },
                    { id: 'font', label: t('appearance:summary.labels.font'), value: fontMode === 'serif' ? t('appearance:sections.typography.serif') : fontMode === 'sans' ? t('appearance:sections.typography.sans') : t('appearance:sections.typography.custom'), color: theme.palette.text.primary },
                    { id: 'density', label: t('appearance:summary.labels.density'), value: uiDensity === 'compact' ? t('appearance:sections.typography.compact') : uiDensity === 'comfortable' ? t('appearance:sections.typography.comfortable') : t('appearance:sections.typography.spacious'), color: theme.palette.success.main },
                    { id: 'animations', label: t('appearance:summary.labels.animations'), value: motionMode === 'full' ? t('appearance:sections.typography.motionFull') : t('appearance:sections.typography.motionReduced'), color: theme.palette.warning.main },
                    { id: 'transparency', label: t('appearance:summary.labels.transparency'), value: `${Math.round(transparency * 100)}%`, color: theme.palette.secondary.main },
                    { id: 'blur', label: t('appearance:summary.labels.blur'), value: `${blur}px`, color: theme.palette.secondary.main },
                    { id: 'cornerRadius', label: t('appearance:summary.labels.cornerRadius'), value: `${borderRadius}px`, color: theme.palette.text.secondary },
                    { id: 'customFont', label: t('appearance:summary.labels.customFont'), value: fontMode === 'custom' ? t('appearance:summary.yes') : t('appearance:summary.no'), color: fontMode === 'custom' ? theme.palette.success.main : theme.palette.text.disabled },
                    { id: 'patternPaper', label: t('appearance:summary.labels.patternPaper'), value: t(`appearance:patternModes.${panelPatternMode}`), color: theme.palette.info.main },
                    { id: 'patternCard', label: t('appearance:summary.labels.patternCard'), value: t(`appearance:patternModes.${cardPatternMode}`), color: theme.palette.info.main },
                    { id: 'savedThemes', label: t('appearance:summary.labels.savedThemes'), value: String(customThemes.length), color: theme.palette.primary.main },
                    { id: 'homeBg', label: t('appearance:summary.labels.homeBg'), value: homeBackgroundImage ? t('appearance:sections.background.chipSet') : t('appearance:sections.background.chipUnset'), color: homeBackgroundImage ? theme.palette.success.main : theme.palette.text.disabled },
                    { id: 'homeBgOpacity', label: t('appearance:summary.labels.homeBgOpacity'), value: `${Math.round(homeBackgroundOpacity * 100)}%`, color: theme.palette.text.secondary },
                  ].map((param) => (
                    <Box
                      key={param.id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 0.75,
                        px: 1.5,
                        borderRadius: 1.5,
                        backgroundColor: alpha(param.color, 0.06),
                        borderLeft: `3px solid ${param.color}`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha(param.color, 0.1),
                          pl: 2,
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.82rem',
                          fontWeight: 500,
                        }}
                      >
                        {param.label}
                      </Typography>
                      <Typography
                        sx={{
                          color: param.color,
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          fontFamily: '"Roboto Mono", monospace',
                        }}
                      >
                        {param.value}
                      </Typography>
                    </Box>
                  ))}
                </Stack>

                <Divider sx={{ my: 2.5, borderColor: alpha(theme.palette.divider, 0.3) }} />

                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.info.main, 0.06),
                    border: `1px dashed ${alpha(theme.palette.info.main, 0.3)}`,
                  }}
                >
                  <Typography
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.82rem',
                      lineHeight: 1.6,
                      display: 'flex',
                      gap: 1,
                    }}
                  >
                    <AutoAwesomeIcon sx={{ color: 'info.main', fontSize: '1.1rem', flexShrink: 0, mt: 0.2 }} />
                    <span>{t('appearance:sections.currentParams.footerNote')}</span>
                  </Typography>
                </Box>
              </GlassCard>

              {/* RECOMMENDATIONS CARD */}
              <GlassCard sx={{ p: 3 }}>
                <SectionHeader
                  icon={<AutoAwesomeIcon sx={{ fontSize: '1.2rem' }} />}
                  title={t('appearance:sections.recommendations.title')}
                  subtitle={t('appearance:sections.recommendations.subtitle')}
                />

                <Stack spacing={2}>
                  {[
                    {
                      tip: t('appearance:sections.recommendations.tips.palettes'),
                      icon: '🎯',
                      color: theme.palette.primary.main,
                    },
                    {
                      tip: t('appearance:sections.recommendations.tips.lessGlass'),
                      icon: '🧱',
                      color: theme.palette.info.main,
                    },
                    {
                      tip: t('appearance:sections.recommendations.tips.darkArt'),
                      icon: '🖼️',
                      color: theme.palette.warning.main,
                    },
                    {
                      tip: t('appearance:sections.recommendations.tips.busyBg'),
                      icon: '💧',
                      color: theme.palette.secondary.main,
                    },
                    {
                      tip: t('appearance:sections.recommendations.tips.cinematic'),
                      icon: '✨',
                      color: theme.palette.success.main,
                    },
                  ].map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: alpha(item.color, 0.04),
                        borderLeft: `3px solid ${item.color}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: alpha(item.color, 0.08),
                          transform: 'translateX(4px)',
                        },
                      }}
                    >
                      <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>{item.icon}</Typography>
                      <Typography
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.84rem',
                          lineHeight: 1.5,
                          '& strong': {
                            color: item.color,
                            fontWeight: 700,
                          },
                        }}
                        dangerouslySetInnerHTML={{
                          __html: item.tip.replace(
                            /\*\*(.*?)\*\*/g,
                            '<strong>$1</strong>'
                          ),
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </GlassCard>
            </Stack>
          </Box>
        </Fade>
      </Box>

      <CreateColorThemeDialog
        open={customPaletteDialogOpen}
        onClose={() => {
          setCustomPaletteDialogOpen(false);
          setEditingPaletteId(null);
          setEditingPaletteValues(null);
        }}
        onSave={handleSaveCustomPalette}
        initialValues={editingPaletteValues}
        mode={editingPaletteId ? 'edit' : 'create'}
      />
    </Box>
  );
};
