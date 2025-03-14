// src/features/apps/components/shared/Button/SubmitButton.tsx
import { Save } from "lucide-react";

interface SubmitButtonProps {
  isLoading: boolean;
  isDisabled?: boolean;
  loadingText?: string;
  defaultText: string;
}

export const SubmitButton = ({
  isLoading,
  isDisabled = false,
  loadingText = "Salvando...",
  defaultText
}: SubmitButtonProps) => {
  return (
    <button
      type="submit"
      disabled={isLoading || isDisabled}
      className={`w-full py-3 px-6 flex items-center justify-center gap-2 ${
        isLoading 
          ? "bg-blue-400 cursor-not-allowed" 
          : "bg-blue-600 hover:bg-blue-700"
      } text-white rounded-lg font-medium transition-colors`}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {loadingText}
        </>
      ) : (
        <>
          <Save className="h-5 w-5" />
          {defaultText}
        </>
      )}
    </button>
  );
};