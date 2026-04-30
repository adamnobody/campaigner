import React, { useEffect, useMemo } from 'react';
import PsychologyIcon from '@mui/icons-material/Psychology';
import { shallow } from 'zustand/shallow';
import type { CharacterTrait } from '@campaigner/shared';
import { ExclusionCatalogTab, type ExclusionItem } from '@/components/exclusions/ExclusionCatalogTab';
import { CreateTraitDialog } from './CreateTraitDialog';
import { TraitFlipCard } from './TraitFlipCard';
import { useCharacterTraitsStore } from '@/store/useCharacterTraitsStore';
import { useUIStore } from '@/store/useUIStore';
import { uploadAssetUrl } from '@/utils/uploadAssetUrl';

export interface CharacterTraitsTabProps {
  projectId: number;
  /** `null` when creating a new character (not saved yet). */
  characterId: number | null;
}

type TraitCatalogRow = CharacterTrait & ExclusionItem;

function mapTraitCatalogRow(trait: CharacterTrait): TraitCatalogRow {
  return {
    ...trait,
    isCustom: !trait.isPredefined,
    imagePath: trait.imagePath,
  };
}

export const CharacterTraitsTab: React.FC<CharacterTraitsTabProps> = ({ projectId, characterId }) => {
  const {
    traits,
    assignedTraitIds,
    loading,
    error,
    fetchTraits,
    fetchAssigned,
    clearAssigned,
    toggleAssign,
    updateExclusions,
    deleteTrait,
  } = useCharacterTraitsStore(
    (s) => ({
      traits: s.traits,
      assignedTraitIds: s.assignedTraitIds,
      loading: s.loading,
      error: s.error,
      fetchTraits: s.fetchTraits,
      fetchAssigned: s.fetchAssigned,
      clearAssigned: s.clearAssigned,
      toggleAssign: s.toggleAssign,
      updateExclusions: s.updateExclusions,
      deleteTrait: s.deleteTrait,
    }),
    shallow
  );
  const { showConfirmDialog, showSnackbar } = useUIStore(
    (s) => ({ showConfirmDialog: s.showConfirmDialog, showSnackbar: s.showSnackbar }),
    shallow
  );

  useEffect(() => {
    fetchTraits(projectId);
  }, [projectId, fetchTraits]);

  useEffect(() => {
    if (characterId != null && characterId > 0) {
      fetchAssigned(characterId);
    } else {
      clearAssigned();
    }
  }, [characterId, fetchAssigned, clearAssigned]);

  const sortedTraits = useMemo(() => {
    const attached: CharacterTrait[] = [];
    const rest: CharacterTrait[] = [];
    for (const t of traits) {
      if (assignedTraitIds.has(t.id)) attached.push(t);
      else rest.push(t);
    }
    return [...attached, ...rest];
  }, [traits, assignedTraitIds]);

  const attachedTraits = useMemo(
    () => traits.filter((trait) => assignedTraitIds.has(trait.id)),
    [traits, assignedTraitIds]
  );

  const items = useMemo<TraitCatalogRow[]>(
    () => sortedTraits.map(mapTraitCatalogRow),
    [sortedTraits]
  );

  const assignedMainItems = useMemo<TraitCatalogRow[]>(
    () => attachedTraits.map(mapTraitCatalogRow),
    [attachedTraits]
  );

  const assignedIds = useMemo(() => Array.from(assignedTraitIds), [assignedTraitIds]);

  const attachActionsDisabled = characterId == null || characterId <= 0;
  const canToggle = !attachActionsDisabled;

  const handleToggleAssign = (traitId: number) => {
    if (characterId == null || characterId <= 0) return;
    void toggleAssign(characterId, traitId);
  };

  const handleDeleteTrait = (traitId: number, traitName: string) => {
    showConfirmDialog(
      'Удалить черту',
      `Удалить черту «${traitName}»?\nОна будет убрана у всех персонажей проекта.\nЭто действие нельзя отменить.`,
      async () => {
        try {
          await deleteTrait(traitId);
          showSnackbar('Черта удалена', 'success');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Не удалось удалить черту';
          showSnackbar(message, 'error');
        }
      }
    );
  };

  return (
    <ExclusionCatalogTab<TraitCatalogRow, object>
      projectId={projectId}
      title="Черты характера"
      icon={<PsychologyIcon sx={{ fontSize: '1.2rem' }} />}
      addButtonLabel="Добавить черту"
      catalogDialogTitle="Каталог черт характера"
      createTabDescription="Создайте пользовательскую черту для текущего проекта. После сохранения она сразу появится в каталоге."
      createButtonLabel="Создать черту"
      emptyNotSavedTitle="Сначала сохраните персонажа"
      emptyNotSavedDescription="После сохранения можно выбирать и настраивать черты характера."
      emptyNoAssignedTitle="Черты пока не выбраны"
      emptyNoAssignedDescription="Откройте каталог, чтобы прикрепить встроенные или пользовательские черты."
      emptyNoAssignedActionLabel="Открыть каталог"
      emptyStateIcon={<PsychologyIcon />}
      conflictAlertText="Обнаружены конфликтующие черты. Удалите лишние для корректной работы."
      exclusionsDialogLabel="Исключает черты:"
      exclusionsSavedSnackbar="Исключения черты обновлены"
      exclusionsCatalog={traits}
      items={items}
      assignedMainItems={assignedMainItems}
      assignedIds={assignedIds}
      error={error}
      attachActionsDisabled={attachActionsDisabled}
      isEntitySaved={characterId != null && characterId > 0}
      showInitialSpinner={loading && traits.length === 0}
      onToggleAssign={handleToggleAssign}
      onUpdateExclusions={updateExclusions}
      gridMinColumnWidth={200}
      gridGap="16px"
      catalogHeaderExtraSx={{ flexWrap: 'wrap' }}
      CreateDialog={CreateTraitDialog}
      renderCard={({
        item,
        isAttached,
        isBlocked,
        blockedTooltip,
        attachActionsDisabled: attachDisabled,
        onConfigureExclusions,
      }) => (
        <TraitFlipCard
          name={item.name}
          description={item.description}
          imageSrc={uploadAssetUrl(item.imagePath)}
          isAttached={isAttached}
          isCustom={item.isCustom}
          onDelete={
            item.isCustom ? undefined : () => handleDeleteTrait(item.id, item.name)
          }
          onConfigureExclusions={onConfigureExclusions}
          isBlocked={isBlocked}
          blockedTooltip={blockedTooltip}
          attachActionsDisabled={attachDisabled}
          onToggleAttach={() => {
            if (!canToggle || characterId == null) return;
            void toggleAssign(characterId, item.id);
          }}
        />
      )}
    />
  );
};
