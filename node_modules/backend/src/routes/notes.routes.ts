import { Router } from 'express';
import { CreateNoteSchema, SaveNoteContentSchema } from '../validation/notes.zod.js';
import { createNote, deleteNote, getNoteContent, listNotes, saveNoteContent } from '../services/notes.service.js';

export const notesRouter = Router();

notesRouter.get('/projects/:projectId/notes', async (req, res, next) => {
  try {
    const notes = await listNotes(req.params.projectId);
    res.json(notes);
  } catch (e) {
    next(e);
  }
});

notesRouter.post('/projects/:projectId/notes', async (req, res, next) => {
  try {
    const parsed = CreateNoteSchema.parse(req.body ?? {});
    const note = await createNote(req.params.projectId, parsed);
    res.status(201).json(note);
  } catch (e) {
    next(e);
  }
});

notesRouter.get('/notes/:noteId/content', async (req, res, next) => {
  try {
    const { note, content } = await getNoteContent(req.params.noteId);
    res.json({ note, content });
  } catch (e) {
    next(e);
  }
});

notesRouter.put('/notes/:noteId/content', async (req, res, next) => {
  try {
    const parsed = SaveNoteContentSchema.parse(req.body ?? {});
    const updated = await saveNoteContent(req.params.noteId, parsed.content);
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

notesRouter.delete('/notes/:noteId', async (req, res, next) => {
  try {
    await deleteNote(req.params.noteId);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
