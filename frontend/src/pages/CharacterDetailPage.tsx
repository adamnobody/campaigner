import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Paper, TextField, Button,
  Select, MenuItem, FormControl, InputLabel,
  Avatar, IconButton, Divider, Tabs, Tab,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from '@mui/icons-material/Person';
import { useParams, useNavigate } from 'react-router-dom';
import { charactersApi } from '@/api/axiosClient';
import { useUIStore } from '@/store/useUIStore';
import { DndButton } from '@/components/ui/DndButton';

const CHARACTER_STATUSES = ['alive', 'dead', 'missing', 'unknown'] as const;

interface CharacterForm {
  name: string;
  title: string;
  race: string;
  characterClass: string;
  level: number | '';
  status: string;
  bio: string;
  appearance: string;
  personality: string;
  backstory: string;
  notes: string;
}

const emptyForm: CharacterForm = {
  name: '',
  title: '',
  race: '',
  characterClass: '',
  level: '',
  status: 'alive',
  bio: '',
  appearance: '',
  personality: '',
  backstory: '',
  notes: '',
};

export const CharacterDetailPage: React.FC = () => {
  const { projectId, characterId } = useParams<{ projectId: string; characterId: string }>();
  const pid = parseInt(projectId!);
  const isNew = !characterId || characterId === 'new';
  const navigate = useNavigate();
  const { showSnackbar } = useUIStore();

  const [form, setForm] = useState<CharacterForm>(emptyForm);
  const [character, setCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Загружаем существующего персонажа
  useEffect(() => {
    if (isNew) {
      console.log('[CharacterDetail] New character mode');
      setForm(emptyForm);
      setCharacter(null);
      setLoading(false);
      return;
    }

    console.log('[CharacterDetail] Loading character:', characterId);
    setLoading(true);
    charactersApi.getById(parseInt(characterId!))
      .then(res => {
        console.log('[CharacterDetail] Loaded:', res.data);
        const c = res.data.data;
        setCharacter(c);
        setForm({
          name: c.name || '',
          title: c.title || '',
          race: c.race || '',
          characterClass: c.characterClass || '',
          level: c.level || '',
          status: c.status || 'alive',
          bio: c.bio || '',
          appearance: c.appearance || '',
          personality: c.personality || '',
          backstory: c.backstory || '',
          notes: c.notes || '',
        });
        setLoading(false);
      })
      .catch(err => {
        console.error('[CharacterDetail] Error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [characterId, isNew]);

  const handleChange = (field: keyof CharacterForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showSnackbar('Введите имя персонажа', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        level: form.level === '' ? null : Number(form.level),
        projectId: pid,
      };

      if (isNew) {
        const res = await charactersApi.create(payload);
        const created = res.data.data;
        showSnackbar('Персонаж создан!', 'success');
        navigate(`/project/${pid}/characters/${created.id}`, { replace: true });
      } else {
        await charactersApi.update(parseInt(characterId!), payload);
        showSnackbar('Персонаж обновлён!', 'success');
      }
    } catch (err: any) {
      showSnackbar(err.message || 'Не удалось сохранить', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isNew || !characterId) return;
    try {
      const res = await charactersApi.uploadImage(parseInt(characterId), file);
      setCharacter(res.data.data);
      showSnackbar('Изображение загружено!', 'success');
    } catch {
      showSnackbar('Не удалось загрузить', 'error');
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>Загрузка персонажа...</Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box p={4}>
        <Typography sx={{ color: 'red' }}>Ошибка: {error}</Typography>
        <Button onClick={() => navigate(`/project/${pid}/characters`)} sx={{ mt: 2 }}>
          Назад к персонажам
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={() => navigate(`/project/${pid}/characters`)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography
          sx={{
            fontFamily: '"Cinzel", serif',
            fontWeight: 700,
            fontSize: '1.8rem',
            color: '#fff',
          }}
        >
          {isNew ? 'Новый персонаж' : form.name || 'Персонаж'}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left: Avatar */}
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 2,
              textAlign: 'center',
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {character?.imagePath ? (
              <Avatar
                src={character.imagePath}
                sx={{ width: '100%', height: 'auto', aspectRatio: '1', borderRadius: 2, mb: 2 }}
                variant="rounded"
              />
            ) : (
              <Avatar
                sx={{
                  width: '100%',
                  height: 'auto',
                  aspectRatio: '1',
                  borderRadius: 2,
                  mb: 2,
                  fontSize: 64,
                  bgcolor: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.3)',
                }}
                variant="rounded"
              >
                <PersonIcon sx={{ fontSize: 64 }} />
              </Avatar>
            )}
            {!isNew && (
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                fullWidth
                size="small"
                sx={{
                  borderColor: 'rgba(255,255,255,0.2)',
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                Загрузить фото
                <input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} />
              </Button>
            )}
          </Paper>
        </Grid>

        {/* Right: Form */}
        <Grid item xs={12} md={9}>
          <Paper
            sx={{
              p: 3,
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
              <Tab label="Основное" />
              <Tab label="Внешность и Характер" />
              <Tab label="Предыстория и Заметки" />
            </Tabs>

            {tab === 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Имя *"
                    value={form.name}
                    onChange={e => { handleChange('name', e.target.value); }}
                    error={form.name.length > 0 && !form.name.trim()}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Титул / Прозвище"
                    value={form.title}
                    onChange={e => { handleChange('title', e.target.value); }}
                    placeholder="напр. Храбрый"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Раса"
                    value={form.race}
                    onChange={e => { handleChange('race', e.target.value); }}
                    placeholder="напр. Полуэльф"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Класс"
                    value={form.characterClass}
                    onChange={e => { handleChange('characterClass', e.target.value); }}
                    placeholder="напр. Паладин"
                  />
                </Grid>
                <Grid item xs={6} sm={2}>
                  <TextField
                    fullWidth
                    label="Уровень"
                    type="number"
                    value={form.level}
                    onChange={e => { handleChange('level', e.target.value ? parseInt(e.target.value) : ''); }}
                    inputProps={{ min: 1, max: 30 }}
                  />
                </Grid>
                <Grid item xs={6} sm={2}>
                  <FormControl fullWidth>
                    <InputLabel>Статус</InputLabel>
                    <Select
                      value={form.status}
                      label="Статус"
                      onChange={e => { handleChange('status', e.target.value); }}
                    >
                      {CHARACTER_STATUSES.map(s => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Биография"
                    multiline
                    rows={4}
                    value={form.bio}
                    onChange={e => { handleChange('bio', e.target.value); }}
                    placeholder="Краткое описание персонажа..."
                  />
                </Grid>
              </Grid>
            )}

            {tab === 1 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Внешность"
                    multiline
                    rows={5}
                    value={form.appearance}
                    onChange={e => { handleChange('appearance', e.target.value); }}
                    placeholder="Физическое описание..."
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Характер"
                    multiline
                    rows={5}
                    value={form.personality}
                    onChange={e => { handleChange('personality', e.target.value); }}
                    placeholder="Черты, идеалы, привязанности, слабости..."
                  />
                </Grid>
              </Grid>
            )}

            {tab === 2 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Предыстория"
                    multiline
                    rows={8}
                    value={form.backstory}
                    onChange={e => { handleChange('backstory', e.target.value); }}
                    placeholder="История персонажа..."
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Заметки ДМа"
                    multiline
                    rows={5}
                    value={form.notes}
                    onChange={e => { handleChange('notes', e.target.value); }}
                    placeholder="Личные заметки, секреты, зацепки..."
                  />
                </Grid>
              </Grid>
            )}
            <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />

            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="outlined"
                onClick={() => navigate(`/project/${pid}/characters`)}
                sx={{
                  borderColor: 'rgba(255,255,255,0.2)',
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                Отмена
              </Button>
              <DndButton
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                loading={saving}
                disabled={!form.name.trim()}
              >
                {isNew ? 'Создать' : 'Сохранить'}
              </DndButton>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};