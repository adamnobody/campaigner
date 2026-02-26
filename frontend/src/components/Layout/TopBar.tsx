import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '@/store/useUIStore';
import { useProjectStore } from '@/store/useProjectStore';

export const TopBar: React.FC = () => {
  const { toggleSidebar } = useUIStore();
  const { currentProject } = useProjectStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Генерация хлебных крошек из текущего пути
  const pathParts = location.pathname.split('/').filter(Boolean);

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={toggleSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          sx={{
            fontFamily: '"Cinzel", serif',
            color: 'primary.main',
            cursor: 'pointer',
            mr: 3,
          }}
          onClick={() => navigate('/')}
        >
          ⚔️ Campaigner
        </Typography>

        <Breadcrumbs sx={{ flexGrow: 1, color: 'text.secondary' }}>
          <MuiLink
            component="button"
            underline="hover"
            color="inherit"
            onClick={() => navigate('/')}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <HomeIcon fontSize="small" />
            Home
          </MuiLink>
          {currentProject && pathParts.length > 1 && (
            <MuiLink
              component="button"
              underline="hover"
              color="inherit"
              onClick={() => navigate(`/project/${currentProject.id}`)}
            >
              {currentProject.name}
            </MuiLink>
          )}
          {pathParts.length > 2 && (
            <Typography color="text.primary" sx={{ textTransform: 'capitalize' }}>
              {pathParts[pathParts.length - 1]}
            </Typography>
          )}
        </Breadcrumbs>
      </Toolbar>
    </AppBar>
  );
};