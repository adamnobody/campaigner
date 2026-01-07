import { z } from 'zod';

const MAX_TEXT = 300 * 1024;

export const MarkerTypeSchema = z.enum(['location', 'event', 'character', 'area']);
export const MarkerLinkTypeSchema = z.enum(['note', 'map']);

export const HexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'color must be #RRGGBB');

const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const LinkFieldsSchema = z.object({
  link_type: MarkerLinkTypeSchema.optional().nullable(),
  link_note_id: z.string().trim().min(1).optional().nullable(),
  link_map_id: z.string().trim().min(1).optional().nullable()
}).superRefine((val, ctx) => {
  const lt = val.link_type ?? null;
  const noteId = val.link_note_id ?? null;
  const mapId = val.link_map_id ?? null;

  if (lt === null) {
    return;
  }

  if (lt === 'note') {
    if (!noteId) ctx.addIssue({ code: 'custom', message: 'link_note_id is required when link_type=note' });
    if (mapId) ctx.addIssue({ code: 'custom', message: 'link_map_id must be null when link_type=note' });
  }

  if (lt === 'map') {
    if (!mapId) ctx.addIssue({ code: 'custom', message: 'link_map_id is required when link_type=map' });
    if (noteId) ctx.addIssue({ code: 'custom', message: 'link_note_id must be null when link_type=map' });
  }
});

export const CreateMarkerSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().max(MAX_TEXT).optional().default(''),

  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),

  points: z.array(PointSchema).optional(),

  marker_type: MarkerTypeSchema,
  color: HexColorSchema
}).and(LinkFieldsSchema);

export const PatchMarkerSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().max(MAX_TEXT).optional(),

  x: z.number().min(0).max(1).optional(),
  y: z.number().min(0).max(1).optional(),

  points: z.array(PointSchema).optional(),

  marker_type: MarkerTypeSchema.optional(),
  color: HexColorSchema.optional()
}).and(LinkFieldsSchema);

export type CreateMarkerDto = z.infer<typeof CreateMarkerSchema>;
export type UpdateMarkerDto = z.infer<typeof PatchMarkerSchema>;
