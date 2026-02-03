import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'node:path';
import pino, { Logger } from 'pino';
import { projectsRouter } from './routes/projects.routes';
import { mapsRouter } from './routes/maps.routes';
import { DEFAULT_PORT } from './config/paths';
import { errorMiddleware } from './middleware/error.middleware';
import { markersRouter } from './routes/markers.routes';
import { notesRouter } from './routes/notes.routes';
import { charactersRouter } from './routes/characters.routes';
import { relationshipsRouter } from './routes/relationships.routes';

const logger: Logger = pino();

const app: Express = express();
app.use(express.json({ limit: '5mb' }));
app.use(cors({ origin: ['http://localhost:5173'], credentials: true }));

app.get('/api/health', (_req: Request, res: Response) => res.json({ ok: true }));

const apiRouters = [
  { path: '/api/projects', router: projectsRouter },
  { path: '/api', router: mapsRouter },
  { path: '/api', router: markersRouter },
  { path: '/api', router: notesRouter },
  { path: '/api', router: charactersRouter },
  { path: '/api', router: relationshipsRouter },
];

apiRouters.forEach(({ path, router }) => {
  app.use(path, router);
});

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), '..', 'frontend', 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req: Request, res: Response) => res.sendFile(path.join(distPath, 'index.html')));
}

app.use(errorMiddleware);

const port = Number(process.env.PORT ?? DEFAULT_PORT);

app.listen(port, () => {
  logger.info({ port }, 'Server started');
});