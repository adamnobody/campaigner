import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AddIcon from '@mui/icons-material/Add';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TraitFlipCard } from './TraitFlipCard';
import { CreateTraitDialog } from './CreateTraitDialog';
import { useCharacterTraitsStore } from '@/store/useCharacterTraitsStore';
import { useUIStore } from '@/store/useUIStore';
import { shallow } from 'zustand/shallow';
import type { CharacterTrait } from '@campaigner/shared';
import { uploadAssetUrl } from '@/utils/uploadAssetUrl';

export interface CharacterTraitsTabProps {
  projectId: number;
  /** `null` when creating a new character (not saved yet). */
  characterId: number | null;
}

export const CharacterTraitsTab: React.FC<CharacterTraitsTabProps> = ({ projectId, characterId }) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const {
    traits,
    assignedTraitIds,
    loading,
    error,
    fetchTraits,
    fetchAssigned,
    clearAssigned,
    toggleAssign,
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
        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setCreateDialogOpen(true)}>
          Добавить свою черту
        </Button>
      </Box>

      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {loading && traits.length === 0 ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          {sortedTraits.map((t) => (
            <TraitFlipCard
              key={t.id}
              id={t.id}
              name={t.name}
              description={t.description}
              imageSrc={uploadAssetUrl(t.imagePath)}
              isAttached={assignedTraitIds.has(t.id)}
              isCustom={!t.isPredefined}
              onDelete={
                t.isPredefined ? undefined : () => handleDeleteTrait(t.id, t.name)
              }
              attachActionsDisabled={attachActionsDisabled}
              onToggleAttach={() => {
                if (!canToggle || characterId == null) return;
                toggleAssign(characterId, t.id);
              }}
            />
          ))}
        </Box>
      )}
      <CreateTraitDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        projectId={projectId}
      />
    </Box>
  );
};
