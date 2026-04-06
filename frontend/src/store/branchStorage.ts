const LEGACY_ACTIVE_BRANCH_STORAGE_KEY = 'campaigner.activeBranchId';
const ACTIVE_BRANCH_KEY_PREFIX = 'campaigner.activeBranchId.project';

function parseBranchId(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return undefined;
  return id;
}

function keyByProject(projectId: number): string {
  return `${ACTIVE_BRANCH_KEY_PREFIX}.${projectId}`;
}

export function getActiveBranchId(projectId?: number): number | undefined {
  if (typeof projectId === 'number' && Number.isInteger(projectId) && projectId > 0) {
    return parseBranchId(localStorage.getItem(keyByProject(projectId)));
  }

  return parseBranchId(localStorage.getItem(LEGACY_ACTIVE_BRANCH_STORAGE_KEY));
}

export function setActiveBranchId(projectId: number, branchId: number): void {
  if (!Number.isInteger(projectId) || projectId <= 0) return;
  if (!Number.isInteger(branchId) || branchId <= 0) return;
  localStorage.setItem(keyByProject(projectId), String(branchId));
}

export function clearActiveBranchId(projectId: number): void {
  if (!Number.isInteger(projectId) || projectId <= 0) return;
  localStorage.removeItem(keyByProject(projectId));
}
