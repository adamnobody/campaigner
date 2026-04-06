/**
 * Legacy compatibility layer.
 *
 * New code must not import domain API from this file.
 * Use canonical imports from:
 * - @/api/client
 * - @/api/<domain>
 *
 * Keep this file only to reduce migration shock for older modules.
 */

export { apiClient, type ListWithTotal, type VoidResponse } from './client';
export type {
  CreateTagRequest,
  CharacterListParams,
  NotesListParams,
  DogmaListParams,
  FactionsListParams,
  DynastiesListParams,
} from './types';
export type {
  SearchResult,
  WikiLink,
  FactionGraphNode,
  FactionGraph,
  ImportedProjectPayload,
} from '@campaigner/shared';
export { projectsApi } from './projects';
export { charactersApi } from './characters';
export { notesApi } from './notes';
export { mapApi } from './maps';
export { timelineApi } from './timeline';
export { tagsApi } from './tags';
export { searchApi } from './search';
export { wikiApi } from './wiki';
export { dogmasApi } from './dogmas';
export { factionsApi } from './factions';
export { dynastiesApi } from './dynasties';
export { branchesApi } from './branches';
