import { BadRequestError } from '../middleware/errorHandler.js';

/** branchId from query/body when omitted means “use main for read” (backend default). */
export function parseOptionalBranchId(input: unknown): number | undefined {
  if (input === undefined || input === null || input === '') return undefined;
  const branchId = Number(input);
  return Number.isInteger(branchId) && branchId > 0 ? branchId : undefined;
}

export function parseBranchIdStrict(input: unknown): number | undefined {
  if (input === undefined || input === null || input === '') return undefined;
  const branchId = Number(input);
  if (!Number.isInteger(branchId) || branchId <= 0) {
    throw new BadRequestError('Invalid branchId');
  }
  return branchId;
}
