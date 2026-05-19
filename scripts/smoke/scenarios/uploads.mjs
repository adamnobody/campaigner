import { API_BASE, assertStatus, logStep, logOk } from '../lib.mjs';

const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z5+F/g8AAwMB/aaXxO0AAAAASUVORK5CYII=';

const pngBytes = Buffer.from(PNG_BASE64, 'base64');

const apiOrigin = API_BASE.replace(/\/api\/?$/, '');

async function uploadCharacterImage(characterId) {
  const formData = new FormData();
  formData.append('characterImage', new Blob([pngBytes], { type: 'image/png' }), 'smoke.png');

  const res = await fetch(`${API_BASE}/characters/${characterId}/image`, {
    method: 'POST',
    body: formData,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return { ok: res.ok, status: res.status, data, url: `${API_BASE}/characters/${characterId}/image` };
}

async function uploadMapImage(mapId) {
  const formData = new FormData();
  formData.append('image', new Blob([pngBytes], { type: 'image/png' }), 'smoke-map.png');

  const res = await fetch(`${API_BASE}/maps/${mapId}/image`, {
    method: 'POST',
    body: formData,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return { ok: res.ok, status: res.status, data, url: `${API_BASE}/maps/${mapId}/image` };
}

async function fetchUploadedAsset(imagePath) {
  const assetUrl = `${apiOrigin}/api${imagePath}`;
  const res = await fetch(assetUrl);
  const contentType = res.headers.get('content-type') ?? '';
  const body = await res.arrayBuffer();
  return { res, assetUrl, contentType, body };
}

export async function smokeUploads(ctx) {
  logStep('Uploads');

  if (!ctx.characterId) {
    throw new Error('uploads: missing characterId in smoke context');
  }
  if (!ctx.rootMapId) {
    throw new Error('uploads: missing rootMapId in smoke context');
  }

  const characterUpload = await uploadCharacterImage(ctx.characterId);
  assertStatus(characterUpload, 200, 'upload character image');

  const characterImagePath = characterUpload.data?.data?.imagePath;
  if (!characterImagePath || !characterImagePath.startsWith('/uploads/characters/')) {
    throw new Error(
      `uploads: expected character imagePath under /uploads/characters/, got ${JSON.stringify(characterUpload.data, null, 2)}`,
    );
  }

  const characterAsset = await fetchUploadedAsset(characterImagePath);
  if (characterAsset.res.status !== 200) {
    throw new Error(
      `uploads: character asset fetch expected 200, got ${characterAsset.res.status} (${characterAsset.assetUrl})`,
    );
  }
  if (!characterAsset.contentType.includes('image/png')) {
    throw new Error(
      `uploads: character asset expected image/png, got ${characterAsset.contentType}`,
    );
  }
  if (characterAsset.body.byteLength === 0) {
    throw new Error('uploads: character asset body is empty');
  }

  logOk('Character image upload and static fetch work');

  const mapUpload = await uploadMapImage(ctx.rootMapId);
  assertStatus(mapUpload, 200, 'upload map image');

  const mapImagePath = mapUpload.data?.data?.imagePath;
  if (!mapImagePath || !mapImagePath.startsWith('/uploads/maps/')) {
    throw new Error(
      `uploads: expected map imagePath under /uploads/maps/, got ${JSON.stringify(mapUpload.data, null, 2)}`,
    );
  }

  const mapAsset = await fetchUploadedAsset(mapImagePath);
  if (mapAsset.res.status !== 200) {
    throw new Error(
      `uploads: map asset fetch expected 200, got ${mapAsset.res.status} (${mapAsset.assetUrl})`,
    );
  }
  if (!mapAsset.contentType.includes('image/png')) {
    throw new Error(`uploads: map asset expected image/png, got ${mapAsset.contentType}`);
  }

  logOk('Map image upload and static fetch work');
}
