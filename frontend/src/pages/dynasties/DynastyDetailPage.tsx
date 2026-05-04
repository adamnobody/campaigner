import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, TextField, Button,
  Avatar, IconButton, Chip,
  Select, MenuItem, FormControl, InputLabel,
  List, ListItem, ListItemText,
  Grid, Tooltip, alpha, useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import EventIcon from '@mui/icons-material/Event';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/store/useUIStore';
import { useDynastyStore } from '@/store/useDynastyStore';
import { useCharacterStore } from '@/store/useCharacterStore';
import { useFactionStore } from '@/store/useFactionStore';
import { useTagStore } from '@/store/useTagStore';
import { DndButton } from '@/components/ui/DndButton';
import { TagAutocompleteField } from '@/components/forms/TagAutocompleteField';
import { CollapsibleSection as Section } from '@/components/detail/CollapsibleSection';
import { DynastyMemberDialog, DynastyFamilyLinkDialog, DynastyEventDialog } from '@/pages/dynasties/components/DynastyDialogs';
import { EntityHeroLayout } from '@/components/ui/EntityHeroLayout';
import { EntityTabs } from '@/components/ui/EntityTabs';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  DYNASTY_STATUSES, DYNASTY_STATUS_ICONS,
} from '@campaigner/shared';
import type { DynastyMember, DynastyEvent } from '@campaigner/shared';
import { FamilyTree } from '@/pages/dynasties/components/FamilyTree';
import { DynastyEventsTimeline } from '@/pages/dynasties/components/DynastyEventsTimeline';
import { shallow } from 'zustand/shallow';
import { routes } from '@/utils/routes';

// ==================== Form ====================

interface DynastyForm {
  name: string;
  motto: string;
  description: string;
  history: string;
  status: string;
  color: string;
  secondaryColor: string;
  foundedDate: string;
  extinctDate: string;
  founderId: string;
  currentLeaderId: string;
  heirId: string;
  linkedFactionId: string;
  tagsStr: string;
}

const EMPTY_FORM: DynastyForm = {
  name: '', motto: '', description: '', history: '',
  status: 'active', color: '#c9a959', secondaryColor: '#2a2a4a',
  foundedDate: '', extinctDate: '',
  founderId: '', currentLeaderId: '', heirId: '', linkedFactionId: '',
  tagsStr: '',
};

// ==================== Component ====================

export const DynastyDetailPage: React.FC = () => {
  const { t } = useTranslation(['dynasties', 'common']);
  const { projectId, dynastyId } = useParams<{ projectId: string; dynastyId: string }>();
  const pid = parseInt(projectId!);
  const isNew = !dynastyId || dynastyId === 'new';
  const did = dynastyId && !isNew ? parseInt(dynastyId) : 0;
  const navigate = useNavigate();
  const theme = useTheme();
  
  const { showSnackbar, showConfirmDialog } = useUIStore((state) => ({
    showSnackbar: state.showSnackbar,
    showConfirmDialog: state.showConfirmDialog,
  }), shallow);

  const {
    currentDynasty, loading,
    fetchDynasty, createDynasty, updateDynasty, deleteDynasty,
    uploadImage, setTags,
    addMember, updateMember, removeMember,
    addFamilyLink, deleteFamilyLink,
    addEvent, updateEvent, deleteEvent, reorderEvents,
    saveGraphPositions,
    setCurrentDynasty,
  } = useDynastyStore((state) => ({
    currentDynasty: state.currentDynasty,
    loading: state.loading,
    fetchDynasty: state.fetchDynasty,
    createDynasty: state.createDynasty,
    updateDynasty: state.updateDynasty,
    deleteDynasty: state.deleteDynasty,
    uploadImage: state.uploadImage,
    setTags: state.setTags,
    addMember: state.addMember,
    updateMember: state.updateMember,
    removeMember: state.removeMember,
    addFamilyLink: state.addFamilyLink,
    deleteFamilyLink: state.deleteFamilyLink,
    addEvent: state.addEvent,
    updateEvent: state.updateEvent,
    deleteEvent: state.deleteEvent,
    reorderEvents: state.reorderEvents,
    saveGraphPositions: state.saveGraphPositions,
    setCurrentDynasty: state.setCurrentDynasty,
  }), shallow);

  const { characters, fetchCharacters } = useCharacterStore((state) => ({
    characters: state.characters,
    fetchCharacters: state.fetchCharacters,
  }), shallow);
  const { factions, fetchFactions } = useFactionStore((state) => ({
    factions: state.factions,
    fetchFactions: state.fetchFactions,
  }), shallow);
  const { tags, fetchTags, findOrCreateTagsByNames } = useTagStore((state) => ({
    tags: state.tags,
    fetchTags: state.fetchTags,
    findOrCreateTagsByNames: state.findOrCreateTagsByNames,
  }), shallow);

  const [form, setForm] = useState<DynastyForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Dialogs
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [memberForm, setMemberForm] = useState({ characterId: '', generation: 0, role: '', birthDate: '', deathDate: '', isMainLine: true, notes: '' });

  const [familyLinkDialogOpen, setFamilyLinkDialogOpen] = useState(false);
  const [familyLinkForm, setFamilyLinkForm] = useState({ sourceCharacterId: '', targetCharacterId: '', relationType: 'parent', customLabel: '' });

  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<DynastyEvent | null>(null);
  const [eventForm, setEventForm] = useState({ title: '', description: '', eventDate: '', importance: 'normal', sortOrder: 0 });

  // ==================== Load ====================

  useEffect(() => {
    fetchTags(pid).catch(() => {});
    fetchCharacters(pid, { limit: 500 }).catch(() => {});
    fetchFactions(pid, { limit: 500 }).catch(() => {});
  }, [pid]);

  useEffect(() => {
    if (isNew) { setForm(EMPTY_FORM); setCurrentDynasty(null); setTagsInput(''); return; }
    fetchDynasty(parseInt(dynastyId!)).catch(() => showSnackbar(t('dynasties:snackbar.loadError'), 'error'));
  }, [dynastyId, isNew, fetchDynasty, showSnackbar, t]);

  useEffect(() => {
    if (isNew || !currentDynasty || currentDynasty.id !== did) return;
    setForm({
      name: currentDynasty.name || '',
      motto: currentDynasty.motto || '',
      description: currentDynasty.description || '',
      history: currentDynasty.history || '',
      status: currentDynasty.status || 'active',
      color: currentDynasty.color || '#c9a959',
      secondaryColor: currentDynasty.secondaryColor || '#2a2a4a',
      foundedDate: currentDynasty.foundedDate || '',
      extinctDate: currentDynasty.extinctDate || '',
      founderId: currentDynasty.founderId ? String(currentDynasty.founderId) : '',
      currentLeaderId: currentDynasty.currentLeaderId ? String(currentDynasty.currentLeaderId) : '',
      heirId: currentDynasty.heirId ? String(currentDynasty.heirId) : '',
      linkedFactionId: currentDynasty.linkedFactionId ? String(currentDynasty.linkedFactionId) : '',
      tagsStr: (currentDynasty.tags || []).map((tag: { name: string }) => tag.name).join(', '),
    });
    setTagsInput('');
  }, [currentDynasty, did, isNew]);

  // ==================== Helpers ====================

  const handleChange = (field: keyof DynastyForm, value: string) => setForm(prev => ({ ...prev, [field]: value }));
  const allTagNames = useMemo(() => tags.map(t => t.name), [tags]);
  const allCharacters = useMemo(() => characters || [], [characters]);
  const currentMembers: DynastyMember[] = currentDynasty?.members || [];
  const currentEvents: DynastyEvent[] = currentDynasty?.events || [];
  const currentFamilyLinks = currentDynasty?.familyLinks || [];

  // Members that belong to this dynasty (for family link selects)
  const dynastyCharacterIds = useMemo(() => new Set(currentMembers.map(m => m.characterId)), [currentMembers]);

  const mergeTagValues = (a: string, b: string): string => {
    const all = [...a.split(','), ...b.split(',')].map(s => s.trim()).filter(Boolean);
    return Array.from(new Set(all)).join(', ');
  };

  const saveTagsForDynasty = async (id: number, str: string) => {
    const names = str.split(',').map(s => s.trim()).filter(Boolean);
    if (!names.length) { await setTags(id, []); return; }
    const ids = await findOrCreateTagsByNames(pid, names);
    await setTags(id, ids);
  };

  const previewTagsStr = mergeTagValues(form.tagsStr, tagsInput);

  // ==================== Actions ====================

  const handleSave = async () => {
    if (!form.name.trim()) { showSnackbar(t('dynasties:snackbar.nameRequired'), 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        motto: form.motto.trim(),
        description: form.description.trim(),
        history: form.history.trim(),
        status: form.status,
        color: form.color.trim(),
        secondaryColor: form.secondaryColor.trim(),
        foundedDate: form.foundedDate.trim(),
        extinctDate: form.extinctDate.trim(),
        founderId: form.founderId ? parseInt(form.founderId) : null,
        currentLeaderId: form.currentLeaderId ? parseInt(form.currentLeaderId) : null,
        heirId: form.heirId ? parseInt(form.heirId) : null,
        linkedFactionId: form.linkedFactionId ? parseInt(form.linkedFactionId) : null,
      };
      const finalTags = mergeTagValues(form.tagsStr, tagsInput);
      if (isNew) {
        const created = await createDynasty({ ...payload, projectId: pid });
        if (finalTags.trim()) await saveTagsForDynasty(created.id, finalTags);
        setTagsInput('');
        showSnackbar(t('dynasties:snackbar.created'), 'success');
        navigate(routes.dynastyDetail(pid, created.id), { replace: true });
      } else {
        await updateDynasty(did, payload);
        await saveTagsForDynasty(did, finalTags);
        setTagsInput('');
        showSnackbar(t('dynasties:snackbar.saved'), 'success');
      }
    } catch (err: any) { showSnackbar(err.message || t('dynasties:snackbar.genericError'), 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = () => {
    if (isNew) return;
    showConfirmDialog(t('dynasties:list.confirmDeleteTitle'), t('dynasties:confirm.deleteDynastyDetail', { name: form.name }), async () => {
      try { await deleteDynasty(did); showSnackbar(t('dynasties:snackbar.deleted'), 'success'); navigate(routes.dynasties(pid)); }
      catch { showSnackbar(t('dynasties:snackbar.genericError'), 'error'); }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || isNew) return;
    try { await uploadImage(did, file); showSnackbar(t('dynasties:snackbar.coatUploaded'), 'success'); } catch { showSnackbar(t('dynasties:snackbar.genericError'), 'error'); }
  };

  // Members
  const openMemberDialog = () => {
    setMemberForm({ characterId: '', generation: 0, role: '', birthDate: '', deathDate: '', isMainLine: true, notes: '' });
    setMemberDialogOpen(true);
  };
  const handleAddMember = async () => {
    if (!memberForm.characterId) return;
    try {
      await addMember(did, {
        characterId: parseInt(memberForm.characterId),
        generation: memberForm.generation,
        role: memberForm.role,
        birthDate: memberForm.birthDate,
        deathDate: memberForm.deathDate,
        isMainLine: memberForm.isMainLine,
        notes: memberForm.notes,
      });
      setMemberDialogOpen(false);
      showSnackbar(t('dynasties:snackbar.memberAdded'), 'success');
    } catch (err: any) { showSnackbar(err.message || t('dynasties:snackbar.genericError'), 'error'); }
  };
  const handleRemoveMember = (id: number, name: string) => {
    showConfirmDialog(t('dynasties:detail.familyLinks.confirmDeleteGeneric'), t('dynasties:detail.members.confirmRemove', { name }), async () => {
      try { await removeMember(did, id); showSnackbar(t('dynasties:snackbar.memberRemoved'), 'success'); } catch { showSnackbar(t('dynasties:snackbar.genericError'), 'error'); }
    });
  };

  // Family links
  const openFamilyLinkDialog = () => {
    setFamilyLinkForm({ sourceCharacterId: '', targetCharacterId: '', relationType: 'parent', customLabel: '' });
    setFamilyLinkDialogOpen(true);
  };
  const handleAddFamilyLink = async () => {
    if (!familyLinkForm.sourceCharacterId || !familyLinkForm.targetCharacterId) return;
    try {
      await addFamilyLink(did, {
        sourceCharacterId: parseInt(familyLinkForm.sourceCharacterId),
        targetCharacterId: parseInt(familyLinkForm.targetCharacterId),
        relationType: familyLinkForm.relationType,
        customLabel: familyLinkForm.customLabel,
      });
      setFamilyLinkDialogOpen(false);
      showSnackbar(t('dynasties:snackbar.linkAdded'), 'success');
    } catch (err: any) { showSnackbar(err.message || t('dynasties:snackbar.genericError'), 'error'); }
  };
  const handleDeleteFamilyLink = (id: number) => {
    showConfirmDialog(t('dynasties:detail.familyLinks.confirmDeleteTitle'), t('dynasties:detail.familyLinks.confirmDeleteMessage'), async () => {
      try { await deleteFamilyLink(did, id); showSnackbar(t('dynasties:snackbar.linkRemoved'), 'success'); } catch { showSnackbar(t('dynasties:snackbar.genericError'), 'error'); }
    });
  };

  // Events
  const openEventDialog = (evt?: DynastyEvent) => {
    if (evt) {
      setEditingEvent(evt);
      setEventForm({ title: evt.title, description: evt.description || '', eventDate: evt.eventDate, importance: evt.importance, sortOrder: evt.sortOrder });
    } else {
      setEditingEvent(null);
      setEventForm({ title: '', description: '', eventDate: '', importance: 'normal', sortOrder: currentEvents.length });
    }
    setEventDialogOpen(true);
  };
  const handleSaveEvent = async () => {
    if (!eventForm.title.trim() || !eventForm.eventDate.trim()) return;
    try {
      if (editingEvent) {
        await updateEvent(did, editingEvent.id, eventForm);
        showSnackbar(t('dynasties:snackbar.eventUpdated'), 'success');
      } else {
        await addEvent(did, eventForm);
        showSnackbar(t('dynasties:snackbar.eventAdded'), 'success');
      }
      setEventDialogOpen(false);
    } catch (err: any) { showSnackbar(err.message || t('dynasties:snackbar.genericError'), 'error'); }
  };
  const handleDeleteEvent = (id: number, title: string) => {
    showConfirmDialog(t('dynasties:detail.events.confirmDeleteTitle'), t('dynasties:detail.events.confirmDeleteMessage', { title }), async () => {
      try { await deleteEvent(did, id); showSnackbar(t('dynasties:snackbar.eventRemoved'), 'success'); } catch { showSnackbar(t('dynasties:snackbar.genericError'), 'error'); }
    });
  };
  const handleReorderEvents = async (reordered: DynastyEvent[]) => {
    try {
      await reorderEvents(did, reordered.map((e) => e.id));
    } catch {
      showSnackbar(t('dynasties:snackbar.reorderError'), 'error');
    }
  };

  // Group members by generation
  const membersByGeneration = useMemo(() => {
    const map = new Map<number, DynastyMember[]>();
    for (const m of currentMembers) {
      const gen = m.generation || 0;
      if (!map.has(gen)) map.set(gen, []);
      map.get(gen)!.push(m);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [currentMembers]);

  // ==================== Render ====================

  if (loading && !isNew && !currentDynasty) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography sx={{ color: 'text.secondary' }}>{t('common:loading')}</Typography>
      </Box>
    );
  }

  const dynastyColor = form.color || theme.palette.primary.main;

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton onClick={() => navigate(routes.dynasties(pid))} sx={{ mr: 1 }}><ArrowBackIcon /></IconButton>
        <Typography variant="body2" color="text.secondary">{t('dynasties:detail.backToList')}</Typography>
      </Box>

      <EntityHeroLayout
        avatarNode={
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <Avatar
              src={currentDynasty?.imagePath || undefined}
              sx={{
                width: 140, height: 140,
                borderRadius: 3,
                bgcolor: alpha(dynastyColor, 0.1),
                border: `3px solid ${alpha(dynastyColor, 0.4)}`,
                boxShadow: `0 0 30px ${alpha(dynastyColor, 0.2)}`,
                color: dynastyColor,
                fontSize: '4rem',
              }}
              variant="rounded"
            >
              👑
            </Avatar>
            {!isNew && (
              <Tooltip title={t('dynasties:detail.uploadCoatTooltip')}>
                <IconButton
                  component="label"
                  sx={{
                    position: 'absolute', bottom: -8, right: -8,
                    backgroundColor: alpha(dynastyColor, 0.2),
                    border: `1px solid ${alpha(dynastyColor, 0.4)}`,
                    width: 36, height: 36,
                    '&:hover': { backgroundColor: alpha(dynastyColor, 0.4) },
                  }}
                >
                  <CloudUploadIcon sx={{ fontSize: 18, color: dynastyColor }} />
                  <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        }
        title={isNew ? t('dynasties:detail.newTitle') : form.name || t('dynasties:detail.fallbackName')}
        subtitle={form.motto ? `«${form.motto}»` : undefined}
        actionButtons={
          <>
            {!isNew && <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleDelete} size="small">{t('common:delete')}</Button>}
            <DndButton variant="contained" startIcon={<SaveIcon />} onClick={handleSave} loading={saving} disabled={!form.name.trim()}>
              {isNew ? t('common:create') : t('common:save')}
            </DndButton>
          </>
        }
      />

      <EntityTabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        tabs={[
          { value: 'overview', label: t('dynasties:detail.tabs.overview'), icon: <EditIcon fontSize="small" /> },
          { value: 'family', label: t('dynasties:detail.tabs.family'), icon: <AccountTreeIcon fontSize="small" /> },
          { value: 'events', label: t('dynasties:detail.tabs.events'), icon: <EventIcon fontSize="small" /> },
        ]}
      />

      {activeTab === 'overview' && (
        <Box display="flex" gap={3} sx={{ flexDirection: { xs: 'column', md: 'row' } }}>
          {/* LEFT SIDEBAR */}
          <Box sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0 }}>
            <GlassCard sx={{ p: 3, position: 'sticky', top: 80 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>{t('dynasties:detail.summary.title')}</Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ mb: 0.5, pb: 1, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2, mb: 0.5 }}>{t('dynasties:detail.summary.status')}</Typography>
                  <Chip
                    label={`${DYNASTY_STATUS_ICONS[form.status] || ''} ${t(`dynasties:statuses.${form.status}`, { defaultValue: form.status })}`.trim()}
                    size="small"
                    sx={{
                      height: 24, fontSize: '0.75rem', fontWeight: 600,
                      backgroundColor: alpha(dynastyColor, 0.15),
                      color: dynastyColor,
                      border: `1px solid ${alpha(dynastyColor, 0.2)}`,
                    }}
                  />
                </Box>
                {currentDynasty?.founderName && (
                  <Box sx={{ mb: 0.5, pb: 1, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2, mb: 0.5 }}>{t('dynasties:detail.summary.founder')}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>{currentDynasty.founderName}</Typography>
                  </Box>
                )}
                {currentDynasty?.currentLeaderName && (
                  <Box sx={{ mb: 0.5, pb: 1, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2, mb: 0.5 }}>{t('dynasties:detail.summary.head')}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>{currentDynasty.currentLeaderName}</Typography>
                  </Box>
                )}
                {currentDynasty?.heirName && (
                  <Box sx={{ mb: 0.5, pb: 1, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2, mb: 0.5 }}>{t('dynasties:detail.summary.heir')}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>{currentDynasty.heirName}</Typography>
                  </Box>
                )}
                {currentDynasty?.linkedFactionName && (
                  <Box sx={{ mb: 0.5, pb: 1, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2, mb: 0.5 }}>{t('dynasties:detail.summary.linkedFaction')}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>{currentDynasty.linkedFactionName}</Typography>
                  </Box>
                )}
                
                {previewTagsStr.trim() && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>{t('dynasties:detail.summary.tags')}</Typography>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {previewTagsStr.split(',').map((part, i) => { const s = part.trim(); return s ? <Chip key={i} label={s} size="small" sx={{ height: 24, fontSize: '0.75rem' }} /> : null; })}
                    </Box>
                  </Box>
                )}
              </Box>
            </GlassCard>
          </Box>

          {/* MAIN CONTENT */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            {/* Basic info */}
            <Section title={t('dynasties:detail.sections.basics')} icon={<EditIcon />} defaultOpen={true}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label={t('dynasties:detail.fields.name')} value={form.name} onChange={e => handleChange('name', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label={t('dynasties:detail.fields.motto')} value={form.motto} onChange={e => handleChange('motto', e.target.value)} placeholder={t('dynasties:detail.placeholders.motto')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth><InputLabel>{t('dynasties:detail.fields.status')}</InputLabel>
                    <Select value={form.status} label={t('dynasties:detail.fields.status')} onChange={e => handleChange('status', e.target.value)}>
                      {DYNASTY_STATUSES.map(s => (
                        <MenuItem key={s} value={s}>
                          {DYNASTY_STATUS_ICONS[s]} {t(`dynasties:statuses.${s}`, { defaultValue: s })}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth><InputLabel>{t('dynasties:detail.fields.linkedFaction')}</InputLabel>
                    <Select value={form.linkedFactionId} label={t('dynasties:detail.fields.linkedFaction')} onChange={e => handleChange('linkedFactionId', e.target.value)}>
                      <MenuItem value="">{t('dynasties:detail.factionNone')}</MenuItem>
                      {factions.map(f => <MenuItem key={f.id} value={String(f.id)}>{f.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label={t('dynasties:detail.fields.foundedDate')} value={form.foundedDate} onChange={e => handleChange('foundedDate', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label={t('dynasties:detail.fields.extinctDate')} value={form.extinctDate} onChange={e => handleChange('extinctDate', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth><InputLabel>{t('dynasties:detail.fields.founder')}</InputLabel>
                    <Select value={form.founderId} label={t('dynasties:detail.fields.founder')} onChange={e => handleChange('founderId', e.target.value)}>
                      <MenuItem value="">{t('dynasties:detail.characterNotSet')}</MenuItem>
                      {allCharacters.map((ch: any) => <MenuItem key={ch.id} value={String(ch.id)}>{ch.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth><InputLabel>{t('dynasties:detail.fields.head')}</InputLabel>
                    <Select value={form.currentLeaderId} label={t('dynasties:detail.fields.head')} onChange={e => handleChange('currentLeaderId', e.target.value)}>
                      <MenuItem value="">{t('dynasties:detail.characterNotSet')}</MenuItem>
                      {allCharacters.map((ch: any) => <MenuItem key={ch.id} value={String(ch.id)}>{ch.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth><InputLabel>{t('dynasties:detail.fields.heir')}</InputLabel>
                    <Select value={form.heirId} label={t('dynasties:detail.fields.heir')} onChange={e => handleChange('heirId', e.target.value)}>
                      <MenuItem value="">{t('dynasties:detail.characterNotSet')}</MenuItem>
                      {allCharacters.map((ch: any) => <MenuItem key={ch.id} value={String(ch.id)}>{ch.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField fullWidth label={t('dynasties:detail.fields.primaryColor')} value={form.color || '#000000'} onChange={e => handleChange('color', e.target.value)} type="color" InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField fullWidth label={t('dynasties:detail.fields.secondaryColor')} value={form.secondaryColor || '#000000'} onChange={e => handleChange('secondaryColor', e.target.value)} type="color" InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12}>
                  <TagAutocompleteField
                    options={allTagNames}
                    value={form.tagsStr}
                    pendingInput={tagsInput}
                    onValueChange={v => handleChange('tagsStr', v)}
                    onPendingInputChange={setTagsInput}
                    label={t('dynasties:tagField.label')}
                    placeholder={t('dynasties:tagField.placeholder')}
                    noOptionsText={t('dynasties:tagField.noOptions')}
                  />
                </Grid>
              </Grid>
            </Section>

            {/* Description & History */}
            <Section title={t('dynasties:detail.sections.description')} icon={<HistoryEduIcon />} defaultOpen={!isNew}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label={t('dynasties:detail.fields.description')} value={form.description} onChange={e => handleChange('description', e.target.value)} multiline rows={4} placeholder={t('dynasties:detail.placeholders.description')} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label={t('dynasties:detail.fields.history')} value={form.history} onChange={e => handleChange('history', e.target.value)} multiline rows={6} placeholder={t('dynasties:detail.placeholders.history')} />
                </Grid>
              </Grid>
            </Section>
          </Box>
        </Box>
      )}

      {activeTab === 'family' && (
        <Box>
          {/* Family Tree Visualization */}
          {!isNew && currentMembers.length >= 2 && currentFamilyLinks.length > 0 && (
            <Section title={t('dynasties:detail.sections.tree')} icon={<AccountTreeIcon />} defaultOpen={true}>
              <FamilyTree
                members={currentMembers}
                familyLinks={currentFamilyLinks}
                dynastyColor={form.color}
                dynastyId={currentDynasty?.id}
                onSavePositions={(positions) => {
                  if (currentDynasty?.id) {
                    saveGraphPositions(currentDynasty.id, positions);
                  }
                }}
              />
            </Section>
          )}

          {/* Members by generation */}
          {!isNew && (
            <Section title={t('dynasties:detail.sections.members')} icon={<PeopleIcon />} badge={currentMembers.length} defaultOpen={true}
              action={<DndButton variant="outlined" startIcon={<AddIcon />} size="small" onClick={openMemberDialog} sx={{ borderColor: alpha(theme.palette.primary.main, 0.5) }}>{t('dynasties:detail.members.add')}</DndButton>}>
              {currentMembers.length === 0 ? (
                <EmptyState icon={<PeopleIcon />} title={t('dynasties:detail.members.emptyTitle')} description={t('dynasties:detail.members.emptyDescription')} actionLabel={t('dynasties:detail.members.addCharacter')} onAction={openMemberDialog} />
              ) : (
                <>
                  {membersByGeneration.map(([gen, members]) => (
                    <Box key={gen} sx={{ mb: 3 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                        <Box sx={{ width: 24, height: 1, backgroundColor: alpha(dynastyColor, 0.3) }} />
                        <Typography sx={{
                          fontFamily: '"Cinzel", serif', fontSize: '0.85rem', fontWeight: 700,
                          color: dynastyColor, whiteSpace: 'nowrap',
                        }}>
                          {gen === 0 ? t('dynasties:detail.generationFounders') : t('dynasties:detail.generationN', { n: gen })}
                        </Typography>
                        <Box sx={{ flexGrow: 1, height: 1, backgroundColor: alpha(dynastyColor, 0.15) }} />
                      </Box>

                      <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                        gap: 1.5,
                      }}>
                        {members.map(member => (
                          <Box key={member.id} sx={{
                            p: 2, display: 'flex', alignItems: 'center', gap: 1.5,
                            backgroundColor: member.isMainLine ? alpha(dynastyColor, 0.08) : alpha(theme.palette.background.paper, 0.4),
                            border: `1px solid ${member.isMainLine ? alpha(dynastyColor, 0.25) : alpha(theme.palette.divider, 0.5)}`,
                            borderRadius: 2, cursor: 'pointer',
                            transition: 'all 0.15s',
                            '&:hover': { backgroundColor: alpha(theme.palette.action.hover, 0.1), '& .member-delete': { opacity: 1 } },
                          }}
                            onClick={() => navigate(routes.characterDetail(pid, member.characterId))}
                          >
                            <Avatar
                              src={member.characterImagePath || undefined}
                              sx={{
                                width: 44, height: 44,
                                bgcolor: alpha(dynastyColor, 0.1),
                                border: member.characterStatus === 'dead' ? `2px solid ${alpha(theme.palette.text.disabled, 0.3)}` : `2px solid ${alpha(dynastyColor, 0.3)}`,
                                filter: member.characterStatus === 'dead' ? 'grayscale(0.7)' : 'none',
                              }}
                            >
                              <PersonIcon sx={{ color: alpha(dynastyColor, 0.5) }} />
                            </Avatar>
                            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                              <Typography sx={{
                                fontWeight: 600, fontSize: '0.9rem', color: 'text.primary',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}>
                                {member.characterName || `ID: ${member.characterId}`}
                              </Typography>
                              <Box display="flex" gap={0.5} flexWrap="wrap" mt={0.25}>
                                {member.role && (
                                  <Chip label={member.role} size="small" sx={{
                                    height: 18, fontSize: '0.6rem',
                                    backgroundColor: alpha(dynastyColor, 0.15), color: dynastyColor, borderRadius: 1,
                                  }} />
                                )}
                                {member.isMainLine && (
                                  <Chip label={t('dynasties:detail.mainLineChip')} size="small" sx={{
                                    height: 18, fontSize: '0.55rem',
                                    backgroundColor: alpha(dynastyColor, 0.1), color: dynastyColor, borderRadius: 1,
                                  }} />
                                )}
                                {member.characterStatus === 'dead' && (
                                  <Chip label="†" size="small" sx={{
                                    height: 18, fontSize: '0.65rem',
                                    backgroundColor: alpha(theme.palette.text.disabled, 0.15), color: theme.palette.text.secondary, borderRadius: 1,
                                  }} />
                                )}
                              </Box>
                            </Box>
                            <IconButton size="small" className="member-delete" sx={{ opacity: 0, transition: 'opacity 0.15s' }}
                              onClick={e => { e.stopPropagation(); handleRemoveMember(member.id, member.characterName || ''); }}>
                              <DeleteIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  ))}
                </>
              )}
            </Section>
          )}

          {/* Family links */}
          {!isNew && (
            <Section title={t('dynasties:detail.sections.familyLinks')} icon={<AccountTreeIcon />} badge={currentFamilyLinks.length} defaultOpen={currentFamilyLinks.length > 0}
              action={<DndButton variant="outlined" startIcon={<AddIcon />} size="small" onClick={openFamilyLinkDialog}
                disabled={currentMembers.length < 2}
                sx={{ borderColor: alpha(theme.palette.primary.main, 0.5) }}>{t('dynasties:detail.familyLinks.add')}</DndButton>}>
              {currentFamilyLinks.length === 0 ? (
                <EmptyState icon={<AccountTreeIcon />} title={t('dynasties:detail.familyLinks.emptyTitle')} description={currentMembers.length < 2 ? t('dynasties:detail.familyLinks.emptyNeedMembers') : t('dynasties:detail.familyLinks.emptyDescription')} actionLabel={currentMembers.length >= 2 ? t('dynasties:detail.familyLinks.addLink') : undefined} onAction={currentMembers.length >= 2 ? openFamilyLinkDialog : undefined} />
              ) : (
                <List disablePadding>
                  {currentFamilyLinks.map(link => (
                    <ListItem key={link.id}
                      secondaryAction={
                        <IconButton size="small" onClick={() => handleDeleteFamilyLink(link.id)}>
                          <DeleteIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                        </IconButton>
                      }
                      sx={{
                        backgroundColor: alpha(theme.palette.background.paper, 0.4),
                        borderRadius: 1.5, mb: 1,
                        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                      }}>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                            <Typography sx={{ color: 'text.primary', fontWeight: 600, fontSize: '0.9rem' }}>
                              {link.sourceCharacterName}
                            </Typography>
                            <Chip
                              label={link.customLabel || t(`dynasties:familyRelationTypes.${link.relationType}`, { defaultValue: link.relationType })}
                              size="small"
                              sx={{
                                height: 22, fontSize: '0.7rem', fontWeight: 600,
                                backgroundColor: alpha(dynastyColor, 0.15), color: dynastyColor,
                              }}
                            />
                            <Typography sx={{ color: 'text.secondary' }}>→</Typography>
                            <Typography sx={{ color: 'text.primary', fontWeight: 600, fontSize: '0.9rem' }}>
                              {link.targetCharacterName}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Section>
          )}
        </Box>
      )}

      {activeTab === 'events' && (
        <Box>
          {/* Dynasty Events / Timeline */}
          {!isNew && (
            <Section title={t('dynasties:detail.sections.events')} icon={<EventIcon />} badge={currentEvents.length} defaultOpen={true}
              action={<DndButton variant="outlined" startIcon={<AddIcon />} size="small" onClick={() => openEventDialog()}
                sx={{ borderColor: alpha(theme.palette.primary.main, 0.5) }}>{t('dynasties:detail.events.add')}</DndButton>}>
              {currentEvents.length === 0 ? (
                <EmptyState icon={<EventIcon />} title={t('dynasties:detail.events.emptyTitle')} description={t('dynasties:detail.events.emptyDescription')} actionLabel={t('dynasties:detail.events.addEvent')} onAction={() => openEventDialog()} />
              ) : (
                <DynastyEventsTimeline
                  events={currentEvents}
                  onEdit={openEventDialog}
                  onDelete={handleDeleteEvent}
                  onReorder={handleReorderEvents}
                />
              )}
            </Section>
          )}
        </Box>
      )}

      {/* ===== DIALOGS ===== */}
      <DynastyMemberDialog
        open={memberDialogOpen} onClose={() => setMemberDialogOpen(false)}
        form={memberForm} onFormChange={setMemberForm} onSubmit={handleAddMember}
        allCharacters={allCharacters} currentMembers={currentMembers}
      />
      <DynastyFamilyLinkDialog
        open={familyLinkDialogOpen} onClose={() => setFamilyLinkDialogOpen(false)}
        form={familyLinkForm} onFormChange={setFamilyLinkForm} onSubmit={handleAddFamilyLink}
        currentMembers={currentMembers}
      />
      <DynastyEventDialog
        open={eventDialogOpen} onClose={() => setEventDialogOpen(false)}
        form={eventForm} onFormChange={setEventForm} onSubmit={handleSaveEvent}
        editingEvent={editingEvent}
      />
    </Box>
  );
};
