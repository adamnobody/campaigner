import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Collapse,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Link,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import { shallow } from 'zustand/shallow';
import type { Ambition } from '@campaigner/shared';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { EditExclusionsDialog } from '@/components/ui/EditExclusionsDialog';
import { uploadAssetUrl } from '@/utils/uploadAssetUrl';
import { useUIStore } from '@/store/useUIStore';
import { useAmbitionsStore } from '@/store/useAmbitionsStore';
import { AmbitionFlipCard } from './AmbitionFlipCard';
import { CreateAmbitionDialog } from './CreateAmbitionDialog';
import { getConflictPairs, getExcludingIds, isExcluded } from '@/utils/exclusions';

interface FactionAmbitionsTabProps {
  projectId: number;
  factionId: number | null;
}

export const FactionAmbitionsTab: React.FC<FactionAmbitionsTabProps> = ({ projectId, factionId }) => {
  const [catalogDialogOpen, setCatalogDialogOpen] = useState(false);
  const [catalogTab, setCatalogTab] = useState<'catalog' | 'create'>('catalog');
  const [editingAmbition, setEditingAmbition] = useState<Ambition | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingExclusionsAmbition, setEditingExclusionsAmbition] = useState<Ambition | null>(null);
  const [showConflictDetails, setShowConflictDetails] = useState(false);

  const {
    catalog,
    factionAmbitionIds,
    loading,
    error,
    fetchCatalog,
    fetchFactionAmbitions,
    clearFactionAmbitions,
    toggleAssign,
    updateExclusions,
    deleteAmbition,
  } = useAmbitionsStore(
    (state) => ({
      catalog: state.catalog,
      factionAmbitionIds: state.factionAmbitionIds,
      loading: state.loading,
      error: state.error,
      fetchCatalog: state.fetchCatalog,
      fetchFactionAmbitions: state.fetchFactionAmbitions,
      clearFactionAmbitions: state.clearFactionAmbitions,
      toggleAssign: state.toggleAssign,
      updateExclusions: state.updateExclusions,
      deleteAmbition: state.deleteAmbition,
    }),
    shallow
  );

  const { showConfirmDialog, showSnackbar } = useUIStore(
    (state) => ({
      showConfirmDialog: state.showConfirmDialog,
      showSnackbar: state.showSnackbar,
    }),
    shallow
  );

  useEffect(() => {
    fetchCatalog(projectId);
  }, [projectId, fetchCatalog]);

  useEffect(() => {
    if (factionId != null && factionId > 0) {
      fetchFactionAmbitions(factionId);
    } else {
      clearFactionAmbitions();
    }
  }, [factionId, fetchFactionAmbitions, clearFactionAmbitions]);

  const attachedAmbitions = useMemo(() => {
    return catalog
      .filter((ambition) => factionAmbitionIds.has(ambition.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }, [catalog, factionAmbitionIds]);

  const sortedCatalog = useMemo(() => {
    const attached: Ambition[] = [];
    const detached: Ambition[] = [];
    for (const ambition of catalog) {
      if (factionAmbitionIds.has(ambition.id)) attached.push(ambition);
      else detached.push(ambition);
    }
    return [...attached, ...detached];
  }, [catalog, factionAmbitionIds]);

  const attachActionsDisabled = factionId == null || factionId <= 0;
  const assignedIds = useMemo(() => Array.from(factionAmbitionIds), [factionAmbitionIds]);
  const ambitionNameById = useMemo(
    () => new Map(catalog.map((ambition) => [ambition.id, ambition.name])),
    [catalog]
  );
  const conflictPairs = useMemo(() => getConflictPairs(assignedIds, catalog), [assignedIds, catalog]);

  const getBlockedTooltip = (ambitionId: number, idsToCheck: number[]): string | null => {
    const conflictingIds = getExcludingIds(ambitionId, idsToCheck, catalog);
    if (conflictingIds.length === 0) return null;
    const names = conflictingIds.map((id) => ambitionNameById.get(id) ?? `#${id}`);
    return `Исключено: ${names.join(', ')}`;
  };

  const handleDeleteAmbition = (ambition: Ambition) => {
    showConfirmDialog(
      'Удалить амбицию',
      `Удалить амбицию «${ambition.name}»?\nОна будет удалена у всех фракций проекта.\nЭто действие нельзя отменить.`,
      async () => {
        try {
          await deleteAmbition(ambition.id);
          showSnackbar('Амбиция удалена', 'success');
        } catch (error: unknown) {
          showSnackbar(error instanceof Error ? error.message : 'Не удалось удалить амбицию', 'error');
        }
      }
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2.5 }}>
        <SectionHeader icon={<TrackChangesIcon sx={{ fontSize: '1.2rem' }} />} title="Амбиции фракции" />
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => {
            setCatalogTab('catalog');
            setCatalogDialogOpen(true);
          }}
          disabled={attachActionsDisabled}
        >
          Добавить амбицию
        </Button>
      </Box>

      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      {conflictPairs.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Alert
            severity="warning"
            action={
              <Link
                component="button"
                type="button"
                underline="hover"
                onClick={() => setShowConflictDetails((prev) => !prev)}
              >
                Подробнее
              </Link>
            }
          >
            Обнаружены конфликтующие амбиции. Удалите лишние для корректной работы.
          </Alert>
          <Collapse in={showConflictDetails} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 1.5, display: 'grid', gap: 1 }}>
              {conflictPairs.map((pair) => {
                const leftName = ambitionNameById.get(pair.leftId) ?? `#${pair.leftId}`;
                const rightName = ambitionNameById.get(pair.rightId) ?? `#${pair.rightId}`;
                return (
                  <Box
                    key={`${pair.leftId}:${pair.rightId}`}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1.5,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {leftName} ↔ {rightName}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        onClick={() => {
                          if (factionId == null) return;
                          toggleAssign(factionId, pair.leftId);
                        }}
                      >
                        Убрать {leftName}
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {
                          if (factionId == null) return;
                          toggleAssign(factionId, pair.rightId);
                        }}
                      >
                        Убрать {rightName}
                      </Button>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Collapse>
        </Box>
      )}

      {loading && catalog.length === 0 ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={32} />
        </Box>
      ) : factionId == null || factionId <= 0 ? (
        <EmptyState
          icon={<TrackChangesIcon />}
          title="Сначала сохраните фракцию"
          description="После сохранения можно добавлять и настраивать амбиции."
        />
      ) : attachedAmbitions.length === 0 ? (
        <EmptyState
          icon={<TrackChangesIcon />}
          title="Амбиций пока нет"
          description="Добавьте амбиции из каталога или создайте пользовательскую."
          actionLabel="Открыть каталог"
          onAction={() => {
            setCatalogTab('catalog');
            setCatalogDialogOpen(true);
          }}
        />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 2,
          }}
        >
          {attachedAmbitions.map((ambition) => (
            <AmbitionFlipCard
              key={ambition.id}
              id={ambition.id}
              name={ambition.name}
              description={ambition.description}
              imageSrc={uploadAssetUrl(ambition.iconPath)}
              isAttached={true}
              isCustom={ambition.isCustom}
              attachActionsDisabled={attachActionsDisabled}
              onConfigureExclusions={() => setEditingExclusionsAmbition(ambition)}
              isBlocked={Boolean(getBlockedTooltip(ambition.id, assignedIds))}
              blockedTooltip={getBlockedTooltip(ambition.id, assignedIds) ?? undefined}
              onToggleAttach={() => {
                if (attachActionsDisabled || factionId == null) return;
                toggleAssign(factionId, ambition.id);
              }}
              onEdit={
                ambition.isCustom
                  ? () => {
                      setEditingAmbition(ambition);
                      setEditDialogOpen(true);
                    }
                  : undefined
              }
              onDeleteAmbition={
                ambition.isCustom
                  ? () => {
                      handleDeleteAmbition(ambition);
                    }
                  : undefined
              }
            />
          ))}
        </Box>
      )}

      <Dialog open={catalogDialogOpen} onClose={() => setCatalogDialogOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle>Каталог амбиций</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Tabs
            value={catalogTab}
            onChange={(_, value) => setCatalogTab(value)}
            sx={{ mb: 2 }}
          >
            <Tab value="catalog" label="Каталог" />
            <Tab value="create" label="Создать свою" />
          </Tabs>

          {catalogTab === 'catalog' ? (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 2,
                pb: 1,
              }}
            >
              {sortedCatalog.map((ambition) => (
                (() => {
                  const isAttached = factionAmbitionIds.has(ambition.id);
                  const blocked = !isAttached && isExcluded(ambition.id, assignedIds, catalog);
                  const tooltip = blocked ? getBlockedTooltip(ambition.id, assignedIds) : null;
                  return (
                <AmbitionFlipCard
                  key={ambition.id}
                  id={ambition.id}
                  name={ambition.name}
                  description={ambition.description}
                  imageSrc={uploadAssetUrl(ambition.iconPath)}
                  isAttached={isAttached}
                  isCustom={ambition.isCustom}
                  attachActionsDisabled={attachActionsDisabled}
                  onConfigureExclusions={() => setEditingExclusionsAmbition(ambition)}
                  isBlocked={blocked}
                  blockedTooltip={tooltip ?? undefined}
                  onToggleAttach={() => {
                    if (attachActionsDisabled || factionId == null) return;
                    toggleAssign(factionId, ambition.id);
                  }}
                  onEdit={
                    ambition.isCustom
                      ? () => {
                          setEditingAmbition(ambition);
                          setEditDialogOpen(true);
                        }
                      : undefined
                  }
                  onDeleteAmbition={
                    ambition.isCustom
                      ? () => {
                          handleDeleteAmbition(ambition);
                        }
                      : undefined
                  }
                />
                  );
                })()
              ))}
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Создайте пользовательскую амбицию для текущего проекта. После сохранения она сразу появится в каталоге.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingAmbition(null);
                  setEditDialogOpen(true);
                }}
              >
                Создать амбицию
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <CreateAmbitionDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingAmbition(null);
        }}
        projectId={projectId}
        editingAmbition={editingAmbition}
      />

      <EditExclusionsDialog
        open={Boolean(editingExclusionsAmbition)}
        onClose={() => setEditingExclusionsAmbition(null)}
        title={editingExclusionsAmbition ? `Исключения: ${editingExclusionsAmbition.name}` : 'Исключения'}
        label="Исключает амбиции:"
        options={catalog.map((ambition) => ({ id: ambition.id, name: ambition.name }))}
        selfId={editingExclusionsAmbition?.id ?? 0}
        selectedIds={editingExclusionsAmbition?.exclusions ?? []}
        onSave={async (excludedIds) => {
          if (!editingExclusionsAmbition) return;
          await updateExclusions(editingExclusionsAmbition.id, excludedIds);
          showSnackbar('Исключения амбиции обновлены', 'success');
        }}
      />
    </Box>
  );
};
