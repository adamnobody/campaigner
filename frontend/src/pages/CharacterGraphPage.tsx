import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, IconButton, Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import { useParams, useNavigate } from 'react-router-dom';
import { charactersApi } from '@/api/axiosClient';
import { DndButton } from '@/components/ui/DndButton';

/* ============ types ============ */
interface GNode {
  id: number;
  name: string;
  title: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface GEdge {
  source: number;
  target: number;
  type: string;
  description: string;
}

/* ============ constants ============ */
const REL_LABELS: Record<string, string> = {
  ally: 'Союзник', enemy: 'Враг', family: 'Семья', friend: 'Друг',
  rival: 'Соперник', mentor: 'Наставник', student: 'Ученик',
  lover: 'Возлюбленный', spouse: 'Супруг', employer: 'Работодатель',
  employee: 'Работник', custom: 'Другое',
};

const REL_COLORS: Record<string, string> = {
  ally: '#4ECDC4', enemy: '#FF6B6B', family: '#BB8FCE',
  friend: '#82E0AA', rival: '#F8C471', mentor: '#45B7D1',
  student: '#85C1E9', lover: '#FF82AB', spouse: '#FF82AB',
  employer: '#96CEB4', employee: '#98D8C8', custom: '#8282FF',
};

const R = 24; // node radius in world space
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 5;

/* ============ component ============ */
export const CharacterGraphPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const navigate = useNavigate();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  // Data — kept in refs so the animation loop doesn't depend on React state
  const nodesRef = useRef<GNode[]>([]);
  const edgesRef = useRef<GEdge[]>([]);

  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Camera (mutable refs + state for UI)
  const camRef = useRef({ zoom: 1, panX: 0, panY: 0 });
  const [zoomDisplay, setZoomDisplay] = useState(100);

  // Interaction refs
  const dragIdRef = useRef<number | null>(null);
  const hoveredIdRef = useRef<number | null>(null);
  const selectedIdRef = useRef<number | null>(null);
  const panningRef = useRef(false);
  const panStartRef = useRef({ mx: 0, my: 0, cx: 0, cy: 0 });

  // For popup
  const [selectedNode, setSelectedNode] = useState<GNode | null>(null);

  /* ---------- helpers ---------- */
  /** screen px → world coords */
  const s2w = useCallback((sx: number, sy: number) => {
    const c = camRef.current;
    return {
      wx: (sx - c.panX) / c.zoom,
      wy: (sy - c.panY) / c.zoom,
    };
  }, []);

  /** CSS-pixel position on canvas from MouseEvent */
  const canvasXY = useCallback((e: React.MouseEvent | MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { sx: e.clientX - rect.left, sy: e.clientY - rect.top };
  }, []);

  const hitTest = useCallback((sx: number, sy: number): GNode | null => {
    const { wx, wy } = s2w(sx, sy);
    const ns = nodesRef.current;
    for (let i = ns.length - 1; i >= 0; i--) {
      const dx = wx - ns[i].x;
      const dy = wy - ns[i].y;
      if (dx * dx + dy * dy <= (R + 4) * (R + 4)) return ns[i];
    }
    return null;
  }, [s2w]);

  /* ---------- fetch data ---------- */
  useEffect(() => {
    Promise.all([
      charactersApi.getAll(pid, { limit: 200 }),
      charactersApi.getRelationships(pid),
    ]).then(([charRes, relRes]) => {
      const chars = charRes.data.data.items || [];
      const rels = relRes.data.data || [];

      // lay out in circle, center at 0,0 in world space
      const radius = Math.max(120, chars.length * 45);
      const ns: GNode[] = chars.map((c: any, i: number) => {
        const a = (2 * Math.PI * i) / Math.max(chars.length, 1);
        return {
          id: c.id, name: c.name, title: c.title || '',
          x: radius * Math.cos(a), y: radius * Math.sin(a),
          vx: 0, vy: 0,
        };
      });

      const es: GEdge[] = rels.map((r: any) => ({
        source: r.sourceCharacterId,
        target: r.targetCharacterId,
        type: r.relationshipType || 'custom',
        description: r.description || '',
      }));

      nodesRef.current = ns;
      edgesRef.current = es;
      setNodeCount(ns.length);
      setEdgeCount(es.length);
      setLoading(false);

      // Fit camera so all nodes visible
      if (ns.length > 0) {
        requestAnimationFrame(() => fitCamera());
      }
    }).catch(() => setLoading(false));
  }, [pid]);

  /* ---------- fit camera ---------- */
  const fitCamera = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ns = nodesRef.current;
    if (ns.length === 0) return;
    const cw = wrap.clientWidth;
    const ch = wrap.clientHeight;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of ns) {
      if (n.x - R < minX) minX = n.x - R;
      if (n.x + R > maxX) maxX = n.x + R;
      if (n.y - R < minY) minY = n.y - R;
      if (n.y + R > maxY) maxY = n.y + R;
    }
    const padding = 80;
    const bw = maxX - minX + padding * 2;
    const bh = maxY - minY + padding * 2;
    const z = Math.min(cw / bw, ch / bh, 2);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    camRef.current = { zoom: z, panX: cw / 2 - cx * z, panY: ch / 2 - cy * z };
    setZoomDisplay(Math.round(z * 100));
  }, []);

  /* ---------- animation loop ---------- */
  useEffect(() => {
    if (loading) return;
    let running = true;

    const loop = () => {
      if (!running) return;
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) { rafRef.current = requestAnimationFrame(loop); return; }

      const cw = wrap.clientWidth;
      const ch = wrap.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      // Resize canvas if needed
      if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
        canvas.width = Math.round(cw * dpr);
        canvas.height = Math.round(ch * dpr);
        canvas.style.width = cw + 'px';
        canvas.style.height = ch + 'px';
      }

      const ctx = canvas.getContext('2d')!;
      const ns = nodesRef.current;
      const es = edgesRef.current;

      // === Physics ===
      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          const dx = ns[j].x - ns[i].x;
          const dy = ns[j].y - ns[i].y;
          const d2 = dx * dx + dy * dy;
          const dist = Math.sqrt(d2) || 1;
          const f = 10000 / d2;
          const fx = (dx / dist) * f;
          const fy = (dy / dist) * f;
          ns[i].vx -= fx; ns[i].vy -= fy;
          ns[j].vx += fx; ns[j].vy += fy;
        }
      }
      for (const e of es) {
        const s = ns.find(n => n.id === e.source);
        const t = ns.find(n => n.id === e.target);
        if (!s || !t) continue;
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = (dist - 200) * 0.005;
        const fx = (dx / dist) * f;
        const fy = (dy / dist) * f;
        s.vx += fx; s.vy += fy;
        t.vx -= fx; t.vy -= fy;
      }
      // center gravity
      for (const n of ns) {
        n.vx -= n.x * 0.0003;
        n.vy -= n.y * 0.0003;
        n.vx *= 0.85;
        n.vy *= 0.85;
        if (n.id !== dragIdRef.current) {
          n.x += n.vx;
          n.y += n.vy;
        }
      }

      // === Draw ===
      const cam = camRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      ctx.save();
      ctx.translate(cam.panX, cam.panY);
      ctx.scale(cam.zoom, cam.zoom);

      // Edges
      for (const e of es) {
        const s = ns.find(n => n.id === e.source);
        const t = ns.find(n => n.id === e.target);
        if (!s || !t) continue;
        const col = REL_COLORS[e.type] || REL_COLORS.custom;

        // Line
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = col + '55';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Arrow
        const ang = Math.atan2(t.y - s.y, t.x - s.x);
        const ad = R + 5;
        const ax = t.x - Math.cos(ang) * ad;
        const ay = t.y - Math.sin(ang) * ad;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax - Math.cos(ang - 0.4) * 10, ay - Math.sin(ang - 0.4) * 10);
        ctx.lineTo(ax - Math.cos(ang + 0.4) * 10, ay - Math.sin(ang + 0.4) * 10);
        ctx.closePath();
        ctx.fillStyle = col + '88';
        ctx.fill();

        // Label
        const label = REL_LABELS[e.type] || e.type;
        const mx = (s.x + t.x) / 2;
        const my = (s.y + t.y) / 2;
        ctx.font = '9px system-ui,sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const tw = ctx.measureText(label).width + 10;
        ctx.fillStyle = 'rgba(10,10,20,0.8)';
        ctx.beginPath();
        ctx.roundRect(mx - tw / 2, my - 9, tw, 18, 4);
        ctx.fill();
        ctx.fillStyle = col;
        ctx.fillText(label, mx, my);
      }

      // Nodes
      const hid = hoveredIdRef.current;
      const sid = selectedIdRef.current;
      for (const n of ns) {
        const hovered = n.id === hid;
        const selected = n.id === sid;
        const nr = hovered || selected ? R + 4 : R;

        // Glow
        if (hovered || selected) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, nr + 8, 0, Math.PI * 2);
          ctx.fillStyle = selected ? 'rgba(130,130,255,0.15)' : 'rgba(130,130,255,0.08)';
          ctx.fill();
        }

        // Circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, nr, 0, Math.PI * 2);
        const g = ctx.createRadialGradient(n.x - nr * 0.3, n.y - nr * 0.3, 0, n.x, n.y, nr);
        g.addColorStop(0, 'rgba(70,70,140,0.95)');
        g.addColorStop(1, 'rgba(30,30,65,0.98)');
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = selected ? '#fff' : hovered ? 'rgba(130,130,255,0.9)' : 'rgba(130,130,255,0.45)';
        ctx.lineWidth = selected ? 2.5 : 1.5;
        ctx.stroke();

        // Letter
        ctx.font = 'bold 15px system-ui,sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.name.charAt(0).toUpperCase(), n.x, n.y);

        // Name
        ctx.font = '11px system-ui,sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textBaseline = 'top';
        ctx.fillText(n.name, n.x, n.y + nr + 6);

        // Title
        if (n.title) {
          ctx.font = 'italic 9px system-ui,sans-serif';
          ctx.fillStyle = 'rgba(201,169,89,0.75)';
          ctx.fillText(n.title, n.x, n.y + nr + 20);
        }
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, [loading]);

  /* ---------- wheel zoom ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cam = camRef.current;
      const oldZ = cam.zoom;
      const d = e.deltaY > 0 ? -0.12 : 0.12;
      const newZ = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, oldZ + d));
      if (newZ === oldZ) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      cam.panX = mx - ((mx - cam.panX) / oldZ) * newZ;
      cam.panY = my - ((my - cam.panY) / oldZ) * newZ;
      cam.zoom = newZ;
      setZoomDisplay(Math.round(newZ * 100));
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [loading]);

  /* ---------- mouse handlers ---------- */
  const onDown = useCallback((e: React.MouseEvent) => {
    const { sx, sy } = canvasXY(e);
    const node = hitTest(sx, sy);
    if (node && e.button === 0) {
      dragIdRef.current = node.id;
      selectedIdRef.current = node.id;
      setSelectedNode({ ...node });
    } else if (e.button === 0) {
      panningRef.current = true;
      const cam = camRef.current;
      panStartRef.current = { mx: e.clientX, my: e.clientY, cx: cam.panX, cy: cam.panY };
      selectedIdRef.current = null;
      setSelectedNode(null);
    }
  }, [canvasXY, hitTest]);

  const onMove = useCallback((e: React.MouseEvent) => {
    const { sx, sy } = canvasXY(e);
    if (dragIdRef.current !== null) {
      const { wx, wy } = s2w(sx, sy);
      const n = nodesRef.current.find(nd => nd.id === dragIdRef.current);
      if (n) { n.x = wx; n.y = wy; n.vx = 0; n.vy = 0; }
    } else if (panningRef.current) {
      const cam = camRef.current;
      cam.panX = panStartRef.current.cx + (e.clientX - panStartRef.current.mx);
      cam.panY = panStartRef.current.cy + (e.clientY - panStartRef.current.my);
    } else {
      const node = hitTest(sx, sy);
      hoveredIdRef.current = node ? node.id : null;
    }
  }, [canvasXY, hitTest, s2w]);

  const onUp = useCallback(() => {
    dragIdRef.current = null;
    panningRef.current = false;
  }, []);

  const onDblClick = useCallback((e: React.MouseEvent) => {
    const { sx, sy } = canvasXY(e);
    const node = hitTest(sx, sy);
    if (node) navigate(`/project/${pid}/characters/${node.id}`);
  }, [canvasXY, hitTest, navigate, pid]);

  /* ---------- toolbar zoom ---------- */
  const zoomBtn = useCallback((delta: number) => {
    const cam = camRef.current;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const oldZ = cam.zoom;
    const newZ = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, oldZ + delta));
    const cx = wrap.clientWidth / 2;
    const cy = wrap.clientHeight / 2;
    cam.panX = cx - ((cx - cam.panX) / oldZ) * newZ;
    cam.panY = cy - ((cy - cam.panY) / oldZ) * newZ;
    cam.zoom = newZ;
    setZoomDisplay(Math.round(newZ * 100));
  }, []);

  /* ---------- render ---------- */
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>Загрузка графа...</Typography>
      </Box>
    );
  }

  const usedTypes = [...new Set(edgesRef.current.map(e => e.type))];

  return (
    <Box sx={{ height: 'calc(100vh - 64px - 48px)', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Box display="flex" alignItems="center" gap={2}>
          <DndButton variant="outlined" startIcon={<ArrowBackIcon />} size="small"
            onClick={() => navigate(`/project/${pid}/characters`)}
            sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
            Назад
          </DndButton>
          <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '1.5rem', color: '#fff' }}>
            Граф связей
          </Typography>
        </Box>
        <Box display="flex" gap={0.5} sx={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 1, p: 0.5 }}>
          <IconButton size="small" onClick={() => zoomBtn(-0.2)} sx={{ color: '#fff' }}><ZoomOutIcon fontSize="small" /></IconButton>
          <Typography sx={{ color: '#fff', fontSize: '0.8rem', lineHeight: '30px', px: 1, minWidth: 45, textAlign: 'center' }}>
            {zoomDisplay}%
          </Typography>
          <IconButton size="small" onClick={() => zoomBtn(0.2)} sx={{ color: '#fff' }}><ZoomInIcon fontSize="small" /></IconButton>
          <IconButton size="small" onClick={fitCamera} sx={{ color: '#fff' }}><CenterFocusStrongIcon fontSize="small" /></IconButton>
        </Box>
      </Box>

      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', mb: 1, display: 'block' }}>
        Перетаскивание узла — переместить · Двойной клик — открыть · Фон — панорамирование · Колёсико — зум
      </Typography>

      {nodeCount === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
          backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', mb: 2 }}>Нет персонажей для отображения</Typography>
          <Button variant="outlined" onClick={() => navigate(`/project/${pid}/characters`)}>К списку</Button>
        </Paper>
      ) : (
        <Box sx={{ flexGrow: 1, position: 'relative' }}>
          <Box ref={wrapRef} sx={{
            position: 'absolute', inset: 0,
            borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: '#0a0a14', overflow: 'hidden',
          }}>
            <canvas ref={canvasRef}
              style={{ display: 'block', cursor: dragIdRef.current ? 'grabbing' : panningRef.current ? 'grabbing' : 'grab' }}
              onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
              onMouseLeave={onUp} onDoubleClick={onDblClick} />
          </Box>

          {/* Selected popup */}
          {selectedNode && (
            <Paper sx={{
              position: 'absolute', bottom: 16, left: 16, p: 2, maxWidth: 260,
              backgroundColor: 'rgba(20,20,35,0.95)', border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)', zIndex: 20,
            }}>
              <Typography sx={{ fontWeight: 700, color: '#fff' }}>{selectedNode.name}</Typography>
              {selectedNode.title && (
                <Typography variant="caption" sx={{ color: 'rgba(201,169,89,0.8)', fontStyle: 'italic', display: 'block' }}>
                  {selectedNode.title}
                </Typography>
              )}
              <Box display="flex" gap={1} mt={1.5}>
                <Button size="small" variant="outlined"
                  onClick={() => navigate(`/project/${pid}/characters/${selectedNode.id}`)}
                  sx={{ borderColor: 'rgba(130,130,255,0.3)', color: 'rgba(130,130,255,0.9)', textTransform: 'none', fontSize: '0.75rem' }}>
                  Открыть
                </Button>
                <Button size="small" onClick={() => { selectedIdRef.current = null; setSelectedNode(null); }}
                  sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'none', fontSize: '0.75rem' }}>
                  Закрыть
                </Button>
              </Box>
            </Paper>
          )}

          {/* Legend */}
          {usedTypes.length > 0 && (
            <Box sx={{
              position: 'absolute', top: 12, right: 12,
              backgroundColor: 'rgba(20,20,35,0.85)', borderRadius: 1.5,
              border: '1px solid rgba(255,255,255,0.08)', p: 1.5,
            }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mb: 0.5 }}>Связи</Typography>
              {usedTypes.map(t => (
                <Box key={t} display="flex" alignItems="center" gap={1} sx={{ mb: 0.3 }}>
                  <Box sx={{ width: 14, height: 3, borderRadius: 1, backgroundColor: REL_COLORS[t] || REL_COLORS.custom }} />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>
                    {REL_LABELS[t] || t}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Stats */}
          <Box sx={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: 1 }}>
            <Chip label={`${nodeCount} персонажей`} size="small" variant="outlined"
              sx={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }} />
            <Chip label={`${edgeCount} связей`} size="small" variant="outlined"
              sx={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }} />
          </Box>
        </Box>
      )}
    </Box>
  );
};