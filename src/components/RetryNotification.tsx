import React, { useEffect, useState } from 'react';

interface RetryNotificationProps {
  show: boolean;
  message: string;
  delay?: number;
}

export const RetryNotification: React.FC<RetryNotificationProps> = ({ 
  show, 
  message, 
  delay = 30 
}) => {
  const [timeLeft, setTimeLeft] = useState(delay);
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setTimeLeft(delay);
      
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsVisible(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setIsVisible(false);
    }
  }, [show, delay]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className="bg-yellow-500 text-white px-6 py-4 rounded-lg shadow-lg max-w-sm">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <div>
            <p className="font-medium">Aguarde...</p>
            <p className="text-sm opacity-90">{message}</p>
            {timeLeft > 0 && (
              <p className="text-xs opacity-75 mt-1">
                Nova tentativa em {timeLeft}s
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Adicionar estilos CSS para a animação
const styles = `
  @keyframes slide-in-right {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  .animate-slide-in-right {
    animation: slide-in-right 0.3s ease-out;
  }
`;

// Injetar estilos se ainda não existirem
if (typeof document !== 'undefined' && !document.getElementById('retry-notification-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'retry-notification-styles';
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}
