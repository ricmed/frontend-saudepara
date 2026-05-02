import React, { useEffect, useRef, useState } from 'react';
import {
  buildSheetColumnsFromSchema,
  copySheetRowsToClipboard,
  flattenObject,
  resolveActiveSchema,
} from '../utils/formResponsesListUtils';
import { MONITOR_OPER_REGIONAL_KEY, monitorOperPresetVisibleSheetKeys } from '../utils/monitorOperRegionalReport';
import type { Form } from '@/services/FormService';

type Row = { id: number; data_json?: Record<string, any> };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: Form | null;
  rows: Row[];
  /** Quando true, a tabela ainda não está pronta (carregando todas as páginas). */
  loading?: boolean;
  onDownloadXlsx: () => void;
  onDownloadCsv: () => void;
};

export const FormResponsesSpreadsheetModal: React.FC<Props> = ({
  open,
  onOpenChange,
  form,
  rows,
  loading = false,
  onDownloadXlsx,
  onDownloadCsv,
}) => {
  const activeSchema = resolveActiveSchema(form);
  const sheetColumns = buildSheetColumnsFromSchema(activeSchema);
  const [showSheetColumns, setShowSheetColumns] = useState(false);
  const [sheetColQuery, setSheetColQuery] = useState('');
  const [sheetVisibleKeys, setSheetVisibleKeys] = useState<string[]>([]);
  const sheetColumnsPopoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const cols = buildSheetColumnsFromSchema(resolveActiveSchema(form));
    const allKeys = cols.map((c) => c.key);
    const isMonitor = (form?.form_key ?? '').toUpperCase() === MONITOR_OPER_REGIONAL_KEY;
    if (isMonitor) {
      const preset = monitorOperPresetVisibleSheetKeys(allKeys);
      setSheetVisibleKeys(preset.length ? preset : allKeys);
    } else {
      setSheetVisibleKeys(allKeys);
    }
    setShowSheetColumns(false);
    setSheetColQuery('');
  }, [open, form?.id, form?.form_key, form?.active_version_id]);

  useEffect(() => {
    if (!open || !showSheetColumns) return;

    const onMouseDown = (e: MouseEvent) => {
      const el = sheetColumnsPopoverRef.current;
      if (!el) return;
      const target = e.target as Node | null;
      if (!target) return;
      if (!el.contains(target)) setShowSheetColumns(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSheetColumns(false);
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, showSheetColumns]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSheetColumns(false);
        onOpenChange(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  const visibleCols = sheetColumns.filter((c) => sheetVisibleKeys.includes(c.key));

  const copySheet = async () => {
    if (loading || rows.length === 0) return;
    try {
      await copySheetRowsToClipboard(rows, visibleCols);
    } catch (e: any) {
      alert(e?.message || 'Não foi possível copiar.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          setShowSheetColumns(false);
          onOpenChange(false);
        }
      }}
    >
      <div className="w-full max-w-6xl overflow-visible rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b p-4">
          <div className="min-w-0">
            <div className="text-sm text-gray-500">Pré-visualização</div>
            <div className="text-lg font-semibold text-gray-900 truncate">Respostas em tabela</div>
            <div className="text-xs text-gray-500 truncate">{form?.nome || ''}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSheetColumns((v) => !v)}
                className="rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                title="Selecionar colunas"
              >
                Colunas
              </button>

              {showSheetColumns ? (
                <div
                  ref={sheetColumnsPopoverRef}
                  className="absolute right-0 mt-2 w-[22rem] rounded-xl border bg-white shadow-xl p-3 z-10"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="text-sm font-semibold text-gray-900">Selecionar colunas</div>
                    <button
                      type="button"
                      onClick={() => setShowSheetColumns(false)}
                      className="text-xs text-gray-600 hover:underline"
                    >
                      Fechar
                    </button>
                  </div>

                  <input
                    value={sheetColQuery}
                    onChange={(e) => setSheetColQuery(e.target.value)}
                    placeholder="Buscar coluna…"
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                  />

                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSheetVisibleKeys(sheetColumns.map((c) => c.key))}
                      className="px-2 py-1 rounded border text-xs hover:bg-gray-50"
                    >
                      Marcar tudo
                    </button>
                    <button
                      type="button"
                      onClick={() => setSheetVisibleKeys([])}
                      className="px-2 py-1 rounded border text-xs hover:bg-gray-50"
                    >
                      Limpar
                    </button>
                    <div className="ml-auto text-[11px] text-gray-500">
                      {sheetVisibleKeys.length}/{sheetColumns.length}
                    </div>
                  </div>

                  <div className="mt-2 max-h-72 overflow-auto rounded-lg border">
                    {sheetColumns
                      .filter((c) => {
                        const q = sheetColQuery.trim().toLowerCase();
                        if (!q) return true;
                        return `${c.label} ${c.key}`.toLowerCase().includes(q);
                      })
                      .map((c) => {
                        const checked = sheetVisibleKeys.includes(c.key);
                        return (
                          <label
                            key={c.key}
                            className="flex items-start gap-2 px-3 py-2 border-b last:border-b-0 cursor-pointer hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5"
                              checked={checked}
                              onChange={(e) => {
                                setSheetVisibleKeys((prev) => {
                                  const next = new Set(prev);
                                  if (e.target.checked) next.add(c.key);
                                  else next.delete(c.key);
                                  return Array.from(next);
                                });
                              }}
                            />
                            <div className="min-w-0">
                              <div className="text-sm text-gray-900 truncate" title={c.label}>
                                {c.label}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={copySheet}
              disabled={loading || rows.length === 0}
              className="rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
              title="Copiar como CSV (Excel)"
            >
              Copiar
            </button>
            <button
              type="button"
              onClick={onDownloadXlsx}
              className="rounded-lg border px-3 py-1.5 text-sm text-emerald-700 hover:bg-emerald-50"
            >
              Baixar XLSX
            </button>
            <button
              type="button"
              onClick={onDownloadCsv}
              className="rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Baixar CSV
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Fechar
            </button>
          </div>
        </div>

        <div className="max-h-[75vh] overflow-auto rounded-b-xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 px-4">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
              <p className="text-center text-sm text-gray-600">Carregando todas as respostas…</p>
            </div>
          ) : !sheetColumns.length ? (
            <div className="p-6 text-sm text-gray-600">
              Não foi possível montar a tabela (schema do formulário não disponível).
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 text-gray-700 border-b">
                <tr>
                  {visibleCols.map((c) => (
                    <th key={c.key} className="px-3 py-2 text-left whitespace-nowrap">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const flat = flattenObject(r.data_json ?? {});
                  return (
                    <tr key={r.id} className="border-b">
                      {visibleCols.map((c) => {
                        const v = flat[c.key];
                        const s = v === null || v === undefined ? '' : String(v);
                        return (
                          <td key={c.key} className="px-3 py-2 whitespace-nowrap max-w-[22rem] truncate" title={s}>
                            {s}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                {!rows.length ? (
                  <tr>
                    <td
                      className="px-3 py-6 text-center text-gray-600"
                      colSpan={Math.max(1, visibleCols.length)}
                    >
                      Nenhuma resposta encontrada.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
