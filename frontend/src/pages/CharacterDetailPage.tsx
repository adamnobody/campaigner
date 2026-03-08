import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Paper, TextField, Button,
  Avatar, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel,
  List, ListItem, ListItemText, Tabs, Tab,
  Grid, Tooltip, Autocomplete, InputAdornment,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import GroupsIcon from '@mui/icons-material/Groups';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { useParams, useNavigate } from 'react-router-dom';
import { useUIStore } from '@/store/useUIStore';
import { useCharacterStore } from '@/store/useCharacterStore';
import { useTagStore } from '@/store/useTagStore';
import { DndButton } from '@/components/ui/DndButton';

const RELATIONSHIP_TYPES = [
  'ally', 'enemy', 'family', 'friend', 'rival',
  'mentor', 'student', 'lover', 'spouse',
  'employer', 'employee', 'custom',
] as const;

type RelationshipType = typeof RELATIONSHIP_TYPES[number];

const isRelationshipType = (value: string): value is RelationshipType => {
  return RELATIONSHIP_TYPES.includes(value as RelationshipType);
};

const getRelationshipLabel = (value: unknown): string => {
  if (typeof value === 'string' && isRelationshipType(value)) {
    return RELATIONSHIP_LABELS[value];
  }
  return String(value ?? 'custom');
};

const getRelationshipColor = (value: unknown): string => {
  if (typeof value === 'string' && isRelationshipType(value)) {
    return RELATIONSHIP_COLORS[value];
  }
  return 'rgba(130,130,255,0.2)';
};

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  ally: 'Союзник',
  enemy: 'Враг',
  family: 'Семья',
  friend: 'Друг',
  rival: 'Соперник',
  mentor: 'Наставник',
  student: 'Ученик',
  lover: 'Возлюбленный',
  spouse: 'Супруг',
  employer: 'Работодатель',
  employee: 'Работник',
  custom: 'Другое',
};

const RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
  ally: 'rgba(78,205,196,0.25)',
  enemy: 'rgba(255,107,107,0.25)',
  family: 'rgba(187,143,206,0.25)',
  friend: 'rgba(130,225,170,0.25)',
  rival: 'rgba(255,200,100,0.25)',
  mentor: 'rgba(69,183,209,0.25)',
  student: 'rgba(69,183,209,0.15)',
  lover: 'rgba(255,130,170,0.25)',
  spouse: 'rgba(255,130,170,0.25)',
  employer: 'rgba(150,206,180,0.25)',
  employee: 'rgba(150,206,180,0.15)',
  custom: 'rgba(130,130,255,0.2)',
};

interface CharacterForm {
  name: string;
  title: string;
  bio: string;
  appearance: string;
  personality: string;
  backstory: string;
  notes: string;
  tagsStr: string;
}

const EMPTY_FORM: CharacterForm = {
  name: '',
  title: '',
  bio: '',
  appearance: '',
  personality: '',
  backstory: '',
  notes: '',
  tagsStr: '',
};

export const CharacterDetailPage: React.FC = () => {
  const { projectId, characterId } = useParams<{ projectId: string; characterId: string }>();
  const pid = parseInt(projectId!);
  const isNew = !characterId || characterId === 'new';
  const navigate = useNavigate();
  const { showSnackbar, showConfirmDialog } = useUIStore();

  const {
    characters,
    currentCharacter,
    relationships,
    loading,
    fetchCharacter,
    fetchCharacters,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    uploadImage,
    setTags,
    fetchRelationships,
    createRelationship,
    deleteRelationship,
    setCurrentCharacter,
  } = useCharacterStore();

  const {
    tags,
    fetchTags,
    findOrCreateTagsByNames,
  } = useTagStore();

  const [form, setForm] = useState<CharacterForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState(0);

  const [relDialogOpen, setRelDialogOpen] = useState(false);
  const [relForm, setRelForm] = useState<{
    targetId: string;
    type: RelationshipType;
    description: string;
  }>({
    targetId: '',
    type: 'ally',
    description: '',
  });
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    fetchTags(pid).catch(() => {});
    fetchCharacters(pid, { limit: 200 }).catch(() => {});
    fetchRelationships(pid).catch(() => {});
  }, [pid, fetchTags, fetchCharacters, fetchRelationships]);

  useEffect(() => {
    if (isNew) {
      setForm(EMPTY_FORM);
      setCurrentCharacter(null);
      setTagsInput('');
      return;
    }

    const cid = parseInt(characterId!);
    fetchCharacter(cid).catch((err) => {
      console.error('[CharacterDetail] Error:', err);
      showSnackbar('Ошибка загрузки персонажа', 'error');
    });
  }, [characterId, isNew, fetchCharacter, setCurrentCharacter, showSnackbar]);

  useEffect(() => {
    if (isNew) return;
    if (!currentCharacter) return;
    if (currentCharacter.id !== parseInt(characterId!)) return;

    setForm({
      name: currentCharacter.name || '',
      title: currentCharacter.title || '',
      bio: currentCharacter.bio || '',
      appearance: currentCharacter.appearance || '',
      personality: currentCharacter.personality || '',
      backstory: currentCharacter.backstory || '',
      notes: currentCharacter.notes || '',
      tagsStr: (currentCharacter.tags || []).map((t: any) => t.name).join(', '),
    });
    setTagsInput('');
  }, [currentCharacter, characterId, isNew]);

  const handleChange = (field: keyof CharacterForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRelationshipTypeChange = (e: SelectChangeEvent<RelationshipType>) => {
    const value = e.target.value;
    if (!isRelationshipType(value)) return;

    setRelForm((prev) => ({
      ...prev,
      type: value,
    }));
  };

  const mergeTagValues = (tagsString: string, pendingInput: string): string => {
    const committed = tagsString
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const pending = pendingInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    return Array.from(new Set([...committed, ...pending])).join(', ');
  };

  const saveTagsForCharacter = async (charId: number, tagsStr: string) => {
    const tagNames = tagsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (tagNames.length === 0) {
      await setTags(charId, []);
      return;
    }

    const tagIds = await findOrCreateTagsByNames(pid, tagNames);
    await setTags(charId, tagIds);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showSnackbar('Введите имя', 'error');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        title: form.title.trim(),
        bio: form.bio.trim(),
        appearance: form.appearance.trim(),
        personality: form.personality.trim(),
        backstory: form.backstory.trim(),
        notes: form.notes.trim(),
      };

      const finalTagsStr = mergeTagValues(form.tagsStr, tagsInput);

      if (isNew) {
        const created = await createCharacter({ ...payload, projectId: pid });

        if (created.id === undefined) {
          throw new Error('Character created without id');
        }

        if (finalTagsStr.trim()) {
          await saveTagsForCharacter(created.id, finalTagsStr);
        }

        setTagsInput('');
        showSnackbar('Персонаж создан!', 'success');
        navigate(`/project/${pid}/characters/${created.id}`, { replace: true });
      } else {
        const cid = parseInt(characterId!);
        await updateCharacter(cid, payload);
        await saveTagsForCharacter(cid, finalTagsStr);
        setTagsInput('');
        showSnackbar('Персонаж обновлён!', 'success');
      }
    } catch (err: any) {
      showSnackbar(err.message || 'Ошибка', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (isNew) return;

    showConfirmDialog(
      'Удалить персонажа',
      `Удалить "${form.name}"? Все связи тоже будут удалены.`,
      async () => {
        try {
          await deleteCharacter(parseInt(characterId!));
          showSnackbar('Персонаж удалён', 'success');
          navigate(`/project/${pid}/characters`);
        } catch {
          showSnackbar('Ошибка удаления', 'error');
        }
      }
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isNew || !characterId) return;

    try {
      await uploadImage(parseInt(characterId), file);
      showSnackbar('Фото загружено!', 'success');
    } catch {
      showSnackbar('Ошибка загрузки', 'error');
    }
  };

  const handleAddRelationship = async () => {
    if (!relForm.targetId || isNew || !characterId) return;

    try {
      await createRelationship({
        sourceCharacterId: parseInt(characterId),
        targetCharacterId: parseInt(relForm.targetId),
        relationshipType: relForm.type,
        description: relForm.description,
        projectId: pid,
        isBidirectional: true,
      });

      await fetchRelationships(pid);
      setRelDialogOpen(false);
      setRelForm({ targetId: '', type: 'ally', description: '' });
      showSnackbar('Связь добавлена!', 'success');
    } catch (err: any) {
      showSnackbar(err.message || 'Ошибка', 'error');
    }
  };

  const handleDeleteRelationship = (relId: number) => {
    showConfirmDialog('Удалить связь', 'Удалить эту связь?', async () => {
      try {
        await deleteRelationship(relId);
        showSnackbar('Связь удалена', 'success');
      } catch {
        showSnackbar('Ошибка', 'error');
      }
    });
  };

  const cid = characterId && !isNew ? parseInt(characterId) : 0;
  const previewTagsStr = mergeTagValues(form.tagsStr, tagsInput);

  const allCharacters = useMemo(() => {
    return characters.filter((ch: any) => ch.id !== cid);
  }, [characters, cid]);

  const allTagNames = useMemo(() => tags.map((t) => t.name), [tags]);

  const characterRelationships = useMemo(() => {
    if (!cid) return [];
    return relationships.filter((r: any) =>
      r.sourceCharacterId === cid || r.targetCharacterId === cid
    );
  }, [relationships, cid]);

  const allRelsForDisplay = useMemo(() => {
    return characterRelationships.map((rel: any) => {
      const isOutgoing = rel.sourceCharacterId === cid;
      return {
        ...rel,
        isOutgoing,
        otherName: isOutgoing
          ? (rel.targetCharacterName || rel.targetCharacter?.name || `ID: ${rel.targetCharacterId}`)
          : (rel.sourceCharacterName || rel.sourceCharacter?.name || `ID: ${rel.sourceCharacterId}`),
        otherId: isOutgoing ? rel.targetCharacterId : rel.sourceCharacterId,
      };
    });
  }, [characterRelationships, cid]);

  if (loading && !isNew && !currentCharacter) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>Загрузка...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate(`/project/${pid}/characters`)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '1.8rem', color: '#fff' }}>
            {isNew ? 'Новый персонаж' : form.name || 'Персонаж'}
          </Typography>
          {form.title && (
            <Typography sx={{ color: 'rgba(201,169,89,0.8)', fontStyle: 'italic', fontSize: '1rem' }}>
              — {form.title}
            </Typography>
          )}
        </Box>
        <Box display="flex" gap={1}>
          {!isNew && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
              size="small"
            >
              Удалить
            </Button>
          )}
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
      </Box>

      <Box display="flex" gap={3} sx={{ flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ width: { xs: '100%', md: 280 }, flexShrink: 0 }}>
          <Paper
            sx={{
              p: 3,
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              textAlign: 'center',
            }}
          >
            <Box sx={{ mb: 2 }}>
              {currentCharacter?.imagePath ? (
                <Avatar
                  src={currentCharacter.imagePath}
                  sx={{ width: 160, height: 160, borderRadius: 3, mx: 'auto' }}
                  variant="rounded"
                />
              ) : (
                <Avatar
                  sx={{
                    width: 160,
                    height: 160,
                    borderRadius: 3,
                    mx: 'auto',
                    bgcolor: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.2)',
                  }}
                  variant="rounded"
                >
                  <PersonIcon sx={{ fontSize: 64 }} />
                </Avatar>
              )}
            </Box>

            {!isNew && (
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                fullWidth
                size="small"
                sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', mb: 2 }}
              >
                Загрузить фото
                <input
                  type="file"
                  hidden
                  accept="image/jpeg,image/png,image/svg+xml,image/webp"
                  onChange={handleImageUpload}
                />
              </Button>
            )}

            <Box sx={{ textAlign: 'left' }}>
              {form.title && (
                <Box sx={{ mb: 1, pb: 1, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', display: 'block', lineHeight: 1 }}>
                    Титул
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                    {form.title}
                  </Typography>
                </Box>
              )}

              {form.bio && (
                <Box sx={{ mb: 1, pb: 1, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', display: 'block', lineHeight: 1 }}>
                    Описание
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                    {form.bio}
                  </Typography>
                </Box>
              )}

              {previewTagsStr.trim() && (
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', display: 'block', mb: 0.5 }}>
                    Теги
                  </Typography>
                  <Box display="flex" gap={0.5} flexWrap="wrap">
                    {previewTagsStr.split(',').map((tag, i) => {
                      const t = tag.trim();
                      return t ? (
                        <Chip
                          key={i}
                          label={t}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.7rem',
                            backgroundColor: 'rgba(130,130,255,0.2)',
                            color: '#fff',
                          }}
                        />
                      ) : null;
                    })}
                  </Box>
                </Box>
              )}
            </Box>

            {!isNew && (
              <Box
                sx={{
                  mt: 2,
                  pt: 2,
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 2,
                }}
              >
                <Tooltip title="Связи">
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <GroupsIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      {characterRelationships.length}
                    </Typography>
                  </Box>
                </Tooltip>
              </Box>
            )}
          </Paper>
        </Box>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Paper sx={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', px: 2 }}
            >
              <Tab label="Основное" />
              <Tab label="Описание" />
              <Tab label="История" />
              {!isNew && <Tab label={`Связи (${characterRelationships.length})`} />}
            </Tabs>

            <Box sx={{ p: 3 }}>
              {tab === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Имя *"
                      value={form.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Титул / Прозвище"
                      value={form.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      placeholder="напр. Король Севера"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Краткое описание"
                      value={form.bio}
                      onChange={(e) => handleChange('bio', e.target.value)}
                      multiline
                      rows={3}
                      placeholder="Кто этот персонаж..."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Autocomplete
                      multiple
                      freeSolo
                      options={allTagNames}
                      value={form.tagsStr ? form.tagsStr.split(',').map((s) => s.trim()).filter(Boolean) : []}
                      inputValue={tagsInput}
                      onInputChange={(_, value) => setTagsInput(value)}
                      onChange={(_, vals) => handleChange('tagsStr', vals.join(', '))}
                      renderTags={(value, getTagProps) =>
                        value.map((opt, index) => (
                          <Chip
                            {...getTagProps({ index })}
                            key={opt}
                            label={opt}
                            size="small"
                            sx={{ backgroundColor: 'rgba(130,130,255,0.2)', color: '#fff', fontSize: '0.75rem' }}
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Теги"
                          placeholder="Выберите или введите..."
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <InputAdornment position="start">
                                  <LocalOfferIcon sx={{ color: 'rgba(201,169,89,0.5)', fontSize: 18 }} />
                                </InputAdornment>
                                {params.InputProps.startAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                      noOptionsText="Введите новый тег"
                      sx={{
                        '& .MuiAutocomplete-clearIndicator': { color: 'rgba(255,255,255,0.3)' },
                        '& .MuiAutocomplete-popupIndicator': { color: 'rgba(255,255,255,0.3)' },
                      }}
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
                      value={form.appearance}
                      onChange={(e) => handleChange('appearance', e.target.value)}
                      multiline
                      rows={5}
                      placeholder="Опишите внешний вид персонажа..."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Характер"
                      value={form.personality}
                      onChange={(e) => handleChange('personality', e.target.value)}
                      multiline
                      rows={5}
                      placeholder="Черты характера, привычки, мотивации..."
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
                      value={form.backstory}
                      onChange={(e) => handleChange('backstory', e.target.value)}
                      multiline
                      rows={7}
                      placeholder="Откуда пришёл этот персонаж..."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Заметки"
                      value={form.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      multiline
                      rows={4}
                      placeholder="Секреты, планы, идеи..."
                    />
                  </Grid>
                </Grid>
              )}

              {tab === 3 && !isNew && (
                <Box>
                  <Box display="flex" justifyContent="flex-end" mb={2}>
                    <DndButton
                      variant="outlined"
                      startIcon={<AddIcon />}
                      size="small"
                      onClick={() => setRelDialogOpen(true)}
                      sx={{ borderColor: 'rgba(130,130,255,0.4)', color: 'rgba(130,130,255,0.9)' }}
                    >
                      Добавить связь
                    </DndButton>
                  </Box>

                  {allRelsForDisplay.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <GroupsIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.1)', mb: 1 }} />
                      <Typography sx={{ color: 'rgba(255,255,255,0.35)' }}>Нет связей</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.2)' }}>
                        Добавьте связи с другими персонажами
                      </Typography>
                    </Box>
                  ) : (
                    <List disablePadding>
                      {allRelsForDisplay.map((rel: any) => (
                        <ListItem
                          key={rel.id}
                          secondaryAction={
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRelationship(rel.id);
                              }}
                            >
                              <DeleteIcon fontSize="small" sx={{ color: 'rgba(255,100,100,0.5)' }} />
                            </IconButton>
                          }
                          onClick={() => navigate(`/project/${pid}/characters/${rel.otherId}`)}
                          sx={{
                            backgroundColor: getRelationshipColor(rel.relationshipType),
                            borderRadius: 1.5,
                            mb: 1,
                            cursor: 'pointer',
                            border: '1px solid rgba(255,255,255,0.04)',
                            '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                                  {rel.isOutgoing ? '→' : '←'}
                                </Typography>
                                <Chip
                                    label={getRelationshipLabel(rel.relationshipType)}
                                    size="small"
                                    sx={{
                                      backgroundColor: getRelationshipColor(rel.relationshipType),
                                      color: '#fff',
                                      fontSize: '0.7rem',
                                      fontWeight: 600,
                                    }}
                                  />
                                <Typography sx={{ color: '#fff', fontWeight: 600 }}>
                                  {rel.otherName}
                                </Typography>
                              </Box>
                            }
                            secondary={rel.description ? (
                              <Typography
                                variant="caption"
                                sx={{ color: 'rgba(255,255,255,0.35)', mt: 0.5, display: 'block' }}
                              >
                                {rel.description}
                              </Typography>
                            ) : null}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>

      <Dialog
        open={relDialogOpen}
        onClose={() => setRelDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>Добавить связь</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>С кем</InputLabel>
            <Select
              value={relForm.targetId}
              label="С кем"
              onChange={(e) => setRelForm((prev) => ({ ...prev, targetId: e.target.value }))}
            >
              {allCharacters.map((ch: any) => (
                <MenuItem key={ch.id} value={String(ch.id)}>
                  {ch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Тип связи</InputLabel>
            <Select<RelationshipType>
              value={relForm.type}
              label="Тип связи"
              onChange={handleRelationshipTypeChange}
            >
              {RELATIONSHIP_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: RELATIONSHIP_COLORS[t],
                      }}
                    />
                    {RELATIONSHIP_LABELS[t]}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Описание связи"
            value={relForm.description}
            onChange={(e) => setRelForm((prev) => ({ ...prev, description: e.target.value }))}
            margin="normal"
            multiline
            rows={2}
            placeholder="Подробности отношений..."
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRelDialogOpen(false)} color="inherit">
            Отмена
          </Button>
          <DndButton variant="contained" onClick={handleAddRelationship} disabled={!relForm.targetId}>
            Добавить
          </DndButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};