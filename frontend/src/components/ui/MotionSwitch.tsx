import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { usePreferencesStore } from '@/store/usePreferencesStore';

const EASE = [0.22, 1, 0.36, 1] as const;

export function useComfortMotion() {
  const prefReduced = usePreferencesStore((state) => state.motionMode) === 'reduced';
  const osReduced = useReducedMotion();
  const reduced = prefReduced || Boolean(osReduced);
  return {
    enabled: !reduced,
    page: { duration: reduced ? 0 : 0.32, ease: EASE },
    tab: { duration: reduced ? 0 : 0.22, ease: EASE },
    shell: { duration: reduced ? 0 : 0.34, ease: EASE },
  };
}

export function ShellFade({
  shellKey,
  children,
}: {
  shellKey: string;
  children: React.ReactNode;
}) {
  const { enabled, shell } = useComfortMotion();
  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={shellKey}
        initial={enabled ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        exit={enabled ? { opacity: 0 } : undefined}
        transition={shell}
        style={{
          display: 'flex',
          flexDirection: 'column',
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function PageFade({
  motionKey,
  children,
  fill = false,
  gentle = false,
}: {
  motionKey: string;
  children: React.ReactNode;
  fill?: boolean;
  gentle?: boolean;
}) {
  const { enabled, page } = useComfortMotion();
  const distance = gentle ? 0 : 10;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={motionKey}
        initial={enabled ? { opacity: 0, y: distance } : false}
        animate={{ opacity: 1, y: 0 }}
        exit={enabled ? { opacity: 0, y: gentle ? 0 : -6 } : undefined}
        transition={page}
        style={{
          width: '100%',
          ...(fill
            ? {
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minHeight: 0,
                overflow: gentle ? 'hidden' : 'visible',
              }
            : undefined),
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function TabFade({ tab, children }: { tab: string; children: React.ReactNode }) {
  const { enabled, tab: transition } = useComfortMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={tab}
        initial={enabled ? { opacity: 0, y: 6 } : false}
        animate={{ opacity: 1, y: 0 }}
        exit={enabled ? { opacity: 0, y: -4 } : undefined}
        transition={transition}
        style={{ width: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
