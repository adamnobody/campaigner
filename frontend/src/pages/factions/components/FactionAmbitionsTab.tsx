import React, { useEffect, useMemo, useState } from 'react';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { shallow } from 'zustand/shallow';
import type { Ambition } from '@campaigner/shared';
import { ExclusionCatalogTab, type ExclusionItem } from '@/components/exclusions/ExclusionCatalogTab';
import { AmbitionFlipCard } from './AmbitionFlipCard';
import { CreateAmbitionDialog } from './CreateAmbitionDialog';
import { useAmbitionsStore } from '@/store/useAmbitionsStore';
import { useUIStore } from '@/store/useUIStore';
import { uploadAssetUrl } from '@/utils/uploadAssetUrl';
import { localizedPredefinedAmbitionTexts } from '@/i18n/catalog/displayBuiltinTexts';

interface FactionAmbitionsTabProps {
  projectId: number;
  factionId: number | null;
}

type AmbitionCatalogRow = Ambition & ExclusionItem;

type CreateAmbitionExtra = { editingAmbition?: Ambition | null };

function mapAmbitionCatalogRow(ambition: Ambition, translate: TFunction): AmbitionCatalogRow {
  const loc = localizedPredefinedAmbitionTexts(ambition, translate);
  return {
    ...ambition,
    imagePath: ambition.iconPath,
    displayLabel: loc.displayLabel,
    displayDescription: loc.displayDescription,
  };
}

export const FactionAmbitionsTab: React.FC<FactionAmbitionsTabProps> = ({ projectId, factionId }) => {
  const { t, i18n } = useTranslation(['factions', 'common']);
  const [editingAmbition, setEditingAmbition] = useState<Ambition | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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

  const sortLocale =
    typeof i18n.resolvedLanguage === 'string'
      ? i18n.resolvedLanguage
      : i18n.language?.startsWith('ru')
        ? 'ru'
        : 'en';

  const exclusionsCatalog = useMemo(
    () =>
      catalog.map((ambition) => ({
        ...ambition,
        displayLabel: localizedPredefinedAmbitionTexts(ambition, t).displayLabel,
      })),
    [catalog, t]
  );

  const attachedAmbitions = useMemo(() => {
    return catalog
      .filter((ambition) => factionAmbitionIds.has(ambition.id))
      .sort((a, b) =>
        localizedPredefinedAmbitionTexts(a, t).displayLabel.localeCompare(
          localizedPredefinedAmbitionTexts(b, t).displayLabel,
          sortLocale,
          { sensitivity: 'base' }
        )
      );
  }, [catalog, factionAmbitionIds, t, sortLocale]);

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
    () => sortedCatalog.map((ambition) => mapAmbitionCatalogRow(ambition, t)),
    [sortedCatalog, t]
  );

  const assignedMainItems = useMemo<AmbitionCatalogRow[]>(
    () => attachedAmbitions.map((ambition) => mapAmbitionCatalogRow(ambition, t)),
    [attachedAmbitions, t]
  );

  const assignedIds = useMemo(() => Array.from(factionAmbitionIds), [factionAmbitionIds]);

  const attachActionsDisabled = factionId == null || factionId <= 0;

  const handleToggleAssign = (ambitionId: number) => {
    if (factionId == null || factionId <= 0) return;
    void toggleAssign(factionId, ambitionId);
  };

  const handleDeleteAmbition = (ambition: AmbitionCatalogRow) => {
    const displayName = ambition.displayLabel ?? ambition.name;
    showConfirmDialog(
      t('factions:ambitions.confirmDeleteTitle'),
      t('factions:ambitions.confirmDeleteMessage', { name: displayName }),
      async () => {
        try {
          await deleteAmbition(ambition.id);
          showSnackbar(t('factions:ambitions.deleted'), 'success');
        } catch (error: unknown) {
          showSnackbar(error instanceof Error ? error.message : t('factions:ambitions.deleteFailed'), 'error');
        }
      }
    );
  };

  return (
    <ExclusionCatalogTab<AmbitionCatalogRow, CreateAmbitionExtra>
      projectId={projectId}
      title={t('factions:ambitions.tabTitle')}
      icon={<TrackChangesIcon sx={{ fontSize: '1.2rem' }} />}
      addButtonLabel={t('factions:ambitions.add')}
      catalogDialogTitle={t('factions:ambitions.catalogTitle')}
      createTabDescription={t('factions:ambitions.createTabDescription')}
      createButtonLabel={t('factions:ambitions.create')}
      emptyNotSavedTitle={t('factions:ambitions.emptyNotSavedTitle')}
      emptyNotSavedDescription={t('factions:ambitions.emptyNotSavedDescription')}
      emptyNoAssignedTitle={t('factions:ambitions.emptyNoneTitle')}
      emptyNoAssignedDescription={t('factions:ambitions.emptyNoneDescription')}
      emptyNoAssignedActionLabel={t('factions:ambitions.openCatalog')}
      emptyStateIcon={<TrackChangesIcon />}
      conflictAlertText={t('factions:ambitions.conflictAlert')}
      exclusionsDialogLabel={t('factions:ambitions.exclusionsLabel')}
      exclusionsSavedSnackbar={t('factions:ambitions.exclusionsSaved')}
      exclusionsCatalog={exclusionsCatalog}
      items={items}
      assignedMainItems={assignedMainItems}
      assignedIds={assignedIds}
      error={error}
      attachActionsDisabled={attachActionsDisabled}
      isEntitySaved={factionId != null && factionId > 0}
      showInitialSpinner={loading && catalog.length === 0}
      onToggleAssign={handleToggleAssign}
      onUpdateExclusions={updateExclusions}
      gridMinColumnWidth={220}
      CreateDialog={CreateAmbitionDialog}
      createDialogExtraProps={{ editingAmbition }}
      createDialogOpen={createDialogOpen}
      onCreateDialogOpenChange={setCreateDialogOpen}
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
          name={item.displayLabel ?? item.name}
          description={item.displayDescription ?? item.description}
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
                  setCreateDialogOpen(true);
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
