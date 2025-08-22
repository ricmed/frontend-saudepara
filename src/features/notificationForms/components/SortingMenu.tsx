// src/features/notificationForms/components/SortingMenu.tsx
import React from 'react';
import { ColumnDefinition } from '../types';

interface SortingMenuProps {
  isOpen: boolean;
  columns: ColumnDefinition[];
  sortKey: string;
  sortOrder: "asc" | "desc";
  onSortChange: (key: string) => void;
}

const SortingMenu: React.FC<SortingMenuProps> = ({
  isOpen,
  columns,
  sortKey,
  sortOrder,
  onSortChange
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute left-0 md:left-0 right-0 md:right-auto mt-2 w-48 md:w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-2">
      {columns
        .filter((col) => col.sortable !== false)
        .map((col) => (
          <button
            key={col.key}
            onClick={() => onSortChange(col.key)}
            className={`block w-full text-left text-sm ${
              sortKey === col.key 
                ? 'text-blue-600 font-medium'
                : 'text-gray-700' 
            } hover:bg-gray-50 px-2 py-1 rounded flex items-center justify-between`}
          >
            <span>{col.label}</span>
            {sortKey === col.key && (
              <span>{sortOrder === "asc" ? "▲" : "▼"}</span>
            )}
          </button>
        ))}
    </div>
  );
};

export default SortingMenu;