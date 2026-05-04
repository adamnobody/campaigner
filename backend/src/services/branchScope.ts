import { getDb } from '../db/connection.js';
import { BadRequestError } from '../middleware/errorHandler.js';
import { BranchService } from './branch.service.js';

/**
 * Rows with created_branch_id IS NULL are legacy/unscoped (rare after migration) and stay visible in every branch.
 * Rows with a branch id follow snapshot inheritance: a non-main branch sees its own rows, plus rows from
 * ancestor branches that were created at or before each fork step (branch.created_at on the child).
 * Main branch sees only NULL + rows created on main (not side-branch-only rows).
 */
export function getMainBranchIdForProject(projectId: number): number | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id FROM scenario_branches WHERE project_id = ? AND is_main = 1 LIMIT 1`,
    )
    .get(projectId) as { id: number } | undefined;
  return row?.id ?? null;
}

/** Uses main branch when request omits branchId so creates are never stored as global NULL. */
export function resolveCreatedBranchId(projectId: number, requestBranchId?: number): number | null {
  const branchId = requestBranchId ?? getMainBranchIdForProject(projectId);
  if (branchId == null) return null;
  assertBranchBelongsToProject(branchId, projectId);
  return branchId;
}

export function assertBranchBelongsToProject(branchId: number, projectId: number): void {
  const branch = BranchService.getById(branchId);
  if (branch.projectId !== projectId) {
    throw new BadRequestError('branchId does not belong to this project');
  }
}

/** Branch used for read/list/search when API does not pass branchId (defaults to main). */
export function effectiveBranchIdForRead(projectId: number, branchId?: number): number | undefined {
  if (branchId != null) return branchId;
  const main = getMainBranchIdForProject(projectId);
  return main ?? undefined;
}

export function branchEntityVisibilitySql(
  projectId: number,
  branchId: number | undefined,
  createdBranchColumn: string,
  createdAtColumn: string,
): { sql: string; params: (number | string)[] } {
  if (branchId == null) {
    return { sql: '', params: [] };
  }

  const mainId = getMainBranchIdForProject(projectId);
  if (mainId == null) {
    return { sql: '', params: [] };
  }

  if (branchId === mainId) {
    return {
      sql: ` AND (${createdBranchColumn} IS NULL OR ${createdBranchColumn} = ?)`,
      params: [mainId],
    };
  }

  const chain = BranchService.getAncestryToRoot(branchId);
  if (chain.length === 0 || chain[0]!.id !== branchId) {
    return { sql: ' AND 1=0', params: [] };
  }

  const parts: string[] = [`${createdBranchColumn} IS NULL`, `${createdBranchColumn} = ?`];
  const params: (number | string)[] = [branchId];

  for (let i = 0; i < chain.length - 1; i++) {
    const child = chain[i]!;
    const parent = chain[i + 1]!;
    parts.push(
      `(${createdBranchColumn} = ? AND datetime(${createdAtColumn}) <= datetime(?))`,
    );
    params.push(parent.id, child.createdAt);
  }

  return {
    sql: ` AND (${parts.join(' OR ')})`,
    params,
  };
}

/** @deprecated Use branchEntityVisibilitySql(projectId, branchId, col, createdAtCol) */
export function branchCreatedScopeSql(
  branchId: number | undefined,
  columnRef = 'created_branch_id',
  projectId?: number,
  createdAtRef = 'created_at',
): { sql: string; params: (number | string)[] } {
  if (projectId == null) {
    return { sql: '', params: [] };
  }
  const view = effectiveBranchIdForRead(projectId, branchId);
  return branchEntityVisibilitySql(projectId, view, columnRef, createdAtRef);
}

export function isEntityVisibleInBranch(
  projectId: number,
  branchId: number | undefined,
  createdBranchId: number | null | undefined,
  createdAt: string | null | undefined,
): boolean {
  const viewBranch = effectiveBranchIdForRead(projectId, branchId);
  if (viewBranch == null) {
    return true;
  }

  const mainId = getMainBranchIdForProject(projectId);
  if (mainId == null) {
    return true;
  }

  if (createdBranchId == null) {
    return true;
  }

  if (viewBranch === mainId) {
    return createdBranchId === mainId;
  }

  const chain = BranchService.getAncestryToRoot(viewBranch);
  if (chain.length === 0 || chain[0]!.id !== viewBranch) {
    return false;
  }

  if (createdBranchId === viewBranch) {
    return true;
  }

  for (let i = 0; i < chain.length - 1; i++) {
    const child = chain[i]!;
    const parent = chain[i + 1]!;
    if (
      createdBranchId === parent.id &&
      createdAt != null &&
      createdAt <= child.createdAt
    ) {
      return true;
    }
  }

  return false;
}
