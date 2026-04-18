import { z } from 'zod';
import { LIMITS, MARKER_ICONS } from '../constants.js';
import { idSchema } from './common.schema.js';

// Карта (может быть корневой или вложенной)
export const mapSchema = z.object({
  id: idSchema,
  projectId: idSchema,
  parentMapId: idSchema.nullable().optional(),
  parentMarkerId: idSchema.nullable().optional(),
  name: z.string().min(1).max(200).trim(),
  imagePath: z.string().optional().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createMapSchema = mapSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateMapSchema = mapSchema
  .omit({ id: true, projectId: true, createdAt: true, updatedAt: true })
  .partial();

// Маркер на карте
export const mapMarkerSchema = z.object({
  id: idSchema,
  mapId: idSchema,
  title: z.string().min(LIMITS.MARKER_TITLE_MIN).max(LIMITS.MARKER_TITLE_MAX).trim(),
  description: z.string().max(LIMITS.MARKER_DESCRIPTION_MAX).optional().default(''),
  positionX: z.number().min(0).max(1),
  positionY: z.number().min(0).max(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FF6B6B'),
  icon: z.enum(MARKER_ICONS).default('custom'),
  linkedNoteId: z.number().int().positive().nullable().optional(),
  childMapId: z.number().int().positive().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createMarkerSchema = mapMarkerSchema.omit({
  id: true,
  mapId: true,
  createdAt: true,
  updatedAt: true,
});

export const updateMarkerSchema = mapMarkerSchema
  .omit({ id: true, mapId: true, createdAt: true, updatedAt: true })
  .partial();

// ==================== Территории (мультиполигон: материк + анклавы) ====================
export const territoryPointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

/** Один замкнутый контур (≥3 точек). */
export const territoryRingSchema = z.array(territoryPointSchema).min(3);

export const mapTerritorySchema = z.object({
  id: idSchema,
  mapId: idSchema,
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).optional().default(''),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#4ECDC4'),
  opacity: z.number().min(0.05).max(1).default(0.25),
  borderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#4ECDC4'),
  borderWidth: z.number().min(0.5).max(5).default(2),
  smoothing: z.number().min(0).max(1).default(0),
  rings: z.array(territoryRingSchema).min(1),
  factionId: z.number().int().positive().nullable().optional(),
  sortOrder: z.number().int().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/** Тело создания: допускаем legacy `points` (один контур) → нормализуем в `rings`. */
function preprocessTerritoryCreateBody(data: unknown): unknown {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.rings) && o.rings.length > 0) return o;
    if (Array.isArray(o.points) && o.points.length >= 3) {
      const { points, ...rest } = o;
      return { ...rest, rings: [points] };
    }
  }
  return data;
}

export const createTerritorySchema = z.preprocess(
  preprocessTerritoryCreateBody,
  mapTerritorySchema.omit({
    id: true,
    mapId: true,
    createdAt: true,
    updatedAt: true,
  })
);

/** PATCH: `points` как один контур превращаем в `rings: [points]`. */
function preprocessTerritoryUpdateBody(data: unknown): unknown {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
  const o = { ...(data as Record<string, unknown>) };
  if (
    Array.isArray(o.points) &&
    o.points.length >= 3 &&
    (!Array.isArray(o.rings) || o.rings.length === 0)
  ) {
    o.rings = [o.points];
    delete o.points;
  }
  return o;
}

export const updateTerritorySchema = z.preprocess(
  preprocessTerritoryUpdateBody,
  mapTerritorySchema.omit({ id: true, mapId: true, createdAt: true, updatedAt: true }).partial()
);

/** Сводка территории для выбора на странице государства (список по проекту). */
export const mapTerritorySummarySchema = z.object({
  id: idSchema,
  name: z.string(),
  mapId: idSchema,
  mapName: z.string(),
  factionId: idSchema.nullable(),
  occupantName: z.string().nullable(),
  occupantKind: z.enum(['state', 'faction']).nullable().optional(),
});