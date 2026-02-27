import { getDb } from '../db/connection';
import { CreateProject, UpdateProject, Project } from '@campaigner/shared';
import { NotFoundError } from '../middleware/errorHandler';

export class ProjectService {
  static getAll(): Project[] {
    const db = getDb();
    const rows = db.prepare(`
      SELECT id, name, description, status, map_image_path as mapImagePath,
             created_at as createdAt, updated_at as updatedAt
      FROM projects ORDER BY updated_at DESC
    `).all() as Project[];
    return rows;
  }

  static getById(id: number): Project {
    const db = getDb();
    const row = db.prepare(`
      SELECT id, name, description, status, map_image_path as mapImagePath,
             created_at as createdAt, updated_at as updatedAt
      FROM projects WHERE id = ?
    `).get(id) as Project | undefined;

    if (!row) throw new NotFoundError('Project');
    return row;
  }

  static create(data: CreateProject): Project {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO projects (name, description, status)
      VALUES (?, ?, ?)
    `).run(data.name, data.description || '', data.status || 'active');

    return this.getById(result.lastInsertRowid as number);
  }

  static update(id: number, data: UpdateProject): Project {
    this.getById(id); // ensure exists
    const db = getDb();

    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
    if (data.mapImagePath !== undefined) { fields.push('map_image_path = ?'); values.push(data.mapImagePath); }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      values.push(id);
      db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.getById(id);
  }

  static delete(id: number): void {
    this.getById(id); // ensure exists
    const db = getDb();
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  }

  static updateMapImage(id: number, imagePath: string): Project {
    this.getById(id);
    const db = getDb();
    db.prepare(`UPDATE projects SET map_image_path = ?, updated_at = datetime('now') WHERE id = ?`).run(imagePath, id);
    return this.getById(id);
  }
}