import React, { useEffect } from 'react';
import {
  Drawer, List, ListItemButton, ListItemIcon,
  ListItemText, Divider, Box, Typography,
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import PeopleIcon from '@mui/icons-material/People';
import DescriptionIcon from '@mui/icons-material/Description';
import TimelineIcon from '@mui/icons-material/Timeline';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import FolderIcon from '@mui/icons-material/Folder';
import SettingsIcon from '@mui/icons-material/Settings';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useUIStore } from '@/store/useUIStore';
import { useProjectStore } from '@/store/useProjectStore';

const projectMenuItems = [
  { label: 'Map', icon: <MapIcon />, path: 'map' },
  { label: 'Characters', icon: <PeopleIcon />, path: 'characters' },
  { label: 'Notes', icon: <DescriptionIcon />, path: 'notes' },
  { label: 'Wiki', icon: <MenuBookIcon />, path: 'wiki' },
  { label: 'Timeline', icon: <TimelineIcon />, path: 'timeline' },
  { label: 'Files', icon: <FolderIcon />, path: 'files' },
];

export const Sidebar: React.FC = () => {
  const { sidebarOpen, sidebarWidth } = useUIStore();
  const { currentProject, fetchProject } = useProjectStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams<{ projectId: string }>();

  const isProjectPage = !!projectId;

  // Подгружаем проект если его нет в store
  useEffect(() => {
    if (projectId && (!currentProject || currentProject.id !== parseInt(projectId))) {
      fetchProject(parseInt(projectId));
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
      {/* Back to Home */}
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
          <ListItemIcon><HomeIcon color="primary" /></ListItemIcon>
          <ListItemText primary="All Campaigns" />
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
              <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.5 }}>
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
              selected={location.pathname.includes('/settings')}
              onClick={() => navigate(`/project/${projectId}/settings`)}
            >
              <ListItemIcon><SettingsIcon /></ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItemButton>
          </List>
        </>
      ) : (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Select a campaign to start exploring your world
          </Typography>
        </Box>
      )}
    </Drawer>
  );
};