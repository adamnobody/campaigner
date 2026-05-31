import type {
  ApiResponse,
  CreateMap,
  CreateMarker,
  CreateTerritory,
  Map,
  MapMarker,
  MapTerritory,
  MapTerritorySummary,
  UpdateMap,
  UpdateMarker,
  UpdateTerritory,
} from '@campaigner/shared';
import type { CanvasObject, CanvasScene } from '@/types/generated/bindings';
import { canvasApi } from './canvas';
import type { VoidResponse } from './types';

type ApiResult<T> = {
  data: ApiResponse<T>;
};

const ok = <T>(data: T): ApiResult<T> => ({ data: { success: true, data } });
const emptyOk = (): { data: VoidResponse } => ({ data: { success: true, data: undefined } });

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const numberValue = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const stringValue = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const sceneToMap = (scene: CanvasScene): Map => ({
  id: scene.id,
  projectId: scene.projectId,
  parentMapId: scene.parentSceneId ?? undefined,
  parentMarkerId: scene.parentObjectId ?? undefined,
  name: scene.name,
  imagePath: scene.backgroundPath ?? undefined,
  createdAt: scene.createdAt,
  updatedAt: scene.updatedAt,
});

const objectToMarker = (object: CanvasObject): MapMarker => {
  const transform = asRecord(object.transformJson);
  const content = asRecord(object.contentJson);
  const style = asRecord(object.styleJson);
  return {
    id: object.id,
    mapId: object.sceneId,
    title: object.name ?? stringValue(content.title, 'Marker'),
    description: stringValue(content.description),
    positionX: numberValue(transform.x),
    positionY: numberValue(transform.y),
    color: stringValue(style.fill, '#FF6B6B'),
    icon: stringValue(content.icon, 'custom') as MapMarker['icon'],
    linkedNoteId: object.linkedNoteId ?? undefined,
    childMapId: object.linkedSceneId ?? undefined,
    createdAt: object.createdAt,
    updatedAt: object.updatedAt,
  };
};

const objectToTerritory = (object: CanvasObject): MapTerritory => {
  const geometry = asRecord(object.geometryJson);
  const style = asRecord(object.styleJson);
  const content = asRecord(object.contentJson);
  const rings = Array.isArray(geometry.rings)
    ? geometry.rings
    : Array.isArray(geometry.points)
      ? [geometry.points]
      : [];

  return {
    id: object.id,
    mapId: object.sceneId,
    name: object.name ?? stringValue(content.name, 'Territory'),
    description: stringValue(content.description),
    color: stringValue(style.fill, '#4ECDC4'),
    opacity: numberValue(style.opacity, 0.25),
    borderColor: stringValue(style.stroke, '#4ECDC4'),
    borderWidth: numberValue(style.strokeWidth, 2),
    smoothing: numberValue(style.smoothing),
    rings: rings.map((ring) =>
      Array.isArray(ring)
        ? ring.map((point) => {
            const record = asRecord(point);
            return { x: numberValue(record.x), y: numberValue(record.y) };
          })
        : [],
    ),
    factionId: typeof content.factionId === 'number' ? content.factionId : undefined,
    sortOrder: object.zIndex,
    createdAt: object.createdAt,
    updatedAt: object.updatedAt,
  };
};

const summaryToTerritorySummary = (summary: {
  id: number;
  name: string;
  sceneId: number;
  sceneName: string;
  factionId: number | null;
  occupantName: string | null;
  occupantKind: string | null;
}): MapTerritorySummary => ({
  id: summary.id,
  name: summary.name,
  mapId: summary.sceneId,
  mapName: summary.sceneName,
  factionId: summary.factionId,
  occupantName: summary.occupantName,
  occupantKind: summary.occupantKind as MapTerritorySummary['occupantKind'],
});

const markerInput = (mapId: number, data: CreateMarker | UpdateMarker) => ({
  sceneId: mapId,
  kind: 'marker',
  name: 'title' in data && data.title !== undefined ? data.title : null,
  transformJson: {
    x: 'positionX' in data ? data.positionX : 0,
    y: 'positionY' in data ? data.positionY : 0,
  },
  geometryJson: { radius: 12 },
  styleJson: { fill: 'color' in data && data.color ? data.color : '#FF6B6B' },
  contentJson: {
    title: 'title' in data ? data.title : undefined,
    description: 'description' in data ? data.description : undefined,
    icon: 'icon' in data ? data.icon : undefined,
  },
  resourcePath: null,
  linkedNoteId: 'linkedNoteId' in data && typeof data.linkedNoteId === 'number' ? data.linkedNoteId : null,
  linkedSceneId: 'childMapId' in data ? data.childMapId ?? null : null,
  isHidden: false,
  isLocked: false,
});

const territoryRings = (data: CreateTerritory | UpdateTerritory): { x: number; y: number }[][] => {
  const payload = data as CreateTerritory & UpdateTerritory & {
    points?: { x: number; y: number }[];
    rings?: { x: number; y: number }[][];
  };
  if (Array.isArray(payload.rings)) return payload.rings;
  if (Array.isArray(payload.points)) return [payload.points];
  return [];
};

export const mapApi = {
  getRootMap: async (projectId: number): Promise<ApiResult<Map | null>> => {
    const scene = await canvasApi.getRootScene(projectId);
    return ok(scene ? sceneToMap(scene) : null);
  },

  getMapById: async (mapId: number, projectId?: number): Promise<ApiResult<Map>> => {
    const scene = await canvasApi.getScene(mapId, projectId);
    return ok(sceneToMap(scene));
  },

  getMapTree: async (projectId: number): Promise<ApiResult<Map[]>> => {
    const scenes = await canvasApi.getSceneTree(projectId);
    return ok(scenes.map(sceneToMap));
  },

  getTerritorySummariesForProject: async (projectId: number): Promise<ApiResult<MapTerritorySummary[]>> => {
    const summaries = await canvasApi.listTerritorySummaries(projectId);
    return ok(summaries.map(summaryToTerritorySummary));
  },

  createMap: async (data: CreateMap): Promise<ApiResult<Map>> => {
    const scene = await canvasApi.createScene({
      projectId: data.projectId,
      parentSceneId: data.parentMapId ?? null,
      parentObjectId: data.parentMarkerId ?? null,
      name: data.name,
      backgroundPath: data.imagePath ?? null,
      viewportJson: null,
      metadataJson: null,
    });
    return ok(sceneToMap(scene));
  },

  updateMap: async (mapId: number, data: UpdateMap, projectId?: number): Promise<ApiResult<Map>> => {
    const scene = await canvasApi.updateScene({
      id: mapId,
      name: data.name ?? null,
      backgroundPath: data.imagePath ?? null,
      viewportJson: null,
      metadataJson: null,
    }, projectId);
    return ok(sceneToMap(scene));
  },

  deleteMap: async (mapId: number): Promise<{ data: VoidResponse }> => {
    await canvasApi.deleteScene(mapId);
    return emptyOk();
  },

  uploadMapImage: async (mapId: number, file: File, projectId?: number): Promise<ApiResult<Map>> => {
    const scene = await canvasApi.uploadSceneBackground(mapId, projectId ?? 0, file);
    return ok(sceneToMap(scene));
  },

  getMarkersByMapId: async (mapId: number, projectId?: number): Promise<ApiResult<MapMarker[]>> => {
    const objects = await canvasApi.listObjects(mapId, projectId);
    return ok(objects.filter((object) => object.kind === 'marker').map(objectToMarker));
  },

  createMarker: async (mapId: number, data: CreateMarker, projectId?: number): Promise<ApiResult<MapMarker>> => {
    const layers = await canvasApi.listLayers(mapId, projectId);
    const layerId = layers.find((layer) => layer.kind === 'content')?.id ?? layers[0]?.id;
    if (!layerId) throw new Error('Canvas scene has no layer for marker creation');
    const object = await canvasApi.createObject({
      ...markerInput(mapId, data),
      layerId,
      zIndex: null,
    }, projectId);
    return ok(objectToMarker(object));
  },

  updateMarker: async (markerId: number, data: UpdateMarker, projectId?: number): Promise<ApiResult<MapMarker>> => {
    const current = await canvasApi.getObject(markerId, projectId);
    const object = await canvasApi.updateObject({
      id: markerId,
      layerId: null,
      kind: null,
      name: 'title' in data && data.title !== undefined ? data.title : null,
      zIndex: null,
      transformJson: {
        ...asRecord(current.transformJson),
        ...('positionX' in data ? { x: data.positionX } : {}),
        ...('positionY' in data ? { y: data.positionY } : {}),
      },
      geometryJson: null,
      styleJson: { ...asRecord(current.styleJson), ...('color' in data ? { fill: data.color } : {}) },
      contentJson: { ...asRecord(current.contentJson), ...data },
      resourcePath: null,
      linkedNoteId: 'linkedNoteId' in data ? data.linkedNoteId ?? null : null,
      linkedSceneId: 'childMapId' in data ? data.childMapId ?? null : null,
      isHidden: null,
      isLocked: null,
    }, projectId);
    return ok(objectToMarker(object));
  },

  deleteMarker: async (markerId: number, projectId?: number): Promise<{ data: VoidResponse }> => {
    await canvasApi.deleteObject(markerId, projectId);
    return emptyOk();
  },

  getTerritoriesByMapId: async (mapId: number, projectId?: number): Promise<ApiResult<MapTerritory[]>> => {
    const objects = await canvasApi.listObjects(mapId, projectId);
    return ok(objects.filter((object) => object.kind === 'territory').map(objectToTerritory));
  },

  createTerritory: async (mapId: number, data: CreateTerritory, projectId?: number): Promise<ApiResult<MapTerritory>> => {
    const layers = await canvasApi.listLayers(mapId, projectId);
    const layerId = layers.find((layer) => layer.kind === 'content')?.id ?? layers[0]?.id;
    if (!layerId) throw new Error('Canvas scene has no layer for territory creation');
    const payload = data as Partial<MapTerritory>;
    const object = await canvasApi.createObject({
      sceneId: mapId,
      layerId,
      kind: 'territory',
      name: payload.name ?? 'Territory',
      zIndex: null,
      transformJson: {},
      geometryJson: { rings: territoryRings(data) },
      styleJson: {
        fill: payload.color ?? '#4ECDC4',
        opacity: payload.opacity ?? 0.25,
        stroke: payload.borderColor ?? payload.color ?? '#4ECDC4',
        strokeWidth: payload.borderWidth ?? 2,
        smoothing: payload.smoothing ?? 0,
      },
      contentJson: {
        description: payload.description ?? '',
        factionId: payload.factionId ?? null,
      },
      resourcePath: null,
      linkedNoteId: null,
      linkedSceneId: null,
      isHidden: false,
      isLocked: false,
    }, projectId);
    return ok(objectToTerritory(object));
  },

  updateTerritory: async (territoryId: number, data: UpdateTerritory, projectId?: number): Promise<ApiResult<MapTerritory>> => {
    const current = await canvasApi.getObject(territoryId, projectId);
    const payload = data as Partial<MapTerritory>;
    const object = await canvasApi.updateObject({
      id: territoryId,
      layerId: null,
      kind: null,
      name: payload.name ?? null,
      zIndex: typeof payload.sortOrder === 'number' ? payload.sortOrder : null,
      transformJson: null,
      geometryJson: territoryRings(data).length > 0 ? { rings: territoryRings(data) } : null,
      styleJson: {
        ...asRecord(current.styleJson),
        ...(payload.color ? { fill: payload.color } : {}),
        ...(payload.opacity !== undefined ? { opacity: payload.opacity } : {}),
        ...(payload.borderColor ? { stroke: payload.borderColor } : {}),
        ...(payload.borderWidth !== undefined ? { strokeWidth: payload.borderWidth } : {}),
        ...(payload.smoothing !== undefined ? { smoothing: payload.smoothing } : {}),
      },
      contentJson: {
        ...asRecord(current.contentJson),
        ...(payload.description !== undefined ? { description: payload.description } : {}),
        ...(payload.factionId !== undefined ? { factionId: payload.factionId } : {}),
      },
      resourcePath: null,
      linkedNoteId: null,
      linkedSceneId: null,
      isHidden: null,
      isLocked: null,
    }, projectId);
    return ok(objectToTerritory(object));
  },

  deleteTerritory: async (territoryId: number, projectId?: number): Promise<{ data: VoidResponse }> => {
    await canvasApi.deleteObject(territoryId, projectId);
    return emptyOk();
  },
};
