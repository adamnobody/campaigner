import express from 'express';
import cors from 'cors';
import path from 'node:path';
import pino from 'pino';
import { projectsRouter } from './routes/projects.routes.js';
import { mapsRouter } from './routes/maps.routes.js';
import { DEFAULT_PORT } from './config/paths.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { markersRouter } from './routes/markers.routes.js';
import { notesRouter } from './routes/notes.routes.js';

const logger = pino();

const app = express();
app.use(express.json({ limit: '5mb' })); // notes/marker desc later; пока достаточно
app.use(cors({ origin: ['http://localhost:5173'], credentials: true }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/projects', projectsRouter);
app.use('/api', mapsRouter);
app.use('/api', markersRouter);
app.use('/api', notesRouter);

// Production: serve frontend build
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), '..', 'frontend', 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.use(errorMiddleware);

const port = Number(process.env.PORT ?? DEFAULT_PORT);

app.listen(port, () => {
  logger.info({ port }, 'Server started');
});
