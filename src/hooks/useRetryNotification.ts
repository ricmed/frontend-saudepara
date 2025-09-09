import { useEffect, useState } from 'react';

interface RetryState {
  isRetrying: boolean;
  message: string;
  delay: number;
}

export const useRetryNotification = () => {
  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    message: '',
    delay: 0
  });

  useEffect(() => {
    const handleRetry429 = (event: CustomEvent) => {
      setRetryState({
        isRetrying: true,
        message: event.detail.message,
        delay: event.detail.delay
      });

      // Limpar o estado após o delay
      setTimeout(() => {
        setRetryState(prev => ({ ...prev, isRetrying: false }));
      }, event.detail.delay * 1000);
    };

    // Escutar evento customizado
    window.addEventListener('retry429', handleRetry429 as EventListener);

    return () => {
      window.removeEventListener('retry429', handleRetry429 as EventListener);
    };
  }, []);

  return retryState;
};
