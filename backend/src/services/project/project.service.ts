import { getDb } from '../../db/connection.js';
import { CreateProject, UpdateProject, Project } from '@campaigner/shared';
import { NotFoundError } from '../../middleware/errorHandler.js';
import { MapService } from '../map/index.js';
import { CharacterTraitService } from '../character-trait.service.js';
import { buildUpdateQuery } from '../../utils/dbHelpers.js';
import { exportProject } from './projectExport.service.js';
import { importProject } from './projectImport.service.js';
import type { ImportedProjectPayload } from '@campaigner/shared';
import { demoProjectPayload } from './demoProject.payload.js';

const PROJECT_UPDATE_MAP: Record<string, string> = {
  name: 'name',
  description: 'description',
  status: 'status',
  mapImagePath: 'map_image_path',
};

export class ProjectService {
  static getAll(): Project[] {
    const db = getDb();
    return db.prepare(`
      SELECT id, name, description, status, map_image_path as mapImagePath,
             created_at as createdAt, updated_at as updatedAt
      FROM projects ORDER BY updated_at DESC
    `).all() as Project[];
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
      INSERT INTO projects (name, description, status) VALUES (?, ?, ?)
    `).run(data.name, data.description || '', data.status || 'active');

    const projectId = result.lastInsertRowid as number;
    const mainBranchName = (data.mainBranchName?.trim() || 'Canon branch').slice(0, 120);
    db.prepare(`
      INSERT INTO scenario_branches (project_id, name, is_main)
      VALUES (?, ?, 1)
    `).run(projectId, mainBranchName);
    const mapService = new MapService();
    mapService.createRootMapForProject(projectId);
    CharacterTraitService.seedPredefined(projectId);

    return this.getById(projectId);
  }

  static update(id: number, data: UpdateProject): Project {
    this.getById(id);
    buildUpdateQuery('projects', PROJECT_UPDATE_MAP, data as Record<string, unknown>, id);
    return this.getById(id);
  }

  static delete(id: number): void {
    this.getById(id);
    const db = getDb();
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  }

  static updateMapImage(id: number, imagePath: string): Project {
    this.getById(id);
    const db = getDb();
    db.prepare(`
      UPDATE projects SET map_image_path = ?, updated_at = datetime('now') WHERE id = ?
    `).run(imagePath, id);
    return this.getById(id);
  }

  static exportProject(id: number) {
    return exportProject(id);
  }

  static importProject(data: ImportedProjectPayload): Project {
    return importProject(data);
  }

  static createDemoProject(): Project {
    return importProject(demoProjectPayload);
  }
}
