import { z } from 'zod';

/** Positions for the project graph canvas (v1). */
export const graphLayoutDataSchema = z.object({
  version: z.literal(1),
  viewport: z
    .object({
      x: z.number(),
      y: z.number(),
      zoom: z.number(),
    })
    .optional(),
  nodes: z.record(
    z.string(),
    z.object({
      x: z.number(),
      y: z.number(),
      pinned: z.boolean().optional(),
    }),
  ),
});

export type GraphLayoutDataV1 = z.infer<typeof graphLayoutDataSchema>;

export const emptyGraphLayoutData = (): GraphLayoutDataV1 => ({
  version: 1,
  nodes: {},
});
