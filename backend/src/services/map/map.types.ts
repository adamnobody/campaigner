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
  /** Несколько несвязных контуров (материк, анклавы). */
  rings: MapTerritoryPoint[][];
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
  rings: MapTerritoryPoint[][];
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
  rings?: MapTerritoryPoint[][];
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

/**
 * Читает JSON из БД: legacy `[{x,y},…]` или `{ rings: [[…],[…]] }`.
 */
export function parseTerritoryRings(value: string | null | undefined): MapTerritoryPoint[][] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) return [];
      const first = parsed[0] as unknown;
      if (
        first &&
        typeof first === 'object' &&
        !Array.isArray(first) &&
        'x' in (first as object) &&
        'y' in (first as object)
      ) {
        return [parsed as MapTerritoryPoint[]];
      }
      if (Array.isArray(first)) {
        return parsed as MapTerritoryPoint[][];
      }
      return [];
    }
    if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { rings?: unknown }).rings)) {
      return (parsed as { rings: MapTerritoryPoint[][] }).rings;
    }
    return [];
  } catch {
    return [];
  }
}

export function serializeTerritoryRings(rings: MapTerritoryPoint[][]): string {
  return JSON.stringify({ rings });
}
