import {
  Assets,
  Container,
  Graphics,
  Sprite,
  Text,
} from 'pixi.js';
import { resolveUploadAssetUrl } from '@/utils/uploadAssetUrl';
import type { CanvasLayer, CanvasObject } from '@/api/canvas';
import {
  asNumber,
  asPoints,
  asRecord,
  asString,
  MARKER_ICONS,
  objectTransform,
  territoryRingsFromObject,
  type CanvasPoint,
} from './canvasModel';
import { territoryLabelPlacement } from './territoryLabel';
import { resolveTerritoryStyleFields, traceSmoothedClosedRing } from './territoryRender';
import { resolveTextContent } from './textObjectForm';
import { isShapeKind } from './shapeObjectForm';
import { shapeLabelPlacement } from './shapeLabel';

type HitTest = (point: CanvasPoint) => boolean;
type ImageLoadErrorHandler = (object: CanvasObject, resourcePath: string) => void;
type ImageTexture = Awaited<ReturnType<typeof Assets.load>>;

export type DisplayEntry = {
  objectId: number;
  fingerprint: string;
  display: Container;
  hitTest: HitTest;
};

export type ReconcileState = {
  layerContainers: Map<number, Container>;
  objects: Map<number, DisplayEntry>;
};

export type SceneContainerDisplayLabels = {
  defaultTitle: string;
  openHint: string;
  kindLabel: string;
};

export type ReconcileOptions = {
  /** Viewport scale (world → screen) for territory label sizing. */
  viewportScale?: number;
  /** Linked child scene names for scene_container cards. */
  linkedSceneNames?: ReadonlyMap<number, string>;
  /** Linked child map scene backgrounds for scene_container thumbnails. */
  linkedSceneBackgroundPaths?: ReadonlyMap<number, string>;
  sceneContainerLabels?: SceneContainerDisplayLabels;
  /** Hide glyphs while inline text editor is open. */
  editingTextObjectId?: number | null;
};

const loadedImageTextures = new Map<string, ImageTexture>();

const toColor = (value: unknown, fallback: number): number => {
  if (typeof value !== 'string') return fallback;
  const normalized = value.startsWith('#') ? value.slice(1) : value;
  const parsed = Number.parseInt(normalized, 16);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const boundsHit = (x: number, y: number, width: number, height: number): HitTest => (point) =>
  point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height;

const combineBoundsHit = (
  boxes: Array<{ x: number; y: number; width: number; height: number }>,
): HitTest => (point) =>
  boxes.some((box) => point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height);

const MARKER_CIRCLE_RADIUS = 16;
const MARKER_BADGE_RADIUS = 7;
const TEXT_RESOLUTION = Math.max(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 2);

const drawMarker = (container: Container, object: CanvasObject, selected: boolean): HitTest => {
  const style = asRecord(object.styleJson);
  const content = asRecord(object.contentJson);
  const fill = toColor(style.fill, 0xff6b6b);
  const iconKey = asString(content.icon, '');
  const emoji = iconKey ? (MARKER_ICONS[iconKey] ?? '📍') : '';
  const title = asString(content.title, object.name ?? '').trim();
  const hitBoxes: Array<{ x: number; y: number; width: number; height: number }> = [];

  const circle = new Graphics();
  circle
    .circle(0, 0, MARKER_CIRCLE_RADIUS)
    .fill({ color: fill, alpha: 0.9 })
    .stroke({ color: selected ? 0xffffff : 0x000000, width: 2, alpha: selected ? 1 : 0.35 });
  container.addChild(circle);

  hitBoxes.push({
    x: -MARKER_CIRCLE_RADIUS - 2,
    y: -MARKER_CIRCLE_RADIUS - 2,
    width: (MARKER_CIRCLE_RADIUS + 2) * 2,
    height: (MARKER_CIRCLE_RADIUS + 2) * 2,
  });

  if (emoji) {
    const iconText = new Text({
      text: emoji,
      style: { fontSize: 16, fill: 0xffffff },
    });
    iconText.anchor.set(0.5);
    iconText.position.set(0, 0);
    container.addChild(iconText);
  }

  if (title) {
    const label = new Text({
      text: title,
      resolution: TEXT_RESOLUTION,
      style: {
        fill: 0xffffff,
        fontSize: 13,
        fontFamily: 'Cinzel, "Crimson Text", serif',
        fontWeight: '700',
        stroke: { color: 0x000000, width: 3, join: 'round' },
      },
    });
    label.anchor.set(0.5, 0);
    label.position.set(0, MARKER_CIRCLE_RADIUS + 3);
    container.addChild(label);
    hitBoxes.push({
      x: -label.width / 2 - 4,
      y: MARKER_CIRCLE_RADIUS + 3,
      width: label.width + 8,
      height: label.height + 4,
    });
  }

  if (object.linkedNoteId != null) {
    const badgeX = MARKER_CIRCLE_RADIUS - 4;
    const badgeY = -MARKER_CIRCLE_RADIUS + 4;
    const noteBadge = new Graphics();
    noteBadge
      .circle(badgeX, badgeY, MARKER_BADGE_RADIUS)
      .fill({ color: 0x4ecdc4 })
      .stroke({ color: 0x000000, width: 1.5, alpha: 0.4 });
    container.addChild(noteBadge);
    const noteGlyph = new Text({ text: '📎', style: { fontSize: 7, fill: 0xffffff } });
    noteGlyph.anchor.set(0.5);
    noteGlyph.position.set(badgeX, badgeY);
    container.addChild(noteGlyph);
  }

  if (object.linkedSceneId != null) {
    const badgeX = -MARKER_CIRCLE_RADIUS + 4;
    const badgeY = -MARKER_CIRCLE_RADIUS + 4;
    const mapBadge = new Graphics();
    mapBadge
      .circle(badgeX, badgeY, MARKER_BADGE_RADIUS)
      .fill({ color: 0xbb8fce })
      .stroke({ color: 0x000000, width: 1.5, alpha: 0.4 });
    container.addChild(mapBadge);
    const mapGlyph = new Text({ text: '🗺', style: { fontSize: 7, fill: 0xffffff } });
    mapGlyph.anchor.set(0.5);
    mapGlyph.position.set(badgeX, badgeY);
    container.addChild(mapGlyph);
  }

  return combineBoundsHit(hitBoxes);
};

const circleHit = (radius: number): HitTest => (point) => point.x * point.x + point.y * point.y <= radius * radius;

const polygonHit = (points: CanvasPoint[]): HitTest => (point) => {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const pi = points[i];
    const pj = points[j];
    const crosses = pi.y > point.y !== pj.y > point.y;
    if (crosses) {
      const x = ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y || 1) + pi.x;
      if (point.x < x) inside = !inside;
    }
  }
  return inside;
};

const drawRingList = (
  graphics: Graphics,
  ringList: CanvasPoint[][],
  fill: number,
  stroke: number,
  alpha: number,
  strokeWidth: number,
  smoothing = 0,
): void => {
  for (const points of ringList) {
    if (points.length >= 3) {
      if (smoothing > 0) {
        traceSmoothedClosedRing(graphics, points, smoothing);
        graphics.fill({ color: fill, alpha }).stroke({ color: stroke, width: strokeWidth });
      } else {
        const flat = points.flatMap((point) => [point.x, point.y]);
        graphics.poly(flat).fill({ color: fill, alpha }).stroke({ color: stroke, width: strokeWidth });
      }
      continue;
    }
    if (points.length === 2) {
      graphics.moveTo(points[0].x, points[0].y);
      graphics.lineTo(points[1].x, points[1].y);
      graphics.stroke({ color: stroke, width: strokeWidth || 4, alpha: 1 });
    }
  }
};

const hitTestRingList = (ringList: CanvasPoint[][], strokeWidth: number): HitTest => (point) =>
  ringList.some((ring) => {
    if (ring.length >= 3) return polygonHit(ring)(point);
    if (ring.length >= 2) return nearPolyline(ring, Math.max(6, strokeWidth + 4))(point);
    return false;
  });

const nearPolyline = (points: CanvasPoint[], tolerance: number): HitTest => (point) => {
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lenSq));
    const px = a.x + dx * t;
    const py = a.y + dy * t;
    if ((point.x - px) ** 2 + (point.y - py) ** 2 <= tolerance * tolerance) return true;
  }
  return false;
};

const curveSamples = (geometry: Record<string, unknown>): CanvasPoint[] => {
  const explicit = asPoints(geometry.points);
  if (explicit.length >= 2) return explicit;

  const start = asRecord(geometry.start);
  const control = asRecord(geometry.control);
  const end = asRecord(geometry.end);
  const samples: CanvasPoint[] = [];
  for (let i = 0; i <= 32; i += 1) {
    const t = i / 32;
    const mt = 1 - t;
    samples.push({
      x: mt * mt * asNumber(start.x) + 2 * mt * t * asNumber(control.x, 160) + t * t * asNumber(end.x, 320),
      y: mt * mt * asNumber(start.y) + 2 * mt * t * asNumber(control.y, -80) + t * t * asNumber(end.y),
    });
  }
  return samples;
};

const drawCurveText = (
  container: Container,
  object: CanvasObject,
  options?: ReconcileOptions,
): HitTest => {
  if (options?.editingTextObjectId === object.id) {
    const geometry = asRecord(object.geometryJson);
    const style = asRecord(object.styleJson);
    const fontSize = asNumber(style.fontSize, 24);
    const text = resolveTextContent(object);
    const points = curveSamples(geometry);
    const width = Math.max(160, text.length * fontSize * 0.55);
    const height = fontSize * 1.2;
    const anchor = points[0] ?? { x: 0, y: 0 };
    return boundsHit(anchor.x, anchor.y, width, height);
  }

  const geometry = asRecord(object.geometryJson);
  const style = asRecord(object.styleJson);
  const content = asRecord(object.contentJson);
  const text = resolveTextContent(object);
  const fontSize = asNumber(style.fontSize, 24);
  const color = toColor(style.fill ?? style.color, 0xf8d7a4);
  const opacity = asNumber(style.opacity, 1);
  const points = curveSamples(geometry);
  const hitBoxes: Array<{ x: number; y: number; width: number; height: number }> = [];
  const total = Math.max(1, text.length - 1);

  for (let index = 0; index < text.length; index += 1) {
    const t = text.length === 1 ? 0.5 : index / total;
    const segment = Math.min(points.length - 2, Math.max(0, Math.floor(t * (points.length - 1))));
    const a = points[segment];
    const b = points[segment + 1];
    const localT = t * (points.length - 1) - segment;
    const x = a.x + (b.x - a.x) * localT;
    const y = a.y + (b.y - a.y) * localT;
    const glyph = new Text({
      text: text[index],
      resolution: TEXT_RESOLUTION,
      style: { fill: color, fontFamily: 'Crimson Text, serif', fontSize },
    });
    glyph.anchor.set(0.5);
    glyph.position.set(x, y);
    glyph.rotation = Math.atan2(b.y - a.y, b.x - a.x);
    glyph.alpha = opacity;
    container.addChild(glyph);
    hitBoxes.push({ x: x - fontSize * 0.35, y: y - fontSize * 0.55, width: fontSize * 0.7, height: fontSize * 1.1 });
  }

  return (point) =>
    hitBoxes.some((box) => point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height);
};

const drawImagePlaceholder = (graphics: Graphics, width: number, height: number, stroke: number, strokeWidth: number): void => {
  graphics
    .rect(0, 0, width, height)
    .fill({ color: 0x5f6872, alpha: 0.42 })
    .stroke({ color: stroke, width: strokeWidth });
  graphics
    .moveTo(width * 0.25, height * 0.35)
    .lineTo(width * 0.45, height * 0.55)
    .lineTo(width * 0.58, height * 0.42)
    .lineTo(width * 0.78, height * 0.68)
    .stroke({ color: 0xd8dee8, width: Math.max(2, strokeWidth), alpha: 0.75 });
  graphics
    .circle(width * 0.72, height * 0.28, Math.max(4, Math.min(width, height) * 0.05))
    .fill({ color: 0xd8dee8, alpha: 0.72 });
};

const clearDisplay = (container: Container): void => {
  container.removeChildren().forEach((child) => child.destroy({ children: true }));
};

const imageFingerprint = (object: CanvasObject): string => {
  return JSON.stringify({
    kind: object.kind,
    resourcePath: object.resourcePath,
  });
};

const loadImageTexture = async (url: string): Promise<ImageTexture> => {
  const knownTexture = loadedImageTextures.get(url);
  if (knownTexture) return Assets.get(url) ?? knownTexture;
  const loadedTexture = await Assets.load(url);
  const cachedTexture = Assets.get(url) ?? loadedTexture;
  loadedImageTextures.set(url, cachedTexture);
  return cachedTexture;
};

const resolveSceneContainerTitle = (
  object: CanvasObject,
  linkedSceneNames?: ReadonlyMap<number, string>,
  defaultTitle = 'Карта',
): string => {
  const content = asRecord(object.contentJson);
  const override = asString(content.titleOverride, '').trim();
  if (override) return override;
  if (object.linkedSceneId != null) {
    const linkedName = linkedSceneNames?.get(object.linkedSceneId)?.trim();
    if (linkedName) return linkedName;
  }
  const objectName = object.name?.trim();
  if (objectName) return objectName;
  return defaultTitle;
};

const drawSceneContainerPreview = (
  container: Container,
  object: CanvasObject,
  x: number,
  y: number,
  width: number,
  height: number,
  backgroundPath: string | undefined,
  onImageLoadError?: ImageLoadErrorHandler,
): void => {
  const mask = new Graphics();
  mask.roundRect(x, y, width, height, 6).fill({ color: 0xffffff });
  container.addChild(mask);

  const previewLayer = new Container();
  previewLayer.mask = mask;
  container.addChild(previewLayer);

  const placeholder = new Graphics();
  placeholder.roundRect(x, y, width, height, 6).fill({ color: 0x0a1018, alpha: 1 });
  previewLayer.addChild(placeholder);

  const iconText = new Text({
    text: '🗺',
    resolution: TEXT_RESOLUTION,
    style: { fontSize: 28 },
  });
  iconText.x = x + (width - iconText.width) / 2;
  iconText.y = y + (height - iconText.height) / 2;
  previewLayer.addChild(iconText);

  if (!backgroundPath) return;

  void resolveUploadAssetUrl(backgroundPath)
    .then(async (url) => {
      if (!url || container.destroyed) return;
      try {
        const texture = await loadImageTexture(url);
        if (!texture || container.destroyed) return;
        previewLayer.removeChildren();
        const sprite = new Sprite(texture);
        const texWidth = sprite.texture.width;
        const texHeight = sprite.texture.height;
        const scale = Math.max(width / texWidth, height / texHeight);
        sprite.width = texWidth * scale;
        sprite.height = texHeight * scale;
        sprite.x = x + (width - sprite.width) / 2;
        sprite.y = y + (height - sprite.height) / 2;
        sprite.eventMode = 'none';
        previewLayer.addChild(sprite);
      } catch {
        onImageLoadError?.(object, backgroundPath);
      }
    })
    .catch(() => {
      onImageLoadError?.(object, backgroundPath);
    });
};

const drawSceneContainer = (
  container: Container,
  object: CanvasObject,
  selected: boolean,
  labels: SceneContainerDisplayLabels,
  linkedSceneNames?: ReadonlyMap<number, string>,
  linkedSceneBackgroundPaths?: ReadonlyMap<number, string>,
  onImageLoadError?: ImageLoadErrorHandler,
): HitTest => {
  const geometry = asRecord(object.geometryJson);
  const style = asRecord(object.styleJson);

  const width = asNumber(geometry.width, 240);
  const height = asNumber(geometry.height, 160);
  const footerHeight = 54;
  const previewX = 8;
  const previewY = 26;
  const previewWidth = width - 16;
  const previewHeight = Math.max(48, height - previewY - footerHeight);

  const graphics = new Graphics();
  container.addChild(graphics);

  const fill = toColor(style.fill, 0x16202a);
  const stroke = toColor(style.stroke, selected ? 0xf8d7a4 : 0x5ecfff);
  const alpha = asNumber(style.opacity, selected ? 0.98 : 0.92);
  const strokeWidth = selected ? 3 : 2;
  const radius = 10;

  graphics
    .roundRect(0, 0, width, height, radius)
    .fill({ color: fill, alpha })
    .stroke({ color: stroke, width: strokeWidth, alpha: selected ? 1 : 0.85 });

  if (selected) {
    graphics
      .roundRect(-2, -2, width + 4, height + 4, radius + 2)
      .stroke({ color: 0xf8d7a4, width: 1, alpha: 0.45 });
  }

  const backgroundPath = object.linkedSceneId != null
    ? linkedSceneBackgroundPaths?.get(object.linkedSceneId)
    : undefined;
  drawSceneContainerPreview(
    container,
    object,
    previewX,
    previewY,
    previewWidth,
    previewHeight,
    backgroundPath,
    onImageLoadError,
  );

  const kindBadge = new Text({
    text: labels.kindLabel,
    resolution: TEXT_RESOLUTION,
    style: {
      fill: 0x9ec9e8,
      fontFamily: 'Crimson Text, serif',
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1,
    },
  });
  kindBadge.x = 12;
  kindBadge.y = 10;
  container.addChild(kindBadge);

  const title = resolveSceneContainerTitle(object, linkedSceneNames, labels.defaultTitle);
  const titleText = new Text({
    text: title,
    resolution: TEXT_RESOLUTION,
    style: {
      fill: 0xffffff,
      fontFamily: 'Crimson Text, serif',
      fontSize: 17,
      fontWeight: 'bold',
      wordWrap: true,
      wordWrapWidth: width - 24,
      align: 'center',
    },
  });
  titleText.x = (width - titleText.width) / 2;
  titleText.y = height - footerHeight + 4;
  container.addChild(titleText);

  const subText = new Text({
    text: labels.openHint,
    resolution: TEXT_RESOLUTION,
    style: {
      fill: selected ? 0xc8dce8 : 0x7a8f9c,
      fontFamily: 'Crimson Text, serif',
      fontSize: 12,
    },
  });
  subText.x = (width - subText.width) / 2;
  subText.y = height - 28;
  container.addChild(subText);

  return boundsHit(0, 0, width, height);
};

const syncImageDisplay = (container: Container, object: CanvasObject, selected: boolean): HitTest => {
  const geometry = asRecord(object.geometryJson);
  const style = asRecord(object.styleJson);
  const width = asNumber(geometry.width, 120);
  const height = asNumber(geometry.height, 80);
  const stroke = toColor(style.stroke, selected ? 0xf8d7a4 : 0x20303a);
  const strokeWidth = asNumber(style.strokeWidth, selected ? 4 : 2);
  const child = container.children[0];
  if (child instanceof Sprite) {
    child.width = width;
    child.height = height;
  } else if (child instanceof Graphics) {
    child.clear();
    drawImagePlaceholder(child, width, height, stroke, strokeWidth);
  }
  return boundsHit(0, 0, width, height);
};


const drawShapeLabel = (container: Container, object: CanvasObject): void => {
  const placement = shapeLabelPlacement(object);
  if (!placement) return;
  const label = new Text({
    text: placement.text,
    resolution: TEXT_RESOLUTION,
    style: {
      fill: toColor(placement.color, 0xf8f4ec),
      fontFamily: 'Crimson Text, serif',
      fontSize: placement.fontSize,
      fontWeight: placement.fontWeight === 'bold' ? '700' : '400',
    },
  });
  label.anchor.set(0.5);
  label.position.set(placement.x, placement.y);
  label.eventMode = 'none';
  container.addChild(label);
};

const drawTerritoryLabel = (
  container: Container,
  ringList: CanvasPoint[][],
  name: string,
  viewportScale: number,
): void => {
  const placement = territoryLabelPlacement(ringList, name, viewportScale);
  if (!placement) return;
  const label = new Text({
    text: name.trim(),
    resolution: TEXT_RESOLUTION,
    style: {
      fill: 0xffffff,
      fontFamily: 'Crimson Text, serif',
      fontSize: placement.fontSize,
      fontWeight: '700',
      stroke: { color: 0x000000, width: placement.strokeWidth, alpha: 0.65 },
    },
  });
  label.anchor.set(0.5);
  label.position.set(placement.x, placement.y);
  label.alpha = 0.95;
  label.eventMode = 'none';
  container.addChild(label);
};

const drawObject = (
  container: Container,
  object: CanvasObject,
  selected: boolean,
  viewportScale: number,
  onImageLoadError?: ImageLoadErrorHandler,
  options?: ReconcileOptions,
): HitTest => {
  const geometry = asRecord(object.geometryJson);
  const style = asRecord(object.styleJson);
  const content = asRecord(object.contentJson);
  const fill = toColor(style.fill, object.kind === 'territory' ? 0x4ecdc4 : 0xff6b6b);
  const stroke = toColor(style.stroke, selected ? 0xf8d7a4 : 0x20303a);
  const alpha = asNumber(style.opacity, object.kind === 'territory' ? 0.25 : 0.9);
  const strokeWidth = asNumber(style.strokeWidth, selected ? 4 : 2);

  if (object.kind === 'curve_text') return drawCurveText(container, object, options);

  if (object.kind === 'scene_container') {
    const labels = options?.sceneContainerLabels ?? {
      defaultTitle: 'Карта',
      openHint: 'Двойной клик — открыть',
      kindLabel: 'Карта',
    };
    return drawSceneContainer(
      container,
      object,
      selected,
      labels,
      options?.linkedSceneNames,
      options?.linkedSceneBackgroundPaths,
      onImageLoadError,
    );
  }

  if (object.kind === 'text') {
    const fontSize = asNumber(style.fontSize, 28);
    const text = resolveTextContent(object);
    const width = Math.max(160, text.length * fontSize * 0.55);
    const height = fontSize * 1.2;
    if (options?.editingTextObjectId !== object.id) {
      const label = new Text({
        text,
        resolution: TEXT_RESOLUTION,
        style: {
          fill,
          fontFamily: 'Crimson Text, serif',
          fontSize,
        },
      });
      label.alpha = asNumber(style.opacity, 1);
      container.addChild(label);
      return boundsHit(0, 0, label.width, label.height);
    }
    return boundsHit(0, 0, width, height);
  }

  if (object.kind === 'marker') {
    return drawMarker(container, object, selected);
  }

  const graphics = new Graphics();
  container.addChild(graphics);

  if (object.kind === 'icon') {
    const radius = asNumber(geometry.radius, 12);
    graphics.circle(0, 0, radius).fill({ color: fill, alpha }).stroke({ color: stroke, width: strokeWidth });
    return circleHit(radius + strokeWidth);
  }

  if (object.kind === 'image') {
    const width = asNumber(geometry.width, 120);
    const height = asNumber(geometry.height, 80);
    drawImagePlaceholder(graphics, width, height, stroke, strokeWidth);
    if (object.resourcePath) {
      void resolveUploadAssetUrl(object.resourcePath)
        .then(async (url) => {
          if (!url || container.destroyed) return;
          try {
            const texture = await loadImageTexture(url);
            if (!texture || container.destroyed) {
              throw new Error('Image texture did not load');
            }
            const sprite = new Sprite(texture);
            sprite.width = width;
            sprite.height = height;
            clearDisplay(container);
            container.addChild(sprite);
          } catch {
            onImageLoadError?.(object, object.resourcePath ?? '');
          }
        })
        .catch(() => {
          onImageLoadError?.(object, object.resourcePath ?? '');
        });
      return boundsHit(0, 0, width, height);
    }
    return boundsHit(0, 0, width, height);
  }

  if (object.kind === 'rectangle' || object.kind === 'group') {
    const width = asNumber(geometry.width, 120);
    const height = asNumber(geometry.height, 80);
    graphics.rect(0, 0, width, height).fill({ color: fill, alpha }).stroke({ color: stroke, width: strokeWidth });
    if (isShapeKind(object.kind)) drawShapeLabel(container, object);
    return boundsHit(0, 0, width, height);
  }

  if (object.kind === 'ellipse') {
    const radiusX = asNumber(geometry.radiusX, 60);
    const radiusY = asNumber(geometry.radiusY, 36);
    graphics.ellipse(0, 0, radiusX, radiusY).fill({ color: fill, alpha }).stroke({ color: stroke, width: strokeWidth });
    drawShapeLabel(container, object);
    return (point) => (point.x / radiusX) ** 2 + (point.y / radiusY) ** 2 <= 1;
  }

  if (object.kind === 'polyline') {
    const points = asPoints(geometry.points);
    if (points.length >= 2) {
      graphics.moveTo(points[0].x, points[0].y);
      for (let index = 1; index < points.length; index += 1) {
        graphics.lineTo(points[index].x, points[index].y);
      }
      graphics.stroke({ color: stroke, width: strokeWidth || 4, alpha: 1 });
      drawShapeLabel(container, object);
      return nearPolyline(points, Math.max(6, strokeWidth + 4));
    }
  }

  if (object.kind === 'territory' || object.kind === 'polygon') {
    const ringList = territoryRingsFromObject(object);
    if (ringList.length > 0) {
      const territoryStyle = object.kind === 'territory'
        ? resolveTerritoryStyleFields(object, {
            fill: '#4ecdc4',
            opacity: 0.25,
            borderColor: '#9ff3df',
            borderWidth: 2,
            smoothing: 0,
          })
        : null;
      const ringFill = territoryStyle ? toColor(territoryStyle.fill, fill) : fill;
      const ringStroke = territoryStyle ? toColor(territoryStyle.borderColor, stroke) : stroke;
      const ringAlpha = territoryStyle ? territoryStyle.opacity : alpha;
      const ringStrokeWidth = territoryStyle ? territoryStyle.borderWidth : strokeWidth;
      const ringSmoothing = territoryStyle?.smoothing ?? 0;
      drawRingList(graphics, ringList, ringFill, ringStroke, ringAlpha, ringStrokeWidth, ringSmoothing);
      if (object.kind === 'territory') {
        drawTerritoryLabel(container, ringList, object.name ?? '', viewportScale);
      } else {
        drawShapeLabel(container, object);
      }
      return hitTestRingList(ringList, ringStrokeWidth);
    }
  }

  graphics.rect(-20, -20, 40, 40).fill({ color: fill, alpha: 0.4 }).stroke({ color: stroke, width: 1 });
  return boundsHit(-20, -20, 40, 40);
};

const getObjectKindPriority = (kind: string): number => {
  if (kind === 'territory') return 0;
  if (kind === 'marker') return 2;
  return 1;
};

const compareObjects = (a: CanvasObject, b: CanvasObject): number => {
  if (a.zIndex !== b.zIndex) {
    return a.zIndex - b.zIndex;
  }
  const pA = getObjectKindPriority(a.kind);
  const pB = getObjectKindPriority(b.kind);
  if (pA !== pB) {
    return pA - pB;
  }
  return a.id - b.id;
};

export const reconcilePixiObjects = (
  root: Container,
  state: ReconcileState,
  layers: CanvasLayer[],
  objects: CanvasObject[],
  selectedObjectId: number | null,
  onImageLoadError?: ImageLoadErrorHandler,
  options?: ReconcileOptions,
): void => {
  const viewportScale = options?.viewportScale ?? 1;
  const visibleLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex || a.id - b.id);
  const layerIds = new Set(visibleLayers.map((layer) => layer.id));

  for (const [id, container] of state.layerContainers) {
    if (!layerIds.has(id)) {
      container.destroy({ children: true });
      state.layerContainers.delete(id);
    }
  }

  visibleLayers.forEach((layer, index) => {
    let container = state.layerContainers.get(layer.id);
    if (!container) {
      container = new Container();
      state.layerContainers.set(layer.id, container);
      root.addChild(container);
    }
    container.visible = !layer.isHidden;
    container.alpha = layer.opacity ?? 1;
    container.zIndex = index;
  });
  root.sortableChildren = true;

  const objectIds = new Set(objects.map((object) => object.id));
  for (const [id, entry] of state.objects) {
    if (!objectIds.has(id)) {
      entry.display.destroy({ children: true });
      state.objects.delete(id);
    }
  }

  const sortedObjects = [...objects].sort(compareObjects);
  for (const object of sortedObjects) {
    const layerContainer = state.layerContainers.get(object.layerId);
    if (!layerContainer || object.isHidden) continue;

    const transform = objectTransform(object);
    const fingerprint = object.kind === 'image'
      ? imageFingerprint(object)
      : JSON.stringify({
          object,
          selected: selectedObjectId === object.id,
          viewportScale: Math.round(viewportScale * 1000) / 1000,
          linkedSceneName: object.kind === 'scene_container' && object.linkedSceneId != null
            ? options?.linkedSceneNames?.get(object.linkedSceneId)
            : undefined,
          linkedSceneBackground: object.kind === 'scene_container' && object.linkedSceneId != null
            ? options?.linkedSceneBackgroundPaths?.get(object.linkedSceneId)
            : undefined,
          sceneContainerLabels: object.kind === 'scene_container'
            ? options?.sceneContainerLabels
            : undefined,
          editingTextObjectId: options?.editingTextObjectId ?? null,
        });
    let entry = state.objects.get(object.id);
    if (!entry) {
      entry = {
        objectId: object.id,
        fingerprint: '',
        display: new Container(),
        hitTest: () => false,
      };
      state.objects.set(object.id, entry);
      layerContainer.addChild(entry.display);
    } else if (entry.display.parent !== layerContainer) {
      layerContainer.addChild(entry.display);
    }

    entry.display.position.set(transform.x, transform.y);
    entry.display.rotation = transform.rotation;
    entry.display.scale.set(transform.scaleX, transform.scaleY);
    entry.display.zIndex = object.zIndex;
    layerContainer.sortableChildren = true;

    if (entry.fingerprint !== fingerprint) {
      clearDisplay(entry.display);
      entry.hitTest = drawObject(
        entry.display,
        object,
        selectedObjectId === object.id,
        viewportScale,
        onImageLoadError,
        options,
      );
      entry.fingerprint = fingerprint;
    } else if (object.kind === 'image') {
      entry.hitTest = syncImageDisplay(entry.display, object, selectedObjectId === object.id);
    }
  }
};

export const hitTestObjects = (
  state: ReconcileState,
  objects: CanvasObject[],
  point: CanvasPoint,
): CanvasObject | null => {
  const sorted = [...objects].sort((a, b) => compareObjects(b, a));
  for (const object of sorted) {
    const entry = state.objects.get(object.id);
    if (!entry || object.isHidden || object.isLocked) continue;
    const transform = objectTransform(object);
    const local = {
      x: point.x - transform.x,
      y: point.y - transform.y,
    };
    if (entry.hitTest(local)) return object;
  }
  return null;
};
