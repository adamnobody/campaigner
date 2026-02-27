import React, { useEffect, useCallback, useMemo, useState } from 'react';
import {
  Box, Typography, Paper, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, Button,
  TextField, Select, MenuItem, FormControl, InputLabel,
  FormControlLabel, Checkbox,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams, useNavigate } from 'react-router-dom';
import { useCharacterStore } from '@/store/useCharacterStore';
import { useUIStore } from '@/store/useUIStore';
import { RELATIONSHIP_TYPES } from '@campaigner/shared';
import { DndButton } from '@/components/ui/DndButton';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

const relationshipColors: Record<string, string> = {
  ally: '#82E0AA',
  enemy: '#FF6B6B',
  family: '#85C1E9',
  friend: '#F7DC6F',
  rival: '#F0B27A',
  mentor: '#BB8FCE',
  student: '#AED6F1',
  lover: '#F1948A',
  spouse: '#D7BDE2',
  employer: '#A9CCE3',
  employee: '#A3E4D7',
  custom: '#BFC9CA',
};

export const CharacterGraphPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const navigate = useNavigate();
  const {
    characters, graph, relationships,
    fetchCharacters, fetchGraph, fetchRelationships,
    createRelationship, deleteRelationship,
  } = useCharacterStore();
  const { showSnackbar, showConfirmDialog } = useUIStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sourceId, setSourceId] = useState<number | ''>('');
  const [targetId, setTargetId] = useState<number | ''>('');
  const [relType, setRelType] = useState<string>('ally');
  const [customLabel, setCustomLabel] = useState('');
  const [isBidirectional, setIsBidirectional] = useState(true);

  useEffect(() => {
    fetchCharacters(pid, { limit: 200 });
    fetchGraph(pid);
    fetchRelationships(pid);
  }, [pid, fetchCharacters, fetchGraph, fetchRelationships]);

  useEffect(() => {
    if (!graph) return;

    const flowNodes: Node[] = graph.nodes.map((node, index) => {
      // Располагаем по кругу
      const angle = (2 * Math.PI * index) / graph.nodes.length;
      const radius = 300;
      return {
        id: String(node.id),
        position: {
          x: 400 + radius * Math.cos(angle),
          y: 400 + radius * Math.sin(angle),
        },
        data: {
          label: (
            <Box sx={{ textAlign: 'center', p: 0.5 }}>
              <Typography variant="body2" fontWeight={600}>{node.name}</Typography>
              {node.title && (
                <Typography variant="caption" color="text.secondary">{node.title}</Typography>
              )}
              <Chip
                label={node.status}
                size="small"
                sx={{ mt: 0.5, fontSize: '0.65rem' }}
              />
            </Box>
          ),
        },
        style: {
          background: '#1A1A2E',
          border: '2px solid #C9A959',
          borderRadius: 8,
          padding: 8,
          minWidth: 120,
        },
      };
    });

    const flowEdges: Edge[] = graph.edges.map(edge => ({
      id: String(edge.id),
      source: String(edge.source),
      target: String(edge.target),
      label: edge.customLabel || edge.relationshipType,
      style: { stroke: relationshipColors[edge.relationshipType] || '#BFC9CA', strokeWidth: 2 },
      labelStyle: { fill: '#E8E8E8', fontSize: 11, fontWeight: 500 },
      labelBgStyle: { fill: '#1A1A2E', fillOpacity: 0.8 },
      markerEnd: edge.isBidirectional ? undefined : { type: MarkerType.ArrowClosed },
      animated: edge.relationshipType === 'enemy',
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [graph, setNodes, setEdges]);

  const handleAddRelationship = async () => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    try {
      await createRelationship({
        projectId: pid,
        sourceCharacterId: sourceId as number,
        targetCharacterId: targetId as number,
        relationshipType: relType as any,
        customLabel,
        isBidirectional,
        description: '',
      });
      showSnackbar('Relationship created', 'success');
      setDialogOpen(false);
      fetchGraph(pid);
      // Reset form
      setSourceId('');
      setTargetId('');
      setRelType('ally');
      setCustomLabel('');
      setIsBidirectional(true);
    } catch {
      showSnackbar('Failed to create relationship', 'error');
    }
  };

  const handleEdgeClick = useCallback((_: any, edge: Edge) => {
    showConfirmDialog(
      'Delete Relationship',
      'Remove this relationship?',
      async () => {
        try {
          await deleteRelationship(parseInt(edge.id));
          showSnackbar('Relationship removed', 'success');
          fetchGraph(pid);
        } catch {
          showSnackbar('Failed to delete', 'error');
        }
      }
    );
  }, [deleteRelationship, fetchGraph, pid, showConfirmDialog, showSnackbar]);

  if (!graph) return <LoadingScreen />;

  return (
    <Box sx={{ height: 'calc(100vh - 140px)' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate(`/project/${pid}/characters`)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h3">Relationship Graph</Typography>
        </Box>
        <DndButton variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          Add Relationship
        </DndButton>
      </Box>

      {/* Legend */}
      <Box display="flex" gap={1} mb={2} flexWrap="wrap">
        {Object.entries(relationshipColors).map(([type, color]) => (
          <Chip
            key={type}
            label={type}
            size="small"
            sx={{ backgroundColor: color, color: '#000', fontWeight: 600 }}
          />
        ))}
      </Box>

      <Paper sx={{ height: 'calc(100% - 80px)', borderRadius: 2, overflow: 'hidden' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgeClick={handleEdgeClick}
          fitView
          attributionPosition="bottom-left"
        >
          <Background color="#333" gap={20} />
          <Controls />
          <MiniMap
            nodeColor="#C9A959"
            maskColor="rgba(0, 0, 0, 0.7)"
            style={{ backgroundColor: '#0F0F1A' }}
          />
        </ReactFlow>
      </Paper>

      {/* Add Relationship Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Relationship</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>From Character</InputLabel>
            <Select
              value={sourceId}
              label="From Character"
              onChange={(e) => setSourceId(e.target.value as number)}
            >
              {characters.map(c => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>To Character</InputLabel>
            <Select
              value={targetId}
              label="To Character"
              onChange={(e) => setTargetId(e.target.value as number)}
            >
              {characters.filter(c => c.id !== sourceId).map(c => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Relationship Type</InputLabel>
            <Select value={relType} label="Relationship Type" onChange={(e) => setRelType(e.target.value)}>
              {RELATIONSHIP_TYPES.map(t => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Custom Label (optional)"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            margin="normal"
            placeholder="e.g. Blood brothers"
          />

          <FormControlLabel
            control={<Checkbox checked={isBidirectional} onChange={(e) => setIsBidirectional(e.target.checked)} />}
            label="Bidirectional (mutual relationship)"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancel</Button>
          <DndButton
            variant="contained"
            onClick={handleAddRelationship}
            disabled={!sourceId || !targetId || sourceId === targetId}
          >
            Add
          </DndButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};