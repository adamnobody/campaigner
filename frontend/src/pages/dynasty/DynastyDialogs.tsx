import React from 'react';
import {
  Box, TextField, Button, Dialog,
  DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { DndButton } from '@/components/ui/DndButton';
import {
  DYNASTY_FAMILY_RELATION_TYPES, DYNASTY_FAMILY_RELATION_LABELS,
  DYNASTY_EVENT_IMPORTANCE, DYNASTY_EVENT_IMPORTANCE_LABELS, DYNASTY_EVENT_IMPORTANCE_COLORS,
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
  sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' },
} as const;

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
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={DIALOG_PAPER_PROPS}>
    <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>Добавить члена династии</DialogTitle>
    <DialogContent>
      <FormControl fullWidth margin="normal">
        <InputLabel>Персонаж *</InputLabel>
        <Select value={form.characterId} label="Персонаж *" onChange={e => onFormChange(p => ({ ...p, characterId: e.target.value as string }))}>
          {allCharacters.filter((ch: any) => !currentMembers.some(m => m.characterId === ch.id)).map((ch: any) => (
            <MenuItem key={ch.id} value={String(ch.id)}>{ch.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField fullWidth label="Поколение" value={form.generation}
        onChange={e => onFormChange(p => ({ ...p, generation: parseInt(e.target.value) || 0 }))}
        margin="normal" type="number" helperText="0 = основатели, 1 = дети, 2 = внуки..." />
      <TextField fullWidth label="Роль в династии" value={form.role}
        onChange={e => onFormChange(p => ({ ...p, role: e.target.value }))}
        margin="normal" placeholder="напр. Основатель, Глава, Наследник, Младший сын" />
      <Box display="flex" gap={2}>
        <TextField fullWidth label="Дата рождения" value={form.birthDate}
          onChange={e => onFormChange(p => ({ ...p, birthDate: e.target.value }))} margin="normal" />
        <TextField fullWidth label="Дата смерти" value={form.deathDate}
          onChange={e => onFormChange(p => ({ ...p, deathDate: e.target.value }))} margin="normal" />
      </Box>
      <FormControl fullWidth margin="normal">
        <InputLabel>Линия</InputLabel>
        <Select value={form.isMainLine ? 'main' : 'branch'} label="Линия"
          onChange={e => onFormChange(p => ({ ...p, isMainLine: e.target.value === 'main' }))}>
          <MenuItem value="main">Главная линия</MenuItem>
          <MenuItem value="branch">Боковая ветвь</MenuItem>
        </Select>
      </FormControl>
      <TextField fullWidth label="Заметки" value={form.notes}
        onChange={e => onFormChange(p => ({ ...p, notes: e.target.value }))} margin="normal" multiline rows={2} />
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onClose} color="inherit">Отмена</Button>
      <DndButton variant="contained" onClick={onSubmit} disabled={!form.characterId}>Добавить</DndButton>
    </DialogActions>
  </Dialog>
);

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
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={DIALOG_PAPER_PROPS}>
    <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>Добавить родственную связь</DialogTitle>
    <DialogContent>
      <FormControl fullWidth margin="normal">
        <InputLabel>От кого *</InputLabel>
        <Select value={form.sourceCharacterId} label="От кого *"
          onChange={e => onFormChange(p => ({ ...p, sourceCharacterId: e.target.value as string }))}>
          {currentMembers.map(m => (
            <MenuItem key={m.characterId} value={String(m.characterId)}>{m.characterName || `ID: ${m.characterId}`}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth margin="normal">
        <InputLabel>Тип связи</InputLabel>
        <Select value={form.relationType} label="Тип связи"
          onChange={e => onFormChange(p => ({ ...p, relationType: e.target.value as string }))}>
          {DYNASTY_FAMILY_RELATION_TYPES.map(t => (
            <MenuItem key={t} value={t}>{DYNASTY_FAMILY_RELATION_LABELS[t]}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth margin="normal">
        <InputLabel>К кому *</InputLabel>
        <Select value={form.targetCharacterId} label="К кому *"
          onChange={e => onFormChange(p => ({ ...p, targetCharacterId: e.target.value as string }))}>
          {currentMembers
            .filter(m => String(m.characterId) !== form.sourceCharacterId)
            .map(m => (
              <MenuItem key={m.characterId} value={String(m.characterId)}>{m.characterName || `ID: ${m.characterId}`}</MenuItem>
            ))}
        </Select>
      </FormControl>
      <TextField fullWidth label="Пользовательская подпись" value={form.customLabel}
        onChange={e => onFormChange(p => ({ ...p, customLabel: e.target.value }))}
        margin="normal" placeholder="напр. Приёмный сын" />
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onClose} color="inherit">Отмена</Button>
      <DndButton variant="contained" onClick={onSubmit}
        disabled={!form.sourceCharacterId || !form.targetCharacterId}>Добавить</DndButton>
    </DialogActions>
  </Dialog>
);

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
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={DIALOG_PAPER_PROPS}>
    <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>{editingEvent ? 'Редактировать событие' : 'Новое событие'}</DialogTitle>
    <DialogContent>
      <TextField fullWidth label="Название *" value={form.title}
        onChange={e => onFormChange(p => ({ ...p, title: e.target.value }))} margin="normal" />
      <TextField fullWidth label="Дата *" value={form.eventDate}
        onChange={e => onFormChange(p => ({ ...p, eventDate: e.target.value }))} margin="normal"
        placeholder="напр. 3-я эпоха, 2941 год" />
      <FormControl fullWidth margin="normal">
        <InputLabel>Важность</InputLabel>
        <Select value={form.importance} label="Важность"
          onChange={e => onFormChange(p => ({ ...p, importance: e.target.value }))}>
          {DYNASTY_EVENT_IMPORTANCE.map(imp => (
            <MenuItem key={imp} value={imp}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: DYNASTY_EVENT_IMPORTANCE_COLORS[imp] }} />
                {DYNASTY_EVENT_IMPORTANCE_LABELS[imp]}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField fullWidth label="Описание" value={form.description}
        onChange={e => onFormChange(p => ({ ...p, description: e.target.value }))} margin="normal" multiline rows={3} />
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onClose} color="inherit">Отмена</Button>
      <DndButton variant="contained" onClick={onSubmit}
        disabled={!form.title.trim() || !form.eventDate.trim()}>
        {editingEvent ? 'Сохранить' : 'Добавить'}
      </DndButton>
    </DialogActions>
  </Dialog>
);
