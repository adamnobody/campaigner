import React from 'react';
import {
  Box, Typography, TextField, Button, Dialog,
  DialogTitle, DialogContent, DialogActions,
  Slider, Autocomplete, Chip,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DndButton } from '@/components/ui/DndButton';
import { TERRITORY_COLORS, hexToRgb } from './mapUtils';
import type { Territory, FactionOption } from './mapUtils';

export type MapTerritoryFormState = {
  name: string;
  description: string;
  color: string;
  opacity: number;
  borderColor: string;
  borderWidth: number;
  smoothing: number;
  factionId: number | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  editingTerritory: Territory | null;
  territoryForm: MapTerritoryFormState;
  setTerritoryForm: React.Dispatch<React.SetStateAction<MapTerritoryFormState>>;
  factions: FactionOption[];
  onSave: () => void;
};

export const MapTerritoryDialog: React.FC<Props> = ({
  open,
  onClose,
  editingTerritory,
  territoryForm,
  setTerritoryForm,
  factions,
  onSave,
}) => {
  const { t } = useTranslation(['map', 'common']);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}>
      <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>
        {editingTerritory ? t('map:territoryDialog.editTitle') : t('map:territoryDialog.createTitle')}
      </DialogTitle>
      <DialogContent>
        <TextField fullWidth label={t('map:territoryDialog.fieldName')} value={territoryForm.name}
          onChange={e => setTerritoryForm(prev => ({ ...prev, name: e.target.value }))} margin="normal" />
        <TextField fullWidth label={t('map:territoryDialog.fieldDescription')} value={territoryForm.description}
          onChange={e => setTerritoryForm(prev => ({ ...prev, description: e.target.value }))}
          margin="normal" multiline rows={3} />

        <Autocomplete
          options={factions}
          getOptionLabel={o => o.name}
          value={factions.find(f => f.id === territoryForm.factionId) || null}
          onChange={(_, v) => {
            setTerritoryForm(prev => ({
              ...prev,
              factionId: v?.id || null,
              ...(v ? { color: v.color, borderColor: v.color } : {}),
            }));
          }}
          renderInput={params => (
            <TextField
              {...params}
              label={t('map:territoryDialog.factionLabel')}
              margin="normal"
              placeholder={t('map:territoryDialog.factionPlaceholder')}
            />
          )}
          renderOption={(props, option) => (
            <li {...props}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: option.color }} />
                <Typography>{option.name}</Typography>
                <Chip
                  label={option.kind === 'state' ? t('map:territoryPanel.factionKindState') : t('map:territoryPanel.factionKindFaction')}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 'auto', fontSize: '0.7rem', height: 20 }}
                />
              </Box>
            </li>
          )}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          noOptionsText={t('map:territoryDialog.noFactions')}
          clearText={t('map:territoryDialog.clear')}
          sx={{ mt: 1 }}
        />

        <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 2, mb: 1 }}>{t('map:territoryDialog.fillSwatches')}</Typography>
        <Box display="flex" gap={0.8} flexWrap="wrap">
          {TERRITORY_COLORS.map(color => (
            <Box key={color} onClick={() => setTerritoryForm(prev => ({ ...prev, color }))}
              sx={{
                width: 28, height: 28, borderRadius: '50%', backgroundColor: color, cursor: 'pointer',
                border: territoryForm.color === color ? '3px solid #fff' : '2px solid transparent',
                transition: 'all 0.15s', '&:hover': { transform: 'scale(1.2)' },
              }} />
          ))}
        </Box>

        <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 2.5, mb: 0.5 }}>
          {t('map:territoryDialog.opacitySlider', { percent: Math.round(territoryForm.opacity * 100) })}
        </Typography>
        <Slider
          value={territoryForm.opacity}
          onChange={(_, v) => setTerritoryForm(prev => ({ ...prev, opacity: v as number }))}
          min={0.05} max={1} step={0.05}
          sx={{
            color: territoryForm.color,
            '& .MuiSlider-thumb': { width: 16, height: 16 },
          }}
        />

        <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1.5, mb: 1 }}>{t('map:territoryDialog.borderColorSwatches')}</Typography>
        <Box display="flex" gap={0.8} flexWrap="wrap">
          {TERRITORY_COLORS.map(color => (
            <Box key={color} onClick={() => setTerritoryForm(prev => ({ ...prev, borderColor: color }))}
              sx={{
                width: 28, height: 28, borderRadius: '50%', backgroundColor: color, cursor: 'pointer',
                border: territoryForm.borderColor === color ? '3px solid #fff' : '2px solid transparent',
                transition: 'all 0.15s', '&:hover': { transform: 'scale(1.2)' },
              }} />
          ))}
        </Box>

        <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 2, mb: 0.5 }}>
          {t('map:territoryDialog.borderWidthSlider', { width: territoryForm.borderWidth })}
        </Typography>
        <Slider
          value={territoryForm.borderWidth}
          onChange={(_, v) => setTerritoryForm(prev => ({ ...prev, borderWidth: v as number }))}
          min={0.5} max={5} step={0.5}
          sx={{
            color: territoryForm.borderColor,
            '& .MuiSlider-thumb': { width: 16, height: 16 },
          }}
        />

        <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 2, mb: 0.5 }}>
          {t('map:territoryDialog.smoothingSlider', { percent: Math.round(territoryForm.smoothing * 100) })}
        </Typography>
        <Slider
          value={territoryForm.smoothing}
          onChange={(_, v) => setTerritoryForm(prev => ({ ...prev, smoothing: v as number }))}
          min={0} max={1} step={0.05}
          sx={{
            color: territoryForm.color,
            '& .MuiSlider-thumb': { width: 16, height: 16 },
          }}
        />

        <Box mt={2} p={2} sx={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 1 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mb: 1, display: 'block' }}>{t('map:territoryDialog.previewLabel')}</Typography>
          <svg width="100%" height="60" viewBox="0 0 200 60">
            {(() => {
              const pts = [
                { x: 20, y: 50 }, { x: 50, y: 10 }, { x: 100, y: 5 },
                { x: 150, y: 15 }, { x: 180, y: 45 }, { x: 140, y: 55 }, { x: 60, y: 55 },
              ];
              const s = territoryForm.smoothing;
              let d: string;
              if (s === 0 || pts.length < 3) {
                d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
              } else {
                const n = pts.length;
                const parts: string[] = [];
                for (let i = 0; i < n; i++) {
                  const prev = pts[(i - 1 + n) % n];
                  const curr = pts[i];
                  const next = pts[(i + 1) % n];
                  const sx1 = curr.x + (prev.x - curr.x) * s * 0.5;
                  const sy1 = curr.y + (prev.y - curr.y) * s * 0.5;
                  const ex = curr.x + (next.x - curr.x) * s * 0.5;
                  const ey = curr.y + (next.y - curr.y) * s * 0.5;
                  if (i === 0) { parts.push(`M ${ex} ${ey}`); }
                  else { parts.push(`L ${sx1} ${sy1}`); parts.push(`Q ${curr.x} ${curr.y} ${ex} ${ey}`); }
                }
                const first = pts[0], last = pts[n - 1], second = pts[1];
                parts.push(`L ${first.x + (last.x - first.x) * s * 0.5} ${first.y + (last.y - first.y) * s * 0.5}`);
                parts.push(`Q ${first.x} ${first.y} ${first.x + (second.x - first.x) * s * 0.5} ${first.y + (second.y - first.y) * s * 0.5}`);
                parts.push('Z');
                d = parts.join(' ');
              }
              return (
                <>
                  <path d={d}
                    fill={`rgba(${hexToRgb(territoryForm.color)}, ${territoryForm.opacity})`}
                    stroke={territoryForm.borderColor}
                    strokeWidth={territoryForm.borderWidth}
                    strokeLinejoin="round"
                  />
                  <text x="100" y="35" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">
                    {territoryForm.name || t('map:territoryDialog.previewNameFallback')}
                  </text>
                </>
              );
            })()}
          </svg>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">{t('common:cancel')}</Button>
        <DndButton variant="contained" onClick={onSave} disabled={!territoryForm.name.trim()}>
          {editingTerritory ? t('common:save') : t('common:create')}
        </DndButton>
      </DialogActions>
    </Dialog>
  );
};
