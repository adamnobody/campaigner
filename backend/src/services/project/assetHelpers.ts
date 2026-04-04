import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DATA_DIR = path.resolve(__dirname, '../../../../data');

export function readFileAsBase64(relativePath: string | null): string | null {
  if (!relativePath) return null;

  try {
    const normalizedPath = relativePath.replace(/^\/+/, '');
    const fullPath = path.join(DATA_DIR, normalizedPath);

    if (!fs.existsSync(fullPath)) return null;

    const buffer = fs.readFileSync(fullPath);
    const ext = path.extname(relativePath).toLowerCase().replace('.', '');

    const mimeMap: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      svg: 'image/svg+xml',
      webp: 'image/webp',
      gif: 'image/gif',
    };

    const mime = mimeMap[ext] || 'application/octet-stream';
    return `data:${mime};base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}

export function saveBase64ToFile(base64: string, subDir: string): string | null {
  try {
    const match = base64.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;

    const mime = match[1];
    const data = match[2];

    const extMap: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/svg+xml': 'svg',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };

    const ext = extMap[mime] || 'png';
    const filename = `${uuidv4()}.${ext}`;
    const dirPath = path.join(DATA_DIR, 'uploads', subDir);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const filePath = path.join(dirPath, filename);
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'));

    return `/uploads/${subDir}/${filename}`;
  } catch {
    return null;
  }
}
