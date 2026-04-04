export interface MapTerritoryPoint {
  x: number;
  y: number;
}

export interface MapTerritory {
  id: number;
  mapId: number;
  name: string;
  description: string;
  color: string;
  opacity: number;
  borderColor: string;
  borderWidth: number;
  smoothing?: number;
  points: MapTerritoryPoint[];
  factionId: number | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMapTerritoryData {
  name: string;
  description?: string;
  color?: string;
  opacity?: number;
  borderColor?: string;
  borderWidth?: number;
  smoothing?: number;
  points?: MapTerritoryPoint[];
  factionId?: number | null;
  sortOrder?: number;
}

export interface UpdateMapTerritoryData {
  name?: string;
  description?: string;
  color?: string;
  opacity?: number;
  borderColor?: string;
  borderWidth?: number;
  smoothing?: number;
  points?: MapTerritoryPoint[];
  factionId?: number | null;
  sortOrder?: number;
}

export interface TerritoryRawRow {
  id: number;
  mapId: number;
  name: string;
  description: string;
  color: string;
  opacity: number;
  borderColor: string;
  borderWidth: number;
  smoothing?: number;
  points: string | null;
  factionId: number | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export function parseTerritoryPoints(value: string | null | undefined): MapTerritoryPoint[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
