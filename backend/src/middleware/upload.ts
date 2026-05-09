import { createDiskUpload } from './createUpload.js';
import { LIMITS } from '@campaigner/shared';

const mapUpload = createDiskUpload({
  folder: 'maps',
  maxFileSize: LIMITS.MAX_IMAGE_SIZE,
  filenamePrefix: 'map',
});

const characterUpload = createDiskUpload({
  folder: 'characters',
  maxFileSize: LIMITS.MAX_FILE_SIZE,
  filenamePrefix: 'character',
});

const traitUpload = createDiskUpload({
  folder: 'traits',
  maxFileSize: LIMITS.MAX_FILE_SIZE,
  filenamePrefix: 'trait',
});

const ambitionUpload = createDiskUpload({
  folder: 'ambitions',
  maxFileSize: LIMITS.MAX_FILE_SIZE,
  filenamePrefix: 'ambition',
});

const appearanceUpload = createDiskUpload({
  folder: 'appearance',
  maxFileSize: LIMITS.MAX_FILE_SIZE,
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.avif'],
  allowedMimeTypes: ['image/*'],
  filenamePrefix: 'appearance',
});

export const uploadMapImage = mapUpload.single('mapImage');
export const uploadCharacterImage = characterUpload.single('characterImage');
export const uploadTraitImage = traitUpload.single('traitImage');
export const uploadAmbitionImage = ambitionUpload.single('ambitionImage');
export const uploadAppearanceImage = appearanceUpload.single('image');