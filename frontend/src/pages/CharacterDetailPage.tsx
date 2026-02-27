import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Paper, TextField, Button,
  Select, MenuItem, FormControl, InputLabel, Chip,
  Avatar, IconButton, Divider, Tabs, Tab,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SaveIcon from '@mui/icons-material/Save';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCharacterStore } from '@/store/useCharacterStore';
import { useUIStore } from '@/store/useUIStore';
import { CHARACTER_STATUSES, LIMITS } from '@campaigner/shared';
import { DndButton } from '@/components/ui/DndButton';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

const characterFormSchema = z.object({
  name: z.string().min(LIMITS.CHARACTER_NAME_MIN).max(LIMITS.CHARACTER_NAME_MAX).trim(),
  title: z.string().max(200).optional().default(''),
  race: z.string().max(100).optional().default(''),
  characterClass: z.string().max(100).optional().default(''),
  level: z.number().int().min(1).max(30).nullable().optional(),
  status: z.enum(CHARACTER_STATUSES).optional().default('alive'),
  bio: z.string().max(LIMITS.CHARACTER_BIO_MAX).optional().default(''),
  appearance: z.string().max(10000).optional().default(''),
  personality: z.string().max(10000).optional().default(''),
  backstory: z.string().max(50000).optional().default(''),
  notes: z.string().max(50000).optional().default(''),
});

type CharacterFormData = z.infer<typeof characterFormSchema>;

export const CharacterDetailPage: React.FC = () => {
  const { projectId, characterId } = useParams<{ projectId: string; characterId: string }>();
  const pid = parseInt(projectId!);
  const isNew = characterId === 'new';
  const navigate = useNavigate();
  const {
    currentCharacter, fetchCharacter, createCharacter,
    updateCharacter, uploadImage, setCurrentCharacter
  } = useCharacterStore();
  const { showSnackbar } = useUIStore();
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState(0);
  const [pageLoading, setPageLoading] = useState(!isNew);

  const { control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<CharacterFormData>({
    resolver: zodResolver(characterFormSchema),
    defaultValues: {
      name: '',
      title: '',
      race: '',
      characterClass: '',
      level: null,
      status: 'alive',
      bio: '',
      appearance: '',
      personality: '',
      backstory: '',
      notes: '',
    },
  });

  // При открытии новой страницы — очищаем currentCharacter
  useEffect(() => {
    if (isNew) {
      setCurrentCharacter(null);
      setPageLoading(false);
      reset({
        name: '',
        title: '',
        race: '',
        characterClass: '',
        level: null,
        status: 'alive',
        bio: '',
        appearance: '',
        personality: '',
        backstory: '',
        notes: '',
      });
    } else if (characterId) {
      setPageLoading(true);
      fetchCharacter(parseInt(characterId)).finally(() => {
        setPageLoading(false);
      });
    }

    // Cleanup при уходе со страницы
    return () => {
      setCurrentCharacter(null);
    };
  }, [isNew, characterId, fetchCharacter, setCurrentCharacter, reset]);

  // Заполняем форму при загрузке существующего персонажа
  useEffect(() => {
    if (!isNew && currentCharacter) {
      reset({
        name: currentCharacter.name,
        title: currentCharacter.title || '',
        race: currentCharacter.race || '',
        characterClass: currentCharacter.characterClass || '',
        level: currentCharacter.level,
        status: currentCharacter.status,
        bio: currentCharacter.bio || '',
        appearance: currentCharacter.appearance || '',
        personality: currentCharacter.personality || '',
        backstory: currentCharacter.backstory || '',
        notes: currentCharacter.notes || '',
      });
    }
  }, [currentCharacter, isNew, reset]);

  const onSubmit = async (data: CharacterFormData) => {
    setSaving(true);
    try {
      if (isNew) {
        const character = await createCharacter({ ...data, projectId: pid });
        showSnackbar('Персонаж создан!', 'success');
        navigate(`/project/${pid}/characters/${character.id}`, { replace: true });
      } else {
        await updateCharacter(parseInt(characterId!), data);
        showSnackbar('Персонаж обновлён!', 'success');
      }
    } catch {
      showSnackbar('Не удалось сохранить', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isNew || !characterId) return;
    try {
      await uploadImage(parseInt(characterId), file);
      showSnackbar('Изображение загружено!', 'success');
    } catch {
      showSnackbar('Не удалось загрузить', 'error');
    }
  };

  if (pageLoading) return <LoadingScreen />;

  const tabPanels = ['Основное', 'Внешность и Характер', 'Предыстория и Заметки'];

  return (
    <Box>
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
          {isNew ? 'Новый персонаж' : currentCharacter?.name || 'Персонаж'}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
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
              {!isNew && currentCharacter?.imagePath ? (
                <Avatar
                  src={currentCharacter.imagePath}
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
                  {isNew ? '?' : currentCharacter?.name?.[0] || '?'}
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
                  <input type="file" hidden accept="image/jpeg,image/png,image/svg+xml" onChange={handleImageUpload} />
                </Button>
              )}

              {!isNew && currentCharacter?.tags && currentCharacter.tags.length > 0 && (
                <Box display="flex" gap={0.5} mt={2} flexWrap="wrap" justifyContent="center">
                  {currentCharacter.tags.map(tag => (
                    <Chip
                      key={tag.id}
                      label={tag.name}
                      size="small"
                      sx={{ backgroundColor: tag.color, color: '#fff' }}
                    />
                  ))}
                </Box>
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
                {tabPanels.map((label, i) => (
                  <Tab key={i} label={label} />
                ))}
              </Tabs>

              {tab === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="name"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Имя *"
                          error={!!errors.name}
                          helperText={errors.name?.message as string}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="title"
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label="Титул / Прозвище" placeholder="напр. Храбрый" />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Controller
                      name="race"
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label="Раса" placeholder="напр. Полуэльф" />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Controller
                      name="characterClass"
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label="Класс" placeholder="напр. Паладин" />
                      )}
                    />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <Controller
                      name="level"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          fullWidth
                          label="Уровень"
                          type="number"
                          inputProps={{ min: 1, max: 30 }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Статус</InputLabel>
                          <Select {...field} label="Статус">
                            {CHARACTER_STATUSES.map(s => (
                              <MenuItem key={s} value={s}>{s}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="bio"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Биография"
                          multiline
                          rows={4}
                          placeholder="Краткое описание персонажа..."
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              )}

              {tab === 1 && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="appearance"
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label="Внешность" multiline rows={5} placeholder="Физическое описание..." />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="personality"
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label="Характер" multiline rows={5} placeholder="Черты, идеалы, привязанности, слабости..." />
                      )}
                    />
                  </Grid>
                </Grid>
              )}

              {tab === 2 && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="backstory"
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label="Предыстория" multiline rows={8} placeholder="История персонажа..." />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="notes"
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label="Заметки ДМа" multiline rows={5} placeholder="Личные заметки, секреты, зацепки..." />
                      )}
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
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  loading={saving}
                  disabled={!isDirty && !isNew}
                >
                  {isNew ? 'Создать' : 'Сохранить'}
                </DndButton>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};