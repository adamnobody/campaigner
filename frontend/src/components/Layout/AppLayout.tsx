import React from 'react';
import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { useUIStore } from '@/store/useUIStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { shallow } from 'zustand/shallow';

export const AppLayout: React.FC = () => {
  const { sidebarOpen, sidebarWidth } = useUIStore((state) => ({
    sidebarOpen: state.sidebarOpen,
    sidebarWidth: state.sidebarWidth,
  }), shallow);
  const motionMode = usePreferencesStore((state) => state.motionMode);
  const location = useLocation();
  const pageTransitionMs = motionMode === 'reduced' ? 0 : 220;
  const pageKey = `${location.pathname}${location.search}`;

  const isHomePage = location.pathname === '/';

  if (isHomePage) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#0F0F1A', position: 'relative' }}>
        <Outlet />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      <TopBar />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: '64px',
          ml: sidebarOpen ? `${sidebarWidth}px` : 0,
          transition: pageTransitionMs ? `margin-left ${pageTransitionMs}ms ease` : 'none',
          p: 3,
          minHeight: 'calc(100vh - 64px)',
          minWidth: 0,
          '@keyframes pageFadeSlideIn': {
            from: { opacity: 0, transform: 'translateY(8px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        <Box
          key={pageKey}
          sx={pageTransitionMs
            ? { animation: `pageFadeSlideIn ${pageTransitionMs}ms cubic-bezier(0.22, 1, 0.36, 1)` }
            : undefined}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};