import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, TextField, Button, Dialog,
  DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { alpha, type Theme } from '@mui/material/styles';
import { DndButton } from '@/components/ui/DndButton';
import {
  FACTION_KIND_ICONS,
  FACTION_RELATION_TYPES, FACTION_RELATION_COLORS,
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
  sx: (theme: Theme) => ({
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
  }),
};

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
}) => {
  const { t } = useTranslation(['factions', 'common']);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={DIALOG_PAPER_PROPS}>
      <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>
        {editingRank ? t('factions:dialogs.rank.titleEdit') : t('factions:dialogs.rank.titleNew')}
      </DialogTitle>
      <DialogContent>
        <TextField fullWidth label={t('factions:dialogs.rank.fieldName')} value={form.name} onChange={e => onFormChange(p => ({ ...p, name: e.target.value }))} margin="normal" />
        <TextField fullWidth label={t('factions:dialogs.rank.fieldLevel')} value={form.level} onChange={e => onFormChange(p => ({ ...p, level: parseInt(e.target.value) || 0 }))} margin="normal" type="number" />
        <TextField fullWidth label={t('factions:dialogs.rank.fieldDescription')} value={form.description} onChange={e => onFormChange(p => ({ ...p, description: e.target.value }))} margin="normal" multiline rows={2} />
        <Box display="flex" gap={2}>
          <TextField fullWidth label={t('factions:dialogs.rank.fieldIcon')} value={form.icon} onChange={e => onFormChange(p => ({ ...p, icon: e.target.value }))} margin="normal" placeholder="👑" />
          <TextField fullWidth label={t('factions:dialogs.rank.fieldColor')} value={form.color || '#000000'} onChange={e => onFormChange(p => ({ ...p, color: e.target.value }))} margin="normal" type="color" InputLabelProps={{ shrink: true }} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">{t('common:cancel')}</Button>
        <DndButton variant="contained" onClick={onSubmit} disabled={!form.name.trim()}>
          {editingRank ? t('common:save') : t('common:create')}
        </DndButton>
      </DialogActions>
    </Dialog>
  );
};

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
}) => {
  const { t } = useTranslation(['factions', 'common']);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={DIALOG_PAPER_PROPS}>
      <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>{t('factions:dialogs.member.title')}</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal">
          <InputLabel>{t('factions:dialogs.member.character')}</InputLabel>
          <Select value={form.characterId} label={t('factions:dialogs.member.character')} onChange={e => onFormChange(p => ({ ...p, characterId: e.target.value }))}>
            {allCharacters.filter((ch: any) => !currentMembers.some(m => m.characterId === ch.id)).map((ch: any) => (
              <MenuItem key={ch.id} value={String(ch.id)}>{ch.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel>{t('factions:dialogs.member.rank')}</InputLabel>
          <Select value={form.rankId} label={t('factions:dialogs.member.rank')} onChange={e => onFormChange(p => ({ ...p, rankId: e.target.value }))}>
            <MenuItem value="">{t('factions:dialogs.member.noRank')}</MenuItem>
            {currentRanks.map(r => (
              <MenuItem key={r.id} value={String(r.id)}>
                {t('factions:dialogs.member.rankMenuItem', { icon: r.icon || '⭐', name: r.name, level: r.level })}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField fullWidth label={t('factions:dialogs.member.role')} value={form.role} onChange={e => onFormChange(p => ({ ...p, role: e.target.value }))} margin="normal" placeholder={t('factions:dialogs.member.rolePlaceholder')} />
        <TextField fullWidth label={t('factions:dialogs.member.joinedDate')} value={form.joinedDate} onChange={e => onFormChange(p => ({ ...p, joinedDate: e.target.value }))} margin="normal" />
        <TextField fullWidth label={t('factions:dialogs.member.notes')} value={form.notes} onChange={e => onFormChange(p => ({ ...p, notes: e.target.value }))} margin="normal" multiline rows={2} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">{t('common:cancel')}</Button>
        <DndButton variant="contained" onClick={onSubmit} disabled={!form.characterId}>{t('common:add')}</DndButton>
      </DialogActions>
    </Dialog>
  );
};

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
}) => {
  const { t } = useTranslation(['factions', 'common']);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={DIALOG_PAPER_PROPS}>
      <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>{t('factions:dialogs.relation.title')}</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal">
          <InputLabel>{t('factions:dialogs.relation.entity')}</InputLabel>
          <Select value={form.targetFactionId} label={t('factions:dialogs.relation.entity')} onChange={e => onFormChange(p => ({ ...p, targetFactionId: e.target.value }))}>
            {otherFactions.map(f => <MenuItem key={f.id} value={String(f.id)}>{FACTION_KIND_ICONS[f.kind] || '🏴'} {f.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel>{t('factions:dialogs.relation.relationKind')}</InputLabel>
          <Select value={form.relationType} label={t('factions:dialogs.relation.relationKind')} onChange={e => onFormChange(p => ({ ...p, relationType: e.target.value }))}>
            {FACTION_RELATION_TYPES.map((rt) => (
              <MenuItem key={rt} value={rt}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: FACTION_RELATION_COLORS[rt] }} />
                  {t(`factions:relationTypes.${rt}`)}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {form.relationType === 'custom' && (
          <TextField fullWidth label={t('factions:dialogs.relation.customLinkName')} value={form.customLabel} onChange={e => onFormChange(p => ({ ...p, customLabel: e.target.value }))} margin="normal" />
        )}
        <TextField fullWidth label={t('factions:dialogs.relation.description')} value={form.description} onChange={e => onFormChange(p => ({ ...p, description: e.target.value }))} margin="normal" multiline rows={2} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">{t('common:cancel')}</Button>
        <DndButton variant="contained" onClick={onSubmit} disabled={!form.targetFactionId}>{t('common:add')}</DndButton>
      </DialogActions>
    </Dialog>
  );
};
