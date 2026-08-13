import React from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, alpha, useTheme } from '@mui/material';
import AltRouteOutlinedIcon from '@mui/icons-material/AltRouteOutlined';
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
  const theme = useTheme();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            display: 'grid',
            placeItems: 'center',
            color: 'warning.main',
            backgroundColor: alpha(theme.palette.warning.main, 0.1),
            border: `1px solid ${alpha(theme.palette.warning.main, 0.22)}`,
          }}
        >
          <AltRouteOutlinedIcon fontSize="small" />
        </Box>
        {t('branchMissing.title')}
      </DialogTitle>
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
