import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Drawer,
  Paper,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { alpha, type Theme } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useBranchStore } from '@/store/useBranchStore';
import { EmptyState } from '@/components/ui/EmptyState';
import HubIcon from '@mui/icons-material/Hub';
import { buildProjectGraph } from '@/pages/graph/data/buildProjectGraph';
import { GraphCanvasShell } from '@/pages/graph/components/GraphCanvasShell';
import { GraphDetailsPanel } from '@/pages/graph/components/GraphDetailsPanel';
import { GraphFiltersPanel } from '@/pages/graph/components/GraphFiltersPanel';
import { GraphStatusBar } from '@/pages/graph/components/GraphStatusBar';
import { AnimatedGraphSidePanel } from '@/pages/graph/components/AnimatedGraphSidePanel';
import { GraphToolbar } from '@/pages/graph/components/GraphToolbar';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import {
  PROJECT_GRAPH_LAYOUT_TYPE,
  emptyGraphLayoutData,
  type GraphLayoutDataV1,
} from '@campaigner/shared';
import { graphLayoutApi } from '@/api/graphLayout';
import {
  DEFAULT_PROJECT_GRAPH_PANEL_STATE,
  DEFAULT_PROJECT_GRAPH_VIEW_SETTINGS,
  GRAPH_EDGE_KIND_COLORS,
  GRAPH_EDGE_KINDS,
  GRAPH_NODE_TYPE_COLORS,
  GRAPH_NODE_TYPES,
  PROJECT_GRAPH_PANEL_STATE_KEY,
  PROJECT_GRAPH_UI_VISIBILITY_KEY,
  PROJECT_GRAPH_VIEW_SETTINGS_KEY,
  getNodeRoute,
  type GraphEdge,
  type GraphEdgeKind,
  type GraphNode,
  type GraphNodeType,
  type ProjectGraphData,
  type ProjectGraphPanelState,
  type ProjectGraphUiVisibility,
  type ProjectGraphViewSettings,
} from '@/pages/graph/types';

type SimNode = GraphNode & { x: number; y: number; vx: number; vy: number; pinned?: boolean };

function loadPanelState(): ProjectGraphPanelState {
  try {
    const v2 = localStorage.getItem(PROJECT_GRAPH_PANEL_STATE_KEY);
    if (v2) {
      const p = JSON.parse(v2) as Partial<ProjectGraphPanelState>;
      return { ...DEFAULT_PROJECT_GRAPH_PANEL_STATE, ...p };
    }
    const v1Raw = localStorage.getItem(PROJECT_GRAPH_UI_VISIBILITY_KEY);
    if (v1Raw) {
      const o = JSON.parse(v1Raw) as ProjectGraphUiVisibility;
      return {
        filtersOpen: Boolean(o.showFilters && o.showDisplaySection),
        detailsOpen: Boolean(o.showLegend),
      };
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_PROJECT_GRAPH_PANEL_STATE;
}

const NODE_RADIUS_MAP = {
  small: 15,
  medium: 21,
  large: 28,
} as const;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const EDGE_OPACITY_MAP = {
  low: 0.34,
  medium: 0.52,
  high: 0.8,
} as const;
const EDGE_THICKNESS_MAP = {
  thin: 1.45,
  normal: 2.25,
  thick: 3.2,
} as const;
const LAYOUT_PRESET = {
  compact: { repel: 5400, linkDistance: 125, gravity: 0.00026, damping: 0.84, spring: 0.009 },
  balanced: { repel: 7000, linkDistance: 170, gravity: 0.00016, damping: 0.86, spring: 0.006 },
  loose: { repel: 9200, linkDistance: 220, gravity: 0.0001, damping: 0.88, spring: 0.0042 },
} as const;

const PANEL_WIDTH = 300;

const panelPaperSx = (theme: Theme) => ({
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column' as const,
  minHeight: 0,
  overflow: 'hidden',
  borderRadius: 2,
  border: `1px solid ${theme.palette.divider}`,
  bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.35 : 0.85),
  backdropFilter: 'blur(10px)',
});

export const ProjectGraphPage: React.FC = () => {
  const { t, i18n } = useTranslation(['graph', 'common']);
  const { projectId } = useParams<{ projectId: string }>();
  const pid = Number.parseInt(projectId || '0', 10);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const motionMode = usePreferencesStore((s) => s.motionMode);
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)', { noSsr: true });
  const activeBranchId = useBranchStore((s) => s.activeBranchId);

  const drawerTransitionMs = useMemo(() => {
    const smooth = motionMode === 'full' && !prefersReducedMotion;
    return { enter: smooth ? 230 : 82, exit: smooth ? 200 : 72 };
  }, [motionMode, prefersReducedMotion]);

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

  const [panelState, setPanelState] = useState<ProjectGraphPanelState>(loadPanelState);

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
  const ignoreSavedLayoutRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingViewportRef = useRef<{ x: number; y: number; zoom: number } | null>(null);
  /** Full server layout payload for PUT merges (preserve viewport in DB while only saving node coords). */
  const serverLayoutSnapshotRef = useRef<GraphLayoutDataV1>(emptyGraphLayoutData());
  const savedLayoutNodesRef = useRef<GraphLayoutDataV1['nodes']>({});
  /** After branch switch: don't reuse xy from previous branch's sim state. */
  const skipPositionCarryoverRef = useRef(false);
  /** After "Reset layout" / "Re-layout": one rebuild without prev-node carry (avoids frozen pinned positions). */
  const skipCarryPositionsOnceRef = useRef(false);
  /** Bump when server layout should be reapplied (GET success). Not on selection/filter. */
  const [layoutSyncGeneration, setLayoutSyncGeneration] = useState(0);
  /** When true, next nodes rebuild may reset camera (fit / saved viewport). */
  const resetViewportAfterLayoutRef = useRef(false);

  const preferServerLayoutPositionsRef = useRef(false);
  const selectedNodeIdRef = useRef<string | null>(null);
  const hoveredNodeIdRef = useRef<string | null>(null);
  selectedNodeIdRef.current = selectedNodeId;
  hoveredNodeIdRef.current = hoveredNodeId;

  useEffect(() => {
    localStorage.setItem(PROJECT_GRAPH_VIEW_SETTINGS_KEY, JSON.stringify(viewSettings));
  }, [viewSettings]);

  useEffect(() => {
    localStorage.setItem(PROJECT_GRAPH_PANEL_STATE_KEY, JSON.stringify(panelState));
  }, [panelState]);

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
  }, [pid, i18n.language, activeBranchId]);

  useEffect(() => {
    let active = true;
    if (!pid) return undefined;
    savedLayoutNodesRef.current = {};
    skipPositionCarryoverRef.current = true;
    graphLayoutApi
      .get(pid, { graphType: PROJECT_GRAPH_LAYOUT_TYPE, branchId: activeBranchId ?? undefined })
      .then((res) => {
        if (!active) return;
        const data = res.data.data?.layoutData ?? emptyGraphLayoutData();
        serverLayoutSnapshotRef.current = data;
        savedLayoutNodesRef.current = data.nodes;
        pendingViewportRef.current = data.viewport ?? null;
        resetViewportAfterLayoutRef.current = true;
        skipPositionCarryoverRef.current = false;
        preferServerLayoutPositionsRef.current = true;
        setLayoutSyncGeneration((g) => g + 1);
      })
      .catch(() => {
        if (!active) return;
        const empty = emptyGraphLayoutData();
        serverLayoutSnapshotRef.current = empty;
        savedLayoutNodesRef.current = {};
        pendingViewportRef.current = null;
        resetViewportAfterLayoutRef.current = true;
        skipPositionCarryoverRef.current = false;
        preferServerLayoutPositionsRef.current = true;
        setLayoutSyncGeneration((g) => g + 1);
      });
    return () => {
      active = false;
    };
  }, [pid, activeBranchId]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [pid, activeBranchId]);

  const focusNeighborhood = viewSettings.focusSelectedNeighborhood;
  const neighborhoodAnchorId = focusNeighborhood ? selectedNodeId : null;

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
    if (focusNeighborhood && neighborhoodAnchorId) {
      const neighbors = new Set<string>([neighborhoodAnchorId]);
      edges.forEach((edge) => {
        if (edge.source === neighborhoodAnchorId) neighbors.add(edge.target);
        if (edge.target === neighborhoodAnchorId) neighbors.add(edge.source);
      });
      nodes = nodes.filter((node) => neighbors.has(node.id));
    }
    const finalNodeSet = new Set(nodes.map((node) => node.id));
    const finalEdges = edges.filter((edge) => {
      if (!finalNodeSet.has(edge.source) || !finalNodeSet.has(edge.target)) return false;
      if (!focusNeighborhood || !neighborhoodAnchorId) return true;
      if (edge.source === neighborhoodAnchorId || edge.target === neighborhoodAnchorId) return true;
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
    neighborhoodAnchorId,
    focusNeighborhood,
    showIsolated,
    viewSettings.focusSelectedNeighborhood,
  ]);

  const schedulePersistLayoutNodes = useCallback(() => {
    if (!pid) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      const nodes: GraphLayoutDataV1['nodes'] = {};
      nodesRef.current.forEach((node) => {
        nodes[node.id] = { x: node.x, y: node.y, pinned: true };
      });
      const layoutData: GraphLayoutDataV1 = {
        version: 1,
        viewport: serverLayoutSnapshotRef.current.viewport,
        nodes,
      };
      graphLayoutApi
        .put(pid, {
          graphType: PROJECT_GRAPH_LAYOUT_TYPE,
          layoutData,
          branchId: activeBranchId ?? undefined,
        })
        .then((res) => {
          const saved = res.data.data?.layoutData;
          if (saved) {
            serverLayoutSnapshotRef.current = saved;
            savedLayoutNodesRef.current = saved.nodes;
          }
        })
        .catch(() => {});
    }, 550);
  }, [pid, activeBranchId]);

  useEffect(() => {
    const radius = Math.max(168, filteredGraph.nodes.length * 22);
    const savedNodes = ignoreSavedLayoutRef.current ? {} : savedLayoutNodesRef.current;
    if (ignoreSavedLayoutRef.current) {
      ignoreSavedLayoutRef.current = false;
    }

    const prevById = new Map(nodesRef.current.map((n) => [n.id, n]));
    const skipCarryOnce = skipCarryPositionsOnceRef.current;
    if (skipCarryOnce) {
      skipCarryPositionsOnceRef.current = false;
    }
    const carryPositions = !skipPositionCarryoverRef.current && !skipCarryOnce;
    const preferServerLayout = preferServerLayoutPositionsRef.current;
    if (preferServerLayout) {
      preferServerLayoutPositionsRef.current = false;
    }

    nodesRef.current = filteredGraph.nodes.map((node, index) => {
      const angle = (index / Math.max(filteredGraph.nodes.length, 1)) * Math.PI * 2;
      const prev = carryPositions ? prevById.get(node.id) : undefined;
      const preset = savedNodes[node.id];
      const hasSaved =
        preset &&
        typeof preset.x === 'number' &&
        typeof preset.y === 'number' &&
        Number.isFinite(preset.x) &&
        Number.isFinite(preset.y);

      if (preferServerLayout) {
        if (hasSaved) {
          return {
            ...node,
            x: preset!.x,
            y: preset!.y,
            vx: 0,
            vy: 0,
            pinned: true,
          };
        }
        const jit = skipCarryOnce ? (Math.random() - 0.5) * 16 : 0;
        const kick = skipCarryOnce ? (Math.random() - 0.5) * 5 : 0;
        return {
          ...node,
          x: Math.cos(angle) * radius + jit,
          y: Math.sin(angle) * radius + jit,
          vx: kick,
          vy: kick,
          pinned: false,
        };
      }

      if (carryPositions && prev) {
        return {
          ...node,
          x: prev.x,
          y: prev.y,
          vx: prev.vx ?? 0,
          vy: prev.vy ?? 0,
          pinned: prev.pinned ?? false,
        };
      }
      if (hasSaved) {
        return {
          ...node,
          x: preset!.x,
          y: preset!.y,
          vx: 0,
          vy: 0,
          pinned: true,
        };
      }
      const jit = skipCarryOnce ? (Math.random() - 0.5) * 16 : 0;
      const kick = skipCarryOnce ? (Math.random() - 0.5) * 5 : 0;
      return {
        ...node,
        x: Math.cos(angle) * radius + jit,
        y: Math.sin(angle) * radius + jit,
        vx: kick,
        vy: kick,
        pinned: false,
      };
    });
    edgesRef.current = filteredGraph.edges;

    if (resetViewportAfterLayoutRef.current) {
      didFitRef.current = false;
      resetViewportAfterLayoutRef.current = false;
    }
  }, [filteredGraph, relayoutSeed, layoutSyncGeneration]);

  const getNodeRadius = useCallback(() => NODE_RADIUS_MAP[viewSettings.nodeSize], [viewSettings.nodeSize]);

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
      const zoom = Math.min(MAX_ZOOM, Math.max((Math.min(wrap.clientWidth, wrap.clientHeight) / 340) * 0.92, 1.35));
      camRef.current = {
        zoom,
        panX: wrap.clientWidth / 2 - node.x * zoom,
        panY: wrap.clientHeight / 2 - node.y * zoom,
      };
      setZoomPercent(Math.round(zoom * 100));
      return;
    }
    const padding = 72;
    const width = Math.max(maxX - minX + padding * 2, 1);
    const height = Math.max(maxY - minY + padding * 2, 1);
    let zoom = Math.min(wrap.clientWidth / width, wrap.clientHeight / height, MAX_ZOOM);
    if (nodes.length <= 3) zoom = Math.min(MAX_ZOOM, Math.max(zoom, 0.95));
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
    skipCarryPositionsOnceRef.current = true;
    ignoreSavedLayoutRef.current = true;
    resetViewportAfterLayoutRef.current = true;
    setRelayoutSeed((seed) => seed + 1);
    setLayoutPaused(false);
  }, []);

  const handleResetPersistedLayout = useCallback(async () => {
    if (!pid) return;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    try {
      await graphLayoutApi.delete(pid, {
        graphType: PROJECT_GRAPH_LAYOUT_TYPE,
        branchId: activeBranchId ?? undefined,
      });
      const empty = emptyGraphLayoutData();
      serverLayoutSnapshotRef.current = empty;
      savedLayoutNodesRef.current = {};
      pendingViewportRef.current = null;
      ignoreSavedLayoutRef.current = true;
      skipCarryPositionsOnceRef.current = true;
      resetViewportAfterLayoutRef.current = true;
      setRelayoutSeed((s) => s + 1);
      setLayoutPaused(false);
    } catch {
      /* ignore */
    }
  }, [pid, activeBranchId]);

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
        const pv = pendingViewportRef.current;
        if (pv && Number.isFinite(pv.zoom) && Number.isFinite(pv.x) && Number.isFinite(pv.y)) {
          const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pv.zoom));
          camRef.current = { zoom: z, panX: pv.x, panY: pv.y };
          setZoomPercent(Math.round(z * 100));
          pendingViewportRef.current = null;
        } else {
          centerCameraDefault();
        }
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
          if (node.id === dragNodeIdRef.current) {
            return;
          }
          if (node.pinned) {
            node.vx = 0;
            node.vy = 0;
            return;
          }
          node.x += node.vx;
          node.y += node.vy;
        });
      }

      const camera = camRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      ctx.save();
      ctx.translate(camera.panX, camera.panY);
      ctx.scale(camera.zoom, camera.zoom);

      const selId = selectedNodeIdRef.current;
      const hovId = hoveredNodeIdRef.current;

      const selectedNeighborIds = new Set<string>();
      if (selId) {
        edges.forEach((edge) => {
          if (edge.source === selId) selectedNeighborIds.add(edge.target);
          if (edge.target === selId) selectedNeighborIds.add(edge.source);
        });
      }

      edges.forEach((edge) => {
        const source = nodes.find((node) => node.id === edge.source);
        const target = nodes.find((node) => node.id === edge.target);
        if (!source || !target) return;

        let alphaMultiplier = 1;
        if (selId) {
          const connectedToSelected = edge.source === selId || edge.target === selId;
          alphaMultiplier = connectedToSelected ? 1 : 0.22;
        } else if (hovId) {
          const touchesHover = edge.source === hovId || edge.target === hovId;
          alphaMultiplier = touchesHover ? 1 : 0.4;
        }

        const baseOpacity = EDGE_OPACITY_MAP[viewSettings.edgeOpacity] * alphaMultiplier;
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = `${GRAPH_EDGE_KIND_COLORS[edge.kind]}${Math.round(Math.min(255, baseOpacity * 255)).toString(16).padStart(2, '0')}`;
        const baseWidth = EDGE_THICKNESS_MAP[viewSettings.edgeThickness];
        ctx.lineWidth = edge.kind === 'relationship' ? baseWidth + 0.55 : baseWidth;
        if (edge.kind === 'wiki-link' || edge.kind === 'note-link') ctx.setLineDash([5, 5]);
        else ctx.setLineDash([]);
        ctx.stroke();
        ctx.setLineDash([]);

        if (
          viewSettings.edgeLabels === 'on-hover'
          && (edge.source === hovId || edge.target === hovId || edge.source === selId || edge.target === selId)
        ) {
          const edgeLabel = edge.label || i18n.t(`graph:edgeKinds.${edge.kind}`);
          const mx = (source.x + target.x) / 2;
          const my = (source.y + target.y) / 2;
          ctx.font = '11px system-ui,sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const tw = ctx.measureText(edgeLabel).width + 12;
          ctx.fillStyle = 'rgba(8, 10, 18, 0.88)';
          ctx.beginPath();
          ctx.roundRect(mx - tw / 2, my - 9, tw, 18, 5);
          ctx.fill();
          ctx.fillStyle = '#f3f5ff';
          ctx.fillText(edgeLabel, mx, my);
        }
      });

      const hoveredNode = nodes.find((node) => node.id === hovId);
      const selectedNode = nodes.find((node) => node.id === selId);

      nodes.forEach((node) => {
        const relatedToSelected = !selId || node.id === selId || selectedNeighborIds.has(node.id);
        const relatedToHover = !hovId || node.id === hovId;
        const dim =
          selId || hovId ? (selId ? relatedToSelected : relatedToHover) ? 1 : 0.28 : 1;
        const radius = node.id === selId ? nodeRadius + 7 : selectedNeighborIds.has(node.id) ? nodeRadius + 3 : nodeRadius;
        if (node.id === hovId || node.id === selId || selectedNeighborIds.has(node.id)) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + (node.id === selId ? 12 : 8), 0, Math.PI * 2);
          ctx.fillStyle = `${GRAPH_NODE_TYPE_COLORS[node.type]}${node.id === selId ? '55' : '38'}`;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        const fillAlphaHex = Math.round(255 * dim).toString(16).padStart(2, '0');
        ctx.fillStyle = `${GRAPH_NODE_TYPE_COLORS[node.type]}${fillAlphaHex}`;
        ctx.fill();
        ctx.strokeStyle =
          node.id === selId ? '#ffffff' : node.id === hovId ? 'rgba(255,255,255,0.95)' : 'rgba(12,18,30,0.82)';
        ctx.lineWidth = node.id === selId ? 3 : node.id === hovId ? 2.2 : 1.45;
        ctx.stroke();
        const shouldDrawNodeLabel =
          viewSettings.nodeLabels === 'always'
          || (viewSettings.nodeLabels === 'on-hover' && (node.id === hovId || node.id === selId));
        if (shouldDrawNodeLabel) {
          ctx.font = 'bold 11px system-ui,sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const short = node.label.length > 18 ? `${node.label.slice(0, 16)}…` : node.label;
          ctx.shadowColor = 'rgba(0,0,0,0.55)';
          ctx.shadowBlur = 5;
          ctx.fillStyle = '#ffffff';
          ctx.fillText(short, node.x, node.y + radius + 12);
          ctx.shadowBlur = 0;
        }
      });

      if (hoveredNode && viewSettings.nodeLabels !== 'off') {
        ctx.font = '12px system-ui,sans-serif';
        const textWidth = ctx.measureText(hoveredNode.label).width + 18;
        const x = hoveredNode.x - textWidth / 2;
        const y = hoveredNode.y - nodeRadius - 30;
        ctx.fillStyle = 'rgba(10, 12, 22, 0.92)';
        ctx.beginPath();
        ctx.roundRect(x, y, textWidth, 24, 6);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText(hoveredNode.label, hoveredNode.x, y + 12);
      }

      if (selectedNode) {
        ctx.beginPath();
        ctx.arc(selectedNode.x, selectedNode.y, nodeRadius + 14, 0, Math.PI * 2);
        ctx.strokeStyle = `${GRAPH_NODE_TYPE_COLORS[selectedNode.type]}aa`;
        ctx.lineWidth = 2.2;
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
    getNodeRadius,
    i18n.language,
    layoutPaused,
    loading,
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
    const hitPadding = 8;
    for (let idx = nodesRef.current.length - 1; idx >= 0; idx -= 1) {
      const node = nodesRef.current[idx];
      const dx = x - node.x;
      const dy = y - node.y;
      const rSel =
        node.id === selectedNodeIdRef.current ? nodeRadius + 7 + hitPadding : nodeRadius + hitPadding;
      if (dx * dx + dy * dy <= rSel * rSel) return node;
    }
    return null;
  };

  const toggleFilters = () => setPanelState((p) => ({ ...p, filtersOpen: !p.filtersOpen }));

  const toggleDetails = () => setPanelState((p) => ({ ...p, detailsOpen: !p.detailsOpen }));

  const handleMouseDown = (event: React.MouseEvent) => {
    const { sx, sy } = getMousePositionOnCanvas(event);
    const hit = hitNode(sx, sy);
    if (hit && event.button === 0) {
      dragNodeIdRef.current = hit.id;
      setSelectedNodeId(hit.id);
      if (isMdUp) {
        setPanelState((p) => ({ ...p, detailsOpen: true }));
      }
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
      dragged.pinned = true;
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
    const hadDrag = dragNodeIdRef.current !== null;
    dragNodeIdRef.current = null;
    panningRef.current = false;
    if (hadDrag) {
      schedulePersistLayoutNodes();
    }
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
    () =>
      selectedNode ? filteredGraph.edges.filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id) : [],
    [filteredGraph.edges, selectedNode]
  );
  const nodeById = useMemo(() => new Map(filteredGraph.nodes.map((node) => [node.id, node])), [filteredGraph.nodes]);

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

  const filtersBody = (
    <GraphFiltersPanel
      enabledNodeTypes={enabledNodeTypes}
      enabledEdgeKinds={enabledEdgeKinds}
      onToggleNodeType={toggleNodeType}
      onToggleEdgeKind={toggleEdgeKind}
      onSelectAllNodeTypes={() => setEnabledNodeTypes(new Set(GRAPH_NODE_TYPES))}
      onSelectNoNodeTypes={() => setEnabledNodeTypes(new Set())}
      onSelectAllEdgeKinds={() => setEnabledEdgeKinds(new Set(GRAPH_EDGE_KINDS))}
      onSelectNoEdgeKinds={() => setEnabledEdgeKinds(new Set())}
      viewSettings={viewSettings}
      onViewSettingsChange={updateViewSettings}
    />
  );

  const detailsBody = (
    <GraphDetailsPanel
      projectId={pid}
      selectedNode={selectedNode}
      connectedEdges={selectedNodeEdges}
      nodeById={nodeById}
      onOpenEntity={() => {
        if (selectedNode) navigate(getNodeRoute(pid, selectedNode));
      }}
    />
  );

  const detailsBadge = !isMdUp && Boolean(selectedNode) && !panelState.detailsOpen;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography sx={{ color: 'text.secondary' }}>{t('graph:page.loading')}</Typography>
      </Box>
    );
  }

  if (graphData.nodes.length === 0) {
    return (
      <EmptyState
        icon={<HubIcon sx={{ fontSize: 64 }} />}
        title={t('graph:page.emptyTitle')}
        description={t('graph:page.emptyDescription')}
      />
    );
  }

  return (
    <Box
      sx={{
        height: 'calc(100vh - 64px - 46px)',
        maxWidth: '100%',
        boxSizing: 'border-box',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Typography
        sx={{
          fontFamily: '"Cinzel", serif',
          fontSize: { xs: '1.25rem', sm: '1.45rem' },
          fontWeight: 700,
          mb: 1,
          flexShrink: 0,
        }}
      >
        {t('graph:page.title')}
      </Typography>

      <GraphToolbar
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
        onResetLayout={handleResetPersistedLayout}
        filtersOpen={panelState.filtersOpen}
        onToggleFilters={toggleFilters}
        detailsOpen={panelState.detailsOpen}
        onToggleDetails={toggleDetails}
        detailsButtonBadge={detailsBadge}
      />

      <Box
        sx={{
          flex: 1,
          minHeight: { xs: 360, md: 0 },
          minWidth: 0,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 1,
          py: 0.5,
        }}
      >
        {isMdUp ? (
          <AnimatedGraphSidePanel side="left" open={panelState.filtersOpen} panelWidth={PANEL_WIDTH}>
            <Paper variant="outlined" elevation={0} sx={{ ...panelPaperSx(theme), flex: 1, width: '100%', p: 1.5 }}>
              {filtersBody}
            </Paper>
          </AnimatedGraphSidePanel>
        ) : null}

        <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <GraphCanvasShell>
            <Box ref={wrapRef} sx={{ width: '100%', height: '100%', position: 'relative' }}>
              <Tooltip title={t('graph:page.canvasDoubleClickHint')}>
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
          </GraphCanvasShell>
          <GraphStatusBar nodeCount={filteredGraph.nodes.length} edgeCount={filteredGraph.edges.length} zoomPercent={zoomPercent} />
        </Box>

        {isMdUp ? (
          <AnimatedGraphSidePanel side="right" open={panelState.detailsOpen} panelWidth={PANEL_WIDTH}>
            <Paper variant="outlined" elevation={0} sx={{ ...panelPaperSx(theme), flex: 1, width: '100%', p: 1.5 }}>
              {detailsBody}
            </Paper>
          </AnimatedGraphSidePanel>
        ) : null}
      </Box>

      <Drawer
        anchor="left"
        open={!isMdUp && panelState.filtersOpen}
        onClose={() => setPanelState((p) => ({ ...p, filtersOpen: false }))}
        ModalProps={{ keepMounted: true }}
        transitionDuration={{ enter: drawerTransitionMs.enter, exit: drawerTransitionMs.exit }}
        PaperProps={{ sx: { width: PANEL_WIDTH, maxWidth: '90vw', boxSizing: 'border-box' } }}
      >
        <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>{filtersBody}</Box>
      </Drawer>

      <Drawer
        anchor="right"
        open={!isMdUp && panelState.detailsOpen}
        onClose={() => setPanelState((p) => ({ ...p, detailsOpen: false }))}
        ModalProps={{ keepMounted: true }}
        transitionDuration={{ enter: drawerTransitionMs.enter, exit: drawerTransitionMs.exit }}
        PaperProps={{ sx: { width: PANEL_WIDTH, maxWidth: '90vw', boxSizing: 'border-box' } }}
      >
        <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>{detailsBody}</Box>
      </Drawer>
    </Box>
  );
};
