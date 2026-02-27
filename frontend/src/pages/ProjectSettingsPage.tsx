import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/store/useProjectStore';
import { useUIStore } from '@/store/useUIStore';
import { PROJECT_STATUSES } from '@campaigner/shared';
import { DndButton } from '@/components/ui/DndButton';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export const ProjectSettingsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const navigate = useNavigate();
  const { currentProject, fetchProject, updateProject, deleteProject } = useProjectStore();
  const { showSnackbar, showConfirmDialog } = useUIStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<string>('active');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProject(pid);
  }, [pid, fetchProject]);

  useEffect(() => {
    if (currentProject) {
      setName(currentProject.name);
      setDescription(currentProject.description || '');
      setStatus(currentProject.status);
    }
  }, [currentProject]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProject(pid, { name, description, status: status as any });
      showSnackbar('Project updated', 'success');
    } catch {
      showSnackbar('Failed to update', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    showConfirmDialog(
      'Delete Project',
      `Are you absolutely sure you want to delete "${currentProject?.name}"? This will remove ALL data including characters, notes, maps, and timeline events. This action CANNOT be undone.`,
      async () => {
        try {
          await deleteProject(pid);
          showSnackbar('Project deleted', 'success');
          navigate('/');
        } catch {
          showSnackbar('Failed to delete', 'error');
        }
      }
    );
  };

  if (!currentProject) return <LoadingScreen />;

  return (
    <Box maxWidth={700}>
      <Typography variant="h3" mb={3}>Project Settings</Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" mb={2}>General</Typography>
        <TextField
          fullWidth
          label="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
        />
        <TextField
          fullWidth
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
          multiline
          rows={3}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
            {PROJECT_STATUSES.map(s => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box display="flex" justifyContent="flex-end" mt={2}>
          <DndButton
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            loading={saving}
          >
            Save Changes
          </DndButton>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, border: '1px solid', borderColor: 'error.main' }}>
        <Typography variant="h5" color="error" mb={1}>Danger Zone</Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Deleting a project is permanent and removes all associated data.
        </Typography>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteForeverIcon />}
          onClick={handleDelete}
        >
          Delete Project
        </Button>
      </Paper>
    </Box>
  );
};