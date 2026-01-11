import React from 'react';
import {
  Autocomplete,
  Avatar,
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
import blankImg from '../assets/blank.jpg';

function norm(s: string) {
  return s.trim().toLowerCase();
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr));
}

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

  const { characters, charactersLoading, loadCharacters, createCharacter, uploadCharacterPhoto } = useAppStore();

  // Filters
  const [q, setQ] = React.useState('');
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);

  const allTags = React.useMemo(() => {
    return uniq(characters.flatMap((c) => c.tags ?? [])).sort((a, b) => a.localeCompare(b));
  }, [characters]);

  const filtered = React.useMemo(() => {
    const qq = norm(q);

    return characters.filter((c) => {
      if (qq && !norm(c.name ?? '').includes(qq)) return false;

      if (selectedTags.length) {
        const set = new Set(c.tags ?? []);
        for (const t of selectedTags) if (!set.has(t)) return false;
      }

      return true;
    });
  }, [characters, q, selectedTags]);

  // Create dialog
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [summary, setSummary] = React.useState('');
  const [tags, setTags] = React.useState('');
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);

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

      {/* Filters */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          label="Поиск по имени"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ minWidth: 260, flex: '1 1 260px' }}
        />

        <Autocomplete
          multiple
          size="small"
          options={allTags}
          value={selectedTags}
          onChange={(_, v) => setSelectedTags(v)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => <Chip label={option} size="small" {...getTagProps({ index })} />)
          }
          renderInput={(params) => <TextField {...params} label="Теги" placeholder="Выберите…" />}
          sx={{ minWidth: 260, flex: '1 1 260px' }}
        />

        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            setQ('');
            setSelectedTags([]);
          }}
        >
          Сброс
        </Button>

        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          Показано: {filtered.length}
        </Typography>
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
        {filtered.map((c) => (
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
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar
                src={`/api/characters/${c.id}/photo?v=${encodeURIComponent(c.updated_at)}`}
                imgProps={{
                  onError: (e) => {
                    (e.currentTarget as HTMLImageElement).src = blankImg;
                  }
                }}
                sx={{ width: 48, height: 48 }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1.05rem' }} noWrap>
                  {c.name}
                </Typography>

                {!!c.summary && (
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {c.summary}
                  </Typography>
                )}
              </Box>
            </Stack>

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

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setPhotoFile(null);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Новый персонаж</DialogTitle>
        <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField autoFocus label="Имя" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
          <TextField label="Кратко" value={summary} onChange={(e) => setSummary(e.target.value)} fullWidth />
          <TextField label="Теги (через запятую)" value={tags} onChange={(e) => setTags(e.target.value)} fullWidth />

          <Button variant="outlined" component="label">
            {photoFile ? `Фото: ${photoFile.name}` : 'Добавить фото'}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            />
          </Button>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setOpen(false);
              setPhotoFile(null);
            }}
          >
            Отмена
          </Button>

          <Button
            variant="contained"
            disabled={!name.trim()}
            onClick={async () => {
              try {
                const created = await createCharacter(pid, {
                  name: name.trim(),
                  summary: summary.trim(),
                  tags: parseTags(tags)
                });

                if (photoFile) {
                  await uploadCharacterPhoto(created.id, photoFile);
                }

                setOpen(false);
                setName('');
                setSummary('');
                setTags('');
                setPhotoFile(null);
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
