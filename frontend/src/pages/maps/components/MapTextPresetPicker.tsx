import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Menu,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import {
  STANDARD_TEXT_PRESET_ID,
  listTextPresetsWithStandard,
  type MapTextStylePreset,
} from '../canvas/textPresets';

type Props = {
  userPresets: MapTextStylePreset[];
  selectedPresetId: string | null;
  onSelectPreset: (presetId: string) => void;
};

const previewFontSize = (fontSize: number): number => Math.min(26, Math.max(14, fontSize * 0.72));

export const MapTextPresetPicker: React.FC<Props> = ({
  userPresets,
  selectedPresetId,
  onSelectPreset,
}) => {
  const theme = useTheme();
  const { t } = useTranslation(['map']);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const allPresets = useMemo(
    () => listTextPresetsWithStandard(userPresets, t('map:textPanel.presetStandard')),
    [t, userPresets],
  );

  const buttonLabel = useMemo(() => {
    if (!selectedPresetId) return t('map:textPanel.presetCustom');
    return allPresets.find((preset) => preset.id === selectedPresetId)?.name
      ?? t('map:textPanel.presetCustom');
  }, [allPresets, selectedPresetId, t]);

  const previewSample = t('map:textPanel.presetPreviewSample');

  return (
    <Box sx={{ minWidth: 0, width: '100%' }}>
      <Button
        fullWidth
        variant="outlined"
        size="small"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        endIcon={<ArrowDropDownIcon />}
        aria-haspopup="listbox"
        aria-expanded={open}
        sx={{
          justifyContent: 'space-between',
          textTransform: 'none',
          minWidth: 0,
          borderColor: alpha(theme.palette.primary.main, 0.45),
          color: 'text.primary',
        }}
      >
        <Box sx={{ textAlign: 'left', minWidth: 0, overflow: 'hidden' }}>
          <Typography variant="caption" color="text.secondary" display="block" noWrap>
            {t('map:textPanel.preset')}
          </Typography>
          <Typography variant="body2" fontWeight={600} noWrap>
            {buttonLabel}
          </Typography>
        </Box>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              width: Math.max(anchorEl?.clientWidth ?? 280, 280),
              maxWidth: 'calc(100vw - 32px)',
              maxHeight: 360,
              overflowY: 'auto',
              overflowX: 'hidden',
              p: 1,
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
            },
          },
        }}
      >
        {allPresets.map((preset) => {
          const selected = preset.id === selectedPresetId;
          return (
            <Box
              key={preset.id}
              component="button"
              type="button"
              onClick={() => {
                onSelectPreset(preset.id);
                setAnchorEl(null);
              }}
              sx={{
                display: 'block',
                width: '100%',
                mb: 0.75,
                p: 1.25,
                border: `1px solid ${selected
                  ? alpha(theme.palette.primary.main, 0.75)
                  : alpha(theme.palette.divider, 0.9)}`,
                borderRadius: 1.5,
                backgroundColor: selected
                  ? alpha(theme.palette.primary.main, 0.14)
                  : alpha(theme.palette.background.default, 0.65),
                color: theme.palette.text.primary,
                cursor: 'pointer',
                textAlign: 'left',
                boxSizing: 'border-box',
                font: 'inherit',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <Typography
                component="span"
                variant="body2"
                sx={{
                  display: 'block',
                  fontWeight: 700,
                  letterSpacing: 0.4,
                  color: 'text.primary',
                  fontSize: '0.82rem',
                  lineHeight: 1.35,
                }}
              >
                {preset.name}
              </Typography>
              <Typography
                sx={{
                  mt: 0.75,
                  fontFamily: '"Crimson Text", serif',
                  fontSize: previewFontSize(preset.fontSize),
                  lineHeight: 1.2,
                  color: preset.fill,
                  opacity: preset.opacity,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {previewSample}
              </Typography>
            </Box>
          );
        })}
      </Menu>
    </Box>
  );
};
