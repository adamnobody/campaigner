import React, { useEffect, useMemo } from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import PeopleIcon from '@mui/icons-material/People';
import DescriptionIcon from '@mui/icons-material/Description';
import TimelineIcon from '@mui/icons-material/Timeline';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SettingsIcon from '@mui/icons-material/Settings';
import HomeIcon from '@mui/icons-material/Home';
import PaletteIcon from '@mui/icons-material/Palette';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/store/useUIStore';
import { useProjectStore } from '@/store/useProjectStore';
import { shallow } from 'zustand/shallow';
import GavelIcon from '@mui/icons-material/Gavel';
import GroupsIcon from '@mui/icons-material/Groups';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CastleIcon from '@mui/icons-material/Castle';
import HubIcon from '@mui/icons-material/Hub';

type ProjectRoutePath =
  | ''
  | 'map'
  | 'graph'
  | 'characters'
  | 'states'
  | 'factions'
  | 'notes'
  | 'wiki'
  | 'timeline'
  | 'dogmas'
  | 'dynasties';

const PROJECT_MENU_ICONS = {
  '': DashboardIcon,
  map: MapIcon,
  graph: HubIcon,
  characters: PeopleIcon,
  states: CastleIcon,
  factions: GroupsIcon,
  notes: DescriptionIcon,
  wiki: MenuBookIcon,
  timeline: TimelineIcon,
  dogmas: GavelIcon,
  dynasties: AccountTreeIcon,
};

const PROJECT_MENU_PATHS: readonly ProjectRoutePath[] = [
  '',
  'map',
  'graph',
  'characters',
  'states',
  'factions',
  'notes',
  'wiki',
  'timeline',
  'dogmas',
  'dynasties',
] as const;

function tourAttrForSidebarPath(path: ProjectRoutePath): string | undefined {
  switch (path) {
    case 'characters':
      return 'sidebar-characters';
    case 'graph':
      return 'sidebar-graph';
    case 'states':
      return 'sidebar-states';
    case 'factions':
      return 'sidebar-factions';
    case 'notes':
      return 'sidebar-notes';
    case 'wiki':
      return 'sidebar-wiki';
    case 'timeline':
      return 'sidebar-timeline';
    case 'dogmas':
      return 'sidebar-dogmas';
    case 'dynasties':
      return 'sidebar-dynasties';
    default:
      return undefined;
  }
}

export const Sidebar: React.FC = () => {
  const { t } = useTranslation('navigation');
  const { sidebarOpen, sidebarWidth } = useUIStore((state) => ({
    sidebarOpen: state.sidebarOpen,
    sidebarWidth: state.sidebarWidth,
  }), shallow);
  const { projects, currentProject, fetchProject, fetchProjects } = useProjectStore((state) => ({
    projects: state.projects,
    currentProject: state.currentProject,
    fetchProject: state.fetchProject,
    fetchProjects: state.fetchProjects,
  }), shallow);
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams<{ projectId: string }>();

  const isProjectPage = !!projectId;
  const isAppearancePage = location.pathname === '/appearance';

  const projectMenuItems = useMemo(
    () =>
      PROJECT_MENU_PATHS.map((path) => ({
        path,
        Icon: PROJECT_MENU_ICONS[path],
      })),
    []
  );

  useEffect(() => {
    if (projectId && (!currentProject || currentProject.id !== parseInt(projectId, 10))) {
      fetchProject(parseInt(projectId, 10));
    }
  }, [projectId, currentProject, fetchProject]);

  useEffect(() => {
    if (isAppearancePage && projects.length === 0) {
      fetchProjects();
    }
  }, [isAppearancePage, projects.length, fetchProjects]);

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={sidebarOpen}
      sx={{
        width: sidebarWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: sidebarWidth,
          boxSizing: 'border-box',
          mt: '64px',
        },
      }}
    >
      <List>
        <ListItemButton
          selected={location.pathname === '/'}
          onClick={() => navigate('/')}
          sx={{
            '&.Mui-selected': {
              backgroundColor: 'rgba(201, 169, 89, 0.1)',
            },
          }}
        >
          <ListItemIcon>
            <HomeIcon color="primary" />
          </ListItemIcon>
          <ListItemText primary={t('sidebar.allCampaigns')} />
        </ListItemButton>

        <ListItemButton
          selected={isAppearancePage}
          onClick={() => navigate('/appearance')}
          sx={{
            '&.Mui-selected': {
              backgroundColor: 'rgba(201, 169, 89, 0.1)',
              borderRight: '3px solid',
              borderRightColor: 'primary.main',
            },
          }}
        >
          <ListItemIcon sx={{ color: isAppearancePage ? 'primary.main' : 'text.secondary' }}>
            <PaletteIcon />
          </ListItemIcon>
          <ListItemText primary={t('sidebar.appearance')} />
        </ListItemButton>
      </List>

      <Divider />

      {isAppearancePage && (
        <>
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {t('sidebar.appearanceProjectsHint')}
            </Typography>
          </Box>

          <List>
            {projects.map((project) => {
              const isActiveProject = location.pathname.startsWith(`/project/${project.id}/`);
              return (
                <ListItemButton
                  key={project.id}
                  selected={isActiveProject}
                  onClick={() => navigate(`/project/${project.id}`)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(201, 169, 89, 0.1)',
                      borderRight: '3px solid',
                      borderRightColor: 'primary.main',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: isActiveProject ? 'primary.main' : 'text.secondary' }}>
                    <AccountTreeIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={project.name}
                    primaryTypographyProps={{ noWrap: true }}
                  />
                </ListItemButton>
              );
            })}
          </List>

          {projects.length === 0 && (
            <Box sx={{ p: 2, pt: 0 }}>
              <Typography variant="body2" color="text.secondary">
                {t('sidebar.projectsEmpty')}
              </Typography>
            </Box>
          )}

          <Divider />
        </>
      )}

      {isProjectPage && currentProject ? (
        <>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" color="primary" noWrap>
              {currentProject.name}
            </Typography>
            {currentProject.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                noWrap
                sx={{ mt: 0.5 }}
              >
                {currentProject.description}
              </Typography>
            )}
          </Box>

          <Divider />

          <List>
            {projectMenuItems.map((item) => {
              const fullPath = item.path ? `/project/${projectId}/${item.path}` : `/project/${projectId}`;
              const isActive = item.path === ''
                ? location.pathname === fullPath || location.pathname === `${fullPath}/`
                : location.pathname.startsWith(fullPath);
              const Icon = item.Icon;
              const dataTour = tourAttrForSidebarPath(item.path);

              return (
                <ListItemButton
                  key={item.path}
                  data-tour={dataTour}
                  selected={isActive}
                  onClick={() => navigate(fullPath)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(201, 169, 89, 0.1)',
                      borderRight: '3px solid',
                      borderRightColor: 'primary.main',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'text.secondary' }}>
                    <Icon />
                  </ListItemIcon>
                  <ListItemText primary={t(item.path ? `menu.${item.path}` : 'menu.overview')} />
                </ListItemButton>
              );
            })}
          </List>

          <Divider />

          <List>
            <ListItemButton
              data-tour="sidebar-settings"
              selected={location.pathname === `/project/${projectId}/settings`}
              onClick={() => navigate(`/project/${projectId}/settings`)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(201, 169, 89, 0.1)',
                  borderRight: '3px solid',
                  borderRightColor: 'primary.main',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color:
                    location.pathname === `/project/${projectId}/settings`
                      ? 'primary.main'
                      : 'text.secondary',
                }}
              >
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary={t('sidebar.projectSettings')} />
            </ListItemButton>
          </List>
        </>
      ) : (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {t('sidebar.selectCampaign')}
          </Typography>
        </Box>
      )}
    </Drawer>
  );
};
