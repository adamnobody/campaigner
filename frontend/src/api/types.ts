import type { CreateTag } from '@campaigner/shared';

export interface CreateTagRequest extends CreateTag {
  projectId: number;
}

export type CharacterListParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type NotesListParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  noteType?: string;
  folderId?: number | null;
};

export type DogmaListParams = {
  category?: string;
  importance?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

export type FactionsListParams = {
  type?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
  append?: boolean;
};

export type DynastiesListParams = {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
  append?: boolean;
};
