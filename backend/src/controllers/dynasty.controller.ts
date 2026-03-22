import { Request, Response, NextFunction } from 'express';
import { DynastyService } from '../services/dynasty.service';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: path.resolve(__dirname, '../../../data/uploads/dynasties'),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

export class DynastyController {
  static getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = parseInt(req.query.projectId as string);
      const result = DynastyService.getAll(projectId, req.query);
      res.json({ success: true, data: result.items, total: result.total });
    } catch (e) { next(e); }
  }

  static getById(req: Request, res: Response, next: NextFunction) {
    try {
      const dynasty = DynastyService.getById(parseInt(req.params.id));
      res.json({ success: true, data: dynasty });
    } catch (e) { next(e); }
  }

  static create(req: Request, res: Response, next: NextFunction) {
    try {
      const dynasty = DynastyService.create(req.body);
      res.status(201).json({ success: true, data: dynasty });
    } catch (e) { next(e); }
  }

  static update(req: Request, res: Response, next: NextFunction) {
    try {
      const dynasty = DynastyService.update(parseInt(req.params.id), req.body);
      res.json({ success: true, data: dynasty });
    } catch (e) { next(e); }
  }

  static delete(req: Request, res: Response, next: NextFunction) {
    try {
      DynastyService.delete(parseInt(req.params.id));
      res.json({ success: true, message: 'Dynasty deleted' });
    } catch (e) { next(e); }
  }

  static uploadImage = [
    upload.single('image'),
    (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.file) throw new Error('No file uploaded');
        const imagePath = `/uploads/dynasties/${req.file.filename}`;
        const dynasty = DynastyService.uploadImage(parseInt(req.params.id), imagePath);
        res.json({ success: true, data: dynasty });
      } catch (e) { next(e); }
    },
  ];

  static setTags(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      DynastyService.setTags(id, req.body.tagIds || []);
      const dynasty = DynastyService.getById(id);
      res.json({ success: true, data: dynasty });
    } catch (e) { next(e); }
  }

  // Members
  static addMember(req: Request, res: Response, next: NextFunction) {
    try {
      const dynastyId = parseInt(req.params.id);
      const member = DynastyService.addMember(dynastyId, req.body);
      res.status(201).json({ success: true, data: member });
    } catch (e) { next(e); }
  }

  static updateMember(req: Request, res: Response, next: NextFunction) {
    try {
      const member = DynastyService.updateMember(parseInt(req.params.memberId), req.body);
      res.json({ success: true, data: member });
    } catch (e) { next(e); }
  }

  static removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      DynastyService.removeMember(parseInt(req.params.memberId));
      res.json({ success: true, message: 'Member removed' });
    } catch (e) { next(e); }
  }

  static saveGraphPositions(req: Request, res: Response, next: NextFunction) {
    try {
      const dynastyId = parseInt(req.params.id);
      DynastyService.saveGraphPositions(dynastyId, req.body.positions || []);
      res.json({ success: true, message: 'Positions saved' });
    } catch (e) { next(e); }
  }
  
  // Family links
  static addFamilyLink(req: Request, res: Response, next: NextFunction) {
    try {
      const dynastyId = parseInt(req.params.id);
      const link = DynastyService.addFamilyLink(dynastyId, req.body);
      res.status(201).json({ success: true, data: link });
    } catch (e) { next(e); }
  }

  static deleteFamilyLink(req: Request, res: Response, next: NextFunction) {
    try {
      DynastyService.deleteFamilyLink(parseInt(req.params.linkId));
      res.json({ success: true, message: 'Family link deleted' });
    } catch (e) { next(e); }
  }

  // Events
  static addEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const dynastyId = parseInt(req.params.id);
      const event = DynastyService.addEvent(dynastyId, req.body);
      res.status(201).json({ success: true, data: event });
    } catch (e) { next(e); }
  }

  static updateEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const event = DynastyService.updateEvent(parseInt(req.params.eventId), req.body);
      res.json({ success: true, data: event });
    } catch (e) { next(e); }
  }

  static deleteEvent(req: Request, res: Response, next: NextFunction) {
    try {
      DynastyService.deleteEvent(parseInt(req.params.eventId));
      res.json({ success: true, message: 'Event deleted' });
    } catch (e) { next(e); }
  }
}