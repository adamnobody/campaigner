import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, List, ListItemButton, ListItemIcon,
  ListItemText, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Button, Paper,
  Breadcrumbs, Link as MuiLink,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import HomeIcon from '@mui/icons-material/Home';
import { useParams, useNavigate } from 'react-router-dom';
import { useNoteStore } from '@/store/useNoteStore';
import { useFolderStore } from '@/store/useFolderStore';
import { useUIStore } from '@/store/useUIStore';
import { DndButton } from '@/components/ui/DndButton';
import { EmptyState } from '@/components/ui/EmptyState';

export const FilesPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const navigate = useNavigate();

  const { notes, fetchNotes, createNote } = useNoteStore();
  const {
    folders,
    currentFolderId,
    fetchFolders,
    createFolder,
    deleteFolder,
    setCurrentFolderId,
  } = useFolderStore();
  const { showSnackbar, showConfirmDialog } = useUIStore();

  const [breadcrumbs, setBreadcrumbs] = useState<{ id: number | null; name: string }[]>([
    { id: null, name: 'Root' },
  ]);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    fetchFolders(pid);
  }, [pid, fetchFolders]);

  useEffect(() => {
    fetchNotes(pid, { folderId: currentFolderId, limit: 100 });
  }, [pid, currentFolderId, fetchNotes]);

  const currentSubfolders = useMemo(() => {
    return folders.filter((f) =>
      currentFolderId === null ? !f.parentId : f.parentId === currentFolderId
    );
  }, [folders, currentFolderId]);

  const handleNavigateToFolder = (folderId: number | null, folderName: string) => {
    setCurrentFolderId(folderId);

    if (folderId === null) {
      setBreadcrumbs([{ id: null, name: 'Root' }]);
      return;
    }

    const existingIdx = breadcrumbs.findIndex((b) => b.id === folderId);
    if (existingIdx >= 0) {
      setBreadcrumbs(breadcrumbs.slice(0, existingIdx + 1));
    } else {
      setBreadcrumbs([...breadcrumbs, { id: folderId, name: folderName }]);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await createFolder({
        projectId: pid,
        name: newFolderName.trim(),
        parentId: currentFolderId,
      });

      setFolderDialogOpen(false);
      setNewFolderName('');
      await fetchFolders(pid);
      showSnackbar('Folder created', 'success');
    } catch {
      showSnackbar('Failed to create folder', 'error');
    }
  };

  const handleDeleteFolder = (id: number, name: string) => {
    showConfirmDialog('Delete Folder', `Delete folder "${name}" and all its contents?`, async () => {
      try {
        await deleteFolder(id);
        await fetchFolders(pid);

        if (currentFolderId === id) {
          setCurrentFolderId(null);
          setBreadcrumbs([{ id: null, name: 'Root' }]);
        }

        showSnackbar('Folder deleted', 'success');
      } catch {
        showSnackbar('Failed', 'error');
      }
    });
  };

  const handleCreateNoteInFolder = async () => {
    try {
      const note = await createNote({
        projectId: pid,
        title: 'Untitled Note',
        content: '',
        format: 'md',
        noteType: 'note',
        folderId: currentFolderId,
        isPinned: false,
      });

      showSnackbar('Note created', 'success');
      navigate(`/project/${pid}/notes/${note.id}`);
    } catch {
      showSnackbar('Failed', 'error');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h3">Files</Typography>
        <Box display="flex" gap={1}>
          <DndButton
            variant="outlined"
            startIcon={<CreateNewFolderIcon />}
            onClick={() => setFolderDialogOpen(true)}
          >
            New Folder
          </DndButton>
          <DndButton
            variant="contained"
            startIcon={<NoteAddIcon />}
            onClick={handleCreateNoteInFolder}
          >
            New Note Here
          </DndButton>
        </Box>
      </Box>

      <Breadcrumbs sx={{ mb: 2 }}>
        {breadcrumbs.map((bc, idx) => (
          <MuiLink
            key={`${bc.id ?? 'root'}-${idx}`}
            component="button"
            underline="hover"
            color={idx === breadcrumbs.length - 1 ? 'text.primary' : 'inherit'}
            onClick={() => handleNavigateToFolder(bc.id, bc.name)}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            {bc.id === null && <HomeIcon fontSize="small" />}
            {bc.name}
          </MuiLink>
        ))}
      </Breadcrumbs>

      <Paper>
        {currentSubfolders.length === 0 && notes.length === 0 ? (
          <EmptyState
            icon={<FolderIcon sx={{ fontSize: 64 }} />}
            title="Empty folder"
            description="Create folders to organize your notes and files"
          />
        ) : (
          <List>
            {currentSubfolders.map((folder) => (
              <ListItemButton
                key={`folder-${folder.id}`}
                onClick={() => handleNavigateToFolder(folder.id, folder.name)}
              >
                <ListItemIcon>
                  <FolderIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary={folder.name} />
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFolder(folder.id, folder.name);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItemButton>
            ))}

            {notes.map((note) => (
              <ListItemButton
                key={`note-${note.id}`}
                onClick={() => navigate(`/project/${pid}/notes/${note.id}`)}
              >
                <ListItemIcon>
                  <DescriptionIcon />
                </ListItemIcon>
                <ListItemText
                  primary={note.title}
                  secondary={`${note.format.toUpperCase()} · ${new Date(note.updatedAt).toLocaleDateString()}`}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Paper>

      <Dialog open={folderDialogOpen} onClose={() => setFolderDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Folder Name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            margin="normal"
            placeholder="e.g. Session Notes"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFolderDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <DndButton variant="contained" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
            Create
          </DndButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};