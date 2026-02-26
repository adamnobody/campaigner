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

// Единая форм-схема без projectId — подходит и для создания, и для редактирования
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
  const { currentCharacter, fetchCharacter, createCharacter, updateCharacter, uploadImage } = useCharacterStore();
  const { showSnackbar } = useUIStore();
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState(0);

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

  useEffect(() => {
    if (!isNew && characterId) {
      fetchCharacter(parseInt(characterId));
    }
  }, [isNew, characterId, fetchCharacter]);

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
        showSnackbar('Character created!', 'success');
        navigate(`/project/${pid}/characters/${character.id}`, { replace: true });
      } else {
        await updateCharacter(parseInt(characterId!), data);
        showSnackbar('Character updated!', 'success');
      }
    } catch {
      showSnackbar('Failed to save character', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isNew || !characterId) return;
    try {
      await uploadImage(parseInt(characterId), file);
      showSnackbar('Image uploaded!', 'success');
    } catch {
      showSnackbar('Failed to upload image', 'error');
    }
  };

  if (!isNew && !currentCharacter) return <LoadingScreen />;

  const tabPanels = ['Basic Info', 'Appearance & Personality', 'Backstory & Notes'];

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={() => navigate(`/project/${pid}/characters`)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h3">
          {isNew ? 'New Character' : currentCharacter?.name}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* Left: Avatar */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
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
                    bgcolor: 'primary.dark',
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
                >
                  Upload Image
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
            <Paper sx={{ p: 3 }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
                {tabPanels.map((label, i) => (
                  <Tab key={i} label={label} />
                ))}
              </Tabs>

              {/* Tab 0: Basic Info */}
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
                          label="Name *"
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
                        <TextField {...field} fullWidth label="Title / Epithet" placeholder="e.g. The Brave" />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Controller
                      name="race"
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label="Race" placeholder="e.g. Half-Elf" />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Controller
                      name="characterClass"
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label="Class" placeholder="e.g. Paladin" />
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
                          label="Level"
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
                          <InputLabel>Status</InputLabel>
                          <Select {...field} label="Status">
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
                          label="Bio"
                          multiline
                          rows={4}
                          placeholder="Brief character description..."
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              )}

              {/* Tab 1: Appearance & Personality */}
              {tab === 1 && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="appearance"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Appearance"
                          multiline
                          rows={5}
                          placeholder="Physical description..."
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="personality"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Personality"
                          multiline
                          rows={5}
                          placeholder="Character traits, ideals, bonds, flaws..."
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              )}

              {/* Tab 2: Backstory & Notes */}
              {tab === 2 && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="backstory"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Backstory"
                          multiline
                          rows={8}
                          placeholder="Character's history..."
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="notes"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="DM Notes"
                          multiline
                          rows={5}
                          placeholder="Private notes, secrets, plot hooks..."
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              )}

              <Divider sx={{ my: 3 }} />

              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => navigate(`/project/${pid}/characters`)}
                >
                  Cancel
                </Button>
                <DndButton
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  loading={saving}
                  disabled={!isDirty && !isNew}
                >
                  {isNew ? 'Create Character' : 'Save Changes'}
                </DndButton>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};