import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Filter, Search, X } from 'lucide-react';

export type ListSearchFieldOption = {
  value: string;
  label: string;
};

export type ListDateFilterValues = {
  data_inicio?: string;
  data_fim?: string;
};

export type ListSearchFiltersBarProps = {
  searchFields: ListSearchFieldOption[];
  searchField: string;
  searchTerm: string;
  onSearchFieldChange: (field: string) => void;
  onSearchTermChange: (term: string) => void;
  dateFilters: ListDateFilterValues;
  onApplyDateFilters: (next: ListDateFilterValues) => void;
  onClearDateFilters: () => void;
  disabled?: boolean;
};

/**
 * Busca (campo + termo) + painel de período — padrão Comunicação DAE.
 * O debounce do termo fica a cargo do pai (mín. 3 chars).
 */
export const ListSearchFiltersBar: React.FC<ListSearchFiltersBarProps> = ({
  searchFields,
  searchField,
  searchTerm,
  onSearchFieldChange,
  onSearchTermChange,
  dateFilters,
  onApplyDateFilters,
  onClearDateFilters,
  disabled = false,
}) => {
  const [fieldOpen, setFieldOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [tempDates, setTempDates] = useState<ListDateFilterValues>(dateFilters);
  const fieldRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setTempDates(dateFilters);
  }, [dateFilters.data_inicio, dateFilters.data_fim]);

  useEffect(() => {
    if (!fieldOpen) return;
    const onDown = (e: MouseEvent) => {
      if (fieldRef.current && !fieldRef.current.contains(e.target as Node)) setFieldOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [fieldOpen]);

  const activeFilterCount =
    (dateFilters.data_inicio ? 1 : 0) + (dateFilters.data_fim ? 1 : 0);
  const fieldLabel = searchFields.find((f) => f.value === searchField)?.label ?? 'Todos';

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setShowFilters((v) => !v);
            setTempDates(dateFilters);
          }}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <Filter className="h-4 w-4" />
          Filtros
          {activeFilterCount > 0 ? (
            <span className="ml-1 rounded-full bg-blue-600 text-white text-xs px-1.5 py-0.5">
              {activeFilterCount}
            </span>
          ) : null}
        </button>

        <div className="flex-1 w-full sm:max-w-xl">
          <div className="relative flex items-center">
            <div className="relative" ref={fieldRef}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => setFieldOpen((v) => !v)}
                className="h-10 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-l-lg border-r border-blue-500 transition-colors flex items-center gap-1 text-sm font-medium disabled:opacity-50"
              >
                <span className="hidden sm:inline">{fieldLabel}</span>
                <span className="sm:hidden">Campo</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {fieldOpen ? (
                <div className="absolute left-0 mt-1 w-52 bg-white rounded-lg shadow-xl border border-gray-200 z-40">
                  {searchFields.map((field) => (
                    <button
                      key={field.value}
                      type="button"
                      onClick={() => {
                        onSearchFieldChange(field.value);
                        setFieldOpen(false);
                      }}
                      className={`block w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${
                        searchField === field.value ? 'bg-blue-50 text-blue-800 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {field.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="search"
                value={searchTerm}
                disabled={disabled}
                onChange={(e) => onSearchTermChange(e.target.value)}
                placeholder="Buscar (mín. 3 caracteres)…"
                className="h-10 w-full pl-9 pr-9 border border-l-0 border-gray-300 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                data-testid="form-list-search"
              />
              {searchTerm ? (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  onClick={() => onSearchTermChange('')}
                  title="Limpar busca"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
          {searchTerm.length > 0 && searchTerm.length < 3 ? (
            <p className="mt-1 text-xs text-amber-700">Digite pelo menos 3 caracteres para buscar.</p>
          ) : null}
        </div>
      </div>

      {showFilters ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data início (envio)</label>
              <input
                type="date"
                value={tempDates.data_inicio ?? ''}
                onChange={(e) => setTempDates((d) => ({ ...d, data_inicio: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data fim (envio)</label>
              <input
                type="date"
                value={tempDates.data_fim ?? ''}
                onChange={(e) => setTempDates((d) => ({ ...d, data_fim: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setTempDates({});
                onClearDateFilters();
                setShowFilters(false);
              }}
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => {
                onApplyDateFilters(tempDates);
                setShowFilters(false);
              }}
              className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Aplicar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ListSearchFiltersBar;
