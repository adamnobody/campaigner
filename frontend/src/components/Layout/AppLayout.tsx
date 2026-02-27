import React from 'react';
import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { useUIStore } from '@/store/useUIStore';

export const AppLayout: React.FC = () => {
  const { sidebarOpen, sidebarWidth } = useUIStore();
  const location = useLocation();

  // На домашней странице — полноэкранный layout без TopBar/Sidebar
  const isHomePage = location.pathname === '/';

  if (isHomePage) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#0F0F1A' }}>
        <Outlet />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <TopBar />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: '64px',
          ml: sidebarOpen ? `${sidebarWidth}px` : 0,
          transition: 'margin-left 0.3s ease',
          p: 3,
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};