// src/features/apps/components/shared/Layout/PageHeader.tsx
import { ArrowLeft, Menu } from "lucide-react";

interface PageHeaderProps {
  title: string;
  onMenuClick: () => void;
  onBackClick: () => void;
}

export const PageHeader = ({ title, onMenuClick, onBackClick }: PageHeaderProps) => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 text-white hover:bg-blue-700 rounded-full transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <button
            onClick={onBackClick}
            className="p-2 text-white hover:bg-blue-700 rounded-full transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          
          <h1 className="text-2xl font-bold text-white">{title}</h1>
        </div>
      </div>
    </header>
  );
};