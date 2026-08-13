import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, TextField, Button,
  Avatar, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, Autocomplete,
  List, ListItem, ListItemText, ListItemAvatar,
  Collapse, Tabs, Tab, alpha, useTheme,
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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CharacterTraitsTab } from '@/pages/characters/components/CharacterTraitsTab';
import { AssetAvatar } from '@/components/ui/AssetAvatar';
import { factionsApi } from '@/api/factions';
import { useUIStore } from '@/store/useUIStore';
import { useCharacterStore } from '@/store/useCharacterStore';
import { useBranchStore } from '@/store/useBranchStore';
import { useTagStore } from '@/store/useTagStore';
import { shallow } from 'zustand/shallow';
import { DndButton } from '@/components/ui/DndButton';
import { TagAutocompleteField } from '@/components/forms/TagAutocompleteField';
import { EmptyState } from '@/components/ui/EmptyState';
import { BranchEntityMissingDialog } from '@/components/ui/BranchEntityMissingDialog';
import {
  CampaignerFieldRow,
  CampaignerPage,
  CampaignerPageHeader,
  CampaignerSurface,
} from '@/components/ui/CampaignerPrimitives';
import { routes } from '@/utils/routes';
import { isNotFoundError } from '@/utils/error';
import {
  RELATIONSHIP_TYPE_KEYS,
  type RelationshipTypeKey,
} from '@/pages/characters/graph/graphConstants';

// ==================== Constants ====================

type RelationshipType = RelationshipTypeKey;

const isRelationshipType = (value: string): value is RelationshipType =>
  (RELATIONSHIP_TYPE_KEYS as readonly string[]).includes(value);

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

const ArticleSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  badge?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, defaultOpen = true, badge, action, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Box sx={{ mb: 3.75 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
        <Box
          component="button"
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          sx={{
            minWidth: 0,
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            p: 0,
            border: 0,
            color: 'text.primary',
            background: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <Box sx={{ display: 'flex', color: 'primary.main', '& svg': { fontSize: 18 } }}>{icon}</Box>
          <Typography variant="h5" sx={{ flex: 1, fontSize: '1.45rem' }}>{title}</Typography>
          {badge ? <Chip label={badge} size="small" /> : null}
          <ExpandMoreIcon
            sx={{
              color: 'text.secondary',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 160ms ease',
            }}
          />
        </Box>
        {action && open ? <Box>{action}</Box> : null}
      </Box>
      <Collapse in={open}>
        {children}
      </Collapse>
    </Box>
  );
};

// ==================== Component ====================

export const CharacterDetailPage: React.FC = () => {
  const { t } = useTranslation(['characters', 'common']);
  const { projectId, characterId } = useParams<{ projectId: string; characterId: string }>();
  const pid = parseInt(projectId!);
  const isNew = !characterId || characterId === 'new';
  const navigate = useNavigate();
  const theme = useTheme();
  
  const { showSnackbar, showConfirmDialog } = useUIStore((state) => ({
    showSnackbar: state.showSnackbar,
    showConfirmDialog: state.showConfirmDialog,
  }), shallow);

  const activeBranchId = useBranchStore((s) => s.activeBranchId);

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

  const getRelationshipLabel = (value: unknown): string => {
    if (typeof value === 'string' && isRelationshipType(value)) {
      return t(`relationshipTypes.${value}`);
    }
    return String(value ?? '');
  };

  const [form, setForm] = useState<CharacterForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [stateOptions, setStateOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [factionOptions, setFactionOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [branchMissingDialogOpen, setBranchMissingDialogOpen] = useState(false);

  const [relDialogOpen, setRelDialogOpen] = useState(false);
  const [relForm, setRelForm] = useState<{ targetId: string; type: RelationshipType; description: string }>({
    targetId: '', type: 'ally', description: '',
  });
  const closeMissingBranchEntity = useCallback(() => {
    setBranchMissingDialogOpen(false);
    setCurrentCharacter(null);
    setRelDialogOpen(false);
    navigate(routes.characters(pid), { replace: true });
  }, [navigate, pid, setCurrentCharacter]);

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
  }, [pid, activeBranchId, fetchTags, fetchCharacters, fetchRelationships]);

  useEffect(() => {
    if (isNew) { setForm(EMPTY_FORM); setCurrentCharacter(null); setTagsInput(''); return; }
    fetchCharacter(pid, parseInt(characterId!)).catch((error: unknown) => {
      if (isNotFoundError(error)) {
        setCurrentCharacter(null);
        setBranchMissingDialogOpen(true);
        return;
      }
      showSnackbar(t('snackbar.loadError'), 'error');
    });
  }, [characterId, isNew, fetchCharacter, showSnackbar, setCurrentCharacter, t, pid, activeBranchId]);

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
    if (!form.name.trim()) { showSnackbar(t('snackbar.nameRequired'), 'error'); return; }
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
        showSnackbar(t('snackbar.characterCreated'), 'success');
        navigate(routes.characterDetail(pid, created.id), { replace: true });
      } else {
        await updateCharacter(cid, payload);
        await saveTagsForCharacter(cid, finalTags);
        setTagsInput('');
        showSnackbar(t('snackbar.characterUpdated'), 'success');
      }
    } catch (err: any) { showSnackbar(err.message || t('snackbar.genericError'), 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = () => {
    if (isNew) return;
    showConfirmDialog(
      t('confirm.deleteCharacterTitle'),
      t('confirm.deleteCharacterMessage', { name: form.name }),
      async () => {
      try { await deleteCharacter(cid); showSnackbar(t('snackbar.deleted'), 'success'); navigate(routes.characters(pid)); }
      catch { showSnackbar(t('snackbar.genericError'), 'error'); }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || isNew) return;
    try { await uploadImage(cid, file); showSnackbar(t('snackbar.photoUploaded'), 'success'); } catch { showSnackbar(t('snackbar.genericError'), 'error'); }
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
      showSnackbar(t('snackbar.relationshipAdded'), 'success');
    } catch (err: any) { showSnackbar(err.message || t('snackbar.genericError'), 'error'); }
  };

  const handleDeleteRelationship = (relId: number) => {
    showConfirmDialog(
      t('detail.confirmDeleteRelationship.title'),
      t('detail.confirmDeleteRelationship.message'),
      async () => {
      try { await deleteRelationship(relId, pid); showSnackbar(t('snackbar.relationshipRemoved'), 'success'); } catch { showSnackbar(t('snackbar.genericError'), 'error'); }
    });
  };

  if (loading && !isNew && !currentCharacter) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><Typography sx={{ color: 'text.secondary' }}>{t('detail.loading')}</Typography></Box>;
  }

  return (
    <CampaignerPage maxWidth={1180}>
      <Button
        variant="text"
        size="small"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(routes.characters(pid))}
        sx={{ mt: 2 }}
      >
        {t('detail.backToList')}
      </Button>

      <CampaignerPageHeader
        eyebrow={isNew ? t('detail.eyebrowDraft') : t('detail.eyebrowCharacter')}
        title={isNew ? t('detail.newCharacter') : (form.name || t('detail.fallbackName'))}
        description={form.title || (isNew ? t('detail.createDescription') : form.bio)}
        actions={
          <>
            {!isNew ? (
              <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleDelete} size="small">
                {t('common:delete')}
              </Button>
            ) : null}
            <DndButton variant="contained" startIcon={<SaveIcon />} onClick={handleSave} loading={saving} disabled={!form.name.trim()}>
              {isNew ? t('common:create') : t('common:save')}
            </DndButton>
          </>
        }
      />

      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 4 }}
      >
        <Tab value="overview" label={t('detail.tabs.overview')} />
        <Tab value="traits" label={t('detail.tabs.traits')} />
        <Tab value="relations" label={t('detail.tabs.relations')} />
      </Tabs>

      {activeTab === 'overview' ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 720px) 296px' },
            gap: { xs: 4, lg: 6.5 },
            alignItems: 'start',
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <ArticleSection title={t('detail.sections.basics')} icon={<EditIcon />}>
              <CampaignerSurface sx={{ overflow: 'hidden' }}>
                <CampaignerFieldRow label={t('detail.fields.name')}>
                  <TextField
                    fullWidth
                    required
                    variant="standard"
                    value={form.name}
                    onChange={(event) => handleChange('name', event.target.value)}
                    placeholder={t('detail.placeholders.name')}
                    inputProps={{ 'aria-label': t('detail.fields.name') }}
                  />
                </CampaignerFieldRow>
                <CampaignerFieldRow label={t('detail.fields.title')}>
                  <TextField
                    fullWidth
                    variant="standard"
                    value={form.title}
                    onChange={(event) => handleChange('title', event.target.value)}
                    placeholder={t('detail.placeholders.titleExample')}
                    inputProps={{ 'aria-label': t('detail.fields.title') }}
                  />
                </CampaignerFieldRow>
                <CampaignerFieldRow label={t('detail.fields.bio')} sx={{ alignItems: 'start' }}>
                  <TextField
                    fullWidth
                    variant="standard"
                    value={form.bio}
                    onChange={(event) => handleChange('bio', event.target.value)}
                    multiline
                    minRows={2}
                    placeholder={t('detail.placeholders.bio')}
                    inputProps={{ 'aria-label': t('detail.fields.bio') }}
                  />
                </CampaignerFieldRow>
              </CampaignerSurface>
            </ArticleSection>

            <ArticleSection title={t('detail.sections.world')} icon={<GroupsIcon />}>
              <CampaignerSurface sx={{ overflow: 'hidden' }}>
                <CampaignerFieldRow label={t('detail.fields.state')}>
                  <Select
                    fullWidth
                    variant="standard"
                    value={form.stateId}
                    onChange={(event) => setForm((prev) => ({ ...prev, stateId: event.target.value }))}
                    inputProps={{ 'aria-label': t('detail.fields.state') }}
                  >
                    <MenuItem value="">{t('detail.stateNotSpecified')}</MenuItem>
                    {stateOptions.map((item) => (
                      <MenuItem key={item.id} value={String(item.id)}>{item.name}</MenuItem>
                    ))}
                  </Select>
                </CampaignerFieldRow>
                <CampaignerFieldRow label={t('detail.fields.factions')}>
                  <Autocomplete
                    multiple
                    options={factionOptions}
                    getOptionLabel={(option) => option.name}
                    value={factionOptions.filter((option) => form.factionIds.includes(option.id))}
                    onChange={(_, value) => setForm((prev) => ({ ...prev, factionIds: value.map((item) => item.id) }))}
                    renderInput={(params) => (
                      <TextField {...params} variant="standard" placeholder={t('detail.placeholders.factions')} />
                    )}
                    disableCloseOnSelect
                  />
                </CampaignerFieldRow>
                <CampaignerFieldRow label={t('detail.summary.tagsLabel')}>
                  <TagAutocompleteField
                    options={allTagNames}
                    value={form.tagsStr}
                    pendingInput={tagsInput}
                    onValueChange={(value) => handleChange('tagsStr', value)}
                    onPendingInputChange={setTagsInput}
                    label={t('detail.summary.tagsLabel')}
                    placeholder={t('detail.placeholders.tags')}
                    noOptionsText={t('detail.placeholders.tagNewOption')}
                  />
                </CampaignerFieldRow>
              </CampaignerSurface>
            </ArticleSection>

            <ArticleSection title={t('detail.sections.appearance')} icon={<FaceIcon />} defaultOpen={isNew || !!form.appearance}>
              <CampaignerSurface sx={{ overflow: 'hidden' }}>
                <CampaignerFieldRow label={t('detail.fields.appearance')} sx={{ alignItems: 'start' }}>
                  <TextField
                    fullWidth
                    variant="standard"
                    value={form.appearance}
                    onChange={(event) => handleChange('appearance', event.target.value)}
                    multiline
                    minRows={4}
                    placeholder={t('detail.placeholders.appearance')}
                    inputProps={{ 'aria-label': t('detail.fields.appearance') }}
                  />
                </CampaignerFieldRow>
              </CampaignerSurface>
            </ArticleSection>

            <ArticleSection title={t('detail.sections.historyNotes')} icon={<AutoStoriesIcon />} defaultOpen={isNew || !!form.backstory || !!form.notes}>
              <CampaignerSurface sx={{ overflow: 'hidden' }}>
                <CampaignerFieldRow label={t('detail.fields.backstory')} sx={{ alignItems: 'start' }}>
                  <TextField
                    fullWidth
                    variant="standard"
                    value={form.backstory}
                    onChange={(event) => handleChange('backstory', event.target.value)}
                    multiline
                    minRows={5}
                    placeholder={t('detail.placeholders.backstory')}
                    inputProps={{ 'aria-label': t('detail.fields.backstory') }}
                  />
                </CampaignerFieldRow>
                <CampaignerFieldRow label={t('detail.fields.notes')} sx={{ alignItems: 'start' }}>
                  <TextField
                    fullWidth
                    variant="standard"
                    value={form.notes}
                    onChange={(event) => handleChange('notes', event.target.value)}
                    multiline
                    minRows={3}
                    placeholder={t('detail.placeholders.notes')}
                    inputProps={{ 'aria-label': t('detail.fields.notes') }}
                  />
                </CampaignerFieldRow>
              </CampaignerSurface>
            </ArticleSection>
          </Box>

          <Box sx={{ position: { lg: 'sticky' }, top: { lg: 82 }, minWidth: 0 }}>
            <CampaignerSurface
              sx={{
                height: 300,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderStyle: currentCharacter?.imagePath ? 'solid' : 'dashed',
                position: 'relative',
              }}
            >
              {currentCharacter?.imagePath ? (
                <AssetAvatar
                  assetPath={currentCharacter.imagePath}
                  sx={{ width: '100%', height: '100%', borderRadius: 0 }}
                  variant="rounded"
                />
              ) : (
                <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                  <PersonIcon sx={{ fontSize: 42, opacity: 0.45 }} />
                  <Typography sx={{ fontSize: '0.75rem', pt: 1 }}>{t('detail.summary.portrait')}</Typography>
                </Box>
              )}
            </CampaignerSurface>

            {!isNew ? (
              <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} fullWidth size="small" sx={{ mt: 1.25 }}>
                {t('detail.summary.uploadPhoto')}
                <input type="file" hidden accept="image/jpeg,image/png,image/svg+xml,image/webp" onChange={handleImageUpload} />
              </Button>
            ) : null}

            <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', pt: 3.25, pb: 1.5 }}>
              {t('detail.summary.title')}
            </Typography>
            <Box sx={{ display: 'grid', gap: 1.25 }}>
              {form.title ? <InfoRow label={t('detail.summary.titleLabel')} value={form.title} /> : null}
              <InfoRow
                label={t('detail.fields.state')}
                value={stateOptions.find((item) => String(item.id) === form.stateId)?.name || t('detail.stateNotSpecified')}
              />
              <InfoRow
                label={t('detail.fields.factions')}
                value={form.factionIds.length ? t('detail.summary.factionCount', { count: form.factionIds.length }) : t('detail.stateNotSpecified')}
              />
              {!isNew ? (
                <InfoRow label={t('detail.sections.relationships')} value={String(allRelsForDisplay.length)} />
              ) : null}
            </Box>

            {previewTagsStr.trim() ? (
              <Box sx={{ pt: 2 }}>
                <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', pb: 1 }}>
                  {t('detail.summary.tagsLabel')}
                </Typography>
                <Box display="flex" gap={0.75} flexWrap="wrap">
                  {previewTagsStr.split(',').map((value, index) => {
                    const label = value.trim();
                    return label ? <Chip key={`${label}-${index}`} label={label} size="small" /> : null;
                  })}
                </Box>
              </Box>
            ) : null}
          </Box>
        </Box>
      ) : null}

      {activeTab === 'traits' ? (
        <CampaignerSurface sx={{ p: { xs: 2, md: 3 } }}>
          <CharacterTraitsTab projectId={pid} characterId={isNew ? null : cid} />
        </CampaignerSurface>
      ) : null}

      {activeTab === 'relations' ? (
        <Box sx={{ maxWidth: 820 }}>
          {isNew ? (
            <EmptyState
              icon={<GroupsIcon />}
              title={t('detail.relationships.notSavedTitle')}
              description={t('detail.relationships.notSavedDescription')}
            />
          ) : (
            <ArticleSection
              title={t('detail.sections.relationships')}
              icon={<GroupsIcon />}
              badge={allRelsForDisplay.length}
              action={
                <DndButton variant="outlined" startIcon={<AddIcon />} size="small" onClick={() => setRelDialogOpen(true)}>
                  {t('common:add')}
                </DndButton>
              }
            >
              {allRelsForDisplay.length === 0 ? (
                <EmptyState
                  icon={<GroupsIcon />}
                  title={t('detail.relationships.emptyTitle')}
                  description={t('detail.relationships.emptyDescription')}
                  actionLabel={t('detail.relationships.addLink')}
                  onAction={() => setRelDialogOpen(true)}
                />
              ) : (
                <CampaignerSurface sx={{ overflow: 'hidden' }}>
                  <List disablePadding>
                    {allRelsForDisplay.map((rel: any, index) => {
                      const relColor = getRelationshipColor(rel.relationshipType, theme);
                      return (
                        <ListItem
                          key={rel.id}
                          secondaryAction={
                            <IconButton
                              size="small"
                              aria-label={t('detail.relationships.remove')}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDeleteRelationship(rel.id);
                              }}
                            >
                              <DeleteIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                            </IconButton>
                          }
                          onClick={() => navigate(routes.characterDetail(pid, rel.otherId))}
                          sx={{
                            py: 1.5,
                            px: 2,
                            cursor: 'pointer',
                            borderTop: index ? `1px solid ${theme.campaigner.surface.border}` : 0,
                            '&:hover': { backgroundColor: alpha(relColor, 0.06) },
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                bgcolor: alpha(relColor, 0.12),
                                color: relColor,
                                border: `1px solid ${alpha(relColor, 0.25)}`,
                                width: 40,
                                height: 40,
                              }}
                            >
                              <PersonIcon fontSize="small" />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                                  {rel.isOutgoing ? '→' : '←'}
                                </Typography>
                                <Typography variant="h6" sx={{ fontSize: '1.05rem' }}>{rel.otherName}</Typography>
                                <Chip
                                  label={getRelationshipLabel(rel.relationshipType)}
                                  size="small"
                                  sx={{
                                    ml: { sm: 'auto' },
                                    backgroundColor: alpha(relColor, 0.08),
                                    color: relColor,
                                    borderColor: alpha(relColor, 0.22),
                                    fontSize: '0.68rem',
                                  }}
                                />
                              </Box>
                            }
                            secondary={
                              rel.description ? (
                                <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                                  {rel.description}
                                </Typography>
                              ) : null
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </CampaignerSurface>
              )}
            </ArticleSection>
          )}
        </Box>
      ) : null}

      {/* Relationship Dialog */}
      <Dialog open={relDialogOpen} onClose={() => setRelDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: theme.palette.background.paper, backgroundImage: 'none' } }}>
        <DialogTitle>
          <Typography variant="overline" sx={{ color: 'primary.main', display: 'block', pb: 0.75 }}>
            {t('detail.relationships.dialogEyebrow')}
          </Typography>
          {t('detail.relationships.dialogTitle')}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>{t('detail.relationships.withWhom')}</InputLabel>
            <Select value={relForm.targetId} label={t('detail.relationships.withWhom')} onChange={e => setRelForm(prev => ({ ...prev, targetId: e.target.value }))}>
              {allCharacters.map((ch: any) => (
                <MenuItem key={ch.id} value={String(ch.id)}>{ch.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>{t('detail.relationships.type')}</InputLabel>
            <Select<RelationshipType> value={relForm.type} label={t('detail.relationships.type')} onChange={handleRelationshipTypeChange}>
              {RELATIONSHIP_TYPE_KEYS.map((rt) => (
                <MenuItem key={rt} value={rt}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: getRelationshipColor(rt, theme) }} />
                    {t(`relationshipTypes.${rt}`)}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField fullWidth label={t('detail.fields.relationshipDescription')} value={relForm.description}
            onChange={e => setRelForm(prev => ({ ...prev, description: e.target.value }))}
            margin="normal" multiline rows={2} placeholder={t('detail.placeholders.relationship')} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRelDialogOpen(false)} color="inherit">{t('common:cancel')}</Button>
          <DndButton variant="contained" onClick={handleAddRelationship} disabled={!relForm.targetId}>{t('detail.relationships.addButton')}</DndButton>
        </DialogActions>
      </Dialog>
      <BranchEntityMissingDialog
        open={branchMissingDialogOpen}
        entityName={t('detail.fallbackName').toLowerCase()}
        onClose={closeMissingBranchEntity}
      />
    </CampaignerPage>
  );
};
