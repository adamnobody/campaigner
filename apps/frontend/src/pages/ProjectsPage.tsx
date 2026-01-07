import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Button, Container, Dialog, DialogActions, DialogContent, DialogTitle,
  List, ListItemButton, ListItemText, TextField, Typography,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
// Исправление 1: Явный импорт типа для события Select
import type { SelectChangeEvent } from '@mui/material'; 

import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../app/store';
// Исправление 2: Явный импорт типа для нашей системы
import type { GameSystemType } from '../app/api';

// Красивые названия для UI
const SYSTEM_LABELS: Record<GameSystemType, string> = {
  generic: 'Generic (Универсальная)',
  dnd5e: 'Dungeons & Dragons 5e',
  vtm: 'Vampire: The Masquerade',
  cyberpunk: 'Cyberpunk',
  wh40k_rt: 'Warhammer 40K: Rogue Trader'
};

export function ProjectsPage() {
  const nav = useNavigate();
  const { projects, loadProjects, createProject } = useAppStore();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [rootPath, setRootPath] = useState('');
  const [system, setSystem] = useState<GameSystemType>('generic');

  const canCreate = useMemo(() => name.trim().length > 0, [name]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreate = async () => {
    const rp = rootPath.trim();
    await createProject({ 
      name: name.trim(), 
      system, 
      ...(rp ? { rootPath: rp } : {}) 
    });
    
    // Сброс формы
    setOpen(false);
    setName('');
    setRootPath('');
    setSystem('generic');
  };

  const handleClose = () => {
    setOpen(false);
    setName('');
    setRootPath('');
    setSystem('generic');
  }

  return (
    <Container sx={{ py: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Проекты</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>Создать проект</Button>
      </Box>

      <List dense>
        {projects.map(p => (
          <ListItemButton key={p.id} onClick={() => nav(`/projects/${p.id}`)}>
            <ListItemText 
              primary={p.name} 
              secondary={
                <>
                  <Typography component="span" variant="caption" sx={{ fontWeight: 'bold', mr: 1 }}>
                    [{SYSTEM_LABELS[p.system] || p.system}]
                  </Typography>
                  {p.path}
                </>
              } 
            />
          </ListItemButton>
        ))}
      </List>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Новый проект</DialogTitle>
        <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            autoFocus
            fullWidth
            label="Название"
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
          />

          <FormControl fullWidth>
            <InputLabel id="system-select-label">Игровая система</InputLabel>
            <Select
              labelId="system-select-label"
              value={system}
              label="Игровая система"
              onChange={(e: SelectChangeEvent) => setSystem(e.target.value as GameSystemType)}
            >
              {Object.entries(SYSTEM_LABELS).map(([key, label]) => (
                <MenuItem key={key} value={key}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <TextField
              fullWidth
              label="Путь (опционально, абсолютный)"
              placeholder="C:\Users\You\Documents\DnDCampaigns"
              value={rootPath}
              onChange={(e) => setRootPath(e.target.value)}
              margin="dense"
            />
            <Typography variant="caption" color="text.secondary">
              Если путь не указан, проект будет создан в Documents\CampaignerProjects.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Отмена</Button>
          <Button
            variant="contained"
            disabled={!canCreate}
            onClick={handleCreate}
          >
            Создать
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
