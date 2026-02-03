import { z } from 'zod';

const MAX_TEXT = 300 * 1024; // 300 KB

// 1. Выносим базовые перечисления (Enums)
const MarkerTypeEnum = z.enum(['location', 'event', 'character']);
const MarkerLinkTypeEnum = z.enum(['note', 'map']);
const MarkerIconEnum = z.enum(['', 'pin', 'star', 'user', 'flag', 'skull', 'crown', 'book', 'home']);

export const MarkerTypeSchema = MarkerTypeEnum;
export const MarkerLinkTypeSchema = MarkerLinkTypeEnum;

export const HexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'color must be #RRGGBB');

// NEW: icon key ('' = auto)
// Используем базовый enum, чтобы не дублировать список значений
export const MarkerIconSchema = MarkerIconEnum.optional().default('');

// 2. Выносим логику валидации связей в отдельную функцию
// Это устраняет огромное дублирование кода между Create и Patch
type LinkValidationValues = {
  link_type: z.infer<typeof MarkerLinkTypeEnum> | null;
  link_note_id: string | null;
  link_map_id: string | null;
};

const validateLinkConsistency = (val: LinkValidationValues, ctx: z.RefinementCtx) => {
  const { link_type: lt, link_note_id: noteId, link_map_id: mapId } = val;

  if (lt === null) {
    if (noteId) ctx.addIssue({ code: 'custom', path: ['link_note_id'], message: 'link_note_id must be null when link_type is null' });
    if (mapId) ctx.addIssue({ code: 'custom', path: ['link_map_id'], message: 'link_map_id must be null when link_type is null' });
    return;
  }

  if (lt === 'note') {
    if (!noteId) ctx.addIssue({ code: 'custom', path: ['link_note_id'], message: 'link_note_id is required when link_type=note' });
    if (mapId) ctx.addIssue({ code: 'custom', path: ['link_map_id'], message: 'link_map_id must be null when link_type=note' });
    return;
  }

  if (lt === 'map') {
    if (!mapId) ctx.addIssue({ code: 'custom', path: ['link_map_id'], message: 'link_map_id is required when link_type=map' });
    if (noteId) ctx.addIssue({ code: 'custom', path: ['link_note_id'], message: 'link_note_id must be null when link_type=map' });
    return;
  }
};

const CreateLinkFieldsSchema = z
  .object({
    link_type: MarkerLinkTypeSchema.nullable().default(null),
    link_note_id: z.string().trim().min(1).nullable().default(null),
    link_map_id: z.string().trim().min(1).nullable().default(null)
  })
  .superRefine((val, ctx) => validateLinkConsistency(val, ctx));

const PatchLinkFieldsSchema = z
  .object({
    link_type: MarkerLinkTypeSchema.nullable().optional(),
    link_note_id: z.string().trim().min(1).nullable().optional(),
    link_map_id: z.string().trim().min(1).nullable().optional()
  })
  .superRefine((val, ctx) => {
    // Проверяем, был ли передан хотя бы один параметр
    const hasUpdates = val.link_type !== undefined || val.link_note_id !== undefined || val.link_map_id !== undefined;
    if (!hasUpdates) return;

    // Приводим undefined к null для проверки согласованности (сохраняя логику оригинала)
    validateLinkConsistency({
      link_type: val.link_type ?? null,
      link_note_id: val.link_note_id ?? null,
      link_map_id: val.link_map_id ?? null
    }, ctx);
  });

// Общие поля для переиспользования
const BaseMarkerFields = {
  title: z.string().trim().min(1).max(120),
  description: z.string().max(MAX_TEXT),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
};

export const CreateMarkerSchema = z
  .object({
    ...BaseMarkerFields,
    description: BaseMarkerFields.description.optional().default(''),
    marker_type: MarkerTypeSchema,
    color: HexColorSchema,
    icon: MarkerIconSchema
  })
  .and(CreateLinkFieldsSchema);

export const PatchMarkerSchema = z
  .object({
    title: BaseMarkerFields.title.optional(),
    description: BaseMarkerFields.description.optional(),
    x: BaseMarkerFields.x.optional(),
    y: BaseMarkerFields.y.optional(),
    marker_type: MarkerTypeSchema.optional(),
    color: HexColorSchema.optional(),
    // Используем базовый Enum, так как здесь не нужен .default('')
    icon: MarkerIconEnum.optional()
  })
  .and(PatchLinkFieldsSchema);

export type CreateMarkerDto = z.infer<typeof CreateMarkerSchema>;
export type UpdateMarkerDto = z.infer<typeof PatchMarkerSchema>;
