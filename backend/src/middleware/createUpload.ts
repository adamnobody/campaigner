import multer from 'multer';
import path from 'path';
import fs from 'fs';

interface CreateDiskUploadOptions {
  folder: string;
  maxFileSize?: number;
}

export function createDiskUpload(options: CreateDiskUploadOptions) {
  const uploadDir = path.resolve(`data/uploads/${options.folder}`);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return multer({
    dest: uploadDir,
    limits: options.maxFileSize
      ? { fileSize: options.maxFileSize }
      : undefined,
  });
}