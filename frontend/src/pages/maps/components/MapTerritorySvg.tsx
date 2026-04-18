import React, { useEffect, useState } from 'react';
import {
  TERRITORY_SVG_FILTER_MAX_POINTS,
  territoryLabelMetrics,
  getLargestRing,
  territoryTotalPointCount,
} from './mapUtils';
import type { MapMode, Marker, Territory, TerritoryPointDragPayload } from './mapUtils';

type Props = {
  imgRef: React.RefObject<HTMLImageElement | null>;
  zoomDisplay: number;
  territories: Territory[];
  mode: MapMode;
  drawingCompletedRings: { x: number; y: number }[][];
  drawingPoints: { x: number; y: number }[];
  editingTerritoryPoints: Territory | null;
  selectedTerritory: Territory | null;
  draggingMarker: Marker | null;
  draggingTerritoryPoint: TerritoryPointDragPayload | null;
  onTerritoryClick: (e: React.MouseEvent<SVGElement>, territory: Territory) => void;
  onPointDragStart: (e: React.MouseEvent, payload: TerritoryPointDragPayload) => void;
  onDeletePoint: (payload: TerritoryPointDragPayload) => void;
  onAddPointOnEdge: (payload: TerritoryPointDragPayload) => void;
};

const ringToSvg = (ring: { x: number; y: number }[], w: number, h: number) =>
  ring.map(p => ({ x: (p.x / 100) * w, y: (p.y / 100) * h }));

/** SVG user units such that shape appears as `screenPx` on screen (parent has CSS scale(zoom)). */
const screenPxToSvgLen = (screenPx: number, zoom: number) => screenPx / Math.max(zoom, 0.001);

export const MapTerritorySvg: React.FC<Props> = ({
  imgRef,
  zoomDisplay,
  territories,
  mode,
  drawingCompletedRings,
  drawingPoints,
  editingTerritoryPoints,
  selectedTerritory,
  draggingMarker,
  draggingTerritoryPoint,
  onTerritoryClick,
  onPointDragStart,
  onDeletePoint,
  onAddPointOnEdge,
}) => {
  const [hoveredDrawIndex, setHoveredDrawIndex] = useState<number | null>(null);
  const [hoveredEditKey, setHoveredEditKey] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'draw_territory') setHoveredDrawIndex(null);
  }, [mode]);

  useEffect(() => {
    if (!editingTerritoryPoints) setHoveredEditKey(null);
  }, [editingTerritoryPoints]);

  if (!imgRef.current) return null;
  const w = imgRef.current.clientWidth;
  const h = imgRef.current.clientHeight;
  if (!w || !h) return null;

  const z = zoomDisplay;
  const rHit = screenPxToSvgLen(8, z);
  const rVis = screenPxToSvgLen(4, z);
  const rHi = screenPxToSvgLen(6, z);
  const stroke1px = screenPxToSvgLen(1, z);

  const complexTerritories = territories.some((t) => territoryTotalPointCount(t) > TERRITORY_SVG_FILTER_MAX_POINTS);
  const reduceTerritoryEffects = Boolean(
    draggingMarker ||
      draggingTerritoryPoint !== null ||
      editingTerritoryPoints ||
      mode === 'draw_territory' ||
      complexTerritories
  );

  const hexToRgbStr = (hex: string) => {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return `${r},${g},${b}`;
  };

  const getCentroid = (pts: { x: number; y: number }[]) => {
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    return { cx, cy };
  };

  const buildSmoothPath = (pts: { x: number; y: number }[], smoothing: number): string => {
    if (pts.length < 3 || smoothing === 0) {
      return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
    }

    const n = pts.length;
    const s = smoothing;
    const parts: string[] = [];

    for (let i = 0; i < n; i++) {
      const prev = pts[(i - 1 + n) % n];
      const curr = pts[i];
      const next = pts[(i + 1) % n];

      const startX = curr.x + (prev.x - curr.x) * s * 0.5;
      const startY = curr.y + (prev.y - curr.y) * s * 0.5;
      const endX = curr.x + (next.x - curr.x) * s * 0.5;
      const endY = curr.y + (next.y - curr.y) * s * 0.5;

      if (i === 0) {
        parts.push(`M ${endX} ${endY}`);
      } else {
        parts.push(`L ${startX} ${startY}`);
        parts.push(`Q ${curr.x} ${curr.y} ${endX} ${endY}`);
      }
    }

    const first = pts[0];
    const last = pts[n - 1];
    const second = pts[1];
    const closeStartX = first.x + (last.x - first.x) * s * 0.5;
    const closeStartY = first.y + (last.y - first.y) * s * 0.5;
    const closeEndX = first.x + (second.x - first.x) * s * 0.5;
    const closeEndY = first.y + (second.y - first.y) * s * 0.5;

    parts.push(`L ${closeStartX} ${closeStartY}`);
    parts.push(`Q ${first.x} ${first.y} ${closeEndX} ${closeEndY}`);
    parts.push('Z');

    return parts.join(' ');
  };

  const straightPathD = (svgPts: { x: number; y: number }[]) =>
    svgPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  const isDraggingDrawVertex = (i: number) =>
    draggingTerritoryPoint?.mode === 'draw' && draggingTerritoryPoint.pointIndex === i;

  const isDraggingEditVertex = (ri: number, i: number) =>
    draggingTerritoryPoint?.mode === 'edit' &&
    draggingTerritoryPoint.ringIndex === ri &&
    draggingTerritoryPoint.pointIndex === i;

  return (
    <svg
      shapeRendering={complexTerritories ? 'optimizeSpeed' : 'geometricPrecision'}
      style={{
        position: 'absolute', top: 0, left: 0,
        width: w, height: h,
        pointerEvents: 'none', zIndex: 2,
        overflow: reduceTerritoryEffects ? 'hidden' : 'visible',
      }}
      viewBox={`0 0 ${w} ${h}`}
    >
      <defs>
        <pattern id="territory-hatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
        </pattern>

        {territories.map(t => {
          const gradId = `grad-${t.id}`;
          const filterId = `filter-${t.id}`;
          const innerGlowId = `innerglow-${t.id}`;
          const rgb = hexToRgbStr(t.color);

          return (
            <React.Fragment key={`defs-${t.id}`}>
              <radialGradient id={gradId} cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor={`rgba(${rgb}, ${Math.min(t.opacity * 1.4, 0.6)})`} />
                <stop offset="100%" stopColor={`rgba(${rgb}, ${t.opacity * 0.5})`} />
              </radialGradient>

              {!reduceTerritoryEffects && (
                <>
                  <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
                    <feFlood floodColor={t.borderColor} floodOpacity="0.4" result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="shadow" />
                    <feMerge>
                      <feMergeNode in="shadow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  <filter id={innerGlowId} x="-10%" y="-10%" width="120%" height="120%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur" />
                    <feFlood floodColor={`rgb(${rgb})`} floodOpacity="0.3" result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="glow" />
                    <feComposite in="glow" in2="SourceAlpha" operator="in" />
                  </filter>
                </>
              )}
            </React.Fragment>
          );
        })}
      </defs>

      {territories.map(t => {
        const ringPaths = t.rings.map(ring => buildSmoothPath(ringToSvg(ring, w, h), t.smoothing));
        const pathDCombined = ringPaths.join(' ');
        const gradId = `grad-${t.id}`;
        const filterId = `filter-${t.id}`;
        const innerGlowId = `innerglow-${t.id}`;
        const clipId = `clip-${t.id}`;
        const isSelected = selectedTerritory?.id === t.id;

        return (
          <g key={t.id} filter={reduceTerritoryEffects ? undefined : `url(#${filterId})`}>
            <clipPath id={clipId}>
              {ringPaths.map((d, ri) => (
                <path key={ri} d={d} />
              ))}
            </clipPath>

            {ringPaths.map((d, ri) => (
              <path key={`fill-${ri}`} d={d} fill={`url(#${gradId})`} stroke="none" />
            ))}

            {ringPaths.map((d, ri) => (
              <path
                key={`hatch-${ri}`}
                d={d}
                fill="url(#territory-hatch)"
                stroke="none"
                opacity={0.6}
              />
            ))}

            <g clipPath={`url(#${clipId})`}>
              {ringPaths.map((d, ri) => (
                <path
                  key={`glow-${ri}`}
                  d={d}
                  fill="none"
                  stroke={t.color}
                  strokeWidth={12}
                  opacity={0.15}
                  filter={reduceTerritoryEffects ? undefined : `url(#${innerGlowId})`}
                />
              ))}
            </g>

            {ringPaths.map((d, ri) => (
              <path
                key={`b1-${ri}`}
                d={d}
                fill="none"
                stroke="rgba(0,0,0,0.4)"
                strokeWidth={t.borderWidth + 2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}

            {ringPaths.map((d, ri) => (
              <path
                key={`b2-${ri}`}
                d={d}
                fill="none"
                stroke={t.borderColor}
                strokeWidth={t.borderWidth}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}

            <g clipPath={`url(#${clipId})`}>
              {ringPaths.map((d, ri) => (
                <path
                  key={`hi-${ri}`}
                  d={d}
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth={t.borderWidth + 1}
                  strokeLinejoin="round"
                />
              ))}
            </g>

            {isSelected &&
              ringPaths.map((d, ri) => (
                <path
                  key={`sel-${ri}`}
                  d={d}
                  fill="none"
                  stroke="#fff"
                  strokeWidth={t.borderWidth + 1}
                  strokeLinejoin="round"
                  strokeDasharray="6 4"
                  opacity={0.7}
                />
              ))}

            {ringPaths.map((d, ri) => (
              <path
                key={`hit-${ri}`}
                d={d}
                fill="transparent"
                stroke="transparent"
                strokeWidth={Math.max(t.borderWidth + 6, 10)}
                style={{
                  pointerEvents: mode === 'select' ? 'auto' : 'none',
                  cursor: mode === 'select' ? 'pointer' : 'default',
                }}
                onClick={(e) => onTerritoryClick(e, t)}
              />
            ))}
          </g>
        );
      })}

      <g style={{ pointerEvents: 'none' }}>
        {territories.map(t => {
          const largest = getLargestRing(t);
          if (largest.length === 0) return null;
          const svgPts = ringToSvg(largest, w, h);
          const { cx, cy } = getCentroid(svgPts);
          const { fontSize: labelFontSize, strokeWidth: labelStroke } = territoryLabelMetrics(
            svgPts,
            t.name,
            zoomDisplay
          );

          return (
            <g key={`label-${t.id}`}>
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                fill="rgba(255,255,255,0.95)"
                fontSize={labelFontSize}
                fontWeight={700}
                fontFamily="inherit"
                style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 0 12px rgba(0,0,0,0.45)' }}
                paintOrder="stroke"
                stroke="rgba(0,0,0,0.65)"
                strokeWidth={labelStroke}
                strokeLinejoin="round"
              >
                {t.name}
              </text>
            </g>
          );
        })}
      </g>

      {mode === 'draw_territory' && (drawingCompletedRings.length > 0 || drawingPoints.length > 0) && (
        <>
          {drawingCompletedRings.map((ring, ri) => {
            const svgPts = ringToSvg(ring, w, h);
            if (svgPts.length < 3) return null;
            return (
              <path
                key={`done-${ri}`}
                d={straightPathD(svgPts)}
                fill="rgba(78, 205, 196, 0.12)"
                stroke="#4ECDC4"
                strokeWidth={2}
                strokeDasharray="8 4"
                strokeLinejoin="round"
                opacity={0.85}
              />
            );
          })}
          {drawingPoints.length > 0 && (() => {
            const svgPts = ringToSvg(drawingPoints, w, h);
            return (
              <>
                {svgPts.length >= 3 && (
                  <path
                    d={straightPathD(svgPts)}
                    fill="rgba(78, 205, 196, 0.15)"
                    stroke="#4ECDC4"
                    strokeWidth={2}
                    strokeDasharray="8 4"
                    strokeLinejoin="round"
                  />
                )}
                {svgPts.length === 2 && (
                  <line
                    x1={svgPts[0].x} y1={svgPts[0].y}
                    x2={svgPts[1].x} y2={svgPts[1].y}
                    stroke="#4ECDC4" strokeWidth={2} strokeDasharray="8 4"
                  />
                )}
                {svgPts.map((p, i) => {
                  const drawActive =
                    isDraggingDrawVertex(i) || hoveredDrawIndex === i;
                  const cursor =
                    draggingTerritoryPoint?.mode === 'draw' && draggingTerritoryPoint.pointIndex === i
                      ? 'grabbing'
                      : 'grab';
                  return (
                    <g key={i}>
                      <circle
                        cx={p.x} cy={p.y} r={rHit}
                        fill="transparent"
                        style={{ cursor, pointerEvents: 'auto' }}
                        onMouseDown={e => onPointDragStart(e, { mode: 'draw', pointIndex: i })}
                        onMouseEnter={() => setHoveredDrawIndex(i)}
                        onMouseLeave={() => setHoveredDrawIndex(prev => (prev === i ? null : prev))}
                        onContextMenu={e => {
                          e.preventDefault();
                          if (drawingPoints.length > 1) onDeletePoint({ mode: 'draw', pointIndex: i });
                        }}
                        onDoubleClick={e => {
                          e.stopPropagation();
                          onAddPointOnEdge({ mode: 'draw', pointIndex: i });
                        }}
                      />
                      <circle
                        cx={p.x} cy={p.y}
                        r={drawActive ? rHi : rVis}
                        fill={drawActive ? '#FFD700' : (i === 0 ? '#FF6B6B' : '#4ECDC4')}
                        stroke="#111" strokeWidth={stroke1px}
                        style={{ pointerEvents: 'none' }}
                      />
                    </g>
                  );
                })}
              </>
            );
          })()}
        </>
      )}

      {editingTerritoryPoints &&
        editingTerritoryPoints.rings.map((ring, ri) => {
          const svgPts = ringToSvg(ring, w, h);
          const pathD = straightPathD(svgPts);
          return (
            <React.Fragment key={`edit-ring-${ri}`}>
              <path
                d={pathD}
                fill={`rgba(${hexToRgbStr(editingTerritoryPoints.color)}, 0.2)`}
                stroke="#FFD700"
                strokeWidth={2}
                strokeDasharray="6 3"
                strokeLinejoin="round"
              />
              {svgPts.map((p, i) => {
                const editKey = `${ri}-${i}`;
                const editActive =
                  isDraggingEditVertex(ri, i) || hoveredEditKey === editKey;
                const cursor =
                  draggingTerritoryPoint?.mode === 'edit' &&
                  draggingTerritoryPoint.ringIndex === ri &&
                  draggingTerritoryPoint.pointIndex === i
                    ? 'grabbing'
                    : 'grab';
                return (
                  <g key={editKey}>
                    <circle
                      cx={p.x} cy={p.y} r={rHit}
                      fill="transparent"
                      style={{ cursor, pointerEvents: 'auto' }}
                      onMouseDown={e => onPointDragStart(e, { mode: 'edit', ringIndex: ri, pointIndex: i })}
                      onMouseEnter={() => setHoveredEditKey(editKey)}
                      onMouseLeave={() => setHoveredEditKey(prev => (prev === editKey ? null : prev))}
                      onContextMenu={e => {
                        e.preventDefault();
                        if (ring.length > 3) onDeletePoint({ mode: 'edit', ringIndex: ri, pointIndex: i });
                      }}
                      onDoubleClick={e => {
                        e.stopPropagation();
                        onAddPointOnEdge({ mode: 'edit', ringIndex: ri, pointIndex: i });
                      }}
                    />
                    <circle
                      cx={p.x} cy={p.y}
                      r={editActive ? rHi : rVis}
                      fill={editActive ? '#FFD700' : '#fff'}
                      stroke="#111" strokeWidth={stroke1px}
                      style={{ pointerEvents: 'none' }}
                    />
                  </g>
                );
              })}
            </React.Fragment>
          );
        })}
    </svg>
  );
};
