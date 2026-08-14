import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  ButtonBase,
  Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import PaletteIcon from '@mui/icons-material/Palette';
import SchoolIcon from '@mui/icons-material/School';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import BoltIcon from '@mui/icons-material/Bolt';
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
import {
  CreateProjectDialog,
  type CreateProjectWizardValue,
} from '@/pages/home/components/CreateProjectDialog';
import { EmptyStateIllustration } from '@/pages/home/components/HomePrimitives';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { isSupportedLanguage } from '@/i18n/language';
import { useAssetUrl } from '@/hooks/useAssetUrl';
import type { Project } from '@campaigner/shared';
import { getProjectCarouselIndices } from './homeCarousel';
import {
  HomeContourCanvas,
  type HomeContourPulse,
} from './components/HomeContourCanvas';

function ProjectArchCard({
  project,
  featured,
  archIndex,
  onOpen,
  onDelete,
}: {
  project: Project;
  featured?: boolean;
  archIndex: number;
  onOpen: () => void;
  onDelete: (event: React.MouseEvent) => void;
}) {
  const { t } = useTranslation('projects');
  const coverUrl = useAssetUrl(project.coverImagePath);
  const updated = new Date(project.updatedAt);
  const validUpdated = Number.isNaN(updated.getTime()) ? '' : updated.toLocaleDateString();

  return (
    <Box
      component="article"
      data-home-arch={archIndex}
      sx={{
        width: 'auto',
        height: featured
          ? { xs: 'min(58vh, 500px)', md: 'clamp(300px, 62vh, 760px)' }
          : 'clamp(224px, 46vh, 566px)',
        aspectRatio: '.615',
        flex: '0 0 auto',
        p: 0,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: featured ? '999px 999px 12px 12px' : '999px 999px 12px 12px',
        border: (theme) => {
          const strength = theme.campaigner.glow.strength;
          const opacity = Math.min(0.68, 0.18 + strength * (featured ? 1.45 : 0.9));
          return `1px solid ${alpha(theme.palette.primary.main, opacity)}`;
        },
        background: coverUrl
          ? `linear-gradient(180deg,rgba(9,11,15,.06),rgba(9,11,15,.28) 42%,rgba(9,11,15,.9)), url("${coverUrl}") center/cover`
          : (theme) => `linear-gradient(180deg,${alpha(theme.palette.background.default, 0.05)},${alpha(theme.palette.background.default, 0.86)}),
             repeating-linear-gradient(135deg,rgba(255,255,255,.035) 0 2px,transparent 2px 10px),
             linear-gradient(160deg,${alpha(theme.palette.primary.main, 0.2)},${theme.palette.background.default})`,
        color: 'inherit',
        cursor: 'pointer',
        boxShadow: featured
          ? '0 34px 90px rgba(0,0,0,.62)'
          : '0 20px 50px rgba(0,0,0,.42)',
        filter: (theme) => {
          const strength = theme.campaigner.glow.strength;
          return strength === 0
            ? 'none'
            : `drop-shadow(0 0 ${featured ? 16 : 11}px ${alpha(theme.palette.primary.main, strength * (featured ? 1.2 : 0.78))})`;
        },
        transition: 'transform 180ms ease, border-color 180ms ease, filter 220ms ease',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          borderRadius: 'inherit',
          boxShadow: (theme) => {
            const strength = theme.campaigner.glow.strength;
            return strength === 0
              ? 'none'
              : `inset 0 0 ${featured ? 22 : 16}px ${alpha(theme.palette.primary.main, strength * (featured ? 0.72 : 0.48))}`;
          },
          pointerEvents: 'none',
        },
        '&:hover': {
          transform: 'translateY(-3px)',
          borderColor: (theme) => alpha(theme.palette.primary.main, Math.min(0.82, 0.36 + theme.campaigner.glow.strength)),
          filter: (theme) => {
            const strength = theme.campaigner.glow.strength;
            return strength === 0
              ? 'none'
              : `drop-shadow(0 0 ${featured ? 22 : 16}px ${alpha(theme.palette.primary.main, strength * (featured ? 1.45 : 1))})`;
          },
        },
      }}
    >
      <ButtonBase
        aria-label={project.name}
        onClick={onOpen}
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          borderRadius: 'inherit',
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: -4,
          },
        }}
      />
      {!coverUrl ? (
        <Typography
          aria-hidden
          sx={{
            position: 'absolute',
            top: featured ? '29%' : '27%',
            insetInline: 0,
            fontFamily: (theme) => theme.campaigner.typography.display,
            fontSize: featured ? 'clamp(72px, 6vw, 112px)' : 'clamp(48px, 4vw, 72px)',
            fontWeight: 600,
            color: featured ? 'rgba(246,242,233,.2)' : 'primary.main',
            opacity: featured ? 1 : 0.48,
          }}
        >
          {project.name.charAt(0).toUpperCase()}
        </Typography>
      ) : null}
      <IconButton
        onClick={(event) => { event.stopPropagation(); onDelete(event); }}
        aria-label={t('deleteConfirm.title')}
        sx={{
          position: 'absolute',
          top: '15%',
          right: '10%',
          width: featured ? 40 : 36,
          height: featured ? 40 : 36,
          borderRadius: '50%',
          color: 'rgba(232,228,220,.58)',
          bgcolor: 'rgba(14,17,22,.72)',
          border: '1px solid rgba(255,255,255,.1)',
          backdropFilter: 'blur(8px)',
          zIndex: 2,
          '&:hover': {
            color: 'error.main',
            bgcolor: 'rgba(14,17,22,.9)',
            borderColor: 'rgba(255,122,122,.35)',
          },
        }}
      >
        <DeleteIcon sx={{ fontSize: featured ? 19 : 17 }} />
      </IconButton>
      <Box sx={{ position: 'absolute', inset: 'auto 0 0', px: featured ? { xs: 2.5, xl: 4 } : { xs: 2, xl: 3 }, pb: featured ? { xs: 2.5, xl: 4 } : { xs: 2, xl: 3 }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: featured ? { xs: 1, xl: 1.5 } : { xs: 0.75, xl: 1.1 } }}>
        <Chip
          icon={project.status === 'active' ? <BoltIcon /> : undefined}
          label={project.status === 'active' ? t('home.projectCard.statusActive') : project.status}
          size="small"
          sx={{
            color: project.status === 'active' ? '#8fbf9f' : 'text.secondary',
            borderColor: project.status === 'active' ? 'rgba(143,191,159,.32)' : 'rgba(255,255,255,.1)',
            backgroundColor: project.status === 'active' ? 'rgba(143,191,159,.12)' : 'rgba(255,255,255,.04)',
          }}
        />
        <Typography sx={{ fontFamily: (theme) => theme.campaigner.typography.display, fontWeight: 600, fontSize: featured ? { xs: 25, xl: 29 } : { xs: 19, xl: 22 }, lineHeight: 1.24, color: '#f4f0e7', textAlign: 'center' }}>
          {project.name}
        </Typography>
        <Typography sx={{ fontFamily: (theme) => theme.campaigner.typography.mono, fontSize: 'clamp(10px, .7vw, 12px)', color: 'rgba(232,228,220,.38)' }}>
          {validUpdated}
        </Typography>
      </Box>
    </Box>
  );
}

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
  const motionMode = usePreferencesStore((state) => state.motionMode);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const [contourPulse, setContourPulse] = useState<HomeContourPulse>({ id: 0, direction: 1 });
  const [isLoaded, setIsLoaded] = useState(false);
  const startOnboarding = useOnboardingStore((state) => state.startForProject);

  useEffect(() => {
    fetchProjects();
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, [fetchProjects]);

  useEffect(() => {
    setActiveProjectIndex((index) => projects.length === 0 ? 0 : Math.min(index, projects.length - 1));
  }, [projects.length]);

  const handleCreateSubmit = async ({ name, description, coverFile }: CreateProjectWizardValue) => {
    const project = await createProject({
      name,
      description,
      mainBranchName: t('projects:defaultMainBranchName'),
    });
    if (coverFile) {
      try {
        await projectsApi.uploadCover(project.id, coverFile);
        await fetchProjects();
      } catch {
        showSnackbar(t('projects:snackbar.coverUploadFailed'), 'warning');
      }
    }
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

  const carousel = getProjectCarouselIndices(projects.length, activeProjectIndex);
  const centerProject = carousel.center === null ? undefined : projects[carousel.center];
  const leftProject = carousel.left === null ? undefined : projects[carousel.left];
  const rightProject = carousel.right === null ? undefined : projects[carousel.right];
  const moveProject = (delta: number) => {
    if (projects.length < 2) return;
    setContourPulse((current) => ({
      id: current.id + 1,
      direction: delta < 0 ? -1 : 1,
    }));
    setActiveProjectIndex((index) => (index + delta + projects.length) % projects.length);
  };

  return (
    <Box
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') moveProject(-1);
        if (event.key === 'ArrowRight') moveProject(1);
      }}
      tabIndex={projects.length > 1 ? 0 : -1}
      aria-label={t('projects:home.libraryCount', { count: projects.length })}
      sx={{ minHeight: '100dvh', position: 'relative', overflow: 'hidden', backgroundColor: 'background.default', display: 'flex', flexDirection: 'column' }}
    >
      <HomeContourCanvas
        accentColor={theme.palette.primary.main}
        baseColor={theme.palette.background.default}
        animate={motionMode === 'full' && !createDialogOpen}
        pulse={contourPulse}
        visible={!createDialogOpen}
      />

      <Box sx={{ position: 'relative', zIndex: 1, px: { xs: 2.5, md: 4.25 }, pt: { xs: 2.5, md: 4.25 }, display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'start', gap: 2 }}>
        <Box />
        <Box sx={{ textAlign: 'center', opacity: isLoaded ? 1 : 0, transform: isLoaded ? 'none' : 'translateY(-10px)', transition: 'opacity 500ms ease, transform 500ms ease' }}>
          <Typography sx={{ fontFamily: (currentTheme) => currentTheme.campaigner.typography.display, fontSize: 25, fontWeight: 600, letterSpacing: '.3em', color: '#f0ece3' }}>CAMPAIGNER</Typography>
          <Typography sx={{ pt: 0.7, fontFamily: (currentTheme) => currentTheme.campaigner.typography.display, fontStyle: 'italic', fontWeight: 500, fontSize: 14, color: 'rgba(232,228,220,.45)' }}>
            {t('projects:home.libraryCount', { count: projects.length })}
          </Typography>
        </Box>
        <LanguageSwitcher sx={{ justifySelf: 'end', minWidth: { xs: 104, xl: 128 } }} />
      </Box>

      <Box sx={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column', px: { xs: 2, md: 0 }, pt: 1 }}>
        {projects.length === 0 ? (
          <Box sx={{ mx: 'auto', width: 'min(620px, 100%)', textAlign: 'center', py: 6 }}>
            <Box sx={{ width: 240, height: 320, mx: 'auto', borderRadius: '120px 120px 14px 14px', border: (currentTheme) => `1px dashed ${alpha(currentTheme.palette.primary.main, 0.32)}`, background: 'repeating-linear-gradient(135deg,rgba(255,255,255,.025) 0 2px,transparent 2px 10px)', display: 'grid', placeItems: 'center' }}>
              <EmptyStateIllustration />
            </Box>
            <Typography variant="h3" sx={{ pt: 3 }}>{t('projects:home.empty.title')}</Typography>
            <Typography sx={{ color: 'text.secondary', maxWidth: 460, mx: 'auto', pt: 1.25 }}>{t('projects:home.empty.description')}</Typography>
          </Box>
        ) : (
          <Box
            sx={{
              position: 'relative',
              flex: 1,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 0,
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'none' : 'translateY(18px)',
              transition: 'opacity 520ms ease 100ms, transform 520ms ease 100ms',
            }}
          >
            <IconButton onClick={() => moveProject(-1)} disabled={projects.length < 2} aria-label={t('projects:home.previousProject')} sx={{ position: 'absolute', top: '50%', left: { xs: 4, sm: 10, md: 20, xl: 28 }, transform: 'translateY(-50%)', width: 42, height: 42, borderRadius: '50%', border: '1px solid rgba(255,255,255,.1)', bgcolor: 'rgba(14,17,22,.78)', zIndex: 3 }}><ChevronLeftIcon /></IconButton>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 'clamp(14px, 2.4vw, 30px)' }}>
            {leftProject ? <Box sx={{ display: { xs: 'none', lg: 'block' } }}><ProjectArchCard archIndex={0} project={leftProject} onOpen={() => navigate(`/project/${leftProject.id}`)} onDelete={(event) => handleDelete(leftProject.id, leftProject.name, event)} /></Box> : null}
            {centerProject ? <ProjectArchCard archIndex={1} featured project={centerProject} onOpen={() => navigate(`/project/${centerProject.id}`)} onDelete={(event) => handleDelete(centerProject.id, centerProject.name, event)} /> : null}
            {rightProject ? <Box sx={{ display: { xs: 'none', lg: 'block' } }}><ProjectArchCard archIndex={2} project={rightProject} onOpen={() => navigate(`/project/${rightProject.id}`)} onDelete={(event) => handleDelete(rightProject.id, rightProject.name, event)} /></Box> : null}
            </Box>
            <IconButton onClick={() => moveProject(1)} disabled={projects.length < 2} aria-label={t('projects:home.nextProject')} sx={{ position: 'absolute', top: '50%', right: { xs: 4, sm: 10, md: 20, xl: 28 }, transform: 'translateY(-50%)', width: 42, height: 42, borderRadius: '50%', border: '1px solid rgba(255,255,255,.1)', bgcolor: 'rgba(14,17,22,.78)', zIndex: 3 }}><ChevronRightIcon /></IconButton>
          </Box>
        )}

        <Box
          sx={{
            mx: 'auto',
            mt: '18px',
            pt: 0,
            pb: { xs: 2.5, xl: 3.5 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {projects.length > 1 ? (
            <Typography sx={{ minHeight: 18, display: 'flex', alignItems: 'center', fontFamily: (currentTheme) => currentTheme.campaigner.typography.display, fontStyle: 'italic', color: 'rgba(232,228,220,.4)', fontSize: 13, lineHeight: 1 }}>
              {t('projects:home.position', { current: activeProjectIndex + 1, count: projects.length })}
            </Typography>
          ) : null}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, xl: 1.25 }, p: { xs: 0.75, xl: 1 }, borderRadius: { xs: '13px', xl: '16px' }, border: '1px solid rgba(255,255,255,.07)', backgroundColor: 'rgba(14,17,22,.76)', backdropFilter: 'blur(12px)' }}>
            <Tooltip title={t('projects:home.actions.appearance')}><IconButton aria-label={t('projects:home.actions.appearance')} onClick={() => navigate('/appearance', { state: { from: '/' } })} sx={{ width: { xl: 44 }, height: { xl: 44 } }}><PaletteIcon /></IconButton></Tooltip>
            <Tooltip title={t('projects:home.actions.import')}><IconButton aria-label={t('projects:home.actions.import')} onClick={handleImportClick} sx={{ width: { xl: 44 }, height: { xl: 44 } }}><FileUploadIcon /></IconButton></Tooltip>
            <Tooltip title={t('projects:home.actions.tutorial')}><IconButton aria-label={t('projects:home.actions.tutorial')} onClick={handleCreateTutorialProject} sx={{ width: { xl: 44 }, height: { xl: 44 } }}><SchoolIcon /></IconButton></Tooltip>
            <DndButton variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDialogOpen(true)} sx={{ height: { xs: 46, xl: 52 }, px: { xs: 3, xl: 4 }, fontSize: { xl: 14 } }}>
              {t('projects:home.actions.createWorld')}
            </DndButton>
          </Box>
        </Box>
      </Box>

      <Box sx={{ position: 'relative', zIndex: 1, px: 4, pb: 2.5, display: 'flex', justifyContent: 'space-between', color: 'rgba(232,228,220,.22)', fontSize: 10.5 }}>
        <span>© {new Date().getFullYear()} Campaigner</span><span>Github: @adamnobody</span>
      </Box>

      <CreateProjectDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} onSubmit={handleCreateSubmit} />
    </Box>
  );
};
