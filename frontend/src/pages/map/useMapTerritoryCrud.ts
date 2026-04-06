import { useCallback, useState } from 'react';
import { mapApi } from '@/api/maps';
import { extractData, normalizeTerritory } from './mapUtils';
import type { MapData, Territory, TerritoryPointDragPayload, MapMode } from './mapUtils';

type SnackbarSeverity = 'success' | 'error' | 'warning' | 'info';

type TerritoryForm = {
  name: string;
  description: string;
  color: string;
  opacity: number;
  borderColor: string;
  borderWidth: number;
  smoothing: number;
  factionId: number | null;
};

type UseMapTerritoryCrudArgs = {
  currentMap: MapData | null;
  pendingNewTerritoryRings: Array<Array<{ x: number; y: number }>> | null;
  setPendingNewTerritoryRings: React.Dispatch<React.SetStateAction<Array<Array<{ x: number; y: number }>> | null>>;
  setDrawingPoints: React.Dispatch<React.SetStateAction<Array<{ x: number; y: number }>>>;
  clearDrawingDraft: () => void;
  setMode: React.Dispatch<React.SetStateAction<MapMode>>;
  selectedTerritory: Territory | null;
  setSelectedTerritory: React.Dispatch<React.SetStateAction<Territory | null>>;
  setPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setTerritories: React.Dispatch<React.SetStateAction<Territory[]>>;
  showSnackbar: (message: string, severity?: SnackbarSeverity) => void;
  showConfirmDialog: (title: string, message: string, onConfirm: () => void) => void;
};

export function useMapTerritoryCrud({
  currentMap,
  pendingNewTerritoryRings,
  setPendingNewTerritoryRings,
  setDrawingPoints,
  clearDrawingDraft,
  setMode,
  selectedTerritory,
  setSelectedTerritory,
  setPanelOpen,
  setTerritories,
  showSnackbar,
  showConfirmDialog,
}: UseMapTerritoryCrudArgs) {
  const [territoryDialogOpen, setTerritoryDialogOpen] = useState(false);
  const [editingTerritory, setEditingTerritory] = useState<Territory | null>(null);
  const [editingTerritoryPoints, setEditingTerritoryPoints] = useState<Territory | null>(null);
  const [territoryForm, setTerritoryForm] = useState<TerritoryForm>({
    name: '',
    description: '',
    color: '#4ECDC4',
    opacity: 0.25,
    borderColor: '#4ECDC4',
    borderWidth: 1.5,
    smoothing: 0,
    factionId: null,
  });

  const openCreateTerritoryDialogFromRings = useCallback((rings: Array<Array<{ x: number; y: number }>>) => {
    setPendingNewTerritoryRings(rings);
    setTerritoryForm({
      name: '',
      description: '',
      color: '#4ECDC4',
      opacity: 0.25,
      borderColor: '#4ECDC4',
      borderWidth: 2,
      smoothing: 0,
      factionId: null,
    });
    setEditingTerritory(null);
    setTerritoryDialogOpen(true);
  }, [setPendingNewTerritoryRings]);

  const handleSaveTerritory = useCallback(async () => {
    if (!territoryForm.name.trim()) return;
    try {
      if (editingTerritory) {
        const res = await mapApi.updateTerritory(editingTerritory.id, {
          name: territoryForm.name,
          description: territoryForm.description,
          color: territoryForm.color,
          opacity: territoryForm.opacity,
          borderColor: territoryForm.borderColor,
          borderWidth: territoryForm.borderWidth,
          smoothing: territoryForm.smoothing,
          factionId: territoryForm.factionId,
        });
        const updated = normalizeTerritory(extractData(res));
        setTerritories(prev => prev.map(t => t.id === editingTerritory.id ? updated : t));
        if (selectedTerritory?.id === editingTerritory.id) setSelectedTerritory(updated);
        showSnackbar('Территория обновлена', 'success');
      } else if (currentMap && pendingNewTerritoryRings?.length) {
        const apiRings = pendingNewTerritoryRings.map(ring => ring.map(p => ({ x: p.x / 100, y: p.y / 100 })));
        const res = await mapApi.createTerritory(currentMap.id, {
          name: territoryForm.name,
          description: territoryForm.description,
          color: territoryForm.color,
          opacity: territoryForm.opacity,
          borderColor: territoryForm.borderColor,
          borderWidth: territoryForm.borderWidth,
          smoothing: territoryForm.smoothing,
          factionId: territoryForm.factionId,
          rings: apiRings,
        });
        const newTerritory = normalizeTerritory(extractData(res));
        setTerritories(prev => [...prev, newTerritory]);
        showSnackbar('Территория создана', 'success');
      }
      setTerritoryDialogOpen(false);
      clearDrawingDraft();
      setMode('select');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка сохранения территории';
      showSnackbar(message, 'error');
    }
  }, [territoryForm, editingTerritory, currentMap, pendingNewTerritoryRings, selectedTerritory?.id, setTerritories, setSelectedTerritory, clearDrawingDraft, setMode, showSnackbar]);

  const startEditingPoints = useCallback((territory: Territory) => {
    setEditingTerritoryPoints(territory);
    setPanelOpen(false);
  }, [setPanelOpen]);

  const saveEditingPoints = useCallback(async () => {
    if (!editingTerritoryPoints) return;
    try {
      const apiRings = editingTerritoryPoints.rings.map(ring => ring.map(p => ({ x: p.x / 100, y: p.y / 100 })));
      const res = await mapApi.updateTerritory(editingTerritoryPoints.id, { rings: apiRings });
      const updated = normalizeTerritory(extractData(res));
      setTerritories(prev => prev.map(t => t.id === editingTerritoryPoints.id ? updated : t));
      if (selectedTerritory?.id === editingTerritoryPoints.id) setSelectedTerritory(updated);
      setEditingTerritoryPoints(null);
      showSnackbar('Точки территории обновлены', 'success');
    } catch {
      showSnackbar('Ошибка сохранения точек', 'error');
    }
  }, [editingTerritoryPoints, selectedTerritory?.id, setTerritories, setSelectedTerritory, showSnackbar]);

  const cancelEditingPoints = useCallback(() => {
    setEditingTerritoryPoints(null);
  }, []);

  const deletePoint = useCallback((payload: TerritoryPointDragPayload) => {
    if (payload.mode === 'draw') {
      setDrawingPoints(prev => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== payload.pointIndex)));
    } else {
      setEditingTerritoryPoints(prev => {
        if (!prev) return prev;
        const ring = prev.rings[payload.ringIndex];
        if (!ring || ring.length <= 3) return prev;
        const newRings = prev.rings.map((r, ri) => (ri === payload.ringIndex ? r.filter((_, i) => i !== payload.pointIndex) : r));
        return { ...prev, rings: newRings };
      });
    }
  }, [setDrawingPoints]);

  const addPointOnEdge = useCallback((payload: TerritoryPointDragPayload) => {
    if (payload.mode === 'draw') {
      const index = payload.pointIndex;
      setDrawingPoints(prev => {
        const nextIdx = (index + 1) % prev.length;
        const mid = { x: (prev[index].x + prev[nextIdx].x) / 2, y: (prev[index].y + prev[nextIdx].y) / 2 };
        const next = [...prev];
        next.splice(index + 1, 0, mid);
        return next;
      });
    } else {
      setEditingTerritoryPoints(prev => {
        if (!prev) return prev;
        const ring = prev.rings[payload.ringIndex];
        const index = payload.pointIndex;
        const nextIdx = (index + 1) % ring.length;
        const mid = { x: (ring[index].x + ring[nextIdx].x) / 2, y: (ring[index].y + ring[nextIdx].y) / 2 };
        const newRing = [...ring];
        newRing.splice(index + 1, 0, mid);
        const newRings = prev.rings.map((r, ri) => (ri === payload.ringIndex ? newRing : r));
        return { ...prev, rings: newRings };
      });
    }
  }, [setDrawingPoints]);

  const handleEditTerritory = useCallback((territory: Territory) => {
    setEditingTerritory(territory);
    setTerritoryForm({
      name: territory.name,
      description: territory.description,
      color: territory.color,
      opacity: territory.opacity,
      borderColor: territory.borderColor,
      borderWidth: territory.borderWidth,
      smoothing: territory.smoothing,
      factionId: territory.factionId,
    });
    setTerritoryDialogOpen(true);
  }, []);

  const handleDeleteTerritory = useCallback((territory: Territory) => {
    showConfirmDialog('Удалить территорию', `Удалить "${territory.name}"?`, async () => {
      try {
        await mapApi.deleteTerritory(territory.id);
        setTerritories(prev => prev.filter(t => t.id !== territory.id));
        setSelectedTerritory(null);
        setPanelOpen(false);
        showSnackbar('Территория удалена', 'success');
      } catch {
        showSnackbar('Ошибка удаления', 'error');
      }
    });
  }, [setPanelOpen, setSelectedTerritory, setTerritories, showConfirmDialog, showSnackbar]);

  const closeTerritoryDialog = useCallback(() => {
    setTerritoryDialogOpen(false);
    setPendingNewTerritoryRings(null);
  }, [setPendingNewTerritoryRings]);

  return {
    territoryDialogOpen,
    editingTerritory,
    editingTerritoryPoints,
    territoryForm,
    setTerritoryForm,
    setEditingTerritoryPoints,
    openCreateTerritoryDialogFromRings,
    handleSaveTerritory,
    startEditingPoints,
    saveEditingPoints,
    cancelEditingPoints,
    deletePoint,
    addPointOnEdge,
    handleEditTerritory,
    handleDeleteTerritory,
    closeTerritoryDialog,
  };
}
