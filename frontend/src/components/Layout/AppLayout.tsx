import React from 'react';
import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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
  const shouldAnimatePage = motionMode !== 'reduced';
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
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pageKey}
            initial={shouldAnimatePage ? { opacity: 0, y: 8 } : false}
            animate={shouldAnimatePage ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
            exit={shouldAnimatePage ? { opacity: 0, y: -4 } : undefined}
            transition={shouldAnimatePage
              ? { duration: pageTransitionMs / 1000, ease: [0.22, 1, 0.36, 1] }
              : undefined}
            style={{ minHeight: '100%' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  );
};