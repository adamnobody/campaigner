const ACTIVE_BRANCH_STORAGE_KEY = 'campaigner.activeBranchId';

export function getActiveBranchId(): number | undefined {
  const raw = localStorage.getItem(ACTIVE_BRANCH_STORAGE_KEY);
  if (!raw) return undefined;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return undefined;
  return id;
}
