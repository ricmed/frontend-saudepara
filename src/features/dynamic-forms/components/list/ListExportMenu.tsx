import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download } from 'lucide-react';

export type ListExportMenuProps = {
  disabled?: boolean;
  onExportPage: (format: 'xlsx' | 'csv') => void;
  onExportAll: (format: 'xlsx' | 'csv') => void;
};

/** Menu de exportação: página atual vs completo (XLSX/CSV). */
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
        <ChevronDown className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute right-0 mt-1 w-56 rounded-lg border border-gray-200 bg-white shadow-xl z-40 p-2 space-y-2">
          <div className="px-2 pt-1 text-xs font-semibold uppercase text-gray-500">Página atual</div>
          <button
            type="button"
            className="w-full text-left px-3 py-2 text-sm rounded hover:bg-emerald-50"
            onClick={() => {
              setOpen(false);
              onExportPage('xlsx');
            }}
          >
            XLSX (página)
          </button>
          <button
            type="button"
            className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50"
            onClick={() => {
              setOpen(false);
              onExportPage('csv');
            }}
          >
            CSV (página)
          </button>
          <div className="border-t border-gray-100 my-1" />
          <div className="px-2 pt-1 text-xs font-semibold uppercase text-gray-500">Completo</div>
          <button
            type="button"
            className="w-full text-left px-3 py-2 text-sm rounded hover:bg-emerald-50"
            onClick={() => {
              setOpen(false);
              onExportAll('xlsx');
            }}
          >
            XLSX (completo)
          </button>
          <button
            type="button"
            className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50"
            onClick={() => {
              setOpen(false);
              onExportAll('csv');
            }}
          >
            CSV (completo)
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default ListExportMenu;
