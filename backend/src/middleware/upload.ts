import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { LIMITS, ALLOWED_IMAGE_TYPES } from '@campaigner/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../../data/uploads');

const mapStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(uploadsDir, 'maps'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const characterStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(uploadsDir, 'characters'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const imageFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype as any)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`));
  }
};

export const uploadMapImage = multer({
  storage: mapStorage,
  limits: { fileSize: LIMITS.MAX_IMAGE_SIZE },
  fileFilter: imageFileFilter,
}).single('mapImage');

export const uploadCharacterImage = multer({
  storage: characterStorage,
  limits: { fileSize: LIMITS.MAX_FILE_SIZE },
  fileFilter: imageFileFilter,
}).single('characterImage');