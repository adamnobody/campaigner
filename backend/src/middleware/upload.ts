import { createDiskUpload } from './createUpload';
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

export const uploadMapImage = mapUpload.single('mapImage');
export const uploadCharacterImage = characterUpload.single('characterImage');