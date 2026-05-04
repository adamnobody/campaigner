import React from 'react';
import {
  Box, TextField, Button, Dialog,
  DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { alpha, type Theme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { DndButton } from '@/components/ui/DndButton';
import {
  DYNASTY_FAMILY_RELATION_TYPES,
  DYNASTY_EVENT_IMPORTANCE, DYNASTY_EVENT_IMPORTANCE_COLORS,
} from '@campaigner/shared';
import type { DynastyMember, DynastyEvent } from '@campaigner/shared';

// ==================== Types ====================

interface DynastyMemberForm {
  characterId: string;
  generation: number;
  role: string;
  birthDate: string;
  deathDate: string;
  isMainLine: boolean;
  notes: string;
}

interface DynastyFamilyLinkForm {
  sourceCharacterId: string;
  targetCharacterId: string;
  relationType: string;
  customLabel: string;
}

interface DynastyEventForm {
  title: string;
  description: string;
  eventDate: string;
  importance: string;
  sortOrder: number;
}

// ==================== Dialog props ====================

const DIALOG_PAPER_PROPS = {
  sx: (theme: Theme) => ({
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
  }),
};

// ==================== Member Dialog ====================

export interface DynastyMemberDialogProps {
  open: boolean;
  onClose: () => void;
  form: DynastyMemberForm;
  onFormChange: React.Dispatch<React.SetStateAction<DynastyMemberForm>>;
  onSubmit: () => void;
  allCharacters: any[];
  currentMembers: DynastyMember[];
}

export const DynastyMemberDialog: React.FC<DynastyMemberDialogProps> = ({
  open, onClose, form, onFormChange, onSubmit, allCharacters, currentMembers,
}) => {
  const { t } = useTranslation(['dynasties', 'common']);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={DIALOG_PAPER_PROPS}>
      <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>{t('dynasties:dialogs.member.title')}</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal">
          <InputLabel>{t('dynasties:dialogs.member.character')}</InputLabel>
          <Select value={form.characterId} label={t('dynasties:dialogs.member.character')} onChange={e => onFormChange(p => ({ ...p, characterId: e.target.value as string }))}>
            {allCharacters.filter((ch: any) => !currentMembers.some(m => m.characterId === ch.id)).map((ch: any) => (
              <MenuItem key={ch.id} value={String(ch.id)}>{ch.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField fullWidth label={t('dynasties:dialogs.member.generation')} value={form.generation}
          onChange={e => onFormChange(p => ({ ...p, generation: parseInt(e.target.value) || 0 }))}
          margin="normal" type="number" helperText={t('dynasties:dialogs.member.generationHelper')} />
        <TextField fullWidth label={t('dynasties:dialogs.member.role')} value={form.role}
          onChange={e => onFormChange(p => ({ ...p, role: e.target.value }))}
          margin="normal" placeholder={t('dynasties:dialogs.member.rolePlaceholder')} />
        <Box display="flex" gap={2}>
          <TextField fullWidth label={t('dynasties:dialogs.member.birthDate')} value={form.birthDate}
            onChange={e => onFormChange(p => ({ ...p, birthDate: e.target.value }))} margin="normal" />
          <TextField fullWidth label={t('dynasties:dialogs.member.deathDate')} value={form.deathDate}
            onChange={e => onFormChange(p => ({ ...p, deathDate: e.target.value }))} margin="normal" />
        </Box>
        <FormControl fullWidth margin="normal">
          <InputLabel>{t('dynasties:dialogs.member.line')}</InputLabel>
          <Select value={form.isMainLine ? 'main' : 'branch'} label={t('dynasties:dialogs.member.line')}
            onChange={e => onFormChange(p => ({ ...p, isMainLine: e.target.value === 'main' }))}>
            <MenuItem value="main">{t('dynasties:dialogs.member.lineMain')}</MenuItem>
            <MenuItem value="branch">{t('dynasties:dialogs.member.lineBranch')}</MenuItem>
          </Select>
        </FormControl>
        <TextField fullWidth label={t('dynasties:dialogs.member.notes')} value={form.notes}
          onChange={e => onFormChange(p => ({ ...p, notes: e.target.value }))} margin="normal" multiline rows={2} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">{t('common:cancel')}</Button>
        <DndButton variant="contained" onClick={onSubmit} disabled={!form.characterId}>{t('common:add')}</DndButton>
      </DialogActions>
    </Dialog>
  );
};

// ==================== Family Link Dialog ====================

export interface DynastyFamilyLinkDialogProps {
  open: boolean;
  onClose: () => void;
  form: DynastyFamilyLinkForm;
  onFormChange: React.Dispatch<React.SetStateAction<DynastyFamilyLinkForm>>;
  onSubmit: () => void;
  currentMembers: DynastyMember[];
}

export const DynastyFamilyLinkDialog: React.FC<DynastyFamilyLinkDialogProps> = ({
  open, onClose, form, onFormChange, onSubmit, currentMembers,
}) => {
  const { t } = useTranslation(['dynasties', 'common']);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={DIALOG_PAPER_PROPS}>
      <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>{t('dynasties:dialogs.familyLink.title')}</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal">
          <InputLabel>{t('dynasties:dialogs.familyLink.from')}</InputLabel>
          <Select value={form.sourceCharacterId} label={t('dynasties:dialogs.familyLink.from')}
            onChange={e => onFormChange(p => ({ ...p, sourceCharacterId: e.target.value as string }))}>
            {currentMembers.map(m => (
              <MenuItem key={m.characterId} value={String(m.characterId)}>{m.characterName || `ID: ${m.characterId}`}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel>{t('dynasties:dialogs.familyLink.relationType')}</InputLabel>
          <Select value={form.relationType} label={t('dynasties:dialogs.familyLink.relationType')}
            onChange={e => onFormChange(p => ({ ...p, relationType: e.target.value as string }))}>
            {DYNASTY_FAMILY_RELATION_TYPES.map((rel) => (
              <MenuItem key={rel} value={rel}>{t(`dynasties:familyRelationTypes.${rel}`, { defaultValue: rel })}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel>{t('dynasties:dialogs.familyLink.to')}</InputLabel>
          <Select value={form.targetCharacterId} label={t('dynasties:dialogs.familyLink.to')}
            onChange={e => onFormChange(p => ({ ...p, targetCharacterId: e.target.value as string }))}>
            {currentMembers
              .filter(m => String(m.characterId) !== form.sourceCharacterId)
              .map(m => (
                <MenuItem key={m.characterId} value={String(m.characterId)}>{m.characterName || `ID: ${m.characterId}`}</MenuItem>
              ))}
          </Select>
        </FormControl>
        <TextField fullWidth label={t('dynasties:dialogs.familyLink.customLabel')} value={form.customLabel}
          onChange={e => onFormChange(p => ({ ...p, customLabel: e.target.value }))}
          margin="normal" placeholder={t('dynasties:dialogs.familyLink.customLabelPlaceholder')} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">{t('common:cancel')}</Button>
        <DndButton variant="contained" onClick={onSubmit}
          disabled={!form.sourceCharacterId || !form.targetCharacterId}>{t('common:add')}</DndButton>
      </DialogActions>
    </Dialog>
  );
};

// ==================== Event Dialog ====================

export interface DynastyEventDialogProps {
  open: boolean;
  onClose: () => void;
  form: DynastyEventForm;
  onFormChange: React.Dispatch<React.SetStateAction<DynastyEventForm>>;
  onSubmit: () => void;
  editingEvent: DynastyEvent | null;
}

export const DynastyEventDialog: React.FC<DynastyEventDialogProps> = ({
  open, onClose, form, onFormChange, onSubmit, editingEvent,
}) => {
  const { t } = useTranslation(['dynasties', 'common']);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={DIALOG_PAPER_PROPS}>
      <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>
        {editingEvent ? t('dynasties:dialogs.event.titleEdit') : t('dynasties:dialogs.event.titleNew')}
      </DialogTitle>
      <DialogContent>
        <TextField fullWidth label={t('dynasties:detail.fields.eventTitle')} value={form.title}
          onChange={e => onFormChange(p => ({ ...p, title: e.target.value }))} margin="normal" />
        <TextField fullWidth label={t('dynasties:detail.fields.eventDate')} value={form.eventDate}
          onChange={e => onFormChange(p => ({ ...p, eventDate: e.target.value }))} margin="normal"
          placeholder={t('dynasties:detail.placeholders.eventDate')} />
        <FormControl fullWidth margin="normal">
          <InputLabel>{t('dynasties:detail.fields.eventImportance')}</InputLabel>
          <Select value={form.importance} label={t('dynasties:detail.fields.eventImportance')}
            onChange={e => onFormChange(p => ({ ...p, importance: e.target.value }))}>
            {DYNASTY_EVENT_IMPORTANCE.map(imp => (
              <MenuItem key={imp} value={imp}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: DYNASTY_EVENT_IMPORTANCE_COLORS[imp] }} />
                  {t(`dynasties:eventImportance.${imp}`, { defaultValue: imp })}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField fullWidth label={t('dynasties:detail.fields.eventDescription')} value={form.description}
          onChange={e => onFormChange(p => ({ ...p, description: e.target.value }))} margin="normal" multiline rows={3} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">{t('common:cancel')}</Button>
        <DndButton variant="contained" onClick={onSubmit}
          disabled={!form.title.trim() || !form.eventDate.trim()}>
          {editingEvent ? t('common:save') : t('common:add')}
        </DndButton>
      </DialogActions>
    </Dialog>
  );
};
