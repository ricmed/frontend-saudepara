// src/features/apps/components/shared/Button/CancelButton.tsx
import { X } from "lucide-react";

interface CancelButtonProps {
  onClick: () => void;
  isDisabled?: boolean;
  text?: string;
}

export const CancelButton = ({
  onClick,
  isDisabled = false,
  text = "Cancelar"
}: CancelButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className="w-full py-3 px-6 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
    >
      <X className="h-5 w-5" />
      {text}
    </button>
  );
};