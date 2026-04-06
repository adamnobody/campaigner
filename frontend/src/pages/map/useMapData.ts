import { useCallback, useEffect, useState } from 'react';
import type { Project } from '@campaigner/shared';
import { mapApi } from '@/api/maps';
import { projectsApi } from '@/api/projects';
import { notesApi } from '@/api/notes';
import { factionsApi } from '@/api/factions';
import {
  extractData,
  normalizeMap,
  parseMarkers,
  parseTerritories,
  parseNotes,
  parseFactions,
  preloadImage,
} from './mapUtils';
import type { MapData, Marker, Territory, NoteOption, FactionOption } from './mapUtils';

type UseMapDataArgs = {
  projectId: number;
  mapId: number | null;
  showSnackbar: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
  clearDrawingDraft: () => void;
  resetView: () => void;
  onBeforeMapLoad?: () => void;
  onInitialMapResolved?: (map: MapData) => void;
};

export function useMapData({
  projectId,
  mapId,
  showSnackbar,
  clearDrawingDraft,
  resetView,
  onBeforeMapLoad,
  onInitialMapResolved,
}: UseMapDataArgs) {
  const [project, setProject] = useState<Project | null>(null);
  const [currentMap, setCurrentMap] = useState<MapData | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [notes, setNotes] = useState<NoteOption[]>([]);
  const [factions, setFactions] = useState<FactionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);

  const loadMapData = useCallback(async (loadMapId: number) => {
    setTransitioning(true);
    onBeforeMapLoad?.();
    clearDrawingDraft();

    try {
      const mapRes = await mapApi.getMapById(loadMapId);
      const mapData = normalizeMap(extractData(mapRes));

      const [markersRes, territoriesRes, notesRes, factionsRes] = await Promise.all([
        mapApi.getMarkersByMapId(mapData.id),
        mapApi.getTerritoriesByMapId(mapData.id),
        notesApi.getAll(projectId),
        factionsApi.getAll(projectId),
      ]);

      const newMarkers = parseMarkers(extractData(markersRes));
      const newTerritories = parseTerritories(extractData(territoriesRes));
      const newNotes = parseNotes(extractData(notesRes));
      const newFactions = parseFactions(extractData(factionsRes));

      if (mapData.imagePath) {
        await preloadImage(`/api${mapData.imagePath}`);
      }

      setCurrentMap(mapData);
      setMarkers(newMarkers);
      setTerritories(newTerritories);
      setNotes(newNotes);
      setFactions(newFactions);
      setImgSize(null);
      resetView();
    } catch {
      showSnackbar('Ошибка загрузки карты', 'error');
    }
    setTransitioning(false);
  }, [projectId, onBeforeMapLoad, clearDrawingDraft, resetView, showSnackbar]);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const projRes = await projectsApi.getById(projectId);
        if (cancelled) return;
        setProject(extractData(projRes));

        let mapToLoad: MapData;
        if (mapId) {
          mapToLoad = normalizeMap(extractData(await mapApi.getMapById(mapId)));
        } else {
          try {
            mapToLoad = normalizeMap(extractData(await mapApi.getRootMap(projectId)));
          } catch {
            mapToLoad = normalizeMap(extractData(await mapApi.createMap({ projectId, name: 'Корневая карта' })));
          }
        }
        if (cancelled) return;

        setCurrentMap(mapToLoad);
        onInitialMapResolved?.(mapToLoad);

        const [markersRes, territoriesRes, notesRes, factionsRes] = await Promise.all([
          mapApi.getMarkersByMapId(mapToLoad.id),
          mapApi.getTerritoriesByMapId(mapToLoad.id),
          notesApi.getAll(projectId),
          factionsApi.getAll(projectId),
        ]);
        if (cancelled) return;

        setMarkers(parseMarkers(extractData(markersRes)));
        setTerritories(parseTerritories(extractData(territoriesRes)));
        setNotes(parseNotes(extractData(notesRes)));
        setFactions(parseFactions(extractData(factionsRes)));
      } catch {
        // no-op: screen-level fallbacks handle empty/failed state
      }
      if (!cancelled) setLoading(false);
    };

    init();
    return () => { cancelled = true; };
  }, [projectId, mapId, onInitialMapResolved]);

  return {
    project,
    currentMap,
    markers,
    territories,
    notes,
    factions,
    loading,
    transitioning,
    imgSize,
    setImgSize,
    setProject,
    setCurrentMap,
    setMarkers,
    setTerritories,
    setNotes,
    setFactions,
    loadMapData,
  };
}
