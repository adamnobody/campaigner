import React, { useMemo, useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, Divider, Typography, Box
} from '@mui/material';
import type { MarkerDTO, MarkerType, NoteDTO, NoteType, MapDTO } from '../../app/api';

type Mode = 'create' | 'edit';
type LinkTypeUI = 'none' | 'note' | 'map';

type MarkerLinkPayload = {
  link_type: null | 'note' | 'map';
  link_note_id: string | null;
  link_map_id: string | null;
};

function toUiLinkType(m?: Partial<MarkerDTO>): LinkTypeUI {
  if (!m?.link_type) return 'none';
  return m.link_type;
}

export function MarkerDialog(props: {
  open: boolean;
  mode: Mode;
  initial?: Partial<MarkerDTO> & { x: number; y: number };
  onClose: () => void;
  notes: NoteDTO[];
  maps: MapDTO[];
  projectId: string;
  defaultParentMapId?: string | null;
  onCreateLinkedNote: (input: { title: string; type: NoteType }) => Promise<NoteDTO>;
  onCreateLinkedMap: (input: { title: string; parent_map_id?: string; file: File }) => Promise<MapDTO>;

  onCreate?: (payload: {
    title: string;
    description: string;
    marker_type: MarkerType;
    color: string;
    x: number;
    y: number;
  } & MarkerLinkPayload) => Promise<void>;

  onSave?: (patch: {
    title: string;
    description: string;
    marker_type: MarkerType;
    color: string;
  } & MarkerLinkPayload) => Promise<void>;

  onDelete?: () => Promise<void>;
}) {
  const {
    open, mode, initial, onClose, onCreate, onSave, onDelete,
    notes, maps, defaultParentMapId, onCreateLinkedNote, onCreateLinkedMap
  } = props;

  const [title, setTitle] = useState(initial?.title ?? '');
  const [markerType, setMarkerType] = useState<MarkerType>((initial?.marker_type as MarkerType) ?? 'location');
  const [color, setColor] = useState(initial?.color ?? '#ff4757');
  const [description, setDescription] = useState(initial?.description ?? '');

  const [linkType, setLinkType] = useState<LinkTypeUI>(toUiLinkType(initial));
  const [linkNoteId, setLinkNoteId] = useState<string>(initial?.link_note_id ?? '');
  const [linkMapId, setLinkMapId] = useState<string>(initial?.link_map_id ?? '');

  const [createNoteOpen, setCreateNoteOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteType, setNewNoteType] = useState<NoteType>('md');

  const [createMapOpen, setCreateMapOpen] = useState(false);
  const [newMapTitle, setNewMapTitle] = useState('');
  const [newMapParent, setNewMapParent] = useState<string>(defaultParentMapId ?? '');
  const [newMapFile, setNewMapFile] = useState<File | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? '');
    setMarkerType((initial?.marker_type as MarkerType) ?? 'location');
    setColor(initial?.color ?? '#ff4757');
    setDescription(initial?.description ?? '');
    setLinkType(toUiLinkType(initial));
    setLinkNoteId(initial?.link_note_id ?? '');
    setLinkMapId(initial?.link_map_id ?? '');
  }, [open, initial]);

  const canSubmit = useMemo(() => title.trim().length > 0, [title]);
  const linkPayload = useMemo<MarkerLinkPayload>(() => {
    if (linkType === 'none') return { link_type: null, link_note_id: null, link_map_id: null };
    if (linkType === 'note') return { link_type: 'note', link_note_id: linkNoteId || null, link_map_id: null };
    return { link_type: 'map', link_note_id: null, link_map_id: linkMapId || null };
  }, [linkType, linkNoteId, linkMapId]);

  const linkValid = useMemo(() => {
    if (linkType === 'none') return true;
    if (linkType === 'note') return !!linkNoteId;
    return !!linkMapId;
  }, [linkType, linkNoteId, linkMapId]);

  const canCreateMap = useMemo(() => newMapTitle.trim().length > 0 && !!newMapFile, [newMapTitle, newMapFile]);
  const canCreateNote = useMemo(() => newNoteTitle.trim().length > 0, [newNoteTitle]);

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>{mode === 'create' ? 'Новый маркер' : 'Редактировать маркер'}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            fullWidth label="Название" value={title}
            onChange={(e) => setTitle(e.target.value)} margin="normal"
          />
          <TextField
            select fullWidth label="Тип" value={markerType}
            onChange={(e) => setMarkerType(e.target.value as MarkerType)} margin="normal"
          >
            <MenuItem value="location">Местность</MenuItem>
            <MenuItem value="event">Событие</MenuItem>
            <MenuItem value="character">Персонаж</MenuItem>
          </TextField>
          <TextField
            fullWidth label="Цвет (#RRGGBB)" value={color}
            onChange={(e) => setColor(e.target.value)} margin="normal"
            InputProps={{
              endAdornment: (
                <input
                  type="color" value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : '#ff4757'}
                  onChange={(e) => setColor(e.target.value)}
                  style={{ width: 36, height: 28, border: 'none', background: 'transparent' }}
                />
              )
            }}
          />
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Link</Typography>
          <TextField
            select fullWidth label="Тип ссылки" value={linkType}
            onChange={(e) => setLinkType(e.target.value as LinkTypeUI)} margin="normal"
          >
            <MenuItem value="none">Нет</MenuItem>
            <MenuItem value="note">Заметка</MenuItem>
            <MenuItem value="map">Карта</MenuItem>
          </TextField>

          {linkType === 'note' && (
            <>
              <TextField
                select fullWidth label="Выберите заметку" value={linkNoteId}
                onChange={(e) => setLinkNoteId(e.target.value)} margin="normal"
              >
                {notes.length === 0 ? <MenuItem value="" disabled>Нет заметок</MenuItem> : notes.map(n => <MenuItem key={n.id} value={n.id}>{n.title}</MenuItem>)}
              </TextField>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button variant="outlined" onClick={() => setCreateNoteOpen(true)}>Создать заметку и привязать</Button>
              </Box>
            </>
          )}

          {linkType === 'map' && (
            <>
              <TextField
                select fullWidth label="Выберите карту" value={linkMapId}
                onChange={(e) => setLinkMapId(e.target.value)} margin="normal"
              >
                {maps.length === 0 ? <MenuItem value="" disabled>Нет карт</MenuItem> : maps.map(m => <MenuItem key={m.id} value={m.id}>{m.title}</MenuItem>)}
              </TextField>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button variant="outlined" onClick={() => setCreateMapOpen(true)}>Создать карту и привязать</Button>
              </Box>
            </>
          )}

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Описание (Markdown)</Typography>
          <div style={{ marginTop: 8 }}>
            <MDEditor value={description} onChange={(v) => setDescription(v ?? '')} height={260} />
          </div>
        </DialogContent>
        <DialogActions>
          {mode === 'edit' && onDelete && (
            <Button color="error" onClick={async () => { await onDelete(); onClose(); }}>Удалить</Button>
          )}
          <Button onClick={onClose}>Отмена</Button>
          {mode === 'create' ? (
            <Button
              variant="contained" disabled={!canSubmit || !linkValid || !initial || !onCreate}
              onClick={async () => {
                if (!initial || !onCreate) return;
                await onCreate({
                  title: title.trim(), description, marker_type: markerType, color,
                  x: initial.x, y: initial.y, ...linkPayload
                });
                onClose();
              }}
            >
              Создать
            </Button>
          ) : (
            <Button
              variant="contained" disabled={!canSubmit || !linkValid || !onSave}
              onClick={async () => {
                if (!onSave) return;
                await onSave({ title: title.trim(), description, marker_type: markerType, color, ...linkPayload });
                onClose();
              }}
            >
              Сохранить
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Диалоги создания Note/Map остались без изменений */}
      <Dialog open={createNoteOpen} onClose={() => setCreateNoteOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Создать заметку</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
            <TextField autoFocus fullWidth label="Название" value={newNoteTitle} onChange={(e) => setNewNoteTitle(e.target.value)} margin="normal" />
            <TextField select fullWidth label="Тип" value={newNoteType} onChange={(e) => setNewNoteType(e.target.value as NoteType)} margin="normal">
                <MenuItem value="md">Markdown (.md)</MenuItem>
                <MenuItem value="txt">Text (.txt)</MenuItem>
            </TextField>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setCreateNoteOpen(false)}>Отмена</Button>
            <Button variant="contained" disabled={!canCreateNote} onClick={async () => {
                const created = await onCreateLinkedNote({ title: newNoteTitle.trim(), type: newNoteType });
                setLinkType('note'); setLinkNoteId(created.id); setCreateNoteOpen(false);
            }}>Создать и выбрать</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createMapOpen} onClose={() => setCreateMapOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Создать карту</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
            <TextField autoFocus fullWidth label="Название" value={newMapTitle} onChange={(e) => setNewMapTitle(e.target.value)} margin="normal" />
            <TextField select fullWidth label="Родительская карта" value={newMapParent} onChange={(e) => setNewMapParent(e.target.value)} margin="normal">
                <MenuItem value="">(корневая)</MenuItem>
                {maps.map(m => <MenuItem key={m.id} value={m.id}>{m.title}</MenuItem>)}
            </TextField>
            <Button variant="outlined" component="label" sx={{ mt: 1 }}>Выбрать файл<input hidden type="file" onChange={(e) => setNewMapFile(e.target.files?.[0] ?? null)} /></Button>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setCreateMapOpen(false)}>Отмена</Button>
            <Button variant="contained" disabled={!canCreateMap} onClick={async () => {
                if (!newMapFile) return;
                const created = await onCreateLinkedMap({ title: newMapTitle.trim(), ...(newMapParent ? { parent_map_id: newMapParent } : {}), file: newMapFile });
                setLinkType('map'); setLinkMapId(created.id); setCreateMapOpen(false);
            }}>Создать и выбрать</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
