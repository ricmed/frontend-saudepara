// src/features/notificationForms/components/shared/SectionHeader.tsx
import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { SectionHeaderProps } from '@/features/notificationForms/types/index2';

const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
  isExpanded,
  onToggle,
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      {isExpanded ? (
        <ChevronUp className="h-5 w-5 text-gray-500" />
      ) : (
        <ChevronDown className="h-5 w-5 text-gray-500" />
      )}
    </button>
  );
};

export default SectionHeader;