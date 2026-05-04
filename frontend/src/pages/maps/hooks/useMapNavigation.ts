import { useCallback, useState } from 'react';
import { mapApi } from '@/api/maps';
import { extractData, normalizeMap } from '../components/mapUtils';
import type { MapData } from '../components/mapUtils';

type UseMapNavigationArgs = {
  loadMapData: (mapId: number) => Promise<void>;
  projectId: number;
};

export function useMapNavigation({ loadMapData, projectId }: UseMapNavigationArgs) {
  const [mapBreadcrumbs, setMapBreadcrumbs] = useState<MapData[]>([]);

  const navigateToChildMap = useCallback(async (childMapId: number) => {
    const mapRes = await mapApi.getMapById(childMapId, projectId);
    const childMap = normalizeMap(extractData(mapRes));
    setMapBreadcrumbs(prev => [...prev, childMap]);
    await loadMapData(childMapId);
  }, [loadMapData, projectId]);

  const navigateToBreadcrumb = useCallback(async (index: number) => {
    const target = mapBreadcrumbs[index];
    if (!target) return;
    await loadMapData(target.id);
    setMapBreadcrumbs(prev => prev.slice(0, index + 1));
  }, [mapBreadcrumbs, loadMapData]);

  const navigateToParent = useCallback(() => {
    if (mapBreadcrumbs.length > 1) {
      void navigateToBreadcrumb(mapBreadcrumbs.length - 2);
    }
  }, [mapBreadcrumbs, navigateToBreadcrumb]);

  return {
    mapBreadcrumbs,
    setMapBreadcrumbs,
    navigateToChildMap,
    navigateToBreadcrumb,
    navigateToParent,
  };
}
