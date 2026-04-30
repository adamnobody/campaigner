import React, { useEffect, useMemo, useState } from 'react';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import { shallow } from 'zustand/shallow';
import type { Ambition } from '@campaigner/shared';
import { ExclusionCatalogTab, type ExclusionItem } from '@/components/exclusions/ExclusionCatalogTab';
import { AmbitionFlipCard } from './AmbitionFlipCard';
import { CreateAmbitionDialog } from './CreateAmbitionDialog';
import { useAmbitionsStore } from '@/store/useAmbitionsStore';
import { useUIStore } from '@/store/useUIStore';
import { uploadAssetUrl } from '@/utils/uploadAssetUrl';

interface FactionAmbitionsTabProps {
  projectId: number;
  factionId: number | null;
}

type AmbitionCatalogRow = Ambition & ExclusionItem;

type CreateAmbitionExtra = { editingAmbition?: Ambition | null };

export const FactionAmbitionsTab: React.FC<FactionAmbitionsTabProps> = ({ projectId, factionId }) => {
  const [editingAmbition, setEditingAmbition] = useState<Ambition | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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

  const items = useMemo<AmbitionCatalogRow[]>(
    () =>
      sortedCatalog.map((ambition) => ({
        ...ambition,
        imagePath: ambition.iconPath,
      })),
    [sortedCatalog]
  );

  const assignedMainItems = useMemo<AmbitionCatalogRow[]>(
    () =>
      attachedAmbitions.map((ambition) => ({
        ...ambition,
        imagePath: ambition.iconPath,
      })),
    [attachedAmbitions]
  );

  const assignedIds = useMemo(() => Array.from(factionAmbitionIds), [factionAmbitionIds]);

  const attachActionsDisabled = factionId == null || factionId <= 0;

  const handleToggleAssign = (ambitionId: number) => {
    if (factionId == null || factionId <= 0) return;
    void toggleAssign(factionId, ambitionId);
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
    <ExclusionCatalogTab<AmbitionCatalogRow, CreateAmbitionExtra>
      projectId={projectId}
      title="Амбиции фракции"
      icon={<TrackChangesIcon sx={{ fontSize: '1.2rem' }} />}
      addButtonLabel="Добавить амбицию"
      catalogDialogTitle="Каталог амбиций"
      createTabDescription="Создайте пользовательскую амбицию для текущего проекта. После сохранения она сразу появится в каталоге."
      createButtonLabel="Создать амбицию"
      emptyNotSavedTitle="Сначала сохраните фракцию"
      emptyNotSavedDescription="После сохранения можно добавлять и настраивать амбиции."
      emptyNoAssignedTitle="Амбиций пока нет"
      emptyNoAssignedDescription="Добавьте амбиции из каталога или создайте пользовательскую."
      emptyNoAssignedActionLabel="Открыть каталог"
      emptyStateIcon={<TrackChangesIcon />}
      conflictAlertText="Обнаружены конфликтующие амбиции. Удалите лишние для корректной работы."
      exclusionsDialogLabel="Исключает амбиции:"
      exclusionsSavedSnackbar="Исключения амбиции обновлены"
      exclusionsCatalog={catalog}
      items={items}
      assignedMainItems={assignedMainItems}
      assignedIds={assignedIds}
      loading={loading}
      error={error}
      attachActionsDisabled={attachActionsDisabled}
      isEntitySaved={factionId != null && factionId > 0}
      showInitialSpinner={loading && catalog.length === 0}
      onToggleAssign={handleToggleAssign}
      onUpdateExclusions={updateExclusions}
      gridMinColumnWidth={220}
      CreateDialog={CreateAmbitionDialog}
      createDialogExtraProps={{ editingAmbition }}
      createDialogOpen={editDialogOpen}
      onCreateDialogOpenChange={setEditDialogOpen}
      onCreateDialogClose={() => setEditingAmbition(null)}
      prepareCreateNew={() => setEditingAmbition(null)}
      renderCard={({
        item,
        isAttached,
        isBlocked,
        blockedTooltip,
        attachActionsDisabled: attachDisabled,
        onConfigureExclusions,
      }) => (
        <AmbitionFlipCard
          name={item.name}
          description={item.description}
          imageSrc={uploadAssetUrl(item.iconPath)}
          isAttached={isAttached}
          isCustom={item.isCustom}
          attachActionsDisabled={attachDisabled}
          onConfigureExclusions={onConfigureExclusions}
          isBlocked={isBlocked}
          blockedTooltip={blockedTooltip}
          onToggleAttach={() => {
            if (attachActionsDisabled || factionId == null) return;
            void toggleAssign(factionId, item.id);
          }}
          onEdit={
            item.isCustom
              ? () => {
                  setEditingAmbition(item);
                  setEditDialogOpen(true);
                }
              : undefined
          }
          onDeleteAmbition={
            item.isCustom
              ? () => {
                  handleDeleteAmbition(item);
                }
              : undefined
          }
        />
      )}
    />
  );
};
