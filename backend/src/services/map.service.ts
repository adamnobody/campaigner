import { getDb } from '../db/connection.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type { Map, CreateMap, UpdateMap, MapMarker, CreateMarker, UpdateMarker } from '@campaigner/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../../data');

export class MapService {
  // ==================== Карты ====================

  /**
   * Получить корневую карту проекта
   */
  getRootMap(projectId: number): Map | null {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT 
        id, project_id as projectId, parent_map_id as parentMapId,
        parent_marker_id as parentMarkerId, name, image_path as imagePath,
        created_at as createdAt, updated_at as updatedAt
      FROM maps
      WHERE project_id = ? AND parent_map_id IS NULL
      LIMIT 1
    `);
    return stmt.get(projectId) as Map | undefined || null;
  }

  /**
   * Получить карту по ID
   */
  getMapById(mapId: number): Map | null {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT 
        id, project_id as projectId, parent_map_id as parentMapId,
        parent_marker_id as parentMarkerId, name, image_path as imagePath,
        created_at as createdAt, updated_at as updatedAt
      FROM maps
      WHERE id = ?
    `);
    return stmt.get(mapId) as Map | undefined || null;
  }

  /**
   * Получить все карты проекта (иерархия)
   */
  getMapTree(projectId: number): Map[] {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT 
        id, project_id as projectId, parent_map_id as parentMapId,
        parent_marker_id as parentMarkerId, name, image_path as imagePath,
        created_at as createdAt, updated_at as updatedAt
      FROM maps
      WHERE project_id = ?
      ORDER BY parent_map_id, name
    `);
    return stmt.all(projectId) as Map[];
  }

  /**
   * Создать новую карту
   */
  createMap(data: CreateMap): Map {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO maps (project_id, parent_map_id, parent_marker_id, name, image_path)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.projectId,
      data.parentMapId || null,
      data.parentMarkerId || null,
      data.name,
      data.imagePath || null
    );

    return this.getMapById(result.lastInsertRowid as number)!;
  }

  /**
   * Обновить карту
   */
  updateMap(mapId: number, data: UpdateMap): Map {
    const db = getDb();
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.imagePath !== undefined) {
      updates.push('image_path = ?');
      values.push(data.imagePath);
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      const stmt = db.prepare(`UPDATE maps SET ${updates.join(', ')} WHERE id = ?`);
      stmt.run(...values, mapId);
    }

    return this.getMapById(mapId)!;
  }

  /**
   * Загрузить изображение для карты
   */
  uploadMapImage(mapId: number, file: Express.Multer.File): Map {
    const db = getDb();
    const map = this.getMapById(mapId);
    if (!map) throw new Error('Карта не найдена');

    // Удаляем старое изображение если есть
    if (map.imagePath) {
      const oldPath = path.join(DATA_DIR, map.imagePath);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Сохраняем новый файл
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const filename = `map_${mapId}_${Date.now()}${ext}`;
    const dirPath = path.join(DATA_DIR, 'uploads', 'maps');

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const filePath = path.join(dirPath, filename);
    fs.writeFileSync(filePath, file.buffer);

    const relativePath = `/uploads/maps/${filename}`;

    const stmt = db.prepare("UPDATE maps SET image_path = ?, updated_at = datetime('now') WHERE id = ?");
    stmt.run(relativePath, mapId);

    return this.getMapById(mapId)!;
  }

  /**
   * Удалить карту (каскадно удалит маркеры и вложенные карты)
   */
  deleteMap(mapId: number): void {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM maps WHERE id = ?');
    stmt.run(mapId);
  }

  /**
   * Создать корневую карту для проекта (при миграции)
   */
  createRootMapForProject(projectId: number, imagePath?: string): Map {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO maps (project_id, parent_map_id, name, image_path)
      VALUES (?, NULL, ?, ?)
    `);
    
    const result = stmt.run(projectId, 'Мир', imagePath || null);
    return this.getMapById(result.lastInsertRowid as number)!;
  }

  // ==================== Маркеры ====================

  /**
   * Получить все маркеры карты
   */
  getMarkersByMapId(mapId: number): MapMarker[] {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT 
        id, map_id as mapId, title, description,
        position_x as positionX, position_y as positionY,
        color, icon, linked_note_id as linkedNoteId,
        child_map_id as childMapId,
        created_at as createdAt, updated_at as updatedAt
      FROM map_markers
      WHERE map_id = ?
      ORDER BY created_at
    `);
    return stmt.all(mapId) as MapMarker[];
  }

  /**
   * Получить маркер по ID
   */
  getMarkerById(markerId: number): MapMarker | null {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT 
        id, map_id as mapId, title, description,
        position_x as positionX, position_y as positionY,
        color, icon, linked_note_id as linkedNoteId,
        child_map_id as childMapId,
        created_at as createdAt, updated_at as updatedAt
      FROM map_markers
      WHERE id = ?
    `);
    return stmt.get(markerId) as MapMarker | undefined || null;
  }

  /**
   * Создать маркер
   */
  createMarker(mapId: number, data: CreateMarker): MapMarker {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO map_markers 
      (map_id, title, description, position_x, position_y, color, icon, linked_note_id, child_map_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      mapId,
      data.title,
      data.description || '',
      data.positionX,
      data.positionY,
      data.color || '#FF6B6B',
      data.icon || 'custom',
      data.linkedNoteId || null,
      data.childMapId || null
    );

    return this.getMarkerById(result.lastInsertRowid as number)!;
  }

  /**
   * Обновить маркер
   */
  updateMarker(markerId: number, data: UpdateMarker): MapMarker {
    const db = getDb();
    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      values.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.positionX !== undefined) {
      updates.push('position_x = ?');
      values.push(data.positionX);
    }
    if (data.positionY !== undefined) {
      updates.push('position_y = ?');
      values.push(data.positionY);
    }
    if (data.color !== undefined) {
      updates.push('color = ?');
      values.push(data.color);
    }
    if (data.icon !== undefined) {
      updates.push('icon = ?');
      values.push(data.icon);
    }
    if (data.linkedNoteId !== undefined) {
      updates.push('linked_note_id = ?');
      values.push(data.linkedNoteId);
    }
    if (data.childMapId !== undefined) {
      updates.push('child_map_id = ?');
      values.push(data.childMapId);
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      const stmt = db.prepare(`UPDATE map_markers SET ${updates.join(', ')} WHERE id = ?`);
      stmt.run(...values, markerId);
    }

    return this.getMarkerById(markerId)!;
  }

  /**
   * Удалить маркер
   */
  deleteMarker(markerId: number): void {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM map_markers WHERE id = ?');
    stmt.run(markerId);
  }

  /**
   * Получить маркер по дочерней карте (обратная связь)
   */
  getMarkerByChildMapId(childMapId: number): MapMarker | null {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT 
        id, map_id as mapId, title, description,
        position_x as positionX, position_y as positionY,
        color, icon, linked_note_id as linkedNoteId,
        child_map_id as childMapId,
        created_at as createdAt, updated_at as updatedAt
      FROM map_markers
      WHERE child_map_id = ?
    `);
    return stmt.get(childMapId) as MapMarker | undefined || null;
  }
  
  // ==================== Территории ====================

  getTerritoriesByMapId(mapId: number): any[] {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT
        id, map_id as mapId, name, description,
        color, opacity, border_color as borderColor,
        border_width as borderWidth, points,
        faction_id as factionId, sort_order as sortOrder,
        created_at as createdAt, updated_at as updatedAt
      FROM map_territories
      WHERE map_id = ?
      ORDER BY sort_order, created_at
    `);
    const rows = stmt.all(mapId) as any[];
    return rows.map(r => ({
      ...r,
      points: JSON.parse(r.points || '[]'),
    }));
  }

  getTerritoryById(territoryId: number): any | null {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT
        id, map_id as mapId, name, description,
        color, opacity, border_color as borderColor,
        border_width as borderWidth, points,
        faction_id as factionId, sort_order as sortOrder,
        created_at as createdAt, updated_at as updatedAt
      FROM map_territories
      WHERE id = ?
    `);
    const row = stmt.get(territoryId) as any | undefined;
    if (!row) return null;
    return { ...row, points: JSON.parse(row.points || '[]') };
  }

  createTerritory(mapId: number, data: any): any {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO map_territories
      (map_id, name, description, color, opacity, border_color, border_width, points, faction_id, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      mapId,
      data.name,
      data.description || '',
      data.color || '#4ECDC4',
      data.opacity ?? 0.25,
      data.borderColor || '#4ECDC4',
      data.borderWidth ?? 2,
      JSON.stringify(data.points || []),
      data.factionId || null,
      data.sortOrder ?? 0,
    );
    return this.getTerritoryById(result.lastInsertRowid as number)!;
  }

  updateTerritory(territoryId: number, data: any): any {
    const db = getDb();
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
    if (data.color !== undefined) { updates.push('color = ?'); values.push(data.color); }
    if (data.opacity !== undefined) { updates.push('opacity = ?'); values.push(data.opacity); }
    if (data.borderColor !== undefined) { updates.push('border_color = ?'); values.push(data.borderColor); }
    if (data.borderWidth !== undefined) { updates.push('border_width = ?'); values.push(data.borderWidth); }
    if (data.points !== undefined) { updates.push('points = ?'); values.push(JSON.stringify(data.points)); }
    if (data.factionId !== undefined) { updates.push('faction_id = ?'); values.push(data.factionId); }
    if (data.sortOrder !== undefined) { updates.push('sort_order = ?'); values.push(data.sortOrder); }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      const stmt = db.prepare(`UPDATE map_territories SET ${updates.join(', ')} WHERE id = ?`);
      stmt.run(...values, territoryId);
    }

    return this.getTerritoryById(territoryId)!;
  }

  deleteTerritory(territoryId: number): void {
    const db = getDb();
    db.prepare('DELETE FROM map_territories WHERE id = ?').run(territoryId);
  }
}

export const mapService = new MapService();