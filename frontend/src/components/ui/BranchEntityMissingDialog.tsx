import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useTranslation } from 'react-i18next';

type BranchEntityMissingDialogProps = {
  open: boolean;
  entityName: string;
  onClose: () => void;
};

export const BranchEntityMissingDialog: React.FC<BranchEntityMissingDialogProps> = ({
  open,
  entityName,
  onClose,
}) => {
  const { t } = useTranslation('common');

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('branchMissing.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t('branchMissing.message', { entity: entityName })}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          {t('close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
