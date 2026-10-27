import React from 'react';
import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { useProjectScope } from '@/hooks/useProjectScope';
import { useUIStore } from '@/store/useUIStore';
import { PageFade, ShellFade } from '@/components/ui/MotionSwitch';

export const AppLayout: React.FC = () => {
  useProjectScope();
  const location = useLocation();
  const editorFocus = useUIStore((state) => state.editorFocus);
  const pageKey = location.pathname;

  const isHomePage = location.pathname === '/';
  const isAppearancePage = location.pathname === '/appearance';
  const fillPage = /^\/project\/[^/]+\/(map(?:\/.*)?|graph|characters\/graph|wiki\/graph|notes\/\d+|wiki\/\d+)$/.test(
    location.pathname,
  );
  const shellKey = isHomePage ? 'home' : isAppearancePage ? 'appearance' : 'app';

  return (
    <Box
      sx={{
        height: '100dvh',
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden',
        backgroundColor: 'background.default',
      }}
    >
      <ShellFade shellKey={shellKey}>
        {shellKey === 'app' ? (
          <Box
            sx={{
              display: 'flex',
              height: '100%',
              minHeight: 0,
              boxSizing: 'border-box',
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: 'background.default',
            }}
          >
            {editorFocus ? null : <Sidebar />}
            <Box
              sx={{
                flexGrow: 1,
                height: '100%',
                boxSizing: 'border-box',
                minHeight: 0,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <TopBar />
              <Box
                component="main"
                sx={{
                  flex: 1,
                  minHeight: 0,
                  minWidth: 0,
                  overflow: fillPage ? 'hidden' : 'auto',
                }}
              >
                <PageFade motionKey={pageKey} fill={fillPage} gentle={fillPage}>
                  <Outlet />
                </PageFade>
              </Box>
            </Box>
          </Box>
        ) : (
          <Box sx={{ minHeight: '100%', height: '100%', backgroundColor: 'background.default', position: 'relative' }}>
            <Outlet />
          </Box>
        )}
      </ShellFade>
    </Box>
  );
};
