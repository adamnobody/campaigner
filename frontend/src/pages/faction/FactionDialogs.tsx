import React from 'react';
import {
  Box, TextField, Button, Dialog,
  DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { DndButton } from '@/components/ui/DndButton';
import {
  FACTION_KIND_ICONS,
  FACTION_RELATION_TYPES, FACTION_RELATION_LABELS, FACTION_RELATION_COLORS,
} from '@campaigner/shared';
import type { FactionRank, FactionMember } from '@campaigner/shared';

// ==================== Types ====================

interface FactionRankForm {
  name: string;
  level: number;
  description: string;
  icon: string;
  color: string;
}

interface FactionMemberForm {
  characterId: string;
  rankId: string;
  role: string;
  joinedDate: string;
  notes: string;
}

interface FactionRelationForm {
  targetFactionId: string;
  relationType: string;
  customLabel: string;
  description: string;
}

// ==================== Dialog props ====================

const DIALOG_PAPER_PROPS = {
  sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' },
} as const;

// ==================== Rank Dialog ====================

export interface FactionRankDialogProps {
  open: boolean;
  onClose: () => void;
  form: FactionRankForm;
  onFormChange: React.Dispatch<React.SetStateAction<FactionRankForm>>;
  onSubmit: () => void;
  editingRank: FactionRank | null;
}

export const FactionRankDialog: React.FC<FactionRankDialogProps> = ({
  open, onClose, form, onFormChange, onSubmit, editingRank,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={DIALOG_PAPER_PROPS}>
    <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>{editingRank ? 'Редактировать ранг' : 'Новый ранг'}</DialogTitle>
    <DialogContent>
      <TextField fullWidth label="Название *" value={form.name} onChange={e => onFormChange(p => ({ ...p, name: e.target.value }))} margin="normal" />
      <TextField fullWidth label="Уровень" value={form.level} onChange={e => onFormChange(p => ({ ...p, level: parseInt(e.target.value) || 0 }))} margin="normal" type="number" />
      <TextField fullWidth label="Описание" value={form.description} onChange={e => onFormChange(p => ({ ...p, description: e.target.value }))} margin="normal" multiline rows={2} />
      <Box display="flex" gap={2}>
        <TextField fullWidth label="Иконка" value={form.icon} onChange={e => onFormChange(p => ({ ...p, icon: e.target.value }))} margin="normal" placeholder="👑" />
        <TextField fullWidth label="Цвет" value={form.color || '#000000'} onChange={e => onFormChange(p => ({ ...p, color: e.target.value }))} margin="normal" type="color" InputLabelProps={{ shrink: true }} />
      </Box>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onClose} color="inherit">Отмена</Button>
      <DndButton variant="contained" onClick={onSubmit} disabled={!form.name.trim()}>{editingRank ? 'Сохранить' : 'Создать'}</DndButton>
    </DialogActions>
  </Dialog>
);

// ==================== Member Dialog ====================

export interface FactionMemberDialogProps {
  open: boolean;
  onClose: () => void;
  form: FactionMemberForm;
  onFormChange: React.Dispatch<React.SetStateAction<FactionMemberForm>>;
  onSubmit: () => void;
  allCharacters: any[];
  currentMembers: FactionMember[];
  currentRanks: FactionRank[];
}

export const FactionMemberDialog: React.FC<FactionMemberDialogProps> = ({
  open, onClose, form, onFormChange, onSubmit, allCharacters, currentMembers, currentRanks,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={DIALOG_PAPER_PROPS}>
    <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>Добавить члена</DialogTitle>
    <DialogContent>
      <FormControl fullWidth margin="normal">
        <InputLabel>Персонаж *</InputLabel>
        <Select value={form.characterId} label="Персонаж *" onChange={e => onFormChange(p => ({ ...p, characterId: e.target.value }))}>
          {allCharacters.filter((ch: any) => !currentMembers.some(m => m.characterId === ch.id)).map((ch: any) => (
            <MenuItem key={ch.id} value={String(ch.id)}>{ch.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth margin="normal">
        <InputLabel>Ранг</InputLabel>
        <Select value={form.rankId} label="Ранг" onChange={e => onFormChange(p => ({ ...p, rankId: e.target.value }))}>
          <MenuItem value="">Без ранга</MenuItem>
          {currentRanks.map(r => <MenuItem key={r.id} value={String(r.id)}>{r.icon || '⭐'} {r.name} (ур. {r.level})</MenuItem>)}
        </Select>
      </FormControl>
      <TextField fullWidth label="Роль / Должность" value={form.role} onChange={e => onFormChange(p => ({ ...p, role: e.target.value }))} margin="normal" placeholder="напр. Казначей" />
      <TextField fullWidth label="Дата вступления" value={form.joinedDate} onChange={e => onFormChange(p => ({ ...p, joinedDate: e.target.value }))} margin="normal" />
      <TextField fullWidth label="Заметки" value={form.notes} onChange={e => onFormChange(p => ({ ...p, notes: e.target.value }))} margin="normal" multiline rows={2} />
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onClose} color="inherit">Отмена</Button>
      <DndButton variant="contained" onClick={onSubmit} disabled={!form.characterId}>Добавить</DndButton>
    </DialogActions>
  </Dialog>
);

// ==================== Relation Dialog ====================

export interface FactionRelationDialogProps {
  open: boolean;
  onClose: () => void;
  form: FactionRelationForm;
  onFormChange: React.Dispatch<React.SetStateAction<FactionRelationForm>>;
  onSubmit: () => void;
  otherFactions: Array<{ id: number; name: string; kind: 'state' | 'faction' }>;
}

export const FactionRelationDialog: React.FC<FactionRelationDialogProps> = ({
  open, onClose, form, onFormChange, onSubmit, otherFactions,
}) => (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={DIALOG_PAPER_PROPS}>
      <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>Добавить связь</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal">
          <InputLabel>Сущность *</InputLabel>
          <Select value={form.targetFactionId} label="Сущность *" onChange={e => onFormChange(p => ({ ...p, targetFactionId: e.target.value }))}>
            {otherFactions.map(f => <MenuItem key={f.id} value={String(f.id)}>{FACTION_KIND_ICONS[f.kind] || '🏴'} {f.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel>Тип отношений</InputLabel>
          <Select value={form.relationType} label="Тип отношений" onChange={e => onFormChange(p => ({ ...p, relationType: e.target.value }))}>
            {FACTION_RELATION_TYPES.map(t => (
              <MenuItem key={t} value={t}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: FACTION_RELATION_COLORS[t] }} />
                  {FACTION_RELATION_LABELS[t]}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {form.relationType === 'custom' && (
          <TextField fullWidth label="Название связи" value={form.customLabel} onChange={e => onFormChange(p => ({ ...p, customLabel: e.target.value }))} margin="normal" />
        )}
        <TextField fullWidth label="Описание" value={form.description} onChange={e => onFormChange(p => ({ ...p, description: e.target.value }))} margin="normal" multiline rows={2} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">Отмена</Button>
        <DndButton variant="contained" onClick={onSubmit} disabled={!form.targetFactionId}>Добавить</DndButton>
      </DialogActions>
    </Dialog>
);
