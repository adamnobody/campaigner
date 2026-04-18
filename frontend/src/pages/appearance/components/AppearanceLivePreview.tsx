import React from 'react';
import {
  Box,
  Typography,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import { DndButton } from '@/components/ui/DndButton';
import { safeRgba } from '@/pages/appearance/components/AppearancePrimitives';
import { GlassCard } from '@/components/ui/GlassCard';

export interface LivePreviewProps {
  currentPreset: {
    backgroundAccent: string;
    borderRgb?: string;
    textPrimary: string;
    textSecondary: string;
    accentMain: string;
    accentStrong: string;
  };
}

export const AppearanceLivePreview: React.FC<LivePreviewProps> = ({ currentPreset }) => {
  const theme = useTheme();

  return (
    <GlassCard sx={{ p: 3 }} interactive>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontFamily: '"Cinzel", serif',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: theme.palette.success.main,
              boxShadow: `0 0 8px ${theme.palette.success.main}`,
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.5 },
              },
            }}
          />
          Превью
        </Typography>
        <Chip
          size="small"
          label="LIVE"
          sx={{
            backgroundColor: alpha(theme.palette.success.main, 0.15),
            color: theme.palette.success.main,
            fontWeight: 800,
            fontSize: '0.65rem',
            letterSpacing: '0.1em',
            height: 22,
          }}
        />
      </Box>

      <Box
        sx={{
          p: 2.5,
          borderRadius: 2.5,
          background: currentPreset.backgroundAccent,
          border: `1px solid ${safeRgba(currentPreset.borderRgb, 0.3)}`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -50,
            right: -50,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${safeRgba(currentPreset.borderRgb, 0.15)}, transparent 70%)`,
          },
        }}
      >
        <Typography
          sx={{
            fontFamily: '"Cinzel", serif',
            fontWeight: 800,
            fontSize: '1.4rem',
            mb: 1.5,
            color: currentPreset.textPrimary,
            position: 'relative',
            zIndex: 1,
          }}
        >
          Башня Архимага
        </Typography>

        <Typography
          sx={{
            color: currentPreset.textSecondary,
            mb: 2,
            fontSize: '0.88rem',
            lineHeight: 1.6,
            position: 'relative',
            zIndex: 1,
          }}
        >
          Древняя башня, скрытая среди туманных скал. Внутри хранятся карты, записи экспедиций и забытые трактаты о магии.
        </Typography>

        <Box display="flex" gap={1} flexWrap="wrap" mb={2.5} sx={{ position: 'relative', zIndex: 1 }}>
          {['Локация', 'Магия', 'Тайна'].map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              sx={{
                backgroundColor: alpha(currentPreset.accentMain, 0.15),
                color: currentPreset.accentMain,
                fontWeight: 700,
                fontSize: '0.72rem',
                border: `1px solid ${alpha(currentPreset.accentMain, 0.3)}`,
              }}
            />
          ))}
        </Box>

        <Box display="flex" gap={1.5} sx={{ position: 'relative', zIndex: 1 }}>
          <DndButton
            variant="contained"
            size="small"
            sx={{
              flex: 1,
              fontWeight: 700,
              background: `linear-gradient(135deg, ${currentPreset.accentMain}, ${currentPreset.accentStrong})`,
              boxShadow: `0 4px 12px ${alpha(currentPreset.accentMain, 0.4)}`,
            }}
          >
            Открыть
          </DndButton>
          <DndButton
            variant="outlined"
            size="small"
            sx={{
              flex: 1,
              fontWeight: 600,
              borderColor: safeRgba(currentPreset.borderRgb, 0.4),
              color: currentPreset.textSecondary,
            }}
          >
            Подробнее
          </DndButton>
        </Box>
      </Box>
    </GlassCard>
  );
};
