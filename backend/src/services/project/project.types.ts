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
  stateId?: number | null;
  factionIds?: number[];
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
  imageBase64?: string | null;
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

export interface ExportTerritoryRow {
  id: number;
  mapId: number;
  name: string;
  description: string;
  color: string;
  opacity: number;
  borderColor: string;
  borderWidth: number;
  points: string;
  factionId: number | null;
  smoothing: number;
  sortOrder: number;
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

export interface ExportWikiLinkRow {
  id: number;
  sourceNoteId: number;
  targetNoteId: number;
  label: string;
  createdAt: string;
}

export interface ExportDogmaRow {
  id: number;
  title: string;
  category: string;
  description: string;
  impact: string;
  exceptions: string;
  isPublic: number | boolean;
  importance: string;
  status: string;
  sortOrder: number;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExportFactionRow {
  id: number;
  name: string;
  type: 'state' | 'faction';
  customType: string;
  stateType: string;
  customStateType: string;
  motto: string;
  description: string;
  history: string;
  goals: string;
  headquarters: string;
  territory: string;
  status: string;
  color: string;
  secondaryColor: string;
  imagePath: string | null;
  bannerPath: string | null;
  foundedDate: string;
  disbandedDate: string;
  parentFactionId: number | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExportFactionRankRow {
  id: number;
  factionId: number;
  name: string;
  level: number;
  description: string;
  permissions: string;
  icon: string;
  color: string;
}

export interface ExportFactionMemberRow {
  id: number;
  factionId: number;
  characterId: number;
  rankId: number | null;
  role: string;
  joinedDate: string;
  leftDate: string;
  isActive: number | boolean;
  notes: string;
}

export interface ExportFactionRelationRow {
  id: number;
  sourceFactionId: number;
  targetFactionId: number;
  relationType: string;
  customLabel: string;
  description: string;
  startedDate: string;
  isBidirectional: number | boolean;
  createdAt: string;
}

export interface ExportDynastyRow {
  id: number;
  name: string;
  motto: string;
  description: string;
  history: string;
  status: string;
  color: string;
  secondaryColor: string;
  imagePath: string | null;
  foundedDate: string;
  extinctDate: string;
  founderId: number | null;
  currentLeaderId: number | null;
  heirId: number | null;
  linkedFactionId: number | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExportDynastyMemberRow {
  id: number;
  dynastyId: number;
  characterId: number;
  generation: number;
  role: string;
  birthDate: string;
  deathDate: string;
  isMainLine: number | boolean;
  notes: string;
}

export interface ExportDynastyFamilyLinkRow {
  id: number;
  dynastyId: number;
  sourceCharacterId: number;
  targetCharacterId: number;
  relationType: string;
  customLabel: string;
}

export interface ExportDynastyEventRow {
  id: number;
  dynastyId: number;
  title: string;
  description: string;
  eventDate: string;
  importance: string;
  sortOrder: number;
  createdAt: string;
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
  territories?: ExportTerritoryRow[];
  timelineEvents?: ExportTimelineEventRow[];
  tags?: ExportTagRow[];
  tagAssociations?: ExportTagAssociationRow[];
  wikiLinks?: ExportWikiLinkRow[];
  dogmas?: ExportDogmaRow[];
  factions?: ExportFactionRow[];
  factionRanks?: ExportFactionRankRow[];
  factionMembers?: ExportFactionMemberRow[];
  factionRelations?: ExportFactionRelationRow[];
  dynasties?: ExportDynastyRow[];
  dynastyMembers?: ExportDynastyMemberRow[];
  dynastyFamilyLinks?: ExportDynastyFamilyLinkRow[];
  dynastyEvents?: ExportDynastyEventRow[];
}
