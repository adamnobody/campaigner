import type {
  AttachChildSceneToMarkerInput,
  AttachChildSceneToMarkerResult,
  BulkDeleteCanvasObjectsInput,
  BulkUpsertCanvasObjectsInput,
  CanvasLayer,
  CanvasObject,
  CanvasReconcileResult,
  CanvasScene,
  CanvasTerritorySummary,
  CreateCanvasLayerInput,
  CreateCanvasObjectInput,
  CreateCanvasSceneInput,
  DeleteCanvasLayerInput,
  DeleteCanvasObjectInput,
  DeleteCanvasSceneInput,
  GetCanvasObjectInput,
  GetCanvasSceneInput,
  GetCanvasSceneTreeInput,
  GetRootCanvasSceneInput,
  ListCanvasLayersInput,
  ListCanvasObjectsInput,
  ListCanvasTerritorySummariesInput,
  ReconcileCanvasSceneInput,
  ReorderCanvasLayersInput,
  ReorderCanvasObjectsInput,
  UpdateCanvasLayerInput,
  UpdateCanvasObjectInput,
  UpdateCanvasSceneInput,
  UploadSavedPath,
} from '@/types/generated/bindings';
import { transport } from './transport';
import { readFileForUpload } from './uploadFile';
import { withBranchParams } from './withBranchParams';

const request = <TResponse>(command: string, input: unknown): Promise<TResponse> =>
  transport.request<TResponse>({
    command,
    args: { input },
  });

const withCanvasBranch = <T extends Record<string, unknown>>(
  payload: T,
  projectId?: number,
): T & { branchId: number | null } => ({
  ...withBranchParams(payload, projectId),
  branchId: withBranchParams(payload, projectId).branchId ?? null,
});

export const canvasApi = {
  getRootScene: (projectId: number): Promise<CanvasScene | null> => {
    const input: GetRootCanvasSceneInput = withCanvasBranch({ projectId }, projectId);
    return request('canvas_scenes_get_root', input);
  },

  getSceneTree: (projectId: number): Promise<CanvasScene[]> => {
    const input: GetCanvasSceneTreeInput = withCanvasBranch({ projectId }, projectId);
    return request('canvas_scenes_get_tree', input);
  },

  getScene: (id: number, projectId?: number): Promise<CanvasScene> => {
    const input: GetCanvasSceneInput = withCanvasBranch({ id }, projectId);
    return request('canvas_scenes_get', input);
  },

  createScene: (input: Omit<CreateCanvasSceneInput, 'branchId'>): Promise<CanvasScene> =>
    request('canvas_scenes_create', withCanvasBranch(input, input.projectId)),

  updateScene: (
    input: Omit<UpdateCanvasSceneInput, 'branchId'>,
    projectId?: number,
  ): Promise<CanvasScene> => request('canvas_scenes_update', withCanvasBranch(input, projectId)),

  deleteScene: (id: number, projectId?: number): Promise<void> => {
    const input: DeleteCanvasSceneInput = withCanvasBranch({ id }, projectId);
    return request('canvas_scenes_delete', input);
  },

  listLayers: (sceneId: number, projectId?: number): Promise<CanvasLayer[]> => {
    const input: ListCanvasLayersInput = withCanvasBranch({ sceneId }, projectId);
    return request('canvas_layers_list', input);
  },

  createLayer: (input: Omit<CreateCanvasLayerInput, 'branchId'>, projectId?: number): Promise<CanvasLayer> =>
    request('canvas_layers_create', withCanvasBranch(input, projectId)),

  updateLayer: (input: Omit<UpdateCanvasLayerInput, 'branchId'>, projectId?: number): Promise<CanvasLayer> =>
    request('canvas_layers_update', withCanvasBranch(input, projectId)),

  deleteLayer: (id: number, projectId?: number): Promise<void> => {
    const input: DeleteCanvasLayerInput = withCanvasBranch({ id }, projectId);
    return request('canvas_layers_delete', input);
  },

  reorderLayers: (
    input: Omit<ReorderCanvasLayersInput, 'branchId'>,
    projectId?: number,
  ): Promise<CanvasLayer[]> => request('canvas_layers_reorder', withCanvasBranch(input, projectId)),

  listObjects: (sceneId: number, projectId?: number): Promise<CanvasObject[]> => {
    const input: ListCanvasObjectsInput = withCanvasBranch({ sceneId }, projectId);
    return request('canvas_objects_list', input);
  },

  getObject: (id: number, projectId?: number): Promise<CanvasObject> => {
    const input: GetCanvasObjectInput = withCanvasBranch({ id }, projectId);
    return request('canvas_objects_get', input);
  },

  createObject: (input: Omit<CreateCanvasObjectInput, 'branchId'>, projectId?: number): Promise<CanvasObject> =>
    request('canvas_objects_create', withCanvasBranch(input, projectId)),

  updateObject: (input: Omit<UpdateCanvasObjectInput, 'branchId'>, projectId?: number): Promise<CanvasObject> =>
    request('canvas_objects_update', withCanvasBranch(input, projectId)),

  deleteObject: (id: number, projectId?: number): Promise<void> => {
    const input: DeleteCanvasObjectInput = withCanvasBranch({ id }, projectId);
    return request('canvas_objects_delete', input);
  },

  reorderObjects: (
    input: Omit<ReorderCanvasObjectsInput, 'branchId'>,
    projectId?: number,
  ): Promise<CanvasObject[]> => request('canvas_objects_reorder', withCanvasBranch(input, projectId)),

  bulkUpsertObjects: (
    input: Omit<BulkUpsertCanvasObjectsInput, 'branchId'>,
    projectId?: number,
  ): Promise<CanvasObject[]> => request('canvas_objects_bulk_upsert', withCanvasBranch(input, projectId)),

  bulkDeleteObjects: (
    input: Omit<BulkDeleteCanvasObjectsInput, 'branchId'>,
    projectId?: number,
  ): Promise<void> => request('canvas_objects_bulk_delete', withCanvasBranch(input, projectId)),

  reconcileScene: (
    input: Omit<ReconcileCanvasSceneInput, 'branchId'>,
    projectId?: number,
  ): Promise<CanvasReconcileResult> => request('canvas_reconcile_scene', withCanvasBranch(input, projectId)),

  attachChildSceneToMarker: (
    input: Omit<AttachChildSceneToMarkerInput, 'branchId'>,
    projectId?: number,
  ): Promise<AttachChildSceneToMarkerResult> =>
    request('canvas_markers_attach_child_scene', withCanvasBranch(input, projectId)),

  listTerritorySummaries: (projectId: number): Promise<CanvasTerritorySummary[]> => {
    const input: ListCanvasTerritorySummariesInput = withCanvasBranch({ projectId }, projectId);
    return request('canvas_objects_list_territory_summaries', input);
  },

  uploadSceneBackground: async (sceneId: number, projectId: number, file: File): Promise<CanvasScene> => {
    const path = await canvasApi.uploadCanvasAsset(file);
    return canvasApi.updateScene({ id: sceneId, name: null, backgroundPath: path, viewportJson: null, metadataJson: null }, projectId);
  },

  uploadCanvasAsset: async (file: File): Promise<string> => {
    const input = await readFileForUpload(file);
    const saved = await transport.request<UploadSavedPath>({
      command: 'uploads_save_map_image',
      args: { input },
    });
    return saved.path;
  },
};

export type {
  AttachChildSceneToMarkerResult,
  CanvasLayer,
  CanvasObject,
  CanvasReconcileResult,
  CanvasScene,
  CanvasTerritorySummary,
};
