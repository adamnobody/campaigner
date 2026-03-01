import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useParams, useNavigate } from 'react-router-dom';
import { charactersApi } from '@/api/axiosClient';
import { DndButton } from '@/components/ui/DndButton';

interface Node {
  id: number;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Edge {
  source: number;
  target: number;
  type: string;
  description?: string;
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  ally: 'Союзник',
  enemy: 'Враг',
  family: 'Семья',
  friend: 'Друг',
  rival: 'Соперник',
  mentor: 'Наставник',
  student: 'Ученик',
  lover: 'Возлюбленный',
  spouse: 'Супруг',
  employer: 'Работодатель',
  employee: 'Работник',
  custom: 'Другое',
};

export const CharacterGraphPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragNode, setDragNode] = useState<number | null>(null);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      charactersApi.getAll(pid, { limit: 200 }),
      charactersApi.getRelationships(pid),
    ]).then(([charRes, relRes]) => {
      const chars = charRes.data.data.items || [];
      const rels = relRes.data.data || [];

      // Create nodes in circle layout
      const centerX = 400;
      const centerY = 300;
      const radius = Math.min(250, chars.length * 40);

      const newNodes: Node[] = chars.map((c: any, i: number) => {
        const angle = (2 * Math.PI * i) / chars.length;
        return {
          id: c.id,
          name: c.name,
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          vx: 0,
          vy: 0,
        };
      });

      const newEdges: Edge[] = rels.map((r: any) => ({
        source: r.sourceCharacterId,
        target: r.targetCharacterId,
        type: RELATIONSHIP_LABELS[r.relationshipType] || r.relationshipType || '',
        description: r.description,
      }));

      setNodes(newNodes);
      setEdges(newEdges);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [pid]);

  // Simple force-directed simulation
  useEffect(() => {
    if (nodes.length === 0) return;

    const simulate = () => {
      setNodes(prevNodes => {
        const updated = prevNodes.map(n => ({ ...n }));

        // Repulsion between nodes
        for (let i = 0; i < updated.length; i++) {
          for (let j = i + 1; j < updated.length; j++) {
            const dx = updated[j].x - updated[i].x;
            const dy = updated[j].y - updated[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 5000 / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            updated[i].vx -= fx;
            updated[i].vy -= fy;
            updated[j].vx += fx;
            updated[j].vy += fy;
          }
        }

        // Attraction along edges
        edges.forEach(edge => {
          const s = updated.find(n => n.id === edge.source);
          const t = updated.find(n => n.id === edge.target);
          if (!s || !t) return;
          const dx = t.x - s.x;
          const dy = t.y - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 150) * 0.01;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          s.vx += fx;
          s.vy += fy;
          t.vx -= fx;
          t.vy -= fy;
        });

        // Center gravity
        updated.forEach(n => {
          n.vx += (400 - n.x) * 0.001;
          n.vy += (300 - n.y) * 0.001;
          n.vx *= 0.9;
          n.vy *= 0.9;
          if (n.id !== dragNode) {
            n.x += n.vx;
            n.y += n.vy;
          }
          n.x = Math.max(50, Math.min(750, n.x));
          n.y = Math.max(50, Math.min(550, n.y));
        });

        return updated;
      });

      animRef.current = requestAnimationFrame(simulate);
    };

    animRef.current = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(animRef.current);
  }, [edges, dragNode, nodes.length]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 800, 600);

    // Draw edges
    edges.forEach(edge => {
      const s = nodes.find(n => n.id === edge.source);
      const t = nodes.find(n => n.id === edge.target);
      if (!s || !t) return;

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);
      ctx.strokeStyle = 'rgba(130,130,255,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Edge label
      if (edge.type) {
        const mx = (s.x + t.x) / 2;
        const my = (s.y + t.y) / 2;
        ctx.font = '10px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.textAlign = 'center';
        ctx.fillText(edge.type, mx, my - 5);
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const isHovered = hoveredNode === node.id;
      const radius = isHovered ? 25 : 20;

      // Circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? 'rgba(130,130,255,0.4)' : 'rgba(130,130,255,0.2)';
      ctx.fill();
      ctx.strokeStyle = isHovered ? 'rgba(130,130,255,0.8)' : 'rgba(130,130,255,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Name
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(node.name, node.x, node.y + radius + 15);
    });
  }, [nodes, edges, hoveredNode]);

  // Mouse interactions
  const getNodeAt = (x: number, y: number): Node | null => {
    for (const node of nodes) {
      const dx = x - node.x;
      const dy = y - node.y;
      if (dx * dx + dy * dy < 625) return node;
    }
    return null;
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const node = getNodeAt(x, y);
    if (node) setDragNode(node.id);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (dragNode !== null) {
      setNodes(prev => prev.map(n =>
        n.id === dragNode ? { ...n, x, y, vx: 0, vy: 0 } : n
      ));
    } else {
      const node = getNodeAt(x, y);
      setHoveredNode(node?.id || null);
    }
  };

  const handleCanvasMouseUp = () => {
    setDragNode(null);
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const node = getNodeAt(x, y);
    if (node) {
      navigate(`/project/${pid}/characters/${node.id}`);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>Загрузка графа...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <DndButton
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/project/${pid}/characters`)}
            sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
          >
            Назад
          </DndButton>
          <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '1.5rem', color: '#fff' }}>
            Граф связей
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)' }}>
          Перетаскивайте узлы · Двойной клик — открыть персонажа
        </Typography>
      </Box>

      {nodes.length === 0 ? (
        <Paper sx={{
          p: 6, textAlign: 'center',
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', mb: 2 }}>
            Нет персонажей или связей для отображения
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate(`/project/${pid}/characters`)}
          >
            К списку персонажей
          </Button>
        </Paper>
      ) : (
        <Paper sx={{
          backgroundColor: 'rgba(10,10,20,0.9)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            style={{
              width: '100%',
              height: '600px',
              cursor: dragNode !== null ? 'grabbing' : hoveredNode !== null ? 'pointer' : 'default',
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onDoubleClick={handleCanvasDoubleClick}
          />
        </Paper>
      )}

      {/* Legend */}
      {edges.length > 0 && (
        <Box display="flex" gap={2} mt={2} flexWrap="wrap">
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
            Узлов: {nodes.length}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
            Связей: {edges.length}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
            Типы: {[...new Set(edges.map(e => e.type).filter(Boolean))].join(', ') || '—'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};