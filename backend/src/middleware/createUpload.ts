import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { BadRequestError } from './errorHandler.js';

const DEFAULT_ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];
const DEFAULT_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
];

interface CreateDiskUploadOptions {
  folder: string;
  maxFileSize?: number;
  allowedExtensions?: string[];
  allowedMimeTypes?: string[];
  filenamePrefix?: string;
}

function ensureDirExists(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function sanitizeBaseName(name: string): string {
  return name
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'file';
}

export function createDiskUpload(options: CreateDiskUploadOptions) {
  const {
    folder,
    maxFileSize,
    allowedExtensions = DEFAULT_ALLOWED_EXTENSIONS,
    allowedMimeTypes = DEFAULT_ALLOWED_MIME_TYPES,
    filenamePrefix = 'upload',
  } = options;

  // Must match backend/src/index.ts: dataDir = path.resolve(__dirname, '../../data') + '/uploads'.
  // Do NOT use path.resolve('data/uploads/...') — that is relative to process.cwd() and writes to
  // backend/data/uploads when cwd is backend/, while static serving uses repo-root data/uploads/.
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const uploadDir = path.resolve(__dirname, '../../../data/uploads', folder);
  ensureDirExists(uploadDir);

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safeBase = sanitizeBaseName(file.originalname);
      const unique = `${filenamePrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeBase}${ext}`;
      cb(null, unique);
    },
  });

  const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();

    const extAllowed = allowedExtensions.includes(ext);
    const mimeAllowed = allowedMimeTypes.includes(mime);
    /** Браузеры/ОС иногда шлют пустой type или octet-stream для jpg/png — при известном расширении разрешаем. */
    const mimeUnknownButExtOk =
      extAllowed && (mime === '' || mime === 'application/octet-stream');

    if (extAllowed && (mimeAllowed || mimeUnknownButExtOk)) {
      cb(null, true);
      return;
    }

    cb(
      new BadRequestError(
        `Invalid file type. Allowed extensions: ${allowedExtensions.join(', ')}`
      ) as unknown as Error
    );
  };

  return multer({
    storage,
    limits: maxFileSize ? { fileSize: maxFileSize } : undefined,
    fileFilter,
  });
}