import React, { useMemo, useState } from 'react';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, TextField, Typography
} from '@mui/material';
import { useAppStore } from '../../app/store';
import type { MapDTO } from '../../app/api';

export function CreateMapDialog(props: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  maps: MapDTO[];
  onCreated: (mapId: string) => void;
}) {
  const { open, onClose, projectId, maps, onCreated } = props;
  const { createMap } = useAppStore();

  const [title, setTitle] = useState('');
  const [parent, setParent] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);

  const canCreate = useMemo(() => title.trim().length > 0 && !!file, [title, file]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Новая карта</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <TextField
          fullWidth
          label="Название"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          margin="normal"
        />

        <TextField
          select
          fullWidth
          label="Родительская карта (опционально)"
          value={parent}
          onChange={(e) => setParent(e.target.value)}
          margin="normal"
        >
          <MenuItem value="">(корневая)</MenuItem>
          {maps.map(m => (
            <MenuItem key={m.id} value={m.id}>{m.title}</MenuItem>
          ))}
        </TextField>

        <Button variant="outlined" component="label" sx={{ mt: 1 }}>
          Выбрать файл карты (png/jpg/svg)
          <input
            hidden
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </Button>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Файл: {file ? file.name : 'не выбран'} (лимит 40MB)
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button
          variant="contained"
          disabled={!canCreate}
          onClick={async () => {
            if (!file) return;
            const created = await createMap(projectId, {
              title: title.trim(),
              ...(parent ? { parent_map_id: parent } : {}),
              file
            });
            onClose();
            setTitle('');
            setParent('');
            setFile(null);
            onCreated(created.id);
          }}
        >
          Создать
        </Button>
      </DialogActions>
    </Dialog>
  );
}
