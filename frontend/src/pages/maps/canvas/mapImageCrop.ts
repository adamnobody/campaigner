export type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const MIN_CROP_SIZE = 8;

export const clampCropRect = (
  rect: CropRect,
  bounds: { width: number; height: number },
  minSize = MIN_CROP_SIZE,
): CropRect => {
  const width = Math.max(minSize, Math.min(rect.width, bounds.width));
  const height = Math.max(minSize, Math.min(rect.height, bounds.height));
  const x = Math.max(0, Math.min(rect.x, bounds.width - width));
  const y = Math.max(0, Math.min(rect.y, bounds.height - height));
  return { x, y, width, height };
};

export const displayCropToNatural = (
  displayRect: CropRect,
  displaySize: { width: number; height: number },
  naturalSize: { width: number; height: number },
): CropRect => {
  const scaleX = naturalSize.width / displaySize.width;
  const scaleY = naturalSize.height / displaySize.height;
  return clampCropRect(
    {
      x: Math.round(displayRect.x * scaleX),
      y: Math.round(displayRect.y * scaleY),
      width: Math.round(displayRect.width * scaleX),
      height: Math.round(displayRect.height * scaleY),
    },
    naturalSize,
    MIN_CROP_SIZE,
  );
};

export const loadImageFromFile = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image_load_failed'));
    };
    image.src = url;
  });

export const cropImageFile = async (file: File, crop: CropRect): Promise<File> => {
  const image = await loadImageFromFile(file);
  const natural = clampCropRect(crop, { width: image.width, height: image.height });
  const canvas = document.createElement('canvas');
  canvas.width = natural.width;
  canvas.height = natural.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas_unavailable');

  ctx.drawImage(
    image,
    natural.x,
    natural.y,
    natural.width,
    natural.height,
    0,
    0,
    natural.width,
    natural.height,
  );

  const mimeType = file.type && file.type.startsWith('image/') ? file.type : 'image/png';
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType);
  });
  if (!blob) throw new Error('crop_failed');

  return new File([blob], file.name, { type: mimeType, lastModified: Date.now() });
};

export const fitImageToBox = (
  natural: { width: number; height: number },
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } => {
  if (natural.width <= 0 || natural.height <= 0) {
    return { width: maxWidth, height: maxHeight };
  }
  const scale = Math.min(maxWidth / natural.width, maxHeight / natural.height, 1);
  return {
    width: Math.max(1, Math.round(natural.width * scale)),
    height: Math.max(1, Math.round(natural.height * scale)),
  };
};
