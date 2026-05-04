import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Autocomplete,
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import { DndButton } from './DndButton';

export interface ExclusionOption {
  id: number;
  name: string;
}

interface EditExclusionsDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  label: string;
  options: ExclusionOption[];
  selfId: number;
  selectedIds: number[];
  onSave: (excludedIds: number[]) => Promise<void> | void;
}

export const EditExclusionsDialog: React.FC<EditExclusionsDialogProps> = ({
  open,
  onClose,
  title,
  label,
  options,
  selfId,
  selectedIds,
  onSave,
}) => {
  const { t } = useTranslation('common');
  const [localIds, setLocalIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLocalIds(selectedIds);
    setSubmitting(false);
  }, [open, selectedIds]);

  const availableOptions = useMemo(
    () => options.filter((option) => option.id !== selfId),
    [options, selfId]
  );

  const selectedOptions = useMemo(() => {
    const selected = new Set(localIds);
    return availableOptions.filter((option) => selected.has(option.id));
  }, [availableOptions, localIds]);

  const canSave = !submitting;

  const handleSave = async () => {
    if (!canSave) return;
    setSubmitting(true);
    try {
      await onSave(localIds);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Autocomplete
            multiple
            options={availableOptions}
            value={selectedOptions}
            getOptionLabel={(option) => option.name}
            onChange={(_, value) => setLocalIds(value.map((item) => item.id))}
            renderInput={(params) => <TextField {...params} label={label} placeholder={t('editExclusions.valuesPlaceholder')} />}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  icon={<BlockIcon sx={{ fontSize: 16 }} />}
                  label={option.name}
                  size="small"
                  {...getTagProps({ index })}
                  key={option.id}
                />
              ))
            }
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <DndButton variant="outlined" color="inherit" onClick={onClose} disabled={submitting}>
          {t('cancel')}
        </DndButton>
        <DndButton variant="contained" onClick={handleSave} loading={submitting} disabled={!canSave}>
          {t('save')}
        </DndButton>
      </DialogActions>
    </Dialog>
  );
};
