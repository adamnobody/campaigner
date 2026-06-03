const pendingWrites = new Set<Promise<unknown>>();

export const trackCanvasWrite = <T>(write: Promise<T>): Promise<T> => {
  pendingWrites.add(write);
  return write.finally(() => {
    pendingWrites.delete(write);
  });
};

export const flushCanvasWrites = async (): Promise<void> => {
  const batch = [...pendingWrites];
  if (batch.length === 0) return;
  await Promise.allSettled(batch);
};

export const pendingCanvasWriteCount = (): number => pendingWrites.size;
