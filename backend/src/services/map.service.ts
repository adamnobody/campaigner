import { getDb } from '../db/connection.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type { Map, CreateMap, UpdateMap, MapMarker, CreateMarker, UpdateMarker } from '@campaigner/shared';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler';
import type { MapTerritory, CreateMapTerritoryData, UpdateMapTerritoryData, TerritoryRawRow } from './map/map.types';
import { parseTerritoryRings, serializeTerritoryRings } from './map/map.types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../../data');

export class MapService {
  // ==================== Maps ====================

  getRootMap(projectId: number): Map | null {
    const db = getDb();
    return (db.prepare(`
      SELECT id, project_id as projectId, parent_map_id as parentMapId,
        parent_marker_id as parentMarkerId, name, image_path as imagePath,
        created_at as createdAt, updated_at as updatedAt
      FROM maps WHERE project_id = ? AND parent_map_id IS NULL LIMIT 1
    `).get(projectId) as Map | undefined) || null;
  }

  getMapById(mapId: number): Map | null {
    const db = getDb();
    return (db.prepare(`
      SELECT id, project_id as projectId, parent_map_id as parentMapId,
        parent_marker_id as parentMarkerId, name, image_path as imagePath,
        created_at as createdAt, updated_at as updatedAt
      FROM maps WHERE id = ?
    `).get(mapId) as Map | undefined) || null;
  }

  getMapByIdOrThrow(mapId: number): Map {
    const map = this.getMapById(mapId);
    if (!map) throw new NotFoundError('Map');
    return map;
  }

  getMapTree(projectId: number): Map[] {
    return getDb().prepare(`
      SELECT id, project_id as projectId, parent_map_id as parentMapId,
        parent_marker_id as parentMarkerId, name, image_path as imagePath,
        created_at as createdAt, updated_at as updatedAt
      FROM maps WHERE project_id = ? ORDER BY parent_map_id, name
    `).all(projectId) as Map[];
  }

  createMap(data: CreateMap): Map {
    const result = getDb().prepare(`
      INSERT INTO maps (project_id, parent_map_id, parent_marker_id, name, image_path)
      VALUES (?, ?, ?, ?, ?)
    `).run(data.projectId, data.parentMapId || null, data.parentMarkerId || null, data.name, data.imagePath || null);
    return this.getMapByIdOrThrow(result.lastInsertRowid as number);
  }

  updateMap(mapId: number, data: UpdateMap): Map {
    this.getMapByIdOrThrow(mapId);
    const db = getDb();
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.imagePath !== undefined) { updates.push('image_path = ?'); values.push(data.imagePath); }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      db.prepare(`UPDATE maps SET ${updates.join(', ')} WHERE id = ?`).run(...values, mapId);
    }
    return this.getMapByIdOrThrow(mapId);
  }

  uploadMapImage(mapId: number, file: Express.Multer.File): Map {
    const db = getDb();
    const map = this.getMapByIdOrThrow(mapId);

    if (!file.buffer) throw new BadRequestError('Uploaded file buffer is missing');

    if (map.imagePath) {
      const oldPath = path.join(DATA_DIR, map.imagePath.replace(/^\/+/, ''));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const filename = `map_${mapId}_${Date.now()}${ext}`;
    const dirPath = path.join(DATA_DIR, 'uploads', 'maps');
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

    fs.writeFileSync(path.join(dirPath, filename), file.buffer);
    const relativePath = `/uploads/maps/${filename}`;
    db.prepare(`UPDATE maps SET image_path = ?, updated_at = datetime('now') WHERE id = ?`).run(relativePath, mapId);
    return this.getMapByIdOrThrow(mapId);
  }

  deleteMap(mapId: number): void {
    this.getMapByIdOrThrow(mapId);
    getDb().prepare('DELETE FROM maps WHERE id = ?').run(mapId);
  }

  createRootMapForProject(projectId: number, imagePath?: string): Map {
    const result = getDb().prepare(`
      INSERT INTO maps (project_id, parent_map_id, name, image_path) VALUES (?, NULL, ?, ?)
    `).run(projectId, 'Мир', imagePath || null);
    return this.getMapByIdOrThrow(result.lastInsertRowid as number);
  }

  // ==================== Markers ====================

  getMarkersByMapId(mapId: number): MapMarker[] {
    this.getMapByIdOrThrow(mapId);
    return getDb().prepare(`
      SELECT id, map_id as mapId, title, description,
        position_x as positionX, position_y as positionY,
        color, icon, linked_note_id as linkedNoteId, child_map_id as childMapId,
        created_at as createdAt, updated_at as updatedAt
      FROM map_markers WHERE map_id = ? ORDER BY created_at
    `).all(mapId) as MapMarker[];
  }

  getMarkerById(markerId: number): MapMarker | null {
    return (getDb().prepare(`
      SELECT id, map_id as mapId, title, description,
        position_x as positionX, position_y as positionY,
        color, icon, linked_note_id as linkedNoteId, child_map_id as childMapId,
        created_at as createdAt, updated_at as updatedAt
      FROM map_markers WHERE id = ?
    `).get(markerId) as MapMarker | undefined) || null;
  }

  getMarkerByIdOrThrow(markerId: number): MapMarker {
    const marker = this.getMarkerById(markerId);
    if (!marker) throw new NotFoundError('Map marker');
    return marker;
  }

  createMarker(mapId: number, data: CreateMarker): MapMarker {
    this.getMapByIdOrThrow(mapId);
    const result = getDb().prepare(`
      INSERT INTO map_markers (map_id, title, description, position_x, position_y, color, icon, linked_note_id, child_map_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(mapId, data.title, data.description || '', data.positionX, data.positionY,
      data.color || '#FF6B6B', data.icon || 'custom', data.linkedNoteId || null, data.childMapId || null);
    return this.getMarkerByIdOrThrow(result.lastInsertRowid as number);
  }

  updateMarker(markerId: number, data: UpdateMarker): MapMarker {
    this.getMarkerByIdOrThrow(markerId);
    const db = getDb();
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
    if (data.positionX !== undefined) { updates.push('position_x = ?'); values.push(data.positionX); }
    if (data.positionY !== undefined) { updates.push('position_y = ?'); values.push(data.positionY); }
    if (data.color !== undefined) { updates.push('color = ?'); values.push(data.color); }
    if (data.icon !== undefined) { updates.push('icon = ?'); values.push(data.icon); }
    if (data.linkedNoteId !== undefined) { updates.push('linked_note_id = ?'); values.push(data.linkedNoteId); }
    if (data.childMapId !== undefined) { updates.push('child_map_id = ?'); values.push(data.childMapId); }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      db.prepare(`UPDATE map_markers SET ${updates.join(', ')} WHERE id = ?`).run(...values, markerId);
    }
    return this.getMarkerByIdOrThrow(markerId);
  }

  deleteMarker(markerId: number): void {
    this.getMarkerByIdOrThrow(markerId);
    getDb().prepare('DELETE FROM map_markers WHERE id = ?').run(markerId);
  }

  getMarkerByChildMapId(childMapId: number): MapMarker | null {
    return (getDb().prepare(`
      SELECT id, map_id as mapId, title, description,
        position_x as positionX, position_y as positionY,
        color, icon, linked_note_id as linkedNoteId, child_map_id as childMapId,
        created_at as createdAt, updated_at as updatedAt
      FROM map_markers WHERE child_map_id = ?
    `).get(childMapId) as MapMarker | undefined) || null;
  }

  // ==================== Territories ====================

  getTerritoriesByMapId(mapId: number): MapTerritory[] {
    this.getMapByIdOrThrow(mapId);
    const rows = getDb().prepare(`
      SELECT id, map_id as mapId, name, description,
        color, opacity, border_color as borderColor,
        border_width as borderWidth, smoothing, points,
        faction_id as factionId, sort_order as sortOrder,
        created_at as createdAt, updated_at as updatedAt
      FROM map_territories WHERE map_id = ? ORDER BY sort_order, created_at
    `).all(mapId) as TerritoryRawRow[];

    return rows.map((row) => {
      const { points: rawPoints, ...rest } = row;
      return { ...rest, rings: parseTerritoryRings(rawPoints) };
    });
  }

  getTerritoryById(territoryId: number): MapTerritory | null {
    const row = getDb().prepare(`
      SELECT id, map_id as mapId, name, description,
        color, opacity, border_color as borderColor,
        border_width as borderWidth, smoothing, points,
        faction_id as factionId, sort_order as sortOrder,
        created_at as createdAt, updated_at as updatedAt
      FROM map_territories WHERE id = ?
    `).get(territoryId) as TerritoryRawRow | undefined;

    if (!row) return null;
    const { points: rawPoints, ...rest } = row;
    return { ...rest, rings: parseTerritoryRings(rawPoints) };
  }

  getTerritoryByIdOrThrow(territoryId: number): MapTerritory {
    const territory = this.getTerritoryById(territoryId);
    if (!territory) throw new NotFoundError('Map territory');
    return territory;
  }

  createTerritory(mapId: number, data: CreateMapTerritoryData): MapTerritory {
    this.getMapByIdOrThrow(mapId);
    const rings = data.rings ?? [];
    const result = getDb().prepare(`
      INSERT INTO map_territories (map_id, name, description, color, opacity, border_color, border_width, smoothing, points, faction_id, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(mapId, data.name, data.description || '', data.color || '#4ECDC4',
      data.opacity ?? 0.25, data.borderColor || '#4ECDC4', data.borderWidth ?? 2,
      data.smoothing ?? 0, serializeTerritoryRings(rings),
      data.factionId || null, data.sortOrder ?? 0);
    return this.getTerritoryByIdOrThrow(result.lastInsertRowid as number);
  }

  updateTerritory(territoryId: number, data: UpdateMapTerritoryData): MapTerritory {
    this.getTerritoryByIdOrThrow(territoryId);
    const db = getDb();
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
    if (data.color !== undefined) { updates.push('color = ?'); values.push(data.color); }
    if (data.opacity !== undefined) { updates.push('opacity = ?'); values.push(data.opacity); }
    if (data.borderColor !== undefined) { updates.push('border_color = ?'); values.push(data.borderColor); }
    if (data.borderWidth !== undefined) { updates.push('border_width = ?'); values.push(data.borderWidth); }
    if (data.smoothing !== undefined) { updates.push('smoothing = ?'); values.push(data.smoothing); }
    if (data.rings !== undefined) { updates.push('points = ?'); values.push(serializeTerritoryRings(data.rings)); }
    if (data.factionId !== undefined) { updates.push('faction_id = ?'); values.push(data.factionId); }
    if (data.sortOrder !== undefined) { updates.push('sort_order = ?'); values.push(data.sortOrder); }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      db.prepare(`UPDATE map_territories SET ${updates.join(', ')} WHERE id = ?`).run(...values, territoryId);
    }
    return this.getTerritoryByIdOrThrow(territoryId);
  }

  deleteTerritory(territoryId: number): void {
    this.getTerritoryByIdOrThrow(territoryId);
    getDb().prepare('DELETE FROM map_territories WHERE id = ?').run(territoryId);
  }
}

export const mapService = new MapService();
