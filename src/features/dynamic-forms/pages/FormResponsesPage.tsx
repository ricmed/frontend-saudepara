import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { AppPageLayout } from '@/components/layouts/AppPageLayout';
import { FileSpreadsheet, Download } from 'lucide-react';
import FormResponsesService from '@/services/FormResponsesService';
import FormService, { type Form } from '@/services/FormService';
import { FormResponseReadonlyModal } from '../components/FormResponseReadonlyModal';
import { FormResponsesSpreadsheetModal } from '../components/FormResponsesSpreadsheetModal';
import { getStatusUi, getValueAtPath, guessKeyFields, resolveActiveSchema } from '../utils/formResponsesListUtils';
import {
  MONITOR_OPER_REGIONAL_KEY,
  buildMonitorOperSummaryById,
  getMonitorOperListColumnSpecs,
} from '../utils/monitorOperRegionalReport';
import { useCrsLabelByIdMap } from '../hooks/useCrsLabelByIdMap';

type FormResponsesLocationState = {
  responsesBackTo?: string;
};

export const FormResponsesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const formId = Number(id);

  const responsesBackTo =
    (location.state as FormResponsesLocationState | null)?.responsesBackTo ??
    '/private/formularios-admin';

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<any | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [sheetPreviewRows, setSheetPreviewRows] = useState<any[]>([]);
  const [sheetPreviewLoading, setSheetPreviewLoading] = useState(false);

  const isMonitorOperList = (form?.form_key ?? '').toUpperCase() === MONITOR_OPER_REGIONAL_KEY;
  const crsLabels = useCrsLabelByIdMap(isMonitorOperList);
  const monitorListCols = useMemo(() => (isMonitorOperList ? getMonitorOperListColumnSpecs() : []), [isMonitorOperList]);
  const monitorSummaryById = useMemo(
    () => (isMonitorOperList ? buildMonitorOperSummaryById(rows) : new Map()),
    [isMonitorOperList, rows],
  );

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

  useEffect(() => {
    if (!showSheet || !Number.isFinite(formId)) {
      setSheetPreviewRows([]);
      setSheetPreviewLoading(false);
      return;
    }
    let cancelled = false;
    setSheetPreviewLoading(true);
    setSheetPreviewRows([]);
    FormResponsesService.listAllResponses(formId)
      .then((data) => {
        if (!cancelled) setSheetPreviewRows(data);
      })
      .catch((e: any) => {
        console.error(e);
        if (!cancelled) {
          alert(e?.response?.data?.message || e?.message || 'Erro ao carregar respostas para a visualização');
          setSheetPreviewRows([]);
        }
      })
      .finally(() => {
        if (!cancelled) setSheetPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showSheet, formId]);

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

  const activeSchema = resolveActiveSchema(form);
  const genericKeyFields = guessKeyFields(activeSchema as any);
  const dataColCount = isMonitorOperList ? monitorListCols.length : genericKeyFields.length;

  return (
    <AppPageLayout
      title="Respostas do Formulário"
      subtitle={form?.nome || ''}
      icon={<FileSpreadsheet className="h-8 w-8" />}
      variant="desktop"
      showBottomNav={false}
      backPath={responsesBackTo}
      headerActions={
        <div className="flex gap-2">
          <button
            onClick={() => setShowSheet(true)}
            className="px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow font-medium"
            title="Pré-visualizar em tabela"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Tabela
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
      <FormResponsesSpreadsheetModal
        open={showSheet}
        onOpenChange={setShowSheet}
        form={form}
        rows={sheetPreviewRows}
        loading={sheetPreviewLoading}
        onDownloadXlsx={() => download('xlsx')}
        onDownloadCsv={() => download('csv')}
      />

      <FormResponseReadonlyModal
        open={!!selected}
        onClose={() => setSelected(null)}
        formTitle={form?.nome || 'Resposta'}
        responseId={selected?.id ?? 0}
        status={selected?.status ?? ''}
        activeSchema={activeSchema}
        dataJson={selected?.data_json ?? {}}
      />

      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando…</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  {isMonitorOperList
                    ? monitorListCols.map((c) => (
                        <th
                          key={c.id}
                          className={`px-4 py-2 align-middle whitespace-nowrap ${c.thClassName ?? 'text-left'}`}
                          title={c.label}
                        >
                          {c.label}
                        </th>
                      ))
                    : genericKeyFields.map((f, idx) => (
                        <th
                          key={f.key}
                          className={`px-4 py-2 align-middle text-left ${idx >= 2 ? 'hidden lg:table-cell' : ''}`}
                          title={f.key}
                        >
                          {f.label}
                        </th>
                      ))}
                  <th className="px-4 py-2 align-middle text-left">Status</th>
                  <th className="px-4 py-2 align-middle text-left whitespace-nowrap">Data do envio</th>
                  <th className="px-4 py-2 align-middle text-right whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const st = getStatusUi(r.status);
                  const submittedAt = r.submitted_at ? new Date(r.submitted_at) : null;
                  return (
                    <tr key={r.id} className="border-t">
                      {isMonitorOperList ? (
                        monitorListCols.map((c) => {
                          const sum = monitorSummaryById.get(r.id);
                          const text = sum ? c.format(sum, crsLabels) : '—';
                          return (
                            <td key={c.id} className={`px-4 py-2 align-middle ${c.tdClassName ?? ''}`} title={text}>
                              {text}
                            </td>
                          );
                        })
                      ) : (
                        genericKeyFields.map((f, idx) => {
                          const v = getValueAtPath(r.data_json ?? {}, f.key);
                          const s = v === null || v === undefined ? '' : String(v);
                          return (
                            <td
                              key={f.key}
                              className={`px-4 py-2 align-middle max-w-[18rem] truncate ${idx >= 2 ? 'hidden lg:table-cell' : ''}`}
                              title={s}
                            >
                              {s || <span className="text-gray-400">-</span>}
                            </td>
                          );
                        })
                      )}
                      <td className="px-4 py-2 align-middle">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold ${st.className}`}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-2 align-middle whitespace-nowrap" title="Data do envio">
                        {submittedAt ? submittedAt.toLocaleString('pt-BR') : '—'}
                      </td>
                      <td className="px-4 py-2 align-middle text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(r);
                          }}
                          className="inline-flex shrink-0 px-2.5 py-1 rounded-lg border bg-white text-xs sm:text-sm text-blue-700 hover:bg-blue-50 font-medium whitespace-nowrap"
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
                    <td className="px-4 py-6 text-center text-gray-600" colSpan={3 + dataColCount}>
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

