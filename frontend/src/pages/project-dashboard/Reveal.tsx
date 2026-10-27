import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

type RevealProps = {
  children: React.ReactNode;
  shouldAnimate: boolean;
  delay?: number;
  animationKey: string;
  style?: React.CSSProperties;
};

export function Reveal({
  children,
  shouldAnimate,
  delay = 0,
  animationKey,
  style,
}: RevealProps) {
  const [entered, setEntered] = useState(!shouldAnimate);

  useEffect(() => {
    if (!shouldAnimate) {
      setEntered(true);
      return;
    }

    setEntered(false);

    let raf1 = 0;
    let raf2 = 0;

    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        setEntered(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [animationKey, shouldAnimate]);

  return (
    <motion.div
      initial={false}
      animate={
        shouldAnimate && !entered
          ? { opacity: 0, y: 32 }
          : { opacity: 1, y: 0 }
      }
      transition={
        shouldAnimate && entered
          ? {
              duration: 0.42,
              delay,
              ease: [0.22, 1, 0.36, 1],
            }
          : {
              duration: 0,
            }
      }
      style={style}
    >
      {children}
    </motion.div>
  );
}
