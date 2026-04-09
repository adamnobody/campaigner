import { BadRequestError } from '../middleware/errorHandler.js';

export function parseId(value: string | undefined, fieldName = 'id'): number {
  const parsed = Number(value);

  if (!value || !Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestError(`Invalid ${fieldName}`);
  }

  return parsed;
}