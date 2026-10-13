import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { getRuntimeApiRoot } from '@/config/runtimeApiBase';

export const MONITOR_OPER_CRS_TODOS = '*';

type CrsOption = { value: string; label: string };

type Props = {
  label: string;
  required?: boolean;
  helpText?: string;
  error?: string;
  disabled?: boolean;
  allowTodos: boolean;
  getValue: (key: string) => unknown;
  setValue: (key: string, value: unknown) => void;
};

function selectedIds(getValue: (key: string) => unknown): string[] {
  const abrangencia = String(getValue('cabecalho.crs_abrangencia') ?? '');
  const rawId = getValue('cabecalho.crs_id');
  if (abrangencia === 'todos' || String(rawId ?? '') === MONITOR_OPER_CRS_TODOS) return [];
  const fromArr = getValue('cabecalho.crs_ids');
  if (Array.isArray(fromArr)) {
    return fromArr.map((v) => String(v)).filter((v) => v && v !== MONITOR_OPER_CRS_TODOS);
  }
  const raw = String(rawId ?? '').trim();
  if (!raw || raw === MONITOR_OPER_CRS_TODOS) return [];
  if (raw.includes(',')) return raw.split(',').map((s) => s.trim()).filter(Boolean);
  return [raw];
}

function isTodos(getValue: (key: string) => unknown): boolean {
  return (
    String(getValue('cabecalho.crs_abrangencia') ?? '') === 'todos' ||
    String(getValue('cabecalho.crs_id') ?? '') === MONITOR_OPER_CRS_TODOS
  );
}

export const MonitorOperCrsMultiField: React.FC<Props> = ({
  label,
  required,
  helpText,
  error,
  disabled,
  allowTodos,
  getValue,
  setValue,
}) => {
  const [options, setOptions] = useState<CrsOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const todos = isTodos(getValue);
  const ids = selectedIds(getValue);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    axios
      .get(`${getRuntimeApiRoot()}/crs/select`, { withCredentials: true })
      .then((response) => {
        if (cancelled) return;
        const data = Array.isArray(response.data) ? response.data : [];
        setOptions(
          data
            .map((item: { id?: unknown; value?: unknown; nome?: unknown; label?: unknown }) => ({
              value: String(item.value ?? item.id ?? ''),
              label: String(item.label ?? item.nome ?? item.value ?? ''),
            }))
            .filter((o) => o.value && o.label),
        );
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const applyLista = (next: string[]) => {
    const unique = Array.from(new Set(next.filter((id) => id && id !== MONITOR_OPER_CRS_TODOS)));
    setValue('cabecalho.crs_abrangencia', 'lista');
    setValue('cabecalho.crs_ids', unique);
    setValue('cabecalho.crs_id', unique.join(','));
  };

  const applyTodos = () => {
    setValue('cabecalho.crs_abrangencia', 'todos');
    setValue('cabecalho.crs_ids', []);
    setValue('cabecalho.crs_id', MONITOR_OPER_CRS_TODOS);
  };

  const closedLabel = useMemo(() => {
    if (todos) return 'Todos';
    if (ids.length === 0) return '';
    const names = ids.map((id) => options.find((o) => o.value === id)?.label ?? id);
    return names.join(', ');
  }, [todos, ids, options]);

  const toggleCrs = (value: string) => {
    if (todos || !ids.includes(value)) {
      const base = todos ? [] : ids;
      applyLista([...base, value]);
      return;
    }
    applyLista(ids.filter((id) => id !== value));
  };

  return (
    <div className="mb-4" ref={rootRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {helpText ? <p className="text-xs text-gray-500 mb-2">{helpText}</p> : null}
      <div className="relative">
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => setOpen((current) => !current)}
          className={`w-full px-3 py-2 border rounded-md text-left text-sm focus:outline-none focus:ring-2 ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          } ${disabled || loading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
        >
          <span className={`block truncate pr-5 ${closedLabel ? 'text-gray-900' : 'text-gray-400'}`}>
            {loading ? 'Carregando...' : closedLabel || 'Selecione...'}
          </span>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
            ▾
          </span>
        </button>
        {open && !disabled ? (
          <div className="absolute z-30 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {allowTodos ? (
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2"
                onClick={() => {
                  if (todos) applyLista([]);
                  else applyTodos();
                }}
              >
                <input type="checkbox" readOnly checked={todos} tabIndex={-1} className="pointer-events-none" />
                <span>Todos</span>
              </button>
            ) : null}
            {options.map((opt) => {
              const checked = todos || ids.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                    todos
                      ? 'bg-gray-100 text-gray-500 cursor-default'
                      : 'hover:bg-blue-50 text-gray-900'
                  }`}
                  onClick={() => {
                    if (todos) return;
                    toggleCrs(opt.value);
                  }}
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked={checked}
                    tabIndex={-1}
                    className="pointer-events-none"
                  />
                  <span>{opt.label}</span>
                </button>
              );
            })}
            {!loading && options.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-500">Nenhuma regional disponível.</p>
            ) : null}
          </div>
        ) : null}
      </div>
      {error ? <p className="text-red-500 text-sm mt-1">{error}</p> : null}
    </div>
  );
};
