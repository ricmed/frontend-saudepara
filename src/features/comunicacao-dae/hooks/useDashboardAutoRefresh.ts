import { useCallback, useEffect, useRef, useState } from 'react';

type UseDashboardAutoRefreshOptions = {
  intervalSeconds?: number;
  enabledByDefault?: boolean;
};

export const useDashboardAutoRefresh = (
  onRefresh: () => void,
  options: UseDashboardAutoRefreshOptions = {}
) => {
  const intervalSeconds = options.intervalSeconds ?? 60;
  const enabledByDefault = options.enabledByDefault ?? true;

  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(enabledByDefault);
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState(intervalSeconds);
  const refreshRef = useRef(onRefresh);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    refreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!autoRefreshEnabled) {
      return () => undefined;
    }

    let countdown = intervalSeconds;
    setAutoRefreshCountdown(countdown);

    const countdownTimer = setInterval(() => {
      countdown -= 1;
      setAutoRefreshCountdown(countdown);

      if (countdown <= 0) {
        refreshRef.current();
        countdown = intervalSeconds;
        setAutoRefreshCountdown(countdown);
      }
    }, 1000);

    timerRef.current = countdownTimer;

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [autoRefreshEnabled, intervalSeconds]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled((prev) => !prev);
  }, []);

  return {
    autoRefreshEnabled,
    autoRefreshCountdown,
    toggleAutoRefresh
  };
};
