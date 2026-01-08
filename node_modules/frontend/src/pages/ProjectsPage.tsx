import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../app/store';
import type { GameSystemType, ProjectDTO } from '../app/api';

const SYSTEM_LABELS: Record<GameSystemType, string> = {
  generic: 'Generic (Универсальная)',
  dnd5e: 'Dungeons & Dragons 5e',
  vtm: 'Vampire: The Masquerade',
  cyberpunk: 'Cyberpunk',
  wh40k_rt: 'Warhammer 40K: Rogue Trader'
};

export function ProjectsPage() {
  const nav = useNavigate();
  const { projects, loadProjects, createProject, deleteProject } = useAppStore();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [rootPath, setRootPath] = useState('');
  const [system, setSystem] = useState<GameSystemType>('generic');

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<ProjectDTO | null>(null);

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
  };

  return (
    <Container sx={{ py: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Проекты</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Создать проект
        </Button>
      </Box>

      <List dense>
        {projects.map((p) => (
          <ListItemButton
            key={p.id}
            onClick={() => nav(`/projects/${p.id}`)}
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
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

            <Tooltip title="Удалить проект">
              <IconButton
                edge="end"
                size="small"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDeletingProject(p);
                  setDeleteOpen(true);
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </ListItemButton>
        ))}
      </List>

      {/* Create dialog */}
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
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
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
          <Button variant="contained" disabled={!canCreate} onClick={handleCreate}>
            Создать
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeletingProject(null);
        }}
      >
        <DialogTitle>Удалить проект?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Проект <b>{deletingProject?.name}</b> будет удалён из списка приложения.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
            Примечание: удаление файлов проекта на диске зависит от реализации на бэке.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteOpen(false);
              setDeletingProject(null);
            }}
          >
            Отмена
          </Button>
          <Button
            color="error"
            onClick={async () => {
              if (!deletingProject) return;
              await deleteProject(deletingProject.id);
              setDeleteOpen(false);
              setDeletingProject(null);
            }}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
