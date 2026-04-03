export interface ExportCharacterRow {
  id: number;
  name: string;
  title: string;
  race: string;
  characterClass: string;
  level: number | null;
  status: string;
  bio: string;
  appearance: string;
  personality: string;
  backstory: string;
  notes: string;
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExportRelationshipRow {
  id: number;
  sourceCharacterId: number;
  targetCharacterId: number;
  relationshipType: string;
  customLabel: string;
  description: string;
  isBidirectional: number | boolean;
  createdAt: string;
}

export interface ExportNoteRow {
  id: number;
  folderId: number | null;
  title: string;
  content: string;
  format: string;
  noteType: string;
  isPinned: number | boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExportFolderRow {
  id: number;
  name: string;
  parentId: number | null;
  createdAt: string;
}

export interface ExportMapRow {
  id: number;
  projectId: number;
  parentMapId: number | null;
  parentMarkerId: number | null;
  name: string;
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExportMarkerRow {
  id: number;
  mapId: number;
  title: string;
  description: string;
  positionX: number;
  positionY: number;
  color: string;
  icon: string;
  linkedNoteId: number | null;
  childMapId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExportTimelineEventRow {
  id: number;
  title: string;
  description: string;
  eventDate: string;
  sortOrder: number;
  era: string;
  linkedNoteId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExportTagRow {
  id: number;
  name: string;
  color: string;
}

export interface ExportTagAssociationRow {
  tagId: number;
  entityType: string;
  entityId: number;
}

export interface ImportedProjectPayload {
  version: string;
  project: {
    name: string;
    description?: string;
    status?: string;
    mapImageBase64?: string | null;
  };
  characters?: Array<ExportCharacterRow & { imageBase64?: string | null }>;
  relationships?: ExportRelationshipRow[];
  notes?: ExportNoteRow[];
  folders?: ExportFolderRow[];
  maps?: ExportMapRow[];
  markers?: ExportMarkerRow[];
  timelineEvents?: ExportTimelineEventRow[];
  tags?: ExportTagRow[];
  tagAssociations?: ExportTagAssociationRow[];
}
