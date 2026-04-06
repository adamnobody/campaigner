import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Typography,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import { useParams } from 'react-router-dom';
import { policiesApi } from '@/api/policies';
import { factionsApi } from '@/api/factions';
import { useUIStore } from '@/store/useUIStore';
import { DndButton } from '@/components/ui/DndButton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  POLICY_TYPES,
  POLICY_STATUSES,
} from '@campaigner/shared';
import type {
  Policy,
  PolicyType,
  PolicyStatus,
  PolicyFactionLink,
  PolicyFactionLinkRole,
  Faction,
} from '@campaigner/shared';

const TYPE_LABELS: Record<PolicyType, string> = {
  ambition: 'Амбиция',
  policy: 'Политика',
};

const STATUS_LABELS: Record<PolicyStatus, string> = {
  planned: 'Запланировано',
  active: 'Активно',
  archived: 'В архиве',
};

const LINK_ROLE_LABELS: Record<PolicyFactionLinkRole, string> = {
  owner: 'Владелец',
  supporter: 'Сторонник',
  opponent: 'Оппонент',
};

type PolicyForm = {
  title: string;
  type: PolicyType;
  status: PolicyStatus;
  description: string;
};

type LinkDraft = {
  factionId: string;
  role: PolicyFactionLinkRole;
};

const EMPTY_FORM: PolicyForm = {
  title: '',
  type: 'policy',
  status: 'active',
  description: '',
};

export const PoliciesPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = Number(projectId);
  const { showSnackbar, showConfirmDialog } = useUIStore();

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [form, setForm] = useState<PolicyForm>(EMPTY_FORM);
  const [factions, setFactions] = useState<Faction[]>([]);
  const [policyLinksByPolicy, setPolicyLinksByPolicy] = useState<Record<number, PolicyFactionLink[]>>({});
  const [editingLinks, setEditingLinks] = useState<PolicyFactionLink[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const [linkDraft, setLinkDraft] = useState<LinkDraft>({ factionId: '', role: 'supporter' });

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const res = await policiesApi.getAll(pid);
      const items = res.data.data || [];
      setPolicies(items);

      const linksEntries = await Promise.all(
        items.map(async (policy) => {
          try {
            const linksRes = await policiesApi.getLinks(policy.id);
            return [policy.id, linksRes.data.data || []] as const;
          } catch {
            return [policy.id, []] as const;
          }
        })
      );
      setPolicyLinksByPolicy(Object.fromEntries(linksEntries));
    } catch {
      showSnackbar('Ошибка загрузки политик', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isFinite(pid) || pid <= 0) return;
    loadPolicies();
  }, [pid]);

  useEffect(() => {
    if (!Number.isFinite(pid) || pid <= 0) return;
    factionsApi.getAll(pid, { limit: 500 }).then((res) => {
      setFactions(res.data.data || []);
    }).catch(() => {});
  }, [pid]);

  const sortedPolicies = useMemo(
    () => [...policies].sort((a, b) => (a.sortOrder - b.sortOrder) || (a.id - b.id)),
    [policies]
  );

  const handleOpenCreate = () => {
    setEditingPolicy(null);
    setForm(EMPTY_FORM);
    setEditingLinks([]);
    setLinkDraft({ factionId: '', role: 'supporter' });
    setDialogOpen(true);
  };

  const loadPolicyLinks = async (policyId: number) => {
    setLinksLoading(true);
    try {
      const res = await policiesApi.getLinks(policyId);
      setEditingLinks(res.data.data || []);
    } catch {
      setEditingLinks([]);
      showSnackbar('Ошибка загрузки связей', 'error');
    } finally {
      setLinksLoading(false);
    }
  };

  const handleOpenEdit = (policy: Policy) => {
    setEditingPolicy(policy);
    setForm({
      title: policy.title,
      type: policy.type,
      status: policy.status,
      description: policy.description || '',
    });
    setLinkDraft({ factionId: '', role: 'supporter' });
    setDialogOpen(true);
    loadPolicyLinks(policy.id);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editingPolicy) {
        await policiesApi.update(editingPolicy.id, {
          title: form.title,
          type: form.type,
          status: form.status,
          description: form.description,
        });
        showSnackbar('Карточка обновлена', 'success');
      } else {
        await policiesApi.create({
          projectId: pid,
          title: form.title,
          type: form.type,
          status: form.status,
          description: form.description,
          sortOrder: policies.length,
        });
        showSnackbar('Карточка создана', 'success');
      }
      setDialogOpen(false);
      await loadPolicies();
    } catch {
      showSnackbar('Ошибка сохранения', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (policy: Policy) => {
    showConfirmDialog('Удалить карточку', `Удалить "${policy.title}"?`, async () => {
      try {
        await policiesApi.delete(policy.id);
        showSnackbar('Карточка удалена', 'success');
        await loadPolicies();
      } catch {
        showSnackbar('Ошибка удаления', 'error');
      }
    });
  };

  const handleAddLink = async () => {
    if (!editingPolicy || !linkDraft.factionId) return;
    try {
      await policiesApi.addLink(editingPolicy.id, {
        factionId: Number(linkDraft.factionId),
        role: linkDraft.role,
      });
      await loadPolicyLinks(editingPolicy.id);
      await loadPolicies();
      setLinkDraft({ factionId: '', role: 'supporter' });
    } catch {
      showSnackbar('Ошибка добавления связи', 'error');
    }
  };

  const handleUpdateLinkRole = async (linkId: number, role: PolicyFactionLinkRole) => {
    if (!editingPolicy) return;
    try {
      await policiesApi.updateLink(editingPolicy.id, linkId, { role });
      await loadPolicyLinks(editingPolicy.id);
      await loadPolicies();
    } catch {
      showSnackbar('Ошибка обновления роли', 'error');
    }
  };

  const handleRemoveLink = async (linkId: number) => {
    if (!editingPolicy) return;
    try {
      await policiesApi.removeLink(editingPolicy.id, linkId);
      await loadPolicyLinks(editingPolicy.id);
      await loadPolicies();
    } catch {
      showSnackbar('Ошибка удаления связи', 'error');
    }
  };

  const usedFactionIds = new Set(editingLinks.map((link) => link.factionId));
  const availableFactionsForDraft = factions.filter((f) => !usedFactionIds.has(f.id));

  if (loading && policies.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>Загрузка...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '1.8rem', color: '#fff' }}>
            Амбиции и политика
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', mt: 0.5 }}>
            Проектные направления и политические векторы
          </Typography>
        </Box>
        <DndButton variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Добавить карточку
        </DndButton>
      </Box>

      {sortedPolicies.length === 0 ? (
        <EmptyState
          icon={<TrackChangesIcon sx={{ fontSize: 64 }} />}
          title="Карточек пока нет"
          description="Добавьте ключевые политические направления или амбиции проекта"
          actionLabel="Добавить карточку"
          onAction={handleOpenCreate}
        />
      ) : (
        <List disablePadding>
          {sortedPolicies.map((policy) => (
            <ListItem
              key={policy.id}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 2,
                mb: 1.5,
              }}
              secondaryAction={(
                <Box display="flex" gap={0.5}>
                  <IconButton size="small" onClick={() => handleOpenEdit(policy)}>
                    <EditIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.5)' }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(policy)}>
                    <DeleteIcon fontSize="small" sx={{ color: 'rgba(255,100,100,0.7)' }} />
                  </IconButton>
                </Box>
              )}
            >
              <ListItemText
                primary={(
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography sx={{ color: '#fff', fontWeight: 600 }}>{policy.title}</Typography>
                    <Chip
                      size="small"
                      label={TYPE_LABELS[policy.type]}
                      sx={{ backgroundColor: 'rgba(130,130,255,0.18)', color: 'rgba(180,180,255,1)' }}
                    />
                    <Chip
                      size="small"
                      label={STATUS_LABELS[policy.status]}
                      sx={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)' }}
                    />
                  </Box>
                )}
                secondary={(
                  <Box sx={{ mt: 0.5 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)' }}>
                      {policy.description || '—'}
                    </Typography>
                    <Box display="flex" gap={0.5} flexWrap="wrap" sx={{ mt: 1 }}>
                      {(policyLinksByPolicy[policy.id] || []).length === 0 ? (
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)' }}>
                          Связанных фракций нет
                        </Typography>
                      ) : (
                        (policyLinksByPolicy[policy.id] || []).map((link) => (
                          <Chip
                            key={link.id}
                            size="small"
                            label={`${link.factionName} • ${LINK_ROLE_LABELS[link.role]}`}
                            sx={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)' }}
                          />
                        ))
                      )}
                    </Box>
                  </Box>
                )}
              />
            </ListItem>
          ))}
        </List>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingPolicy ? 'Редактировать карточку' : 'Новая карточка'}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
          <TextField
            autoFocus
            label="Название *"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Тип</InputLabel>
            <Select
              label="Тип"
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as PolicyType }))}
            >
              {POLICY_TYPES.map((type) => (
                <MenuItem key={type} value={type}>{TYPE_LABELS[type]}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Статус</InputLabel>
            <Select
              label="Статус"
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as PolicyStatus }))}
            >
              {POLICY_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>{STATUS_LABELS[status]}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Описание"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            fullWidth
            multiline
            minRows={3}
          />
          {editingPolicy && (
            <Box sx={{ pt: 1, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                Связанные фракции
              </Typography>

              {linksLoading ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                  Загрузка связей...
                </Typography>
              ) : (
                <Box sx={{ display: 'grid', gap: 1, mb: 2 }}>
                  {editingLinks.length === 0 ? (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Связей пока нет
                    </Typography>
                  ) : (
                    editingLinks.map((link) => (
                      <Box key={link.id} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography sx={{ minWidth: 180, flexGrow: 1 }}>{link.factionName}</Typography>
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                          <Select
                            value={link.role}
                            onChange={(e) => handleUpdateLinkRole(link.id, e.target.value as PolicyFactionLinkRole)}
                          >
                            {(Object.keys(LINK_ROLE_LABELS) as PolicyFactionLinkRole[]).map((role) => (
                              <MenuItem key={role} value={role}>{LINK_ROLE_LABELS[role]}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <IconButton size="small" onClick={() => handleRemoveLink(link.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))
                  )}
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 220 }}>
                  <InputLabel>Фракция</InputLabel>
                  <Select
                    label="Фракция"
                    value={linkDraft.factionId}
                    onChange={(e) => setLinkDraft((prev) => ({ ...prev, factionId: e.target.value }))}
                  >
                    {availableFactionsForDraft.map((faction) => (
                      <MenuItem key={faction.id} value={String(faction.id)}>
                        {faction.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Роль</InputLabel>
                  <Select
                    label="Роль"
                    value={linkDraft.role}
                    onChange={(e) => setLinkDraft((prev) => ({ ...prev, role: e.target.value as PolicyFactionLinkRole }))}
                  >
                    {(Object.keys(LINK_ROLE_LABELS) as PolicyFactionLinkRole[]).map((role) => (
                      <MenuItem key={role} value={role}>{LINK_ROLE_LABELS[role]}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button variant="outlined" onClick={handleAddLink} disabled={!linkDraft.factionId}>
                  Добавить связь
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.title.trim() || saving}>
            {editingPolicy ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
