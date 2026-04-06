import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Container,
  Avatar,
  Fade,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import PaletteIcon from '@mui/icons-material/Palette';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/store/useProjectStore';
import { useUIStore } from '@/store/useUIStore';
import { projectsApi } from '@/api/projects';
import { DndButton } from '@/components/ui/DndButton';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { shallow } from 'zustand/shallow';
import { HomeBackground } from '@/pages/home/HomeBackground';
import { CreateProjectDialog } from '@/pages/home/CreateProjectDialog';
import { GlassCard, EmptyStateIllustration } from '@/pages/home/HomePrimitives';

export const HomePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { projects, loading, fetchProjects, createProject, deleteProject } = useProjectStore((state) => ({
    projects: state.projects,
    loading: state.loading,
    fetchProjects: state.fetchProjects,
    createProject: state.createProject,
    deleteProject: state.deleteProject,
  }), shallow);
  const { showSnackbar, showConfirmDialog } = useUIStore((state) => ({
    showSnackbar: state.showSnackbar,
    showConfirmDialog: state.showConfirmDialog,
  }), shallow);
  const { homeBackgroundImage, homeBackgroundOpacity } = usePreferencesStore((state) => ({
    homeBackgroundImage: state.homeBackgroundImage,
    homeBackgroundOpacity: state.homeBackgroundOpacity,
  }), shallow);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const startOnboarding = useOnboardingStore((state) => state.startForProject);

  useEffect(() => {
    fetchProjects();
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, [fetchProjects]);

  const handleCreateSubmit = async (name: string, description: string) => {
    const project = await createProject({ name, description });
    setCreateDialogOpen(false);
    showSnackbar('✨ Проект создан!', 'success');
    navigate(`/project/${project.id}/map`);
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
        showSnackbar(`📥 Проект "${res.data.data.name}" импортирован!`, 'success');
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

  const handleCreateTutorialProject = async () => {
    try {
      const res = await projectsApi.createDemoProject();
      const project = res.data.data;
      showSnackbar('Обучающая кампания создана', 'success');
      startOnboarding(project.id);
      navigate(`/project/${project.id}/map`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Не удалось создать обучающую кампанию';
      showSnackbar(message, 'error');
    }
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
        background: theme.palette.background.default,
      }}
    >
      {/* Atmospheric Background */}
      <HomeBackground
        homeBackgroundImage={homeBackgroundImage}
        homeBackgroundOpacity={homeBackgroundOpacity}
      />

      {/* Main Content */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Hero Section with Animation */}
        <Container maxWidth="md" sx={{ pt: { xs: 6, md: 10 }, pb: 3 }}>
          <Box
            sx={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Logo / Title with Glow Effect */}
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Typography
                sx={{
                  fontFamily: theme.typography.h1.fontFamily,
                  fontWeight: 900,
                  fontSize: { xs: '2.8rem', md: '4.5rem' },
                  background: `linear-gradient(135deg, 
                    ${theme.palette.text.primary} 0%, 
                    ${theme.palette.primary.main} 50%, 
                    ${theme.palette.text.primary} 100%
                  )`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.1,
                  letterSpacing: '0.03em',
                  textShadow: `0 0 40px ${alpha(theme.palette.primary.main, 0.3)}`,
                  position: 'relative',
                  '&::after': {
                    content: '"Campaigner"',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    background: `linear-gradient(135deg, 
                      ${theme.palette.text.primary} 0%, 
                      ${theme.palette.primary.main} 50%, 
                      ${theme.palette.text.primary} 100%
                    )`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    opacity: 0.3,
                    filter: 'blur(8px)',
                    transform: 'translateX(4px)',
                  },
                }}
              >
                Campaigner
              </Typography>

              {/* Decorative Line */}
              <Box
                sx={{
                  mt: 1.5,
                  width: 120,
                  height: 3,
                  background: `linear-gradient(90deg, 
                    ${theme.palette.primary.main} 0%, 
                    transparent 100%
                  )`,
                  borderRadius: 2,
                  boxShadow: `0 0 10px ${theme.palette.primary.main}`,
                }}
              />
            </Box>

            {/* Subtitle */}
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                mt: 2.5,
                maxWidth: 700,
                fontSize: { xs: '1.05rem', md: '1.15rem' },
                lineHeight: 1.6,
                letterSpacing: '0.01em',
                opacity: isLoaded ? 1 : 0,
                transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${0.2}s`,
              }}
            >
              Среда для создания интерактивных карт, заметок, связей и истории вашего мира.
              <Box
                component="span"
                sx={{
                  color: 'primary.main',
                  fontWeight: 600,
                  ml: 0.5,
                }}
              >
                ✦
              </Box>
            </Typography>
          </Box>
        </Container>

        {/* Projects Section */}
        <Container maxWidth="md" sx={{ pt: 4, pb: 4, flexGrow: 1 }}>
          {/* Section Header with Actions */}
          <Box
            sx={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
              transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${0.3}s`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              mb: 3,
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: theme.typography.h5.fontFamily,
                  fontWeight: 700,
                  color: 'text.primary',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    display: 'inline-block',
                    width: 4,
                    height: 24,
                    borderRadius: 2,
                    background: `linear-gradient(180deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  }}
                />
                Проекты
                <Chip
                  label={projects.length}
                  size="small"
                  sx={{
                    ml: 1,
                    backgroundColor: alpha(theme.palette.primary.main, 0.15),
                    color: theme.palette.primary.main,
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    height: 24,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                  }}
                />
              </Typography>
            </Box>

            <Box display="flex" gap={1.5} flexWrap="wrap">
              <DndButton
                variant="outlined"
                startIcon={<PaletteIcon />}
                onClick={() => navigate('/appearance')}
                sx={{
                  fontWeight: 600,
                  letterSpacing: '0.03em',
                  borderColor: alpha(theme.palette.secondary.main, 0.4),
                  color: 'text.secondary',
                  '&:hover': {
                    borderColor: theme.palette.secondary.main,
                    backgroundColor: alpha(theme.palette.secondary.main, 0.08),
                    transform: 'translateY(-2px)',
                  },
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
                  borderColor: alpha(theme.palette.info.main, 0.4),
                  color: 'text.secondary',
                  '&:hover': {
                    borderColor: theme.palette.info.main,
                    backgroundColor: alpha(theme.palette.info.main, 0.08),
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Импорт
              </DndButton>
              <DndButton
                variant="outlined"
                onClick={handleCreateTutorialProject}
                sx={{
                  fontWeight: 600,
                  letterSpacing: '0.03em',
                }}
              >
                Обучение
              </DndButton>

              <DndButton
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
                sx={{
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.4)}`,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.5)}`,
                  },
                }}
              >
                Создать проект
              </DndButton>
            </Box>
          </Box>

          {/* Projects List with Staggered Animation */}
          <Box display="flex" flexDirection="column" gap={2}>
            {projects.map((project, index) => (
              <GlassCard
                key={project.id}
                onClick={() => navigate(`/project/${project.id}/map`)}
                sx={{
                  opacity: isLoaded ? 1 : 0,
                  transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
                  transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${0.4 + index * 0.1}s`,
                  px: 3.5,
                  py: 2.8,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0 }}>
                  <Box sx={{ minWidth: 0, flexGrow: 1, pr: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Avatar
                        sx={{
                          width: 42,
                          height: 42,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                          fontFamily: theme.typography.h6.fontFamily,
                          fontWeight: 800,
                          fontSize: '1.1rem',
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                        }}
                      >
                        {project.name.charAt(0).toUpperCase()}
                      </Avatar>

                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontFamily: theme.typography.h6.fontFamily,
                            fontWeight: 700,
                            fontSize: '1.2rem',
                            color: 'text.primary',
                            letterSpacing: '0.02em',
                            transition: 'color 0.3s ease',
                            '.MuiPaper-root:hover &': {
                              color: theme.palette.primary.main,
                            },
                          }}
                          noWrap
                        >
                          {project.name}
                        </Typography>
                      </Box>
                    </Box>

                    <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                      <Chip
                        label={
                          project.status === 'active'
                            ? '⚡ Активный'
                            : String(project.status)
                        }
                        size="small"
                        sx={{
                          backgroundColor: alpha(theme.palette.success.main, 0.12),
                          color: theme.palette.success.main,
                          fontSize: '0.72rem',
                          height: 24,
                          fontWeight: 700,
                          border: `1px solid ${alpha(theme.palette.success.main, 0.25)}`,
                          letterSpacing: '0.03em',
                        }}
                      />

                      {project.description && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontSize: '0.82rem',
                            lineHeight: 1.4,
                            maxWidth: 400,
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
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
                      color: alpha(theme.palette.text.primary, 0.25),
                      flexShrink: 0,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        color: theme.palette.error.main,
                        backgroundColor: alpha(theme.palette.error.main, 0.1),
                        transform: 'scale(1.1) rotate(90deg)',
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </GlassCard>
            ))}
          </Box>

          {/* Enhanced Empty State */}
          {projects.length === 0 && (
            <GlassCard
              sx={{
                mt: 2,
                textAlign: 'center',
                py: 8,
                px: 4,
                opacity: isLoaded ? 1 : 0,
                transition: `all 0.8s ease ${0.6}s`,
              }}
            >
              <EmptyStateIllustration />

              <Typography
                variant="h5"
                sx={{
                  fontFamily: theme.typography.h5.fontFamily,
                  fontWeight: 700,
                  color: 'text.primary',
                  mb: 1,
                  letterSpacing: '0.02em',
                }}
              >
                Ваш мир ждёт своего творца
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: 'text.secondary',
                  mb: 3,
                  maxWidth: 420,
                  mx: 'auto',
                  lineHeight: 1.6,
                }}
              >
                Создайте первый проект, чтобы начать увлекательное путешествие по построению вашей вселенной.
              </Typography>

              <DndButton
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontWeight: 700,
                  fontSize: '1rem',
                  letterSpacing: '0.05em',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.5)}`,
                  },
                }}
              >
                ⚔️ Создать первый проект
              </DndButton>
              <DndButton
                variant="outlined"
                size="large"
                onClick={handleCreateTutorialProject}
                sx={{ mt: 1.5, px: 4, py: 1.5, fontWeight: 700, fontSize: '1rem' }}
              >
                🎓 Обучающая кампания
              </DndButton>
            </GlassCard>
          )}
        </Container>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Footer with Glass Effect */}
        <Fade in={isLoaded} timeout={1000}>
          <Container maxWidth="md">
            <GlassCard
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 2.5,
                px: 3,
                mb: 2,
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                borderLeft: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                borderRadius: 0,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: 'primary.main',
                    fontFamily: theme.typography.h6.fontFamily,
                    fontSize: '0.85rem',
                    fontWeight: 800,
                  }}
                >
                  C
                </Avatar>
                <Box>
                  <Typography
                    sx={{
                      fontFamily: theme.typography.h6.fontFamily,
                      fontWeight: 700,
                      color: 'text.primary',
                      fontSize: '0.95rem',
                      lineHeight: 1.2,
                    }}
                  >
                    Campaigner
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                    Среда для создания миров
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: alpha(theme.palette.text.secondary, 0.7),
                    fontSize: '0.72rem',
                    letterSpacing: '0.03em',
                  }}
                >
                  © {new Date().getFullYear()} · Сделано с ✦ для творцов
                </Typography>
              </Box>
            </GlassCard>
          </Container>
        </Fade>
      </Box>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateSubmit}
      />
    </Box>
  );
};
