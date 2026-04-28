import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Tooltip, Typography, useTheme } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '@/components/ui/EmptyState';
import HubIcon from '@mui/icons-material/Hub';
import { buildProjectGraph } from '@/pages/graph/data/buildProjectGraph';
import { ProjectGraphToolbar } from '@/pages/graph/components/ProjectGraphToolbar';
import { ProjectGraphFilters } from '@/pages/graph/components/ProjectGraphFilters';
import { ProjectGraphLegend } from '@/pages/graph/components/ProjectGraphLegend';
import { ProjectGraphNodePanel } from '@/pages/graph/components/ProjectGraphNodePanel';
import {
  DEFAULT_PROJECT_GRAPH_VIEW_SETTINGS,
  GRAPH_EDGE_KIND_LABELS,
  GRAPH_EDGE_KIND_COLORS,
  GRAPH_EDGE_KINDS,
  GRAPH_NODE_TYPE_COLORS,
  GRAPH_NODE_TYPES,
  PROJECT_GRAPH_VIEW_SETTINGS_KEY,
  getNodeRoute,
  type GraphNodeType,
  type GraphEdge,
  type GraphEdgeKind,
  type GraphNode,
  type ProjectGraphViewSettings,
  type ProjectGraphData,
} from '@/pages/graph/types';

type SimNode = GraphNode & { x: number; y: number; vx: number; vy: number };

const NODE_RADIUS_MAP = {
  small: 13,
  medium: 18,
  large: 24,
} as const;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const EDGE_OPACITY_MAP = {
  low: 0.24,
  medium: 0.42,
  high: 0.68,
} as const;
const EDGE_THICKNESS_MAP = {
  thin: 1.2,
  normal: 1.9,
  thick: 2.8,
} as const;
const LAYOUT_PRESET = {
  compact: { repel: 5400, linkDistance: 125, gravity: 0.00026, damping: 0.84, spring: 0.009 },
  balanced: { repel: 7000, linkDistance: 170, gravity: 0.00016, damping: 0.86, spring: 0.006 },
  loose: { repel: 9200, linkDistance: 220, gravity: 0.0001, damping: 0.88, spring: 0.0042 },
} as const;

export const ProjectGraphPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = Number.parseInt(projectId || '0', 10);
  const navigate = useNavigate();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState<ProjectGraphData>({ nodes: [], edges: [] });
  const [search, setSearch] = useState('');
  const [showIsolated, setShowIsolated] = useState(false);
  const [nodeLimit, setNodeLimit] = useState(300);
  const [enabledNodeTypes, setEnabledNodeTypes] = useState<Set<GraphNodeType>>(new Set(GRAPH_NODE_TYPES));
  const [enabledEdgeKinds, setEnabledEdgeKinds] = useState<Set<GraphEdgeKind>>(new Set(GRAPH_EDGE_KINDS));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [layoutPaused, setLayoutPaused] = useState(false);
  const [canvasCursor, setCanvasCursor] = useState<'grab' | 'grabbing' | 'pointer'>('grab');
  const [relayoutSeed, setRelayoutSeed] = useState(0);
  const [viewSettings, setViewSettings] = useState<ProjectGraphViewSettings>(() => {
    try {
      const raw = localStorage.getItem(PROJECT_GRAPH_VIEW_SETTINGS_KEY);
      if (!raw) return DEFAULT_PROJECT_GRAPH_VIEW_SETTINGS;
      const parsed = JSON.parse(raw) as Partial<ProjectGraphViewSettings>;
      return { ...DEFAULT_PROJECT_GRAPH_VIEW_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_PROJECT_GRAPH_VIEW_SETTINGS;
    }
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const nodesRef = useRef<SimNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const didFitRef = useRef(false);

  const camRef = useRef({ zoom: 1, panX: 0, panY: 0 });
  const dragNodeIdRef = useRef<string | null>(null);
  const panningRef = useRef(false);
  const panStartRef = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const justPannedRef = useRef(false);

  useEffect(() => {
    localStorage.setItem(PROJECT_GRAPH_VIEW_SETTINGS_KEY, JSON.stringify(viewSettings));
  }, [viewSettings]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    buildProjectGraph(pid)
      .then((data) => {
        if (!active) return;
        setGraphData(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [pid]);

  const filteredGraph = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase();

    const nodesByFilter = graphData.nodes.filter((node) => {
      if (!enabledNodeTypes.has(node.type)) return false;
      if (!lowerSearch) return true;
      return node.label.toLowerCase().includes(lowerSearch);
    });

    const sorted = [...nodesByFilter].sort((a, b) => (b.degree || 0) - (a.degree || 0));
    const limited = sorted.slice(0, Math.max(50, nodeLimit));
    const nodeIdSet = new Set(limited.map((node) => node.id));

    const edges = graphData.edges.filter(
      (edge) => enabledEdgeKinds.has(edge.kind) && nodeIdSet.has(edge.source) && nodeIdSet.has(edge.target)
    );

    const degreeMap = new Map<string, number>();
    edges.forEach((edge) => {
      degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1);
      degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1);
    });

    let nodes = limited.map((node) => ({ ...node, degree: degreeMap.get(node.id) || 0 }));
    if (!showIsolated) {
      const connected = new Set(edges.flatMap((edge) => [edge.source, edge.target]));
      nodes = nodes.filter((node) => connected.has(node.id));
    }
    if (viewSettings.focusSelectedNeighborhood && selectedNodeId) {
      const neighbors = new Set<string>([selectedNodeId]);
      edges.forEach((edge) => {
        if (edge.source === selectedNodeId) neighbors.add(edge.target);
        if (edge.target === selectedNodeId) neighbors.add(edge.source);
      });
      nodes = nodes.filter((node) => neighbors.has(node.id));
    }
    const finalNodeSet = new Set(nodes.map((node) => node.id));
    const finalEdges = edges.filter((edge) => {
      if (!finalNodeSet.has(edge.source) || !finalNodeSet.has(edge.target)) return false;
      if (!viewSettings.focusSelectedNeighborhood || !selectedNodeId) return true;
      if (edge.source === selectedNodeId || edge.target === selectedNodeId) return true;
      return finalNodeSet.has(edge.source) && finalNodeSet.has(edge.target);
    });
    return { nodes, edges: finalEdges };
  }, [
    enabledEdgeKinds,
    enabledNodeTypes,
    graphData.edges,
    graphData.nodes,
    nodeLimit,
    search,
    selectedNodeId,
    showIsolated,
    viewSettings.focusSelectedNeighborhood,
  ]);

  useEffect(() => {
    const radius = Math.max(140, filteredGraph.nodes.length * 18);
    nodesRef.current = filteredGraph.nodes.map((node, index) => {
      const angle = (index / Math.max(filteredGraph.nodes.length, 1)) * Math.PI * 2;
      return {
        ...node,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      };
    });
    edgesRef.current = filteredGraph.edges;
    didFitRef.current = false;
  }, [filteredGraph, relayoutSeed]);

  const getNodeRadius = useCallback(() => NODE_RADIUS_MAP[viewSettings.nodeSize], [viewSettings.nodeSize]);

  const worldToScreen = useCallback((wx: number, wy: number) => ({
    x: wx * camRef.current.zoom + camRef.current.panX,
    y: wy * camRef.current.zoom + camRef.current.panY,
  }), []);

  const screenToWorld = useCallback((sx: number, sy: number) => ({
    x: (sx - camRef.current.panX) / camRef.current.zoom,
    y: (sy - camRef.current.panY) / camRef.current.zoom,
  }), []);

  const getMousePositionOnCanvas = useCallback((event: React.MouseEvent | MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { sx: 0, sy: 0 };
    return { sx: event.clientX - rect.left, sy: event.clientY - rect.top };
  }, []);

  const centerCameraDefault = useCallback(() => {
    const wrap = wrapRef.current;
    const nodes = nodesRef.current;
    if (!wrap || nodes.length === 0) return;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    const nodeRadius = getNodeRadius();
    nodes.forEach((node) => {
      minX = Math.min(minX, node.x - nodeRadius);
      maxX = Math.max(maxX, node.x + nodeRadius);
      minY = Math.min(minY, node.y - nodeRadius);
      maxY = Math.max(maxY, node.y + nodeRadius);
    });
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    camRef.current = {
      zoom: 1,
      panX: wrap.clientWidth / 2 - cx,
      panY: wrap.clientHeight / 2 - cy,
    };
    setZoomPercent(100);
  }, [getNodeRadius]);

  const fitCamera = useCallback(() => {
    const wrap = wrapRef.current;
    const nodes = nodesRef.current;
    if (!wrap || nodes.length === 0) return;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    nodes.forEach((node) => {
      const nodeRadius = getNodeRadius();
      minX = Math.min(minX, node.x - nodeRadius);
      maxX = Math.max(maxX, node.x + nodeRadius);
      minY = Math.min(minY, node.y - nodeRadius);
      maxY = Math.max(maxY, node.y + nodeRadius);
    });
    if (nodes.length === 1) {
      const node = nodes[0];
      camRef.current = {
        zoom: 1,
        panX: wrap.clientWidth / 2 - node.x,
        panY: wrap.clientHeight / 2 - node.y,
      };
      setZoomPercent(100);
      return;
    }
    const padding = 64;
    const width = Math.max(maxX - minX + padding * 2, 1);
    const height = Math.max(maxY - minY + padding * 2, 1);
    const zoom = Math.min(wrap.clientWidth / width, wrap.clientHeight / height, MAX_ZOOM);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    camRef.current = {
      zoom,
      panX: wrap.clientWidth / 2 - cx * zoom,
      panY: wrap.clientHeight / 2 - cy * zoom,
    };
    setZoomPercent(Math.round(zoom * 100));
  }, [getNodeRadius]);

  const resetCameraView = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    camRef.current = {
      zoom: 1,
      panX: wrap.clientWidth / 2,
      panY: wrap.clientHeight / 2,
    };
    setZoomPercent(100);
  }, []);

  const applyZoom = useCallback((targetZoom: number, anchorX: number, anchorY: number) => {
    const oldZoom = camRef.current.zoom;
    const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetZoom));
    if (Math.abs(nextZoom - oldZoom) < 0.0001) return;
    camRef.current.panX = anchorX - ((anchorX - camRef.current.panX) / oldZoom) * nextZoom;
    camRef.current.panY = anchorY - ((anchorY - camRef.current.panY) / oldZoom) * nextZoom;
    camRef.current.zoom = nextZoom;
    setZoomPercent(Math.round(nextZoom * 100));
  }, []);

  const handleZoomIn = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    applyZoom(camRef.current.zoom + 0.12, wrap.clientWidth / 2, wrap.clientHeight / 2);
  }, [applyZoom]);

  const handleZoomOut = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    applyZoom(camRef.current.zoom - 0.12, wrap.clientWidth / 2, wrap.clientHeight / 2);
  }, [applyZoom]);

  const handleRelayout = useCallback(() => {
    setRelayoutSeed((seed) => seed + 1);
    setLayoutPaused(false);
  }, []);

  const updateViewSettings = useCallback((next: Partial<ProjectGraphViewSettings>) => {
    setViewSettings((prev) => ({ ...prev, ...next }));
  }, []);

  useEffect(() => {
    if (loading || filteredGraph.nodes.length === 0) return;
    let running = true;
    const loop = () => {
      if (!running) return;
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const cw = wrap.clientWidth;
      const ch = wrap.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
        canvas.width = Math.round(cw * dpr);
        canvas.height = Math.round(ch * dpr);
        canvas.style.width = `${cw}px`;
        canvas.style.height = `${ch}px`;
      }
      if (!didFitRef.current) {
        centerCameraDefault();
        didFitRef.current = true;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const nodeRadius = getNodeRadius();
      const layout = LAYOUT_PRESET[viewSettings.layoutIntensity];

      if (!layoutPaused) {
        for (let i = 0; i < nodes.length; i += 1) {
          for (let j = i + 1; j < nodes.length; j += 1) {
            const dx = nodes[j].x - nodes[i].x;
            const dy = nodes[j].y - nodes[i].y;
            const d2 = dx * dx + dy * dy || 1;
            const dist = Math.sqrt(d2) || 1;
            const force = layout.repel / d2;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            nodes[i].vx -= fx;
            nodes[i].vy -= fy;
            nodes[j].vx += fx;
            nodes[j].vy += fy;
          }
        }

        edges.forEach((edge) => {
          const source = nodes.find((node) => node.id === edge.source);
          const target = nodes.find((node) => node.id === edge.target);
          if (!source || !target) return;
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - layout.linkDistance) * layout.spring;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          source.vx += fx;
          source.vy += fy;
          target.vx -= fx;
          target.vy -= fy;
        });

        nodes.forEach((node) => {
          node.vx -= node.x * layout.gravity;
          node.vy -= node.y * layout.gravity;
          node.vx *= layout.damping;
          node.vy *= layout.damping;
          if (node.id !== dragNodeIdRef.current) {
            node.x += node.vx;
            node.y += node.vy;
          }
        });
      }

      const camera = camRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      ctx.save();
      ctx.translate(camera.panX, camera.panY);
      ctx.scale(camera.zoom, camera.zoom);

      const selectedNeighborIds = new Set<string>();
      if (selectedNodeId) {
        edges.forEach((edge) => {
          if (edge.source === selectedNodeId) selectedNeighborIds.add(edge.target);
          if (edge.target === selectedNodeId) selectedNeighborIds.add(edge.source);
        });
      }

      edges.forEach((edge) => {
        const source = nodes.find((node) => node.id === edge.source);
        const target = nodes.find((node) => node.id === edge.target);
        if (!source || !target) return;
        const connectedToSelected =
          !selectedNodeId || edge.source === selectedNodeId || edge.target === selectedNodeId;
        const alphaMultiplier = connectedToSelected ? 1 : 0.22;
        const opacity = EDGE_OPACITY_MAP[viewSettings.edgeOpacity] * alphaMultiplier;
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = `${GRAPH_EDGE_KIND_COLORS[edge.kind]}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
        const baseWidth = EDGE_THICKNESS_MAP[viewSettings.edgeThickness];
        ctx.lineWidth = edge.kind === 'relationship' ? baseWidth + 0.4 : baseWidth;
        if (edge.kind === 'wiki-link' || edge.kind === 'note-link') ctx.setLineDash([4, 4]);
        else ctx.setLineDash([]);
        ctx.stroke();
        ctx.setLineDash([]);

        if (viewSettings.edgeLabels === 'on-hover' && (edge.source === hoveredNodeId || edge.target === hoveredNodeId || edge.source === selectedNodeId || edge.target === selectedNodeId)) {
          const edgeLabel = edge.label || GRAPH_EDGE_KIND_LABELS[edge.kind];
          const mx = (source.x + target.x) / 2;
          const my = (source.y + target.y) / 2;
          ctx.font = '10px system-ui,sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const tw = ctx.measureText(edgeLabel).width + 10;
          ctx.fillStyle = 'rgba(8, 10, 18, 0.86)';
          ctx.beginPath();
          ctx.roundRect(mx - tw / 2, my - 8, tw, 16, 4);
          ctx.fill();
          ctx.fillStyle = '#f3f5ff';
          ctx.fillText(edgeLabel, mx, my);
        }
      });

      const hoveredNode = nodes.find((node) => node.id === hoveredNodeId);
      const selectedNode = nodes.find((node) => node.id === selectedNodeId);

      nodes.forEach((node) => {
        const relatedToSelected =
          !selectedNodeId || node.id === selectedNodeId || selectedNeighborIds.has(node.id);
        const dim = relatedToSelected ? 1 : 0.32;
        const radius = node.id === selectedNodeId ? nodeRadius + 6 : selectedNeighborIds.has(node.id) ? nodeRadius + 2 : nodeRadius;
        if (node.id === hoveredNodeId || node.id === selectedNodeId || selectedNeighborIds.has(node.id)) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + (node.id === selectedNodeId ? 10 : 7), 0, Math.PI * 2);
          ctx.fillStyle = `${GRAPH_NODE_TYPE_COLORS[node.type]}${node.id === selectedNodeId ? '40' : '2f'}`;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        const fillAlphaHex = Math.round(255 * dim).toString(16).padStart(2, '0');
        ctx.fillStyle = `${GRAPH_NODE_TYPE_COLORS[node.type]}${fillAlphaHex}`;
        ctx.fill();
        ctx.strokeStyle = node.id === selectedNodeId ? '#ffffff' : 'rgba(12,18,30,0.7)';
        ctx.lineWidth = node.id === selectedNodeId ? 2.4 : 1.2;
        ctx.stroke();
        const shouldDrawNodeLabel =
          viewSettings.nodeLabels === 'always'
          || (viewSettings.nodeLabels === 'on-hover' && (node.id === hoveredNodeId || node.id === selectedNodeId));
        if (shouldDrawNodeLabel) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px system-ui,sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const short = node.label.length > 16 ? `${node.label.slice(0, 14)}…` : node.label;
          ctx.fillText(short, node.x, node.y + radius + 11);
        }
      });

      if (hoveredNode && viewSettings.nodeLabels !== 'off') {
        ctx.font = '12px system-ui,sans-serif';
        const textWidth = ctx.measureText(hoveredNode.label).width + 18;
        const x = hoveredNode.x - textWidth / 2;
        const y = hoveredNode.y - nodeRadius - 28;
        ctx.fillStyle = 'rgba(10, 12, 22, 0.9)';
        ctx.beginPath();
        ctx.roundRect(x, y, textWidth, 22, 6);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText(hoveredNode.label, hoveredNode.x, y + 11);
      }

      if (selectedNode) {
        ctx.beginPath();
        ctx.arc(selectedNode.x, selectedNode.y, nodeRadius + 12, 0, Math.PI * 2);
        ctx.strokeStyle = `${GRAPH_NODE_TYPE_COLORS[selectedNode.type]}99`;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [
    filteredGraph.nodes.length,
    centerCameraDefault,
    fitCamera,
    getNodeRadius,
    hoveredNodeId,
    layoutPaused,
    loading,
    selectedNodeId,
    viewSettings.edgeLabels,
    viewSettings.edgeOpacity,
    viewSettings.edgeThickness,
    viewSettings.layoutIntensity,
    viewSettings.nodeLabels,
  ]);

  useEffect(() => {
    if (loading) return;
    const canvasHost = wrapRef.current;
    if (!canvasHost) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = canvasHost.getBoundingClientRect();
      const mx = event.clientX - rect.left;
      const my = event.clientY - rect.top;
      const delta = event.deltaY > 0 ? -0.11 : 0.11;
      applyZoom(camRef.current.zoom + delta, mx, my);
    };
    canvasHost.addEventListener('wheel', onWheel, { passive: false });
    return () => canvasHost.removeEventListener('wheel', onWheel);
  }, [applyZoom, loading, filteredGraph.nodes.length]);

  const hitNode = (sx: number, sy: number): SimNode | null => {
    const { x, y } = screenToWorld(sx, sy);
    const nodeRadius = getNodeRadius();
    for (let idx = nodesRef.current.length - 1; idx >= 0; idx -= 1) {
      const node = nodesRef.current[idx];
      const dx = x - node.x;
      const dy = y - node.y;
      if (dx * dx + dy * dy <= (nodeRadius + 6) * (nodeRadius + 6)) return node;
    }
    return null;
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    const { sx, sy } = getMousePositionOnCanvas(event);
    const hit = hitNode(sx, sy);
    if (hit && event.button === 0) {
      dragNodeIdRef.current = hit.id;
      setSelectedNodeId(hit.id);
      setCanvasCursor('grabbing');
      return;
    }
    if (event.button === 0) {
      panningRef.current = true;
      justPannedRef.current = false;
      panStartRef.current = { mx: event.clientX, my: event.clientY, px: camRef.current.panX, py: camRef.current.panY };
      setCanvasCursor('grabbing');
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    const { sx, sy } = getMousePositionOnCanvas(event);
    if (dragNodeIdRef.current) {
      const dragged = nodesRef.current.find((node) => node.id === dragNodeIdRef.current);
      if (!dragged) return;
      const world = screenToWorld(sx, sy);
      dragged.x = world.x;
      dragged.y = world.y;
      dragged.vx = 0;
      dragged.vy = 0;
      setCanvasCursor('grabbing');
      return;
    }
    if (panningRef.current) {
      camRef.current.panX = panStartRef.current.px + (event.clientX - panStartRef.current.mx);
      camRef.current.panY = panStartRef.current.py + (event.clientY - panStartRef.current.my);
      if (Math.abs(event.clientX - panStartRef.current.mx) > 2 || Math.abs(event.clientY - panStartRef.current.my) > 2) {
        justPannedRef.current = true;
      }
      setCanvasCursor('grabbing');
      return;
    }
    const hit = hitNode(sx, sy);
    setHoveredNodeId(hit?.id || null);
    setCanvasCursor(hit ? 'pointer' : 'grab');
  };

  const handleMouseUp = () => {
    dragNodeIdRef.current = null;
    panningRef.current = false;
    setCanvasCursor(hoveredNodeId ? 'pointer' : 'grab');
  };

  const handleDoubleClick = (event: React.MouseEvent) => {
    if (justPannedRef.current) return;
    const { sx, sy } = getMousePositionOnCanvas(event);
    const hit = hitNode(sx, sy);
    if (!hit) return;
    navigate(getNodeRoute(pid, hit));
  };

  const selectedNode = useMemo(() => filteredGraph.nodes.find((node) => node.id === selectedNodeId) || null, [filteredGraph.nodes, selectedNodeId]);
  const selectedNodeEdges = useMemo(
    () => (selectedNode ? filteredGraph.edges.filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id) : []),
    [filteredGraph.edges, selectedNode]
  );

  const toggleNodeType = (nodeType: GraphNodeType) => {
    setEnabledNodeTypes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeType)) next.delete(nodeType);
      else next.add(nodeType);
      return next;
    });
  };

  const toggleEdgeKind = (edgeKind: GraphEdgeKind) => {
    setEnabledEdgeKinds((prev) => {
      const next = new Set(prev);
      if (next.has(edgeKind)) next.delete(edgeKind);
      else next.add(edgeKind);
      return next;
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography sx={{ color: 'text.secondary' }}>Загрузка графа проекта...</Typography>
      </Box>
    );
  }

  if (graphData.nodes.length === 0) {
    return (
      <EmptyState
        icon={<HubIcon sx={{ fontSize: 64 }} />}
        title="Граф пуст"
        description="В проекте пока недостаточно данных и явных связей для построения графа."
      />
    );
  }

  return (
    <Box
      sx={{
        height: 'calc(100vh - 64px - 46px)',
        minHeight: 0,
        display: 'grid',
        gridTemplateColumns: '300px minmax(0, 1fr) 300px',
        gap: 1.5,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ minHeight: 0, overflowY: 'auto', pr: 0.5 }}>
        <ProjectGraphFilters
          enabledNodeTypes={enabledNodeTypes}
          enabledEdgeKinds={enabledEdgeKinds}
          onToggleNodeType={toggleNodeType}
          onToggleEdgeKind={toggleEdgeKind}
          viewSettings={viewSettings}
          onViewSettingsChange={updateViewSettings}
        />
      </Box>

      <Box sx={{ minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Typography sx={{ fontFamily: '"Cinzel", serif', fontSize: '1.45rem', fontWeight: 700, mb: 0.4 }}>
          Граф проекта
        </Typography>
        <ProjectGraphToolbar
          search={search}
          onSearchChange={setSearch}
          showIsolated={showIsolated}
          onShowIsolatedChange={setShowIsolated}
          nodeLimit={nodeLimit}
          onNodeLimitChange={setNodeLimit}
          zoomPercent={zoomPercent}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={resetCameraView}
          onFit={fitCamera}
          layoutPaused={layoutPaused}
          onToggleLayoutPaused={() => setLayoutPaused((prev) => !prev)}
          onRelayout={handleRelayout}
        />
        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.8 }}>
          Узлы: {filteredGraph.nodes.length} · Связи: {filteredGraph.edges.length}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.8 }}>
          Колесо - масштаб · Перетаскивание фона - панорамирование · Двойной клик по узлу - открыть сущность
        </Typography>
        <Box
          ref={wrapRef}
          sx={{
            position: 'relative',
            flexGrow: 1,
            minHeight: 0,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.default,
            overflow: 'hidden',
            touchAction: 'none',
          }}
        >
          <Tooltip title="Двойной клик по узлу открывает сущность">
            <canvas
              ref={canvasRef}
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                cursor: canvasCursor,
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onDoubleClick={handleDoubleClick}
            />
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.2, pl: 0.5 }}>
        <ProjectGraphLegend />
        <ProjectGraphNodePanel
          selectedNode={selectedNode}
          connectedEdges={selectedNodeEdges}
          onOpen={() => {
            if (!selectedNode) return;
            navigate(getNodeRoute(pid, selectedNode));
          }}
        />
      </Box>
    </Box>
  );
};
