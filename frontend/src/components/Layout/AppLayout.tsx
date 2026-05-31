import React from 'react';
import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { useProjectScope } from '@/hooks/useProjectScope';

export const AppLayout: React.FC = () => {
  useProjectScope();
  const motionMode = usePreferencesStore((state) => state.motionMode);
  const location = useLocation();
  const pageTransitionMs = motionMode === 'reduced' ? 0 : 220;
  const shouldAnimatePage = motionMode !== 'reduced';
  const pageKey = `${location.pathname}${location.search}`;

  const isHomePage = location.pathname === '/';
  const isCanvasPage = /^\/project\/[^/]+\/map(?:\/.*)?$/.test(location.pathname);

  if (isHomePage) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#0F0F1A', position: 'relative' }}>
        <Outlet />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100dvh',
        pt: '64px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <TopBar />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          height: '100%',
          boxSizing: 'border-box',
          minHeight: 0,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: isCanvasPage ? 'hidden' : 'auto',
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
            style={{
              flex: 1,
              width: '100%',
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: isCanvasPage ? 'hidden' : 'visible',
            }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  );
};