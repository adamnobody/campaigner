import React from 'react';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../app/store';
import type { RelationshipType } from '../app/api';

const REL_LABEL: Record<RelationshipType, string> = {
  friend: 'Друг',
  enemy: 'Враг',
  parent: 'Родитель',
  child: 'Ребёнок',
  sibling: 'Брат/Сестра',
  spouse: 'Супруг(а)',
  lover: 'Любовь',
  mentor: 'Наставник',
  student: 'Ученик',
  ally: 'Союзник',
  rival: 'Соперник',
  colleague: 'Коллега',
  leader: 'Лидер',
  subordinate: 'Подчинённый',
  other: 'Другое'
};

export function CharacterPage() {
  const nav = useNavigate();
  const { projectId, characterId } = useParams<{ projectId: string; characterId: string }>();
  const pid = projectId!;
  const cid = characterId!;

  const {
    characters,
    loadCharacters,
    patchCharacter,
    deleteCharacter,

    relationships,
    loadRelationships,
    createRelationship,
    deleteRelationship
  } = useAppStore();

  React.useEffect(() => {
    loadCharacters(pid);
    loadRelationships(pid);
  }, [pid, loadCharacters, loadRelationships]);

  const character = characters.find((c) => c.id === cid);

  const [name, setName] = React.useState('');
  const [summary, setSummary] = React.useState('');
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
    setName(character?.name ?? '');
    setSummary(character?.summary ?? '');
    setNotes(character?.notes ?? '');
  }, [character?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const outgoing = relationships.filter((r) => r.from_character_id === cid);
  const incoming = relationships.filter((r) => r.to_character_id === cid);

  const [relOpen, setRelOpen] = React.useState(false);
  const [relToId, setRelToId] = React.useState('');
  const [relType, setRelType] = React.useState<RelationshipType>('friend');
  const [relNote, setRelNote] = React.useState('');

  if (!character) {
    return (
      <Container sx={{ py: 3 }}>
        <Typography>Персонаж не найден.</Typography>
        <Button sx={{ mt: 2 }} onClick={() => nav(`/projects/${pid}/characters`)}>
          Назад
        </Button>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h5">{character.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            Персонаж проекта
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => nav(`/projects/${pid}/characters`)}>
            К списку
          </Button>
          <Button
            color="error"
            onClick={async () => {
              await deleteCharacter(pid, cid);
              nav(`/projects/${pid}/characters`);
            }}
          >
            Удалить
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ display: 'grid', gap: 2 }}>
        <Box sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>Данные</Typography>
          <Stack spacing={1.5}>
            <TextField label="Имя" value={name} onChange={(e) => setName(e.target.value)} />
            <TextField label="Кратко" value={summary} onChange={(e) => setSummary(e.target.value)} />
            <TextField label="Заметки" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={6} />

            <Stack direction="row" justifyContent="flex-end">
              <Button
                variant="contained"
                onClick={async () => {
                  await patchCharacter(cid, { name: name.trim(), summary: summary.trim(), notes });
                }}
              >
                Сохранить
              </Button>
            </Stack>
          </Stack>
        </Box>

        <Box sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography sx={{ fontWeight: 700 }}>Связи</Typography>
            <Button variant="outlined" onClick={() => setRelOpen(true)}>
              Добавить связь
            </Button>
          </Stack>

          <Typography variant="body2" sx={{ fontWeight: 700, mt: 1 }}>
            Исходящие
          </Typography>
          {outgoing.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Нет исходящих связей.
            </Typography>
          ) : (
            <Stack spacing={1} sx={{ mt: 1 }}>
              {outgoing.map((r) => {
                const to = characters.find((c) => c.id === r.to_character_id);
                return (
                  <Stack
                    key={r.id}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ p: 1, borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2">
                        <b>{REL_LABEL[r.type]}</b> → {to?.name ?? r.to_character_id}
                      </Typography>
                      {r.note && (
                        <Typography variant="caption" color="text.secondary">
                          {r.note}
                        </Typography>
                      )}
                    </Box>
                    <Button color="error" size="small" onClick={async () => deleteRelationship(pid, r.id)}>
                      Удалить
                    </Button>
                  </Stack>
                );
              })}
            </Stack>
          )}

          <Typography variant="body2" sx={{ fontWeight: 700, mt: 2 }}>
            Входящие
          </Typography>
          {incoming.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Нет входящих связей.
            </Typography>
          ) : (
            <Stack spacing={1} sx={{ mt: 1 }}>
              {incoming.map((r) => {
                const from = characters.find((c) => c.id === r.from_character_id);
                return (
                  <Stack
                    key={r.id}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ p: 1, borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2">
                        {from?.name ?? r.from_character_id} → <b>{REL_LABEL[r.type]}</b>
                      </Typography>
                      {r.note && (
                        <Typography variant="caption" color="text.secondary">
                          {r.note}
                        </Typography>
                      )}
                    </Box>
                    <Button color="error" size="small" onClick={async () => deleteRelationship(pid, r.id)}>
                      Удалить
                    </Button>
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Box>
      </Box>

      <Dialog open={relOpen} onClose={() => setRelOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Добавить связь</DialogTitle>
        <DialogContent sx={{ pt: 1, display: 'grid', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="rel-to">С кем</InputLabel>
            <Select
              labelId="rel-to"
              value={relToId}
              label="С кем"
              onChange={(e) => setRelToId(e.target.value)}
            >
              {characters
                .filter((c) => c.id !== cid)
                .map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="rel-type">Тип</InputLabel>
            <Select
              labelId="rel-type"
              value={relType}
              label="Тип"
              onChange={(e) => setRelType(e.target.value as RelationshipType)}
            >
              {Object.entries(REL_LABEL).map(([k, v]) => (
                <MenuItem key={k} value={k}>
                  {v}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField label="Заметка" value={relNote} onChange={(e) => setRelNote(e.target.value)} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRelOpen(false)}>Отмена</Button>
          <Button
            variant="contained"
            disabled={!relToId}
            onClick={async () => {
              await createRelationship(pid, {
                from_character_id: cid,
                to_character_id: relToId,
                type: relType,
                note: relNote.trim()
              });
              setRelOpen(false);
              setRelToId('');
              setRelType('friend');
              setRelNote('');
            }}
          >
            Добавить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
