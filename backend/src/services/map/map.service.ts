import { getDb } from '../../db/connection.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type { Map, CreateMap, UpdateMap, MapMarker, CreateMarker, UpdateMarker } from '@campaigner/shared';
import { BadRequestError, NotFoundError } from '../../middleware/errorHandler.js';
import type { MapTerritory, CreateMapTerritoryData, UpdateMapTerritoryData, TerritoryRawRow } from './map.types.js';
import { parseTerritoryRings, serializeTerritoryRings } from './map.types.js';
import { BranchOverlayService } from '../branchOverlay.service.js';
import {
  branchEntityVisibilitySql,
  effectiveBranchIdForRead,
  isEntityVisibleInBranch,
  resolveCreatedBranchId,
  assertBranchBelongsToProject,
} from '../branchScope.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Tech debt: derive repo data root via a shared module (e.g. backend/src/config/paths.ts using import.meta.dirname)
// instead of ../../../../data — easy to break when files move.
const DATA_DIR = path.resolve(__dirname, '../../../../data');

function pickMarkerPatch(data: UpdateMarker): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (data.title !== undefined) patch.title = data.title;
  if (data.description !== undefined) patch.description = data.description;
  if (data.positionX !== undefined) patch.positionX = data.positionX;
  if (data.positionY !== undefined) patch.positionY = data.positionY;
  if (data.color !== undefined) patch.color = data.color;
  if (data.icon !== undefined) patch.icon = data.icon;
  if (data.linkedNoteId !== undefined) patch.linkedNoteId = data.linkedNoteId;
  if (data.childMapId !== undefined) patch.childMapId = data.childMapId;
  return patch;
}

function pickTerritoryPatch(data: UpdateMapTerritoryData): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.description !== undefined) patch.description = data.description;
  if (data.color !== undefined) patch.color = data.color;
  if (data.opacity !== undefined) patch.opacity = data.opacity;
  if (data.borderColor !== undefined) patch.borderColor = data.borderColor;
  if (data.borderWidth !== undefined) patch.borderWidth = data.borderWidth;
  if (data.smoothing !== undefined) patch.smoothing = data.smoothing;
  if (data.rings !== undefined) patch.rings = data.rings;
  if (data.factionId !== undefined) patch.factionId = data.factionId;
  if (data.sortOrder !== undefined) patch.sortOrder = data.sortOrder;
  return patch;
}

export class MapService {
  // ==================== Maps ====================

  getRootMap(projectId: number, branchId?: number): Map | null {
    const db = getDb();
    const viewBranch = effectiveBranchIdForRead(projectId, branchId);
    const scope = branchEntityVisibilitySql(projectId, viewBranch, 'created_branch_id', 'created_at');
    return (db.prepare(`
      SELECT id, project_id as projectId, parent_map_id as parentMapId,
        parent_marker_id as parentMarkerId, name, image_path as imagePath,
        created_at as createdAt, updated_at as updatedAt
      FROM maps WHERE project_id = ? AND parent_map_id IS NULL${scope.sql} LIMIT 1
    `).get(projectId, ...scope.params) as Map | undefined) || null;
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

  getMapTree(projectId: number, branchId?: number): Map[] {
    const viewBranch = effectiveBranchIdForRead(projectId, branchId);
    const scope = branchEntityVisibilitySql(projectId, viewBranch, 'created_branch_id', 'created_at');
    return getDb().prepare(`
      SELECT id, project_id as projectId, parent_map_id as parentMapId,
        parent_marker_id as parentMarkerId, name, image_path as imagePath,
        created_at as createdAt, updated_at as updatedAt
      FROM maps WHERE project_id = ?${scope.sql} ORDER BY parent_map_id, name
    `).all(projectId, ...scope.params) as Map[];
  }

  createMap(data: CreateMap, requestBranchId?: number): Map {
    const createdBranchId = resolveCreatedBranchId(data.projectId, requestBranchId);
    const result = getDb().prepare(`
      INSERT INTO maps (project_id, parent_map_id, parent_marker_id, name, image_path, created_branch_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(data.projectId, data.parentMapId || null, data.parentMarkerId || null, data.name, data.imagePath || null, createdBranchId);
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

  createRootMapForProject(projectId: number, imagePath?: string, createdBranchId?: number | null): Map {
    const result = getDb().prepare(`
      INSERT INTO maps (project_id, parent_map_id, name, image_path, created_branch_id) VALUES (?, NULL, ?, ?, ?)
    `).run(projectId, 'World', imagePath || null, createdBranchId ?? null);
    return this.getMapByIdOrThrow(result.lastInsertRowid as number);
  }

  // ==================== Markers ====================

  getMarkersByMapId(mapId: number, branchId?: number): MapMarker[] {
    const map = this.getMapByIdOrThrow(mapId);
    const viewBranch = effectiveBranchIdForRead(map.projectId, branchId);
    const scope = branchEntityVisibilitySql(map.projectId, viewBranch, 'created_branch_id', 'created_at');
    const baseRows = getDb().prepare(`
      SELECT id, map_id as mapId, title, description,
        position_x as positionX, position_y as positionY,
        color, icon, linked_note_id as linkedNoteId, child_map_id as childMapId,
        created_at as createdAt, updated_at as updatedAt
      FROM map_markers WHERE map_id = ?${scope.sql} ORDER BY created_at
    `).all(mapId, ...scope.params) as MapMarker[];
    if (!branchId) return baseRows;
    return BranchOverlayService.applyListOverlay(baseRows, BranchOverlayService.getOverrides(branchId, 'map_marker'));
  }

  getMarkerById(markerId: number, branchId?: number): MapMarker | null {
    type MarkerRow = MapMarker & { createdBranchId?: number | null };
    const raw = getDb().prepare(`
      SELECT id, map_id as mapId, title, description,
        position_x as positionX, position_y as positionY,
        color, icon, linked_note_id as linkedNoteId, child_map_id as childMapId,
        created_at as createdAt, updated_at as updatedAt,
        created_branch_id as createdBranchId
      FROM map_markers WHERE id = ?
    `).get(markerId) as MarkerRow | undefined;

    if (!raw) return null;
    const map = this.getMapByIdOrThrow(raw.mapId);
    const viewBranch = effectiveBranchIdForRead(map.projectId, branchId);
    if (!isEntityVisibleInBranch(map.projectId, viewBranch, raw.createdBranchId, raw.createdAt)) return null;

    const { createdBranchId: _cb, ...markerRest } = raw;
    const baseRow = markerRest as MapMarker;

    if (!branchId) return baseRow;
    return BranchOverlayService.applyItemOverlay(baseRow, BranchOverlayService.getOverrides(branchId, 'map_marker'));
  }

  getMarkerByIdOrThrow(markerId: number, branchId?: number): MapMarker {
    const marker = this.getMarkerById(markerId, branchId);
    if (!marker) throw new NotFoundError('Map marker');
    return marker;
  }

  createMarker(mapId: number, data: CreateMarker, requestBranchId?: number): MapMarker {
    const map = this.getMapByIdOrThrow(mapId);
    if (requestBranchId !== undefined) {
      assertBranchBelongsToProject(requestBranchId, map.projectId);
    }
    const createdBranchId = resolveCreatedBranchId(map.projectId, requestBranchId);

    const result = getDb().prepare(`
      INSERT INTO map_markers (map_id, title, description, position_x, position_y, color, icon, linked_note_id, child_map_id, created_branch_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(mapId, data.title, data.description || '', data.positionX, data.positionY,
      data.color || '#FF6B6B', data.icon || 'custom', data.linkedNoteId || null, data.childMapId || null,
      createdBranchId);
    return this.getMarkerByIdOrThrow(
      result.lastInsertRowid as number,
      requestBranchId ?? effectiveBranchIdForRead(map.projectId, undefined),
    );
  }

  updateMarker(markerId: number, data: UpdateMarker, branchId?: number): MapMarker {
    this.getMarkerByIdOrThrow(markerId, branchId);
    if (branchId) {
      BranchOverlayService.saveUpsertOverride(
        branchId,
        'map_marker',
        markerId,
        pickMarkerPatch(data),
      );
      return this.getMarkerByIdOrThrow(markerId, branchId);
    }

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

  deleteMarker(markerId: number, branchId?: number): void {
    this.getMarkerByIdOrThrow(markerId, branchId);
    if (branchId) {
      BranchOverlayService.saveDeleteOverride(branchId, 'map_marker', markerId);
      return;
    }

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

  getTerritoriesByMapId(mapId: number, branchId?: number): MapTerritory[] {
    const map = this.getMapByIdOrThrow(mapId);
    const viewBranch = effectiveBranchIdForRead(map.projectId, branchId);
    const scope = branchEntityVisibilitySql(map.projectId, viewBranch, 'created_branch_id', 'created_at');
    const rows = getDb().prepare(`
      SELECT id, map_id as mapId, name, description,
        color, opacity, border_color as borderColor,
        border_width as borderWidth, smoothing, points,
        faction_id as factionId, sort_order as sortOrder,
        created_at as createdAt, updated_at as updatedAt,
        created_branch_id as createdBranchId
      FROM map_territories WHERE map_id = ?${scope.sql} ORDER BY sort_order, created_at
    `).all(mapId, ...scope.params) as TerritoryRawRow[];

    const baseRows = rows.map((row) => {
      const { points: rawPoints, createdBranchId: _cb, ...rest } = row;
      return { ...rest, rings: parseTerritoryRings(rawPoints) };
    });
    if (!branchId) return baseRows;
    return BranchOverlayService.applyListOverlay(baseRows, BranchOverlayService.getOverrides(branchId, 'map_territory'));
  }

  getTerritoryById(territoryId: number, branchId?: number): MapTerritory | null {
    const row = getDb().prepare(`
      SELECT id, map_id as mapId, name, description,
        color, opacity, border_color as borderColor,
        border_width as borderWidth, smoothing, points,
        faction_id as factionId, sort_order as sortOrder,
        created_at as createdAt, updated_at as updatedAt,
        created_branch_id as createdBranchId
      FROM map_territories WHERE id = ?
    `).get(territoryId) as TerritoryRawRow | undefined;

    if (!row) return null;
    const map = this.getMapByIdOrThrow(row.mapId);
    const viewBranch = effectiveBranchIdForRead(map.projectId, branchId);
    if (!isEntityVisibleInBranch(map.projectId, viewBranch, row.createdBranchId, row.createdAt)) return null;

    const { points: rawPoints, createdBranchId: _cb, ...rest } = row;
    const baseRow = { ...rest, rings: parseTerritoryRings(rawPoints) };
    if (!branchId) return baseRow;
    return BranchOverlayService.applyItemOverlay(baseRow, BranchOverlayService.getOverrides(branchId, 'map_territory'));
  }

  getTerritoryByIdOrThrow(territoryId: number, branchId?: number): MapTerritory {
    const territory = this.getTerritoryById(territoryId, branchId);
    if (!territory) throw new NotFoundError('Map territory');
    return territory;
  }

  createTerritory(mapId: number, data: CreateMapTerritoryData, requestBranchId?: number): MapTerritory {
    const map = this.getMapByIdOrThrow(mapId);
    if (requestBranchId !== undefined) {
      assertBranchBelongsToProject(requestBranchId, map.projectId);
    }
    const createdBranchId = resolveCreatedBranchId(map.projectId, requestBranchId);

    const rings = data.rings ?? [];
    const result = getDb().prepare(`
      INSERT INTO map_territories (map_id, name, description, color, opacity, border_color, border_width, smoothing, points, faction_id, sort_order, created_branch_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(mapId, data.name, data.description || '', data.color || '#4ECDC4',
      data.opacity ?? 0.25, data.borderColor || '#4ECDC4', data.borderWidth ?? 2,
      data.smoothing ?? 0, serializeTerritoryRings(rings),
      data.factionId || null, data.sortOrder ?? 0, createdBranchId);
    return this.getTerritoryByIdOrThrow(
      result.lastInsertRowid as number,
      requestBranchId ?? effectiveBranchIdForRead(map.projectId, undefined),
    );
  }

  updateTerritory(territoryId: number, data: UpdateMapTerritoryData, branchId?: number): MapTerritory {
    this.getTerritoryByIdOrThrow(territoryId, branchId);
    if (branchId) {
      BranchOverlayService.saveUpsertOverride(
        branchId,
        'map_territory',
        territoryId,
        pickTerritoryPatch(data),
      );
      return this.getTerritoryByIdOrThrow(territoryId, branchId);
    }

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
    return this.getTerritoryByIdOrThrow(territoryId, branchId);
  }

  deleteTerritory(territoryId: number, branchId?: number): void {
    this.getTerritoryByIdOrThrow(territoryId, branchId);
    if (branchId) {
      BranchOverlayService.saveDeleteOverride(branchId, 'map_territory', territoryId);
      return;
    }

    getDb().prepare('DELETE FROM map_territories WHERE id = ?').run(territoryId);
  }

  /** Все территории проекта с привязкой к фракции (для UI государства). */
  listTerritorySummariesForProject(projectId: number, branchId?: number): Array<{
    id: number;
    name: string;
    mapId: number;
    mapName: string;
    factionId: number | null;
    occupantName: string | null;
    occupantKind: 'state' | 'faction' | null;
  }> {
    const viewBranch = effectiveBranchIdForRead(projectId, branchId);
    const scope = branchEntityVisibilitySql(projectId, viewBranch, 'mt.created_branch_id', 'mt.created_at');
    const params: Array<number | string> = [projectId, ...scope.params];
    return getDb().prepare(`
      SELECT mt.id, mt.name, mt.map_id as mapId, m.name as mapName,
        mt.faction_id as factionId,
        f.name as occupantName,
        f.kind as occupantKind
      FROM map_territories mt
      JOIN maps m ON mt.map_id = m.id
      LEFT JOIN factions f ON mt.faction_id = f.id
      WHERE m.project_id = ?${scope.sql}
      ORDER BY m.name COLLATE NOCASE, mt.name COLLATE NOCASE
    `).all(...params) as Array<{
      id: number;
      name: string;
      mapId: number;
      mapName: string;
      factionId: number | null;
      occupantName: string | null;
      occupantKind: 'state' | 'faction' | null;
    }>;
  }
}

export const mapService = new MapService();
