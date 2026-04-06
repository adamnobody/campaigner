import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Paper, TextField, Button,
  Avatar, IconButton, Chip,
  Select, MenuItem, FormControl, InputLabel,
  List, ListItem, ListItemText, ListItemAvatar,
  Grid, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';
import LinkIcon from '@mui/icons-material/Link';
import PersonIcon from '@mui/icons-material/Person';
import { useParams, useNavigate } from 'react-router-dom';
import { useUIStore } from '@/store/useUIStore';
import { useFactionStore } from '@/store/useFactionStore';
import { useCharacterStore } from '@/store/useCharacterStore';
import { useTagStore } from '@/store/useTagStore';
import { DndButton } from '@/components/ui/DndButton';
import { TagAutocompleteField } from '@/components/forms/TagAutocompleteField';
import { CollapsibleSection as Section } from '@/components/detail/CollapsibleSection';
import { FactionRankDialog, FactionMemberDialog, FactionRelationDialog } from '@/pages/faction/FactionDialogs';
import {
  FACTION_TYPES, FACTION_TYPE_LABELS, FACTION_TYPE_ICONS,
  FACTION_STATUSES, FACTION_STATUS_LABELS, FACTION_STATUS_ICONS,
  STATE_TYPES, STATE_TYPE_LABELS,
  FACTION_RELATION_LABELS, FACTION_RELATION_COLORS,
} from '@campaigner/shared';
import type { FactionRank, FactionMember, FactionAsset } from '@campaigner/shared';
import { shallow } from 'zustand/shallow';

// ==================== Types ====================

interface FactionForm {
  name: string;
  type: string;
  customType: string;
  stateType: string;
  customStateType: string;
  motto: string;
  description: string;
  history: string;
  goals: string;
  headquarters: string;
  territory: string;
  status: string;
  color: string;
  secondaryColor: string;
  foundedDate: string;
  disbandedDate: string;
  parentFactionId: string;
  tagsStr: string;
}

const EMPTY_FORM: FactionForm = {
  name: '', type: 'other', customType: '', stateType: '', customStateType: '',
  motto: '', description: '', history: '', goals: '',
  headquarters: '', territory: '', status: 'active',
  color: '#4e8a6e', secondaryColor: '#2a2a4a', foundedDate: '', disbandedDate: '',
  parentFactionId: '', tagsStr: '',
};

// ==================== Helpers ====================

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box sx={{ mb: 1, pb: 1, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', display: 'block', lineHeight: 1 }}>{label}</Typography>
    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>{value}</Typography>
  </Box>
);

// ==================== Component ====================

export const FactionDetailPage: React.FC = () => {
  const { projectId, factionId } = useParams<{ projectId: string; factionId: string }>();
  const pid = parseInt(projectId!);
  const isNew = !factionId || factionId === 'new';
  const navigate = useNavigate();
  const { showSnackbar, showConfirmDialog } = useUIStore((state) => ({
    showSnackbar: state.showSnackbar,
    showConfirmDialog: state.showConfirmDialog,
  }), shallow);

  const {
    factions, currentFaction, relations, loading,
    fetchFactions, fetchFaction, createFaction, updateFaction, deleteFaction,
    uploadImage, uploadBanner, setTags,
    createRank, updateRank, deleteRank,
    addMember, removeMember,
    createAsset, updateAsset, deleteAsset, bootstrapDefaultAssets,
    fetchRelations, createRelation, deleteRelation,
    setCurrentFaction,
  } = useFactionStore((state) => ({
    factions: state.factions,
    currentFaction: state.currentFaction,
    relations: state.relations,
    loading: state.loading,
    fetchFactions: state.fetchFactions,
    fetchFaction: state.fetchFaction,
    createFaction: state.createFaction,
    updateFaction: state.updateFaction,
    deleteFaction: state.deleteFaction,
    uploadImage: state.uploadImage,
    uploadBanner: state.uploadBanner,
    setTags: state.setTags,
    createRank: state.createRank,
    updateRank: state.updateRank,
    deleteRank: state.deleteRank,
    addMember: state.addMember,
    removeMember: state.removeMember,
    createAsset: state.createAsset,
    updateAsset: state.updateAsset,
    deleteAsset: state.deleteAsset,
    bootstrapDefaultAssets: state.bootstrapDefaultAssets,
    fetchRelations: state.fetchRelations,
    createRelation: state.createRelation,
    deleteRelation: state.deleteRelation,
    setCurrentFaction: state.setCurrentFaction,
  }), shallow);

  const { characters, fetchCharacters } = useCharacterStore((state) => ({
    characters: state.characters,
    fetchCharacters: state.fetchCharacters,
  }), shallow);
  const { tags, fetchTags, findOrCreateTagsByNames } = useTagStore((state) => ({
    tags: state.tags,
    fetchTags: state.fetchTags,
    findOrCreateTagsByNames: state.findOrCreateTagsByNames,
  }), shallow);

  const [form, setForm] = useState<FactionForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [tagsInput, setTagsInput] = useState('');

  const [rankDialogOpen, setRankDialogOpen] = useState(false);
  const [editingRank, setEditingRank] = useState<FactionRank | null>(null);
  const [rankForm, setRankForm] = useState({ name: '', level: 0, description: '', icon: '', color: '' });

  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [memberForm, setMemberForm] = useState({ characterId: '', rankId: '', role: '', joinedDate: '', notes: '' });

  const [relationDialogOpen, setRelationDialogOpen] = useState(false);
  const [relationForm, setRelationForm] = useState({ targetFactionId: '', relationType: 'neutral', customLabel: '', description: '' });

  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FactionAsset | null>(null);
  const [assetForm, setAssetForm] = useState({ name: '', value: '' });

  // ==================== Load ====================

  useEffect(() => {
    fetchTags(pid).catch(() => {});
    fetchCharacters(pid, { limit: 500 }).catch(() => {});
    fetchFactions(pid, { limit: 500 }).catch(() => {});
    fetchRelations(pid).catch(() => {});
  }, [pid]);

  useEffect(() => {
    if (isNew) { setForm(EMPTY_FORM); setCurrentFaction(null); setTagsInput(''); return; }
    fetchFaction(parseInt(factionId!)).catch(() => showSnackbar('Ошибка загрузки', 'error'));
  }, [factionId, isNew]);

  useEffect(() => {
    if (isNew || !currentFaction || currentFaction.id !== parseInt(factionId!)) return;
    setForm({
      name: currentFaction.name || '', type: currentFaction.type || 'other',
      customType: currentFaction.customType || '', stateType: currentFaction.stateType || '',
      customStateType: currentFaction.customStateType || '', motto: currentFaction.motto || '',
      description: currentFaction.description || '', history: currentFaction.history || '',
      goals: currentFaction.goals || '', headquarters: currentFaction.headquarters || '',
      territory: currentFaction.territory || '', status: currentFaction.status || 'active',
      color: currentFaction.color || '#4e8a6e', secondaryColor: currentFaction.secondaryColor || '#2a2a4a',
      foundedDate: currentFaction.foundedDate || '', disbandedDate: currentFaction.disbandedDate || '',
      parentFactionId: currentFaction.parentFactionId ? String(currentFaction.parentFactionId) : '',
      tagsStr: (currentFaction.tags || []).map((t: any) => t.name).join(', '),
    });
    setTagsInput('');
  }, [currentFaction, factionId, isNew]);

  // ==================== Helpers ====================

  const handleChange = (field: keyof FactionForm, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const mergeTagValues = (a: string, b: string): string => {
    const all = [...a.split(','), ...b.split(',')].map(s => s.trim()).filter(Boolean);
    return Array.from(new Set(all)).join(', ');
  };

  const saveTagsForFaction = async (id: number, str: string) => {
    const names = str.split(',').map(s => s.trim()).filter(Boolean);
    if (!names.length) { await setTags(id, []); return; }
    const ids = await findOrCreateTagsByNames(pid, names);
    await setTags(id, ids);
  };

  const allTagNames = useMemo(() => tags.map(t => t.name), [tags]);
  const fid = factionId && !isNew ? parseInt(factionId) : 0;
  const otherFactions = useMemo(() => factions.filter(f => f.id !== fid), [factions, fid]);
  const allCharacters = useMemo(() => characters || [], [characters]);
  const currentRanks: FactionRank[] = currentFaction?.ranks || [];
  const currentMembers: FactionMember[] = currentFaction?.members || [];
  const currentAssets: FactionAsset[] = currentFaction?.assets || [];
  const factionRelations = useMemo(() => fid ? relations.filter(r => r.sourceFactionId === fid || r.targetFactionId === fid) : [], [relations, fid]);
  const previewTagsStr = mergeTagValues(form.tagsStr, tagsInput);

  const relationsForDisplay = useMemo(() => factionRelations.map(rel => {
    const isOut = rel.sourceFactionId === fid;
    return {
      ...rel, isOutgoing: isOut,
      otherName: isOut ? (rel.targetFactionName || `ID: ${rel.targetFactionId}`) : (rel.sourceFactionName || `ID: ${rel.sourceFactionId}`),
      otherId: isOut ? rel.targetFactionId : rel.sourceFactionId,
    };
  }), [factionRelations, fid]);

  // ==================== Actions ====================

  const handleSave = async () => {
    if (!form.name.trim()) { showSnackbar('Введите название', 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(), type: form.type,
        customType: form.type === 'other' ? form.customType.trim() : '',
        stateType: form.type === 'state' ? form.stateType : '',
        customStateType: form.type === 'state' && form.stateType === 'other' ? form.customStateType.trim() : '',
        motto: form.motto.trim(), description: form.description.trim(),
        history: form.history.trim(), goals: form.goals.trim(),
        headquarters: form.headquarters.trim(), territory: form.territory.trim(),
        status: form.status, color: form.color.trim(), secondaryColor: form.secondaryColor.trim(),
        foundedDate: form.foundedDate.trim(), disbandedDate: form.disbandedDate.trim(),
        parentFactionId: form.parentFactionId ? parseInt(form.parentFactionId) : null,
      };
      const finalTags = mergeTagValues(form.tagsStr, tagsInput);
      if (isNew) {
        const created = await createFaction({ ...payload, projectId: pid });
        if (finalTags.trim()) await saveTagsForFaction(created.id, finalTags);
        setTagsInput('');
        showSnackbar('Фракция создана!', 'success');
        navigate(`/project/${pid}/factions/${created.id}`, { replace: true });
      } else {
        await updateFaction(fid, payload);
        await saveTagsForFaction(fid, finalTags);
        setTagsInput('');
        showSnackbar('Сохранено!', 'success');
      }
    } catch (err: any) { showSnackbar(err.message || 'Ошибка', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = () => {
    if (isNew) return;
    showConfirmDialog('Удалить фракцию', `Удалить "${form.name}"?`, async () => {
      try { await deleteFaction(fid); showSnackbar('Удалена', 'success'); navigate(`/project/${pid}/factions`); }
      catch { showSnackbar('Ошибка', 'error'); }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || isNew) return;
    try { await uploadImage(fid, file); showSnackbar('Герб загружен!', 'success'); } catch { showSnackbar('Ошибка', 'error'); }
  };
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || isNew) return;
    try { await uploadBanner(fid, file); showSnackbar('Фон загружен!', 'success'); } catch { showSnackbar('Ошибка', 'error'); }
  };

  // Ranks
  const openRankDialog = (rank?: FactionRank) => {
    if (rank) { setEditingRank(rank); setRankForm({ name: rank.name, level: rank.level, description: rank.description || '', icon: rank.icon || '', color: rank.color || '' }); }
    else { setEditingRank(null); setRankForm({ name: '', level: currentRanks.length ? Math.max(...currentRanks.map(r => r.level)) + 1 : 1, description: '', icon: '', color: '' }); }
    setRankDialogOpen(true);
  };
  const handleSaveRank = async () => {
    if (!rankForm.name.trim()) return;
    try {
      if (editingRank) { await updateRank(fid, editingRank.id, rankForm); showSnackbar('Ранг обновлён', 'success'); }
      else { await createRank(fid, rankForm); showSnackbar('Ранг создан', 'success'); }
      setRankDialogOpen(false);
    } catch (err: any) { showSnackbar(err.message || 'Ошибка', 'error'); }
  };
  const handleDeleteRank = (id: number, name: string) => {
    showConfirmDialog('Удалить ранг', `Удалить "${name}"?`, async () => {
      try { await deleteRank(fid, id); showSnackbar('Удалён', 'success'); } catch { showSnackbar('Ошибка', 'error'); }
    });
  };

  // Members
  const openMemberDialog = () => { setMemberForm({ characterId: '', rankId: '', role: '', joinedDate: '', notes: '' }); setMemberDialogOpen(true); };
  const handleAddMember = async () => {
    if (!memberForm.characterId) return;
    try {
      await addMember(fid, {
        characterId: parseInt(memberForm.characterId),
        rankId: memberForm.rankId ? parseInt(memberForm.rankId) : undefined,
        role: memberForm.role,
        joinedDate: memberForm.joinedDate,
        notes: memberForm.notes,
      });
      setMemberDialogOpen(false); showSnackbar('Добавлен', 'success');
    } catch (err: any) { showSnackbar(err.message || 'Ошибка', 'error'); }
  };
  const handleRemoveMember = (id: number, name: string) => {
    showConfirmDialog('Удалить', `Удалить "${name}" из фракции?`, async () => {
      try { await removeMember(fid, id); showSnackbar('Удалён', 'success'); } catch { showSnackbar('Ошибка', 'error'); }
    });
  };

  // Relations
  const openRelationDialog = () => { setRelationForm({ targetFactionId: '', relationType: 'neutral', customLabel: '', description: '' }); setRelationDialogOpen(true); };
  const handleAddRelation = async () => {
    if (!relationForm.targetFactionId) return;
    try {
      await createRelation({ projectId: pid, sourceFactionId: fid, targetFactionId: parseInt(relationForm.targetFactionId), relationType: relationForm.relationType, customLabel: relationForm.customLabel, description: relationForm.description, isBidirectional: true });
      await fetchRelations(pid); setRelationDialogOpen(false); showSnackbar('Связь добавлена', 'success');
    } catch (err: any) { showSnackbar(err.message || 'Ошибка', 'error'); }
  };
  const handleDeleteRelation = (id: number) => {
    showConfirmDialog('Удалить связь', 'Удалить?', async () => {
      try { await deleteRelation(id); showSnackbar('Удалена', 'success'); } catch { showSnackbar('Ошибка', 'error'); }
    });
  };

  // Assets
  const openAssetDialog = (asset?: FactionAsset) => {
    if (asset) {
      setEditingAsset(asset);
      setAssetForm({ name: asset.name, value: asset.value || '' });
    } else {
      setEditingAsset(null);
      setAssetForm({ name: '', value: '' });
    }
    setAssetDialogOpen(true);
  };

  const handleSaveAsset = async () => {
    if (!assetForm.name.trim()) return;
    try {
      if (editingAsset) {
        await updateAsset(fid, editingAsset.id, { name: assetForm.name.trim(), value: assetForm.value });
        showSnackbar('Актив обновлён', 'success');
      } else {
        await createAsset(fid, { name: assetForm.name.trim(), value: assetForm.value, sortOrder: currentAssets.length });
        showSnackbar('Актив добавлен', 'success');
      }
      setAssetDialogOpen(false);
    } catch (err: any) {
      showSnackbar(err.message || 'Ошибка', 'error');
    }
  };

  const handleDeleteAsset = (asset: FactionAsset) => {
    showConfirmDialog('Удалить актив', `Удалить "${asset.name}"?`, async () => {
      try {
        await deleteAsset(fid, asset.id);
        showSnackbar('Актив удалён', 'success');
      } catch {
        showSnackbar('Ошибка', 'error');
      }
    });
  };

  const handleBootstrapDefaultAssets = async () => {
    try {
      const result = await bootstrapDefaultAssets(fid);
      if (result.created.length > 0) {
        showSnackbar(`Добавлено базовых активов: ${result.created.length}`, 'success');
      } else {
        showSnackbar('Базовые активы уже добавлены', 'success');
      }
    } catch (err: any) {
      showSnackbar(err.message || 'Ошибка', 'error');
    }
  };

  if (loading && !isNew && !currentFaction) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>Загрузка...</Typography></Box>;
  }
  return (
    <Box>
      {/* Banner */}
      {currentFaction?.bannerPath && (
        <Box sx={{
          position: 'relative', height: 220, mx: -3, mt: -3, mb: 3,
          borderRadius: 2, overflow: 'hidden',
          '&::after': {
            content: '""', position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
            background: 'linear-gradient(transparent, rgba(15,15,25,0.95))',
          },
        }}>
          <Box component="img" src={currentFaction.bannerPath} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </Box>
      )}

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate(`/project/${pid}/factions`)}><ArrowBackIcon /></IconButton>
          <Box>
            <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '1.8rem', color: '#fff', lineHeight: 1.2 }}>
              {isNew ? 'Новая фракция' : form.name || 'Фракция'}
            </Typography>
            {form.motto && (
              <Typography sx={{ color: 'rgba(201,169,89,0.8)', fontStyle: 'italic', fontSize: '0.9rem', mt: 0.25 }}>«{form.motto}»</Typography>
            )}
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          {!isNew && <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleDelete} size="small">Удалить</Button>}
          <DndButton variant="contained" startIcon={<SaveIcon />} onClick={handleSave} loading={saving} disabled={!form.name.trim()}>
            {isNew ? 'Создать' : 'Сохранить'}
          </DndButton>
        </Box>
      </Box>

      {/* Two-column */}
      <Box display="flex" gap={3} sx={{ flexDirection: { xs: 'column', md: 'row' } }}>

        {/* LEFT SIDEBAR */}
        <Box sx={{ width: { xs: '100%', md: 280 }, flexShrink: 0 }}>
          <Paper sx={{ p: 3, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', position: 'sticky', top: 80 }}>
            <Box sx={{ mb: 2 }}>
              {currentFaction?.imagePath ? (
                <Avatar src={currentFaction.imagePath} sx={{ width: 140, height: 140, borderRadius: 3, mx: 'auto' }} variant="rounded" />
              ) : (
                <Avatar sx={{ width: 140, height: 140, borderRadius: 3, mx: 'auto', bgcolor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.2)', fontSize: '3rem' }} variant="rounded">
                  {FACTION_TYPE_ICONS[form.type] || '🏴'}
                </Avatar>
              )}
            </Box>

            {!isNew && (
              <Box display="flex" gap={1} mb={2}>
                <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} fullWidth size="small"
                  sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
                  Герб<input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                </Button>
                <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} fullWidth size="small"
                  sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
                  Фон<input type="file" hidden accept="image/*" onChange={handleBannerUpload} />
                </Button>
              </Box>
            )}

            <Box sx={{ textAlign: 'left' }}>
              {form.type && <InfoRow label="Тип" value={`${FACTION_TYPE_ICONS[form.type] || ''} ${FACTION_TYPE_LABELS[form.type] || form.customType || form.type}`} />}
              {form.type === 'state' && form.stateType && <InfoRow label="Строй" value={STATE_TYPE_LABELS[form.stateType] || form.customStateType || form.stateType} />}
              {form.status && <InfoRow label="Статус" value={`${FACTION_STATUS_ICONS[form.status] || ''} ${FACTION_STATUS_LABELS[form.status] || form.status}`} />}
              {form.headquarters && <InfoRow label="Столица" value={form.headquarters} />}
              {form.territory && <InfoRow label="Территория" value={form.territory} />}
              {form.foundedDate && <InfoRow label="Основана" value={form.foundedDate} />}
              {form.disbandedDate && <InfoRow label="Распущена" value={form.disbandedDate} />}
              {previewTagsStr.trim() && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', display: 'block', mb: 0.5 }}>Теги</Typography>
                  <Box display="flex" gap={0.5} flexWrap="wrap">
                    {previewTagsStr.split(',').map((t, i) => { const s = t.trim(); return s ? <Chip key={i} label={s} size="small" sx={{ height: 22, fontSize: '0.7rem', backgroundColor: 'rgba(130,130,255,0.2)', color: '#fff' }} /> : null; })}
                  </Box>
                </Box>
              )}
            </Box>

            {!isNew && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'center', gap: 3 }}>
                <Tooltip title="Члены"><Box display="flex" alignItems="center" gap={0.5}><PeopleIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} /><Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>{currentMembers.length}</Typography></Box></Tooltip>
                <Tooltip title="Ранги"><Box display="flex" alignItems="center" gap={0.5}><StarIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} /><Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>{currentRanks.length}</Typography></Box></Tooltip>
                <Tooltip title="Связи"><Box display="flex" alignItems="center" gap={0.5}><LinkIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} /><Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>{factionRelations.length}</Typography></Box></Tooltip>
              </Box>
            )}
          </Paper>
        </Box>

        {/* ===== MAIN CONTENT ===== */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>

          {/* SECTION: Basic Info */}
          <Section title="Основное" icon={<EditIcon />} defaultOpen={true}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Название *" value={form.name} onChange={e => handleChange('name', e.target.value)} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Девиз" value={form.motto} onChange={e => handleChange('motto', e.target.value)} placeholder="напр. Зима близко" /></Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth><InputLabel>Тип</InputLabel>
                  <Select value={form.type} label="Тип" onChange={e => handleChange('type', e.target.value)}>
                    {FACTION_TYPES.map(t => <MenuItem key={t} value={t}>{FACTION_TYPE_ICONS[t]} {FACTION_TYPE_LABELS[t]}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              {form.type === 'other' && (
                <Grid item xs={12} sm={6}><TextField fullWidth label="Укажите тип" value={form.customType} onChange={e => handleChange('customType', e.target.value)} /></Grid>
              )}
              {form.type === 'state' && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth><InputLabel>Государственный строй</InputLabel>
                    <Select value={form.stateType} label="Государственный строй" onChange={e => handleChange('stateType', e.target.value)}>
                      {STATE_TYPES.map(st => <MenuItem key={st} value={st}>{STATE_TYPE_LABELS[st]}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              {form.type === 'state' && form.stateType === 'other' && (
                <Grid item xs={12} sm={6}><TextField fullWidth label="Тип государства" value={form.customStateType} onChange={e => handleChange('customStateType', e.target.value)} /></Grid>
              )}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth><InputLabel>Статус</InputLabel>
                  <Select value={form.status} label="Статус" onChange={e => handleChange('status', e.target.value)}>
                    {FACTION_STATUSES.map(s => <MenuItem key={s} value={s}>{FACTION_STATUS_ICONS[s]} {FACTION_STATUS_LABELS[s]}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Штаб-квартира / Столица" value={form.headquarters} onChange={e => handleChange('headquarters', e.target.value)} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Территория" value={form.territory} onChange={e => handleChange('territory', e.target.value)} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Дата основания" value={form.foundedDate} onChange={e => handleChange('foundedDate', e.target.value)} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Дата роспуска" value={form.disbandedDate} onChange={e => handleChange('disbandedDate', e.target.value)} /></Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth><InputLabel>Родительская фракция</InputLabel>
                  <Select value={form.parentFactionId} label="Родительская фракция" onChange={e => handleChange('parentFactionId', e.target.value)}>
                    <MenuItem value="">Нет</MenuItem>
                    {otherFactions.map(f => <MenuItem key={f.id} value={String(f.id)}>{FACTION_TYPE_ICONS[f.type] || '🏴'} {f.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3}><TextField fullWidth label="Основной цвет" value={form.color || '#000000'} onChange={e => handleChange('color', e.target.value)} type="color" InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={6} sm={3}><TextField fullWidth label="Вторичный цвет" value={form.secondaryColor || '#000000'} onChange={e => handleChange('secondaryColor', e.target.value)} type="color" InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={12}>
                <TagAutocompleteField options={allTagNames} value={form.tagsStr} pendingInput={tagsInput} onValueChange={v => handleChange('tagsStr', v)} onPendingInputChange={setTagsInput} />
              </Grid>
            </Grid>
          </Section>

          {/* SECTION: Description */}
          <Section title="Описание и история" icon={<EditIcon />} defaultOpen={!isNew}>
            <Grid container spacing={2}>
              <Grid item xs={12}><TextField fullWidth label="Описание" value={form.description} onChange={e => handleChange('description', e.target.value)} multiline rows={4} placeholder="Общее описание фракции..." /></Grid>
              <Grid item xs={12}><TextField fullWidth label="История" value={form.history} onChange={e => handleChange('history', e.target.value)} multiline rows={6} placeholder="Как была основана, ключевые события..." /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Цели и мотивация" value={form.goals} onChange={e => handleChange('goals', e.target.value)} multiline rows={4} placeholder="Чего добивается фракция..." /></Grid>
            </Grid>
          </Section>

          {/* SECTION: Ranks */}
          {!isNew && (
            <Section title="Ранги" icon={<StarIcon />} badge={currentRanks.length} defaultOpen={currentRanks.length > 0}
              action={<DndButton variant="outlined" startIcon={<AddIcon />} size="small" onClick={() => openRankDialog()} sx={{ borderColor: 'rgba(201,169,89,0.4)', color: 'rgba(201,169,89,0.9)' }}>Добавить</DndButton>}>
              {currentRanks.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <StarIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.08)', mb: 1 }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>Создайте иерархию рангов</Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {currentRanks.map(rank => (
                    <ListItem key={rank.id}
                      secondaryAction={
                        <Box display="flex" gap={0.5}>
                          <IconButton size="small" onClick={() => openRankDialog(rank)}><EditIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.4)' }} /></IconButton>
                          <IconButton size="small" onClick={() => handleDeleteRank(rank.id, rank.name)}><DeleteIcon fontSize="small" sx={{ color: 'rgba(255,100,100,0.5)' }} /></IconButton>
                        </Box>
                      }
                      sx={{ backgroundColor: rank.color ? `${rank.color}20` : 'rgba(201,169,89,0.06)', borderRadius: 1.5, mb: 1, border: '1px solid rgba(255,255,255,0.04)' }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: rank.color || 'rgba(201,169,89,0.3)', width: 40, height: 40, fontSize: '1.2rem' }}>{rank.icon || rank.level}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Box display="flex" alignItems="center" gap={1}>
                          <Typography sx={{ color: '#fff', fontWeight: 600 }}>{rank.name}</Typography>
                          <Chip label={`Ур. ${rank.level}`} size="small" sx={{ height: 20, fontSize: '0.65rem', backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }} />
                          <Chip label={`${currentMembers.filter(m => m.rankId === rank.id).length} чел.`} size="small" sx={{ height: 20, fontSize: '0.65rem', backgroundColor: 'rgba(130,130,255,0.15)', color: 'rgba(130,130,255,0.8)' }} />
                        </Box>}
                        secondary={rank.description ? <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)' }}>{rank.description}</Typography> : null}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Section>
          )}

          {/* SECTION: Members */}
          {!isNew && (
            <Section title="Члены" icon={<PeopleIcon />} badge={currentMembers.length} defaultOpen={currentMembers.length > 0}
              action={<DndButton variant="outlined" startIcon={<AddIcon />} size="small" onClick={openMemberDialog} sx={{ borderColor: 'rgba(130,130,255,0.4)', color: 'rgba(130,130,255,0.9)' }}>Добавить</DndButton>}>
              {currentMembers.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <PeopleIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.08)', mb: 1 }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>Добавьте персонажей в фракцию</Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {currentMembers.map(member => (
                    <ListItem key={member.id}
                      secondaryAction={
                        <IconButton size="small" onClick={e => { e.stopPropagation(); handleRemoveMember(member.id, member.characterName || ''); }}>
                          <DeleteIcon fontSize="small" sx={{ color: 'rgba(255,100,100,0.5)' }} />
                        </IconButton>
                      }
                      onClick={() => navigate(`/project/${pid}/characters/${member.characterId}`)}
                      sx={{ backgroundColor: 'rgba(130,130,255,0.06)', borderRadius: 1.5, mb: 1, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.04)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' } }}>
                      <ListItemAvatar>
                        <Avatar src={member.characterImagePath || undefined} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }}><PersonIcon /></Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Box display="flex" alignItems="center" gap={1}>
                          <Typography sx={{ color: '#fff', fontWeight: 600 }}>{member.characterName || `ID: ${member.characterId}`}</Typography>
                          {member.rankName && <Chip label={member.rankName} size="small" sx={{ height: 20, fontSize: '0.65rem', backgroundColor: 'rgba(201,169,89,0.2)', color: 'rgba(201,169,89,0.9)' }} />}
                          {member.role && <Chip label={member.role} size="small" sx={{ height: 20, fontSize: '0.65rem', backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }} />}
                          {!member.isActive && <Chip label="Бывший" size="small" sx={{ height: 20, fontSize: '0.65rem', backgroundColor: 'rgba(255,100,100,0.15)', color: 'rgba(255,100,100,0.7)' }} />}
                        </Box>}
                        secondary={member.notes ? <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)' }}>{member.notes}</Typography> : null}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Section>
          )}

          {/* SECTION: Assets */}
          {!isNew && (
            <Section title="Активы" icon={<StarIcon />} badge={currentAssets.length} defaultOpen={currentAssets.length > 0}
              action={
                <Box display="flex" gap={1}>
                  <DndButton variant="outlined" size="small" onClick={handleBootstrapDefaultAssets} sx={{ borderColor: 'rgba(201,169,89,0.4)', color: 'rgba(201,169,89,0.9)' }}>
                    Добавить базовые активы
                  </DndButton>
                  <DndButton variant="outlined" startIcon={<AddIcon />} size="small" onClick={() => openAssetDialog()} sx={{ borderColor: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.85)' }}>
                    Добавить
                  </DndButton>
                </Box>
              }>
              {currentAssets.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <StarIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.08)', mb: 1 }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>Добавьте активы фракции (например, Казна, Земли)</Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {currentAssets.map(asset => (
                    <ListItem key={asset.id}
                      secondaryAction={
                        <Box display="flex" gap={0.5}>
                          <IconButton size="small" onClick={() => openAssetDialog(asset)}><EditIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.4)' }} /></IconButton>
                          <IconButton size="small" onClick={() => handleDeleteAsset(asset)}><DeleteIcon fontSize="small" sx={{ color: 'rgba(255,100,100,0.5)' }} /></IconButton>
                        </Box>
                      }
                      sx={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 1.5, mb: 1, border: '1px solid rgba(255,255,255,0.04)' }}>
                      <ListItemText
                        primary={<Typography sx={{ color: '#fff', fontWeight: 600 }}>{asset.name}</Typography>}
                        secondary={<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{asset.value || '—'}</Typography>}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Section>
          )}

          {/* SECTION: Relations */}
          {!isNew && (
            <Section title="Связи с фракциями" icon={<LinkIcon />} badge={relationsForDisplay.length} defaultOpen={relationsForDisplay.length > 0}
              action={<DndButton variant="outlined" startIcon={<AddIcon />} size="small" onClick={openRelationDialog} sx={{ borderColor: 'rgba(78,205,196,0.4)', color: 'rgba(78,205,196,0.9)' }}>Добавить</DndButton>}>
              {relationsForDisplay.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <LinkIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.08)', mb: 1 }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>Установите отношения с другими фракциями</Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {relationsForDisplay.map(rel => (
                    <ListItem key={rel.id}
                      secondaryAction={
                        <IconButton size="small" onClick={e => { e.stopPropagation(); handleDeleteRelation(rel.id); }}>
                          <DeleteIcon fontSize="small" sx={{ color: 'rgba(255,100,100,0.5)' }} />
                        </IconButton>
                      }
                      onClick={() => navigate(`/project/${pid}/factions/${rel.otherId}`)}
                      sx={{
                        backgroundColor: `${FACTION_RELATION_COLORS[rel.relationType] || 'rgba(130,130,255,0.2)'}30`,
                        borderRadius: 1.5, mb: 1, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.04)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
                      }}>
                      <ListItemText
                        primary={<Box display="flex" alignItems="center" gap={1}>
                          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>{rel.isOutgoing ? '→' : '←'}</Typography>
                          <Chip label={rel.customLabel || FACTION_RELATION_LABELS[rel.relationType] || rel.relationType} size="small"
                            sx={{ backgroundColor: FACTION_RELATION_COLORS[rel.relationType] || 'rgba(130,130,255,0.3)', color: '#fff', fontSize: '0.7rem', fontWeight: 600 }} />
                          <Typography sx={{ color: '#fff', fontWeight: 600 }}>{rel.otherName}</Typography>
                        </Box>}
                        secondary={rel.description ? <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', mt: 0.5, display: 'block' }}>{rel.description}</Typography> : null}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Section>
          )}

        </Box>
      </Box>

      {/* ===== DIALOGS ===== */}
      <FactionRankDialog
        open={rankDialogOpen} onClose={() => setRankDialogOpen(false)}
        form={rankForm} onFormChange={setRankForm} onSubmit={handleSaveRank}
        editingRank={editingRank}
      />
      <FactionMemberDialog
        open={memberDialogOpen} onClose={() => setMemberDialogOpen(false)}
        form={memberForm} onFormChange={setMemberForm} onSubmit={handleAddMember}
        allCharacters={allCharacters} currentMembers={currentMembers} currentRanks={currentRanks}
      />
      <FactionRelationDialog
        open={relationDialogOpen} onClose={() => setRelationDialogOpen(false)}
        form={relationForm} onFormChange={setRelationForm} onSubmit={handleAddRelation}
        otherFactions={otherFactions}
      />
      <Dialog open={assetDialogOpen} onClose={() => setAssetDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingAsset ? 'Редактировать актив' : 'Новый актив'}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
          <TextField
            autoFocus
            fullWidth
            label="Название *"
            value={assetForm.name}
            onChange={(e) => setAssetForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <TextField
            fullWidth
            label="Значение"
            value={assetForm.value}
            onChange={(e) => setAssetForm((prev) => ({ ...prev, value: e.target.value }))}
            placeholder="например: 25000 золотых"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssetDialogOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSaveAsset} disabled={!assetForm.name.trim()}>
            {editingAsset ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};