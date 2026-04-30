import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, TextField, Button,
  Avatar, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, Autocomplete,
  List, ListItem, ListItemText, ListItemAvatar,
  Grid, alpha, useTheme,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import GroupsIcon from '@mui/icons-material/Groups';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import FaceIcon from '@mui/icons-material/Face';
import PsychologyIcon from '@mui/icons-material/Psychology';
import { useParams, useNavigate } from 'react-router-dom';
import { CharacterTraitsTab } from '@/pages/characters/components/CharacterTraitsTab';
import { uploadAssetUrl } from '@/utils/uploadAssetUrl';
import { factionsApi } from '@/api/factions';
import { useUIStore } from '@/store/useUIStore';
import { useCharacterStore } from '@/store/useCharacterStore';
import { useTagStore } from '@/store/useTagStore';
import { shallow } from 'zustand/shallow';
import { DndButton } from '@/components/ui/DndButton';
import { TagAutocompleteField } from '@/components/forms/TagAutocompleteField';
import { CollapsibleSection as Section } from '@/components/detail/CollapsibleSection';
import { EntityHeroLayout } from '@/components/ui/EntityHeroLayout';
import { EntityTabs } from '@/components/ui/EntityTabs';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { routes } from '@/utils/routes';

// ==================== Constants ====================

const RELATIONSHIP_TYPES = [
  'ally', 'enemy', 'family', 'friend', 'rival',
  'mentor', 'student', 'lover', 'spouse',
  'employer', 'employee', 'custom',
] as const;

type RelationshipType = typeof RELATIONSHIP_TYPES[number];

const isRelationshipType = (value: string): value is RelationshipType =>
  RELATIONSHIP_TYPES.includes(value as RelationshipType);

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  ally: 'Союзник', enemy: 'Враг', family: 'Семья', friend: 'Друг',
  rival: 'Соперник', mentor: 'Наставник', student: 'Ученик',
  lover: 'Возлюбленный', spouse: 'Супруг', employer: 'Работодатель',
  employee: 'Работник', custom: 'Другое',
};

const getRelationshipLabel = (value: unknown): string => {
  if (typeof value === 'string' && isRelationshipType(value)) return RELATIONSHIP_LABELS[value];
  return String(value ?? 'custom');
};

const getRelationshipColor = (value: unknown, theme: any): string => {
  if (typeof value === 'string' && isRelationshipType(value)) {
    const colorMap: Record<RelationshipType, string> = {
      ally: theme.palette.success.main,
      enemy: theme.palette.error.main,
      family: theme.palette.secondary.main,
      friend: theme.palette.info.main,
      rival: theme.palette.warning.main,
      mentor: theme.palette.primary.light,
      student: theme.palette.primary.light,
      lover: theme.palette.secondary.light,
      spouse: theme.palette.secondary.light,
      employer: theme.palette.success.light,
      employee: theme.palette.success.light,
      custom: theme.palette.primary.main,
    };
    return colorMap[value] || theme.palette.primary.main;
  }
  return theme.palette.primary.main;
};

interface CharacterForm {
  name: string; title: string; bio: string; appearance: string;
  backstory: string; notes: string; tagsStr: string;
  stateId: string;
  factionIds: number[];
}

const EMPTY_FORM: CharacterForm = {
  name: '', title: '', bio: '', appearance: '',
  backstory: '', notes: '', tagsStr: '', stateId: '', factionIds: [],
};

// ==================== Helpers ====================

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const theme = useTheme();
  return (
    <Box sx={{ mb: 0.5, pb: 1, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2, mb: 0.5 }}>{label}</Typography>
      <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>{value}</Typography>
    </Box>
  );
};

// ==================== Component ====================

export const CharacterDetailPage: React.FC = () => {
  const { projectId, characterId } = useParams<{ projectId: string; characterId: string }>();
  const pid = parseInt(projectId!);
  const isNew = !characterId || characterId === 'new';
  const navigate = useNavigate();
  const theme = useTheme();
  
  const { showSnackbar, showConfirmDialog } = useUIStore((state) => ({
    showSnackbar: state.showSnackbar,
    showConfirmDialog: state.showConfirmDialog,
  }), shallow);

  const {
    characters, currentCharacter, relationships, loading,
    fetchCharacter, fetchCharacters, createCharacter, updateCharacter,
    deleteCharacter, uploadImage, setTags,
    fetchRelationships, createRelationship, deleteRelationship, setCurrentCharacter,
  } = useCharacterStore((state) => ({
    characters: state.characters,
    currentCharacter: state.currentCharacter,
    relationships: state.relationships,
    loading: state.loading,
    fetchCharacter: state.fetchCharacter,
    fetchCharacters: state.fetchCharacters,
    createCharacter: state.createCharacter,
    updateCharacter: state.updateCharacter,
    deleteCharacter: state.deleteCharacter,
    uploadImage: state.uploadImage,
    setTags: state.setTags,
    fetchRelationships: state.fetchRelationships,
    createRelationship: state.createRelationship,
    deleteRelationship: state.deleteRelationship,
    setCurrentCharacter: state.setCurrentCharacter,
  }), shallow);

  const { tags, fetchTags, findOrCreateTagsByNames } = useTagStore((state) => ({
    tags: state.tags,
    fetchTags: state.fetchTags,
    findOrCreateTagsByNames: state.findOrCreateTagsByNames,
  }), shallow);

  const [form, setForm] = useState<CharacterForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [stateOptions, setStateOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [factionOptions, setFactionOptions] = useState<Array<{ id: number; name: string }>>([]);

  const [relDialogOpen, setRelDialogOpen] = useState(false);
  const [relForm, setRelForm] = useState<{ targetId: string; type: RelationshipType; description: string }>({
    targetId: '', type: 'ally', description: '',
  });

  // ==================== Load ====================

  useEffect(() => {
    let cancelled = false;

    fetchTags(pid).catch(() => {});
    fetchCharacters(pid, { limit: 200 }).catch(() => {});
    fetchRelationships(pid).catch(() => {});

    factionsApi
      .getAll(pid, { kind: 'state', limit: 500 })
      .then((res) => {
        if (cancelled) return;
        setStateOptions((res.data.data || []).map((item) => ({ id: item.id, name: item.name })));
      })
      .catch(() => {});

    factionsApi
      .getAll(pid, { kind: 'faction', limit: 500 })
      .then((res) => {
        if (cancelled) return;
        setFactionOptions((res.data.data || []).map((item) => ({ id: item.id, name: item.name })));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [pid]);

  useEffect(() => {
    if (isNew) { setForm(EMPTY_FORM); setCurrentCharacter(null); setTagsInput(''); return; }
    fetchCharacter(parseInt(characterId!)).catch(() => showSnackbar('Ошибка загрузки', 'error'));
  }, [characterId, isNew]);

  useEffect(() => {
    if (isNew || !currentCharacter || currentCharacter.id !== parseInt(characterId!)) return;
    setForm({
      name: currentCharacter.name || '', title: currentCharacter.title || '',
      bio: currentCharacter.bio || '', appearance: currentCharacter.appearance || '',
      backstory: currentCharacter.backstory || '',
      notes: currentCharacter.notes || '',
      tagsStr: (currentCharacter.tags || []).map((t: any) => t.name).join(', '),
      stateId: currentCharacter.stateId ? String(currentCharacter.stateId) : '',
      factionIds: currentCharacter.factionIds || [],
    });
    setTagsInput('');
  }, [currentCharacter, characterId, isNew]);

  // ==================== Helpers ====================

  const handleChange = (field: keyof CharacterForm, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleRelationshipTypeChange = (e: SelectChangeEvent<RelationshipType>) => {
    const value = e.target.value;
    if (!isRelationshipType(value)) return;
    setRelForm(prev => ({ ...prev, type: value }));
  };

  const mergeTagValues = (a: string, b: string): string => {
    const all = [...a.split(','), ...b.split(',')].map(s => s.trim()).filter(Boolean);
    return Array.from(new Set(all)).join(', ');
  };

  const saveTagsForCharacter = async (charId: number, str: string) => {
    const names = str.split(',').map(s => s.trim()).filter(Boolean);
    if (!names.length) { await setTags(charId, []); return; }
    const ids = await findOrCreateTagsByNames(pid, names);
    await setTags(charId, ids);
  };

  const cid = characterId && !isNew ? parseInt(characterId) : 0;
  const previewTagsStr = mergeTagValues(form.tagsStr, tagsInput);
  const allCharacters = useMemo(() => characters.filter((ch: any) => ch.id !== cid), [characters, cid]);
  const allTagNames = useMemo(() => tags.map(t => t.name), [tags]);
  const characterRelationships = useMemo(() => cid ? relationships.filter((r: any) => r.sourceCharacterId === cid || r.targetCharacterId === cid) : [], [relationships, cid]);

  const allRelsForDisplay = useMemo(() => characterRelationships.map((rel: any) => {
    const isOutgoing = rel.sourceCharacterId === cid;
    return {
      ...rel, isOutgoing,
      otherName: isOutgoing
        ? (rel.targetCharacterName || rel.targetCharacter?.name || `ID: ${rel.targetCharacterId}`)
        : (rel.sourceCharacterName || rel.sourceCharacter?.name || `ID: ${rel.sourceCharacterId}`),
      otherId: isOutgoing ? rel.targetCharacterId : rel.sourceCharacterId,
    };
  }), [characterRelationships, cid]);

  // ==================== Actions ====================

  const handleSave = async () => {
    if (!form.name.trim()) { showSnackbar('Введите имя', 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(), title: form.title.trim(), bio: form.bio.trim(),
        appearance: form.appearance.trim(),
        backstory: form.backstory.trim(), notes: form.notes.trim(),
        stateId: form.stateId ? parseInt(form.stateId, 10) : null,
        factionIds: form.factionIds,
      };
      const finalTags = mergeTagValues(form.tagsStr, tagsInput);
      if (isNew) {
        const created = await createCharacter({ ...payload, projectId: pid });
        if (finalTags.trim()) await saveTagsForCharacter(created.id, finalTags);
        setTagsInput('');
        showSnackbar('Персонаж создан!', 'success');
        navigate(routes.characterDetail(pid, created.id), { replace: true });
      } else {
        await updateCharacter(cid, payload);
        await saveTagsForCharacter(cid, finalTags);
        setTagsInput('');
        showSnackbar('Персонаж обновлён!', 'success');
      }
    } catch (err: any) { showSnackbar(err.message || 'Ошибка', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = () => {
    if (isNew) return;
    showConfirmDialog('Удалить персонажа', `Удалить "${form.name}"? Все связи тоже будут удалены.`, async () => {
      try { await deleteCharacter(cid); showSnackbar('Удалён', 'success'); navigate(routes.characters(pid)); }
      catch { showSnackbar('Ошибка', 'error'); }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || isNew) return;
    try { await uploadImage(cid, file); showSnackbar('Фото загружено!', 'success'); } catch { showSnackbar('Ошибка', 'error'); }
  };

  const handleAddRelationship = async () => {
    if (!relForm.targetId || isNew) return;
    try {
      await createRelationship({
        sourceCharacterId: cid, targetCharacterId: parseInt(relForm.targetId),
        relationshipType: relForm.type, description: relForm.description,
        projectId: pid, isBidirectional: true,
      });
      await fetchRelationships(pid);
      setRelDialogOpen(false);
      setRelForm({ targetId: '', type: 'ally', description: '' });
      showSnackbar('Связь добавлена!', 'success');
    } catch (err: any) { showSnackbar(err.message || 'Ошибка', 'error'); }
  };

  const handleDeleteRelationship = (relId: number) => {
    showConfirmDialog('Удалить связь', 'Удалить?', async () => {
      try { await deleteRelationship(relId); showSnackbar('Удалена', 'success'); } catch { showSnackbar('Ошибка', 'error'); }
    });
  };

  if (loading && !isNew && !currentCharacter) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><Typography sx={{ color: 'text.secondary' }}>Загрузка...</Typography></Box>;
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton onClick={() => navigate(routes.characters(pid))} sx={{ mr: 1 }}><ArrowBackIcon /></IconButton>
        <Typography variant="body2" color="text.secondary">К списку персонажей</Typography>
      </Box>

      <EntityHeroLayout
        avatarNode={
          currentCharacter?.imagePath ? (
            <Avatar src={uploadAssetUrl(currentCharacter.imagePath)} sx={{ width: 140, height: 140, borderRadius: 3 }} variant="rounded" />
          ) : (
            <Avatar sx={{ width: 140, height: 140, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }} variant="rounded">
              <PersonIcon sx={{ fontSize: 64 }} />
            </Avatar>
          )
        }
        title={isNew ? 'Новый персонаж' : form.name || 'Персонаж'}
        subtitle={form.title ? `— ${form.title}` : undefined}
        actionButtons={
          <>
            {!isNew && <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleDelete} size="small">Удалить</Button>}
            <DndButton variant="contained" startIcon={<SaveIcon />} onClick={handleSave} loading={saving} disabled={!form.name.trim()}>
              {isNew ? 'Создать' : 'Сохранить'}
            </DndButton>
          </>
        }
      />

      <EntityTabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        tabs={[
          { value: 'overview', label: 'Обзор', icon: <EditIcon fontSize="small" /> },
          { value: 'traits', label: 'Характер', icon: <PsychologyIcon fontSize="small" /> },
          { value: 'relations', label: 'Связи', icon: <GroupsIcon fontSize="small" /> },
        ]}
      />

      {activeTab === 'overview' && (
        <Box display="flex" gap={3} sx={{ flexDirection: { xs: 'column', md: 'row' } }}>
          {/* LEFT SIDEBAR */}
          <Box sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0 }}>
            <GlassCard sx={{ p: 3, position: 'sticky', top: 80 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Сводка</Typography>
              
              {!isNew && (
                <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} fullWidth size="small"
                  sx={{ borderColor: alpha(theme.palette.divider, 0.5), mb: 3, fontSize: '0.75rem' }}>
                  Загрузить фото
                  <input type="file" hidden accept="image/jpeg,image/png,image/svg+xml,image/webp" onChange={handleImageUpload} />
                </Button>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {form.title && <InfoRow label="Титул" value={form.title} />}
                {form.bio && (
                  <Box sx={{ mb: 0.5, pb: 1, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2, mb: 0.5 }}>Описание</Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.85rem' }}>
                      {form.bio.length > 120 ? form.bio.slice(0, 120) + '…' : form.bio}
                    </Typography>
                  </Box>
                )}
                {previewTagsStr.trim() && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>Теги</Typography>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {previewTagsStr.split(',').map((t, i) => { const s = t.trim(); return s ? <Chip key={i} label={s} size="small" sx={{ height: 24, fontSize: '0.75rem' }} /> : null; })}
                    </Box>
                  </Box>
                )}
              </Box>
            </GlassCard>
          </Box>

          {/* MAIN CONTENT */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            {/* Basic Info */}
            <Section title="Основное" icon={<EditIcon />} defaultOpen={true}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Имя *" value={form.name} onChange={e => handleChange('name', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Титул / Прозвище" value={form.title} onChange={e => handleChange('title', e.target.value)} placeholder="напр. Король Севера" />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Краткое описание" value={form.bio} onChange={e => handleChange('bio', e.target.value)} multiline rows={3} placeholder="Кто этот персонаж..." />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Государство</InputLabel>
                    <Select
                      value={form.stateId}
                      label="Государство"
                      onChange={e => setForm(prev => ({ ...prev, stateId: e.target.value }))}
                    >
                      <MenuItem value="">Не указано</MenuItem>
                      {stateOptions.map((item) => (
                        <MenuItem key={item.id} value={String(item.id)}>{item.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    options={factionOptions}
                    getOptionLabel={(option) => option.name}
                    value={factionOptions.filter((option) => form.factionIds.includes(option.id))}
                    onChange={(_, value) => setForm(prev => ({ ...prev, factionIds: value.map((item) => item.id) }))}
                    renderInput={(params) => <TextField {...params} label="Фракции" placeholder="Выберите фракции" />}
                    disableCloseOnSelect
                  />
                </Grid>
                <Grid item xs={12}>
                  <TagAutocompleteField options={allTagNames} value={form.tagsStr} pendingInput={tagsInput} onValueChange={v => handleChange('tagsStr', v)} onPendingInputChange={setTagsInput} />
                </Grid>
              </Grid>
            </Section>

            {/* Appearance */}
            <Section title="Внешность" icon={<FaceIcon />} defaultOpen={!isNew && !!form.appearance}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Внешность" value={form.appearance} onChange={e => handleChange('appearance', e.target.value)} multiline rows={5} placeholder="Опишите внешний вид персонажа..." />
                </Grid>
              </Grid>
            </Section>

            {/* Backstory & Notes */}
            <Section title="История и заметки" icon={<AutoStoriesIcon />} defaultOpen={!isNew && (!!form.backstory || !!form.notes)}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Предыстория" value={form.backstory} onChange={e => handleChange('backstory', e.target.value)} multiline rows={7} placeholder="Откуда пришёл этот персонаж..." />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Заметки" value={form.notes} onChange={e => handleChange('notes', e.target.value)} multiline rows={4} placeholder="Секреты, планы, идеи..." />
                </Grid>
              </Grid>
            </Section>
          </Box>
        </Box>
      )}

      {activeTab === 'traits' && (
        <CharacterTraitsTab projectId={pid} characterId={isNew ? null : cid} />
      )}

      {activeTab === 'relations' && (
        <Box>
          {/* Relationships */}
          {!isNew && (
            <Section title="Связи" icon={<GroupsIcon />} badge={allRelsForDisplay.length} defaultOpen={true}
              action={<DndButton variant="outlined" startIcon={<AddIcon />} size="small" onClick={() => setRelDialogOpen(true)} sx={{ borderColor: alpha(theme.palette.primary.main, 0.5) }}>Добавить</DndButton>}>
              {allRelsForDisplay.length === 0 ? (
                <EmptyState icon={<GroupsIcon />} title="Нет связей" description="Добавьте связи с другими персонажами" actionLabel="Добавить связь" onAction={() => setRelDialogOpen(true)} />
              ) : (
                <List disablePadding>
                  {allRelsForDisplay.map((rel: any) => {
                    const relColor = getRelationshipColor(rel.relationshipType, theme);
                    return (
                      <ListItem key={rel.id}
                        secondaryAction={
                          <IconButton size="small" onClick={e => { e.stopPropagation(); handleDeleteRelationship(rel.id); }}>
                            <DeleteIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                          </IconButton>
                        }
                        onClick={() => navigate(routes.characterDetail(pid, rel.otherId))}
                        sx={{
                          backgroundColor: alpha(relColor, 0.08),
                          borderRadius: 1.5, mb: 1, cursor: 'pointer',
                          border: `1px solid ${alpha(relColor, 0.3)}`,
                          '&:hover': { backgroundColor: alpha(relColor, 0.15) },
                        }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: alpha(relColor, 0.2), color: relColor, width: 40, height: 40 }}><PersonIcon fontSize="small" /></Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{rel.isOutgoing ? '→' : '←'}</Typography>
                              <Chip label={getRelationshipLabel(rel.relationshipType)} size="small"
                                sx={{ backgroundColor: alpha(relColor, 0.2), color: relColor, fontSize: '0.7rem', fontWeight: 600 }} />
                              <Typography sx={{ color: 'text.primary', fontWeight: 600 }}>{rel.otherName}</Typography>
                            </Box>
                          }
                          secondary={rel.description ? <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>{rel.description}</Typography> : null}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </Section>
          )}
        </Box>
      )}

      {/* Relationship Dialog */}
      <Dialog open={relDialogOpen} onClose={() => setRelDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: theme.palette.background.paper, backgroundImage: 'none' } }}>
        <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>Добавить связь</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>С кем</InputLabel>
            <Select value={relForm.targetId} label="С кем" onChange={e => setRelForm(prev => ({ ...prev, targetId: e.target.value }))}>
              {allCharacters.map((ch: any) => (
                <MenuItem key={ch.id} value={String(ch.id)}>{ch.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Тип связи</InputLabel>
            <Select<RelationshipType> value={relForm.type} label="Тип связи" onChange={handleRelationshipTypeChange}>
              {RELATIONSHIP_TYPES.map(t => (
                <MenuItem key={t} value={t}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: getRelationshipColor(t, theme) }} />
                    {RELATIONSHIP_LABELS[t]}
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
          <DndButton variant="contained" onClick={handleAddRelationship} disabled={!relForm.targetId}>Добавить</DndButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
