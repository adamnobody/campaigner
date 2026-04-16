export interface ExcludableItem {
  id: number;
  name: string;
  exclusions?: number[];
}

export interface ConflictPair {
  leftId: number;
  rightId: number;
}

export function isExcluded(
  candidateId: number,
  assignedIds: number[],
  catalog: ExcludableItem[]
): boolean {
  return getExcludingIds(candidateId, assignedIds, catalog).length > 0;
}

export function getExcludingIds(
  candidateId: number,
  assignedIds: number[],
  catalog: ExcludableItem[]
): number[] {
  const byId = new Map(catalog.map((item) => [item.id, item]));
  const uniqueAssigned = Array.from(new Set(assignedIds));
  const conflicts = new Set<number>();

  for (const assignedId of uniqueAssigned) {
    if (assignedId === candidateId) continue;
    const assigned = byId.get(assignedId);
    const candidate = byId.get(candidateId);
    if (!assigned || !candidate) continue;
    const assignedExclusions = new Set(assigned.exclusions ?? []);
    const candidateExclusions = new Set(candidate.exclusions ?? []);
    if (assignedExclusions.has(candidateId) || candidateExclusions.has(assignedId)) {
      conflicts.add(assignedId);
    }
  }

  return Array.from(conflicts);
}

export function getConflictPairs(
  assignedIds: number[],
  catalog: ExcludableItem[]
): ConflictPair[] {
  const byId = new Map(catalog.map((item) => [item.id, item]));
  const uniqueAssigned = Array.from(new Set(assignedIds));
  const seen = new Set<string>();
  const conflicts: ConflictPair[] = [];

  for (const leftId of uniqueAssigned) {
    const left = byId.get(leftId);
    if (!left) continue;
    const leftExclusions = new Set(left.exclusions ?? []);

    for (const rightId of uniqueAssigned) {
      if (leftId === rightId) continue;
      const right = byId.get(rightId);
      if (!right) continue;
      const rightExclusions = new Set(right.exclusions ?? []);
      const hasConflict = leftExclusions.has(rightId) || rightExclusions.has(leftId);
      if (!hasConflict) continue;

      const a = Math.min(leftId, rightId);
      const b = Math.max(leftId, rightId);
      const key = `${a}:${b}`;
      if (seen.has(key)) continue;
      seen.add(key);
      conflicts.push({ leftId: a, rightId: b });
    }
  }

  return conflicts;
}
