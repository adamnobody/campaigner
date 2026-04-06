import { getDb } from '../db/connection';
import type { CreateScenarioBranch, ScenarioBranch, UpdateScenarioBranch } from '@campaigner/shared';
import { NotFoundError } from '../middleware/errorHandler';

export class BranchService {
  static getAll(projectId: number): ScenarioBranch[] {
    const db = getDb();
    return db.prepare(`
      SELECT
        id,
        project_id as projectId,
        name,
        parent_branch_id as parentBranchId,
        base_revision as baseRevision,
        is_main as isMain,
        created_at as createdAt,
        updated_at as updatedAt
      FROM scenario_branches
      WHERE project_id = ?
      ORDER BY is_main DESC, created_at ASC
    `).all(projectId) as ScenarioBranch[];
  }

  static create(data: CreateScenarioBranch): ScenarioBranch {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO scenario_branches (project_id, name, parent_branch_id, base_revision, is_main)
      VALUES (?, ?, ?, ?, 0)
    `).run(data.projectId, data.name, data.parentBranchId ?? null, data.baseRevision ?? 0);
    return this.getById(result.lastInsertRowid as number);
  }

  static update(id: number, data: UpdateScenarioBranch): ScenarioBranch {
    const db = getDb();
    this.getById(id);
    if (typeof data.name === 'string' && data.name.trim()) {
      db.prepare(`
        UPDATE scenario_branches
        SET name = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(data.name.trim(), id);
    }
    return this.getById(id);
  }

  static delete(id: number): void {
    const db = getDb();
    const branch = this.getById(id);
    if (branch.isMain) return;
    db.prepare(`DELETE FROM scenario_branches WHERE id = ?`).run(id);
  }

  static getById(id: number): ScenarioBranch {
    const db = getDb();
    const row = db.prepare(`
      SELECT
        id,
        project_id as projectId,
        name,
        parent_branch_id as parentBranchId,
        base_revision as baseRevision,
        is_main as isMain,
        created_at as createdAt,
        updated_at as updatedAt
      FROM scenario_branches
      WHERE id = ?
    `).get(id) as ScenarioBranch | undefined;
    if (!row) throw new NotFoundError('Scenario branch');
    return { ...row, isMain: Boolean(row.isMain) };
  }
}
