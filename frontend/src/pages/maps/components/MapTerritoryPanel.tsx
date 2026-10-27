import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Button, Divider, IconButton, useTheme, alpha } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';
import PentagonIcon from '@mui/icons-material/Pentagon';
import type { CanvasObject } from '@/api/canvas';
import {
  hexToRgb,
  territoryFormFromObject,
  territoryRingsFromObject,
  territoryTotalPointCount,
  sxDivider,
  sxPanelRoot,
  sxSectionLabel,
  type TerritoryFactionOption,
} from '../canvas/canvasModel';

type Props = {
  selectedTerritory: CanvasObject;
  faction: TerritoryFactionOption | null | undefined;
  onClose: () => void;
  onNavigateToFaction: (faction: TerritoryFactionOption) => void;
  onEditTerritory: (territory: CanvasObject) => void;
  onDeleteTerritory: (territory: CanvasObject) => void;
  onStartEditingPoints: (territory: CanvasObject) => void;
};

export const MapTerritoryPanel: React.FC<Props> = ({
  selectedTerritory,
  faction,
  onClose,
  onNavigateToFaction,
  onEditTerritory,
  onDeleteTerritory,
  onStartEditingPoints,
}) => {
  const theme = useTheme();
  const { t } = useTranslation(['map', 'common']);
  const form = territoryFormFromObject(selectedTerritory);
  const ringCount = territoryRingsFromObject(selectedTerritory).length;

  return (
    <Box sx={{ ...sxPanelRoot(theme), backgroundColor: alpha(theme.palette.background.default, 0.94), backdropFilter: 'blur(20px)', borderColor: theme.campaigner.surface.border }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: `1px solid ${theme.campaigner.surface.border}` }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: '8px',
          backgroundColor: `rgba(${hexToRgb(form.color)}, 0.3)`,
          border: `2px solid ${form.borderColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <PentagonIcon sx={{ fontSize: 20, color: form.color }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" sx={{ color: 'text.primary', fontSize: '1.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {form.name}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('map:territoryPanel.subtitle', {
              rings: ringCount,
              points: territoryTotalPointCount(selectedTerritory),
            })}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }} aria-label={t('common:close')}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {form.description && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={sxSectionLabel(theme)}>{t('map:territoryPanel.sectionDescription')}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, lineHeight: 1.6 }}>
              {form.description}
            </Typography>
          </Box>
        )}

        <Divider sx={sxDivider(theme)} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={sxSectionLabel(theme)}>{t('map:territoryPanel.sectionOwnership')}</Typography>
          {faction ? (
            <Box
              onClick={() => onNavigateToFaction(faction)}
              sx={{
                mt: 1, p: 1.5, borderRadius: '10px',
                backgroundColor: `rgba(${hexToRgb(faction.color)}, 0.08)`,
                border: `1px solid rgba(${hexToRgb(faction.color)}, 0.2)`,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1,
                '&:hover': { backgroundColor: `rgba(${hexToRgb(faction.color)}, 0.15)` },
              }}
            >
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: faction.color }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ color: faction.color, fontWeight: 600 }}>
                  {faction.name}
                </Typography>
                <Typography variant="caption" sx={{ color: `rgba(${hexToRgb(faction.color)}, 0.6)` }}>
                  {faction.kind === 'state' ? t('map:territoryPanel.factionKindState') : t('map:territoryPanel.factionKindFaction')}
                </Typography>
              </Box>
              <OpenInNewIcon sx={{ fontSize: 16, color: `rgba(${hexToRgb(faction.color)}, 0.5)` }} />
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.disabled', mt: 0.5, fontStyle: 'italic' }}>
              {t('map:territoryPanel.notLinkedFaction')}
            </Typography>
          )}
        </Box>

        <Divider sx={sxDivider(theme)} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={sxSectionLabel(theme)}>{t('map:territoryPanel.sectionVisual')}</Typography>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('map:territoryPanel.fillColor')}</Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: form.color }} />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{form.color}</Typography>
              </Box>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('map:territoryPanel.opacity')}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{Math.round(form.opacity * 100)}%</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('map:territoryPanel.borderColor')}</Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: form.borderColor }} />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{form.borderColor}</Typography>
              </Box>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('map:territoryPanel.borderWidth')}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{form.borderWidth}px</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ p: 2, borderTop: `1px solid ${theme.campaigner.surface.border}`, backgroundColor: theme.campaigner.surface.subtle, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button fullWidth variant="outlined" startIcon={<EditIcon />} size="small"
            onClick={() => onEditTerritory(selectedTerritory)}
            sx={{ borderColor: theme.palette.divider, color: 'text.secondary' }}>
            {t('map:territoryPanel.settings')}
          </Button>
          <Button variant="outlined" size="small"
            onClick={() => onDeleteTerritory(selectedTerritory)}
            aria-label={t('common:delete')}
            sx={{ borderColor: alpha(theme.palette.error.main, 0.2), color: alpha(theme.palette.error.main, 0.6), minWidth: 'auto', px: 1.5,
              '&:hover': { borderColor: alpha(theme.palette.error.main, 0.4), backgroundColor: alpha(theme.palette.error.main, 0.05) } }}>
            <DeleteIcon fontSize="small" />
          </Button>
        </Box>
        <Button fullWidth variant="outlined" startIcon={<EditIcon />} size="small"
          onClick={() => onStartEditingPoints(selectedTerritory)}
          sx={{ borderColor: alpha(theme.palette.warning.main, 0.3), color: theme.palette.warning.main,
            '&:hover': { borderColor: alpha(theme.palette.warning.main, 0.5), backgroundColor: alpha(theme.palette.warning.main, 0.05) } }}>
          {t('map:territoryPanel.editShape')}
        </Button>
      </Box>
    </Box>
  );
};
