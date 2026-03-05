import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, TextField, Button,
  Avatar, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel,
  List, ListItem, ListItemText, Tabs, Tab,
  Grid, Tooltip, Autocomplete, InputAdornment,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import GroupsIcon from '@mui/icons-material/Groups';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { useParams, useNavigate } from 'react-router-dom';
import { charactersApi, tagsApi } from '@/api/axiosClient';
import { useUIStore } from '@/store/useUIStore';
import { DndButton } from '@/components/ui/DndButton';


const RELATIONSHIP_TYPES = [
  'ally', 'enemy', 'family', 'friend', 'rival',
  'mentor', 'student', 'lover', 'spouse',
  'employer', 'employee', 'custom',
];

const RELATIONSHIP_LABELS: Record<string, string> = {
  ally: 'Союзник', enemy: 'Враг', family: 'Семья', friend: 'Друг',
  rival: 'Соперник', mentor: 'Наставник', student: 'Ученик',
  lover: 'Возлюбленный', spouse: 'Супруг', employer: 'Работодатель',
  employee: 'Работник', custom: 'Другое',
};

const RELATIONSHIP_COLORS: Record<string, string> = {
  ally: 'rgba(78,205,196,0.25)', enemy: 'rgba(255,107,107,0.25)',
  family: 'rgba(187,143,206,0.25)', friend: 'rgba(130,225,170,0.25)',
  rival: 'rgba(255,200,100,0.25)', mentor: 'rgba(69,183,209,0.25)',
  student: 'rgba(69,183,209,0.15)', lover: 'rgba(255,130,170,0.25)',
  spouse: 'rgba(255,130,170,0.25)', employer: 'rgba(150,206,180,0.25)',
  employee: 'rgba(150,206,180,0.15)', custom: 'rgba(130,130,255,0.2)',
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
  name: '', title: '', bio: '', appearance: '',
  personality: '', backstory: '', notes: '', tagsStr: '',
};

export const CharacterDetailPage: React.FC = () => {
  const { projectId, characterId } = useParams<{ projectId: string; characterId: string }>();
  const pid = parseInt(projectId!);
  const isNew = !characterId || characterId === 'new';
  const navigate = useNavigate();
  const { showSnackbar, showConfirmDialog } = useUIStore();

  const [form, setForm] = useState<CharacterForm>(EMPTY_FORM);
  const [character, setCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState(0);

  const [relationships, setRelationships] = useState<any[]>([]);
  const [allCharacters, setAllCharacters] = useState<any[]>([]);
  const [relDialogOpen, setRelDialogOpen] = useState(false);
  const [relForm, setRelForm] = useState({ targetId: '', type: 'ally', description: '' });
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    tagsApi.getAll(pid).then(res => {
      setAllTags((res.data.data || []).map((t: any) => t.name));
    }).catch(() => {});
  }, [pid]);

  useEffect(() => {
    if (isNew) {
      setForm(EMPTY_FORM);
      setCharacter(null);
      setRelationships([]);
      setAllCharacters([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const cid = parseInt(characterId!);

    Promise.all([
      charactersApi.getById(cid),
      charactersApi.getRelationships(pid),
      charactersApi.getAll(pid, { limit: 200 }),
    ]).then(([charRes, relRes, allRes]) => {
      const c = charRes.data.data;
      setCharacter(c);
      setForm({
        name: c.name || '',
        title: c.title || '',
        bio: c.bio || '',
        appearance: c.appearance || '',
        personality: c.personality || '',
        backstory: c.backstory || '',
        notes: c.notes || '',
        tagsStr: (c.tags || []).map((t: any) => t.name).join(', '),
      });
      const allRels = relRes.data.data || [];
      setRelationships(allRels.filter((r: any) =>
        r.sourceCharacterId === cid || r.targetCharacterId === cid
      ));
      setAllCharacters((allRes.data.data.items || []).filter((ch: any) => ch.id !== cid));
      setLoading(false);
    }).catch(err => {
      console.error('[CharacterDetail] Error:', err);
      setLoading(false);
    });
  }, [characterId, isNew, pid]);

  const handleChange = (field: keyof CharacterForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const saveTags = async (charId: number, tagsStr: string) => {
    const tagNames = tagsStr.split(',').map(s => s.trim()).filter(Boolean);
    if (tagNames.length === 0) {
      await charactersApi.setTags(charId, []);
      return;
    }
    const existingRes = await tagsApi.getAll(pid);
    const existingTags: any[] = existingRes.data.data || [];
    const tagIds: number[] = [];
    for (const name of tagNames) {
      const existing = existingTags.find((t: any) => t.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        tagIds.push(existing.id);
      } else {
        const newRes = await tagsApi.create({ name, projectId: pid });
        tagIds.push(newRes.data.data.id);
      }
    }
    await charactersApi.setTags(charId, tagIds);
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

      if (isNew) {
        const res = await charactersApi.create({ ...payload, projectId: pid });
        const created = res.data.data;
        if (form.tagsStr.trim()) await saveTags(created.id, form.tagsStr);
        showSnackbar('Персонаж создан!', 'success');
        navigate(`/project/${pid}/characters/${created.id}`, { replace: true });
      } else {
        await charactersApi.update(parseInt(characterId!), payload);
        await saveTags(parseInt(characterId!), form.tagsStr);
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
    showConfirmDialog('Удалить персонажа', `Удалить "${form.name}"? Все связи тоже будут удалены.`, async () => {
      try {
        await charactersApi.delete(parseInt(characterId!));
        showSnackbar('Персонаж удалён', 'success');
        navigate(`/project/${pid}/characters`);
      } catch {
        showSnackbar('Ошибка удаления', 'error');
      }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isNew || !characterId) return;
    try {
      const res = await charactersApi.uploadImage(parseInt(characterId), file);
      setCharacter(res.data.data);
      showSnackbar('Фото загружено!', 'success');
    } catch {
      showSnackbar('Ошибка загрузки', 'error');
    }
  };

  const handleAddRelationship = async () => {
    if (!relForm.targetId) return;
    try {
      await charactersApi.createRelationship({
        sourceCharacterId: parseInt(characterId!),
        targetCharacterId: parseInt(relForm.targetId),
        relationshipType: relForm.type,
        description: relForm.description,
        projectId: pid,
        isBidirectional: true,
      });
      const relRes = await charactersApi.getRelationships(pid);
      const allRels = relRes.data.data || [];
      const cid = parseInt(characterId!);
      setRelationships(allRels.filter((r: any) =>
        r.sourceCharacterId === cid || r.targetCharacterId === cid
      ));
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
        await charactersApi.deleteRelationship(relId);
        setRelationships(prev => prev.filter(r => r.id !== relId));
        showSnackbar('Связь удалена', 'success');
      } catch {
        showSnackbar('Ошибка', 'error');
      }
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>Загрузка...</Typography>
      </Box>
    );
  }

  const cid = characterId ? parseInt(characterId) : 0;

  const allRelsForDisplay = relationships.map(rel => {
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

  return (
    <Box>
      {/* Header */}
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
            <Button variant="outlined" color="error" startIcon={<DeleteIcon />}
              onClick={handleDelete} size="small">
              Удалить
            </Button>
          )}
          <DndButton variant="contained" startIcon={<SaveIcon />} onClick={handleSave}
            loading={saving} disabled={!form.name.trim()}>
            {isNew ? 'Создать' : 'Сохранить'}
          </DndButton>
        </Box>
      </Box>

      <Box display="flex" gap={3} sx={{ flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Left sidebar: Avatar + quick info */}
        <Box sx={{ width: { xs: '100%', md: 280 }, flexShrink: 0 }}>
          <Paper sx={{ p: 3, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
            <Box sx={{ mb: 2 }}>
              {character?.imagePath ? (
                <Avatar src={character.imagePath} sx={{ width: 160, height: 160, borderRadius: 3, mx: 'auto' }} variant="rounded" />
              ) : (
                <Avatar sx={{ width: 160, height: 160, borderRadius: 3, mx: 'auto', bgcolor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.2)' }} variant="rounded">
                  <PersonIcon sx={{ fontSize: 64 }} />
                </Avatar>
              )}
            </Box>

            {!isNew && (
              <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} fullWidth size="small"
                sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', mb: 2 }}>
                Загрузить фото
                <input type="file" hidden accept="image/jpeg,image/png,image/svg+xml,image/webp" onChange={handleImageUpload} />
              </Button>
            )}

            {/* Quick info */}
            <Box sx={{ textAlign: 'left' }}>
              {form.title && (
                <Box sx={{ mb: 1, pb: 1, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', display: 'block', lineHeight: 1 }}>Титул</Typography>
                  <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>{form.title}</Typography>
                </Box>
              )}
              {form.bio && (
                <Box sx={{ mb: 1, pb: 1, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', display: 'block', lineHeight: 1 }}>Описание</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>{form.bio}</Typography>
                </Box>
              )}

              {form.tagsStr.trim() && (
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', display: 'block', mb: 0.5 }}>Теги</Typography>
                  <Box display="flex" gap={0.5} flexWrap="wrap">
                    {form.tagsStr.split(',').map((tag, i) => {
                      const t = tag.trim();
                      return t ? (
                        <Chip key={i} label={t} size="small"
                          sx={{ height: 22, fontSize: '0.7rem', backgroundColor: 'rgba(130,130,255,0.2)', color: '#fff' }} />
                      ) : null;
                    })}
                  </Box>
                </Box>
              )}
            </Box>

            {!isNew && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Tooltip title="Связи">
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <GroupsIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>{relationships.length}</Typography>
                  </Box>
                </Tooltip>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Right: Tabs */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Paper sx={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)}
              sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', px: 2 }}>
              <Tab label="Основное" />
              <Tab label="Описание" />
              <Tab label="История" />
              {!isNew && <Tab label={`Связи (${relationships.length})`} />}
            </Tabs>

            <Box sx={{ p: 3 }}>
              {/* Tab 0: Basic */}
              {tab === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Имя *" value={form.name}
                      onChange={e => handleChange('name', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Титул / Прозвище" value={form.title}
                      onChange={e => handleChange('title', e.target.value)}
                      placeholder="напр. Король Севера" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Краткое описание" value={form.bio}
                      onChange={e => handleChange('bio', e.target.value)}
                      multiline rows={3} placeholder="Кто этот персонаж..." />
                  </Grid>
                  <Grid item xs={12}>
                    <Autocomplete
                      multiple freeSolo
                      options={allTags}
                      value={form.tagsStr ? form.tagsStr.split(',').map(s => s.trim()).filter(Boolean) : []}
                      onChange={(_, vals) => handleChange('tagsStr', vals.join(', '))}
                      renderTags={(value, getTagProps) =>
                        value.map((opt, index) => (
                          <Chip {...getTagProps({ index })} key={opt} label={opt} size="small"
                            sx={{ backgroundColor: 'rgba(130,130,255,0.2)', color: '#fff', fontSize: '0.75rem' }} />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField {...params} label="Теги" placeholder="Выберите или введите..."
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

              {/* Tab 1: Description */}
              {tab === 1 && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Внешность" value={form.appearance}
                      onChange={e => handleChange('appearance', e.target.value)}
                      multiline rows={5} placeholder="Опишите внешний вид персонажа..." />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Характер" value={form.personality}
                      onChange={e => handleChange('personality', e.target.value)}
                      multiline rows={5} placeholder="Черты характера, привычки, мотивации..." />
                  </Grid>
                </Grid>
              )}

              {/* Tab 2: Story */}
              {tab === 2 && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Предыстория" value={form.backstory}
                      onChange={e => handleChange('backstory', e.target.value)}
                      multiline rows={7} placeholder="Откуда пришёл этот персонаж..." />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Заметки" value={form.notes}
                      onChange={e => handleChange('notes', e.target.value)}
                      multiline rows={4} placeholder="Секреты, планы, идеи..." />
                  </Grid>
                </Grid>
              )}

              {/* Tab 3: Relationships */}
              {tab === 3 && !isNew && (
                <Box>
                  <Box display="flex" justifyContent="flex-end" mb={2}>
                    <DndButton variant="outlined" startIcon={<AddIcon />} size="small"
                      onClick={() => {
                        if (allCharacters.length === 0) {
                          charactersApi.getAll(pid, { limit: 200 }).then(res => {
                            setAllCharacters((res.data.data.items || []).filter((ch: any) => ch.id !== cid));
                          });
                        }
                        setRelDialogOpen(true);
                      }}
                      sx={{ borderColor: 'rgba(130,130,255,0.4)', color: 'rgba(130,130,255,0.9)' }}>
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
                      {allRelsForDisplay.map(rel => (
                        <ListItem
                          key={rel.id}
                          secondaryAction={
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteRelationship(rel.id); }}>
                              <DeleteIcon fontSize="small" sx={{ color: 'rgba(255,100,100,0.5)' }} />
                            </IconButton>
                          }
                          onClick={() => navigate(`/project/${pid}/characters/${rel.otherId}`)}
                          sx={{
                            backgroundColor: RELATIONSHIP_COLORS[rel.relationshipType] || 'rgba(130,130,255,0.1)',
                            borderRadius: 1.5, mb: 1, cursor: 'pointer',
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
                                  label={RELATIONSHIP_LABELS[rel.relationshipType] || rel.relationshipType}
                                  size="small"
                                  sx={{
                                    backgroundColor: RELATIONSHIP_COLORS[rel.relationshipType] || 'rgba(130,130,255,0.2)',
                                    color: '#fff', fontSize: '0.7rem', fontWeight: 600,
                                  }}
                                />
                                <Typography sx={{ color: '#fff', fontWeight: 600 }}>{rel.otherName}</Typography>
                              </Box>
                            }
                            secondary={rel.description ? (
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', mt: 0.5, display: 'block' }}>
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

      {/* Add Relationship Dialog */}
      <Dialog open={relDialogOpen} onClose={() => setRelDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}>
        <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>Добавить связь</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>С кем</InputLabel>
            <Select value={relForm.targetId} label="С кем"
              onChange={e => setRelForm(prev => ({ ...prev, targetId: e.target.value }))}>
              {allCharacters.map(ch => (
                <MenuItem key={ch.id} value={String(ch.id)}>{ch.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Тип связи</InputLabel>
            <Select value={relForm.type} label="Тип связи"
              onChange={e => setRelForm(prev => ({ ...prev, type: e.target.value }))}>
              {RELATIONSHIP_TYPES.map(t => (
                <MenuItem key={t} value={t}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%',
                      backgroundColor: RELATIONSHIP_COLORS[t] || 'rgba(130,130,255,0.3)' }} />
                    {RELATIONSHIP_LABELS[t] || t}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField fullWidth label="Описание связи" value={relForm.description}
            onChange={e => setRelForm(prev => ({ ...prev, description: e.target.value }))}
            margin="normal" multiline rows={2} placeholder="Подробности отношений..." />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRelDialogOpen(false)} color="inherit">Отмена</Button>
          <DndButton variant="contained" onClick={handleAddRelationship} disabled={!relForm.targetId}>
            Добавить
          </DndButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};