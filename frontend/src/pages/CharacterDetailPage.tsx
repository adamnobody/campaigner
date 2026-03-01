// frontend/src/pages/CharacterDetailPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, TextField, Button,
  Avatar, IconButton, Divider, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel,
  List, ListItem, ListItemText,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
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

interface CharacterForm {
  name: string;
  bio: string;
  tagsStr: string;
}

export const CharacterDetailPage: React.FC = () => {
  const { projectId, characterId } = useParams<{ projectId: string; characterId: string }>();
  const pid = parseInt(projectId!);
  const isNew = !characterId || characterId === 'new';
  const navigate = useNavigate();
  const { showSnackbar, showConfirmDialog } = useUIStore();

  const [form, setForm] = useState<CharacterForm>({ name: '', bio: '', tagsStr: '' });
  const [character, setCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Relationships
  const [relationships, setRelationships] = useState<any[]>([]);
  const [allCharacters, setAllCharacters] = useState<any[]>([]);
  const [relDialogOpen, setRelDialogOpen] = useState(false);
  const [relForm, setRelForm] = useState({ targetId: '', type: 'ally', description: '' });

  // Load character
  useEffect(() => {
    if (isNew) {
      setForm({ name: '', bio: '', tagsStr: '' });
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
        bio: c.bio || '',
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

  // Save tags helper
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
      if (isNew) {
        const res = await charactersApi.create({
          name: form.name.trim(),
          bio: form.bio.trim(),
          projectId: pid,
          title: '',
          race: '',
          characterClass: '',
          status: 'alive',
          appearance: '',
          personality: '',
          backstory: '',
          notes: '',
        });
        const created = res.data.data;
        if (form.tagsStr.trim()) {
          await saveTags(created.id, form.tagsStr);
        }
        showSnackbar('Персонаж создан!', 'success');
        navigate(`/project/${pid}/characters/${created.id}`, { replace: true });
      } else {
        await charactersApi.update(parseInt(characterId!), {
          name: form.name.trim(),
          bio: form.bio.trim(),
        });
        await saveTags(parseInt(characterId!), form.tagsStr);
        showSnackbar('Персонаж обновлён!', 'success');
      }
    } catch (err: any) {
      showSnackbar(err.message || 'Ошибка', 'error');
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
      showSnackbar('Фото загружено!', 'success');
    } catch {
      showSnackbar('Ошибка загрузки', 'error');
    }
  };

  // Add relationship
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

  // Delete relationship
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
  const outgoing = relationships.filter(r => r.sourceCharacterId === cid);
  const incoming = relationships.filter(r => r.targetCharacterId === cid);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={() => { navigate(`/project/${pid}/characters`); }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '1.8rem', color: '#fff' }}>
          {isNew ? 'Новый персонаж' : form.name || 'Персонаж'}
        </Typography>
      </Box>

      {/* Form */}
      <Paper sx={{ p: 3, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', mb: 3 }}>
        {/* Avatar + basic fields */}
        <Box display="flex" gap={3} mb={3}>
          <Box>
            {character?.imagePath ? (
              <Avatar
                src={character.imagePath}
                sx={{ width: 100, height: 100, borderRadius: 2 }}
                variant="rounded"
              />
            ) : (
              <Avatar
                sx={{
                  width: 100, height: 100, borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.3)',
                }}
                variant="rounded"
              >
                <PersonIcon sx={{ fontSize: 48 }} />
              </Avatar>
            )}
          </Box>
          <Box flexGrow={1}>
            <TextField
              fullWidth
              label="Имя"
              value={form.name}
              onChange={e => { handleChange('name', e.target.value); }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Описание"
              value={form.bio}
              onChange={e => { handleChange('bio', e.target.value); }}
              multiline
              rows={2}
              placeholder="Краткое описание персонажа"
            />
          </Box>
        </Box>

        {/* Tags */}
        <TextField
          fullWidth
          label="Теги (через запятую)"
          value={form.tagsStr}
          onChange={e => { handleChange('tagsStr', e.target.value); }}
          placeholder="напр. злодей, маг, NPC"
          sx={{ mb: 2 }}
        />

        {/* Preview tags */}
        {form.tagsStr.trim() && (
          <Box display="flex" gap={0.5} flexWrap="wrap" mb={2}>
            {form.tagsStr.split(',').map((tag, i) => {
              const trimmed = tag.trim();
              if (!trimmed) return null;
              return (
                <Chip
                  key={i}
                  label={trimmed}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(130,130,255,0.2)',
                    color: '#fff',
                    fontSize: '0.75rem',
                  }}
                />
              );
            })}
          </Box>
        )}

        {/* Upload photo */}
        {!isNew && (
          <Button
            component="label"
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            fullWidth
            sx={{
              borderColor: 'rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.6)',
              mb: 2,
            }}
          >
            Загрузить фото
            <input
              type="file"
              hidden
              accept="image/jpeg,image/png,image/svg+xml"
              onChange={handleImageUpload}
            />
          </Button>
        )}

        {/* Actions */}
        <Box display="flex" justifyContent="flex-end" gap={2}>
          <Button
            onClick={() => { navigate(`/project/${pid}/characters`); }}
            sx={{ color: 'rgba(255,255,255,0.5)' }}
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

      {/* Relationships — only for existing characters */}
      {!isNew && (
        <Paper sx={{ p: 3, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: '#fff' }}>
              Связи
            </Typography>
            <DndButton
              variant="outlined"
              startIcon={<AddIcon />}
              size="small"
              onClick={() => {
                if (allCharacters.length === 0) {
                  charactersApi.getAll(pid, { limit: 200 }).then(res => {
                    setAllCharacters(
                      (res.data.data.items || []).filter((ch: any) => ch.id !== cid)
                    );
                  });
                }
                setRelDialogOpen(true);
              }}
              sx={{ borderColor: 'rgba(130,130,255,0.4)', color: 'rgba(130,130,255,0.9)' }}
            >
              Добавить связь
            </DndButton>
          </Box>

          {/* Outgoing */}
          <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
            Исходящие
          </Typography>
          {outgoing.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.35)', mb: 2 }}>
              Нет исходящих связей.
            </Typography>
          ) : (
            <List dense sx={{ mb: 2 }}>
              {outgoing.map(rel => (
                <ListItem
                  key={rel.id}
                  secondaryAction={
                    <IconButton
                      size="small"
                      onClick={() => { handleDeleteRelationship(rel.id); }}
                    >
                      <DeleteIcon fontSize="small" sx={{ color: 'rgba(255,100,100,0.5)' }} />
                    </IconButton>
                  }
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderRadius: 1,
                    mb: 0.5,
                  }}
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={RELATIONSHIP_LABELS[rel.relationshipType] || rel.relationshipType}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(130,130,255,0.2)',
                            color: '#fff',
                            fontSize: '0.7rem',
                          }}
                        />
                        <Typography sx={{ color: '#fff' }}>
                          {'→ '}
                          {rel.targetCharacter?.name || ('ID: ' + rel.targetCharacterId)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      rel.description ? (
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)' }}>
                          {rel.description}
                        </Typography>
                      ) : null
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}

          {/* Incoming */}
          <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
            Входящие
          </Typography>
          {incoming.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.35)' }}>
              Нет входящих связей.
            </Typography>
          ) : (
            <List dense>
              {incoming.map(rel => (
                <ListItem
                  key={rel.id}
                  secondaryAction={
                    <IconButton
                      size="small"
                      onClick={() => { handleDeleteRelationship(rel.id); }}
                    >
                      <DeleteIcon fontSize="small" sx={{ color: 'rgba(255,100,100,0.5)' }} />
                    </IconButton>
                  }
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderRadius: 1,
                    mb: 0.5,
                  }}
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={RELATIONSHIP_LABELS[rel.relationshipType] || rel.relationshipType}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(255,160,130,0.2)',
                            color: '#fff',
                            fontSize: '0.7rem',
                          }}
                        />
                        <Typography sx={{ color: '#fff' }}>
                          {'← '}
                          {rel.sourceCharacter?.name || ('ID: ' + rel.sourceCharacterId)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      rel.description ? (
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)' }}>
                          {rel.description}
                        </Typography>
                      ) : null
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      )}

      {/* Add Relationship Dialog */}
      <Dialog
        open={relDialogOpen}
        onClose={() => { setRelDialogOpen(false); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a2e',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>
          Добавить связь
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>С кем</InputLabel>
            <Select
              value={relForm.targetId}
              label="С кем"
              onChange={e => { setRelForm(prev => ({ ...prev, targetId: e.target.value })); }}
            >
              {allCharacters.map(ch => (
                <MenuItem key={ch.id} value={String(ch.id)}>{ch.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Тип</InputLabel>
            <Select
              value={relForm.type}
              label="Тип"
              onChange={e => { setRelForm(prev => ({ ...prev, type: e.target.value })); }}
            >
              {RELATIONSHIP_TYPES.map(t => (
                <MenuItem key={t} value={t}>
                  {RELATIONSHIP_LABELS[t] || t}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Заметка"
            value={relForm.description}
            onChange={e => { setRelForm(prev => ({ ...prev, description: e.target.value })); }}
            margin="normal"
            placeholder="Описание отношений..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => { setRelDialogOpen(false); }}
            color="inherit"
          >
            Отмена
          </Button>
          <DndButton
            variant="contained"
            onClick={handleAddRelationship}
            disabled={!relForm.targetId}
          >
            Добавить
          </DndButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};