import type {
  ApiResponse,
  PaginatedResponse,
  Note,
  CreateNote,
  UpdateNote,
  Tag,
} from '@campaigner/shared';
import type {
  CreateNoteInput as TauriCreateNoteInput,
  DeleteNoteInput as TauriDeleteNoteInput,
  GetNoteInput as TauriGetNoteInput,
  Note as TauriNote,
  NotesListInput as TauriNotesListInput,
  NotesListResult as TauriNotesListResult,
  SetNoteTagsInput as TauriSetNoteTagsInput,
  Tag as TauriTag,
  UpdateNoteInput as TauriUpdateNoteInput,
} from '@/types/generated/bindings';
import { transport } from './transport';
import type { NotesListParams } from './types';
import { withBranchParams } from './withBranchParams';

type ApiResult<T> = {
  data: ApiResponse<T>;
};

type PaginatedApiResult<T> = {
  data: PaginatedResponse<T>;
};

const isApiResponse = <T>(value: unknown): value is ApiResponse<T> =>
  Boolean(value && typeof value === 'object' && 'success' in value);

const isPaginatedResponse = <T>(value: unknown): value is PaginatedResponse<T> =>
  Boolean(value && typeof value === 'object' && 'success' in value && 'data' in value);

const toTag = (tag: TauriTag): Tag => ({
  id: tag.id,
  name: tag.name,
  color: tag.color,
});

const toNote = (note: TauriNote): Note => ({
  id: note.id,
  projectId: note.projectId,
  folderId: note.folderId ?? null,
  title: note.title,
  content: note.content,
  format: note.format as Note['format'],
  noteType: note.noteType as Note['noteType'],
  tags: note.tags.map(toTag),
  isPinned: note.isPinned,
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
});

const toPaginatedNotesResponse = (
  response: PaginatedResponse<Note> | TauriNotesListResult
): PaginatedApiResult<Note> => {
  if (isPaginatedResponse<Note>(response)) {
    return { data: response };
  }

  return {
    data: {
      success: true,
      data: {
        items: response.items.map(toNote),
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
      },
    },
  };
};

const toNoteResponse = (response: ApiResponse<Note> | TauriNote): ApiResult<Note> => {
  if (isApiResponse<Note>(response)) {
    return { data: response };
  }

  return {
    data: {
      success: true,
      data: toNote(response),
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

export const notesApi = {
  getAll: async (projectId: number, params?: NotesListParams): Promise<PaginatedApiResult<Note>> => {
    const query = withBranchParams({ projectId, ...(params ?? {}) });
    const input: TauriNotesListInput = {
      projectId: query.projectId,
      page: query.page ?? null,
      limit: query.limit ?? null,
      search: query.search ?? null,
      sortBy: query.sortBy ?? null,
      sortOrder: query.sortOrder ?? null,
      noteType: query.noteType ?? null,
      folderId: query.folderId ?? null,
      branchId: query.branchId ?? null,
    };

    const response = await transport.request<PaginatedResponse<Note> | TauriNotesListResult>({
      http: {
        method: 'GET',
        path: '/notes',
        query,
      },
      tauri: {
        command: 'notes_list',
        args: { input },
      },
    });

    return toPaginatedNotesResponse(response);
  },

  getById: async (id: number, projectId?: number): Promise<ApiResult<Note>> => {
    const query = withBranchParams({}, projectId);
    const input: TauriGetNoteInput = {
      id,
      branchId: query.branchId ?? null,
    };

    const response = await transport.request<ApiResponse<Note> | TauriNote>({
      http: {
        method: 'GET',
        path: `/notes/${id}`,
        query,
      },
      tauri: {
        command: 'notes_get',
        args: { input },
      },
    });

    return toNoteResponse(response);
  },

  create: async (data: CreateNote): Promise<ApiResult<Note>> => {
    const payload = withBranchParams({ ...data });
    const input: TauriCreateNoteInput = {
      projectId: payload.projectId,
      folderId: payload.folderId ?? null,
      title: payload.title,
      content: payload.content ?? null,
      format: payload.format ?? null,
      noteType: payload.noteType ?? null,
      isPinned: payload.isPinned ?? null,
      branchId: payload.branchId ?? null,
    };

    const response = await transport.request<ApiResponse<Note> | TauriNote>({
      http: {
        method: 'POST',
        path: '/notes',
        body: payload,
      },
      tauri: {
        command: 'notes_create',
        args: { input },
      },
    });

    return toNoteResponse(response);
  },

  update: async (id: number, data: UpdateNote, projectId?: number): Promise<ApiResult<Note>> => {
    const payload = withBranchParams({ ...data }, projectId);
    const input: TauriUpdateNoteInput = {
      id,
      title: payload.title ?? null,
      content: payload.content ?? null,
      format: payload.format ?? null,
      noteType: payload.noteType ?? null,
      folderId: payload.folderId ?? null,
      isPinned: payload.isPinned ?? null,
      branchId: payload.branchId ?? null,
    };

    const response = await transport.request<ApiResponse<Note> | TauriNote>({
      http: {
        method: 'PUT',
        path: `/notes/${id}`,
        body: payload,
      },
      tauri: {
        command: 'notes_update',
        args: { input },
      },
    });

    return toNoteResponse(response);
  },

  delete: async (id: number, projectId?: number): Promise<{ data: void }> => {
    const query = withBranchParams({}, projectId);
    const input: TauriDeleteNoteInput = {
      id,
      branchId: query.branchId ?? null,
    };

    await transport.request<void>({
      http: {
        method: 'DELETE',
        path: `/notes/${id}`,
        query,
      },
      tauri: {
        command: 'notes_delete',
        args: { input },
      },
    });

    return { data: undefined as void };
  },

  setTags: async (id: number, tagIds: number[], projectId?: number): Promise<ApiResult<Tag[]>> => {
    const query = withBranchParams({}, projectId);
    const body = { tagIds };
    const input: TauriSetNoteTagsInput = {
      id,
      tagIds,
      branchId: query.branchId ?? null,
    };

    const response = await transport.request<ApiResponse<Tag[]> | TauriTag[]>({
      http: {
        method: 'PUT',
        path: `/notes/${id}/tags`,
        query,
        body,
      },
      tauri: {
        command: 'notes_set_tags',
        args: { input },
      },
    });

    return toTagsResponse(response);
  },
};
