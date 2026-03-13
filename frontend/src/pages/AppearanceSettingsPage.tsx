import React from 'react';
import {
  Box, Typography, Card, CardContent, 
  Stack, ToggleButton, ToggleButtonGroup,
  Slider, FormControl, FormLabel,
  Divider, Button, Chip,
} from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';
import BlurOnIcon from '@mui/icons-material/BlurOn';
import RoundedCornerIcon from '@mui/icons-material/RoundedCorner';
import AnimationIcon from '@mui/icons-material/Animation';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ViewCompactIcon from '@mui/icons-material/ViewCompact';
import LayersIcon from '@mui/icons-material/Layers';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { usePreferencesStore, type ThemePreset } from '@/store/usePreferencesStore';
import { THEME_PRESETS } from '@/theme/presets';
import { DndButton } from '@/components/ui/DndButton';

const presetOrder: ThemePreset[] = [
  'obsidian-gold',
  'midnight-cyan',
  'royal-violet',
  'ember-crimson',
];

export const AppearanceSettingsPage: React.FC = () => {
  const {
    themePreset, surfaceMode, fontMode, uiDensity,
    motionMode, transparency, blur, borderRadius,
    setThemePreset, setSurfaceMode, setFontMode, 
    setUiDensity, setMotionMode, setTransparency, 
    setBlur, setBorderRadius, resetAppearance,
  } = usePreferencesStore();

  const currentPreset = THEME_PRESETS[themePreset];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', minWidth: 0 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        gap={2}
        mb={3}
        flexWrap="wrap"
      >
        <Box>
          <Typography
            sx={{
              fontFamily: '"Cinzel", serif',
              fontWeight: 700,
              fontSize: '1.8rem',
              color: 'text.primary',
            }}
          >
            Настройки внешнего вида
          </Typography>
          <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>
            Управляйте темой, прозрачностью, анимациями и общим стилем всего приложения.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RestartAltIcon />}
          onClick={resetAppearance}
        >
          Сбросить стиль
        </Button>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.2fr) minmax(320px, 0.8fr)' },
          gap: 3,
          minWidth: 0,
        }}
      >
        <Stack spacing={3} sx={{ minWidth: 0 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <PaletteIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6">Цветовая тема</Typography>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 1.5,
                }}
              >
                {presetOrder.map((presetId) => {
                  const preset = THEME_PRESETS[presetId];
                  const selected = presetId === themePreset;

                  return (
                    <Card
                      key={preset.id}
                      onClick={() => setThemePreset(preset.id)}
                      sx={{
                        cursor: 'pointer',
                        border: selected
                          ? '1px solid'
                          : '1px solid transparent',
                        borderColor: selected ? 'primary.main' : 'divider',
                        transition: 'all 180ms ease',
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box
                          sx={{
                            height: 64,
                            borderRadius: 2,
                            mb: 1.5,
                            background: `
                              ${preset.backgroundAccent},
                              linear-gradient(135deg, ${preset.background} 0%, rgba(${preset.panelBaseRgb}, 0.95) 100%)
                            `,
                            border: `1px solid rgba(${preset.borderRgb}, 0.25)`,
                          }}
                        />
                        <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                          <Typography fontWeight={600}>{preset.label}</Typography>
                          {selected && <Chip label="Активна" size="small" color="primary" />}
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <LayersIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6">Поверхности</Typography>
              </Box>

              <FormControl fullWidth>
                <FormLabel sx={{ mb: 1 }}>Стиль панелей</FormLabel>
                <ToggleButtonGroup
                  exclusive
                  value={surfaceMode}
                  onChange={(_, value) => value && setSurfaceMode(value)}
                  fullWidth
                >
                  <ToggleButton value="glass">Стекло</ToggleButton>
                  <ToggleButton value="solid">Плотный</ToggleButton>
                </ToggleButtonGroup>
              </FormControl>

              <Box mt={3}>
                <FormLabel>Прозрачность</FormLabel>
                <Slider
                  value={transparency}
                  min={0.35}
                  max={0.95}
                  step={0.01}
                  onChange={(_, value) => setTransparency(value as number)}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(v) => `${Math.round(v * 100)}%`}
                  sx={{ mt: 1 }}
                />
              </Box>

              <Box mt={3}>
                <FormLabel>Размытие</FormLabel>
                <Slider
                  value={blur}
                  min={0}
                  max={24}
                  step={1}
                  onChange={(_, value) => setBlur(value as number)}
                  valueLabelDisplay="auto"
                  sx={{ mt: 1 }}
                />
              </Box>

              <Box mt={3}>
                <FormLabel>Радиус углов</FormLabel>
                <Slider
                  value={borderRadius}
                  min={6}
                  max={24}
                  step={1}
                  onChange={(_, value) => setBorderRadius(value as number)}
                  valueLabelDisplay="auto"
                  sx={{ mt: 1 }}
                />
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <TextFieldsIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6">Типографика и ритм</Typography>
              </Box>

              <Stack spacing={3}>
                <FormControl fullWidth>
                  <FormLabel sx={{ mb: 1 }}>Основной стиль текста</FormLabel>
                  <ToggleButtonGroup
                    exclusive
                    value={fontMode}
                    onChange={(_, value) => value && setFontMode(value)}
                    fullWidth
                  >
                    <ToggleButton value="serif">Serif</ToggleButton>
                    <ToggleButton value="sans">Sans</ToggleButton>
                  </ToggleButtonGroup>
                </FormControl>

                <FormControl fullWidth>
                  <FormLabel sx={{ mb: 1 }}>Плотность интерфейса</FormLabel>
                  <ToggleButtonGroup
                    exclusive
                    value={uiDensity}
                    onChange={(_, value) => value && setUiDensity(value)}
                    fullWidth
                  >
                    <ToggleButton value="compact">Компактно</ToggleButton>
                    <ToggleButton value="comfortable">Обычно</ToggleButton>
                    <ToggleButton value="spacious">Свободно</ToggleButton>
                  </ToggleButtonGroup>
                </FormControl>

                <FormControl fullWidth>
                  <FormLabel sx={{ mb: 1 }}>Анимации</FormLabel>
                  <ToggleButtonGroup
                    exclusive
                    value={motionMode}
                    onChange={(_, value) => value && setMotionMode(value)}
                    fullWidth
                  >
                    <ToggleButton value="full">Плавные</ToggleButton>
                    <ToggleButton value="reduced">Минимальные</ToggleButton>
                  </ToggleButtonGroup>
                </FormControl>
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        <Stack spacing={3} sx={{ minWidth: 0 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Предпросмотр
              </Typography>

              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  background: `
                    ${currentPreset.backgroundAccent},
                    linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))
                  `,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"Cinzel", serif',
                    fontWeight: 700,
                    fontSize: '1.35rem',
                    mb: 1,
                  }}
                >
                  Башня Архимага
                </Typography>

                <Typography sx={{ color: 'text.secondary', mb: 2 }}>
                  Древняя башня, скрытая среди туманных скал. Внутри хранятся карты, записи
                  экспедиций и забытые трактаты о магии.
                </Typography>

                <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                  <Chip label="Локация" size="small" />
                  <Chip label="Магия" size="small" />
                  <Chip label="Тайна" size="small" />
                </Box>

                <Box display="flex" gap={1} flexWrap="wrap">
                  <DndButton variant="contained">Открыть</DndButton>
                  <DndButton variant="outlined">Подробнее</DndButton>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <BlurOnIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6">Текущие параметры</Typography>
              </Box>

              <Stack spacing={1.25}>
                <Typography color="text.secondary">
                  Пресет: <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>{currentPreset.label}</Box>
                </Typography>
                <Typography color="text.secondary">
                  Поверхность: <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>{surfaceMode}</Box>
                </Typography>
                <Typography color="text.secondary">
                  Шрифт: <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>{fontMode}</Box>
                </Typography>
                <Typography color="text.secondary">
                  Плотность: <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>{uiDensity}</Box>
                </Typography>
                <Typography color="text.secondary">
                  Анимации: <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>{motionMode}</Box>
                </Typography>
                <Typography color="text.secondary">
                  Прозрачность: <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>{Math.round(transparency * 100)}%</Box>
                </Typography>
                <Typography color="text.secondary">
                  Blur: <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>{blur}px</Box>
                </Typography>
                <Typography color="text.secondary">
                  Радиус: <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>{borderRadius}px</Box>
                </Typography>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Typography sx={{ color: 'text.secondary' }}>
                Эти настройки применяются ко всему приложению и сохраняются локально для пользователя.
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <AnimationIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6">Рекомендации</Typography>
              </Box>

              <Stack spacing={1.5}>
                <Typography sx={{ color: 'text.secondary' }}>
                  • Для строгого интерфейса лучше подходят пресеты <b>Obsidian Gold</b> и <b>Midnight Cyan</b>.
                </Typography>
                <Typography sx={{ color: 'text.secondary' }}>
                  • Если хочется меньше “стекла” — переключи режим поверхности на <b>Плотный</b>.
                </Typography>
                <Typography sx={{ color: 'text.secondary' }}>
                  • Для более кинематографичного вида хорошо работает blur 10–16 и прозрачность 65–78%.
                </Typography>
                <Typography sx={{ color: 'text.secondary' }}>
                  • Если интерфейс должен быть максимально собранным — ставь compact + reduced motion.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Box>
  );
};