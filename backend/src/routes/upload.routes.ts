import { Router } from 'express';
import { uploadMapImage, uploadCharacterImage } from '../middleware/upload';
import { Request, Response, NextFunction } from 'express';

const router = Router();

router.post('/map', uploadMapImage, (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }
    res.json({
      success: true,
      data: {
        path: `/uploads/maps/${req.file.filename}`,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/character', uploadCharacterImage, (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }
    res.json({
      success: true,
      data: {
        path: `/uploads/characters/${req.file.filename}`,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as uploadRoutes };