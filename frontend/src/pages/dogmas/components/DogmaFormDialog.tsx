import React from 'react';
import {
  TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Box, FormControl, Select, MenuItem, Switch, Typography, IconButton, alpha, useTheme,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CloseIcon from '@mui/icons-material/Close';
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
  tagsStr,
  setTagsStr,
  tagsInput,
  setTagsInput,
  existingTagNames,
  onSave,
}) => {
  const { t } = useTranslation(['dogmas', 'common']);
  const theme = useTheme();
  const rowSx = {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: '140px minmax(0, 1fr)' },
    gap: { xs: 0.75, sm: 2.5 },
    alignItems: 'center',
    minHeight: 54,
    px: 2.25,
    py: 1.25,
    backgroundColor: alpha(theme.palette.common.white, 0.025),
    '& + &': { borderTop: `1px solid ${theme.campaigner.surface.border}` },
  };
  const fieldSx = {
    '& .MuiInputBase-root': { fontSize: '0.82rem' },
    '& .MuiInputBase-input': { py: 0.5 },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          border: `1px solid ${theme.campaigner.surface.border}`,
          backgroundColor: theme.palette.background.paper,
          backgroundImage: 'none',
          boxShadow: '0 34px 90px rgba(0,0,0,.7)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3.5,
          py: 2.5,
          borderBottom: `1px solid ${theme.campaigner.surface.border}`,
          fontFamily: theme.campaigner.typography.display,
          fontSize: '1.65rem',
          fontWeight: 600,
        }}
      >
        <span>{editingDogma ? t('dogmas:form.editTitle') : t('dogmas:form.createTitle')}</span>
        <IconButton onClick={onClose} size="small" aria-label={t('common:cancel')}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: 3.5, pt: '24px !important', pb: 0 }}>
        <Box
          sx={{
            overflow: 'hidden',
            borderRadius: '12px',
            border: `1px solid ${theme.campaigner.surface.border}`,
          }}
        >
          <Box sx={rowSx}>
            <Typography sx={{ fontSize: '0.81rem' }}>{t('dogmas:form.fields.title')}</Typography>
            <TextField
              autoFocus
              fullWidth
              variant="standard"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t('dogmas:form.placeholders.title')}
              InputProps={{ disableUnderline: true }}
              sx={fieldSx}
            />
          </Box>
          <Box sx={rowSx}>
            <Typography sx={{ fontSize: '0.81rem' }}>{t('dogmas:form.fields.category')}</Typography>
            <FormControl fullWidth variant="standard">
              <Select
                value={category}
                onChange={e => setCategory(e.target.value)}
                disableUnderline
                sx={fieldSx}
                inputProps={{ 'aria-label': t('dogmas:form.fields.category') }}
              >
              {DOGMA_CATEGORIES.map(cat => (
                <MenuItem key={cat} value={cat}>
                  {DOGMA_CATEGORY_ICONS[cat]} {t(`dogmas:categories.${cat}`)}
                </MenuItem>
              ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={{ fontSize: '0.81rem' }}>{t('dogmas:form.fields.importance')}</Typography>
            <FormControl fullWidth variant="standard">
              <Select
                value={importance}
                onChange={e => setImportance(e.target.value)}
                disableUnderline
                sx={fieldSx}
                inputProps={{ 'aria-label': t('dogmas:form.fields.importance') }}
              >
              {DOGMA_IMPORTANCE.map(imp => (
                <MenuItem key={imp} value={imp}>{t(`dogmas:importance.${imp}`)}</MenuItem>
              ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ ...rowSx, alignItems: 'start' }}>
            <Typography sx={{ fontSize: '0.81rem', pt: 1 }}>
              {t('dogmas:tagField.label')}
            </Typography>
            <TagAutocompleteField
              options={existingTagNames}
              value={tagsStr}
              pendingInput={tagsInput}
              label=""
              placeholder={t('dogmas:tagField.placeholder')}
              onValueChange={setTagsStr}
              onPendingInputChange={setTagsInput}
            />
          </Box>
        </Box>

        <Box sx={{ pt: 2.5, display: 'grid', gap: 2 }}>
          <TextField
            fullWidth
            label={t('dogmas:form.fields.description')}
            value={description}
            onChange={e => setDescription(e.target.value)}
            multiline
            rows={3}
            placeholder={t('dogmas:form.placeholders.description')}
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              fullWidth
              label={t('dogmas:form.fields.impact')}
              value={impact}
              onChange={e => setImpact(e.target.value)}
              multiline
              rows={3}
              placeholder={t('dogmas:form.placeholders.impact')}
            />
            <TextField
              fullWidth
              label={t('dogmas:form.fields.exceptions')}
              value={exceptions}
              onChange={e => setExceptions(e.target.value)}
              multiline
              rows={3}
              placeholder={t('dogmas:form.placeholders.exceptions')}
            />
          </Box>
        </Box>

        <Box
          component="label"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mt: 2.25,
            p: 1.5,
            border: `1px solid ${theme.campaigner.surface.border}`,
            borderRadius: '12px',
            backgroundColor: theme.campaigner.surface.subtle,
            cursor: 'pointer',
          }}
        >
          <Switch checked={isPublic} onChange={e => setIsPublic(e.target.checked)} size="small" />
          {isPublic
            ? <VisibilityIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            : <VisibilityOffIcon sx={{ fontSize: 18, color: 'text.disabled' }} />}
          <Typography sx={{ flex: 1, fontSize: '0.81rem' }}>
            {isPublic ? t('dogmas:visibility.public') : t('dogmas:visibility.secret')}
          </Typography>
          <Typography sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
            {t('dogmas:visibility.playerHint')}
          </Typography>
        </Box>
        <Typography sx={{ color: 'text.disabled', fontSize: '0.7rem', pt: 1 }}>
          {t('dogmas:tagField.helperText')}
        </Typography>
      </DialogContent>
      <DialogActions
        sx={{
          px: 3.5,
          py: 2.25,
          mt: 2,
          borderTop: `1px solid ${theme.campaigner.surface.border}`,
        }}
      >
        <Button onClick={onClose} color="inherit">{t('common:cancel')}</Button>
        <DndButton variant="contained" onClick={onSave} disabled={!title.trim()}>
          {editingDogma ? t('common:save') : t('common:create')}
        </DndButton>
      </DialogActions>
    </Dialog>
  );
};
