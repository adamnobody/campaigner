import React, { useEffect, useMemo, useState } from 'react';
import { Backdrop, Box, Button, Paper, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { onboardingSteps } from './onboardingSteps';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';

export const OnboardingOverlay: React.FC = () => {
  const { t } = useTranslation(['onboarding', 'common']);
  const navigate = useNavigate();
  const location = useLocation();
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
      sx={{ zIndex: (theme) => theme.zIndex.modal + 10, backgroundColor: 'rgba(0,0,0,0.65)' }}
    >
      {targetRect && (
        <Box
          sx={{
            position: 'fixed',
            left: targetRect.left - 6,
            top: targetRect.top - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            borderRadius: 1.5,
            border: '2px solid rgba(255,255,255,0.9)',
            pointerEvents: 'none',
            transition: reducedMotion ? 'none' : `all ${transitionMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
            boxShadow: reducedMotion ? 'none' : '0 0 0 9999px rgba(0,0,0,0.08), 0 0 24px rgba(255,255,255,0.22)',
          }}
        />
      )}
      <Paper
        sx={{
          p: 2.5,
          width: 380,
          maxWidth: '90vw',
          transition: reducedMotion ? 'none' : `transform ${transitionMs}ms ease, opacity ${transitionMs}ms ease`,
          transform: reducedMotion ? 'none' : 'translateY(0)',
        }}
      >
        <Typography variant="overline" color="text.secondary">
          {t('onboarding:overlay.title', stepProgress)}
        </Typography>
        <Typography variant="h6" sx={{ mt: 0.5 }}>
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
