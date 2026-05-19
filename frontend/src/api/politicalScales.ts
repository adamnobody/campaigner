import type {
  ApiResponse,
  PoliticalScale,
  PoliticalScaleAssignment,
  CreatePoliticalScale,
  UpdatePoliticalScale,
  PutPoliticalScaleAssignmentsBody,
} from '@campaigner/shared';
import type {
  CreatePoliticalScaleInput as TauriCreatePoliticalScaleInput,
  DeletePoliticalScaleAssignmentInput as TauriDeletePoliticalScaleAssignmentInput,
  DeletePoliticalScaleInput as TauriDeletePoliticalScaleInput,
  ListPoliticalScaleAssignmentsInput as TauriListPoliticalScaleAssignmentsInput,
  ListPoliticalScalesInput as TauriListPoliticalScalesInput,
  PoliticalScale as TauriPoliticalScale,
  PoliticalScaleAssignment as TauriPoliticalScaleAssignment,
  ReplacePoliticalScaleAssignmentsInput as TauriReplacePoliticalScaleAssignmentsInput,
  ScaleZone as TauriScaleZone,
  UpdatePoliticalScaleInput as TauriUpdatePoliticalScaleInput,
} from '@/types/generated/bindings';
import { transport } from './transport';

type ApiResult<T> = {
  data: ApiResponse<T>;
};

const isApiResponse = <T>(value: unknown): value is ApiResponse<T> =>
  Boolean(value && typeof value === 'object' && 'success' in value);

const toScaleZone = (zone: TauriScaleZone) => ({
  from: zone.from,
  to: zone.to,
  label: zone.label,
  description: zone.description ?? undefined,
});

const toPoliticalScale = (scale: TauriPoliticalScale): PoliticalScale => ({
  id: scale.id,
  code: scale.code,
  entityType: scale.entityType as PoliticalScale['entityType'],
  category: scale.category,
  name: scale.name,
  leftPoleLabel: scale.leftPoleLabel,
  rightPoleLabel: scale.rightPoleLabel,
  leftPoleDescription: scale.leftPoleDescription,
  rightPoleDescription: scale.rightPoleDescription,
  icon: scale.icon ?? undefined,
  zones: scale.zones?.map(toScaleZone) ?? undefined,
  isSystem: scale.isSystem,
  worldId: scale.worldId ?? null,
  order: scale.order,
  createdAt: scale.createdAt,
  updatedAt: scale.updatedAt,
});

const toPoliticalScaleAssignment = (
  assignment: TauriPoliticalScaleAssignment
): PoliticalScaleAssignment => ({
  id: assignment.id,
  scaleId: assignment.scaleId,
  entityType: assignment.entityType as PoliticalScaleAssignment['entityType'],
  entityId: assignment.entityId,
  value: assignment.value,
  enabled: assignment.enabled,
  note: assignment.note ?? undefined,
  createdAt: assignment.createdAt,
  updatedAt: assignment.updatedAt,
});

const toPoliticalScaleResponse = (
  response: ApiResponse<PoliticalScale> | TauriPoliticalScale
): ApiResult<PoliticalScale> => {
  if (isApiResponse<PoliticalScale>(response)) {
    return { data: response };
  }

  return {
    data: {
      success: true,
      data: toPoliticalScale(response),
    },
  };
};

const toPoliticalScalesListResponse = (
  response: ApiResponse<PoliticalScale[]> | TauriPoliticalScale[]
): ApiResult<PoliticalScale[]> => {
  if (isApiResponse<PoliticalScale[]>(response)) {
    return { data: response };
  }

  return {
    data: {
      success: true,
      data: response.map(toPoliticalScale),
    },
  };
};

const toAssignmentsListResponse = (
  response: ApiResponse<PoliticalScaleAssignment[]> | TauriPoliticalScaleAssignment[]
): ApiResult<PoliticalScaleAssignment[]> => {
  if (isApiResponse<PoliticalScaleAssignment[]>(response)) {
    return { data: response };
  }

  return {
    data: {
      success: true,
      data: response.map(toPoliticalScaleAssignment),
    },
  };
};

export const politicalScalesApi = {
  list: async (params: {
    entityType: 'state' | 'faction';
    worldId: number;
  }): Promise<ApiResult<PoliticalScale[]>> => {
    const input: TauriListPoliticalScalesInput = {
      entityType: params.entityType,
      worldId: params.worldId,
    };

    const response = await transport.request<ApiResponse<PoliticalScale[]> | TauriPoliticalScale[]>(
      {
        http: {
          method: 'GET',
          path: '/political-scales',
          query: params,
        },
        tauri: {
          command: 'political_scales_list',
          args: { input },
        },
      }
    );

    return toPoliticalScalesListResponse(response);
  },

  create: async (data: CreatePoliticalScale): Promise<ApiResult<PoliticalScale>> => {
    const input: TauriCreatePoliticalScaleInput = {
      worldId: data.worldId,
      code: data.code,
      entityType: data.entityType,
      category: data.category,
      name: data.name,
      leftPoleLabel: data.leftPoleLabel,
      rightPoleLabel: data.rightPoleLabel,
      leftPoleDescription: data.leftPoleDescription ?? null,
      rightPoleDescription: data.rightPoleDescription ?? null,
      icon: data.icon ?? null,
      zones: data.zones?.map((zone) => ({
        from: zone.from,
        to: zone.to,
        label: zone.label,
        description: zone.description ?? null,
      })) ?? null,
      order: data.order ?? null,
    };

    const response = await transport.request<ApiResponse<PoliticalScale> | TauriPoliticalScale>({
      http: {
        method: 'POST',
        path: '/political-scales',
        body: data,
      },
      tauri: {
        command: 'political_scales_create',
        args: { input },
      },
    });

    return toPoliticalScaleResponse(response);
  },

  update: async (id: number, data: UpdatePoliticalScale): Promise<ApiResult<PoliticalScale>> => {
    const input: TauriUpdatePoliticalScaleInput = {
      id,
      category: data.category ?? null,
      name: data.name ?? null,
      leftPoleLabel: data.leftPoleLabel ?? null,
      rightPoleLabel: data.rightPoleLabel ?? null,
      leftPoleDescription: data.leftPoleDescription ?? null,
      rightPoleDescription: data.rightPoleDescription ?? null,
      icon: data.icon ?? null,
      zones:
        data.zones?.map((zone) => ({
          from: zone.from,
          to: zone.to,
          label: zone.label,
          description: zone.description ?? null,
        })) ?? null,
      order: data.order ?? null,
    };

    const response = await transport.request<ApiResponse<PoliticalScale> | TauriPoliticalScale>({
      http: {
        method: 'PATCH',
        path: `/political-scales/${id}`,
        body: data,
      },
      tauri: {
        command: 'political_scales_update',
        args: { input },
      },
    });

    return toPoliticalScaleResponse(response);
  },

  delete: async (id: number): Promise<{ data: void }> => {
    const input: TauriDeletePoliticalScaleInput = { id };

    await transport.request<void>({
      http: {
        method: 'DELETE',
        path: `/political-scales/${id}`,
      },
      tauri: {
        command: 'political_scales_delete',
        args: { input },
      },
    });

    return { data: undefined as void };
  },

  getAssignments: async (params: {
    entityType: 'state' | 'faction';
    entityId: number;
  }): Promise<ApiResult<PoliticalScaleAssignment[]>> => {
    const input: TauriListPoliticalScaleAssignmentsInput = {
      entityType: params.entityType,
      entityId: params.entityId,
    };

    const response = await transport.request<
      ApiResponse<PoliticalScaleAssignment[]> | TauriPoliticalScaleAssignment[]
    >({
      http: {
        method: 'GET',
        path: '/political-scale-assignments',
        query: params,
      },
      tauri: {
        command: 'political_scale_assignments_list',
        args: { input },
      },
    });

    return toAssignmentsListResponse(response);
  },

  putAssignments: async (
    body: PutPoliticalScaleAssignmentsBody
  ): Promise<ApiResult<PoliticalScaleAssignment[]>> => {
    const input: TauriReplacePoliticalScaleAssignmentsInput = {
      entityType: body.entityType,
      entityId: body.entityId,
      assignments: body.assignments.map((row) => ({
        scaleId: row.scaleId,
        value: row.value,
        enabled: row.enabled,
        note: row.note ?? null,
      })),
    };

    const response = await transport.request<
      ApiResponse<PoliticalScaleAssignment[]> | TauriPoliticalScaleAssignment[]
    >({
      http: {
        method: 'PUT',
        path: '/political-scale-assignments',
        body,
      },
      tauri: {
        command: 'political_scale_assignments_replace',
        args: { input },
      },
    });

    return toAssignmentsListResponse(response);
  },

  deleteAssignment: async (id: number): Promise<{ data: void }> => {
    const input: TauriDeletePoliticalScaleAssignmentInput = { id };

    await transport.request<void>({
      http: {
        method: 'DELETE',
        path: `/political-scale-assignments/${id}`,
      },
      tauri: {
        command: 'political_scale_assignments_delete',
        args: { input },
      },
    });

    return { data: undefined as void };
  },
};
