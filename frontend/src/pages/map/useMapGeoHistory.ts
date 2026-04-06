import { useEffect, useState } from 'react';
import { geoStoryApi } from '@/api/geoStory';

interface UseMapGeoHistoryArgs {
  projectId: number;
  mapId: number | null;
  branchId: number | null;
}

export function useMapGeoHistory({ projectId, mapId, branchId }: UseMapGeoHistoryArgs) {
  const [geoDate, setGeoDate] = useState('');
  const [geoEventsCount, setGeoEventsCount] = useState(0);

  useEffect(() => {
    const loadGeoStory = async () => {
      if (!branchId || !mapId) {
        setGeoEventsCount(0);
        return;
      }
      try {
        const res = await geoStoryApi.list({
          projectId,
          branchId,
          mapId,
        });
        setGeoEventsCount((res.data.data ?? []).length);
      } catch {
        setGeoEventsCount(0);
      }
    };
    loadGeoStory();
  }, [branchId, mapId, projectId]);

  return { geoDate, setGeoDate, geoEventsCount };
}
