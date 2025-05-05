// src/features/notificationForms/components/ColumnsMenu.tsx
import React from 'react';
import { ColumnDefinition } from '../types';

interface ColumnsMenuProps {
  isOpen: boolean;
  columns: ColumnDefinition[];
  selectedColumns: string[];
  onToggleColumn: (colKey: string) => void;
}

const ColumnsMenu: React.FC<ColumnsMenuProps> = ({ 
  isOpen, 
  columns, 
  selectedColumns, 
  onToggleColumn 
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-2">
      {columns.map((col) => (
        <div
          key={col.key}
          className="flex items-center p-2 hover:bg-gray-50 rounded"
        >
          <input
            type="checkbox"
            id={`col-${col.key}`}
            checked={selectedColumns.includes(col.key)}
            onChange={() => onToggleColumn(col.key)}
            className="mr-2"
          />
          <label
            htmlFor={`col-${col.key}`}
            className="text-sm text-gray-700 cursor-pointer"
          >
            {col.label}
          </label>
        </div>
      ))}
    </div>
  );
};

export default ColumnsMenu;