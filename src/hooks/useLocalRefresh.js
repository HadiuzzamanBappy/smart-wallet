import { useState, useCallback } from 'react';

/**
 * useLocalRefresh
 * Small helper hook to wrap a local async refresh function with an isRefreshing state.
 * Usage:
 * const { isRefreshing, run } = useLocalRefresh(async () => { await refreshDues(); });
 * run();
 */
export const useLocalRefresh = (minDuration = 300) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const run = useCallback(async (fn) => {
    if (typeof fn !== 'function') return;
    const start = Date.now();
    try {
      setIsRefreshing(true);
      await fn();
    } catch (e) {
      // Avoid unused var lint while keeping the hook quiet
      void e;
    } finally {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, minDuration - elapsed);
      if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
      setIsRefreshing(false);
    }
  }, [minDuration]);

  return { isRefreshing, run };
};

export default useLocalRefresh;
