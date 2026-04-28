import React from 'react';
import {
  TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Box, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel, Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { DndButton } from '@/components/ui/DndButton';
import { TagAutocompleteField } from '@/components/forms/TagAutocompleteField';
import {
  DOGMA_CATEGORIES,
  DOGMA_IMPORTANCE,
  DOGMA_CATEGORY_LABELS,
  DOGMA_CATEGORY_ICONS,
  DOGMA_IMPORTANCE_LABELS,
} from '@campaigner/shared';
import type { Dogma } from '@campaigner/shared';

type Props = {
  open: boolean;
  onClose: () => void;
  editingDogma: Dogma | null;
  title: string;
  setTitle: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  impact: string;
  setImpact: (v: string) => void;
  exceptions: string;
  setExceptions: (v: string) => void;
  isPublic: boolean;
  setIsPublic: (v: boolean) => void;
  importance: string;
  setImportance: (v: string) => void;
  icon: string;
  setIcon: (v: string) => void;
  tagsStr: string;
  setTagsStr: (v: string) => void;
  tagsInput: string;
  setTagsInput: (v: string) => void;
  existingTagNames: string[];
  onSave: () => void;
};

export const DogmaFormDialog: React.FC<Props> = ({
  open,
  onClose,
  editingDogma,
  title,
  setTitle,
  category,
  setCategory,
  description,
  setDescription,
  impact,
  setImpact,
  exceptions,
  setExceptions,
  isPublic,
  setIsPublic,
  importance,
  setImportance,
  icon,
  setIcon,
  tagsStr,
  setTagsStr,
  tagsInput,
  setTagsInput,
  existingTagNames,
  onSave,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
    PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}>
    <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>
      {editingDogma ? 'Редактировать догму' : 'Новая догма'}
    </DialogTitle>
    <DialogContent>
      <TextField autoFocus fullWidth label="Формулировка *" value={title}
        onChange={e => setTitle(e.target.value)} margin="normal"
        placeholder="напр. Магия питается лунным светом" />

      <Box display="flex" gap={2} mt={1}>
        <FormControl fullWidth margin="normal">
          <InputLabel>Категория</InputLabel>
          <Select value={category} onChange={e => setCategory(e.target.value)} label="Категория">
            {DOGMA_CATEGORIES.map(cat => (
              <MenuItem key={cat} value={cat}>
                {DOGMA_CATEGORY_ICONS[cat]} {DOGMA_CATEGORY_LABELS[cat]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth margin="normal">
          <InputLabel>Важность</InputLabel>
          <Select value={importance} onChange={e => setImportance(e.target.value)} label="Важность">
            {DOGMA_IMPORTANCE.map(imp => (
              <MenuItem key={imp} value={imp}>{DOGMA_IMPORTANCE_LABELS[imp]}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TextField fullWidth label="Иконка (эмодзи)" value={icon}
        onChange={e => setIcon(e.target.value)} margin="normal"
        placeholder="напр. ⚡ 🌙 ⚔️"
        sx={{ maxWidth: 200 }} />

      <TextField fullWidth label="Описание" value={description}
        onChange={e => setDescription(e.target.value)} margin="normal"
        multiline rows={4}
        placeholder="Подробное описание правила, его нюансы..." />

      <TextField fullWidth label="Влияние на мир" value={impact}
        onChange={e => setImpact(e.target.value)} margin="normal"
        multiline rows={3}
        placeholder="Как это правило влияет на жизнь, политику, войны..." />

      <TextField fullWidth label="Исключения" value={exceptions}
        onChange={e => setExceptions(e.target.value)} margin="normal"
        multiline rows={2}
        placeholder="Известные исключения из этого правила..." />

      <Box display="flex" alignItems="center" gap={2} mt={2}>
        <FormControlLabel
          control={
            <Switch checked={isPublic} onChange={e => setIsPublic(e.target.checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: 'rgba(78,205,196,0.9)' },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: 'rgba(78,205,196,0.5)' },
              }} />
          }
          label={
            <Box display="flex" alignItems="center" gap={0.5}>
              {isPublic
                ? <VisibilityIcon sx={{ fontSize: 18, color: 'rgba(78,205,196,0.8)' }} />
                : <VisibilityOffIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }} />}
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {isPublic ? 'Известна жителям мира' : 'Скрыта от жителей мира'}
              </Typography>
            </Box>
          }
        />
      </Box>

      <TagAutocompleteField
        options={existingTagNames}
        value={tagsStr}
        pendingInput={tagsInput}
        label="Теги"
        placeholder="Выберите или введите..."
        helperText="Можно выбрать существующие теги или добавить новые"
        margin="normal"
        onValueChange={setTagsStr}
        onPendingInputChange={setTagsInput}
      />
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onClose} color="inherit">Отмена</Button>
      <DndButton variant="contained" onClick={onSave} disabled={!title.trim()}>
        {editingDogma ? 'Сохранить' : 'Создать'}
      </DndButton>
    </DialogActions>
  </Dialog>
);
