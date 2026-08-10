import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download, FileSpreadsheet } from 'lucide-react';

export type ListExportMenuProps = {
  disabled?: boolean;
  onExportPage: (format: 'xlsx' | 'csv') => void;
  onExportAll: (format: 'xlsx' | 'csv') => void;
};

/** Menu de exportação: página atual vs completo (Excel/CSV), estilo Comunicação DAE. */
export const ListExportMenu: React.FC<ListExportMenuProps> = ({
  disabled = false,
  onExportPage,
  onExportAll,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-2 bg-white text-emerald-700 rounded-lg hover:bg-emerald-50 flex items-center gap-2 shadow font-medium disabled:opacity-50"
        title="Exportar"
      >
        <Download className="h-4 w-4" />
        Exportar
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-40 overflow-hidden text-gray-700">
          <div className="py-1">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
              <span className="text-xs font-semibold text-gray-700 uppercase">Página atual</span>
            </div>
            <button
              type="button"
              className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors"
              onClick={() => run(() => onExportPage('xlsx'))}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-sm font-medium">Excel</span>
            </button>
            <button
              type="button"
              className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors"
              onClick={() => run(() => onExportPage('csv'))}
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-sm font-medium">CSV</span>
            </button>

            <div className="px-3 py-2 bg-gray-50 border-t border-b border-gray-200 mt-1">
              <span className="text-xs font-semibold text-gray-700 uppercase">Exportação completa</span>
            </div>
            <button
              type="button"
              className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors"
              onClick={() => run(() => onExportAll('xlsx'))}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-sm font-medium">Excel</span>
            </button>
            <button
              type="button"
              className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors"
              onClick={() => run(() => onExportAll('csv'))}
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-sm font-medium">CSV</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ListExportMenu;
