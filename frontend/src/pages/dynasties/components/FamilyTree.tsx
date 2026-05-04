import React, { useMemo, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ReactFlow, {
  Node, Edge, Background,
  useNodesState, useEdgesState, Position, MarkerType,
  Handle, NodeChange,
} from 'reactflow';
import dagre from 'dagre';
import { Box, Typography, Avatar, Chip } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import type { DynastyMember, DynastyFamilyLink } from '@campaigner/shared';
import { useNavigate, useParams } from 'react-router-dom';
import { routes } from '@/utils/routes';
import 'reactflow/dist/style.css';

const MemberNode: React.FC<{ data: any }> = ({ data }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <Box
      onClick={(e) => { e.stopPropagation(); navigate(routes.characterDetail(projectId!, data.characterId)); }}
      sx={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        p: 1.5, minWidth: 120,
        backgroundColor: data.isMainLine
          ? alpha(theme.palette.primary.main, 0.12)
          : alpha(theme.palette.common.white, 0.06),
        border: `2px solid ${
          data.isDead
            ? alpha(theme.palette.grey[500], 0.3)
            : alpha(theme.palette.primary.main, 0.3)
        }`,
        borderRadius: '12px', cursor: 'pointer',
        transition: 'all 0.15s',
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.2),
          borderColor: alpha(theme.palette.primary.main, 0.6),
          transform: 'scale(1.05)',
        },
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: 'transparent', border: 'none', width: 1, height: 1 }} />
      <Handle type="source" position={Position.Bottom} style={{ background: 'transparent', border: 'none', width: 1, height: 1 }} />
      <Handle type="source" position={Position.Right} id="right" style={{ background: 'transparent', border: 'none', width: 1, height: 1 }} />
      <Handle type="target" position={Position.Left} id="left" style={{ background: 'transparent', border: 'none', width: 1, height: 1 }} />

      <Avatar
        src={data.imagePath || undefined}
        sx={{
          width: 44, height: 44, mb: 0.75,
          bgcolor: alpha(theme.palette.primary.main, 0.15),
          border: `2px solid ${
            data.isDead
              ? alpha(theme.palette.grey[500], 0.3)
              : alpha(theme.palette.primary.main, 0.25)
          }`,
          filter: data.isDead ? 'grayscale(0.7)' : 'none',
        }}
      >
        <PersonIcon sx={{ color: alpha(theme.palette.primary.main, 0.5), fontSize: 20 }} />
      </Avatar>

      <Typography sx={{
        fontWeight: 700, fontSize: '0.75rem', color: 'text.primary',
        textAlign: 'center', maxWidth: 100,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {data.name}
      </Typography>

      {data.role && (
        <Typography sx={{ fontSize: '0.55rem', color: alpha(theme.palette.primary.main, 0.7), textAlign: 'center', mt: 0.25 }}>
          {data.role}
        </Typography>
      )}

      {data.isDead && (
        <Chip label="†" size="small" sx={{
          height: 14, fontSize: '0.5rem', mt: 0.3,
          backgroundColor: alpha(theme.palette.grey[500], 0.15),
          color: alpha(theme.palette.grey[500], 0.7),
        }} />
      )}
    </Box>
  );
};

const nodeTypes = { member: MemberNode };

interface EdgePalette {
  primary: string;
  spouse: string;
  sibling: string;
  dynastyFallback?: string;
  edgeLabelFill: string;
  edgeLabelBg: string;
}

const NODE_WIDTH = 140;
const NODE_HEIGHT = 100;
const SPOUSE_OFFSET_X = 180;

function buildNodeData(m: DynastyMember) {
  return {
    characterId: m.characterId,
    name: m.characterName || `ID: ${m.characterId}`,
    imagePath: m.characterImagePath,
    role: m.role,
    generation: m.generation,
    isMainLine: m.isMainLine,
    isDead: m.characterStatus === 'dead',
  };
}

function buildLayout(
  members: DynastyMember[],
  familyLinks: DynastyFamilyLink[],
  edgePalette: EdgePalette,
  getEdgeLabel: (link: DynastyFamilyLink) => string,
) {
  const hasSavedPositions = members.some(m => m.graphX != null && m.graphY != null);

  if (hasSavedPositions) {
    const nodes: Node[] = members.map(m => ({
      id: String(m.characterId),
      type: 'member',
      position: { x: m.graphX ?? 0, y: m.graphY ?? 0 },
      data: buildNodeData(m),
    }));

    const edges: Edge[] = buildEdges(familyLinks, edgePalette, getEdgeLabel);
    return { nodes, edges };
  }

  const spouseLinks = familyLinks.filter(l => l.relationType === 'spouse');
  const hierarchyLinks = familyLinks.filter(l => l.relationType !== 'spouse');

  const spouseOf = new Map<number, number>();
  const placedAsSpouse = new Set<number>();

  for (const sl of spouseLinks) {
    if (!placedAsSpouse.has(sl.sourceCharacterId) && !placedAsSpouse.has(sl.targetCharacterId)) {
      spouseOf.set(sl.targetCharacterId, sl.sourceCharacterId);
      placedAsSpouse.add(sl.targetCharacterId);
    }
  }

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', ranksep: 100, nodesep: 60, edgesep: 30 });

  const primaryMembers = members.filter(m => !placedAsSpouse.has(m.characterId));
  primaryMembers.forEach(m => {
    const hasSpouse = [...spouseOf.values()].includes(m.characterId);
    g.setNode(String(m.characterId), {
      width: hasSpouse ? NODE_WIDTH + SPOUSE_OFFSET_X : NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  });

  hierarchyLinks.forEach(link => {
    const srcInGraph = g.hasNode(String(link.sourceCharacterId));
    const tgtInGraph = g.hasNode(String(link.targetCharacterId));
    if (srcInGraph && tgtInGraph) {
      g.setEdge(String(link.sourceCharacterId), String(link.targetCharacterId));
    }
  });

  dagre.layout(g);

  const nodeMap = new Map<number, { x: number; y: number }>();
  const nodes: Node[] = [];

  primaryMembers.forEach(m => {
    const pos = g.node(String(m.characterId));
    const x = (pos?.x ?? 0) - NODE_WIDTH / 2;
    const y = (pos?.y ?? 0) - NODE_HEIGHT / 2;
    nodeMap.set(m.characterId, { x, y });
    nodes.push({
      id: String(m.characterId),
      type: 'member',
      position: { x, y },
      data: buildNodeData(m),
    });
  });

  members.filter(m => placedAsSpouse.has(m.characterId)).forEach(m => {
    const partnerId = spouseOf.get(m.characterId)!;
    const partnerPos = nodeMap.get(partnerId);
    const x = (partnerPos?.x ?? 0) + SPOUSE_OFFSET_X;
    const y = partnerPos?.y ?? 0;
    nodeMap.set(m.characterId, { x, y });
    nodes.push({
      id: String(m.characterId),
      type: 'member',
      position: { x, y },
      data: buildNodeData(m),
    });
  });

  const edges: Edge[] = buildEdges(familyLinks, edgePalette, getEdgeLabel);
  return { nodes, edges };
}

function buildEdges(
  familyLinks: DynastyFamilyLink[],
  palette: EdgePalette,
  getEdgeLabel: (link: DynastyFamilyLink) => string,
): Edge[] {
  return familyLinks.map(link => {
    const relType = link.relationType;
    const isSpouse = relType === 'spouse';
    const isSibling = relType === 'sibling';
    const color =
      relType === 'parent' || relType === 'child'
        ? palette.primary
        : relType === 'spouse'
          ? palette.spouse
          : relType === 'sibling'
            ? palette.sibling
            : palette.dynastyFallback || palette.primary;

    return {
      id: `link-${link.id}`,
      source: String(link.sourceCharacterId),
      target: String(link.targetCharacterId),
      sourceHandle: isSpouse ? 'right' : undefined,
      targetHandle: isSpouse ? 'left' : undefined,
      type: isSpouse ? 'straight' : isSibling ? 'step' : 'smoothstep',
      animated: isSpouse,
      label: getEdgeLabel(link),
      labelStyle: { fill: palette.edgeLabelFill, fontSize: 9, fontWeight: 600 },
      labelBgStyle: { fill: palette.edgeLabelBg },
      labelBgPadding: [6, 3] as [number, number],
      labelBgBorderRadius: 4,
      style: {
        stroke: color,
        strokeWidth: isSpouse ? 2.5 : 2,
        strokeDasharray: isSibling ? '6,4' : undefined,
      },
      markerEnd: (!isSpouse && !isSibling) ? {
        type: MarkerType.ArrowClosed,
        color,
        width: 16,
        height: 16,
      } : undefined,
    };
  });
}

interface FamilyTreeProps {
  members: DynastyMember[];
  familyLinks: DynastyFamilyLink[];
  dynastyColor?: string;
  dynastyId?: number;
  onSavePositions?: (positions: { characterId: number; graphX: number; graphY: number }[]) => void;
}

export const FamilyTree: React.FC<FamilyTreeProps> = ({
  members, familyLinks, dynastyColor, onSavePositions,
}) => {
  const theme = useTheme();
  const { t } = useTranslation(['dynasties', 'common']);
  const getEdgeLabel = useCallback(
    (link: DynastyFamilyLink) =>
      link.customLabel ||
      t(`dynasties:familyRelationTypes.${link.relationType}`, { defaultValue: link.relationType }),
    [t]
  );
  const edgePalette = useMemo((): EdgePalette => ({
    primary: theme.palette.primary.main,
    spouse: theme.palette.secondary.main,
    sibling: theme.palette.info.main,
    dynastyFallback: dynastyColor,
    edgeLabelFill: alpha(theme.palette.common.white, 0.6),
    edgeLabelBg: alpha(theme.palette.background.paper, 0.9),
  }), [theme, dynastyColor]);

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => buildLayout(members, familyLinks, edgePalette, getEdgeLabel),
    [members, familyLinks, edgePalette, getEdgeLabel]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  useEffect(() => {
    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [layoutNodes, layoutEdges, setNodes, setEdges]);

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);

    const hasDrag = changes.some(c => c.type === 'position' && c.dragging === false);
    if (hasDrag && onSavePositions) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const positions = nodesRef.current.map(n => ({
          characterId: parseInt(n.id),
          graphX: n.position.x,
          graphY: n.position.y,
        }));
        onSavePositions(positions);
      }, 500);
    }
  }, [onNodesChange, onSavePositions]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  if (members.length === 0) return null;

  const treeHeight = Math.max(350, Math.min(members.length * 70 + 100, 600));

  return (
    <Box sx={{
      height: treeHeight,
      borderRadius: 2,
      overflow: 'hidden',
      backgroundColor: alpha(theme.palette.common.black, 0.25),
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      position: 'relative',
      '& .react-flow__renderer': { backgroundColor: 'transparent' },
      '& .react-flow__edge-path': { strokeLinecap: 'round' },
    }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.35 }}
        minZoom={0.2}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
      >
        <Background color={alpha(theme.palette.primary.main, 0.04)} gap={24} size={1} />
      </ReactFlow>

      <Box sx={{
        position: 'absolute', top: 8, right: 8, zIndex: 10,
        display: 'flex', gap: 1.5,
        px: 1.5, py: 0.75,
        backgroundColor: alpha(theme.palette.background.paper, 0.85),
        borderRadius: 1.5,
        border: `1px solid ${alpha(theme.palette.common.white, 0.06)}`,
      }}>
        <Box display="flex" alignItems="center" gap={0.5}>
          <Box sx={{ width: 14, height: 2, backgroundColor: theme.palette.primary.main, borderRadius: 1 }} />
          <Typography sx={{ fontSize: '0.55rem', color: alpha(theme.palette.text.secondary, 0.95) }}>{t('dynasties:tree.legendParent')}</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={0.5}>
          <Box sx={{ width: 14, height: 2, backgroundColor: theme.palette.secondary.main, borderRadius: 1 }} />
          <Typography sx={{ fontSize: '0.55rem', color: alpha(theme.palette.text.secondary, 0.95) }}>{t('dynasties:tree.legendSpouse')}</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={0.5}>
          <Box sx={{ width: 14, height: 0, borderTop: `2px dashed ${theme.palette.info.main}` }} />
          <Typography sx={{ fontSize: '0.55rem', color: alpha(theme.palette.text.secondary, 0.95) }}>{t('dynasties:tree.legendSibling')}</Typography>
        </Box>
      </Box>
    </Box>
  );
};
