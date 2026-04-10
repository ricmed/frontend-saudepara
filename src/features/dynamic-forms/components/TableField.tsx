import React, { useState, useEffect } from 'react';
import axios from 'axios';
import type { FormField, TableColumnDef } from '@/services/FormService';
import { Plus, Trash2 } from 'lucide-react';

const server = import.meta.env.VITE_API_SERVER;
const port = import.meta.env.VITE_API_PORT;
const API_BASE = `${server}:${port}/api`;

interface TableFieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  /** Para colunas com apiSelectEndpointParams: obter valor de outro campo (ex.: crs_id) */
  getValue?: (key: string) => any;
}

/** Carrega opções de vários endpoints; cada entrada é URL completa (com ?crs_id=X se houver). */
function useSelectOptionsMap(urls: string[]) {
  const [optionsMap, setOptionsMap] = useState<Record<string, Array<{ value: string; label: string }>>>({});
  useEffect(() => {
    if (urls.length === 0) {
      setOptionsMap({});
      return;
    }
    let cancelled = false;
    const uniq = [...new Set(urls)];
    uniq.forEach((fullUrl) => {
      axios
        .get(`${API_BASE}/${fullUrl}`, { withCredentials: true })
        .then(({ data }) => {
          if (cancelled) return;
          const list = Array.isArray(data) ? data : (data?.data ?? []);
          const opts = list.map((item: any) => {
            if (item.value != null && item.label != null) {
              return { value: String(item.value), label: String(item.label) };
            }
            return {
              value: String(item.id ?? item.idtipo_municipio ?? item.id_crs ?? item.idtipo_pais ?? item.id_dae ?? ''),
              label: String(item.descricao ?? item.nome ?? item.label ?? ''),
            };
          });
          setOptionsMap((prev) => ({ ...prev, [fullUrl]: opts }));
        })
        .catch(() => {
          if (!cancelled) setOptionsMap((prev) => ({ ...prev, [fullUrl]: [] }));
        });
    });
    return () => {
      cancelled = true;
    };
  }, [urls.join('|')]);
  return optionsMap;
}

/** Monta URL do endpoint com query params a partir dos valores do formulário (ex.: crs_id). */
function buildColumnSelectUrl(column: TableColumnDef, getValue?: (key: string) => any): string | null {
  const ep = column.apiSelectEndpoint;
  if (!ep) return null;
  const params =
    column.apiSelectEndpointParams && getValue
      ? Object.fromEntries(
          column.apiSelectEndpointParams.map((k) => [k, getValue(k)]).filter(([, v]) => v != null && v !== '') as [string, any][]
        )
      : {};
  if (Object.keys(params).length === 0) return ep;
  const q = new URLSearchParams(Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])));
  return `${ep}?${q.toString()}`;
}

/** Calcula soma de chaves numéricas em um objeto */
function sumKeys(row: Record<string, any>, keys: string[]): number {
  return keys.reduce((acc, k) => acc + (Number(row?.[k]) || 0), 0);
}

/** Percentual = (numerador / soma(denominador)) * 100; retorna null se denominador 0 */
function computedPctValue(row: Record<string, any>, numeratorKey: string, denominatorKeys: string[]): number | null {
  const den = sumKeys(row || {}, denominatorKeys);
  if (den === 0) return null;
  const num = Number(row?.[numeratorKey]) || 0;
  return (num / den) * 100;
}

/** Célula editável ou somente leitura (computed) conforme tipo da coluna */
function TableCell({
  column,
  rowValue,
  onChange,
  options,
  disabled,
}: {
  column: TableColumnDef;
  rowValue: any;
  onChange: (value: any) => void;
  options?: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  const val = rowValue?.[column.key];
  const commonClass =
    'w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500';

  if (column.type === 'computed' && column.sumKeys?.length) {
    const computed = sumKeys(rowValue || {}, column.sumKeys);
    return (
      <div className="px-2 py-1.5 text-sm border border-gray-200 rounded bg-gray-50 text-gray-700 tabular-nums">
        {computed}
      </div>
    );
  }

  if (column.type === 'computedPct' && column.computedPct) {
    const { numeratorKey, denominatorKeys } = column.computedPct;
    const pct = computedPctValue(rowValue || {}, numeratorKey, denominatorKeys);
    const isAlb = column.key.endsWith('_alb');
    const display = pct != null ? `${pct.toFixed(1)}%` : '—';
    return (
      <div className={`px-2 py-1.5 text-sm border border-gray-200 rounded bg-gray-50 tabular-nums ${isAlb ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
        {display}
      </div>
    );
  }

  if (column.type === 'number') {
    const isAlb = column.key.endsWith('_alb');
    return (
      <input
        type="number"
        value={val ?? ''}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '' ? undefined : Number(v));
        }}
        min={column.min}
        max={column.max}
        disabled={disabled}
        className={`${commonClass} ${isAlb ? 'text-red-600 font-medium' : ''}`}
        placeholder={column.placeholder}
      />
    );
  }

  if (column.type === 'select') {
    const opts = options ?? column.options ?? [];
    return (
      <select
        value={val ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        disabled={disabled}
        className={commonClass}
      >
        <option value="">—</option>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type="text"
      value={val ?? ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={commonClass}
      placeholder={column.placeholder}
    />
  );
}

export const TableField: React.FC<TableFieldProps> = ({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
  getValue,
}) => {
  const columns = field.tableColumns ?? [];
  const rows: Record<string, any>[] = Array.isArray(value) ? value : [];
  const addRowLabel = field.addRowLabel ?? 'Adicionar linha';
  const maxRows = field.maxRows ?? 500;

  const paramKeys = React.useMemo(
    () => [...new Set(columns.flatMap((c) => c.apiSelectEndpointParams || []))],
    [columns]
  );
  const paramValues = paramKeys.map((k) => getValue?.(k));
  const selectUrls = React.useMemo(
    () =>
      columns
        .filter((c) => c.type === 'select' && c.apiSelectEndpoint)
        .map((c) => buildColumnSelectUrl(c, getValue))
        .filter((u): u is string => u != null),
    [columns, getValue, ...paramValues]
  );
  const optionsByUrl = useSelectOptionsMap(selectUrls);

  const getOptionsForColumn = (col: TableColumnDef): Array<{ value: string; label: string }> | undefined => {
    if (col.type !== 'select' || !col.apiSelectEndpoint) return col.options;
    const url = buildColumnSelectUrl(col, getValue);
    return url ? optionsByUrl[url] : col.options;
  };

  const updateRow = (rowIndex: number, colKey: string, cellValue: any) => {
    const next = rows.map((row, i) =>
      i === rowIndex ? { ...row, [colKey]: cellValue } : row
    );
    onChange(next);
  };

  const addRow = () => {
    if (rows.length >= maxRows) return;
    onChange([...rows, {}]);
  };

  const removeRow = (rowIndex: number) => {
    const next = rows.filter((_, i) => i !== rowIndex);
    onChange(next);
  };

  if (columns.length === 0) {
    return (
      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
        Tabela sem colunas definidas. Edite o formulário e adicione colunas ao campo tipo tabela.
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {!disabled && rows.length < maxRows && (
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            {addRowLabel}
          </button>
        )}
      </div>
      {field.helpText && (
        <p className="text-xs text-gray-500 mb-2">{field.helpText}</p>
      )}
      <div className="overflow-x-auto border border-gray-300 rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-2 py-2 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${col.key.endsWith('_alb') ? 'text-red-600' : 'text-gray-700'}`}
                >
                  {col.label}
                  {col.required && <span className="text-red-500 ml-0.5">*</span>}
                </th>
              ))}
              {!disabled && <th className="px-2 py-2 w-10" aria-label="Remover" />}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + (disabled ? 0 : 1)} className="px-2 py-4 text-center text-gray-500 text-sm">
                  Nenhuma linha. Clique em &quot;{addRowLabel}&quot; para adicionar.
                </td>
              </tr>
            )}
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col.key} className="px-2 py-1">
                    <TableCell
                      column={col}
                      rowValue={row}
                      onChange={(cellValue) => updateRow(rowIndex, col.key, cellValue)}
                      options={getOptionsForColumn(col)}
                      disabled={disabled}
                    />
                  </td>
                ))}
                {!disabled && (
                  <td className="px-2 py-1 align-middle">
                    <button
                      type="button"
                      onClick={() => removeRow(rowIndex)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Remover linha"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          {field.tableShowTotalRow && rows.length > 0 && (() => {
            const totalLabel = field.tableTotalRowLabel ?? 'TOTAL MÊS';
            return (
              <tfoot className="bg-gray-100 border-t-2 border-gray-300 font-medium">
                <tr>
                  {columns.map((col, idx) => {
                    if (col.type === 'computed' && col.sumKeys?.length) {
                      const total = rows.reduce((acc, row) => acc + sumKeys(row, col.sumKeys!), 0);
                      return (
                        <td key={col.key} className="px-2 py-2 text-sm tabular-nums">
                          {total}
                        </td>
                      );
                    }
                    if (col.type === 'number') {
                      const total = rows.reduce((acc, row) => acc + (Number(row[col.key]) || 0), 0);
                      return (
                        <td key={col.key} className="px-2 py-2 text-sm tabular-nums">
                          {total}
                        </td>
                      );
                    }
                    return (
                      <td key={col.key} className="px-2 py-2 text-sm">
                        {idx === 0 ? totalLabel : '—'}
                      </td>
                    );
                  })}
                  {!disabled && <td className="px-2 py-2 w-10" />}
                </tr>
              </tfoot>
            );
          })()}
        </table>
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};
