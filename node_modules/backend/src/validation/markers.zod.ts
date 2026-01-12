import { z } from 'zod';

const MAX_TEXT = 300 * 1024; // 300 KB

export const MarkerTypeSchema = z.enum(['location', 'event', 'character']);
export const MarkerLinkTypeSchema = z.enum(['note', 'map']);

export const HexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'color must be #RRGGBB');

// NEW: icon key ('' = auto)
export const MarkerIconSchema = z
  .enum(['', 'pin', 'star', 'user', 'flag', 'skull', 'crown', 'book', 'home'])
  .optional()
  .default('');

const CreateLinkFieldsSchema = z
  .object({
    link_type: MarkerLinkTypeSchema.nullable().default(null),
    link_note_id: z.string().trim().min(1).nullable().default(null),
    link_map_id: z.string().trim().min(1).nullable().default(null)
  })
  .superRefine((val, ctx) => {
    const { link_type: lt, link_note_id: noteId, link_map_id: mapId } = val;

    if (lt === null) {
      if (noteId)
        ctx.addIssue({
          code: 'custom',
          path: ['link_note_id'],
          message: 'link_note_id must be null when link_type is null'
        });
      if (mapId)
        ctx.addIssue({
          code: 'custom',
          path: ['link_map_id'],
          message: 'link_map_id must be null when link_type is null'
        });
      return;
    }

    if (lt === 'note') {
      if (!noteId)
        ctx.addIssue({
          code: 'custom',
          path: ['link_note_id'],
          message: 'link_note_id is required when link_type=note'
        });
      if (mapId)
        ctx.addIssue({
          code: 'custom',
          path: ['link_map_id'],
          message: 'link_map_id must be null when link_type=note'
        });
    }

    if (lt === 'map') {
      if (!mapId)
        ctx.addIssue({
          code: 'custom',
          path: ['link_map_id'],
          message: 'link_map_id is required when link_type=map'
        });
      if (noteId)
        ctx.addIssue({
          code: 'custom',
          path: ['link_note_id'],
          message: 'link_note_id must be null when link_type=map'
        });
    }
  });

const PatchLinkFieldsSchema = z
  .object({
    link_type: MarkerLinkTypeSchema.nullable().optional(),
    link_note_id: z.string().trim().min(1).nullable().optional(),
    link_map_id: z.string().trim().min(1).nullable().optional()
  })
  .superRefine((val, ctx) => {
    const touches = val.link_type !== undefined || val.link_note_id !== undefined || val.link_map_id !== undefined;
    if (!touches) return;

    const lt = val.link_type ?? null;
    const noteId = val.link_note_id ?? null;
    const mapId = val.link_map_id ?? null;

    if (lt === null) {
      if (noteId)
        ctx.addIssue({
          code: 'custom',
          path: ['link_note_id'],
          message: 'link_note_id must be null when link_type is null'
        });
      if (mapId)
        ctx.addIssue({
          code: 'custom',
          path: ['link_map_id'],
          message: 'link_map_id must be null when link_type is null'
        });
      return;
    }

    if (lt === 'note') {
      if (!noteId)
        ctx.addIssue({
          code: 'custom',
          path: ['link_note_id'],
          message: 'link_note_id is required when link_type=note'
        });
      if (mapId)
        ctx.addIssue({
          code: 'custom',
          path: ['link_map_id'],
          message: 'link_map_id must be null when link_type=note'
        });
    }

    if (lt === 'map') {
      if (!mapId)
        ctx.addIssue({
          code: 'custom',
          path: ['link_map_id'],
          message: 'link_map_id is required when link_type=map'
        });
      if (noteId)
        ctx.addIssue({
          code: 'custom',
          path: ['link_note_id'],
          message: 'link_note_id must be null when link_type=map'
        });
    }
  });

export const CreateMarkerSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    description: z.string().max(MAX_TEXT).optional().default(''),
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    marker_type: MarkerTypeSchema,
    color: HexColorSchema,

    // NEW
    icon: MarkerIconSchema
  })
  .and(CreateLinkFieldsSchema);

export const PatchMarkerSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    description: z.string().max(MAX_TEXT).optional(),
    x: z.number().min(0).max(1).optional(),
    y: z.number().min(0).max(1).optional(),
    marker_type: MarkerTypeSchema.optional(),
    color: HexColorSchema.optional(),

    // NEW
    icon: z.enum(['', 'pin', 'star', 'user', 'flag', 'skull', 'crown', 'book', 'home']).optional()
  })
  .and(PatchLinkFieldsSchema);

export type CreateMarkerDto = z.infer<typeof CreateMarkerSchema>;
export type UpdateMarkerDto = z.infer<typeof PatchMarkerSchema>;
