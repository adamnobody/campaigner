import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TutorialProgress {
  projectId: number;
  stepIndex: number;
  completed: boolean;
}

interface OnboardingState {
  activeProjectId: number | null;
  isActive: boolean;
  dismissed: boolean;
  version: number;
  progressByProject: Record<number, TutorialProgress>;
  startForProject: (projectId: number) => void;
  stop: () => void;
  nextStep: () => void;
  completeForProject: (projectId: number) => void;
}

const ONBOARDING_VERSION = 1;

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      activeProjectId: null,
      isActive: false,
      dismissed: false,
      version: ONBOARDING_VERSION,
      progressByProject: {},
      startForProject: (projectId) =>
        set((state) => ({
          activeProjectId: projectId,
          isActive: true,
          dismissed: false,
          progressByProject: {
            ...state.progressByProject,
            [projectId]: state.progressByProject[projectId] ?? {
              projectId,
              stepIndex: 0,
              completed: false,
            },
          },
        })),
      stop: () => set({ isActive: false, dismissed: true }),
      nextStep: () =>
        set((state) => {
          const activeProjectId = state.activeProjectId;
          if (!activeProjectId) return state;
          const current = state.progressByProject[activeProjectId] ?? {
            projectId: activeProjectId,
            stepIndex: 0,
            completed: false,
          };
          return {
            progressByProject: {
              ...state.progressByProject,
              [activeProjectId]: {
                ...current,
                stepIndex: current.stepIndex + 1,
              },
            },
          };
        }),
      completeForProject: (projectId) =>
        set((state) => ({
          isActive: false,
          activeProjectId: null,
          progressByProject: {
            ...state.progressByProject,
            [projectId]: {
              projectId,
              stepIndex: state.progressByProject[projectId]?.stepIndex ?? 0,
              completed: true,
            },
          },
        })),
    }),
    {
      name: 'campaigner-onboarding',
      version: ONBOARDING_VERSION,
    }
  )
);
