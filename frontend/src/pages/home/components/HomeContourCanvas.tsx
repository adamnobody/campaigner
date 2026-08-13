import React, { useEffect, useRef } from 'react';

export type HomeContourPulse = {
  id: number;
  direction: -1 | 1;
};

type RGB = [number, number, number];

type ContourLine = {
  y: number;
  amplitudeA: number;
  amplitudeB: number;
  frequencyA: number;
  frequencyB: number;
  speed: number;
  phase: number;
  major: boolean;
  mouseBuffer: Float32Array;
};

type DustParticle = {
  x: number;
  y: number;
  radius: number;
  velocityX: number;
  velocityY: number;
  phase: number;
};

type ArchMetrics = {
  centerX: number;
  top: number;
  width: number;
  height: number;
};

type Scene = {
  width: number;
  height: number;
  context: CanvasRenderingContext2D;
  lines: ContourLine[];
  dust: DustParticle[];
  arches: ArchMetrics[];
};

type HomeContourCanvasProps = {
  accentColor: string;
  animate: boolean;
  pulse: HomeContourPulse;
  transparentBase?: boolean;
  visible?: boolean;
};

const parseColor = (value: string): RGB => {
  const hex = value.trim().match(/^#([\da-f]{3}|[\da-f]{6})$/i)?.[1];
  if (hex) {
    const full = hex.length === 3 ? hex.split('').map((part) => part + part).join('') : hex;
    return [
      Number.parseInt(full.slice(0, 2), 16),
      Number.parseInt(full.slice(2, 4), 16),
      Number.parseInt(full.slice(4, 6), 16),
    ];
  }
  const rgb = value.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  return rgb
    ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
    : [201, 169, 97];
};

const seededRandom = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0xffffffff;
};

const createGrainTile = () => {
  const size = 128;
  const tile = document.createElement('canvas');
  tile.width = size;
  tile.height = size;
  const context = tile.getContext('2d');
  if (!context) return null;
  const image = context.createImageData(size, size);
  const random = seededRandom(0x51a7c0de);
  for (let index = 0; index < size * size; index += 1) {
    const value = random() * 255;
    image.data[index * 4] = 255;
    image.data[index * 4 + 1] = 246;
    image.data[index * 4 + 2] = 228;
    image.data[index * 4 + 3] = value < 208 ? 0 : (value - 208) * 0.62;
  }
  context.putImageData(image, 0, 0);
  return tile;
};

export function HomeContourCanvas({
  accentColor,
  animate,
  pulse,
  transparentBase = false,
  visible = true,
}: HomeContourCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const configRef = useRef({ color: parseColor(accentColor), animate, transparentBase });
  const pulseRef = useRef({ id: pulse.id, direction: pulse.direction, startedAt: -10_000 });

  useEffect(() => {
    configRef.current = { color: parseColor(accentColor), animate, transparentBase };
  }, [accentColor, animate, transparentBase]);

  useEffect(() => {
    pulseRef.current = {
      id: pulse.id,
      direction: pulse.direction,
      startedAt: performance.now(),
    };
  }, [pulse]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const grainTile = createGrainTile();
    const mouse = { rawX: 0, rawY: 0, x: 0, y: 0, influence: 0, active: false, initialized: false };
    let scene: Scene | null = null;
    let animationFrame = 0;
    let frame = 0;
    let startedAt = performance.now();

    const setup = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;
      const needsRebuild = !scene || scene.width !== width || scene.height !== height;
      if (needsRebuild) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        const context = canvas.getContext('2d');
        if (!context) return;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        const random = seededRandom(width * 31 + height * 17 + 0xca6e);
        const lineCount = Math.max(12, Math.min(24, Math.round(height / 54)));
        const lines = Array.from({ length: lineCount }, (_, index): ContourLine => ({
          y: (index + 0.5) / lineCount,
          amplitudeA: 5 + random() * 13,
          amplitudeB: 3 + random() * 8,
          frequencyA: 0.9 + random() * 1.3,
          frequencyB: 2.1 + random() * 2.1,
          speed: 0.05 + random() * 0.11,
          phase: random() * Math.PI * 2,
          major: index % 5 === 2,
          mouseBuffer: new Float32Array(Math.floor(width / 6) + 2),
        }));
        const dustCount = Math.round(width * height / 18_000);
        const dust = Array.from({ length: dustCount }, (): DustParticle => ({
          x: random() * width,
          y: random() * height,
          radius: 0.4 + random() * 1.25,
          velocityX: (random() - 0.5) * 3,
          velocityY: 3 + random() * 6,
          phase: random() * Math.PI * 2,
        }));
        scene = { width, height, context, lines, dust, arches: [] };
        startedAt = performance.now();
      }

      if (!scene) return;
      const canvasRect = canvas.getBoundingClientRect();
      scene.arches = Array.from(document.querySelectorAll<HTMLElement>('[data-home-arch]'))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            centerX: rect.left - canvasRect.left + rect.width / 2,
            top: rect.top - canvasRect.top,
            width: rect.width,
            height: rect.height,
          };
        })
        .filter((arch) => arch.width > 0 && arch.height > 0)
        .sort((left, right) => left.centerX - right.centerX);
    };

    const onMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.rawX = event.clientX - rect.left;
      mouse.rawY = event.clientY - rect.top;
      mouse.active = true;
      if (!mouse.initialized) {
        mouse.x = mouse.rawX;
        mouse.y = mouse.rawY;
        mouse.initialized = true;
      }
    };
    const onMouseLeave = () => {
      mouse.active = false;
    };

    const relief = (x: number, baseY: number, arches: ArchMetrics[]) => arches.reduce((offset, arch) => {
      const peakY = arch.top + arch.height * 0.42;
      const vertical = Math.exp(-(((baseY - peakY) / (arch.height * 0.95)) ** 2));
      const profile = Math.exp(-(((x - arch.centerX) / (arch.width * 0.78)) ** 2));
      return offset - arch.height * 0.3 * vertical * profile;
    }, 0);

    const paint = (now: number) => {
      if (!scene) return;
      const { context, width, height, lines, dust, arches } = scene;
      const { color, transparentBase: translucent } = configRef.current;
      const elapsed = (now - startedAt) / 1000;
      const time = elapsed;
      const breathe = 0.82 + 0.3 * (0.5 + 0.5 * Math.sin(time * 0.08));
      const reveal = Math.min(1, Math.min(1, elapsed / 1.8) ** 0.7);

      context.clearRect(0, 0, width, height);
      context.fillStyle = translucent ? 'rgba(10,11,14,.78)' : '#0a0b0e';
      context.fillRect(0, 0, width, height);

      const glow = context.createRadialGradient(width / 2, height * 0.52, 0, width / 2, height * 0.52, Math.max(width, height) * 0.72);
      glow.addColorStop(0, `rgba(${color[0]},${color[1]},${color[2]},.05)`);
      glow.addColorStop(1, 'rgba(10,11,14,0)');
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      if (mouse.active) {
        mouse.x += (mouse.rawX - mouse.x) * 0.05;
        mouse.y += (mouse.rawY - mouse.y) * 0.05;
      }
      mouse.influence += ((mouse.active ? 1 : 0) - mouse.influence) * 0.035;

      const pulseAge = (now - pulseRef.current.startedAt) / 1000;
      const pulseActive = pulseAge >= 0 && pulseAge < 2.6;
      const pulseFront = pulseRef.current.direction > 0
        ? width * (pulseAge / 1.05)
        : width - width * (pulseAge / 1.05);
      const pulseAmplitude = 26 * Math.exp(-pulseAge * 1.25);
      const maxX = width * reveal;

      lines.forEach((line) => {
        const baseY = line.y * height;
        const lineAlpha = ((line.major ? 0.155 : 0.098) + 0.075 * (0.5 + 0.5 * Math.sin(time * 0.25 + line.phase))) * breathe;
        context.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${lineAlpha.toFixed(3)})`;
        context.lineWidth = line.major ? 1.45 : 0.8;
        context.beginPath();
        let started = false;
        let bufferIndex = 0;
        for (let x = 0; x <= maxX; x += 6, bufferIndex += 1) {
          const unit = x / width;
          let y = baseY
            + Math.sin(unit * line.frequencyA * Math.PI * 2 + time * line.speed * 3 + line.phase) * line.amplitudeA * breathe
            + Math.sin(unit * line.frequencyB * Math.PI * 2 - time * line.speed * 2 + line.phase * 1.6) * line.amplitudeB * breathe
            + relief(x, baseY, arches);

          let mouseTarget = 0;
          if (mouse.influence > 0.004) {
            const distance = Math.hypot(x - mouse.x, baseY - mouse.y);
            const force = Math.exp(-((distance / 320) ** 2));
            mouseTarget = Math.tanh((baseY - mouse.y) / 70) * 26 * force * mouse.influence;
          }
          if (bufferIndex < line.mouseBuffer.length) {
            line.mouseBuffer[bufferIndex] += (mouseTarget - line.mouseBuffer[bufferIndex]) * 0.028;
            y += line.mouseBuffer[bufferIndex];
          }
          if (pulseActive) {
            y -= pulseAmplitude * Math.exp(-(((x - pulseFront) / (width * 0.13)) ** 2));
          }
          if (started) context.lineTo(x, y);
          else {
            context.moveTo(x, y);
            started = true;
          }
        }
        context.stroke();
      });

      context.globalCompositeOperation = 'lighter';
      dust.forEach((particle) => {
        const y = ((particle.y - particle.velocityY * time) % (height + 40) + height + 40) % (height + 40) - 20;
        const x = ((particle.x + particle.velocityX * time) % (width + 40) + width + 40) % (width + 40) - 20;
        const opacity = 0.1 + 0.26 * (0.5 + 0.5 * Math.sin(time * 0.9 + particle.phase));
        const particleGlow = context.createRadialGradient(x, y, 0, x, y, particle.radius * 4);
        particleGlow.addColorStop(0, `rgba(${color[0]},${color[1]},${color[2]},${opacity.toFixed(3)})`);
        particleGlow.addColorStop(1, `rgba(${color[0]},${color[1]},${color[2]},0)`);
        context.fillStyle = particleGlow;
        context.beginPath();
        context.arc(x, y, particle.radius * 4, 0, Math.PI * 2);
        context.fill();
      });
      context.globalCompositeOperation = 'source-over';

      const horizontalFade = context.createLinearGradient(0, 0, width, 0);
      horizontalFade.addColorStop(0, 'rgba(10,11,14,1)');
      horizontalFade.addColorStop(0.16, 'rgba(10,11,14,0)');
      horizontalFade.addColorStop(0.84, 'rgba(10,11,14,0)');
      horizontalFade.addColorStop(1, 'rgba(10,11,14,1)');
      context.fillStyle = horizontalFade;
      context.fillRect(0, 0, width, height);

      const verticalFade = context.createLinearGradient(0, 0, 0, height);
      verticalFade.addColorStop(0, 'rgba(10,11,14,.9)');
      verticalFade.addColorStop(0.14, 'rgba(10,11,14,0)');
      verticalFade.addColorStop(0.86, 'rgba(10,11,14,0)');
      verticalFade.addColorStop(1, 'rgba(10,11,14,.9)');
      context.fillStyle = verticalFade;
      context.fillRect(0, 0, width, height);

      if (grainTile) {
        const pattern = context.createPattern(grainTile, 'repeat');
        if (pattern) {
          context.save();
          context.globalAlpha = 0.1;
          context.translate(-((time * 9) % 128), -((time * 5) % 128));
          context.fillStyle = pattern;
          context.fillRect(0, 0, width + 256, height + 256);
          context.restore();
        }
      }
    };

    const tick = (now: number) => {
      if (frame % 20 === 0) setup();
      frame += 1;
      paint(now);
      if (configRef.current.animate && !document.hidden) {
        animationFrame = window.requestAnimationFrame(tick);
      }
    };

    const start = () => {
      window.cancelAnimationFrame(animationFrame);
      setup();
      if (configRef.current.animate && !document.hidden) {
        animationFrame = window.requestAnimationFrame(tick);
      } else {
        paint(performance.now());
      }
    };

    const resizeObserver = new ResizeObserver(start);
    resizeObserver.observe(canvas);
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('visibilitychange', start);
    start();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      document.documentElement.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('visibilitychange', start);
    };
  }, [accentColor, animate, transparentBase]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: visible ? 1 : 0,
        transition: 'opacity 220ms ease',
      }}
    />
  );
}
