import { getActiveBranchId } from '@/store/branchStorage';

/** Attach active branch for the given project so list/detail requests match the scenario branch. */
export function withBranchParams<T extends Record<string, unknown>>(
  payload: T,
  explicitProjectId?: number,
): T & { branchId?: number } {
  const fromPayload =
    typeof payload.projectId === 'number' && payload.projectId > 0 ? payload.projectId : undefined;
  const projectId =
    explicitProjectId !== undefined && explicitProjectId > 0 ? explicitProjectId : fromPayload;

  const branchId =
    projectId !== undefined ? getActiveBranchId(projectId) : getActiveBranchId();

  return branchId ? { ...payload, branchId } : payload;
}
