import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

import { initializeDatabase } from './db/connection';
import { errorHandler } from './middleware/errorHandler';

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure data directories exist
const dataDir = path.resolve(__dirname, '../../data');
const uploadsDir = path.resolve(dataDir, 'uploads');
const mapsDir = path.resolve(uploadsDir, 'maps');
const charactersDir = path.resolve(uploadsDir, 'characters');
const factionsDir = path.resolve(uploadsDir, 'factions');
const dynastiesDir = path.resolve(uploadsDir, 'dynasties');

[dataDir, uploadsDir, mapsDir, charactersDir, factionsDir, dynastiesDir].forEach(dir => {
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

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Campaigner API is running' });
});

// Error handler (must be last)
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`🏰 Campaigner server running on http://localhost:${PORT}`);
  console.log(`📁 Data directory: ${dataDir}`);
});

let isShuttingDown = false;

const shutdown = (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);

  server.close((err) => {
    if (err) {
      console.error('❌ Error during server shutdown:', err);
      process.exit(1);
    }

    console.log('✅ Server stopped gracefully');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('⚠ Forced shutdown after timeout');
    process.exit(1);
  }, 5000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export default app;