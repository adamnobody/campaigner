import { z } from 'zod';

export const NOTE_MAX_BYTES = 300 * 1024;

export const CreateNoteSchema = z.object({
  title: z.string().trim().min(1).max(120),
  type: z.enum(['md', 'txt'])
});

export const SaveNoteContentSchema = z.object({
  content: z.string().max(NOTE_MAX_BYTES) // по длине строки; ниже ещё проверим байты
});
