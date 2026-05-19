import type {
  ApiResponse,
  TimelineEvent,
  CreateTimelineEvent,
  UpdateTimelineEvent,
  Tag,
} from '@campaigner/shared';
import type {
  CreateTimelineEventInput as TauriCreateTimelineEventInput,
  DeleteTimelineEventInput as TauriDeleteTimelineEventInput,
  GetTimelineEventInput as TauriGetTimelineEventInput,
  ReorderTimelineInput as TauriReorderTimelineInput,
  SetTimelineTagsInput as TauriSetTimelineTagsInput,
  Tag as TauriTag,
  TimelineEvent as TauriTimelineEvent,
  TimelineListInput as TauriTimelineListInput,
  UpdateTimelineEventInput as TauriUpdateTimelineEventInput,
} from '@/types/generated/bindings';
import { transport } from './transport';
import { withBranchParams } from './withBranchParams';

type ApiResult<T> = {
  data: ApiResponse<T>;
};

const isApiResponse = <T>(value: unknown): value is ApiResponse<T> =>
  Boolean(value && typeof value === 'object' && 'success' in value);

const toTag = (tag: TauriTag): Tag => ({
  id: tag.id,
  name: tag.name,
  color: tag.color,
});

const toTimelineEvent = (event: TauriTimelineEvent): TimelineEvent => ({
  id: event.id,
  projectId: event.projectId,
  title: event.title,
  description: event.description,
  eventDate: event.eventDate,
  sortOrder: event.sortOrder,
  era: event.era,
  eraColor: event.eraColor,
  tags: event.tags.map(toTag),
  linkedNoteId: event.linkedNoteId ?? null,
  createdAt: event.createdAt,
  updatedAt: event.updatedAt,
});

const toEventResponse = (
  response: ApiResponse<TimelineEvent> | TauriTimelineEvent
): ApiResult<TimelineEvent> => {
  if (isApiResponse<TimelineEvent>(response)) {
    return { data: response };
  }

  return {
    data: {
      success: true,
      data: toTimelineEvent(response),
    },
  };
};

const toEventsResponse = (
  response: ApiResponse<TimelineEvent[]> | TauriTimelineEvent[]
): ApiResult<TimelineEvent[]> => {
  if (isApiResponse<TimelineEvent[]>(response)) {
    return { data: response };
  }

  return {
    data: {
      success: true,
      data: response.map(toTimelineEvent),
    },
  };
};

const toTagsResponse = (response: ApiResponse<Tag[]> | TauriTag[]): ApiResult<Tag[]> => {
  if (isApiResponse<Tag[]>(response)) {
    return { data: response };
  }

  return {
    data: {
      success: true,
      data: response.map(toTag),
    },
  };
};

export const timelineApi = {
  getAll: async (projectId: number, era?: string): Promise<ApiResult<TimelineEvent[]>> => {
    const query = withBranchParams({ projectId, era });
    const input: TauriTimelineListInput = {
      projectId: query.projectId,
      era: query.era ?? null,
      branchId: query.branchId ?? null,
    };

    const response = await transport.request<ApiResponse<TimelineEvent[]> | TauriTimelineEvent[]>({
      http: {
        method: 'GET',
        path: '/timeline',
        query,
      },
      tauri: {
        command: 'timeline_list',
        args: { input },
      },
    });

    return toEventsResponse(response);
  },

  getById: async (id: number, projectId?: number): Promise<ApiResult<TimelineEvent>> => {
    const query = withBranchParams({}, projectId);
    const input: TauriGetTimelineEventInput = {
      id,
      branchId: query.branchId ?? null,
    };

    const response = await transport.request<ApiResponse<TimelineEvent> | TauriTimelineEvent>({
      http: {
        method: 'GET',
        path: `/timeline/${id}`,
        query,
      },
      tauri: {
        command: 'timeline_get',
        args: { input },
      },
    });

    return toEventResponse(response);
  },

  create: async (data: CreateTimelineEvent): Promise<ApiResult<TimelineEvent>> => {
    const payload = withBranchParams({ ...data });
    const input: TauriCreateTimelineEventInput = {
      projectId: payload.projectId,
      title: payload.title,
      description: payload.description ?? null,
      eventDate: payload.eventDate,
      sortOrder: payload.sortOrder ?? null,
      era: payload.era ?? null,
      eraColor: payload.eraColor ?? null,
      linkedNoteId: payload.linkedNoteId ?? null,
      branchId: payload.branchId ?? null,
    };

    const response = await transport.request<ApiResponse<TimelineEvent> | TauriTimelineEvent>({
      http: {
        method: 'POST',
        path: '/timeline',
        body: payload,
      },
      tauri: {
        command: 'timeline_create',
        args: { input },
      },
    });

    return toEventResponse(response);
  },

  update: async (
    id: number,
    data: UpdateTimelineEvent,
    projectId?: number
  ): Promise<ApiResult<TimelineEvent>> => {
    const payload = withBranchParams({ ...data }, projectId);
    const input: TauriUpdateTimelineEventInput = {
      id,
      title: payload.title ?? null,
      description: payload.description ?? null,
      eventDate: payload.eventDate ?? null,
      sortOrder: payload.sortOrder ?? null,
      era: payload.era ?? null,
      eraColor: payload.eraColor ?? null,
      linkedNoteId: payload.linkedNoteId ?? null,
      branchId: payload.branchId ?? null,
    };

    const response = await transport.request<ApiResponse<TimelineEvent> | TauriTimelineEvent>({
      http: {
        method: 'PUT',
        path: `/timeline/${id}`,
        body: payload,
      },
      tauri: {
        command: 'timeline_update',
        args: { input },
      },
    });

    return toEventResponse(response);
  },

  delete: async (id: number, projectId?: number): Promise<{ data: void }> => {
    const query = withBranchParams({}, projectId);
    const input: TauriDeleteTimelineEventInput = {
      id,
      branchId: query.branchId ?? null,
    };

    await transport.request<void>({
      http: {
        method: 'DELETE',
        path: `/timeline/${id}`,
        query,
      },
      tauri: {
        command: 'timeline_delete',
        args: { input },
      },
    });

    return { data: undefined as void };
  },

  reorder: async (projectId: number, orderedIds: number[]): Promise<ApiResult<TimelineEvent[]>> => {
    const payload = withBranchParams({ projectId, orderedIds });
    const input: TauriReorderTimelineInput = {
      projectId: payload.projectId,
      orderedIds: payload.orderedIds,
      branchId: payload.branchId ?? null,
    };

    const response = await transport.request<ApiResponse<TimelineEvent[]> | TauriTimelineEvent[]>({
      http: {
        method: 'POST',
        path: '/timeline/reorder',
        body: payload,
      },
      tauri: {
        command: 'timeline_reorder',
        args: { input },
      },
    });

    return toEventsResponse(response);
  },

  setTags: async (id: number, tagIds: number[], projectId?: number): Promise<ApiResult<Tag[]>> => {
    const query = withBranchParams({}, projectId);
    const input: TauriSetTimelineTagsInput = {
      id,
      tagIds,
      branchId: query.branchId ?? null,
    };

    const response = await transport.request<ApiResponse<Tag[]> | TauriTag[]>({
      http: {
        method: 'PUT',
        path: `/timeline/${id}/tags`,
        query,
        body: { tagIds },
      },
      tauri: {
        command: 'timeline_set_tags',
        args: { input },
      },
    });

    return toTagsResponse(response);
  },
};
