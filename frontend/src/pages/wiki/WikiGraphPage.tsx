import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, IconButton, Chip, useTheme, alpha,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import { useParams, useNavigate } from 'react-router-dom';
import { wikiApi } from '@/api/wiki';
import { notesApi } from '@/api/notes';
import { DndButton } from '@/components/ui/DndButton';
import { GlassCard } from '@/components/ui/GlassCard';

interface GNode {
  id: number;
  name: string;
  tags: string[];
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface GEdge {
  id: number;
  source: number;
  target: number;
  label: string;
}

const TAG_COLORS = [
  '#4ECDC4', '#FF6B6B', '#BB8FCE', '#82E0AA', '#F8C471',
  '#45B7D1', '#FF82AB', '#96CEB4', '#8282FF', '#E8A87C',
];

const R = 26;
const MIN_ZOOM = 0.15;
const MAX_ZOOM = 5;

export const WikiGraphPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const navigate = useNavigate();
  const theme = useTheme();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  const nodesRef = useRef<GNode[]>([]);
  const edgesRef = useRef<GEdge[]>([]);

  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const camRef = useRef({ zoom: 1, panX: 0, panY: 0 });
  const [zoomDisplay, setZoomDisplay] = useState(100);

  const dragIdRef = useRef<number | null>(null);
  const hoveredIdRef = useRef<number | null>(null);
  const selectedIdRef = useRef<number | null>(null);
  const panningRef = useRef(false);
  const panStartRef = useRef({ mx: 0, my: 0, cx: 0, cy: 0 });

  const [selectedNode, setSelectedNode] = useState<GNode | null>(null);
  const tagColorMapRef = useRef<Record<string, string>>({});

  const s2w = useCallback((sx: number, sy: number) => {
    const c = camRef.current;
    return { wx: (sx - c.panX) / c.zoom, wy: (sy - c.panY) / c.zoom };
  }, []);

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

  useEffect(() => {
    Promise.all([
      notesApi.getAll(pid, { noteType: 'wiki', limit: 500 }),
      wikiApi.getLinks(pid),
    ]).then(([notesRes, linksRes]) => {
      const wikiNotes = notesRes.data.data.items || [];
      const links = linksRes.data.data || [];

      // Assign colors to tags
      const allTagNames = new Set<string>();
      wikiNotes.forEach((n: any) => (n.tags || []).forEach((t: any) => allTagNames.add(t.name)));
      let ci = 0;
      allTagNames.forEach(name => {
        tagColorMapRef.current[name] = TAG_COLORS[ci % TAG_COLORS.length];
        ci++;
      });

      const radius = Math.max(150, wikiNotes.length * 50);
      const ns: GNode[] = wikiNotes.map((n: any, i: number) => {
        const a = (2 * Math.PI * i) / Math.max(wikiNotes.length, 1);
        return {
          id: n.id, name: n.title,
          tags: (n.tags || []).map((t: any) => t.name),
          x: radius * Math.cos(a), y: radius * Math.sin(a),
          vx: 0, vy: 0,
        };
      });

      const es: GEdge[] = links.map((l: any) => ({
        id: l.id, source: l.sourceNoteId, target: l.targetNoteId, label: l.label || '',
      }));

      nodesRef.current = ns;
      edgesRef.current = es;
      setNodeCount(ns.length);
      setEdgeCount(es.length);
      setLoading(false);

      if (ns.length > 0) requestAnimationFrame(() => fitCamera());
    }).catch(() => setLoading(false));
  }, [pid]);

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
    const padding = 100;
    const bw = maxX - minX + padding * 2;
    const bh = maxY - minY + padding * 2;
    const z = Math.min(cw / bw, ch / bh, 2);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    camRef.current = { zoom: z, panX: cw / 2 - cx * z, panY: ch / 2 - cy * z };
    setZoomDisplay(Math.round(z * 100));
  }, []);

  // Animation loop
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

      if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
        canvas.width = Math.round(cw * dpr);
        canvas.height = Math.round(ch * dpr);
        canvas.style.width = cw + 'px';
        canvas.style.height = ch + 'px';
      }

      const ctx = canvas.getContext('2d')!;
      const ns = nodesRef.current;
      const es = edgesRef.current;

      // Physics
      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          const dx = ns[j].x - ns[i].x;
          const dy = ns[j].y - ns[i].y;
          const d2 = dx * dx + dy * dy;
          const dist = Math.sqrt(d2) || 1;
          const f = 12000 / d2;
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
        const f = (dist - 220) * 0.004;
        const fx = (dx / dist) * f;
        const fy = (dy / dist) * f;
        s.vx += fx; s.vy += fy;
        t.vx -= fx; t.vy -= fy;
      }
      for (const n of ns) {
        n.vx -= n.x * 0.0002;
        n.vy -= n.y * 0.0002;
        n.vx *= 0.85;
        n.vy *= 0.85;
        if (n.id !== dragIdRef.current) {
          n.x += n.vx;
          n.y += n.vy;
        }
      }

      // Draw
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

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = 'rgba(78,205,196,0.25)';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (e.label) {
          const mx = (s.x + t.x) / 2;
          const my = (s.y + t.y) / 2;
          ctx.font = '9px system-ui,sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const tw = ctx.measureText(e.label).width + 10;
          ctx.fillStyle = 'rgba(10,10,20,0.85)';
          ctx.beginPath();
          ctx.roundRect(mx - tw / 2, my - 9, tw, 18, 4);
          ctx.fill();
          ctx.fillStyle = 'rgba(78,205,196,0.8)';
          ctx.fillText(e.label, mx, my);
        }
      }

      // Nodes
      const hid = hoveredIdRef.current;
      const sid = selectedIdRef.current;
      for (const n of ns) {
        const hovered = n.id === hid;
        const selected = n.id === sid;
        const nr = hovered || selected ? R + 4 : R;

        // Get node color from first tag
        const nodeColor = n.tags.length > 0
          ? tagColorMapRef.current[n.tags[0]] || '#8282FF'
          : '#8282FF';

        if (hovered || selected) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, nr + 10, 0, Math.PI * 2);
          ctx.fillStyle = selected ? nodeColor + '25' : nodeColor + '15';
          ctx.fill();
        }

        // Circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, nr, 0, Math.PI * 2);
        const g = ctx.createRadialGradient(n.x - nr * 0.3, n.y - nr * 0.3, 0, n.x, n.y, nr);
        g.addColorStop(0, 'rgba(50,50,100,0.95)');
        g.addColorStop(1, 'rgba(25,25,55,0.98)');
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = selected ? '#fff' : hovered ? nodeColor : nodeColor + '66';
        ctx.lineWidth = selected ? 2.5 : 1.5;
        ctx.stroke();

        // Icon (📄)
        ctx.font = '16px system-ui,sans-serif';
        ctx.fillStyle = nodeColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📄', n.x, n.y);

        // Name
        ctx.font = 'bold 11px system-ui,sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textBaseline = 'top';
        const nameText = n.name.length > 20 ? n.name.substring(0, 18) + '…' : n.name;
        ctx.fillText(nameText, n.x, n.y + nr + 6);

        // Tags below
        if (n.tags.length > 0) {
          ctx.font = '8px system-ui,sans-serif';
          const tagStr = n.tags.slice(0, 2).join(', ');
          ctx.fillStyle = nodeColor + '99';
          ctx.fillText(tagStr, n.x, n.y + nr + 20);
        }
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, [loading]);

  // Wheel zoom
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

  const onUp = useCallback(() => { dragIdRef.current = null; panningRef.current = false; }, []);

  const onDblClick = useCallback((e: React.MouseEvent) => {
    const { sx, sy } = canvasXY(e);
    const node = hitTest(sx, sy);
    if (node) navigate(`/project/${pid}/notes/${node.id}`);
  }, [canvasXY, hitTest, navigate, pid]);

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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>Загрузка графа вики...</Typography>
      </Box>
    );
  }

  const allTagsUsed = [...new Set(nodesRef.current.flatMap(n => n.tags))];

  return (
    <Box sx={{ height: 'calc(100vh - 64px - 48px)', display: 'flex', flexDirection: 'column' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Box display="flex" alignItems="center" gap={2}>
          <DndButton variant="outlined" startIcon={<ArrowBackIcon />} size="small"
            onClick={() => navigate(`/project/${pid}/wiki`)}
            sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
            Назад
          </DndButton>
          <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '1.5rem', color: '#fff' }}>
            Граф вики
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
        Перетаскивание — переместить · Двойной клик — открыть статью · Колёсико — зум
      </Typography>

      {nodeCount === 0 ? (
        <GlassCard sx={{ p: 6, textAlign: 'center', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <Typography sx={{ color: 'text.secondary', mb: 2 }}>Нет вики-статей</Typography>
          <Button variant="outlined" onClick={() => navigate(`/project/${pid}/wiki`)}>К вики</Button>
        </GlassCard>
      ) : (
        <Box sx={{ flexGrow: 1, position: 'relative' }}>
          <Box ref={wrapRef} sx={{ position: 'absolute', inset: 0, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.default, overflow: 'hidden' }}>
            <canvas ref={canvasRef}
              style={{ display: 'block', cursor: dragIdRef.current ? 'grabbing' : panningRef.current ? 'grabbing' : 'grab' }}
              onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp} onDoubleClick={onDblClick} />
          </Box>

          {selectedNode && (
            <GlassCard sx={{ position: 'absolute', bottom: 16, left: 16, p: 2, maxWidth: 280, zIndex: 20 }}>
              <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{selectedNode.name}</Typography>
              {selectedNode.tags.length > 0 && (
                <Box display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
                  {selectedNode.tags.map(t => (
                    <Chip key={t} label={t} size="small"
                      sx={{ height: 18, fontSize: '0.6rem', backgroundColor: tagColorMapRef.current[t] || '#8282FF', color: '#fff' }} />
                  ))}
                </Box>
              )}
              <Box display="flex" gap={1} mt={1.5}>
                <Button size="small" variant="outlined"
                  onClick={() => navigate(`/project/${pid}/notes/${selectedNode.id}`)}
                  sx={{ borderColor: alpha(theme.palette.primary.main, 0.3), color: theme.palette.primary.main, textTransform: 'none', fontSize: '0.75rem' }}>
                  Открыть
                </Button>
                <Button size="small" onClick={() => { selectedIdRef.current = null; setSelectedNode(null); }}
                  sx={{ color: 'text.secondary', textTransform: 'none', fontSize: '0.75rem' }}>
                  Закрыть
                </Button>
              </Box>
            </GlassCard>
          )}

          {allTagsUsed.length > 0 && (
            <GlassCard sx={{ position: 'absolute', top: 12, right: 12, p: 1.5, maxHeight: '40vh', overflow: 'auto' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>Категории</Typography>
              {allTagsUsed.map(t => (
                <Box key={t} display="flex" alignItems="center" gap={1} sx={{ mb: 0.3 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: tagColorMapRef.current[t] || '#8282FF' }} />
                  <Typography variant="caption" sx={{ color: 'text.primary', fontSize: '0.7rem' }}>{t}</Typography>
                </Box>
              ))}
            </GlassCard>
          )}

          <Box sx={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: 1 }}>
            <Chip label={`${nodeCount} статей`} size="small" variant="outlined"
              sx={{ borderColor: theme.palette.divider, color: 'text.secondary', fontSize: '0.7rem' }} />
            <Chip label={`${edgeCount} связей`} size="small" variant="outlined"
              sx={{ borderColor: theme.palette.divider, color: 'text.secondary', fontSize: '0.7rem' }} />
          </Box>
        </Box>
      )}
    </Box>
  );
};