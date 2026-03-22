import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Paper,
  Chip,
  Container,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import PaletteIcon from '@mui/icons-material/Palette';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/store/useProjectStore';
import { useUIStore } from '@/store/useUIStore';
import { projectsApi } from '@/api/axiosClient';
import { DndButton } from '@/components/ui/DndButton';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { usePreferencesStore } from '@/store/usePreferencesStore';

export const HomePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { projects, loading, fetchProjects, createProject, deleteProject } = useProjectStore();
  const { showSnackbar, showConfirmDialog } = useUIStore();
  const { homeBackgroundImage, homeBackgroundOpacity } = usePreferencesStore();

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
      const project = await createProject({
        name: newName.trim(),
        description: newDescription.trim(),
      });

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

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.version || !data.project) {
          showSnackbar('Неверный формат файла. Ожидается экспорт Campaigner.', 'error');
          return;
        }

        const res = await projectsApi.importProject(data);
        showSnackbar(`Проект "${res.data.data.name}" импортирован!`, 'success');
        fetchProjects();
        navigate(`/project/${res.data.data.id}/map`);
      } catch (err: any) {
        if (err instanceof SyntaxError) {
          showSnackbar('Файл не является валидным JSON', 'error');
        } else {
          showSnackbar(err.message || 'Ошибка импорта', 'error');
        }
      }
    };

    input.click();
  };

  if (loading && projects.length === 0) {
    return <LoadingScreen message="Загрузка кампаний..." />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {homeBackgroundImage && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 0,
            pointerEvents: 'none',
            backgroundImage: `url(${homeBackgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: homeBackgroundOpacity,
            transform: 'scale(1.02)',
          }}
        />
      )}

      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background: `
            radial-gradient(circle at 15% 20%, ${alpha(theme.palette.primary.main, 0.16)} 0%, transparent 28%),
            radial-gradient(circle at 85% 18%, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 24%),
            radial-gradient(circle at 50% 75%, rgba(255,255,255,0.04) 0%, transparent 22%)
          `,
        }}
      />

      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background: homeBackgroundImage
            ? `
              linear-gradient(
                180deg,
                ${alpha(theme.palette.background.default, 0.84)} 0%,
                ${alpha(theme.palette.background.default, 0.62)} 45%,
                ${alpha(theme.palette.background.default, 0.92)} 100%
              )
            `
            : `
              linear-gradient(
                180deg,
                ${alpha(theme.palette.background.default, 0.78)} 0%,
                ${alpha(theme.palette.background.default, 0.58)} 45%,
                ${alpha(theme.palette.background.default, 0.9)} 100%
              )
            `,
        }}
      />

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Container maxWidth="md" sx={{ pt: { xs: 5, md: 7 }, pb: 2 }}>
          <Typography
            sx={{
              fontFamily: '"Cinzel", serif',
              fontWeight: 700,
              fontSize: { xs: '2.4rem', md: '3.6rem' },
              color: 'text.primary',
              lineHeight: 1.05,
              letterSpacing: '0.02em',
            }}
          >
            Campaigner
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              mt: 1.5,
              maxWidth: 720,
              fontSize: { xs: '1rem', md: '1.05rem' },
            }}
          >
            Среда для создания интерактивных карт, заметок, связей и истории вашего мира.
          </Typography>
        </Container>

        <Container maxWidth="md" sx={{ pt: 3, pb: 4, flexGrow: 1 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            mb={2.5}
            gap={2}
            flexWrap="wrap"
          >
            <Typography
              variant="h5"
              sx={{
                fontFamily: '"Cinzel", serif',
                fontWeight: 600,
                color: 'text.primary',
              }}
            >
              Проекты
            </Typography>

            <Box display="flex" gap={1} flexWrap="wrap">
              <DndButton
                variant="outlined"
                startIcon={<PaletteIcon />}
                onClick={() => navigate('/appearance')}
                sx={{
                  fontWeight: 600,
                  letterSpacing: '0.03em',
                }}
              >
                Внешний вид
              </DndButton>

              <DndButton
                variant="outlined"
                startIcon={<FileUploadIcon />}
                onClick={handleImportClick}
                sx={{
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
              >
                Импорт
              </DndButton>

              <DndButton
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
                sx={{
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                Создать проект
              </DndButton>
            </Box>
          </Box>

          <Box display="flex" flexDirection="column" gap={1.5}>
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
                  borderRadius: 3,
                  minWidth: 0,
                  backgroundColor: alpha(theme.palette.background.paper, homeBackgroundImage ? 0.82 : 0.9),
                  border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                  transition: 'all 0.22s ease',
                  transform: 'translateY(0)',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    borderColor: alpha(theme.palette.primary.main, 0.45),
                    boxShadow: `0 14px 32px ${alpha(theme.palette.common.black, 0.28)}`,
                  },
                }}
              >
                <Box sx={{ minWidth: 0, flexGrow: 1, pr: 2 }}>
                  <Typography
                    sx={{
                      fontFamily: '"Cinzel", serif',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      color: 'text.primary',
                    }}
                    noWrap
                  >
                    {project.name}
                  </Typography>

                  <Box display="flex" alignItems="center" gap={1.5} mt={0.75} flexWrap="wrap">
                    <Chip
                      label={project.status === 'active' ? 'Активный' : String(project.status)}
                      size="small"
                      sx={{
                        backgroundColor: alpha(theme.palette.primary.main, 0.14),
                        color: theme.palette.primary.main,
                        fontSize: '0.72rem',
                        height: 22,
                        fontWeight: 700,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                      }}
                    />

                    {project.description && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.78rem',
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
                    color: alpha(theme.palette.text.primary, 0.28),
                    flexShrink: 0,
                    ml: 2,
                    transition: 'color 0.2s ease, background-color 0.2s ease',
                    '&:hover': {
                      color: theme.palette.error.main,
                      backgroundColor: alpha(theme.palette.error.main, 0.08),
                    },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Paper>
            ))}
          </Box>

          {projects.length === 0 && (
            <Paper
              elevation={0}
              sx={{
                mt: 1,
                textAlign: 'center',
                py: 8,
                px: 3,
                borderRadius: 3,
                backgroundColor: alpha(theme.palette.background.paper, homeBackgroundImage ? 0.74 : 0.72),
                border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
              }}
            >
              <Typography variant="h6" sx={{ color: 'text.primary' }}>
                Нет проектов
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                Создайте первый проект или импортируйте его из JSON.
              </Typography>
            </Paper>
          )}
        </Container>

        <Box sx={{ flexGrow: 1 }} />

        <Container maxWidth="md">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 2.5,
              gap: 2,
              flexWrap: 'wrap',
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontFamily: '"Cinzel", serif',
                  fontWeight: 600,
                  color: 'text.primary',
                  fontSize: '0.95rem',
                }}
              >
                Campaigner
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Среда для создания интерактивных карт вашего мира
              </Typography>
            </Box>

            <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.9) }}>
              © {new Date().getFullYear()}
            </Typography>
          </Box>
        </Container>
      </Box>

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>
          Создать новый проект
        </DialogTitle>

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