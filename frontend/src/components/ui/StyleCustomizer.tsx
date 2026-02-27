import React, { useState, useRef } from 'react';
import {
  Box, Typography, Drawer, IconButton, Slider,
  TextField, Button, Divider, Select, MenuItem,
  FormControl, InputLabel, Tooltip, Paper,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import { useStyleStore } from '@/store/useStyleStore';

const accentColors = [
  { label: 'Синий', value: 'rgba(130,130,255,0.9)' },
  { label: 'Золотой', value: 'rgba(201,169,89,0.9)' },
  { label: 'Зелёный', value: 'rgba(130,255,160,0.9)' },
  { label: 'Красный', value: 'rgba(255,130,130,0.9)' },
  { label: 'Бирюзовый', value: 'rgba(78,205,196,0.9)' },
  { label: 'Фиолетовый', value: 'rgba(187,143,206,0.9)' },
  { label: 'Оранжевый', value: 'rgba(240,178,122,0.9)' },
];

const fonts = [
  { label: 'Cinzel (DnD)', value: '"Cinzel", "Georgia", serif' },
  { label: 'Georgia', value: '"Georgia", serif' },
  { label: 'Crimson Text', value: '"Crimson Text", serif' },
  { label: 'Inter', value: '"Inter", sans-serif' },
  { label: 'Roboto', value: '"Roboto", sans-serif' },
  { label: 'Playfair Display', value: '"Playfair Display", serif' },
];

export const StyleCustomizer: React.FC = () => {
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    backgroundImage, backgroundOpacity, accentColor,
    cardBackground, textOpacity, headerFont,
    setBackgroundImage, setBackgroundOpacity, setAccentColor,
    setCardBackground, setTextOpacity, setHeaderFont,
    resetStyles,
  } = useStyleStore();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Конвертируем в data URL для хранения в localStorage
    const reader = new FileReader();
    reader.onloadend = () => {
      setBackgroundImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUrl = (url: string) => {
    setBackgroundImage(url);
  };

  return (
    <>
      {/* Float button */}
      <Tooltip title="Настройки стиля" placement="left">
        <IconButton
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            right: 20,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1000,
            width: 44,
            height: 44,
            backgroundColor: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.5)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.8)',
            },
            transition: 'all 0.2s',
          }}
        >
          <SettingsIcon />
        </IconButton>
      </Tooltip>

      {/* Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: 340,
            backgroundColor: '#12121f',
            border: 'none',
            borderLeft: '1px solid rgba(255,255,255,0.08)',
          },
        }}
      >
        <Box sx={{ p: 3, height: '100%', overflowY: 'auto' }}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography
              sx={{
                fontFamily: '"Cinzel", serif',
                fontWeight: 700,
                fontSize: '1.2rem',
                color: '#fff',
              }}
            >
              Кастомизация
            </Typography>
            <IconButton onClick={() => setOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Background Image */}
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
            Фоновое изображение
          </Typography>

          {backgroundImage && (
            <Paper
              sx={{
                width: '100%',
                height: 120,
                mb: 1.5,
                borderRadius: 2,
                overflow: 'hidden',
                position: 'relative',
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <IconButton
                onClick={() => setBackgroundImage('')}
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  '&:hover': { backgroundColor: 'rgba(255,0,0,0.6)' },
                }}
                size="small"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Paper>
          )}

          <Box display="flex" gap={1} mb={1}>
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              size="small"
              fullWidth
              sx={{
                borderColor: 'rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'none',
                fontSize: '0.8rem',
              }}
            >
              Загрузить файл
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
            />
          </Box>

          <TextField
            fullWidth
            placeholder="Или вставьте URL изображения"
            size="small"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleImageUrl((e.target as HTMLInputElement).value);
              }
            }}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255,255,255,0.04)',
                fontSize: '0.8rem',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
              },
            }}
          />

          {/* Background opacity */}
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
            Прозрачность фона: {Math.round(backgroundOpacity * 100)}%
          </Typography>
          <Slider
            value={backgroundOpacity}
            onChange={(_, v) => setBackgroundOpacity(v as number)}
            min={0}
            max={1}
            step={0.05}
            sx={{ mb: 2, color: accentColor }}
          />

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 2 }} />

          {/* Accent color */}
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
            Акцентный цвет
          </Typography>
          <Box display="flex" gap={1} mb={2} flexWrap="wrap">
            {accentColors.map((c) => (
              <Tooltip key={c.label} title={c.label}>
                <Box
                  onClick={() => setAccentColor(c.value)}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: c.value,
                    cursor: 'pointer',
                    border: accentColor === c.value
                      ? '3px solid #fff'
                      : '2px solid transparent',
                    transition: 'border 0.2s',
                    '&:hover': { transform: 'scale(1.15)' },
                  }}
                />
              </Tooltip>
            ))}
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 2 }} />

          {/* Font */}
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
            Шрифт заголовков
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <Select
              value={headerFont}
              onChange={(e) => setHeaderFont(e.target.value)}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                color: '#fff',
              }}
            >
              {fonts.map((f) => (
                <MenuItem key={f.label} value={f.value}>
                  <Typography sx={{ fontFamily: f.value }}>{f.label}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 2 }} />

          {/* Text opacity */}
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
            Яркость текста: {Math.round(textOpacity * 100)}%
          </Typography>
          <Slider
            value={textOpacity}
            onChange={(_, v) => setTextOpacity(v as number)}
            min={0.2}
            max={1}
            step={0.05}
            sx={{ mb: 2, color: accentColor }}
          />

          {/* Card opacity */}
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
            Фон карточек
          </Typography>
          <Box display="flex" gap={1} mb={3} flexWrap="wrap">
            {[
              { label: 'Прозрачный', value: 'rgba(255,255,255,0.02)' },
              { label: 'Лёгкий', value: 'rgba(255,255,255,0.04)' },
              { label: 'Средний', value: 'rgba(255,255,255,0.08)' },
              { label: 'Плотный', value: 'rgba(255,255,255,0.12)' },
            ].map((opt) => (
              <Button
                key={opt.label}
                variant={cardBackground === opt.value ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setCardBackground(opt.value)}
                sx={{
                  borderColor: 'rgba(255,255,255,0.15)',
                  color: cardBackground === opt.value ? '#000' : 'rgba(255,255,255,0.5)',
                  backgroundColor: cardBackground === opt.value ? accentColor : 'transparent',
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.3)',
                  },
                }}
              >
                {opt.label}
              </Button>
            ))}
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 2 }} />

          {/* Preview */}
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
            Превью
          </Typography>
          <Paper
            sx={{
              p: 2,
              mb: 3,
              backgroundColor: cardBackground,
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 2,
            }}
          >
            <Typography sx={{ fontFamily: headerFont, fontWeight: 700, color: '#fff', fontSize: '1.1rem' }}>
              Название проекта
            </Typography>
            <Typography variant="body2" sx={{ color: `rgba(255,255,255,${textOpacity})`, mt: 0.5 }}>
              Описание проекта будет выглядеть так
            </Typography>
          </Paper>

          {/* Reset */}
          <Button
            fullWidth
            variant="outlined"
            startIcon={<RestartAltIcon />}
            onClick={resetStyles}
            sx={{
              borderColor: 'rgba(255,100,100,0.3)',
              color: 'rgba(255,100,100,0.8)',
              textTransform: 'none',
              '&:hover': { borderColor: 'rgba(255,100,100,0.5)' },
            }}
          >
            Сбросить всё
          </Button>
        </Box>
      </Drawer>
    </>
  );
};