import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useMapStore } from '@/store/useMapStore';
import { useCharacterStore } from '@/store/useCharacterStore';
import { useCharacterTraitsStore } from '@/store/useCharacterTraitsStore';
import { useFactionStore } from '@/store/useFactionStore';
import { useDynastyStore } from '@/store/useDynastyStore';
import { useNoteStore } from '@/store/useNoteStore';
import { useWikiStore } from '@/store/useWikiStore';
import { useTimelineStore } from '@/store/useTimelineStore';
import { useDogmaStore } from '@/store/useDogmaStore';
import { useTagStore } from '@/store/useTagStore';
import { useBranchStore } from '@/store/useBranchStore';

export const useProjectScope = (): number | null => {
  const { projectId: projectIdParam } = useParams<{ projectId?: string }>();
  const projectId = projectIdParam ? Number(projectIdParam) : null;
  const currentProjectId = Number.isFinite(projectId) ? projectId : null;
  const previousProjectIdRef = useRef<number | null>(null);
  const previousBranchScopeRef = useRef<string | null>(null);

  const activeBranchId = useBranchStore((s) => s.activeBranchId);
  const branchStoreProjectId = useBranchStore((s) => s.activeProjectId);

  useEffect(() => {
    const previousProjectId = previousProjectIdRef.current;
    const shouldReset =
      previousProjectId !== null &&
      currentProjectId !== null &&
      previousProjectId !== currentProjectId;

    if (shouldReset) {
      useMapStore.getState().reset();
      useCharacterStore.getState().reset();
      useCharacterTraitsStore.getState().reset();
      useFactionStore.getState().reset();
      useDynastyStore.getState().reset();
      useNoteStore.getState().reset();
      useWikiStore.getState().reset();
      useTimelineStore.getState().reset();
      useDogmaStore.getState().reset();
      useTagStore.getState().reset();
      useBranchStore.getState().reset();
      previousBranchScopeRef.current = null;
    }

    previousProjectIdRef.current = currentProjectId;
  }, [currentProjectId]);

  useEffect(() => {
    if (currentProjectId === null) {
      previousBranchScopeRef.current = null;
      return;
    }

    if (branchStoreProjectId !== currentProjectId) {
      return;
    }

    const key = `${currentProjectId}:${activeBranchId ?? 'none'}`;
    const prev = previousBranchScopeRef.current;

    if (prev !== null && prev !== key) {
      useMapStore.getState().reset();
      useCharacterStore.getState().reset();
      useCharacterTraitsStore.getState().reset();
      useFactionStore.getState().reset();
      useDynastyStore.getState().reset();
      useNoteStore.getState().reset();
      useWikiStore.getState().reset();
      useTimelineStore.getState().reset();
      useDogmaStore.getState().reset();
      useTagStore.getState().reset();
    }

    previousBranchScopeRef.current = key;
  }, [currentProjectId, activeBranchId, branchStoreProjectId]);

  return currentProjectId;
};
