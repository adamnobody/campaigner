import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete,
} from '@mui/material';
import { DndButton } from '@/components/ui/DndButton';
import { TagAutocompleteField } from '@/components/forms/TagAutocompleteField';
import type { Note } from '@campaigner/shared';

type CreateProps = {
  open: boolean;
  onClose: () => void;
  newTitle: string;
  setNewTitle: (v: string) => void;
  newTagsStr: string;
  setNewTagsStr: (v: string) => void;
  newTagsInput: string;
  setNewTagsInput: (v: string) => void;
  existingTagNames: string[];
  onCreate: () => void;
};

export const WikiCreateArticleDialog: React.FC<CreateProps> = ({
  open,
  onClose,
  newTitle,
  setNewTitle,
  newTagsStr,
  setNewTagsStr,
  newTagsInput,
  setNewTagsInput,
  existingTagNames,
  onCreate,
}) => {
  const { t } = useTranslation(['wiki', 'common']);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}
    >
      <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>{t('wiki:dialogs.create.title')}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          label={t('wiki:dialogs.create.articleTitleLabel')}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          margin="normal"
          placeholder={t('wiki:dialogs.create.articleTitlePlaceholder')}
        />

        <TagAutocompleteField
          options={existingTagNames}
          value={newTagsStr}
          pendingInput={newTagsInput}
          label={t('wiki:tagField.categoriesLabel')}
          placeholder={t('wiki:tagField.categoriesPlaceholder')}
          helperText={t('wiki:tagField.categoriesHelper')}
          margin="normal"
          onValueChange={setNewTagsStr}
          onPendingInputChange={setNewTagsInput}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          {t('common:cancel')}
        </Button>
        <DndButton variant="contained" onClick={onCreate} disabled={!newTitle.trim()}>
          {t('common:create')}
        </DndButton>
      </DialogActions>
    </Dialog>
  );
};

type TagsProps = {
  open: boolean;
  onClose: () => void;
  tagsEditNote: Note | null;
  editTagsStr: string;
  setEditTagsStr: (v: string) => void;
  editTagsInput: string;
  setEditTagsInput: (v: string) => void;
  existingTagNames: string[];
  onSave: () => void;
};

export const WikiTagsDialog: React.FC<TagsProps> = ({
  open,
  onClose,
  tagsEditNote,
  editTagsStr,
  setEditTagsStr,
  editTagsInput,
  setEditTagsInput,
  existingTagNames,
  onSave,
}) => {
  const { t } = useTranslation(['wiki', 'common']);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}
    >
      <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>
        {t('wiki:dialogs.tags.title', {
          articleTitle: tagsEditNote?.title || t('wiki:dialogs.tags.articleTitleFallback'),
        })}
      </DialogTitle>
      <DialogContent>
        <TagAutocompleteField
          options={existingTagNames}
          value={editTagsStr}
          pendingInput={editTagsInput}
          label={t('wiki:tagField.editLabel')}
          placeholder={t('wiki:tagField.editPlaceholder')}
          margin="normal"
          onValueChange={setEditTagsStr}
          onPendingInputChange={setEditTagsInput}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          {t('common:cancel')}
        </Button>
        <DndButton variant="contained" onClick={onSave}>
          {t('common:save')}
        </DndButton>
      </DialogActions>
    </Dialog>
  );
};

type LinkProps = {
  open: boolean;
  onClose: () => void;
  notes: Note[];
  linkSource: Note | null;
  setLinkSource: (n: Note | null) => void;
  linkTarget: Note | null;
  setLinkTarget: (n: Note | null) => void;
  linkLabel: string;
  setLinkLabel: (v: string) => void;
  onCreateLink: () => void;
};

export const WikiLinkArticlesDialog: React.FC<LinkProps> = ({
  open,
  onClose,
  notes,
  linkSource,
  setLinkSource,
  linkTarget,
  setLinkTarget,
  linkLabel,
  setLinkLabel,
  onCreateLink,
}) => {
  const { t } = useTranslation(['wiki', 'common']);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}
    >
      <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>{t('wiki:dialogs.link.title')}</DialogTitle>
      <DialogContent>
        <Autocomplete
          options={notes}
          getOptionLabel={(opt) => opt.title}
          value={linkSource}
          onChange={(_, val) => setLinkSource(val)}
          isOptionEqualToValue={(opt, val) => opt.id === val.id}
          renderInput={(params) => (
            <TextField {...params} label={t('wiki:dialogs.link.sourceLabel')} margin="normal" placeholder={t('wiki:dialogs.link.selectArticlePlaceholder')} />
          )}
          noOptionsText={t('wiki:dialogs.link.noArticles')}
        />

        <Autocomplete
          options={notes.filter((n) => n.id !== linkSource?.id)}
          getOptionLabel={(opt) => opt.title}
          value={linkTarget}
          onChange={(_, val) => setLinkTarget(val)}
          isOptionEqualToValue={(opt, val) => opt.id === val.id}
          renderInput={(params) => (
            <TextField {...params} label={t('wiki:dialogs.link.targetLabel')} margin="normal" placeholder={t('wiki:dialogs.link.selectArticlePlaceholder')} />
          )}
          noOptionsText={t('wiki:dialogs.link.noArticles')}
        />

        <TextField
          fullWidth
          label={t('wiki:dialogs.link.relationLabel')}
          value={linkLabel}
          onChange={(e) => setLinkLabel(e.target.value)}
          margin="normal"
          placeholder={t('wiki:dialogs.link.relationPlaceholder')}
          helperText={t('wiki:dialogs.link.relationHelper')}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          {t('common:cancel')}
        </Button>
        <DndButton variant="contained" onClick={onCreateLink} disabled={!linkSource || !linkTarget}>
          {t('wiki:dialogs.link.createLink')}
        </DndButton>
      </DialogActions>
    </Dialog>
  );
};
