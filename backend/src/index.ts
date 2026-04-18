import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

import { initializeDatabase } from './db/connection.js';
import { errorHandler } from './middleware/errorHandler.js';
import { getRequestMetricsSnapshot, requestMetricsMiddleware } from './middleware/requestMetrics.js';

import projectRoutes from './routes/project.routes.js';
import characterRoutes from './routes/character.routes.js';
import noteRoutes from './routes/note.routes.js';
import mapRoutes from './routes/map.routes.js';
import timelineRoutes from './routes/timeline.routes.js';
import tagRoutes from './routes/tag.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import searchRoutes from './routes/search.routes.js';
import dogmaRoutes from './routes/dogma.routes.js';
import factionRoutes from './routes/faction.routes.js';
import wikiRoutes from './routes/wiki.routes.js';
import dynastyRoutes from './routes/dynasty.routes.js';
import branchRoutes from './routes/branch.routes.js';
import characterTraitRoutes from './routes/character-traits.routes.js';
import ambitionRoutes from './routes/ambition.routes.js';
import politicalScaleRoutes from './routes/political-scale.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const DEBUG_ENDPOINT = 'http://127.0.0.1:7926/ingest/67d2b135-3c0f-4cbe-ad30-af1a135feb8a';
const DEBUG_SESSION_ID = '316f21';

function sendDebugLog(hypothesisId: string, location: string, message: string, data: Record<string, unknown> = {}) {
  fetch(DEBUG_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': DEBUG_SESSION_ID,
    },
    body: JSON.stringify({
      sessionId: DEBUG_SESSION_ID,
      runId: 'smoke-up',
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
}

// Ensure data directories exist
const dataDir = path.resolve(__dirname, '../../data');
const uploadsDir = path.resolve(dataDir, 'uploads');
const mapsDir = path.resolve(uploadsDir, 'maps');
const charactersDir = path.resolve(uploadsDir, 'characters');
const factionsDir = path.resolve(uploadsDir, 'factions');
const dynastiesDir = path.resolve(uploadsDir, 'dynasties');
const traitsDir = path.resolve(uploadsDir, 'traits');
const ambitionsDir = path.resolve(uploadsDir, 'ambitions');

[dataDir, uploadsDir, mapsDir, charactersDir, factionsDir, dynastiesDir, traitsDir, ambitionsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(requestMetricsMiddleware);

// Static files — доступ через /uploads и /api/uploads
app.use('/uploads', express.static(uploadsDir));
app.use('/api/uploads', express.static(uploadsDir));

// Initialize database
initializeDatabase();

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api', mapRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/wiki', wikiRoutes);
app.use('/api/dogmas', dogmaRoutes);
app.use('/api/factions', factionRoutes);
app.use('/api/dynasties', dynastyRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/character-traits', characterTraitRoutes);
app.use('/api', ambitionRoutes);
app.use('/api', politicalScaleRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Campaigner API is running' });
});

app.get('/api/metrics/perf', (_req, res) => {
  res.json({
    success: true,
    data: getRequestMetricsSnapshot(),
  });
});
// ============ Serve frontend static files ============
const frontendDistPath = process.env.FRONTEND_DIST_PATH 
  || path.resolve(__dirname, '../../frontend/dist');

if (fs.existsSync(frontendDistPath)) {
  console.log(`📦 Serving frontend from: ${frontendDistPath}`);
  
  // Раздаём статические файлы (JS, CSS, шрифты, картинки)
  app.use(express.static(frontendDistPath));
  
  // Все остальные GET-запросы (не /api, не /uploads) → index.html (SPA)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    }
  });
} else {
  console.warn(`⚠️ Frontend dist not found at: ${frontendDistPath}`);
}
// =====================================================
// Error handler (must be last)
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`🏰 Campaigner server running on http://localhost:${PORT}`);
  console.log(`📁 Data directory: ${dataDir}`);
});

let isShuttingDown = false;

const shutdown = (signal: string) => {
  // #region agent log
  sendDebugLog('H1', 'backend/src/index.ts:shutdown:entry', 'Shutdown handler invoked', {
    signal,
    pid: process.pid,
    isShuttingDown,
  });
  // #endregion

  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);

  server.close((err) => {
    // #region agent log
    sendDebugLog('H2', 'backend/src/index.ts:shutdown:closeCallback', 'server.close callback fired', {
      signal,
      pid: process.pid,
      hasError: Boolean(err),
      errorMessage: err instanceof Error ? err.message : null,
    });
    // #endregion

    if (err) {
      console.error('❌ Error during server shutdown:', err);
      process.exit(1);
    }

    console.log('✅ Server stopped gracefully');
    process.exit(0);
  });

  setTimeout(() => {
    // #region agent log
    sendDebugLog('H2', 'backend/src/index.ts:shutdown:forcedTimeout', 'Forced shutdown timeout reached', {
      signal,
      pid: process.pid,
    });
    // #endregion
    console.error('⚠ Forced shutdown after timeout');
    process.exit(1);
  }, 5000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export default app;