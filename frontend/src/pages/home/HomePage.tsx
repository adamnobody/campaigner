import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Container,
  Avatar,
  Fade,
  Divider,
  Stack,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import PaletteIcon from '@mui/icons-material/Palette';
import SchoolIcon from '@mui/icons-material/School';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '@/store/useProjectStore';
import { useUIStore } from '@/store/useUIStore';
import { projectsApi } from '@/api/projects';
import { DndButton } from '@/components/ui/DndButton';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { shallow } from 'zustand/shallow';
import { HomeBackground } from '@/pages/home/components/HomeBackground';
import { CreateProjectDialog } from '@/pages/home/components/CreateProjectDialog';
import { EmptyStateIllustration } from '@/pages/home/components/HomePrimitives';
import { GlassCard } from '@/components/ui/GlassCard';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { isSupportedLanguage } from '@/i18n/language';

const HOME_PANEL_POSITION_STORAGE_KEY = 'campaigner.homePanelPosition.v1';
const DEFAULT_PANEL_OFFSET = { x: 0, y: 0 };

const readStoredPanelOffset = () => {
  if (typeof window === 'undefined') return DEFAULT_PANEL_OFFSET;
  try {
    const raw = window.localStorage.getItem(HOME_PANEL_POSITION_STORAGE_KEY);
    if (!raw) return DEFAULT_PANEL_OFFSET;
    const parsed = JSON.parse(raw) as { x?: unknown; y?: unknown };
    if (typeof parsed.x !== 'number' || typeof parsed.y !== 'number') return DEFAULT_PANEL_OFFSET;
    if (!Number.isFinite(parsed.x) || !Number.isFinite(parsed.y)) return DEFAULT_PANEL_OFFSET;
    return { x: parsed.x, y: parsed.y };
  } catch {
    return DEFAULT_PANEL_OFFSET;
  }
};

export const HomePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['projects', 'common']);
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
  const [isContainerHovered, setIsContainerHovered] = useState(true);
  const [isHoverCapable, setIsHoverCapable] = useState(false);
  const [panelOffset, setPanelOffset] = useState(readStoredPanelOffset);
  const startOnboarding = useOnboardingStore((state) => state.startForProject);
  const parallaxLayerRef = useRef<HTMLDivElement | null>(null);
  const parallaxTargetRef = useRef({ x: 0, y: 0 });
  const parallaxRafRef = useRef<number | null>(null);
  const dragStateRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  useEffect(() => {
    fetchProjects();
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, [fetchProjects]);

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    const apply = () => {
      const capable = media.matches;
      setIsHoverCapable(capable);
      setIsContainerHovered(true);
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  const applyParallaxTransform = useCallback((x: number, y: number) => {
    const layer = parallaxLayerRef.current;
    if (!layer) return;
    layer.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, []);

  const scheduleParallax = useCallback(() => {
    if (parallaxRafRef.current !== null) return;
    parallaxRafRef.current = window.requestAnimationFrame(() => {
      parallaxRafRef.current = null;
      applyParallaxTransform(parallaxTargetRef.current.x, parallaxTargetRef.current.y);
    });
  }, [applyParallaxTransform]);

  const handleRootMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!isHoverCapable) return;
    const x = (event.clientX / window.innerWidth - 0.5) * 30;
    const y = (event.clientY / window.innerHeight - 0.5) * 20;
    parallaxTargetRef.current = { x, y };
    scheduleParallax();
  }, [isHoverCapable, scheduleParallax]);

  const handleRootMouseLeave = useCallback(() => {
    if (!isHoverCapable) return;
    parallaxTargetRef.current = { x: 0, y: 0 };
    scheduleParallax();
  }, [isHoverCapable, scheduleParallax]);

  useEffect(() => {
    return () => {
      if (parallaxRafRef.current !== null) {
        cancelAnimationFrame(parallaxRafRef.current);
      }
    };
  }, []);

  const handlePanelDragMove = useCallback((event: PointerEvent) => {
    if (!dragStateRef.current.active) return;
    const deltaX = event.clientX - dragStateRef.current.startX;
    const deltaY = event.clientY - dragStateRef.current.startY;
    setPanelOffset({
      x: dragStateRef.current.originX + deltaX,
      y: dragStateRef.current.originY + deltaY,
    });
  }, []);

  const stopPanelDrag = useCallback(() => {
    dragStateRef.current.active = false;
    window.removeEventListener('pointermove', handlePanelDragMove);
    window.removeEventListener('pointerup', stopPanelDrag);
  }, [handlePanelDragMove]);

  const handlePanelDragStart = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    dragStateRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: panelOffset.x,
      originY: panelOffset.y,
    };
    window.addEventListener('pointermove', handlePanelDragMove);
    window.addEventListener('pointerup', stopPanelDrag);
  }, [handlePanelDragMove, panelOffset.x, panelOffset.y, stopPanelDrag]);

  useEffect(() => {
    return () => {
      stopPanelDrag();
    };
  }, [stopPanelDrag]);

  useEffect(() => {
    window.localStorage.setItem(HOME_PANEL_POSITION_STORAGE_KEY, JSON.stringify(panelOffset));
  }, [panelOffset]);

  const handleCreateSubmit = async (name: string, description: string) => {
    const project = await createProject({
      name,
      description,
      mainBranchName: t('projects:defaultMainBranchName'),
    });
    setCreateDialogOpen(false);
    showSnackbar(t('projects:snackbar.created'), 'success');
    navigate(`/project/${project.id}`);
  };

  const handleDelete = (id: number, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirmDialog(
      t('projects:deleteConfirm.title'),
      t('projects:deleteConfirm.message', { name }),
      async () => {
        try {
          await deleteProject(id);
          showSnackbar(t('projects:snackbar.deleted'), 'success');
        } catch {
          showSnackbar(t('projects:snackbar.deleteFailed'), 'error');
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
        const parsed = JSON.parse(text);
        // Support both raw export payload and wrapped API response shape: { success, data }.
        const importPayload = parsed?.data && parsed?.success ? parsed.data : parsed;

        if (!importPayload?.version || !importPayload?.project) {
          showSnackbar(t('projects:snackbar.importInvalidFormat'), 'error');
          return;
        }

        const locale = isSupportedLanguage(i18n.language) ? i18n.language : 'en';
        const res = await projectsApi.importProject(importPayload, { locale });
        showSnackbar(t('projects:snackbar.imported', { name: res.data.data.name }), 'success');
        fetchProjects();
        navigate(`/project/${res.data.data.id}`);
      } catch (err: any) {
        if (err instanceof SyntaxError) {
          showSnackbar(t('projects:snackbar.importNotValidJson'), 'error');
        } else {
          showSnackbar(err.message || t('projects:snackbar.importError'), 'error');
        }
      }
    };

    input.click();
  };

  const handleCreateTutorialProject = async () => {
    try {
      const locale = isSupportedLanguage(i18n.language) ? i18n.language : 'en';
      const res = await projectsApi.createDemoProject({ locale });
      const project = res.data.data;
      showSnackbar(t('projects:snackbar.tutorialCreated'), 'success');
      startOnboarding(project.id);
      navigate(`/project/${project.id}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('projects:snackbar.tutorialFailed');
      showSnackbar(message, 'error');
    }
  };

  if (loading && projects.length === 0) {
    return <LoadingScreen message={t('projects:home.loadingCampaigns')} />;
  }

  return (
    <Box
      onMouseMove={handleRootMouseMove}
      onMouseLeave={handleRootMouseLeave}
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
        parallaxLayerRef={parallaxLayerRef}
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
        {/* Header Block (Top-Left) */}
        <Box
          sx={{
            px: { xs: 3, md: 6 },
            pt: { xs: 4, md: 6 },
            pb: { xs: 2, md: 3 },
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'flex-start' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
              Campaigner
            </Typography>
            <Box
              sx={{
                mt: 1.5,
                mb: 2,
                width: 200,
                height: 3,
                borderRadius: 2,
                background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.main, 0.25)} 100%)`,
                backgroundSize: '220% 100%',
                animation: 'campaignerLineShimmer 4.8s ease-in-out infinite',
                '@keyframes campaignerLineShimmer': {
                  '0%': { backgroundPosition: '0% 50%' },
                  '50%': { backgroundPosition: '100% 50%' },
                  '100%': { backgroundPosition: '0% 50%' },
                },
              }}
            />
            <Typography sx={{ color: 'text.secondary', maxWidth: 560, lineHeight: 1.6 }}>
              {t('projects:home.subtitle')}
            </Typography>
          </Box>
          <LanguageSwitcher sx={{ flexShrink: 0, alignSelf: { xs: 'flex-end', sm: 'flex-start' }, mt: { sm: 0.25 } }} />
        </Box>

        {/* Central Unified Container */}
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: { xs: 'flex-start', md: 'center' },
            px: { xs: 3, md: 4 },
            pb: { xs: 4, md: 6 },
          }}
        >
          <Container maxWidth={false} sx={{ maxWidth: 900, px: 0 }}>
            <Box
              onMouseEnter={() => {
                if (isHoverCapable) setIsContainerHovered(true);
              }}
              onMouseLeave={() => {
                if (isHoverCapable) setIsContainerHovered(false);
              }}
              sx={{
                transform: `translate3d(${panelOffset.x}px, ${panelOffset.y}px, 0)`,
                willChange: 'transform',
              }}
            >
              <GlassCard
                sx={{
                  p: { xs: 2.5, md: 3 },
                  opacity: isLoaded ? 1 : 0,
                  transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
                  transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${0.2}s`,
                  ...(isHoverCapable && {
                    opacity: isContainerHovered ? 1 : 0.35,
                    backdropFilter: isContainerHovered ? 'blur(10px)' : 'blur(6px)',
                    transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${0.2}s, opacity 300ms ease, backdrop-filter 300ms ease`,
                  }),
                }}
              >
              <Box
                onPointerDown={handlePanelDragStart}
                sx={{
                  mb: 2,
                  mx: { xs: -1, md: -1.5 },
                  mt: { xs: -1, md: -1.5 },
                  px: 1.5,
                  py: 1,
                  borderRadius: 1.5,
                  cursor: 'grab',
                  touchAction: 'none',
                  userSelect: 'none',
                  '&:active': {
                    cursor: 'grabbing',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 72,
                    height: 4,
                    mx: 'auto',
                    borderRadius: 999,
                    backgroundColor: alpha(theme.palette.text.primary, 0.26),
                  }}
                />
              </Box>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
                <DndButton
                  variant="outlined"
                  startIcon={<PaletteIcon />}
                  onClick={() => navigate('/appearance')}
                  sx={{ fontWeight: 600 }}
                >
                  {t('projects:home.actions.appearance')}
                </DndButton>

                <DndButton
                  variant="outlined"
                  startIcon={<FileUploadIcon />}
                  onClick={handleImportClick}
                  sx={{ fontWeight: 600 }}
                >
                  {t('projects:home.actions.import')}
                </DndButton>

                <DndButton
                  variant="outlined"
                  startIcon={<SchoolIcon />}
                  onClick={handleCreateTutorialProject}
                  sx={{ fontWeight: 600 }}
                >
                  {t('projects:home.actions.tutorial')}
                </DndButton>

                <DndButton
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateDialogOpen(true)}
                  sx={{
                    ml: 'auto',
                    fontWeight: 700,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.4)}`,
                  }}
                >
                  {t('projects:home.actions.create')}
                </DndButton>
              </Stack>

              <Divider sx={{ mb: 2 }} />

              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                {t('projects:home.projectsHeading', { count: projects.length })}
              </Typography>

              {projects.length > 0 ? (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: 2,
                    maxHeight: {
                      xs: 'min(62vh, 520px)',
                      md: 'min(60vh, 560px)',
                    },
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    pr: 0.5,
                  }}
                >
                  {projects.map((project, index) => (
                    <GlassCard
                      key={project.id}
                      interactive={true}
                      onClick={() => navigate(`/project/${project.id}`)}
                      sx={{
                        opacity: isLoaded ? 1 : 0,
                        transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
                        transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${0.35 + index * 0.08}s`,
                        p: 4,
                        boxShadow: `0 14px 32px ${alpha(theme.palette.common.black, 0.2)}`,
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
                                  ? t('projects:home.projectCard.statusActive')
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
              ) : (
                <Box sx={{ textAlign: 'center', py: 5, px: 2 }}>
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
                    {t('projects:home.empty.title')}
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
                    {t('projects:home.empty.description')}
                  </Typography>
                </Box>
              )}
              </GlassCard>
            </Box>
          </Container>
        </Box>

        {/* Footer */}
        <Fade in={isLoaded} timeout={1000}>
          <Box
            sx={{
              width: '100%',
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.24)}`,
              backgroundColor: alpha(theme.palette.background.paper, 0.6),
              backdropFilter: 'blur(12px)',
              mt: 4,
            }}
          >
            <Container
              maxWidth={false}
              sx={{
                width: '100%',
                maxWidth: 1000,
                mx: 'auto',
                px: { xs: 4, md: 6 },
                py: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 2,
                flexWrap: 'wrap',
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
                      fontSize: '1rem',
                      lineHeight: 1.3,
                    }}
                  >
                    Campaigner
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: alpha(theme.palette.text.secondary, 0.97), fontSize: '0.86rem', lineHeight: 1.5 }}
                  >
                    {t('projects:home.footer.tagline')}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: alpha(theme.palette.text.secondary, 0.92),
                    fontSize: '0.86rem',
                    letterSpacing: '0.015em',
                    lineHeight: 1.5,
                  }}
                >
                  © {new Date().getFullYear()} · {t('projects:home.footer.madeFor')}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: alpha(theme.palette.text.secondary, 0.95),
                    fontSize: '0.86rem',
                    lineHeight: 1.5,
                  }}
                >
                  Github: @adamnobody
                </Typography>
              </Box>
            </Container>
          </Box>
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
