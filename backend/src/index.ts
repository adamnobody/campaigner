import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initializeDatabase } from './db/connection';
import { errorHandler } from './middleware/errorHandler';
import { projectRoutes } from './routes/project.routes';
import { characterRoutes } from './routes/character.routes';
import { noteRoutes } from './routes/note.routes';
import { mapRoutes } from './routes/map.routes';
import { timelineRoutes } from './routes/timeline.routes';
import { folderRoutes } from './routes/folder.routes';
import { tagRoutes } from './routes/tag.routes';
import { uploadRoutes } from './routes/upload.routes';
import { searchRoutes } from './routes/search.routes';
import fs from 'fs';

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

[dataDir, uploadsDir, mapsDir, charactersDir].forEach(dir => {
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

// Static files for uploads
app.use('/uploads', express.static(uploadsDir));

// Initialize database
initializeDatabase();

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/maps', mapRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/search', searchRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Campaigner API is running' });
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🏰 Campaigner server running on http://localhost:${PORT}`);
  console.log(`📁 Data directory: ${dataDir}`);
});

export default app;