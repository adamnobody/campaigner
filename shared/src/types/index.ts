import { z } from 'zod';
import {
  projectSchema,
  createProjectSchema,
  updateProjectSchema,
  projectFolderSchema,
  createFolderSchema,
} from '../schemas/project.schema.js';
import {
  characterSchema,
  createCharacterSchema,
  updateCharacterSchema,
  characterRelationshipSchema,
  createRelationshipSchema,
  updateRelationshipSchema,
} from '../schemas/character.schema.js';
import {
  noteSchema,
  createNoteSchema,
  updateNoteSchema,
} from '../schemas/note.schema.js';
import {
  mapSchema,
  createMapSchema,
  updateMapSchema,
  mapMarkerSchema,
  createMarkerSchema,
  updateMarkerSchema,
} from '../schemas/map.schema.js';
import {
  timelineEventSchema,
  createTimelineEventSchema,
  updateTimelineEventSchema,
} from '../schemas/timeline.schema.js';
import {
  tagSchema,
  createTagSchema,
  paginationSchema,
} from '../schemas/common.schema.js';
import {
  dogmaSchema,
  createDogmaSchema,
  updateDogmaSchema,
} from '../schemas/dogma.schema.js';

// ==================== Project ====================
export type Project = z.infer<typeof projectSchema>;
export type CreateProject = z.input<typeof createProjectSchema>;
export type UpdateProject = z.input<typeof updateProjectSchema>;
export type ProjectFolder = z.infer<typeof projectFolderSchema>;
export type CreateFolder = z.infer<typeof createFolderSchema>;

// ==================== Character ====================
export type Character = z.infer<typeof characterSchema>;
export type CreateCharacter = z.input<typeof createCharacterSchema>;
export type UpdateCharacter = z.input<typeof updateCharacterSchema>;
export type CharacterRelationship = z.infer<typeof characterRelationshipSchema>;
export type CreateRelationship = z.input<typeof createRelationshipSchema>;
export type UpdateRelationship = z.input<typeof updateRelationshipSchema>;

// ==================== Note ====================
export type Note = z.infer<typeof noteSchema>;
export type CreateNote = z.input<typeof createNoteSchema>;
export type UpdateNote = z.input<typeof updateNoteSchema>;

// ==================== Map ====================
export type Map = z.infer<typeof mapSchema>;
export type CreateMap = z.input<typeof createMapSchema>;
export type UpdateMap = z.input<typeof updateMapSchema>;
export type MapMarker = z.infer<typeof mapMarkerSchema>;
export type CreateMarker = z.input<typeof createMarkerSchema>;
export type UpdateMarker = z.input<typeof updateMarkerSchema>;

// ==================== Timeline ====================
export type TimelineEvent = z.infer<typeof timelineEventSchema>;
export type CreateTimelineEvent = z.input<typeof createTimelineEventSchema>;
export type UpdateTimelineEvent = z.input<typeof updateTimelineEventSchema>;

// ==================== Dogma ====================
export type Dogma = z.infer<typeof dogmaSchema>;
export type CreateDogma = z.input<typeof createDogmaSchema>;
export type UpdateDogma = z.input<typeof updateDogmaSchema>;

// ==================== Common ====================
export type Tag = z.infer<typeof tagSchema>;
export type CreateTag = z.input<typeof createTagSchema>;
export type Pagination = z.infer<typeof paginationSchema>;

// ==================== API Response ====================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ==================== Character Graph ====================
export interface CharacterNode {
  id: number;
  name: string;
  title: string;
  status: string;
  imagePath: string | null;
}

export interface CharacterEdge {
  id: number;
  source: number;
  target: number;
  relationshipType: string;
  customLabel: string;
  isBidirectional: boolean;
}

export interface CharacterGraph {
  nodes: CharacterNode[];
  edges: CharacterEdge[];
}