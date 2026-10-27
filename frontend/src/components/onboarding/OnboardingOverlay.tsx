import React, { useEffect, useMemo, useState } from 'react';
import { Backdrop, Box, Button, Paper, Typography, alpha, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { onboardingSteps } from './onboardingSteps';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';

export const OnboardingOverlay: React.FC = () => {
  const { t } = useTranslation(['onboarding', 'common']);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const {
    isActive,
    activeProjectId,
    progressByProject,
    nextStep,
    stop,
    completeForProject,
  } = useOnboardingStore();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const motionMode = usePreferencesStore((state) => state.motionMode);
  const reducedMotion = motionMode === 'reduced';
  const transitionMs = reducedMotion ? 0 : 220;

  const stepIndex = activeProjectId ? (progressByProject[activeProjectId]?.stepIndex ?? 0) : 0;
  const step = onboardingSteps[stepIndex];

  useEffect(() => {
    if (!isActive || !activeProjectId || !step) return;
    if (step.route && !location.pathname.includes(`/project/${activeProjectId}/${step.route}`)) {
      navigate(`/project/${activeProjectId}/${step.route}`);
      return;
    }
    const updateRect = () => {
      const el = document.querySelector(step.selector);
      if (el instanceof HTMLElement) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        el.scrollIntoView({ block: 'center', behavior: reducedMotion ? 'auto' : 'smooth' });
      } else {
        setTargetRect(null);
      }
    };
    updateRect();
    const timer = setTimeout(updateRect, reducedMotion ? 0 : 300);
    window.addEventListener('resize', updateRect);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateRect);
    };
  }, [activeProjectId, isActive, location.pathname, navigate, reducedMotion, step]);

  const stepProgress = useMemo(
    () => ({
      current: Math.min(stepIndex + 1, onboardingSteps.length),
      total: onboardingSteps.length,
    }),
    [stepIndex]
  );

  if (!isActive || !activeProjectId || !step) return null;

  const finish = () => completeForProject(activeProjectId);

  return (
    <Backdrop
      open
      transitionDuration={transitionMs}
      sx={{
        zIndex: (currentTheme) => currentTheme.zIndex.modal + 10,
        backgroundColor: alpha(theme.palette.background.default, 0.78),
        backdropFilter: 'blur(3px)',
      }}
    >
      {targetRect && (
        <Box
          sx={{
            position: 'fixed',
            left: targetRect.left - 6,
            top: targetRect.top - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            borderRadius: '12px',
            border: `1px solid ${theme.palette.primary.main}`,
            pointerEvents: 'none',
            transition: reducedMotion ? 'none' : `all ${transitionMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
            boxShadow: reducedMotion ? 'none' : `0 0 0 9999px ${alpha(theme.palette.background.default, 0.12)}, 0 0 28px ${alpha(theme.palette.primary.main, 0.24)}`,
          }}
        />
      )}
      <Paper
        sx={{
          p: 3,
          width: 380,
          maxWidth: '90vw',
          borderRadius: '18px',
          backgroundColor: alpha(theme.palette.background.default, 0.96),
          border: `1px solid ${theme.campaigner.surface.border}`,
          boxShadow: '0 34px 90px rgba(0,0,0,0.58)',
          transition: reducedMotion ? 'none' : `transform ${transitionMs}ms ease, opacity ${transitionMs}ms ease`,
          transform: reducedMotion ? 'none' : 'translateY(0)',
        }}
      >
        <Typography variant="overline" color="text.secondary">
          {t('onboarding:overlay.title', stepProgress)}
        </Typography>
        <Box sx={{ height: 2, mt: 1, mb: 2, borderRadius: 1, bgcolor: theme.campaigner.surface.raised, overflow: 'hidden' }}>
          <Box
            sx={{
              width: `${(stepProgress.current / stepProgress.total) * 100}%`,
              height: '100%',
              bgcolor: 'primary.main',
              transition: reducedMotion ? 'none' : `width ${transitionMs}ms ease`,
            }}
          />
        </Box>
        <Typography variant="h5">
          {t(`onboarding:steps.${step.id}.title`)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.2 }}>
          {t(`onboarding:steps.${step.id}.description`)}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2.5 }}>
          <Button color="inherit" onClick={stop}>{t('common:skip')}</Button>
          {stepIndex >= onboardingSteps.length - 1 ? (
            <Button variant="contained" onClick={finish}>{t('common:done')}</Button>
          ) : (
            <Button variant="contained" onClick={nextStep}>{t('common:next')}</Button>
          )}
        </Box>
      </Paper>
    </Backdrop>
  );
};
