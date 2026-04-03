import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { DndButton } from '@/components/ui/DndButton';

export interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => Promise<void>;
}

export const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const theme = useTheme();
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await onSubmit(newName.trim(), newDescription.trim());
      setNewName('');
      setNewDescription('');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    if (!creating) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, 
            ${theme.palette.background.paper} 0%, 
            ${alpha(theme.palette.background.paper, 0.95)} 100%
          )`,
          backdropFilter: 'blur(20px)',
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          boxShadow: `0 25px 50px ${alpha(theme.palette.common.black, 0.5)}`,
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, 
              ${theme.palette.primary.main}, 
              ${theme.palette.secondary.main}, 
              ${theme.palette.primary.main}
            )`,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          fontFamily: '"Cinzel", serif',
          fontWeight: 700,
          fontSize: '1.4rem',
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          component="span"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
          }}
        >
          <AddIcon sx={{ color: '#fff', fontSize: '1.2rem' }} />
        </Box>
        Создать новый проект
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <TextField
          autoFocus
          fullWidth
          label="Название кампании"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          margin="normal"
          placeholder="например, Затерянные Рудники Фанделвера"
          sx={{
            '& .MuiOutlinedInput-root': {
              transition: 'all 0.3s ease',
              '&:hover, &.Mui-focused': {
                boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
              },
            },
          }}
        />

        <TextField
          fullWidth
          label="Описание"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          margin="normal"
          multiline
          rows={3}
          placeholder="Краткое описание кампании..."
          sx={{
            '& .MuiOutlinedInput-root': {
              transition: 'all 0.3s ease',
              '&:hover, &.Mui-focused': {
                boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
              },
            },
          }}
        />

        {/* Quick Tips */}
        <Box
          sx={{
            mt: 2,
            p: 2,
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.info.main, 0.06),
            border: `1px dashed ${alpha(theme.palette.info.main, 0.3)}`,
            display: 'flex',
            gap: 1.5,
            alignItems: 'flex-start',
          }}
        >
          <AutoAwesomeIcon sx={{ color: 'info.main', fontSize: '1.2rem', mt: 0.3 }} />
          <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.5, fontSize: '0.78rem' }}>
            <strong>Совет:</strong> Хорошее название задаёт тон всему миру. Подумайте о жанре, атмосфере и главной идее вашей истории.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          onClick={handleClose}
          color="inherit"
          sx={{
            fontWeight: 600,
            px: 2.5,
            '&:hover': {
              backgroundColor: alpha(theme.palette.action.hover, 0.1),
            },
          }}
        >
          Отмена
        </Button>

        <DndButton
          variant="contained"
          onClick={handleCreate}
          loading={creating}
          disabled={!newName.trim()}
          sx={{
            fontWeight: 700,
            px: 3,
            minWidth: 120,
            background: !newName.trim()
              ? undefined
              : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            boxShadow: !newName.trim()
              ? undefined
              : `0 4px 15px ${alpha(theme.palette.primary.main, 0.4)}`,
          }}
        >
          {creating ? 'Создание...' : '✨ Создать'}
        </DndButton>
      </DialogActions>
    </Dialog>
  );
};
