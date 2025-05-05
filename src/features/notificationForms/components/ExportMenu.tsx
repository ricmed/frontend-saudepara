// src/features/notificationForms/components/ExportMenu.tsx
import React from 'react';
import { Download } from 'lucide-react';

interface ExportMenuProps {
  isOpen: boolean;
  onExport: (format: 'csv' | 'excel' | 'pdf', type: 'page' | 'all') => void;
}

const ExportMenu: React.FC<ExportMenuProps> = ({ isOpen, onExport }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-2">
      <div className="border-b pb-2 mb-2">
        <h3 className="text-sm font-medium text-gray-700 px-2">
          Página Atual
        </h3>
        <button
          onClick={() => onExport('csv', 'page')}
          className="w-full text-left px-2 py-1.5 text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          CSV (página atual)
        </button>
        <button
          onClick={() => onExport('excel', 'page')}
          className="w-full text-left px-2 py-1.5 text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Excel (página atual)
        </button>
        <button
          onClick={() => onExport('pdf', 'page')}
          className="w-full text-left px-2 py-1.5 text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          PDF (página atual)
        </button>
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-700 px-2">
          Todos os Dados
        </h3>
        <button
          onClick={() => onExport('csv', 'all')}
          className="w-full text-left px-2 py-1.5 text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          CSV (todos os dados)
        </button>
        <button
          onClick={() => onExport('excel', 'all')}
          className="w-full text-left px-2 py-1.5 text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Excel (todos os dados)
        </button>
        <button
          onClick={() => onExport('pdf', 'all')}
          className="w-full text-left px-2 py-1.5 text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          PDF (todos os dados)
        </button>
      </div>
    </div>
  );
};

export default ExportMenu;