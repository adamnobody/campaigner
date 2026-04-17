import React from 'react';
import { Box, Typography, Button, Divider, IconButton, useTheme, alpha } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';
import PentagonIcon from '@mui/icons-material/Pentagon';
import { sxDivider, sxSectionLabel, sxPanelRoot, hexToRgb, territoryTotalPointCount } from './mapUtils';
import type { Territory, FactionOption } from './mapUtils';

type Props = {
  selectedTerritory: Territory;
  faction: FactionOption | null | undefined;
  onClose: () => void;
  onNavigateToFaction: (factionId: number) => void;
  onEditTerritory: (territory: Territory) => void;
  onDeleteTerritory: (territory: Territory) => void;
  onStartEditingPoints: (territory: Territory) => void;
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

  return (
    <Box sx={{ ...sxPanelRoot(theme), backgroundColor: alpha(theme.palette.background.paper, 0.95), backdropFilter: 'blur(20px)' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: '8px',
          backgroundColor: `rgba(${hexToRgb(selectedTerritory.color)}, 0.3)`,
          border: `2px solid ${selectedTerritory.borderColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <PentagonIcon sx={{ fontSize: 20, color: selectedTerritory.color }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedTerritory.name}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Территория · контуров: {selectedTerritory.rings.length}, точек: {territoryTotalPointCount(selectedTerritory)}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {selectedTerritory.description && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={sxSectionLabel(theme)}>Описание</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, lineHeight: 1.6 }}>
              {selectedTerritory.description}
            </Typography>
          </Box>
        )}

        <Divider sx={sxDivider(theme)} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={sxSectionLabel(theme)}>Принадлежность</Typography>
          {faction ? (
            <Box
              onClick={() => onNavigateToFaction(faction.id)}
              sx={{
                mt: 1, p: 1.5, borderRadius: 1,
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
                  {faction.kind === 'state' ? 'Государство' : 'Фракция'}
                </Typography>
              </Box>
              <OpenInNewIcon sx={{ fontSize: 16, color: `rgba(${hexToRgb(faction.color)}, 0.5)` }} />
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.disabled', mt: 0.5, fontStyle: 'italic' }}>
              Не привязана к государству/фракции
            </Typography>
          )}
        </Box>

        <Divider sx={sxDivider(theme)} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={sxSectionLabel(theme)}>Визуальные параметры</Typography>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Цвет заливки</Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: selectedTerritory.color }} />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{selectedTerritory.color}</Typography>
              </Box>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Прозрачность</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{Math.round(selectedTerritory.opacity * 100)}%</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Цвет границы</Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: selectedTerritory.borderColor }} />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{selectedTerritory.borderColor}</Typography>
              </Box>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Толщина границы</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{selectedTerritory.borderWidth}px</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button fullWidth variant="outlined" startIcon={<EditIcon />} size="small"
            onClick={() => onEditTerritory(selectedTerritory)}
            sx={{ borderColor: theme.palette.divider, color: 'text.secondary' }}>
            Настройки
          </Button>
          <Button variant="outlined" size="small"
            onClick={() => onDeleteTerritory(selectedTerritory)}
            sx={{ borderColor: alpha(theme.palette.error.main, 0.2), color: alpha(theme.palette.error.main, 0.6), minWidth: 'auto', px: 1.5,
              '&:hover': { borderColor: alpha(theme.palette.error.main, 0.4), backgroundColor: alpha(theme.palette.error.main, 0.05) } }}>
            <DeleteIcon fontSize="small" />
          </Button>
        </Box>
        <Button fullWidth variant="outlined" startIcon={<EditIcon />} size="small"
          onClick={() => onStartEditingPoints(selectedTerritory)}
          sx={{ borderColor: alpha(theme.palette.warning.main, 0.3), color: theme.palette.warning.main,
            '&:hover': { borderColor: alpha(theme.palette.warning.main, 0.5), backgroundColor: alpha(theme.palette.warning.main, 0.05) } }}>
          Редактировать форму
        </Button>
      </Box>
    </Box>
  );
};
