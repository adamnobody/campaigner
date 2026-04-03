import React, { useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  FormLabel,
  Divider,
  Button,
  Chip,
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
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { THEME_PRESETS } from '@/theme/presets';
import { DndButton } from '@/components/ui/DndButton';
import { motion } from 'framer-motion';

import {
  presetOrder,
  safeRgba,
  FloatingOrb,
  GlassCard,
  SectionHeader,
  AnimatedSlider,
} from '@/pages/appearance/AppearancePrimitives';
import { AppearanceLivePreview } from '@/pages/appearance/AppearanceLivePreview';

export const AppearanceSettingsPage: React.FC = () => {
  const theme = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);

  const {
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
    resetAppearance,
  } = usePreferencesStore();

  const currentPreset = THEME_PRESETS[themePreset];

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
          setHomeBackgroundImage(result);
        }
      };
      reader.readAsDataURL(file);
    };

    input.click();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
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
                transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
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
                    Настройки внешнего вида
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
                    Управляйте темой, прозрачностью, анимациями и фоном
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
              Сбросить стиль
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
              transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
              transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s`,
            }}
          >
            {/* LEFT COLUMN */}
            <Stack spacing={3} sx={{ minWidth: 0 }}>
              
              {/* COLOR THEMES SECTION */}
              <GlassCard sx={{ p: 3 }}>
                <SectionHeader
                  icon={<PaletteIcon sx={{ fontSize: '1.2rem' }} />}
                  title="Цветовая тема"
                  subtitle={`${presetOrder.length} уникальных палитр`}
                />

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
                    gap: 2,
                  }}
                >
                  {presetOrder.map((presetId, index) => {
                    const preset = THEME_PRESETS[presetId];
                    const selected = presetId === themePreset;
                    const hovered = hoveredPreset === presetId;

                    return (
                      <Tooltip
                        key={preset.id}
                        title={preset.label}
                        arrow
                        placement="top"
                      >
                        <Box
                          onClick={() => setThemePreset(preset.id)}
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
                                fontSize: '0.78rem',
                                color: selected ? theme.palette.primary.main : 'text.primary',
                                letterSpacing: '0.03em',
                                lineHeight: 1.2,
                              }}
                            >
                              {preset.label}
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
                                АКТИВНА
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Tooltip>
                    );
                  })}
                </Box>
              </GlassCard>

              {/* BACKGROUND SECTION */}
              <GlassCard sx={{ p: 3 }}>
                <SectionHeader
                  icon={<WallpaperIcon sx={{ fontSize: '1.2rem' }} />}
                  title="Фон главной страницы"
                  subtitle="Персонализируйте стартовый экран"
                />

                <Stack spacing={2.5}>
                  <TextField
                    fullWidth
                    label="Ссылка на изображение"
                    value={homeBackgroundImage || ''}
                    onChange={(e) => setHomeBackgroundImage(e.target.value)}
                    placeholder="https://example.com/background.jpg"
                    helperText="Можно вставить URL или загрузить файл ниже"
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
                      Загрузить файл
                    </DndButton>

                    <Button
                      variant="outlined"
                      color="inherit"
                      startIcon={<DeleteOutlineIcon />}
                      onClick={clearHomeBackgroundImage}
                      disabled={!homeBackgroundImage}
                      sx={{
                        fontWeight: 600,
                        flex: 1,
                        minWidth: 140,
                        borderColor: homeBackgroundImage ? alpha(theme.palette.error.main, 0.5) : undefined,
                        color: homeBackgroundImage ? theme.palette.error.main : undefined,
                        '&:hover:not(:disabled)': {
                          backgroundColor: alpha(theme.palette.error.main, 0.08),
                          borderColor: theme.palette.error.main,
                        },
                      }}
                    >
                      Убрать фон
                    </Button>
                  </Box>

                  <AnimatedSlider
                    label="Прозрачность фона"
                    value={homeBackgroundOpacity}
                    min={0.1}
                    max={1}
                    step={0.01}
                    onChange={setHomeBackgroundOpacity}
                    valueLabelFormat={(v) => `${Math.round(v * 100)}%`}
                    disabled={!homeBackgroundImage}
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
                      background: homeBackgroundImage
                        ? `
                          linear-gradient(rgba(0,0,0,0.32), rgba(0,0,0,0.48)),
                          url(${homeBackgroundImage})
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
                        background: homeBackgroundImage ? 'none' : `
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
                    {!homeBackgroundImage && (
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
                          Перетащите изображение или используйте кнопку выше
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
                        Главная страница Campaigner
                      </Typography>
                      <Chip
                        size="small"
                        label={homeBackgroundImage ? '✓ Фон установлен' : 'Не выбран'}
                        color={homeBackgroundImage ? 'success' : 'default'}
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
                  title="Поверхности и материалы"
                  subtitle="Настройте текстуру интерфейса"
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
                    Стиль панелей
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
                    <ToggleButton value="glass">🪟 Стекло</ToggleButton>
                    <ToggleButton value="solid">🧱 Плотный</ToggleButton>
                  </ToggleButtonGroup>
                </FormControl>

                <AnimatedSlider
                  label="Прозрачность"
                  value={transparency}
                  min={0.35}
                  max={0.95}
                  step={0.01}
                  onChange={setTransparency}
                  valueLabelFormat={(v) => `${Math.round(v * 100)}%`}
                  icon={<BlurOnIcon sx={{ fontSize: '1rem' }} />}
                />

                <AnimatedSlider
                  label="Размытие (Blur)"
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
                  label="Радиус углов"
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
                  title="Типографика и ритм"
                  subtitle="Шрифты, плотность и движение"
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
                      Основной шрифт
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
                      <ToggleButton value="serif">Serif</ToggleButton>
                      <ToggleButton value="sans">Sans-Serif</ToggleButton>
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
                      Плотность интерфейса
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
                      <ToggleButton value="compact">Компактно</ToggleButton>
                      <ToggleButton value="comfortable">Обычно</ToggleButton>
                      <ToggleButton value="spacious">Свободно</ToggleButton>
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
                      Анимации
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
                      <ToggleButton value="full">✨ Плавные</ToggleButton>
                      <ToggleButton value="reduced">⚡ Минимальные</ToggleButton>
                    </ToggleButtonGroup>
                  </FormControl>
                </Stack>
              </GlassCard>
            </Stack>

            {/* RIGHT COLUMN */}
            <Stack spacing={3} sx={{ minWidth: 0, position: 'sticky', top: 24, alignSelf: 'start' }}>
              
              {/* LIVE PREVIEW CARD */}
              <AppearanceLivePreview currentPreset={currentPreset} />

              {/* CURRENT PARAMETERS CARD */}
              <GlassCard sx={{ p: 3 }}>
                <SectionHeader
                  icon={<TuneIcon sx={{ fontSize: '1.2rem' }} />}
                  title="Текущие параметры"
                  subtitle="Все активные настройки"
                />

                <Stack spacing={1.5}>
                  {[
                    { label: 'Пресет', value: currentPreset.label, color: theme.palette.primary.main },
                    { label: 'Поверхность', value: surfaceMode === 'glass' ? '🪟 Стекло' : '🧱 Плотный', color: theme.palette.info.main },
                    { label: 'Шрифт', value: fontMode === 'serif' ? 'Serif' : 'Sans-Serif', color: theme.palette.text.primary },
                    { label: 'Плотность', value: uiDensity === 'compact' ? 'Компактно' : uiDensity === 'comfortable' ? 'Обычно' : 'Свободно', color: theme.palette.success.main },
                    { label: 'Анимации', value: motionMode === 'full' ? '✨ Плавные' : '⚡ Минимальные', color: theme.palette.warning.main },
                    { label: 'Прозрачность', value: `${Math.round(transparency * 100)}%`, color: theme.palette.secondary.main },
                    { label: 'Blur', value: `${blur}px`, color: theme.palette.secondary.main },
                    { label: 'Радиус углов', value: `${borderRadius}px`, color: theme.palette.text.secondary },
                    { label: 'Фон главной', value: homeBackgroundImage ? '✓ Установлен' : '○ Не выбран', color: homeBackgroundImage ? theme.palette.success.main : theme.palette.text.disabled },
                    { label: 'Прозрачность фона', value: `${Math.round(homeBackgroundOpacity * 100)}%`, color: theme.palette.text.secondary },
                  ].map((param) => (
                    <Box
                      key={param.label}
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
                    <span>Эти настройки применяются ко всему приложению и сохраняются локально в браузере.</span>
                  </Typography>
                </Box>
              </GlassCard>

              {/* RECOMMENDATIONS CARD */}
              <GlassCard sx={{ p: 3 }}>
                <SectionHeader
                  icon={<AutoAwesomeIcon sx={{ fontSize: '1.2rem' }} />}
                  title="Рекомендации"
                  subtitle="Советы от дизайнера"
                />

                <Stack spacing={2}>
                  {[
                    {
                      tip: 'Для строгого интерфейса лучше подходят Obsidian Gold и Midnight Cyan.',
                      icon: '🎯',
                      color: theme.palette.primary.main,
                    },
                    {
                      tip: 'Если хочется меньше "стекла" — переключи режим поверхности на Плотный.',
                      icon: '🧱',
                      color: theme.palette.info.main,
                    },
                    {
                      tip: 'Для фонового изображения лучше использовать тёмные, не слишком контрастные арты.',
                      icon: '🖼️',
                      color: theme.palette.warning.main,
                    },
                    {
                      tip: 'Если фон слишком активный — опусти его прозрачность до 20–45%.',
                      icon: '💧',
                      color: theme.palette.secondary.main,
                    },
                    {
                      tip: 'Для более кинематографичного вида хорошо работает blur 10–16 и прозрачность 65–78%.',
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
    </Box>
  );
};
