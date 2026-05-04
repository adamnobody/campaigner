import { getDb } from '../db/connection.js';
import { BadRequestError } from '../middleware/errorHandler.js';
import { BranchService } from './branch.service.js';

/** Main / canon branch: rows with NULL created_branch_id are visible on every branch. */
export function getMainBranchIdForProject(projectId: number): number | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id FROM scenario_branches WHERE project_id = ? AND is_main = 1 LIMIT 1`,
    )
    .get(projectId) as { id: number } | undefined;
  return row?.id ?? null;
}

/** NULL = shared across branches; non-main branch id = visible only on that branch (and when branchId omitted in API). */
export function resolveCreatedBranchId(projectId: number, requestBranchId?: number): number | null {
  if (requestBranchId === undefined) return null;
  const mainId = getMainBranchIdForProject(projectId);
  if (mainId !== null && requestBranchId === mainId) return null;
  return requestBranchId;
}

export function assertBranchBelongsToProject(branchId: number, projectId: number): void {
  const branch = BranchService.getById(branchId);
  if (branch.projectId !== projectId) {
    throw new BadRequestError('branchId does not belong to this project');
  }
}

export function branchCreatedScopeSql(
  branchId: number | undefined,
  columnRef = 'created_branch_id',
): { sql: string; params: number[] } {
  if (!branchId) return { sql: '', params: [] };
  return {
    sql: ` AND (${columnRef} IS NULL OR ${columnRef} = ?)`,
    params: [branchId],
  };
}

export function isRowVisibleForActiveBranch(
  createdBranchId: number | null | undefined,
  branchId?: number,
): boolean {
  if (!branchId) return true;
  if (createdBranchId == null) return true;
  return createdBranchId === branchId;
}
