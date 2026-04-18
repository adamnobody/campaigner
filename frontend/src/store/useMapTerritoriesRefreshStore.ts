import { create } from 'zustand';

/** Инкремент при изменении привязок территорий к фракциям — MapPage перезагружает контуры. */
export const useMapTerritoriesRefreshStore = create<{
  version: number;
  bump: () => void;
}>((set) => ({
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 })),
}));
