import React, { useEffect } from 'react';
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
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useUIStore } from '@/store/useUIStore';
import { useProjectStore } from '@/store/useProjectStore';
import { shallow } from 'zustand/shallow';
import GavelIcon from '@mui/icons-material/Gavel';
import GroupsIcon from '@mui/icons-material/Groups';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

const projectMenuItems = [
  { label: 'Карта', icon: <MapIcon />, path: 'map' },
  { label: 'Персонажи', icon: <PeopleIcon />, path: 'characters' },
  { label: 'Фракции', icon: <GroupsIcon />, path: 'factions' },
  { label: 'Заметки', icon: <DescriptionIcon />, path: 'notes' },
  { label: 'Вики', icon: <MenuBookIcon />, path: 'wiki' },
  { label: 'Хронология', icon: <TimelineIcon />, path: 'timeline' },
  { label: 'Догмы', icon: <GavelIcon />, path: 'dogmas' },
  { label: 'Династии', icon: <AccountTreeIcon />, path: 'dynasties' },
];

export const Sidebar: React.FC = () => {
  const { sidebarOpen, sidebarWidth } = useUIStore((state) => ({
    sidebarOpen: state.sidebarOpen,
    sidebarWidth: state.sidebarWidth,
  }), shallow);
  const { currentProject, fetchProject } = useProjectStore((state) => ({
    currentProject: state.currentProject,
    fetchProject: state.fetchProject,
  }), shallow);
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams<{ projectId: string }>();

  const isProjectPage = !!projectId;
  const isAppearancePage = location.pathname === '/appearance';

  useEffect(() => {
    if (projectId && (!currentProject || currentProject.id !== parseInt(projectId, 10))) {
      fetchProject(parseInt(projectId, 10));
    }
  }, [projectId, currentProject, fetchProject]);

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
          <ListItemText primary="Все кампании" />
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
          <ListItemText primary="Внешний вид" />
        </ListItemButton>
      </List>

      <Divider />

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
              const fullPath = `/project/${projectId}/${item.path}`;
              const isActive = location.pathname.startsWith(fullPath);

              return (
                <ListItemButton
                  key={item.path}
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
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              );
            })}
          </List>

          <Divider />

          <List>
            <ListItemButton
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
              <ListItemText primary="Настройки проекта" />
            </ListItemButton>
          </List>
        </>
      ) : (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Выберите кампанию, чтобы начать работу с миром
          </Typography>
        </Box>
      )}
    </Drawer>
  );
};