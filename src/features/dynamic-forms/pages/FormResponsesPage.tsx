import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppPageLayout } from '@/components/layouts/AppPageLayout';
import { FileSpreadsheet, Download, BarChart3 } from 'lucide-react';
import FormResponsesService from '@/services/FormResponsesService';
import FormService, { type Form } from '@/services/FormService';
import { FormRenderer } from '../components/FormRenderer';

export const FormResponsesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const formId = Number(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<any | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [showSheetColumns, setShowSheetColumns] = useState(false);
  const [sheetColQuery, setSheetColQuery] = useState('');
  const [sheetVisibleKeys, setSheetVisibleKeys] = useState<string[]>([]);
  const sheetColumnsPopoverRef = useRef<HTMLDivElement | null>(null);

  const load = async (p = 1) => {
    try {
      setLoading(true);
      const [f, res] = await Promise.all([
        FormService.getFormById(formId),
        FormResponsesService.list(formId, { page: p, limit: 50 }),
      ]);
      setForm(f);
      setRows(res.data);
      setPage(res.page);
      setTotalPages(res.totalPages);
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Erro ao carregar respostas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isFinite(formId)) return;
    load(1);
  }, [formId]);

  const download = async (format: 'xlsx' | 'csv') => {
    try {
      const { blob, filename } = await FormResponsesService.downloadExport(formId, { format });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Erro ao exportar');
    }
  };

  const flattenObject = (input: any, maxDepth = 6) => {
    const out: Record<string, any> = {};
    const rec = (value: any, p: string, depth: number) => {
      if (depth > maxDepth) return;
      if (value === null || value === undefined) {
        out[p] = value;
        return;
      }
      if (typeof value !== 'object') {
        out[p] = value;
        return;
      }
      if (Array.isArray(value)) {
        out[p] = `(${value.length} itens)`;
        return;
      }
      const keys = Object.keys(value);
      if (keys.length === 0) {
        out[p] = '';
        return;
      }
      for (const k of keys) {
        if (k === '_meta') continue;
        rec(value[k], p ? `${p}.${k}` : k, depth + 1);
      }
    };
    rec(input, '', 0);
    return out;
  };

  const csvEscape = (value: any) => {
    if (value === null || value === undefined) return '';
    const s = String(value);
    if (/[;"\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const activeSchema =
    form?.active_version_id && Array.isArray(form.versions)
      ? form.versions.find((v) => v.id === form.active_version_id)?.schema_json
      : undefined;

  const getValueAtPath = (obj: any, path: string) => {
    if (!obj || !path) return undefined;
    const parts = String(path).split('.').filter(Boolean);
    let cur: any = obj;
    for (const p of parts) {
      if (cur == null) return undefined;
      cur = cur[p];
    }
    return cur;
  };

  const guessKeyFields = (schema: any | undefined) => {
    const fields: Array<{ key: string; label: string }> = [];
    const all: Array<{ key: string; label: string; type?: string }> = [];
    for (const sec of schema?.sections ?? []) {
      for (const f of sec?.fields ?? []) {
        const key = String(f?.key || '').trim();
        if (!key) continue;
        const type = String(f?.type || '').toLowerCase();
        // Evitar tipos “pesados” ou pouco úteis como coluna de lista
        if (['file', 'signature', 'table'].includes(type)) continue;
        const label = String(f?.customLabel || f?.label || key);
        all.push({ key, label, type });
      }
    }

    const preferOrder = [
      'paciente.nome',
      'paciente.cpf',
      'paciente.cns',
      'paciente.data_nascimento',
      'paciente.nome_mae',
      'notificacao.dt_notificacao',
    ];

    for (const k of preferOrder) {
      const found = all.find((x) => x.key === k);
      if (found && !fields.some((f) => f.key === found.key)) fields.push({ key: found.key, label: found.label });
      if (fields.length >= 3) break;
    }

    for (const f of all) {
      if (fields.length >= 3) break;
      if (fields.some((x) => x.key === f.key)) continue;
      fields.push({ key: f.key, label: f.label });
    }

    return fields.slice(0, 3);
  };

  const keyFields = guessKeyFields(activeSchema as any);

  const sheetColumns = (() => {
    const cols: Array<{ key: string; label: string }> = [];
    for (const sec of (activeSchema as any)?.sections ?? []) {
      for (const f of sec?.fields ?? []) {
        const k = String(f?.key || '').trim();
        if (!k) continue;
        const type = String(f?.type || '').toLowerCase();
        if (['file', 'signature'].includes(type)) continue;
        cols.push({ key: k, label: String(f?.customLabel || f?.label || k) });
      }
    }
    return cols;
  })();

  const copySheetToClipboard = async () => {
    try {
      const cols = sheetColumns.filter((c) => sheetVisibleKeys.includes(c.key));
      if (!cols.length) {
        alert('Não foi possível montar a planilha (sem colunas do formulário).');
        return;
      }
      const lines: string[] = [];
      lines.push(cols.map((c) => csvEscape(c.label)).join(';'));
      for (const r of rows) {
        const flat = flattenObject(r.data_json ?? {});
        lines.push(cols.map((c) => csvEscape(flat[c.key] ?? '')).join(';'));
      }
      await navigator.clipboard.writeText(lines.join('\n'));
      alert('Planilha copiada (CSV) para a área de transferência.');
    } catch (e: any) {
      alert(e?.message || 'Não foi possível copiar.');
    }
  };

  useEffect(() => {
    // Sempre que abrimos o modal ou a lista de colunas muda, por padrão mostrar todas.
    if (!showSheet) return;
    setSheetVisibleKeys(sheetColumns.map((c) => c.key));
    setShowSheetColumns(false);
    setSheetColQuery('');
  }, [showSheet, sheetColumns.length]);

  useEffect(() => {
    if (!showSheet || !showSheetColumns) return;

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
  }, [showSheet, showSheetColumns]);

  useEffect(() => {
    if (!showSheet) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSheetColumns(false);
        setShowSheet(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showSheet]);

  const getStatusUi = (status: string) => {
    const key = String(status || '').toLowerCase();
    const labels: Record<string, string> = {
      submitted: 'Enviada',
      draft: 'Não enviada',
      synced: 'Enviada (offline)',
    };
    const classes: Record<string, string> = {
      submitted: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      draft: 'bg-amber-50 text-amber-900 border-amber-200',
      synced: 'bg-blue-50 text-blue-800 border-blue-200',
    };
    return {
      label: labels[key] || (key ? key : '-'),
      className: classes[key] || 'bg-gray-50 text-gray-700 border-gray-200',
    };
  };

  const getCreatedByUi = (createdBy: string) => {
    const s = String(createdBy || '');
    if (!s) return { label: '-', title: '' };
    if (s.startsWith('public:')) return { label: 'Público', title: 'Resposta enviada por link público' };
    return { label: 'Autenticado', title: s };
  };

  return (
    <AppPageLayout
      title="Respostas do Formulário"
      subtitle={form?.nome || ''}
      icon={<FileSpreadsheet className="h-8 w-8" />}
      variant="desktop"
      showBottomNav={false}
      backPath="/private/formularios-admin"
      headerActions={
        <div className="flex gap-2">
          <button
            onClick={() => setShowSheet(true)}
            className="px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow font-medium"
            title="Pré-visualizar planilha"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Planilha
          </button>
          <button
            onClick={() => navigate(`/private/formularios-admin/respostas/${formId}/resumo`)}
            className="px-3 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-50 flex items-center gap-2 shadow font-medium"
            title="Resumo"
          >
            <BarChart3 className="h-4 w-4" />
            Resumo
          </button>
          <button
            onClick={() => download('xlsx')}
            className="px-3 py-2 bg-white text-emerald-700 rounded-lg hover:bg-emerald-50 flex items-center gap-2 shadow font-medium"
            title="Exportar XLSX"
          >
            <Download className="h-4 w-4" />
            XLSX
          </button>
          <button
            onClick={() => download('csv')}
            className="px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow font-medium"
            title="Exportar CSV"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
        </div>
      }
    >
      {showSheet ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowSheetColumns(false);
              setShowSheet(false);
            }
          }}
        >
          <div className="w-full max-w-6xl overflow-visible rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b p-4">
              <div className="min-w-0">
                <div className="text-sm text-gray-500">Pré-visualização</div>
                <div className="text-lg font-semibold text-gray-900 truncate">Planilha de respostas</div>
                <div className="text-xs text-gray-500 truncate">{form?.nome || ''}</div>
              </div>
              <div className="flex items-center gap-2">
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
                  onClick={copySheetToClipboard}
                  className="rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  title="Copiar como CSV (Excel)"
                >
                  Copiar
                </button>
                <button
                  type="button"
                  onClick={() => download('xlsx')}
                  className="rounded-lg border px-3 py-1.5 text-sm text-emerald-700 hover:bg-emerald-50"
                >
                  Baixar XLSX
                </button>
                <button
                  type="button"
                  onClick={() => download('csv')}
                  className="rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Baixar CSV
                </button>
                <button
                  type="button"
                  onClick={() => setShowSheet(false)}
                  className="rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="max-h-[75vh] overflow-auto rounded-b-xl">
              {!sheetColumns.length ? (
                <div className="p-6 text-sm text-gray-600">
                  Não foi possível montar a planilha (schema do formulário não disponível).
                </div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 text-gray-700 border-b">
                    <tr>
                      {sheetColumns
                        .filter((c) => sheetVisibleKeys.includes(c.key))
                        .map((c) => (
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
                          {sheetColumns
                            .filter((c) => sheetVisibleKeys.includes(c.key))
                            .map((c) => {
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
                          colSpan={Math.max(1, sheetColumns.filter((c) => sheetVisibleKeys.includes(c.key)).length)}
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
      ) : null}

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b p-4">
              <div className="min-w-0">
                <div className="text-sm text-gray-500">Resposta #{selected.id}</div>
                <div className="text-lg font-semibold text-gray-900 truncate">{form?.nome || 'Resposta'}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Fechar
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 border-b bg-gray-50 px-4 py-2">
              <div className="text-sm font-medium text-gray-900">Formulário preenchido</div>
              <div className="text-xs text-gray-500">
                {(() => {
                  const st = getStatusUi(selected.status);
                  return st.label;
                })()}
              </div>
            </div>

            <div className="max-h-[70vh] overflow-auto p-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                {activeSchema ? (
                  <FormRenderer
                    schema={activeSchema as any}
                    initialData={selected.data_json ?? {}}
                    readOnly={true}
                    showActions={false}
                    showTitle={false}
                    context="sinan"
                    pageMode={true}
                    showProgress={true}
                  />
                ) : (
                  <div className="text-sm text-gray-600">Não foi possível carregar o layout do formulário.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando…</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  {keyFields.map((f, idx) => (
                    <th
                      key={f.key}
                      className={`px-4 py-2 text-left ${idx >= 2 ? 'hidden lg:table-cell' : ''}`}
                      title={f.key}
                    >
                      {f.label}
                    </th>
                  ))}
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Data</th>
                  <th className="px-4 py-2 text-left">Origem</th>
                  <th className="px-4 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const st = getStatusUi(r.status);
                  const cb = getCreatedByUi(r.created_by);
                  const submittedAt = r.submitted_at ? new Date(r.submitted_at) : null;
                  const createdAt = r.created_at ? new Date(r.created_at) : null;
                  const when = submittedAt || createdAt;
                  const whenLabel = submittedAt ? 'Enviada em' : 'Criada em';
                  return (
                    <tr key={r.id} className="border-t">
                      <td className="px-4 py-2">{r.id}</td>
                      {keyFields.map((f, idx) => {
                        const v = getValueAtPath(r.data_json ?? {}, f.key);
                        const s = v === null || v === undefined ? '' : String(v);
                        return (
                          <td
                            key={f.key}
                            className={`px-4 py-2 max-w-[18rem] truncate ${idx >= 2 ? 'hidden lg:table-cell' : ''}`}
                            title={s}
                          >
                            {s || <span className="text-gray-400">-</span>}
                          </td>
                        );
                      })}
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold ${st.className}`}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-2" title={whenLabel}>
                        {when ? when.toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-2" title={cb.title}>
                        {cb.label}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(r);
                          }}
                          className="px-3 py-1.5 rounded-lg border bg-white text-sm text-blue-700 hover:bg-blue-50 font-medium"
                          title="Ver conteúdo preenchido"
                        >
                          Ver resposta
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-600" colSpan={5 + keyFields.length}>
                      Nenhuma resposta encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <button
              onClick={() => load(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded border disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-700">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => load(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded border disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </AppPageLayout>
  );
};

