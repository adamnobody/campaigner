import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardActions,
  CardMedia, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Chip, IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/store/useProjectStore';
import { useUIStore } from '@/store/useUIStore';
import { DndButton } from '@/components/ui/DndButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { projects, loading, fetchProjects, createProject, deleteProject } = useProjectStore();
  const { showSnackbar, showConfirmDialog } = useUIStore();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const project = await createProject({ name: newName.trim(), description: newDescription.trim()});
      setCreateDialogOpen(false);
      setNewName('');
      setNewDescription('');
      showSnackbar('Project created!', 'success');
      navigate(`/project/${project.id}/map`);
    } catch {
      showSnackbar('Failed to create project', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (id: number, name: string) => {
    showConfirmDialog(
      'Delete Project',
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      async () => {
        try {
          await deleteProject(id);
          showSnackbar('Project deleted', 'success');
        } catch {
          showSnackbar('Failed to delete project', 'error');
        }
      }
    );
  };

  if (loading && projects.length === 0) return <LoadingScreen message="Loading campaigns..." />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h2" color="primary">
            Your Campaigns
          </Typography>
          <Typography variant="body1" color="text.secondary" mt={1}>
            Create and manage your D&D worlds
          </Typography>
        </Box>
        <DndButton
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          size="large"
        >
          New Campaign
        </DndButton>
      </Box>

      {projects.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          description="Create your first campaign to start building your world!"
          actionLabel="Create Campaign"
          onAction={() => setCreateDialogOpen(true)}
        />
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.2s' },
                }}
                onClick={() => navigate(`/project/${project.id}/map`)}
              >
                {project.mapImagePath ? (
                  <CardMedia
                    component="img"
                    height="180"
                    image={project.mapImagePath}
                    alt={project.name}
                    sx={{ objectFit: 'cover' }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 180,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%)',
                    }}
                  >
                    <Typography variant="h1" sx={{ opacity: 0.3 }}>🗺️</Typography>
                  </Box>
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" gutterBottom>
                    {project.name}
                  </Typography>
                  {project.description && (
                    <Typography variant="body2" color="text.secondary" sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {project.description}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Chip
                    label={project.status}
                    size="small"
                    color={project.status === 'active' ? 'success' : 'default'}
                  />
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(project.id, project.name);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>Create New Campaign</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Campaign Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            margin="normal"
            placeholder="e.g. The Lost Mines of Phandelver"
          />
          <TextField
            fullWidth
            label="Description"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
            placeholder="Brief description of your campaign..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)} color="inherit">Cancel</Button>
          <DndButton
            variant="contained"
            onClick={handleCreate}
            loading={creating}
            disabled={!newName.trim()}
          >
            Create
          </DndButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};