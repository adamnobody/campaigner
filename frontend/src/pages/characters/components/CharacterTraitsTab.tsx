import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Collapse,
  Typography,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Link,
  Tab,
  Tabs,
} from '@mui/material';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AddIcon from '@mui/icons-material/Add';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TraitFlipCard } from './TraitFlipCard';
import { CreateTraitDialog } from './CreateTraitDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { EditExclusionsDialog } from '@/components/ui/EditExclusionsDialog';
import { useCharacterTraitsStore } from '@/store/useCharacterTraitsStore';
import { useUIStore } from '@/store/useUIStore';
import { shallow } from 'zustand/shallow';
import type { CharacterTrait } from '@campaigner/shared';
import { uploadAssetUrl } from '@/utils/uploadAssetUrl';
import { getConflictPairs, getExcludingIds, isExcluded } from '@/utils/exclusions';

export interface CharacterTraitsTabProps {
  projectId: number;
  /** `null` when creating a new character (not saved yet). */
  characterId: number | null;
}

export const CharacterTraitsTab: React.FC<CharacterTraitsTabProps> = ({ projectId, characterId }) => {
  const [catalogDialogOpen, setCatalogDialogOpen] = useState(false);
  const [catalogTab, setCatalogTab] = useState<'catalog' | 'create'>('catalog');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [showConflictDetails, setShowConflictDetails] = useState(false);
  const [editingExclusionsTrait, setEditingExclusionsTrait] = useState<CharacterTrait | null>(null);
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
  const assignedIds = useMemo(() => Array.from(assignedTraitIds), [assignedTraitIds]);
  const traitNameById = useMemo(
    () => new Map(traits.map((trait) => [trait.id, trait.name])),
    [traits]
  );
  const conflictPairs = useMemo(() => getConflictPairs(assignedIds, traits), [assignedIds, traits]);

  const attachActionsDisabled = characterId == null || characterId <= 0;
  const canToggle = !attachActionsDisabled;

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

  const getBlockedTooltip = (traitId: number, idsToCheck: number[]): string | null => {
    const conflictingIds = getExcludingIds(traitId, idsToCheck, traits);
    if (conflictingIds.length === 0) return null;
    const names = conflictingIds.map((id) => traitNameById.get(id) ?? `#${id}`);
    return `Исключено: ${names.join(', ')}`;
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          mb: 2.5,
        }}
      >
        <SectionHeader icon={<PsychologyIcon sx={{ fontSize: '1.2rem' }} />} title="Черты характера" />
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => {
            setCatalogTab('catalog');
            setCatalogDialogOpen(true);
          }}
          disabled={attachActionsDisabled}
        >
          Добавить черту
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
            Обнаружены конфликтующие черты. Удалите лишние для корректной работы.
          </Alert>
          <Collapse in={showConflictDetails} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 1.5, display: 'grid', gap: 1 }}>
              {conflictPairs.map((pair) => {
                const leftName = traitNameById.get(pair.leftId) ?? `#${pair.leftId}`;
                const rightName = traitNameById.get(pair.rightId) ?? `#${pair.rightId}`;
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
                          if (characterId == null) return;
                          toggleAssign(characterId, pair.leftId);
                        }}
                      >
                        Убрать {leftName}
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {
                          if (characterId == null) return;
                          toggleAssign(characterId, pair.rightId);
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

      {loading && traits.length === 0 ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={32} />
        </Box>
      ) : characterId == null || characterId <= 0 ? (
        <EmptyState
          icon={<PsychologyIcon />}
          title="Сначала сохраните персонажа"
          description="После сохранения можно выбирать и настраивать черты характера."
        />
      ) : attachedTraits.length === 0 ? (
        <EmptyState
          icon={<PsychologyIcon />}
          title="Черты пока не выбраны"
          description="Откройте каталог, чтобы прикрепить встроенные или пользовательские черты."
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          {attachedTraits.map((t) => (
            <TraitFlipCard
              key={t.id}
              name={t.name}
              description={t.description}
              imageSrc={uploadAssetUrl(t.imagePath)}
              isAttached={assignedTraitIds.has(t.id)}
              isCustom={!t.isPredefined}
              onDelete={
                t.isPredefined ? undefined : () => handleDeleteTrait(t.id, t.name)
              }
              onConfigureExclusions={() => setEditingExclusionsTrait(t)}
              isBlocked={Boolean(getBlockedTooltip(t.id, assignedIds))}
              blockedTooltip={getBlockedTooltip(t.id, assignedIds) ?? undefined}
              attachActionsDisabled={attachActionsDisabled}
              onToggleAttach={() => {
                if (!canToggle || characterId == null) return;
                toggleAssign(characterId, t.id);
              }}
            />
          ))}
        </Box>
      )}

      <Dialog open={catalogDialogOpen} onClose={() => setCatalogDialogOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle>Каталог черт характера</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Tabs value={catalogTab} onChange={(_, value) => setCatalogTab(value)} sx={{ mb: 2 }}>
            <Tab value="catalog" label="Каталог" />
            <Tab value="create" label="Создать свою" />
          </Tabs>

          {catalogTab === 'catalog' ? (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '16px',
                pb: 1,
              }}
            >
              {sortedTraits.map((t) => (
                (() => {
                  const isAttached = assignedTraitIds.has(t.id);
                  const blocked = !isAttached && isExcluded(t.id, assignedIds, traits);
                  const tooltip = blocked ? getBlockedTooltip(t.id, assignedIds) : null;
                  return (
                <TraitFlipCard
                  key={t.id}
                  name={t.name}
                  description={t.description}
                  imageSrc={uploadAssetUrl(t.imagePath)}
                  isAttached={isAttached}
                  isCustom={!t.isPredefined}
                  onDelete={t.isPredefined ? undefined : () => handleDeleteTrait(t.id, t.name)}
                  onConfigureExclusions={() => setEditingExclusionsTrait(t)}
                  isBlocked={blocked}
                  blockedTooltip={tooltip ?? undefined}
                  attachActionsDisabled={attachActionsDisabled}
                  onToggleAttach={() => {
                    if (!canToggle || characterId == null) return;
                    toggleAssign(characterId, t.id);
                  }}
                />
                  );
                })()
              ))}
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Создайте пользовательскую черту для текущего проекта. После сохранения она сразу появится в каталоге.
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDialogOpen(true)}>
                Создать черту
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <CreateTraitDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        projectId={projectId}
      />

      <EditExclusionsDialog
        open={Boolean(editingExclusionsTrait)}
        onClose={() => setEditingExclusionsTrait(null)}
        title={editingExclusionsTrait ? `Исключения: ${editingExclusionsTrait.name}` : 'Исключения'}
        label="Исключает черты:"
        options={traits.map((trait) => ({ id: trait.id, name: trait.name }))}
        selfId={editingExclusionsTrait?.id ?? 0}
        selectedIds={editingExclusionsTrait?.exclusions ?? []}
        onSave={async (excludedIds) => {
          if (!editingExclusionsTrait) return;
          await updateExclusions(editingExclusionsTrait.id, excludedIds);
          showSnackbar('Исключения черты обновлены', 'success');
        }}
      />
    </Box>
  );
};
