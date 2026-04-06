import React, { useEffect, useMemo, useState } from 'react';
import { Backdrop, Box, Button, Paper, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { onboardingSteps } from './onboardingSteps';
import { useOnboardingStore } from '@/store/useOnboardingStore';

export const OnboardingOverlay: React.FC = () => {
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
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } else {
        setTargetRect(null);
      }
    };
    updateRect();
    const timer = setTimeout(updateRect, 300);
    window.addEventListener('resize', updateRect);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateRect);
    };
  }, [activeProjectId, isActive, location.pathname, navigate, step]);

  const stepLabel = useMemo(
    () => `${Math.min(stepIndex + 1, onboardingSteps.length)} / ${onboardingSteps.length}`,
    [stepIndex]
  );

  if (!isActive || !activeProjectId || !step) return null;

  const finish = () => completeForProject(activeProjectId);

  return (
    <Backdrop open sx={{ zIndex: (theme) => theme.zIndex.modal + 10, backgroundColor: 'rgba(0,0,0,0.65)' }}>
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
          }}
        />
      )}
      <Paper sx={{ p: 2.5, width: 380, maxWidth: '90vw' }}>
        <Typography variant="overline" color="text.secondary">
          Обучение · Шаг {stepLabel}
        </Typography>
        <Typography variant="h6" sx={{ mt: 0.5 }}>{step.title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.2 }}>
          {step.description}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2.5 }}>
          <Button color="inherit" onClick={stop}>Пропустить</Button>
          {stepIndex >= onboardingSteps.length - 1 ? (
            <Button variant="contained" onClick={finish}>Завершить</Button>
          ) : (
            <Button variant="contained" onClick={nextStep}>Далее</Button>
          )}
        </Box>
      </Paper>
    </Backdrop>
  );
};
