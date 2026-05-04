import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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

const ACCENT_PRESETS = [
  { id: 'blue', value: 'rgba(130,130,255,0.9)' },
  { id: 'gold', value: 'rgba(201,169,89,0.9)' },
  { id: 'green', value: 'rgba(130,255,160,0.9)' },
  { id: 'red', value: 'rgba(255,130,130,0.9)' },
  { id: 'teal', value: 'rgba(78,205,196,0.9)' },
  { id: 'violet', value: 'rgba(187,143,206,0.9)' },
  { id: 'orange', value: 'rgba(240,178,122,0.9)' },
] as const;

const FONT_PRESETS = [
  { id: 'cinzel', value: '"Cinzel", "Georgia", serif' },
  { id: 'georgia', value: '"Georgia", serif' },
  { id: 'crimson', value: '"Crimson Text", serif' },
  { id: 'inter', value: '"Inter", sans-serif' },
  { id: 'roboto', value: '"Roboto", sans-serif' },
  { id: 'playfair', value: '"Playfair Display", serif' },
] as const;

const CARD_SHADE_PRESETS = [
  { shade: 'transparent', value: 'rgba(255,255,255,0.02)' },
  { shade: 'light', value: 'rgba(255,255,255,0.04)' },
  { shade: 'medium', value: 'rgba(255,255,255,0.08)' },
  { shade: 'solid', value: 'rgba(255,255,255,0.12)' },
] as const;

export const StyleCustomizer: React.FC = () => {
  const { t } = useTranslation('common');
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
      <Tooltip title={t('styleCustomizer.tooltip')} placement="left">
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
              {t('styleCustomizer.title')}
            </Typography>
            <IconButton onClick={() => setOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Background Image */}
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
            {t('styleCustomizer.backgroundImage')}
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
              {t('styleCustomizer.uploadFile')}
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
            placeholder={t('styleCustomizer.imageUrlPlaceholder')}
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
            {t('styleCustomizer.backgroundOpacity', { pct: Math.round(backgroundOpacity * 100) })}
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
            {t('styleCustomizer.accentColor')}
          </Typography>
          <Box display="flex" gap={1} mb={2} flexWrap="wrap">
            {ACCENT_PRESETS.map((c) => (
              <Tooltip key={c.id} title={t(`styleCustomizer.accentNames.${c.id}`)}>
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
            {t('styleCustomizer.headerFont')}
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
              {FONT_PRESETS.map((f) => (
                <MenuItem key={f.id} value={f.value}>
                  <Typography sx={{ fontFamily: f.value }}>{t(`styleCustomizer.fontNames.${f.id}`)}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 2 }} />

          {/* Text opacity */}
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
            {t('styleCustomizer.textBrightness', { pct: Math.round(textOpacity * 100) })}
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
            {t('styleCustomizer.cardBackground')}
          </Typography>
          <Box display="flex" gap={1} mb={3} flexWrap="wrap">
            {CARD_SHADE_PRESETS.map((opt) => (
              <Button
                key={opt.shade}
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
                {t(`styleCustomizer.cardShade.${opt.shade}`)}
              </Button>
            ))}
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 2 }} />

          {/* Preview */}
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
            {t('styleCustomizer.preview')}
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
              {t('styleCustomizer.previewTitle')}
            </Typography>
            <Typography variant="body2" sx={{ color: `rgba(255,255,255,${textOpacity})`, mt: 0.5 }}>
              {t('styleCustomizer.previewDescription')}
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
            {t('styleCustomizer.resetAll')}
          </Button>
        </Box>
      </Drawer>
    </>
  );
};