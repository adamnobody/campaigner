import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, Paper, Chip, Container,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/store/useProjectStore';
import { useUIStore } from '@/store/useUIStore';
import { useStyleStore } from '@/store/useStyleStore';
import { DndButton } from '@/components/ui/DndButton';
import { StyleCustomizer } from '@/components/ui/StyleCustomizer';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { projects, loading, fetchProjects, createProject, deleteProject } = useProjectStore();
  const { showSnackbar, showConfirmDialog } = useUIStore();
  const {
    backgroundImage, backgroundOpacity, accentColor,
    cardBackground, textOpacity, headerFont,
  } = useStyleStore();

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
      const project = await createProject({ name: newName.trim(), description: newDescription.trim() });
      setCreateDialogOpen(false);
      setNewName('');
      setNewDescription('');
      showSnackbar('Проект создан!', 'success');
      navigate(`/project/${project.id}/map`);
    } catch {
      showSnackbar('Не удалось создать проект', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (id: number, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirmDialog(
      'Удалить проект',
      `Вы уверены, что хотите удалить "${name}"? Это действие нельзя отменить.`,
      async () => {
        try {
          await deleteProject(id);
          showSnackbar('Проект удалён', 'success');
        } catch {
          showSnackbar('Не удалось удалить', 'error');
        }
      }
    );
  };

  if (loading && projects.length === 0) return <LoadingScreen message="Загрузка кампаний..." />;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Background image */}
      {backgroundImage && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 0,
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: backgroundOpacity,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Overlay gradient */}
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          background: backgroundImage
            ? 'linear-gradient(to bottom, rgba(15,15,26,0.92) 0%, rgba(15,15,26,0.5) 50%, rgba(15,15,26,0.95) 100%)'
            : 'transparent',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <Box sx={{ position: 'relative', zIndex: 1, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <Container maxWidth="md" sx={{ pt: 5, pb: 1 }}>
          <Typography
            sx={{
              fontFamily: headerFont,
              fontWeight: 700,
              fontSize: { xs: '2.2rem', md: '3.2rem' },
              color: '#fff',
              lineHeight: 1.1,
            }}
          >
            Campaigner
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: `rgba(255,255,255,${textOpacity})`,
              mt: 1,
            }}
          >
            Среда для создания интерактивных карт вашего мира
          </Typography>
        </Container>

        {/* Projects section */}
        <Container maxWidth="md" sx={{ pt: 3, pb: 4, flexGrow: 1 }}>
          {/* Section header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
            <Typography
              variant="h5"
              sx={{ fontFamily: headerFont, fontWeight: 600, color: '#fff' }}
            >
              Проекты
            </Typography>
            <DndButton
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: '#fff',
                fontWeight: 600,
                letterSpacing: '0.05em',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.14)',
                  border: '1px solid rgba(255,255,255,0.3)',
                },
                boxShadow: 'none',
              }}
            >
              СОЗДАТЬ ПРОЕКТ
            </DndButton>
          </Box>

          {/* Project list */}
          <Box display="flex" flexDirection="column" gap={1.2}>
            {projects.map((project) => (
              <Paper
                key={project.id}
                elevation={0}
                onClick={() => navigate(`/project/${project.id}/map`)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 3,
                  py: 2.2,
                  cursor: 'pointer',
                  backgroundColor: cardBackground,
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 2,
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: 'translateY(0)',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    backgroundColor: 'rgba(255,255,255,0.07)',
                    borderColor: 'rgba(255,255,255,0.14)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                  },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontFamily: headerFont,
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      color: '#fff',
                    }}
                    noWrap
                  >
                    {project.name}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1.5} mt={0.6}>
                    <Chip
                      label={project.status === 'active' ? 'Active' : String(project.status)}
                      size="small"
                      sx={{
                        backgroundColor: `${accentColor}22`,
                        color: accentColor,
                        fontSize: '0.7rem',
                        height: 22,
                        fontWeight: 600,
                      }}
                    />
                    {project.description && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: `rgba(255,255,255,${textOpacity * 0.7})`,
                        }}
                        noWrap
                      >
                        {project.description}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <IconButton
                  size="small"
                  onClick={(e) => handleDelete(project.id, project.name, e)}
                  sx={{
                    color: 'rgba(255,255,255,0.2)',
                    flexShrink: 0,
                    ml: 2,
                    transition: 'color 0.2s',
                    '&:hover': { color: 'rgba(255,100,100,0.8)' },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Paper>
            ))}
          </Box>

          {projects.length === 0 && (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                color: `rgba(255,255,255,${textOpacity * 0.6})`,
              }}
            >
              <Typography variant="h6">Нет проектов</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Создайте первый проект, чтобы начать строить свой мир!
              </Typography>
            </Box>
          )}
        </Container>

        {/* Spacer — pushes footer down */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Footer */}
        <Container maxWidth="md">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 2.5,
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontFamily: headerFont,
                  fontWeight: 600,
                  color: '#fff',
                  fontSize: '0.9rem',
                }}
              >
                Campaigner
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: `rgba(255,255,255,${textOpacity * 0.7})` }}
              >
                Среда для создания интерактивных карт вашего мира
              </Typography>
            </Box>
            <Typography
              variant="caption"
              sx={{ color: `rgba(255,255,255,${textOpacity * 0.6})` }}
            >
              © {new Date().getFullYear()}
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Style Customizer button */}
      <StyleCustomizer />

      {/* Create Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a2e',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: headerFont }}>Создать новый проект</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Название кампании"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            margin="normal"
            placeholder="например, Затерянные Рудники Фанделвера"
          />
          <TextField
            fullWidth
            label="Описание"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
            placeholder="Краткое описание кампании..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)} color="inherit">
            Отмена
          </Button>
          <DndButton
            variant="contained"
            onClick={handleCreate}
            loading={creating}
            disabled={!newName.trim()}
          >
            Создать
          </DndButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};