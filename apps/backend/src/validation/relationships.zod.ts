import { z } from 'zod';

export const RelationshipTypeSchema = z.enum([
  'friend',
  'enemy',
  'parent',
  'child',
  'sibling',
  'spouse',
  'lover',
  'mentor',
  'student',
  'ally',
  'rival',
  'colleague',
  'leader',
  'subordinate',
  'other',
]);

export const CreateRelationshipSchema = z.object({
  from_character_id: z.string().min(1),
  to_character_id: z.string().min(1),
  type: RelationshipTypeSchema,
  note: z.string().max(5000).optional().default(''),
});