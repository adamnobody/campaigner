import React, { useEffect, useMemo } from 'react';
import { Box, Button, Tooltip, Typography, CircularProgress } from '@mui/material';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AddIcon from '@mui/icons-material/Add';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TraitFlipCard } from './TraitFlipCard';
import { useCharacterTraitsStore } from '@/store/useCharacterTraitsStore';
import { shallow } from 'zustand/shallow';
import type { CharacterTrait } from '@campaigner/shared';

export interface CharacterTraitsTabProps {
  projectId: number;
  /** `null` when creating a new character (not saved yet). */
  characterId: number | null;
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
    }),
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
        <Tooltip title="Скоро будет доступно">
          <span>
            <Button variant="outlined" disabled startIcon={<AddIcon />}>
              Добавить свою черту
            </Button>
          </span>
        </Tooltip>
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
              imageSrc={t.imagePath}
              isAttached={assignedTraitIds.has(t.id)}
              isCustom={!t.isPredefined}
              attachActionsDisabled={attachActionsDisabled}
              onToggleAttach={() => {
                if (!canToggle || characterId == null) return;
                toggleAssign(characterId, t.id);
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};
