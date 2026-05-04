import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, TextField, Button,
  Avatar, IconButton, Chip,
  Select, MenuItem, FormControl, InputLabel,
  List, ListItem, ListItemText, ListItemAvatar,
  Grid,
  Dialog, DialogTitle, DialogContent, DialogActions,
  alpha, useTheme,
  Autocomplete,
  Link,
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
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { factionsApi } from '@/api/factions';
import { dynastiesApi } from '@/api/dynasties';
import { mapApi } from '@/api/maps';
import { charactersApi } from '@/api/characters';
import { useUIStore } from '@/store/useUIStore';
import { useBranchStore } from '@/store/useBranchStore';
import { useMapTerritoriesRefreshStore } from '@/store/useMapTerritoriesRefreshStore';
import { useFactionStore } from '@/store/useFactionStore';
import { useCharacterStore } from '@/store/useCharacterStore';
import { useTagStore } from '@/store/useTagStore';
import { DndButton } from '@/components/ui/DndButton';
import { TagAutocompleteField } from '@/components/forms/TagAutocompleteField';
import { CollapsibleSection as Section } from '@/components/detail/CollapsibleSection';
import { FactionRankDialog, FactionMemberDialog, FactionRelationDialog } from '@/pages/factions/components/FactionDialogs';
import { FactionAmbitionsTab } from '@/pages/factions/components/FactionAmbitionsTab';
import { MetricInput } from '@/pages/factions/components/MetricInput';
import { CustomMetricsEditor } from '@/pages/factions/components/CustomMetricsEditor';
import { FactionCompareDialog } from '@/pages/factions/components/FactionCompareDialog';
import { FactionPoliticalScalesSection } from '@/pages/factions/components/FactionPoliticalScalesSection';
import { EntityHeroLayout } from '@/components/ui/EntityHeroLayout';
import { EntityTabs } from '@/components/ui/EntityTabs';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  FACTION_KIND_ICONS,
  FACTION_TYPES,
  FACTION_TYPE_ICONS,
  FACTION_STATUSES, FACTION_STATUS_ICONS,
  STATE_TYPES, STATE_TYPE_ICONS,
  FACTION_RELATION_COLORS,
  POLICY_TYPES,
  POLICY_STATUSES,
  getMetricsForKind,
  FACTION_DECREE_CATEGORY_LABELS,
} from '@campaigner/shared';
import type {
  FactionRank,
  FactionMember,
  FactionPolicy,
  PolicyType,
  PolicyStatus,
  ReplaceFactionCustomMetrics,
  FactionPolicyCategory,
  MapTerritorySummary,
  Dynasty,
} from '@campaigner/shared';
import { shallow } from 'zustand/shallow';
import { routes } from '@/utils/routes';

// ==================== Types ====================

interface FactionForm {
  name: string;
  type: string;
  motto: string;
  description: string;
  history: string;
  goals: string;
  headquarters: string;
  territory: string;
  treasury: string;
  population: string;
  armySize: string;
  navySize: string;
  territoryKm2: string;
  annualIncome: string;
  annualExpenses: string;
  membersCount: string;
  influence: string;
  status: string;
  color: string;
  secondaryColor: string;
  foundedDate: string;
  disbandedDate: string;
  parentFactionId: string;
  tagsStr: string;
  rulingDynastyId: string;
  rulerCharacterId: number | null;
  rulerName: string;
  territoryIds: number[];
}

const EMPTY_FORM: FactionForm = {
  name: '', type: '',
  motto: '', description: '', history: '', goals: '',
  treasury: '', population: '', armySize: '', navySize: '', territoryKm2: '',
  annualIncome: '', annualExpenses: '', membersCount: '', influence: '',
  headquarters: '', territory: '', status: 'active',
  color: '#4e8a6e', secondaryColor: '#2a2a4a', foundedDate: '', disbandedDate: '',
  parentFactionId: '', tagsStr: '',
  rulingDynastyId: '',
  rulerCharacterId: null,
  rulerName: '',
  territoryIds: [],
};

type RulerOption =
  | { type: 'char'; id: number; name: string }
  | { type: 'create'; name: string };

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
  const { t } = useTranslation(['factions', 'common']);
  const { projectId, factionId } = useParams<{ projectId: string; factionId: string }>();
  const pid = parseInt(projectId!);
  const isNew = !factionId || factionId === 'new';
  const fid = factionId && !isNew ? parseInt(factionId, 10) : 0;
  const navigate = useNavigate();
  const theme = useTheme();
  const normalizedEntityType: 'state' | 'faction' = entityType === 'state' ? 'state' : 'faction';

  const { showSnackbar, showConfirmDialog } = useUIStore((state) => ({
    showSnackbar: state.showSnackbar,
    showConfirmDialog: state.showConfirmDialog,
  }), shallow);
  const bumpMapTerritories = useMapTerritoriesRefreshStore((s) => s.bump);
  const activeBranchId = useBranchStore((s) => s.activeBranchId);

  const {
    factions, currentFaction, relations, loading,
    fetchFactions, fetchFaction, createFaction, updateFaction, deleteFaction,
    uploadImage, uploadBanner, setTags,
    createRank, updateRank, deleteRank,
    addMember, removeMember,
    replaceCustomMetrics, compareFactions,
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
    replaceCustomMetrics: state.replaceCustomMetrics,
    compareFactions: state.compareFactions,
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

  const [customMetrics, setCustomMetrics] = useState<ReplaceFactionCustomMetrics['metrics']>([]);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);

  const [factionPolicies, setFactionPolicies] = useState<FactionPolicy[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<FactionPolicy | null>(null);
  const [policyForm, setPolicyForm] = useState({
    title: '',
    type: 'policy' as PolicyType,
    status: 'active' as PolicyStatus,
    category: 'other' as FactionPolicyCategory,
    enactedDate: '',
    description: '',
  });
  const [policyTitleSearch, setPolicyTitleSearch] = useState('');
  const [policyTypeFilter, setPolicyTypeFilter] = useState<'all' | PolicyType>('all');
  const [policyStatusFilter, setPolicyStatusFilter] = useState<'all' | PolicyStatus>('all');
  const [policyCategoryFilter, setPolicyCategoryFilter] = useState<'all' | FactionPolicyCategory>('all');
  const [dynastiesList, setDynastiesList] = useState<Dynasty[]>([]);
  const [territoryOptions, setTerritoryOptions] = useState<MapTerritorySummary[]>([]);
  const [rulerInput, setRulerInput] = useState('');
  const [creatingRuler, setCreatingRuler] = useState(false);
  /** Поля формы и тело PUT по маршруту, не по `currentFaction.kind` (иначе теряются state-only поля). */
  const resolvedEntityType: 'state' | 'faction' = normalizedEntityType;
  const isStateEntity = resolvedEntityType === 'state';

  // ==================== Load ====================

  useEffect(() => {
    fetchTags(pid).catch(() => {});
    fetchCharacters(pid, { limit: 500 }).catch(() => {});
    fetchFactions(pid, { limit: 500 }).catch(() => {});
    fetchRelations(pid).catch(() => {});
  }, [pid, activeBranchId, fetchTags, fetchCharacters, fetchFactions, fetchRelations]);

  useEffect(() => {
    if (normalizedEntityType !== 'state') return;
    let cancelled = false;

    dynastiesApi
      .getAll(pid, { limit: 500 })
      .then((res) => {
        if (cancelled) return;
        setDynastiesList(res.data.data || []);
      })
      .catch(() => {});

    mapApi
      .getTerritorySummariesForProject(pid)
      .then((res) => {
        if (cancelled) return;
        setTerritoryOptions(res.data.data || []);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [pid, normalizedEntityType, activeBranchId]);

  useEffect(() => {
    if (isNew) {
      setForm(EMPTY_FORM);
      setCurrentFaction(null);
      setTagsInput('');
      setCustomMetrics([]);
      if (normalizedEntityType === 'state') {
        setRulerInput('');
      }
      return;
    }
    fetchFaction(pid, parseInt(factionId!)).catch(() => showSnackbar(t('factions:snackbar.loadError'), 'error'));
  }, [entityType, factionId, isNew, normalizedEntityType, fetchFaction, showSnackbar, t, pid, activeBranchId]);

  useEffect(() => {
    if (isNew || !fid) {
      setFactionPolicies([]);
      return;
    }
    let cancelled = false;
    setPoliciesLoading(true);
    factionsApi
      .getPolicies(fid, pid)
      .then((res) => {
        if (!cancelled) setFactionPolicies(res.data.data || []);
      })
      .catch(() => {
        if (!cancelled) showSnackbar(t('factions:snackbar.policiesLoadError'), 'error');
      })
      .finally(() => {
        if (!cancelled) setPoliciesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fid, isNew, pid, showSnackbar, t, activeBranchId]);

  useEffect(() => {
    if (isNew || !currentFaction || currentFaction.id !== parseInt(factionId!)) return;

    const isThisState =
      resolvedEntityType === 'state' && currentFaction.id === parseInt(factionId!, 10);
    const stateFields: Pick<FactionForm, 'rulingDynastyId' | 'rulerCharacterId' | 'rulerName' | 'territoryIds'> =
      isThisState
        ? {
            rulingDynastyId:
              currentFaction.rulingDynastyId != null ? String(currentFaction.rulingDynastyId) : '',
            rulerCharacterId: currentFaction.rulerCharacterId ?? null,
            rulerName:
              currentFaction.rulerCharacterId != null
                ? (currentFaction.ruler?.name ?? '').trim() || '—'
                : '',
            territoryIds: (currentFaction.territories || []).map((t) => t.id),
          }
        : {
            rulingDynastyId: '',
            rulerCharacterId: null,
            rulerName: '',
            territoryIds: [],
          };

    setForm({
      name: currentFaction.name || '', type: currentFaction.type || '',
      motto: currentFaction.motto || '',
      description: currentFaction.description || '', history: currentFaction.history || '',
      goals: currentFaction.goals || '', headquarters: currentFaction.headquarters || '',
      treasury: currentFaction.treasury == null ? '' : String(currentFaction.treasury),
      population: currentFaction.population == null ? '' : String(currentFaction.population),
      armySize: currentFaction.armySize == null ? '' : String(currentFaction.armySize),
      navySize: currentFaction.navySize == null ? '' : String(currentFaction.navySize),
      territoryKm2: currentFaction.territoryKm2 == null ? '' : String(currentFaction.territoryKm2),
      annualIncome: currentFaction.annualIncome == null ? '' : String(currentFaction.annualIncome),
      annualExpenses: currentFaction.annualExpenses == null ? '' : String(currentFaction.annualExpenses),
      membersCount: currentFaction.membersCount == null ? '' : String(currentFaction.membersCount),
      influence: currentFaction.influence == null ? '' : String(currentFaction.influence),
      territory: currentFaction.territory || '', status: currentFaction.status || 'active',
      color: currentFaction.color || '#4e8a6e', secondaryColor: currentFaction.secondaryColor || '#2a2a4a',
      foundedDate: currentFaction.foundedDate || '', disbandedDate: currentFaction.disbandedDate || '',
      parentFactionId: currentFaction.parentFactionId ? String(currentFaction.parentFactionId) : '',
      tagsStr: (currentFaction.tags || []).map((t: any) => t.name).join(', '),
      ...stateFields,
    });
    setCustomMetrics(
      (currentFaction.customMetrics || []).map((metric, index) => ({
        id: metric.id,
        name: metric.name,
        value: metric.value,
        unit: metric.unit ?? null,
        sortOrder: metric.sortOrder ?? index,
      }))
    );
    setTagsInput('');
    if (isThisState && currentFaction.rulerCharacterId != null) {
      setRulerInput((currentFaction.ruler?.name ?? '').trim() || '—');
    } else {
      setRulerInput('');
    }
  }, [currentFaction, factionId, isNew, resolvedEntityType]);

  // ==================== Helpers ====================

  const handleChange = (field: keyof FactionForm, value: string) => setForm(prev => ({ ...prev, [field]: value }));
  const metricKeyToField = (key: string): keyof FactionForm => {
    if (key === 'army_size') return 'armySize';
    if (key === 'navy_size') return 'navySize';
    if (key === 'territory_km2') return 'territoryKm2';
    if (key === 'annual_income') return 'annualIncome';
    if (key === 'annual_expenses') return 'annualExpenses';
    if (key === 'members_count') return 'membersCount';
    return key as keyof FactionForm;
  };
  const readMetricValue = (key: string): number | null => {
    const raw = form[metricKeyToField(key)];
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  };

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

  const allTagNames = useMemo(() => tags.map(tag => tag.name), [tags]);
  const relationFactions = useMemo(() => factions.filter((f) => f.id !== fid), [factions, fid]);
  const parentFactions = useMemo(
    () => relationFactions.filter((f) => f.kind === resolvedEntityType),
    [relationFactions, resolvedEntityType]
  );
  const semanticTypeOptions = useMemo(
    () => (resolvedEntityType === 'state' ? [...STATE_TYPES] : [...FACTION_TYPES]),
    [resolvedEntityType]
  );
  const metricMeta = useMemo(() => getMetricsForKind(resolvedEntityType), [resolvedEntityType]);
  const metricMetaTranslated = useMemo(
    () =>
      metricMeta.map((m) => ({
        ...m,
        label: t(`factions:metrics.keys.${m.key}.label`),
        unit: (() => {
          const u = t(`factions:metrics.keys.${m.key}.unit`);
          return u ? u : null;
        })(),
      })),
    [metricMeta, t]
  );
  const allCharacters = useMemo(() => characters || [], [characters]);
  const rulerOptions = useMemo((): RulerOption[] => {
    const q = rulerInput.trim().toLowerCase();
    const chars = allCharacters.filter((c) => !q || c.name.toLowerCase().includes(q));
    const mapped: RulerOption[] = chars.map((c) => ({ type: 'char', id: c.id, name: c.name }));
    const exact = chars.some((c) => c.name.toLowerCase() === rulerInput.trim().toLowerCase());
    if (rulerInput.trim() && !exact) {
      mapped.push({ type: 'create', name: rulerInput.trim() });
    }
    return mapped;
  }, [allCharacters, rulerInput]);
  const rulerValue = useMemo((): RulerOption | null => {
    if (form.rulerCharacterId != null) {
      return { type: 'char', id: form.rulerCharacterId, name: form.rulerName };
    }
    return null;
  }, [form.rulerCharacterId, form.rulerName]);
  const currentRanks: FactionRank[] = currentFaction?.ranks || [];
  const currentMembers: FactionMember[] = currentFaction?.members || [];
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
    const kind = target?.kind === 'state' ? 'state' : 'faction';
    return routes.factionDetail(pid, kind, targetId);
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
      if (policyCategoryFilter !== 'all' && (policy.category ?? 'other') !== policyCategoryFilter) return false;
      if (q && !policy.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [sortedFactionPolicies, policyTypeFilter, policyStatusFilter, policyCategoryFilter, policyTitleSearch]);

  const handleTerritoriesMultiChange = useCallback(
    (newValue: MapTerritorySummary[]) => {
      const newIds = newValue.map((t) => t.id);
      setForm((prev) => {
        const added = newValue.filter((ter) => !prev.territoryIds.includes(ter.id));
        const conflicts = added.filter((ter) => ter.factionId != null && (isNew || ter.factionId !== fid));
        if (conflicts.length === 0) {
          return { ...prev, territoryIds: newIds };
        }
        const conflictTerritory = conflicts[0];
        const occupant = factions.find((f) => f.id === conflictTerritory.factionId);
        const occupantName = occupant?.name || `ID ${conflictTerritory.factionId}`;
        const selfName = prev.name.trim() || t('factions:detail.territorySelfFallback');
        showConfirmDialog(
          t('factions:detail.territoryRebindTitle'),
          t('factions:detail.territoryRebindMessage', {
            territory: conflictTerritory.name,
            occupant: occupantName,
            self: selfName,
          }),
          () => setForm((p) => ({ ...p, territoryIds: newIds }))
        );
        return prev;
      });
    },
    [isNew, fid, factions, showConfirmDialog, t]
  );

  // ==================== Actions ====================

  const handleSave = async () => {
    if (!form.name.trim()) { showSnackbar(t('factions:snackbar.nameRequired'), 'error'); return; }
    setSaving(true);
    try {
      const toNullableInt = (raw: string): number | null => {
        const trimmed = raw.trim();
        if (!trimmed) return null;
        return Number(trimmed);
      };
      const metricFieldValues = {
        treasury: toNullableInt(form.treasury),
        population: toNullableInt(form.population),
        armySize: toNullableInt(form.armySize),
        navySize: toNullableInt(form.navySize),
        territoryKm2: toNullableInt(form.territoryKm2),
        annualIncome: toNullableInt(form.annualIncome),
        annualExpenses: toNullableInt(form.annualExpenses),
        membersCount: toNullableInt(form.membersCount),
        influence: toNullableInt(form.influence),
      } as const;
      const allMetricFields = Object.keys(metricFieldValues) as Array<keyof typeof metricFieldValues>;
      const allowedMetricFields = new Set(
        getMetricsForKind(resolvedEntityType).map((metric) => metricKeyToField(metric.key))
      );
      const filteredMetricsPayload = allMetricFields.reduce<Record<string, number | null>>((acc, field) => {
        if (allowedMetricFields.has(field)) {
          acc[field] = metricFieldValues[field];
        }
        return acc;
      }, {});
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        kind: resolvedEntityType,
        type: form.type || null,
        motto: form.motto.trim(), description: form.description.trim(),
        history: form.history.trim(), goals: form.goals.trim(),
        headquarters: form.headquarters.trim(),
        ...filteredMetricsPayload,
        status: form.status, color: form.color.trim(), secondaryColor: form.secondaryColor.trim(),
        foundedDate: form.foundedDate.trim(), disbandedDate: form.disbandedDate.trim(),
        parentFactionId: form.parentFactionId ? parseInt(form.parentFactionId) : null,
      };
      if (resolvedEntityType === 'state') {
        payload.territory = '';
        payload.rulingDynastyId = form.rulingDynastyId ? parseInt(form.rulingDynastyId, 10) : null;
        payload.territoryIds = form.territoryIds;
        if (form.rulerCharacterId != null) {
          payload.rulerCharacterId = form.rulerCharacterId;
        } else {
          payload.rulerCharacterId = null;
        }
      } else {
        payload.territory = form.territory.trim();
      }
      const preparedCustomMetrics = customMetrics
        .filter((metric) => metric.name.trim())
        .map((metric, index) => ({
          name: metric.name.trim(),
          value: Number(metric.value),
          unit: metric.unit?.trim() || null,
          sortOrder: index,
        }));
      const finalTags = mergeTagValues(form.tagsStr, tagsInput);
      if (isNew) {
        const created = await createFaction({ ...payload, projectId: pid } as Parameters<typeof createFaction>[0]);
        await replaceCustomMetrics(created.id, { metrics: preparedCustomMetrics });
        if (finalTags.trim()) await saveTagsForFaction(created.id, finalTags);
        setTagsInput('');
        if (resolvedEntityType === 'state') {
          bumpMapTerritories();
          mapApi.getTerritorySummariesForProject(pid).then((res) => setTerritoryOptions(res.data.data || [])).catch(() => {});
        }
        showSnackbar(isStateEntity ? t('factions:entityCreated.state') : t('factions:entityCreated.faction'), 'success');
        navigate(routes.factionDetail(pid, resolvedEntityType, created.id), { replace: true });
      } else {
        await updateFaction(fid, payload as Parameters<typeof updateFaction>[1]);
        await replaceCustomMetrics(fid, { metrics: preparedCustomMetrics });
        await saveTagsForFaction(fid, finalTags);
        setTagsInput('');
        if (resolvedEntityType === 'state') {
          bumpMapTerritories();
          mapApi.getTerritorySummariesForProject(pid).then((res) => setTerritoryOptions(res.data.data || [])).catch(() => {});
        }
        showSnackbar(t('factions:snackbar.saved'), 'success');
      }
    } catch (err: any) { showSnackbar(err.message || t('factions:snackbar.genericError'), 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = () => {
    if (isNew) return;
    showConfirmDialog(
      isStateEntity ? t('factions:list.confirmDeleteTitleState') : t('factions:list.confirmDeleteTitleFaction'),
      t('factions:confirm.deleteEntityMessage', { name: form.name }),
      async () => {
      try { await deleteFaction(fid); showSnackbar(t('factions:snackbar.entityDeleted'), 'success'); navigate(routes.factionList(pid, resolvedEntityType)); }
      catch { showSnackbar(t('factions:snackbar.genericError'), 'error'); }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || isNew) return;
    try { await uploadImage(fid, file); showSnackbar(t('factions:snackbar.coatUploaded'), 'success'); } catch { showSnackbar(t('factions:snackbar.genericError'), 'error'); }
  };
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || isNew) return;
    try { await uploadBanner(fid, file); showSnackbar(t('factions:snackbar.bannerUploaded'), 'success'); } catch { showSnackbar(t('factions:snackbar.genericError'), 'error'); }
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
      if (editingRank) { await updateRank(fid, editingRank.id, rankForm); showSnackbar(t('factions:snackbar.rankUpdated'), 'success'); }
      else { await createRank(fid, rankForm); showSnackbar(t('factions:snackbar.rankCreated'), 'success'); }
      setRankDialogOpen(false);
    } catch (err: any) { showSnackbar(err.message || t('factions:snackbar.genericError'), 'error'); }
  };
  const handleDeleteRank = (id: number, name: string) => {
    showConfirmDialog(t('factions:relations.deleteRankTitle'), t('factions:relations.deleteRankMessage', { name }), async () => {
      try { await deleteRank(fid, id); showSnackbar(t('factions:snackbar.removed'), 'success'); } catch { showSnackbar(t('factions:snackbar.genericError'), 'error'); }
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
      setMemberDialogOpen(false); showSnackbar(t('factions:snackbar.memberAdded'), 'success');
    } catch (err: any) { showSnackbar(err.message || t('factions:snackbar.genericError'), 'error'); }
  };
  const handleRemoveMember = (id: number, name: string) => {
    showConfirmDialog(
      t('factions:relations.genericDeleteTitle'),
      isStateEntity ? t('factions:members.confirmRemoveState', { name }) : t('factions:members.confirmRemoveFaction', { name }),
      async () => {
      try { await removeMember(fid, id); showSnackbar(t('factions:snackbar.removed'), 'success'); } catch { showSnackbar(t('factions:snackbar.genericError'), 'error'); }
      });
  };

  // Relations
  const openRelationDialog = () => { setRelationForm({ targetFactionId: '', relationType: 'neutral', customLabel: '', description: '' }); setRelationDialogOpen(true); };
  const handleAddRelation = async () => {
    if (!relationForm.targetFactionId) return;
    try {
      await createRelation({ projectId: pid, sourceFactionId: fid, targetFactionId: parseInt(relationForm.targetFactionId), relationType: relationForm.relationType, customLabel: relationForm.customLabel, description: relationForm.description, isBidirectional: true });
      await fetchRelations(pid); setRelationDialogOpen(false); showSnackbar(t('factions:snackbar.relationAdded'), 'success');
    } catch (err: any) { showSnackbar(err.message || t('factions:snackbar.genericError'), 'error'); }
  };
  const handleDeleteRelation = (id: number) => {
    showConfirmDialog(t('factions:relations.confirmDeleteTitle'), t('factions:relations.confirmDeleteMessage'), async () => {
      try { await deleteRelation(id); showSnackbar(t('factions:snackbar.relationRemoved'), 'success'); } catch { showSnackbar(t('factions:snackbar.genericError'), 'error'); }
    });
  };

  const openPolicyDialog = (policy?: FactionPolicy) => {
    if (policy) {
      setEditingPolicy(policy);
      setPolicyForm({
        title: policy.title,
        type: policy.type,
        status: policy.status,
        category: policy.category ?? 'other',
        enactedDate: policy.enactedDate ?? '',
        description: policy.description || '',
      });
    } else {
      setEditingPolicy(null);
      setPolicyForm({
        title: '',
        type: 'policy',
        status: 'active',
        category: 'other',
        enactedDate: '',
        description: '',
      });
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
          category: policyForm.category,
          enactedDate: policyForm.enactedDate.trim() || null,
          description: policyForm.description,
        }, pid);
        showSnackbar(t('factions:snackbar.policyUpdated'), 'success');
      } else {
        await factionsApi.createPolicy(fid, {
          title: policyForm.title.trim(),
          type: policyForm.type,
          status: policyForm.status,
          category: policyForm.category,
          enactedDate: policyForm.enactedDate.trim() || null,
          description: policyForm.description,
          sortOrder: factionPolicies.length,
        }, pid);
        showSnackbar(t('factions:snackbar.policyAdded'), 'success');
      }
      setPolicyDialogOpen(false);
      const res = await factionsApi.getPolicies(fid, pid);
      setFactionPolicies(res.data.data || []);
    } catch (err: unknown) {
      showSnackbar(err instanceof Error ? err.message : t('factions:snackbar.genericError'), 'error');
    }
  };

  const handleDeletePolicy = (policy: FactionPolicy) => {
    showConfirmDialog(t('factions:relations.genericDeleteTitle'), t('factions:detail.policies.deleteConfirmMessage', { title: policy.title }), async () => {
      try {
        await factionsApi.deletePolicy(fid, policy.id, pid);
        showSnackbar(t('factions:snackbar.removed'), 'success');
        const res = await factionsApi.getPolicies(fid, pid);
        setFactionPolicies(res.data.data || []);
      } catch {
        showSnackbar(t('factions:snackbar.genericError'), 'error');
      }
    });
  };
  const handleResetPolicyFilters = () => {
    setPolicyTitleSearch('');
    setPolicyTypeFilter('all');
    setPolicyStatusFilter('all');
    setPolicyCategoryFilter('all');
  };

  if (loading && !isNew && !currentFaction) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography sx={{ color: 'text.secondary' }}>{t('common:loading')}</Typography>
      </Box>
    );
  }
  return (
    <Box>
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton onClick={() => navigate(routes.factionList(pid, normalizedEntityType))} sx={{ mr: 1 }}><ArrowBackIcon /></IconButton>
        <Typography variant="body2" color="text.secondary">
          {isStateEntity ? t('factions:detail.backToListState') : t('factions:detail.backToListFaction')}
        </Typography>
      </Box>

      <EntityHeroLayout
        bannerUrl={currentFaction?.bannerPath}
        avatarNode={
          currentFaction?.imagePath ? (
            <Avatar src={currentFaction.imagePath} sx={{ width: 120, height: 120, borderRadius: 3 }} variant="rounded" />
          ) : (
            <Avatar sx={{ width: 120, height: 120, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, fontSize: '3rem' }} variant="rounded">
              {(
                (form.type
                  ? (resolvedEntityType === 'state' ? STATE_TYPE_ICONS[form.type] : FACTION_TYPE_ICONS[form.type])
                  : null) ||
                FACTION_KIND_ICONS[resolvedEntityType]
              ) || '🏴'}
            </Avatar>
          )
        }
        title={
          isNew
            ? isStateEntity
              ? t('factions:detail.newTitleState')
              : t('factions:detail.newTitleFaction')
            : form.name ||
              (isStateEntity ? t('factions:detail.fallbackNameState') : t('factions:detail.fallbackNameFaction'))
        }
        subtitle={form.motto ? `«${form.motto}»` : undefined}
        actionButtons={
          <>
            {!isNew && (
              <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleDelete} size="small">
                {t('common:delete')}
              </Button>
            )}
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
          { value: 'overview', label: t('factions:detail.tabs.overview'), icon: <EditIcon fontSize="small" /> },
          { value: 'structure', label: t('factions:detail.tabs.structure'), icon: <PeopleIcon fontSize="small" /> },
          { value: 'ambitions', label: t('factions:detail.tabs.ambitions'), icon: <TrackChangesIcon fontSize="small" /> },
          { value: 'politics', label: t('factions:detail.tabs.politics'), icon: <TrackChangesIcon fontSize="small" /> },
          { value: 'metrics', label: t('factions:detail.tabs.metrics'), icon: <StarIcon fontSize="small" /> },
        ]}
      />

      {activeTab === 'overview' && (
        <Box display="flex" gap={3} sx={{ flexDirection: { xs: 'column', md: 'row' } }}>
          {/* LEFT SIDEBAR */}
          <Box sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0 }}>
            <GlassCard sx={{ p: 3, position: 'sticky', top: 80 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>{t('factions:detail.summary.title')}</Typography>
              
              {!isNew && (
                <Box display="flex" gap={1} mb={3}>
                  <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} fullWidth size="small" sx={{ fontSize: '0.75rem', borderColor: alpha(theme.palette.divider, 0.5) }}>
                    {t('factions:detail.summary.coatOfArms')}<input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                  </Button>
                  <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} fullWidth size="small" sx={{ fontSize: '0.75rem', borderColor: alpha(theme.palette.divider, 0.5) }}>
                    {t('factions:detail.summary.banner')}<input type="file" hidden accept="image/*" onChange={handleBannerUpload} />
                  </Button>
                </Box>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <InfoRow
                  label={t('factions:detail.summary.entityKind')}
                  value={`${FACTION_KIND_ICONS[resolvedEntityType] || ''} ${t(`factions:entityKinds.${resolvedEntityType}`)}`}
                />
                {form.type && (
                  <InfoRow
                    label={t('factions:detail.summary.type')}
                    value={
                      isStateEntity
                        ? `${STATE_TYPE_ICONS[form.type] || ''} ${t(`factions:stateTypes.${form.type}`, { defaultValue: form.type })}`.trim()
                        : `${FACTION_TYPE_ICONS[form.type] || ''} ${t(`factions:factionTypes.${form.type}`, { defaultValue: form.type })}`.trim()
                    }
                  />
                )}
                {form.status && (
                  <InfoRow
                    label={t('factions:detail.summary.status')}
                    value={`${FACTION_STATUS_ICONS[form.status] || ''} ${t(`factions:factionStatuses.${form.status}`, { defaultValue: form.status })}`}
                  />
                )}
                {isStateEntity && currentFaction?.ruler && (
                  <Box sx={{ mb: 0.5, pb: 1, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2, mb: 0.5 }}>{t('factions:detail.summary.ruler')}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                      <Link component={RouterLink} to={routes.characterDetail(pid, currentFaction.ruler.id)} underline="hover" color="inherit">
                        {currentFaction.ruler.name}
                      </Link>
                    </Typography>
                  </Box>
                )}
                {form.headquarters && (
                  <InfoRow
                    label={isStateEntity ? t('factions:detail.summary.capital') : t('factions:detail.summary.headquarters')}
                    value={form.headquarters}
                  />
                )}
                {isStateEntity ? (
                  (currentFaction?.territories?.length ?? 0) > 0 && (
                    <Box sx={{ pb: 1, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2, mb: 0.5 }}>{t('factions:detail.summary.territories')}</Typography>
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {currentFaction!.territories!.map((terr) => (
                          <Chip key={terr.id} label={terr.name} size="small" sx={{ height: 24, fontSize: '0.75rem' }} />
                        ))}
                      </Box>
                    </Box>
                  )
                ) : (
                  form.territory && <InfoRow label={t('factions:detail.summary.territory')} value={form.territory} />
                )}
                {form.foundedDate && <InfoRow label={t('factions:detail.summary.founded')} value={form.foundedDate} />}
                {form.disbandedDate && <InfoRow label={t('factions:detail.summary.disbanded')} value={form.disbandedDate} />}
                {previewTagsStr.trim() && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>{t('factions:detail.summary.tags')}</Typography>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {previewTagsStr.split(',').map((tagPart, i) => { const s = tagPart.trim(); return s ? <Chip key={i} label={s} size="small" sx={{ height: 24, fontSize: '0.75rem' }} /> : null; })}
                    </Box>
                  </Box>
                )}
              </Box>
            </GlassCard>
          </Box>

          {/* MAIN CONTENT */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Section title={t('factions:detail.sections.basics')} icon={<EditIcon />} defaultOpen={true}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}><TextField fullWidth label={t('factions:detail.fields.name')} value={form.name} onChange={e => handleChange('name', e.target.value)} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label={t('factions:detail.fields.motto')} value={form.motto} onChange={e => handleChange('motto', e.target.value)} placeholder={t('factions:detail.placeholders.motto')} /></Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth><InputLabel>{t('factions:detail.fields.type')}</InputLabel>
                    <Select value={form.type} label={t('factions:detail.fields.type')} onChange={e => handleChange('type', e.target.value)}>
                      <MenuItem value="">{t('factions:detail.typeNotSet')}</MenuItem>
                      {semanticTypeOptions.map((typeKey) => (
                        <MenuItem key={typeKey} value={typeKey}>
                          {isStateEntity
                            ? `${STATE_TYPE_ICONS[typeKey] || ''} ${t(`factions:stateTypes.${typeKey}`, { defaultValue: typeKey })}`.trim()
                            : `${FACTION_TYPE_ICONS[typeKey] || ''} ${t(`factions:factionTypes.${typeKey}`, { defaultValue: typeKey })}`.trim()}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth><InputLabel>{t('factions:detail.fields.status')}</InputLabel>
                    <Select value={form.status} label={t('factions:detail.fields.status')} onChange={e => handleChange('status', e.target.value)}>
                      {FACTION_STATUSES.map((s) => (
                        <MenuItem key={s} value={s}>
                          {FACTION_STATUS_ICONS[s]} {t(`factions:factionStatuses.${s}`, { defaultValue: s })}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={isStateEntity ? t('factions:detail.summary.capital') : t('factions:detail.summary.headquarters')}
                    value={form.headquarters}
                    onChange={e => handleChange('headquarters', e.target.value)}
                  />
                </Grid>
                {isStateEntity ? (
                  <>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>{t('factions:detail.fields.dynasty')}</InputLabel>
                        <Select
                          value={form.rulingDynastyId}
                          label={t('factions:detail.fields.dynasty')}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, rulingDynastyId: e.target.value as string }))
                          }
                        >
                          <MenuItem value="">{t('factions:detail.dynastyNotChosen')}</MenuItem>
                          {dynastiesList.map((d) => (
                            <MenuItem key={d.id} value={String(d.id)}>{d.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Autocomplete<RulerOption, false, false, false>
                        options={rulerOptions}
                        loading={creatingRuler}
                        value={rulerValue}
                        onChange={async (_, v) => {
                          if (v == null) {
                            setForm((prev) => ({
                              ...prev,
                              rulerCharacterId: null,
                              rulerName: '',
                            }));
                            setRulerInput('');
                            return;
                          }
                          if (v.type === 'create') {
                            setCreatingRuler(true);
                            try {
                              const res = await charactersApi.create({ projectId: pid, name: v.name });
                              const c = res.data.data;
                              setForm((prev) => ({
                                ...prev,
                                rulerCharacterId: c.id,
                                rulerName: c.name,
                              }));
                              setRulerInput(c.name);
                              await fetchCharacters(pid, { limit: 500 });
                              showSnackbar(t('factions:snackbar.rulerCharacterCreated'), 'success');
                            } catch {
                              showSnackbar(t('factions:snackbar.rulerCharacterCreateFailed'), 'error');
                            } finally {
                              setCreatingRuler(false);
                            }
                            return;
                          }
                          setForm((prev) => ({
                            ...prev,
                            rulerCharacterId: v.id,
                            rulerName: v.name,
                          }));
                          setRulerInput(v.name);
                        }}
                        inputValue={rulerInput}
                        onInputChange={(_, v, reason) => {
                          if (reason === 'input') setRulerInput(v);
                          if (reason === 'clear') {
                            setRulerInput('');
                            setForm((prev) => ({
                              ...prev,
                              rulerCharacterId: null,
                              rulerName: '',
                            }));
                          }
                        }}
                        getOptionLabel={(o) =>
                          o.type === 'create' ? t('factions:detail.rulerCreateOption', { name: o.name }) : o.name
                        }
                        isOptionEqualToValue={(a, b) => {
                          if (a.type === 'create' && b.type === 'create') return a.name === b.name;
                          if (a.type === 'char' && b.type === 'char') return a.id === b.id;
                          return false;
                        }}
                        renderOption={(props, option) => (
                          <li {...props} key={option.type === 'char' ? `c-${option.id}` : `n-${option.name}`}>
                            <Typography variant="body2">
                              {option.type === 'create'
                                ? t('factions:detail.rulerCreateOption', { name: option.name })
                                : option.name}
                            </Typography>
                          </li>
                        )}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={t('factions:detail.summary.ruler')}
                            placeholder={t('factions:detail.placeholders.rulerSearch')}
                            disabled={creatingRuler}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Autocomplete<MapTerritorySummary, true, false, false>
                        multiple
                        options={territoryOptions}
                        value={territoryOptions.filter((terr) => form.territoryIds.includes(terr.id))}
                        onChange={(_, v) => handleTerritoriesMultiChange(v)}
                        getOptionLabel={(o) => `${o.name} (${o.mapName})`}
                        isOptionEqualToValue={(a, b) => a.id === b.id}
                        renderOption={(props, option) => {
                          const occupied = option.factionId != null && (isNew || option.factionId !== fid);
                          const label =
                            occupied && option.occupantName
                              ? t('factions:detail.territoryOccupied', {
                                  name: option.name,
                                  mapName: option.mapName,
                                  occupant: option.occupantName,
                                })
                              : `${option.name} (${option.mapName})`;
                          return (
                            <li {...props} key={option.id}>
                              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                <Typography variant="body2">{label}</Typography>
                                {occupied && option.occupantKind === 'state' && (
                                  <Chip
                                    size="small"
                                    label={t('factions:detail.territoryOccupantStateKind')}
                                    variant="outlined"
                                    sx={{ height: 22, fontSize: '0.7rem' }}
                                  />
                                )}
                              </Box>
                            </li>
                          );
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={t('factions:detail.fields.territoryMap')}
                            placeholder={t('factions:detail.placeholders.territoryMap')}
                          />
                        )}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip {...getTagProps({ index })} key={option.id} size="small" label={option.name} />
                          ))
                        }
                      />
                    </Grid>
                  </>
                ) : (
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label={t('factions:detail.summary.territory')} value={form.territory} onChange={e => handleChange('territory', e.target.value)} />
                  </Grid>
                )}
                <Grid item xs={12} sm={6}><TextField fullWidth label={t('factions:detail.fields.foundedDate')} value={form.foundedDate} onChange={e => handleChange('foundedDate', e.target.value)} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label={t('factions:detail.fields.disbandedDate')} value={form.disbandedDate} onChange={e => handleChange('disbandedDate', e.target.value)} /></Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>
                      {isStateEntity ? t('factions:detail.fields.parentState') : t('factions:detail.fields.parentFaction')}
                    </InputLabel>
                    <Select
                      value={form.parentFactionId}
                      label={isStateEntity ? t('factions:detail.fields.parentState') : t('factions:detail.fields.parentFaction')}
                      onChange={e => handleChange('parentFactionId', e.target.value)}
                    >
                      <MenuItem value="">{t('factions:detail.parentNone')}</MenuItem>
                      {parentFactions.map((f) => (
                        <MenuItem key={f.id} value={String(f.id)}>
                          {FACTION_KIND_ICONS[f.kind] || '🏴'} {f.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} sm={3}><TextField fullWidth label={t('factions:detail.fields.primaryColor')} value={form.color || '#000000'} onChange={e => handleChange('color', e.target.value)} type="color" InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item xs={6} sm={3}><TextField fullWidth label={t('factions:detail.fields.secondaryColor')} value={form.secondaryColor || '#000000'} onChange={e => handleChange('secondaryColor', e.target.value)} type="color" InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item xs={12}>
                  <TagAutocompleteField
                    options={allTagNames}
                    value={form.tagsStr}
                    pendingInput={tagsInput}
                    onValueChange={v => handleChange('tagsStr', v)}
                    onPendingInputChange={setTagsInput}
                    label={t('factions:tagField.label')}
                    placeholder={t('factions:tagField.placeholder')}
                    noOptionsText={t('factions:tagField.noOptions')}
                  />
                </Grid>
              </Grid>
            </Section>

            <Section title={t('factions:detail.sections.history')} icon={<EditIcon />} defaultOpen={!isNew}>
              <Grid container spacing={2}>
                <Grid item xs={12}><TextField fullWidth label={t('factions:detail.fields.description')} value={form.description} onChange={e => handleChange('description', e.target.value)} multiline rows={4} placeholder={t('factions:detail.placeholders.descriptionFaction')} /></Grid>
                <Grid item xs={12}><TextField fullWidth label={t('factions:detail.fields.history')} value={form.history} onChange={e => handleChange('history', e.target.value)} multiline rows={6} placeholder={t('factions:detail.placeholders.history')} /></Grid>
                <Grid item xs={12}><TextField fullWidth label={t('factions:detail.fields.goals')} value={form.goals} onChange={e => handleChange('goals', e.target.value)} multiline rows={4} placeholder={t('factions:detail.placeholders.goals')} /></Grid>
              </Grid>
            </Section>
          </Box>
        </Box>
      )}

      {activeTab === 'structure' && (
        <Box>
          {/* SECTION: Ranks */}
          {!isNew && (
            <Section title={t('factions:detail.sections.ranks')} icon={<StarIcon />} badge={currentRanks.length} defaultOpen={true}
              action={
                <DndButton variant="outlined" startIcon={<AddIcon />} size="small" onClick={() => openRankDialog()} sx={{ borderColor: alpha(theme.palette.primary.main, 0.5) }}>
                  {t('common:add')}
                </DndButton>
              }>
              {currentRanks.length === 0 ? (
                <EmptyState
                  icon={<StarIcon />}
                  title={t('factions:ranks.emptyTitle')}
                  description={t('factions:ranks.emptyDescription')}
                  actionLabel={t('factions:ranks.addRank')}
                  onAction={() => openRankDialog()}
                />
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
                          <Chip label={t('factions:ranks.levelChip', { level: rank.level })} size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
                          <Chip
                            label={t('factions:ranks.memberCountChip', { count: currentMembers.filter(m => m.rankId === rank.id).length })}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.65rem' }}
                          />
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
            <Section title={t('factions:detail.sections.members')} icon={<PeopleIcon />} badge={currentMembers.length} defaultOpen={true}
              action={
                <DndButton variant="outlined" startIcon={<AddIcon />} size="small" onClick={openMemberDialog} sx={{ borderColor: alpha(theme.palette.primary.main, 0.5) }}>
                  {t('common:add')}
                </DndButton>
              }>
              {currentMembers.length === 0 ? (
                <EmptyState
                  icon={<PeopleIcon />}
                  title={t('factions:members.emptyTitle')}
                  description={t('factions:members.emptyDescription')}
                  actionLabel={t('factions:members.addMember')}
                  onAction={openMemberDialog}
                />
              ) : (
                <List disablePadding>
                  {currentMembers.map(member => (
                    <ListItem key={member.id}
                      secondaryAction={
                        <IconButton size="small" onClick={e => { e.stopPropagation(); handleRemoveMember(member.id, member.characterName || ''); }}>
                          <DeleteIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                        </IconButton>
                      }
                      onClick={() => navigate(routes.characterDetail(pid, member.characterId))}
                      sx={{ backgroundColor: alpha(theme.palette.background.paper, 0.5), borderRadius: 1.5, mb: 1, cursor: 'pointer', border: `1px solid ${alpha(theme.palette.divider, 0.5)}`, '&:hover': { backgroundColor: alpha(theme.palette.action.hover, 0.1) } }}>
                      <ListItemAvatar>
                        <Avatar src={member.characterImagePath || undefined} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}><PersonIcon /></Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Box display="flex" alignItems="center" gap={1}>
                          <Typography sx={{ color: 'text.primary', fontWeight: 600 }}>{member.characterName || `ID: ${member.characterId}`}</Typography>
                          {member.rankName && <Chip label={member.rankName} size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem' }} />}
                          {member.role && <Chip label={member.role} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />}
                          {!member.isActive && <Chip label={t('factions:members.formerBadge')} size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />}
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
          {!isNew && (
            <FactionPoliticalScalesSection projectId={pid} factionId={fid} entityType={resolvedEntityType} />
          )}

          {/* SECTION: Decrees (faction_policies) — только для фракций */}
          {!isNew && resolvedEntityType === 'faction' && (
            <Section
              title={t('factions:detail.sections.decrees')}
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
                  {t('factions:detail.policies.addDecree')}
                </DndButton>
              }
            >
              {policiesLoading && sortedFactionPolicies.length === 0 ? (
                <Typography sx={{ color: 'text.secondary', py: 2 }}>{t('factions:detail.policies.loading')}</Typography>
              ) : sortedFactionPolicies.length === 0 ? (
                <EmptyState
                  icon={<TrackChangesIcon />}
                  title={t('factions:detail.policies.emptyTitle')}
                  description={t('factions:detail.policies.emptyDescription')}
                  actionLabel={t('factions:detail.policies.emptyAction')}
                  onAction={() => openPolicyDialog()}
                />
              ) : (
                <>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr 1fr' },
                      gap: 1.25,
                      mb: 1.5,
                    }}
                  >
                    <TextField
                      size="small"
                      label={t('factions:detail.policies.searchLabel')}
                      value={policyTitleSearch}
                      onChange={(e) => setPolicyTitleSearch(e.target.value)}
                      placeholder={t('factions:detail.placeholders.policyTitleSearch')}
                    />
                    <FormControl size="small" fullWidth>
                      <InputLabel>{t('factions:detail.fields.type')}</InputLabel>
                      <Select
                        label={t('factions:detail.fields.type')}
                        value={policyTypeFilter}
                        onChange={(e) => setPolicyTypeFilter(e.target.value as 'all' | PolicyType)}
                      >
                        <MenuItem value="all">{t('factions:detail.policies.typeAll')}</MenuItem>
                        {POLICY_TYPES.map((pt) => (
                          <MenuItem key={pt} value={pt}>
                            {t(`factions:policyTypes.${pt}`)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="small" fullWidth>
                      <InputLabel>{t('factions:detail.fields.status')}</InputLabel>
                      <Select
                        label={t('factions:detail.fields.status')}
                        value={policyStatusFilter}
                        onChange={(e) => setPolicyStatusFilter(e.target.value as 'all' | PolicyStatus)}
                      >
                        <MenuItem value="all">{t('factions:detail.policies.statusAll')}</MenuItem>
                        {POLICY_STATUSES.map((st) => (
                          <MenuItem key={st} value={st}>
                            {t(`factions:policyStatuses.${st}`)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="small" fullWidth>
                      <InputLabel>{t('factions:detail.policies.categoryLabel')}</InputLabel>
                      <Select
                        label={t('factions:detail.policies.categoryLabel')}
                        value={policyCategoryFilter}
                        onChange={(e) =>
                          setPolicyCategoryFilter(e.target.value as 'all' | FactionPolicyCategory)
                        }
                      >
                        <MenuItem value="all">{t('factions:detail.policies.categoryAll')}</MenuItem>
                        {Object.keys(FACTION_DECREE_CATEGORY_LABELS).map((catKey) => (
                          <MenuItem key={catKey} value={catKey}>
                            {t(`factions:decrees.category.${catKey}`)}
                          </MenuItem>
                        ))}
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
                      <Typography sx={{ color: 'text.secondary' }}>{t('factions:detail.policies.filteredNone')}</Typography>
                      <Button size="small" onClick={handleResetPolicyFilters}>
                        {t('factions:detail.policies.resetFilters')}
                      </Button>
                    </Box>
                  ) : (
                    <List disablePadding>
                      {filteredFactionPolicies.map((pol) => (
                        <ListItem
                          key={pol.id}
                          secondaryAction={
                            <Box display="flex" gap={0.5}>
                              <IconButton size="small" onClick={() => openPolicyDialog(pol)}>
                                <EditIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleDeletePolicy(pol)}>
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
                                <Typography sx={{ color: 'text.primary', fontWeight: 600 }}>{pol.title}</Typography>
                                <Chip
                                  label={t(`factions:policyTypes.${pol.type}`)}
                                  size="small"
                                  sx={{ height: 20, fontSize: '0.65rem' }}
                                />
                                <Chip
                                  label={t(`factions:policyStatuses.${pol.status}`)}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.65rem' }}
                                />
                                <Chip
                                  label={t(`factions:decrees.category.${pol.category ?? 'other'}`)}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.65rem' }}
                                />
                                {pol.enactedDate ? (
                                  <Chip
                                    label={pol.enactedDate}
                                    size="small"
                                    sx={{ height: 20, fontSize: '0.65rem' }}
                                  />
                                ) : null}
                              </Box>
                            }
                            secondary={
                              pol.description ? (
                                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.75, whiteSpace: 'pre-wrap' }}>
                                  {pol.description}
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
            <Section title={t('factions:detail.sections.relations')} icon={<LinkIcon />} badge={relationsForDisplay.length} defaultOpen={true}
              action={
                <DndButton variant="outlined" startIcon={<AddIcon />} size="small" onClick={openRelationDialog} sx={{ borderColor: alpha(theme.palette.primary.main, 0.5) }}>
                  {t('common:add')}
                </DndButton>
              }>
              {relationsForDisplay.length === 0 ? (
                <EmptyState
                  icon={<LinkIcon />}
                  title={t('factions:relations.emptyTitle')}
                  description={t('factions:relations.emptyDescription')}
                  actionLabel={t('factions:relations.addLink')}
                  onAction={openRelationDialog}
                />
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
                          <Chip
                            label={rel.customLabel || t(`factions:relationTypes.${rel.relationType}`, { defaultValue: rel.relationType })}
                            size="small"
                            sx={{ backgroundColor: FACTION_RELATION_COLORS[rel.relationType] || alpha(theme.palette.primary.main, 0.3), color: '#fff', fontSize: '0.7rem', fontWeight: 600 }}
                          />
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

      {activeTab === 'metrics' && (
        <Box>
          {!isNew && (
            <Section title={t('factions:detail.tabs.metrics')} icon={<StarIcon />} defaultOpen={true}
              action={
                <DndButton variant="outlined" size="small" onClick={() => setCompareDialogOpen(true)} sx={{ borderColor: alpha(theme.palette.primary.main, 0.5) }}>
                  {t('factions:metrics.compareWithOthers')}
                </DndButton>
              }
            >
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>{t('factions:metrics.baseSection')}</Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {metricMetaTranslated.map((metric) => (
                  <Grid item xs={12} sm={6} md={4} key={metric.key}>
                    <MetricInput
                      label={metric.label}
                      unit={metric.unit}
                      min={metric.min}
                      max={metric.max}
                      value={readMetricValue(metric.key)}
                      onChange={(value) => {
                        handleChange(metricKeyToField(metric.key), value == null ? '' : String(value));
                      }}
                    />
                  </Grid>
                ))}
              </Grid>

              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>{t('factions:metrics.customSection')}</Typography>
              <CustomMetricsEditor metrics={customMetrics} onChange={setCustomMetrics} />
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
      <FactionCompareDialog
        open={compareDialogOpen}
        kind={resolvedEntityType}
        currentFactionId={fid}
        factions={factions}
        onClose={() => setCompareDialogOpen(false)}
        onCompare={(factionIds, metricKeys) => compareFactions({ factionIds, metricKeys })}
      />

      <Dialog open={policyDialogOpen} onClose={() => setPolicyDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          {editingPolicy ? t('factions:detail.policies.dialogEdit') : t('factions:detail.policies.dialogNew')}
        </DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
          <TextField
            autoFocus
            fullWidth
            label={t('factions:detail.fields.policyTitle')}
            value={policyForm.title}
            onChange={(e) => setPolicyForm((prev) => ({ ...prev, title: e.target.value }))}
          />
          <FormControl fullWidth>
            <InputLabel>{t('factions:detail.fields.type')}</InputLabel>
            <Select
              label={t('factions:detail.fields.type')}
              value={policyForm.type}
              onChange={(e) => setPolicyForm((prev) => ({ ...prev, type: e.target.value as PolicyType }))}
            >
              {POLICY_TYPES.map((pt) => (
                <MenuItem key={pt} value={pt}>
                  {t(`factions:policyTypes.${pt}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>{t('factions:detail.fields.status')}</InputLabel>
            <Select
              label={t('factions:detail.fields.status')}
              value={policyForm.status}
              onChange={(e) => setPolicyForm((prev) => ({ ...prev, status: e.target.value as PolicyStatus }))}
            >
              {POLICY_STATUSES.map((st) => (
                <MenuItem key={st} value={st}>
                  {t(`factions:policyStatuses.${st}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>{t('factions:detail.policies.categoryLabel')}</InputLabel>
            <Select
              label={t('factions:detail.policies.categoryLabel')}
              value={policyForm.category}
              onChange={(e) =>
                setPolicyForm((prev) => ({ ...prev, category: e.target.value as FactionPolicyCategory }))
              }
            >
              {Object.keys(FACTION_DECREE_CATEGORY_LABELS).map((catKey) => (
                <MenuItem key={catKey} value={catKey}>
                  {t(`factions:decrees.category.${catKey}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label={t('factions:detail.fields.policyEnactedDate')}
            type="date"
            InputLabelProps={{ shrink: true }}
            value={policyForm.enactedDate}
            onChange={(e) => setPolicyForm((prev) => ({ ...prev, enactedDate: e.target.value }))}
          />
          <TextField
            fullWidth
            label={t('factions:detail.fields.description')}
            value={policyForm.description}
            onChange={(e) => setPolicyForm((prev) => ({ ...prev, description: e.target.value }))}
            multiline
            minRows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPolicyDialogOpen(false)}>{t('common:cancel')}</Button>
          <Button variant="contained" onClick={handleSavePolicy} disabled={!policyForm.title.trim()}>
            {editingPolicy ? t('common:save') : t('common:create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
