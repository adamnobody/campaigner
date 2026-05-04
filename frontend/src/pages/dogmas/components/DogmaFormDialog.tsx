import React from 'react';
import {
  TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Box, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel, Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useTranslation } from 'react-i18next';
import { DndButton } from '@/components/ui/DndButton';
import { TagAutocompleteField } from '@/components/forms/TagAutocompleteField';
import {
  DOGMA_CATEGORIES,
  DOGMA_IMPORTANCE,
  DOGMA_CATEGORY_ICONS,
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
}) => {
  const { t } = useTranslation(['dogmas', 'common']);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}>
      <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>
        {editingDogma ? t('dogmas:form.editTitle') : t('dogmas:form.createTitle')}
      </DialogTitle>
      <DialogContent>
        <TextField autoFocus fullWidth label={t('dogmas:form.fields.title')} value={title}
          onChange={e => setTitle(e.target.value)} margin="normal"
          placeholder={t('dogmas:form.placeholders.title')} />

        <Box display="flex" gap={2} mt={1}>
          <FormControl fullWidth margin="normal">
            <InputLabel>{t('dogmas:form.fields.category')}</InputLabel>
            <Select value={category} onChange={e => setCategory(e.target.value)} label={t('dogmas:form.fields.category')}>
              {DOGMA_CATEGORIES.map(cat => (
                <MenuItem key={cat} value={cat}>
                  {DOGMA_CATEGORY_ICONS[cat]} {t(`dogmas:categories.${cat}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>{t('dogmas:form.fields.importance')}</InputLabel>
            <Select value={importance} onChange={e => setImportance(e.target.value)} label={t('dogmas:form.fields.importance')}>
              {DOGMA_IMPORTANCE.map(imp => (
                <MenuItem key={imp} value={imp}>{t(`dogmas:importance.${imp}`)}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <TextField fullWidth label={t('dogmas:form.fields.icon')} value={icon}
          onChange={e => setIcon(e.target.value)} margin="normal"
          placeholder={t('dogmas:form.placeholders.icon')}
          sx={{ maxWidth: 200 }} />

        <TextField fullWidth label={t('dogmas:form.fields.description')} value={description}
          onChange={e => setDescription(e.target.value)} margin="normal"
          multiline rows={4}
          placeholder={t('dogmas:form.placeholders.description')} />

        <TextField fullWidth label={t('dogmas:form.fields.impact')} value={impact}
          onChange={e => setImpact(e.target.value)} margin="normal"
          multiline rows={3}
          placeholder={t('dogmas:form.placeholders.impact')} />

        <TextField fullWidth label={t('dogmas:form.fields.exceptions')} value={exceptions}
          onChange={e => setExceptions(e.target.value)} margin="normal"
          multiline rows={2}
          placeholder={t('dogmas:form.placeholders.exceptions')} />

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
                  {isPublic ? t('dogmas:visibility.public') : t('dogmas:visibility.secret')}
                </Typography>
              </Box>
            }
          />
        </Box>

        <TagAutocompleteField
          options={existingTagNames}
          value={tagsStr}
          pendingInput={tagsInput}
          label={t('dogmas:tagField.label')}
          placeholder={t('dogmas:tagField.placeholder')}
          helperText={t('dogmas:tagField.helperText')}
          margin="normal"
          onValueChange={setTagsStr}
          onPendingInputChange={setTagsInput}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">{t('common:cancel')}</Button>
        <DndButton variant="contained" onClick={onSave} disabled={!title.trim()}>
          {editingDogma ? t('common:save') : t('common:create')}
        </DndButton>
      </DialogActions>
    </Dialog>
  );
};
