import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { FactionController } from '../controllers/faction.controller';

const router = Router();

// Multer setup for faction images
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.resolve('uploads/factions');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `faction-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// CRUD
router.get('/', FactionController.getAll);
router.get('/relations', FactionController.getRelations);
router.get('/graph', FactionController.getGraph);
router.get('/:id', FactionController.getById);
router.post('/', FactionController.create);
router.put('/:id', FactionController.update);
router.delete('/:id', FactionController.delete);

// Images
router.post('/:id/image', upload.single('image'), FactionController.uploadImage);
router.post('/:id/banner', upload.single('banner'), FactionController.uploadBanner);

// Tags
router.put('/:id/tags', FactionController.setTags);

// Ranks
router.get('/:id/ranks', FactionController.getRanks);
router.post('/:id/ranks', FactionController.createRank);
router.put('/:id/ranks/:rankId', FactionController.updateRank);
router.delete('/:id/ranks/:rankId', FactionController.deleteRank);

// Members
router.get('/:id/members', FactionController.getMembers);
router.post('/:id/members', FactionController.addMember);
router.put('/:id/members/:memberId', FactionController.updateMember);
router.delete('/:id/members/:memberId', FactionController.removeMember);

// Relations
router.post('/relations', FactionController.createRelation);
router.put('/relations/:relationId', FactionController.updateRelation);
router.delete('/relations/:relationId', FactionController.deleteRelation);

export default router;