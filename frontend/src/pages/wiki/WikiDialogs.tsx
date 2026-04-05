import React from 'react';
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
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="sm"
    fullWidth
    PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}
  >
    <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>Новая статья</DialogTitle>
    <DialogContent>
      <TextField
        autoFocus
        fullWidth
        label="Название статьи *"
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        margin="normal"
        placeholder="напр. Королевство Элдория"
      />

      <TagAutocompleteField
        options={existingTagNames}
        value={newTagsStr}
        pendingInput={newTagsInput}
        label="Теги (категории)"
        placeholder="Выберите или введите новые теги..."
        helperText="Теги используются как категории для фильтрации вики-статей"
        margin="normal"
        onValueChange={setNewTagsStr}
        onPendingInputChange={setNewTagsInput}
      />
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onClose} color="inherit">
        Отмена
      </Button>
      <DndButton variant="contained" onClick={onCreate} disabled={!newTitle.trim()}>
        Создать
      </DndButton>
    </DialogActions>
  </Dialog>
);

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
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="sm"
    fullWidth
    PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}
  >
    <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>
      Теги: {tagsEditNote?.title}
    </DialogTitle>
    <DialogContent>
      <TagAutocompleteField
        options={existingTagNames}
        value={editTagsStr}
        pendingInput={editTagsInput}
        label="Теги"
        placeholder="Выберите или введите..."
        margin="normal"
        onValueChange={setEditTagsStr}
        onPendingInputChange={setEditTagsInput}
      />
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onClose} color="inherit">
        Отмена
      </Button>
      <DndButton variant="contained" onClick={onSave}>
        Сохранить
      </DndButton>
    </DialogActions>
  </Dialog>
);

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
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="sm"
    fullWidth
    PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}
  >
    <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>Связать статьи</DialogTitle>
    <DialogContent>
      <Autocomplete
        options={notes}
        getOptionLabel={(opt) => opt.title}
        value={linkSource}
        onChange={(_, val) => setLinkSource(val)}
        isOptionEqualToValue={(opt, val) => opt.id === val.id}
        renderInput={(params) => (
          <TextField {...params} label="Первая статья *" margin="normal" placeholder="Выберите статью..." />
        )}
        noOptionsText="Нет статей"
      />

      <Autocomplete
        options={notes.filter((n) => n.id !== linkSource?.id)}
        getOptionLabel={(opt) => opt.title}
        value={linkTarget}
        onChange={(_, val) => setLinkTarget(val)}
        isOptionEqualToValue={(opt, val) => opt.id === val.id}
        renderInput={(params) => (
          <TextField {...params} label="Вторая статья *" margin="normal" placeholder="Выберите статью..." />
        )}
        noOptionsText="Нет статей"
      />

      <TextField
        fullWidth
        label="Описание связи (опционально)"
        value={linkLabel}
        onChange={(e) => setLinkLabel(e.target.value)}
        margin="normal"
        placeholder="напр. столица, союзник, часть..."
        helperText="Краткое описание отношения между статьями"
      />
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onClose} color="inherit">
        Отмена
      </Button>
      <DndButton variant="contained" onClick={onCreateLink} disabled={!linkSource || !linkTarget}>
        Создать связь
      </DndButton>
    </DialogActions>
  </Dialog>
);
