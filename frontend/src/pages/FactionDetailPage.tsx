import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, TextField, Button,
  Avatar, IconButton, Chip,
  Select, MenuItem, FormControl, InputLabel,
  List, ListItem, ListItemText, ListItemAvatar,
  Grid, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  alpha, useTheme,
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
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import { useParams, useNavigate } from 'react-router-dom';
import { factionsApi } from '@/api/factions';
import { useUIStore } from '@/store/useUIStore';
import { useFactionStore } from '@/store/useFactionStore';
import { useCharacterStore } from '@/store/useCharacterStore';
import { useTagStore } from '@/store/useTagStore';
import { DndButton } from '@/components/ui/DndButton';
import { TagAutocompleteField } from '@/components/forms/TagAutocompleteField';
import { CollapsibleSection as Section } from '@/components/detail/CollapsibleSection';
import { FactionRankDialog, FactionMemberDialog, FactionRelationDialog } from '@/pages/faction/FactionDialogs';
import { FactionAmbitionsTab } from '@/pages/faction/FactionAmbitionsTab';
import { EntityHeroLayout } from '@/components/ui/EntityHeroLayout';
import { EntityTabs } from '@/components/ui/EntityTabs';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  FACTION_TYPE_LABELS, FACTION_TYPE_ICONS,
  FACTION_STATUSES, FACTION_STATUS_LABELS, FACTION_STATUS_ICONS,
  STATE_TYPES, STATE_TYPE_LABELS,
  FACTION_RELATION_LABELS, FACTION_RELATION_COLORS,
  POLICY_TYPES,
  POLICY_STATUSES,
} from '@campaigner/shared';
import type { FactionRank, FactionMember, FactionAsset, FactionPolicy, PolicyType, PolicyStatus } from '@campaigner/shared';
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
  name: '', type: 'faction', customType: '', stateType: '', customStateType: '',
  motto: '', description: '', history: '', goals: '',
  headquarters: '', territory: '', status: 'active',
  color: '#4e8a6e', secondaryColor: '#2a2a4a', foundedDate: '', disbandedDate: '',
  parentFactionId: '', tagsStr: '',
};

const POLICY_TYPE_LABELS: Record<PolicyType, string> = {
  ambition: 'Амбиция',
  policy: 'Политика',
};
const POLICY_STATUS_LABELS: Record<PolicyStatus, string> = {
  planned: 'План',
  active: 'Активна',
  archived: 'Архив',
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

interface FactionDetailPageProps {
  entityType?: 'state' | 'faction';
}

export const FactionDetailPage: React.FC<FactionDetailPageProps> = ({ entityType = 'faction' }) => {
  const { projectId, factionId } = useParams<{ projectId: string; factionId: string }>();
  const pid = parseInt(projectId!);
  const isNew = !factionId || factionId === 'new';
  const fid = factionId && !isNew ? parseInt(factionId, 10) : 0;
  const navigate = useNavigate();
  const theme = useTheme();
  const listBasePath = entityType === 'state' ? 'states' : 'factions';

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
    createAsset, updateAsset, deleteAsset, reorderAssets, bootstrapDefaultAssets,
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
    reorderAssets: state.reorderAssets,
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
  const [activeTab, setActiveTab] = useState('overview');

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
  const [isReordering, setIsReordering] = useState(false);

  const [factionPolicies, setFactionPolicies] = useState<FactionPolicy[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<FactionPolicy | null>(null);
  const [policyForm, setPolicyForm] = useState({
    title: '',
    type: 'policy' as PolicyType,
    status: 'active' as PolicyStatus,
    description: '',
  });
  const [policyTitleSearch, setPolicyTitleSearch] = useState('');
  const [policyTypeFilter, setPolicyTypeFilter] = useState<'all' | PolicyType>('all');
  const [policyStatusFilter, setPolicyStatusFilter] = useState<'all' | PolicyStatus>('all');
  const resolvedEntityType: 'state' | 'faction' =
    isNew ? entityType : currentFaction?.type === 'state' ? 'state' : 'faction';
  const entityLabel = resolvedEntityType === 'state' ? 'государство' : 'фракция';
  const entityLabelCapitalized = resolvedEntityType === 'state' ? 'Государство' : 'Фракция';

  // ==================== Load ====================

  useEffect(() => {
    fetchTags(pid).catch(() => {});
    fetchCharacters(pid, { limit: 500 }).catch(() => {});
    fetchFactions(pid, { limit: 500 }).catch(() => {});
    fetchRelations(pid).catch(() => {});
  }, [pid]);

  useEffect(() => {
    if (isNew) {
      setForm({ ...EMPTY_FORM, type: entityType });
      setCurrentFaction(null);
      setTagsInput('');
      return;
    }
    fetchFaction(parseInt(factionId!)).catch(() => showSnackbar('Ошибка загрузки', 'error'));
  }, [entityType, factionId, isNew]);

  useEffect(() => {
    if (isNew || !fid) {
      setFactionPolicies([]);
      return;
    }
    let cancelled = false;
    setPoliciesLoading(true);
    factionsApi
      .getPolicies(fid)
      .then((res) => {
        if (!cancelled) setFactionPolicies(res.data.data || []);
      })
      .catch(() => {
        if (!cancelled) showSnackbar('Не удалось загрузить политики', 'error');
      })
      .finally(() => {
        if (!cancelled) setPoliciesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fid, isNew]);

  useEffect(() => {
    if (isNew || !currentFaction || currentFaction.id !== parseInt(factionId!)) return;
    setForm({
      name: currentFaction.name || '', type: currentFaction.type || 'faction',
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
  const relationFactions = useMemo(() => factions.filter((f) => f.id !== fid), [factions, fid]);
  const parentFactions = useMemo(
    () => relationFactions.filter((f) => f.type === resolvedEntityType),
    [relationFactions, resolvedEntityType]
  );
  const allCharacters = useMemo(() => characters || [], [characters]);
  const currentRanks: FactionRank[] = currentFaction?.ranks || [];
  const currentMembers: FactionMember[] = currentFaction?.members || [];
  const currentAssets: FactionAsset[] = currentFaction?.assets || [];
  const sortedAssets = useMemo(
    () => [...currentAssets].sort((a, b) => (a.sortOrder - b.sortOrder) || (a.id - b.id)),
    [currentAssets]
  );
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
  const resolveEntityPath = (targetId: number) => {
    const target = factions.find((item) => item.id === targetId);
    const base = target?.type === 'state' ? 'states' : 'factions';
    return `/project/${pid}/${base}/${targetId}`;
  };

  const sortedFactionPolicies = useMemo(
    () => [...factionPolicies].sort((a, b) => (a.sortOrder - b.sortOrder) || (a.id - b.id)),
    [factionPolicies]
  );
  const filteredFactionPolicies = useMemo(() => {
    const q = policyTitleSearch.trim().toLowerCase();
    return sortedFactionPolicies.filter((policy) => {
      if (policyTypeFilter !== 'all' && policy.type !== policyTypeFilter) return false;
      if (policyStatusFilter !== 'all' && policy.status !== policyStatusFilter) return false;
      if (q && !policy.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [sortedFactionPolicies, policyTypeFilter, policyStatusFilter, policyTitleSearch]);

  // ==================== Actions ====================

  const handleSave = async () => {
    if (!form.name.trim()) { showSnackbar('Введите название', 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: resolvedEntityType,
        customType: '',
        stateType: resolvedEntityType === 'state' ? form.stateType : '',
        customStateType:
          resolvedEntityType === 'state' && form.stateType === 'other' ? form.customStateType.trim() : '',
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
        showSnackbar(`${entityLabelCapitalized} создано!`, 'success');
        navigate(`/project/${pid}/${listBasePath}/${created.id}`, { replace: true });
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
    showConfirmDialog(`Удалить ${entityLabel}`, `Удалить "${form.name}"?`, async () => {
      try { await deleteFaction(fid); showSnackbar('Удалена', 'success'); navigate(`/project/${pid}/${listBasePath}`); }
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

  const openPolicyDialog = (policy?: FactionPolicy) => {
    if (policy) {
      setEditingPolicy(policy);
      setPolicyForm({
        title: policy.title,
        type: policy.type,
        status: policy.status,
        description: policy.description || '',
      });
    } else {
      setEditingPolicy(null);
      setPolicyForm({ title: '', type: 'policy', status: 'active', description: '' });
    }
    setPolicyDialogOpen(true);
  };

  const handleSavePolicy = async () => {
    if (!policyForm.title.trim() || !fid) return;
    try {
      if (editingPolicy) {
        await factionsApi.updatePolicy(fid, editingPolicy.id, {
          title: policyForm.title.trim(),
          type: policyForm.type,
          status: policyForm.status,
          description: policyForm.description,
        });
        showSnackbar('Политика обновлена', 'success');
      } else {
        await factionsApi.createPolicy(fid, {
          title: policyForm.title.trim(),
          type: policyForm.type,
          status: policyForm.status,
          description: policyForm.description,
          sortOrder: factionPolicies.length,
        });
        showSnackbar('Политика добавлена', 'success');
      }
      setPolicyDialogOpen(false);
      const res = await factionsApi.getPolicies(fid);
      setFactionPolicies(res.data.data || []);
    } catch (err: unknown) {
      showSnackbar(err instanceof Error ? err.message : 'Ошибка', 'error');
    }
  };

  const handleDeletePolicy = (policy: FactionPolicy) => {
    showConfirmDialog('Удалить', `Удалить «${policy.title}»?`, async () => {
      try {
        await factionsApi.deletePolicy(fid, policy.id);
        showSnackbar('Удалено', 'success');
        const res = await factionsApi.getPolicies(fid);
        setFactionPolicies(res.data.data || []);
      } catch {
        showSnackbar('Ошибка', 'error');
      }
    });
  };
  const handleResetPolicyFilters = () => {
    setPolicyTitleSearch('');
    setPolicyTypeFilter('all');
    setPolicyStatusFilter('all');
  };

  const handleMoveAsset = async (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= sortedAssets.length) return;
    const orderedIds = sortedAssets.map((a) => a.id);
    const t = orderedIds[index];
    orderedIds[index] = orderedIds[target];
    orderedIds[target] = t;
    setIsReordering(true);
    try {
      await reorderAssets(fid, { orderedIds });
      showSnackbar('Порядок активов обновлён', 'success');
    } catch (err: any) {
      showSnackbar(err.message || 'Ошибка', 'error');
    } finally {
      setIsReordering(false);
    }
  };

  if (loading && !isNew && !currentFaction) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><Typography sx={{ color: 'text.secondary' }}>Загрузка...</Typography></Box>;
  }
  return (
    <Box>
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton onClick={() => navigate(`/project/${pid}/${listBasePath}`)} sx={{ mr: 1 }}><ArrowBackIcon /></IconButton>
        <Typography variant="body2" color="text.secondary">
          {resolvedEntityType === 'state' ? 'К списку государств' : 'К списку фракций'}
        </Typography>
      </Box>

      <EntityHeroLayout
        bannerUrl={currentFaction?.bannerPath}
        avatarNode={
          currentFaction?.imagePath ? (
            <Avatar src={currentFaction.imagePath} sx={{ width: 120, height: 120, borderRadius: 3 }} variant="rounded" />
          ) : (
            <Avatar sx={{ width: 120, height: 120, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, fontSize: '3rem' }} variant="rounded">
              {FACTION_TYPE_ICONS[form.type] || '🏴'}
            </Avatar>
          )
        }
        title={isNew ? `Нов${resolvedEntityType === 'state' ? 'ое государство' : 'ая фракция'}` : form.name || entityLabelCapitalized}
        subtitle={form.motto ? `«${form.motto}»` : undefined}
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
          { value: 'structure', label: 'Структура', icon: <PeopleIcon fontSize="small" /> },
          { value: 'ambitions', label: 'Амбиции', icon: <TrackChangesIcon fontSize="small" /> },
          { value: 'politics', label: 'Политика', icon: <TrackChangesIcon fontSize="small" /> },
          { value: 'assets', label: 'Активы', icon: <StarIcon fontSize="small" /> },
        ]}
      />

      {activeTab === 'overview' && (
        <Box display="flex" gap={3} sx={{ flexDirection: { xs: 'column', md: 'row' } }}>
          {/* LEFT SIDEBAR */}
          <Box sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0 }}>
            <GlassCard sx={{ p: 3, position: 'sticky', top: 80 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Сводка</Typography>
              
              {!isNew && (
                <Box display="flex" gap={1} mb={3}>
                  <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} fullWidth size="small" sx={{ fontSize: '0.75rem', borderColor: alpha(theme.palette.divider, 0.5) }}>
                    Герб<input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                  </Button>
                  <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} fullWidth size="small" sx={{ fontSize: '0.75rem', borderColor: alpha(theme.palette.divider, 0.5) }}>
                    Фон<input type="file" hidden accept="image/*" onChange={handleBannerUpload} />
                  </Button>
                </Box>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <InfoRow
                  label="Тип"
                  value={`${FACTION_TYPE_ICONS[resolvedEntityType] || ''} ${FACTION_TYPE_LABELS[resolvedEntityType] || resolvedEntityType}`}
                />
                {resolvedEntityType === 'state' && form.stateType && (
                  <InfoRow label="Строй" value={STATE_TYPE_LABELS[form.stateType] || form.customStateType || form.stateType} />
                )}
                {form.status && <InfoRow label="Статус" value={`${FACTION_STATUS_ICONS[form.status] || ''} ${FACTION_STATUS_LABELS[form.status] || form.status}`} />}
                {form.headquarters && <InfoRow label="Столица" value={form.headquarters} />}
                {form.territory && <InfoRow label="Территория" value={form.territory} />}
                {form.foundedDate && <InfoRow label="Основана" value={form.foundedDate} />}
                {form.disbandedDate && <InfoRow label="Распущена" value={form.disbandedDate} />}
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
            <Section title="Основная информация" icon={<EditIcon />} defaultOpen={true}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Название *" value={form.name} onChange={e => handleChange('name', e.target.value)} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Девиз" value={form.motto} onChange={e => handleChange('motto', e.target.value)} placeholder="напр. Зима близко" /></Grid>
                {resolvedEntityType === 'state' && (
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth><InputLabel>Государственный строй</InputLabel>
                      <Select value={form.stateType} label="Государственный строй" onChange={e => handleChange('stateType', e.target.value)}>
                        {STATE_TYPES.map(st => <MenuItem key={st} value={st}>{STATE_TYPE_LABELS[st]}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                {resolvedEntityType === 'state' && form.stateType === 'other' && (
                  <Grid item xs={12} sm={6}><TextField fullWidth label="Тип государства" value={form.customStateType} onChange={e => handleChange('customStateType', e.target.value)} /></Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth><InputLabel>Статус</InputLabel>
                    <Select value={form.status} label="Статус" onChange={e => handleChange('status', e.target.value)}>
                      {FACTION_STATUSES.map(s => <MenuItem key={s} value={s}>{FACTION_STATUS_ICONS[s]} {FACTION_STATUS_LABELS[s]}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={resolvedEntityType === 'state' ? 'Столица' : 'Штаб-квартира'}
                    value={form.headquarters}
                    onChange={e => handleChange('headquarters', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Территория" value={form.territory} onChange={e => handleChange('territory', e.target.value)} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Дата основания" value={form.foundedDate} onChange={e => handleChange('foundedDate', e.target.value)} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Дата роспуска" value={form.disbandedDate} onChange={e => handleChange('disbandedDate', e.target.value)} /></Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth><InputLabel>{resolvedEntityType === 'state' ? 'Вышестоящее государство' : 'Родительская фракция'}</InputLabel>
                    <Select
                      value={form.parentFactionId}
                      label={resolvedEntityType === 'state' ? 'Вышестоящее государство' : 'Родительская фракция'}
                      onChange={e => handleChange('parentFactionId', e.target.value)}
                    >
                      <MenuItem value="">Нет</MenuItem>
                      {parentFactions.map(f => <MenuItem key={f.id} value={String(f.id)}>{FACTION_TYPE_ICONS[f.type] || '🏴'} {f.name}</MenuItem>)}
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

            <Section title="Описание и история" icon={<EditIcon />} defaultOpen={!isNew}>
              <Grid container spacing={2}>
                <Grid item xs={12}><TextField fullWidth label="Описание" value={form.description} onChange={e => handleChange('description', e.target.value)} multiline rows={4} placeholder="Общее описание фракции..." /></Grid>
                <Grid item xs={12}><TextField fullWidth label="История" value={form.history} onChange={e => handleChange('history', e.target.value)} multiline rows={6} placeholder="Как была основана, ключевые события..." /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Цели и мотивация" value={form.goals} onChange={e => handleChange('goals', e.target.value)} multiline rows={4} placeholder="Чего добивается фракция..." /></Grid>
              </Grid>
            </Section>
          </Box>
        </Box>
      )}

      {activeTab === 'structure' && (
        <Box>
          {/* SECTION: Ranks */}
          {!isNew && (
            <Section title="Ранги" icon={<StarIcon />} badge={currentRanks.length} defaultOpen={true}
              action={<DndButton variant="outlined" startIcon={<AddIcon />} size="small" onClick={() => openRankDialog()} sx={{ borderColor: alpha(theme.palette.primary.main, 0.5) }}>Добавить</DndButton>}>
              {currentRanks.length === 0 ? (
                <EmptyState icon={<StarIcon />} title="Нет рангов" description="Создайте иерархию рангов" actionLabel="Добавить ранг" onAction={() => openRankDialog()} />
              ) : (
                <List disablePadding>
                  {currentRanks.map(rank => (
                    <ListItem key={rank.id}
                      secondaryAction={
                        <Box display="flex" gap={0.5}>
                          <IconButton size="small" onClick={() => openRankDialog(rank)}><EditIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} /></IconButton>
                          <IconButton size="small" onClick={() => handleDeleteRank(rank.id, rank.name)}><DeleteIcon fontSize="small" sx={{ color: theme.palette.error.main }} /></IconButton>
                        </Box>
                      }
                      sx={{ backgroundColor: rank.color ? alpha(rank.color, 0.1) : alpha(theme.palette.primary.main, 0.05), borderRadius: 1.5, mb: 1, border: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: rank.color || alpha(theme.palette.primary.main, 0.2), color: rank.color || theme.palette.primary.main, width: 40, height: 40, fontSize: '1.2rem' }}>{rank.icon || rank.level}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Box display="flex" alignItems="center" gap={1}>
                          <Typography sx={{ color: 'text.primary', fontWeight: 600 }}>{rank.name}</Typography>
                          <Chip label={`Ур. ${rank.level}`} size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
                          <Chip label={`${currentMembers.filter(m => m.rankId === rank.id).length} чел.`} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                        </Box>}
                        secondary={rank.description ? <Typography variant="caption" sx={{ color: 'text.secondary' }}>{rank.description}</Typography> : null}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Section>
          )}

          {/* SECTION: Members */}
          {!isNew && (
            <Section title="Члены" icon={<PeopleIcon />} badge={currentMembers.length} defaultOpen={true}
              action={<DndButton variant="outlined" startIcon={<AddIcon />} size="small" onClick={openMemberDialog} sx={{ borderColor: alpha(theme.palette.primary.main, 0.5) }}>Добавить</DndButton>}>
              {currentMembers.length === 0 ? (
                <EmptyState icon={<PeopleIcon />} title="Нет членов" description="Добавьте персонажей в фракцию" actionLabel="Добавить персонажа" onAction={openMemberDialog} />
              ) : (
                <List disablePadding>
                  {currentMembers.map(member => (
                    <ListItem key={member.id}
                      secondaryAction={
                        <IconButton size="small" onClick={e => { e.stopPropagation(); handleRemoveMember(member.id, member.characterName || ''); }}>
                          <DeleteIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                        </IconButton>
                      }
                      onClick={() => navigate(`/project/${pid}/characters/${member.characterId}`)}
                      sx={{ backgroundColor: alpha(theme.palette.background.paper, 0.5), borderRadius: 1.5, mb: 1, cursor: 'pointer', border: `1px solid ${alpha(theme.palette.divider, 0.5)}`, '&:hover': { backgroundColor: alpha(theme.palette.action.hover, 0.1) } }}>
                      <ListItemAvatar>
                        <Avatar src={member.characterImagePath || undefined} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}><PersonIcon /></Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Box display="flex" alignItems="center" gap={1}>
                          <Typography sx={{ color: 'text.primary', fontWeight: 600 }}>{member.characterName || `ID: ${member.characterId}`}</Typography>
                          {member.rankName && <Chip label={member.rankName} size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem' }} />}
                          {member.role && <Chip label={member.role} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />}
                          {!member.isActive && <Chip label="Бывший" size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />}
                        </Box>}
                        secondary={member.notes ? <Typography variant="caption" sx={{ color: 'text.secondary' }}>{member.notes}</Typography> : null}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Section>
          )}
        </Box>
      )}

      {activeTab === 'ambitions' && (
        <FactionAmbitionsTab projectId={pid} factionId={isNew ? null : fid} />
      )}

      {activeTab === 'politics' && (
        <Box>
          {/* SECTION: Faction policies */}
          {!isNew && (
            <Section
              title="Амбиции и политика"
              icon={<TrackChangesIcon />}
              badge={sortedFactionPolicies.length}
              defaultOpen={true}
              action={
                <DndButton
                  variant="outlined"
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={() => openPolicyDialog()}
                  sx={{ borderColor: alpha(theme.palette.primary.main, 0.5) }}
                >
                  Добавить
                </DndButton>
              }
            >
              {policiesLoading && sortedFactionPolicies.length === 0 ? (
                <Typography sx={{ color: 'text.secondary', py: 2 }}>Загрузка…</Typography>
              ) : sortedFactionPolicies.length === 0 ? (
                <EmptyState icon={<TrackChangesIcon />} title="Нет политик" description="Добавьте амбиции и политические линии фракции" actionLabel="Добавить политику" onAction={() => openPolicyDialog()} />
              ) : (
                <>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' },
                      gap: 1.25,
                      mb: 1.5,
                    }}
                  >
                    <TextField
                      size="small"
                      label="Поиск по названию"
                      value={policyTitleSearch}
                      onChange={(e) => setPolicyTitleSearch(e.target.value)}
                      placeholder="Введите название"
                    />
                    <FormControl size="small" fullWidth>
                      <InputLabel>Тип</InputLabel>
                      <Select
                        label="Тип"
                        value={policyTypeFilter}
                        onChange={(e) => setPolicyTypeFilter(e.target.value as 'all' | PolicyType)}
                      >
                        <MenuItem value="all">Все типы</MenuItem>
                        <MenuItem value="ambition">Амбиция</MenuItem>
                        <MenuItem value="policy">Политика</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Статус</InputLabel>
                      <Select
                        label="Статус"
                        value={policyStatusFilter}
                        onChange={(e) => setPolicyStatusFilter(e.target.value as 'all' | PolicyStatus)}
                      >
                        <MenuItem value="all">Все статусы</MenuItem>
                        <MenuItem value="planned">Запланировано</MenuItem>
                        <MenuItem value="active">Активно</MenuItem>
                        <MenuItem value="archived">В архиве</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  {filteredFactionPolicies.length === 0 ? (
                    <Box
                      sx={{
                        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                        borderRadius: 1.5,
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Typography sx={{ color: 'text.secondary' }}>Ничего не найдено</Typography>
                      <Button size="small" onClick={handleResetPolicyFilters}>
                        Сбросить фильтры
                      </Button>
                    </Box>
                  ) : (
                    <List disablePadding>
                      {filteredFactionPolicies.map((p) => (
                        <ListItem
                          key={p.id}
                          secondaryAction={
                            <Box display="flex" gap={0.5}>
                              <IconButton size="small" onClick={() => openPolicyDialog(p)}>
                                <EditIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleDeletePolicy(p)}>
                                <DeleteIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                              </IconButton>
                            </Box>
                          }
                          sx={{
                            backgroundColor: alpha(theme.palette.background.paper, 0.5),
                            borderRadius: 1.5,
                            mb: 1,
                            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                            alignItems: 'flex-start',
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                <Typography sx={{ color: 'text.primary', fontWeight: 600 }}>{p.title}</Typography>
                                <Chip
                                  label={POLICY_TYPE_LABELS[p.type]}
                                  size="small"
                                  sx={{ height: 20, fontSize: '0.65rem' }}
                                />
                                <Chip
                                  label={POLICY_STATUS_LABELS[p.status]}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.65rem' }}
                                />
                              </Box>
                            }
                            secondary={
                              p.description ? (
                                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.75, whiteSpace: 'pre-wrap' }}>
                                  {p.description}
                                </Typography>
                              ) : null
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </>
              )}
            </Section>
          )}

          {/* SECTION: Relations */}
          {!isNew && (
            <Section title="Связи" icon={<LinkIcon />} badge={relationsForDisplay.length} defaultOpen={true}
              action={<DndButton variant="outlined" startIcon={<AddIcon />} size="small" onClick={openRelationDialog} sx={{ borderColor: alpha(theme.palette.primary.main, 0.5) }}>Добавить</DndButton>}>
              {relationsForDisplay.length === 0 ? (
                <EmptyState icon={<LinkIcon />} title="Нет связей" description="Установите отношения с другими фракциями" actionLabel="Добавить связь" onAction={openRelationDialog} />
              ) : (
                <List disablePadding>
                  {relationsForDisplay.map(rel => (
                    <ListItem key={rel.id}
                      secondaryAction={
                        <IconButton size="small" onClick={e => { e.stopPropagation(); handleDeleteRelation(rel.id); }}>
                          <DeleteIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                        </IconButton>
                      }
                      onClick={() => navigate(resolveEntityPath(rel.otherId))}
                      sx={{
                        backgroundColor: `${FACTION_RELATION_COLORS[rel.relationType] || alpha(theme.palette.primary.main, 0.2)}20`,
                        borderRadius: 1.5, mb: 1, cursor: 'pointer', border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                        '&:hover': { backgroundColor: alpha(theme.palette.action.hover, 0.1) },
                      }}>
                      <ListItemText
                        primary={<Box display="flex" alignItems="center" gap={1}>
                          <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{rel.isOutgoing ? '→' : '←'}</Typography>
                          <Chip label={rel.customLabel || FACTION_RELATION_LABELS[rel.relationType] || rel.relationType} size="small"
                            sx={{ backgroundColor: FACTION_RELATION_COLORS[rel.relationType] || alpha(theme.palette.primary.main, 0.3), color: '#fff', fontSize: '0.7rem', fontWeight: 600 }} />
                          <Typography sx={{ color: 'text.primary', fontWeight: 600 }}>{rel.otherName}</Typography>
                        </Box>}
                        secondary={rel.description ? <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>{rel.description}</Typography> : null}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Section>
          )}
        </Box>
      )}

      {activeTab === 'assets' && (
        <Box>
          {/* SECTION: Assets */}
          {!isNew && (
            <Section title="Активы" icon={<StarIcon />} badge={currentAssets.length} defaultOpen={true}
              action={
                <Box display="flex" gap={1}>
                  <DndButton variant="outlined" size="small" onClick={handleBootstrapDefaultAssets} sx={{ borderColor: alpha(theme.palette.primary.main, 0.5) }}>
                    Добавить базовые активы
                  </DndButton>
                  <DndButton variant="outlined" startIcon={<AddIcon />} size="small" onClick={() => openAssetDialog()} sx={{ borderColor: alpha(theme.palette.primary.main, 0.5) }}>
                    Добавить
                  </DndButton>
                </Box>
              }>
              {currentAssets.length === 0 ? (
                <EmptyState icon={<StarIcon />} title="Нет активов" description="Добавьте активы фракции (например, Казна, Земли)" actionLabel="Добавить актив" onAction={() => openAssetDialog()} />
              ) : (
                <List disablePadding>
                  {sortedAssets.map((asset, index) => (
                    <ListItem key={asset.id}
                      secondaryAction={
                        <Box display="flex" gap={0.5} alignItems="center">
                          <Tooltip title="Вверх">
                            <span>
                              <IconButton
                                size="small"
                                disabled={isReordering || index === 0}
                                onClick={() => handleMoveAsset(index, 'up')}
                              >
                                <KeyboardArrowUpIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Вниз">
                            <span>
                              <IconButton
                                size="small"
                                disabled={isReordering || index === sortedAssets.length - 1}
                                onClick={() => handleMoveAsset(index, 'down')}
                              >
                                <KeyboardArrowDownIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <IconButton size="small" onClick={() => openAssetDialog(asset)} disabled={isReordering}><EditIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} /></IconButton>
                          <IconButton size="small" onClick={() => handleDeleteAsset(asset)} disabled={isReordering}><DeleteIcon fontSize="small" sx={{ color: theme.palette.error.main }} /></IconButton>
                        </Box>
                      }
                      sx={{ backgroundColor: alpha(theme.palette.background.paper, 0.5), borderRadius: 1.5, mb: 1, border: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                      <ListItemText
                        primary={<Typography sx={{ color: 'text.primary', fontWeight: 600 }}>{asset.name}</Typography>}
                        secondary={<Typography variant="body2" sx={{ color: 'text.secondary' }}>{asset.value || '—'}</Typography>}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Section>
          )}
        </Box>
      )}

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
        otherFactions={relationFactions}
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

      <Dialog open={policyDialogOpen} onClose={() => setPolicyDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingPolicy ? 'Редактировать политику' : 'Новая политика'}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
          <TextField
            autoFocus
            fullWidth
            label="Название *"
            value={policyForm.title}
            onChange={(e) => setPolicyForm((prev) => ({ ...prev, title: e.target.value }))}
          />
          <FormControl fullWidth>
            <InputLabel>Тип</InputLabel>
            <Select
              label="Тип"
              value={policyForm.type}
              onChange={(e) => setPolicyForm((prev) => ({ ...prev, type: e.target.value as PolicyType }))}
            >
              {POLICY_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {POLICY_TYPE_LABELS[t]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Статус</InputLabel>
            <Select
              label="Статус"
              value={policyForm.status}
              onChange={(e) => setPolicyForm((prev) => ({ ...prev, status: e.target.value as PolicyStatus }))}
            >
              {POLICY_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {POLICY_STATUS_LABELS[s]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Описание"
            value={policyForm.description}
            onChange={(e) => setPolicyForm((prev) => ({ ...prev, description: e.target.value }))}
            multiline
            minRows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPolicyDialogOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSavePolicy} disabled={!policyForm.title.trim()}>
            {editingPolicy ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
