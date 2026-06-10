import React, { useState } from 'react';
import {
  Box,
  Button,
  Popover,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import Crop75Icon from '@mui/icons-material/Crop75';
import PanoramaFishEyeIcon from '@mui/icons-material/PanoramaFishEye';
import ChangeHistoryIcon from '@mui/icons-material/ChangeHistory';
import DiamondIcon from '@mui/icons-material/Diamond';
import TimelineIcon from '@mui/icons-material/Timeline';
import CategoryIcon from '@mui/icons-material/Category';
import { useTranslation } from 'react-i18next';
import type { ShapeVariant } from '../canvas/shapeObjectForm';

type ShapeOption = {
  variant: ShapeVariant;
  icon: React.ReactNode;
  preview: React.ReactNode;
};

type Props = {
  disabled?: boolean;
  onSelect: (variant: ShapeVariant) => void;
};

export function MapAddShapeMenu({ disabled, onSelect }: Props) {
  const theme = useTheme();
  const { t } = useTranslation(['map']);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = Boolean(anchor);

  const options: ShapeOption[] = [
    {
      variant: 'rectangle',
      icon: <Crop75Icon fontSize="small" />,
      preview: (
        <Box sx={{ width: 36, height: 24, border: '2px solid currentColor', borderRadius: 0.5 }} />
      ),
    },
    {
      variant: 'ellipse',
      icon: <PanoramaFishEyeIcon fontSize="small" />,
      preview: (
        <Box sx={{ width: 36, height: 24, border: '2px solid currentColor', borderRadius: '50%' }} />
      ),
    },
    {
      variant: 'triangle',
      icon: <ChangeHistoryIcon fontSize="small" />,
      preview: (
        <Box
          sx={{
            width: 0,
            height: 0,
            borderLeft: '18px solid transparent',
            borderRight: '18px solid transparent',
            borderBottom: '26px solid currentColor',
          }}
        />
      ),
    },
    {
      variant: 'diamond',
      icon: <DiamondIcon fontSize="small" />,
      preview: (
        <Box
          sx={{
            width: 22,
            height: 22,
            border: '2px solid currentColor',
            transform: 'rotate(45deg)',
          }}
        />
      ),
    },
    {
      variant: 'line',
      icon: <TimelineIcon fontSize="small" />,
      preview: (
        <Box sx={{ width: 36, height: 2, bgcolor: 'currentColor', borderRadius: 1 }} />
      ),
    },
  ];

  const handleSelect = (variant: ShapeVariant) => {
    setAnchor(null);
    onSelect(variant);
  };

  return (
    <>
      <Tooltip title={t('map:shapePanel.addShapeTooltip')}>
        <span>
          <Button
            size="small"
            variant={open ? 'contained' : 'outlined'}
            color="primary"
            disabled={disabled}
            startIcon={<CategoryIcon fontSize="small" />}
            onClick={(event) => setAnchor(event.currentTarget)}
            sx={{
              minWidth: 0,
              px: 1.25,
              py: 0.35,
              fontSize: '0.75rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {t('map:shapePanel.addShape')}
          </Button>
        </span>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.75,
              p: 1.5,
              width: 280,
              backgroundColor: alpha(theme.palette.background.paper, 0.98),
              backdropFilter: 'blur(12px)',
              border: `1px solid ${theme.palette.divider}`,
            },
          },
        }}
      >
        <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary', fontWeight: 600 }}>
          {t('map:shapePanel.addShapeTitle')}
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 1,
          }}
        >
          {options.map((option) => (
            <Button
              key={option.variant}
              variant="outlined"
              onClick={() => handleSelect(option.variant)}
              sx={{
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.75,
                py: 1.25,
                px: 1,
                textTransform: 'none',
                color: 'text.primary',
                borderColor: alpha(theme.palette.primary.main, 0.25),
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme.palette.primary.light,
                }}
              >
                {option.preview}
              </Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                {option.icon}
                <Typography variant="caption" fontWeight={600}>
                  {t(`map:shapePanel.variants.${option.variant}`)}
                </Typography>
              </Box>
            </Button>
          ))}
        </Box>
      </Popover>
    </>
  );
}
