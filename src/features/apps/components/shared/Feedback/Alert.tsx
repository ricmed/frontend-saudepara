// src/features/apps/components/shared/Feedback/Alert.tsx
import { AlertCircle, CheckCircle } from "lucide-react";

interface AlertProps {
  type: 'error' | 'success';
  message: string;
  onClose?: () => void;
}

export const Alert = ({ type, message, onClose }: AlertProps) => {
  const styles = {
    error: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      icon: <AlertCircle className="h-5 w-5 text-red-600" />,
      closeButton: 'text-red-600 hover:text-red-800'
    },
    success: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      closeButton: ''
    }
  };

  const style = styles[type];

  return (
    <div className={`${style.bg} p-4 rounded-lg flex items-center gap-3`}>
      {style.icon}
      <span className={`${style.text} flex-1`}>{message}</span>
      {onClose && type === 'error' && (
        <button
          onClick={onClose}
          className={style.closeButton}
        >
          ×
        </button>
      )}
    </div>
  );
};