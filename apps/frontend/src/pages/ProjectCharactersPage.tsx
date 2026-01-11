import React from 'react';
import {
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../app/store';

function parseTags(s: string): string[] {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

export function ProjectCharactersPage() {
  const nav = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const pid = projectId!;

  const { characters, charactersLoading, loadCharacters, createCharacter } = useAppStore();

  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [summary, setSummary] = React.useState('');
  const [tags, setTags] = React.useState('');

  React.useEffect(() => {
    loadCharacters(pid);
  }, [pid, loadCharacters]);

  return (
    <Container sx={{ py: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Персонажи</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => nav(`/projects/${pid}`)}>
            Назад к проекту
          </Button>
          <Button variant="contained" onClick={() => setOpen(true)}>
            Добавить
          </Button>
        </Stack>
      </Box>

      {charactersLoading && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Загрузка…
        </Typography>
      )}

      <Box
        sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)'
            }
        }}
        >
        {characters.map((c) => (
            <Box
            key={c.id}
            onClick={() => nav(`/projects/${pid}/characters/${c.id}`)}
            sx={{
                cursor: 'pointer',
                p: 2,
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
                transition: 'transform 160ms ease, box-shadow 160ms ease',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 14px 40px rgba(0,0,0,0.22)' }
            }}
            >
            <Typography sx={{ fontWeight: 800, fontSize: '1.05rem' }}>{c.name}</Typography>

            {!!c.summary && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                {c.summary}
                </Typography>
            )}

            {!!c.tags?.length && (
                <Stack direction="row" spacing={1} sx={{ mt: 1.25, flexWrap: 'wrap', gap: 1 }}>
                {c.tags.slice(0, 8).map((t) => (
                    <Chip key={t} label={t} size="small" />
                ))}
                </Stack>
            )}
            </Box>
        ))}
        </Box>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Новый персонаж</DialogTitle>
        <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField autoFocus label="Имя" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
          <TextField label="Кратко" value={summary} onChange={(e) => setSummary(e.target.value)} fullWidth />
          <TextField label="Теги (через запятую)" value={tags} onChange={(e) => setTags(e.target.value)} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Отмена</Button>
          <Button
            variant="contained"
            disabled={!name.trim()}
            onClick={async () => {
                try {
                await createCharacter(pid, { name: name.trim(), summary: summary.trim(), tags: parseTags(tags) });
                setOpen(false);
                setName('');
                setSummary('');
                setTags('');
                } catch (e) {
                console.error('createCharacter failed', e);
                alert('Не удалось создать персонажа. Смотри console/network.');
                }
            }}
          >
            Создать
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
