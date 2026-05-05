import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Slider,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Collapse,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import type { PoliticalScale, PoliticalScaleAssignment, ScaleZone, CreatePoliticalScale } from '@campaigner/shared';
import {
  STATE_POLITICAL_SCALE_GROUP_LABELS,
  FACTION_POLITICAL_SCALE_GROUP_LABELS,
} from '@campaigner/shared';
import { politicalScalesApi } from '@/api/politicalScales';
import { useUIStore } from '@/store/useUIStore';
import { CollapsibleSection } from '@/components/detail/CollapsibleSection';
import { GlassCard } from '@/components/ui/GlassCard';
import { shallow } from 'zustand/shallow';
import { useTranslation } from 'react-i18next';
import { localizedBuiltinPoliticalScale } from '@/i18n/catalog/displayBuiltinTexts';

function getActiveZone(zones: ScaleZone[] | null | undefined, value: number): ScaleZone | null {
  if (!zones?.length) return null;
  for (const z of zones) {
    if (value >= z.from && value <= z.to) return z;
  }
  return null;
}

function zoneHue(index: number, total: number): string {
  const t = total <= 1 ? 0.5 : index / (total - 1);
  const h = 200 + t * 120;
  return `hsla(${h}, 45%, 42%, 0.55)`;
}

const ZoneStrip: React.FC<{ zones: ScaleZone[] | null | undefined }> = ({ zones }) => {
  const theme = useTheme();
  if (!zones?.length) return null;
  return (
    <Box
      sx={{
        position: 'relative',
        height: 8,
        borderRadius: 1,
        overflow: 'hidden',
        bgcolor: alpha(theme.palette.divider, 0.35),
        mt: 0.75,
      }}
    >
      {zones.map((z, i) => {
        const left = ((z.from + 100) / 200) * 100;
        const width = ((z.to - z.from) / 200) * 100;
        return (
          <Box
            key={`${z.from}-${z.to}-${z.label}`}
            sx={{
              position: 'absolute',
              left: `${left}%`,
              width: `${width}%`,
              top: 0,
              bottom: 0,
              bgcolor: zoneHue(i, zones.length),
            }}
          />
        );
      })}
    </Box>
  );
};

type LocalAssignment = {
  id: number;
  value: number;
  enabled: boolean;
  note: string | null;
};

export interface FactionPoliticalScalesSectionProps {
  projectId: number;
  factionId: number;
  entityType: 'state' | 'faction';
}

export const FactionPoliticalScalesSection: React.FC<FactionPoliticalScalesSectionProps> = ({
  projectId,
  factionId,
  entityType,
}) => {
  const theme = useTheme();
  const { t } = useTranslation(['factions', 'common']);
  const { showSnackbar } = useUIStore((s) => ({ showSnackbar: s.showSnackbar }), shallow);

  const politicalScaleCategoryKeys = useMemo(
    () =>
      Object.keys(
        entityType === 'state' ? STATE_POLITICAL_SCALE_GROUP_LABELS : FACTION_POLITICAL_SCALE_GROUP_LABELS
      ),
    [entityType]
  );

  const [scales, setScales] = useState<PoliticalScale[]>([]);
  const [localByScaleId, setLocalByScaleId] = useState<Record<number, LocalAssignment>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({});
  const localRef = useRef<Record<number, LocalAssignment>>({});
  useEffect(() => {
    localRef.current = localByScaleId;
  }, [localByScaleId]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [scalesRes, assignRes] = await Promise.all([
        politicalScalesApi.list({ entityType, worldId: projectId }),
        politicalScalesApi.getAssignments({ entityType, entityId: factionId }),
      ]);
      const nextScales = scalesRes.data.data || [];
      setScales(nextScales);
      const map: Record<number, LocalAssignment> = {};
      for (const a of assignRes.data.data || []) {
        map[a.scaleId] = { id: a.id, value: a.value, enabled: a.enabled, note: a.note ?? null };
      }
      setLocalByScaleId(map);
      localRef.current = map;
    } catch {
      showSnackbar(t('factions:politicalScales.loadError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [entityType, factionId, projectId, showSnackbar, t]);

  useEffect(() => {
    loadAll().catch(() => {});
  }, [loadAll]);

  const defaultLoc = (): LocalAssignment => ({
    id: 0,
    value: 0,
    enabled: true,
    note: null,
  });

  const saveMap = useCallback(
    async (map: Record<number, LocalAssignment>) => {
      localRef.current = map;
      setLocalByScaleId(map);
      setSaving(true);
      try {
        const body = {
          entityType,
          entityId: factionId,
          assignments: scales.map((s) => {
            const loc = map[s.id];
            return {
              scaleId: s.id,
              value: loc?.value ?? 0,
              enabled: loc?.enabled ?? true,
              note: loc?.note ?? null,
            };
          }),
        };
        const res = await politicalScalesApi.putAssignments(body);
        const next: Record<number, LocalAssignment> = {};
        for (const a of res.data.data || []) {
          next[a.scaleId] = { id: a.id, value: a.value, enabled: a.enabled, note: a.note ?? null };
        }
        localRef.current = next;
        setLocalByScaleId(next);
      } catch {
        showSnackbar(t('factions:politicalScales.saveError'), 'error');
      } finally {
        setSaving(false);
      }
    },
    [entityType, factionId, scales, showSnackbar, t]
  );

  const grouped = useMemo(() => {
    const m = new Map<string, PoliticalScale[]>();
    for (const s of scales) {
      const arr = m.get(s.category) || [];
      arr.push(s);
      m.set(s.category, arr);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => a.order - b.order || a.id - b.id);
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [scales]);

  const [createForm, setCreateForm] = useState<CreatePoliticalScale>({
    worldId: projectId,
    code: '',
    entityType,
    category: entityType === 'state' ? 'power' : 'authority',
    name: '',
    leftPoleLabel: '',
    rightPoleLabel: '',
    leftPoleDescription: '',
    rightPoleDescription: '',
    icon: null,
    zones: null,
    order: 0,
  });

  useEffect(() => {
    setCreateForm((prev) => ({ ...prev, worldId: projectId, entityType }));
  }, [projectId, entityType]);

  const handleCreateScale = async () => {
    if (!createForm.code.trim() || !createForm.name.trim()) {
      showSnackbar(t('factions:politicalScales.createFieldsError'), 'error');
      return;
    }
    try {
      await politicalScalesApi.create({
        ...createForm,
        worldId: projectId,
        entityType,
        code: createForm.code.trim(),
        name: createForm.name.trim(),
        category: createForm.category,
        leftPoleLabel: createForm.leftPoleLabel.trim(),
        rightPoleLabel: createForm.rightPoleLabel.trim(),
      });
      showSnackbar(t('factions:politicalScales.createSuccess'), 'success');
      setCreateOpen(false);
      setCreateForm((prev) => ({
        ...prev,
        code: '',
        name: '',
        leftPoleLabel: '',
        rightPoleLabel: '',
        leftPoleDescription: '',
        rightPoleDescription: '',
      }));
      await loadAll();
    } catch (e: unknown) {
      showSnackbar(e instanceof Error ? e.message : t('factions:politicalScales.createError'), 'error');
    }
  };

  const updateLocal = (scaleId: number, patch: Partial<LocalAssignment>) => {
    setLocalByScaleId((prev) => {
      const cur = prev[scaleId] || defaultLoc();
      const next = { ...prev, [scaleId]: { ...cur, ...patch } };
      localRef.current = next;
      return next;
    });
  };

  if (loading && scales.length === 0) {
    return (
      <GlassCard sx={{ p: 2, mb: 2 }}>
        <Typography sx={{ color: 'text.secondary' }}>{t('factions:politicalScales.loading')}</Typography>
      </GlassCard>
    );
  }

  return (
    <>
      <CollapsibleSection
        title={t('factions:politicalScales.sectionTitle')}
        icon={<TrackChangesIcon />}
        defaultOpen
        action={
          <Box display="flex" gap={1}>
            <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
              {t('factions:politicalScales.addCustom')}
            </Button>
            <Button size="small" variant="outlined" startIcon={<SettingsIcon />} onClick={() => setManageOpen(true)}>
              {t('factions:politicalScales.manage')}
            </Button>
          </Box>
        }
      >
        <Box display="flex" flexDirection="column" gap={3}>
          {grouped.map(([category, items]) => (
            <Box key={category}>
              <Typography variant="subtitle2" sx={{ mb: 1.25, fontWeight: 700, color: 'text.secondary' }}>
                {t(`factions:politicalScaleGroups.${entityType}.${category}`, { defaultValue: category })}
              </Typography>
              <Box display="flex" flexDirection="column" gap={2.5}>
                {items.map((scale) => {
                  const ld = localizedBuiltinPoliticalScale(scale, t);
                  const loc = localByScaleId[scale.id];
                  const value = loc?.value ?? 0;
                  const enabled = loc?.enabled ?? true;
                  const active = getActiveZone(ld.zones ?? null, value);
                  const noteOpen = Boolean(expandedNotes[scale.id]);
                  return (
                    <GlassCard
                      key={scale.id}
                      sx={{
                        p: 2,
                        opacity: enabled ? 1 : 0.55,
                        border: `1px solid ${alpha(theme.palette.divider, 0.45)}`,
                      }}
                    >
                      <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={2}>
                        <Box flex={1} minWidth={0}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                            {ld.name}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Typography variant="caption" sx={{ width: 120, color: 'text.secondary', flexShrink: 0 }}>
                              {ld.leftPoleLabel}
                            </Typography>
                            <Slider
                              size="small"
                              min={-100}
                              max={100}
                              value={value}
                              disabled={!enabled}
                              onChange={(_, v) => updateLocal(scale.id, { value: v as number })}
                              onChangeCommitted={(_e, v) => {
                                const cur = localRef.current[scale.id] || defaultLoc();
                                const next = {
                                  ...localRef.current,
                                  [scale.id]: { ...cur, value: v as number },
                                };
                                void saveMap(next);
                              }}
                              valueLabelDisplay="auto"
                            />
                            <Typography
                              variant="caption"
                              sx={{ width: 120, textAlign: 'right', color: 'text.secondary', flexShrink: 0 }}
                            >
                              {ld.rightPoleLabel}
                            </Typography>
                          </Box>
                          <ZoneStrip zones={ld.zones ?? null} />
                          <Box mt={1}>
                            {ld.zones?.length ? (
                              <Tooltip
                                title={
                                  active?.description
                                    ? t('factions:politicalScales.zoneTooltipBody', {
                                        label: active.label,
                                        description: active.description,
                                      })
                                    : active?.label || ''
                                }
                              >
                                <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                                  {active ? active.label : t('factions:politicalScales.valueLabel', { value })}
                                </Typography>
                              </Tooltip>
                            ) : (
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {t('factions:politicalScales.valueLabel', { value })}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={enabled}
                              onChange={(e) => {
                                const cur = localRef.current[scale.id] || defaultLoc();
                                const next = {
                                  ...localRef.current,
                                  [scale.id]: { ...cur, enabled: e.target.checked },
                                };
                                void saveMap(next);
                              }}
                              size="small"
                            />
                          }
                          label={t('factions:politicalScales.enabledShort')}
                          sx={{ m: 0, flexShrink: 0 }}
                        />
                      </Box>
                      <Box mt={1}>
                        <Button
                          size="small"
                          onClick={() =>
                            setExpandedNotes((prev) => ({ ...prev, [scale.id]: !prev[scale.id] }))
                          }
                          startIcon={noteOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        >
                          {t('factions:politicalScales.comment')}
                        </Button>
                        <Collapse in={noteOpen}>
                          <TextField
                            fullWidth
                            size="small"
                            sx={{ mt: 1 }}
                            placeholder={t('factions:politicalScales.notePlaceholder')}
                            value={loc?.note ?? ''}
                            onChange={(e) => updateLocal(scale.id, { note: e.target.value || null })}
                            onBlur={() => {
                              void saveMap(localRef.current);
                            }}
                          />
                        </Collapse>
                      </Box>
                    </GlassCard>
                  );
                })}
              </Box>
            </Box>
          ))}
        </Box>
        {saving && (
          <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
            {t('factions:politicalScales.saving')}
          </Typography>
        )}
      </CollapsibleSection>

      <Dialog open={manageOpen} onClose={() => setManageOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('factions:politicalScales.manageDialogTitle')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, pt: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
            {t('factions:politicalScales.manageDialogBody')}
          </Typography>
          {scales.map((s) => {
            const loc = localByScaleId[s.id];
            const enabled = loc?.enabled ?? true;
            const dn = localizedBuiltinPoliticalScale(s, t).name;
            return (
              <Box
                key={s.id}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                gap={1}
                py={0.5}
              >
                <Typography variant="body2" sx={{ minWidth: 0 }}>
                  {dn}
                </Typography>
                <Switch
                  checked={enabled}
                  onChange={(e) => {
                    const cur = localRef.current[s.id] || defaultLoc();
                    const next = {
                      ...localRef.current,
                      [s.id]: { ...cur, enabled: e.target.checked },
                    };
                    localRef.current = next;
                    setLocalByScaleId(next);
                  }}
                />
              </Box>
            );
          })}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManageOpen(false)}>{t('common:cancel')}</Button>
          <Button
            variant="contained"
            onClick={() => {
              void saveMap(localRef.current).then(() => setManageOpen(false));
            }}
          >
            {t('common:save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('factions:politicalScales.createDialogTitle', { projectId })}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
          <TextField
            label={t('factions:politicalScales.codeLabel')}
            value={createForm.code}
            onChange={(e) => setCreateForm((p) => ({ ...p, code: e.target.value }))}
            helperText={t('factions:politicalScales.codeHelper')}
          />
          <TextField
            label={t('factions:politicalScales.axisNameLabel')}
            value={createForm.name}
            onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
          />
          <FormControl fullWidth>
            <InputLabel>{t('factions:politicalScales.categoryLabel')}</InputLabel>
            <Select
              label={t('factions:politicalScales.categoryLabel')}
              value={createForm.category}
              onChange={(e) => setCreateForm((p) => ({ ...p, category: String(e.target.value) }))}
            >
              {politicalScaleCategoryKeys.map((k) => (
                <MenuItem key={k} value={k}>
                  {t(`factions:politicalScaleGroups.${entityType}.${k}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label={t('factions:politicalScales.leftPoleLabel')}
            value={createForm.leftPoleLabel}
            onChange={(e) => setCreateForm((p) => ({ ...p, leftPoleLabel: e.target.value }))}
          />
          <TextField
            label={t('factions:politicalScales.rightPoleLabel')}
            value={createForm.rightPoleLabel}
            onChange={(e) => setCreateForm((p) => ({ ...p, rightPoleLabel: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>{t('common:cancel')}</Button>
          <Button variant="contained" onClick={() => void handleCreateScale()}>
            {t('common:create')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
