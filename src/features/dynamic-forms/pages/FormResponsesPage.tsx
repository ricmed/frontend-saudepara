import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { AppPageLayout } from '@/components/layouts/AppPageLayout';
import { FileSpreadsheet, Download } from 'lucide-react';
import FormResponsesService from '@/services/FormResponsesService';
import FormService, { type Form } from '@/services/FormService';
import { FormResponseReadonlyModal } from '../components/FormResponseReadonlyModal';
import { FormResponsesSpreadsheetModal } from '../components/FormResponsesSpreadsheetModal';
import {
  collectSchemaReferenceMapsNeeded,
  findFormFieldByKey,
  formatCellValueForResponseList,
  getValueAtPath,
  guessKeyFields,
  resolveActiveSchema,
  type ResponseListLabelMaps,
} from '../utils/formResponsesListUtils';
import {
  MONITOR_OPER_REGIONAL_KEY,
  buildMonitorOperSummaryById,
  getMonitorOperListColumnSpecs,
  type MonitorOperListColSpec,
  type MonitorOperSubmissionSummary,
} from '../utils/monitorOperRegionalReport';
import { useCrsLabelByIdMap } from '../hooks/useCrsLabelByIdMap';
import { useMunicipioLabelByIdMap } from '../hooks/useMunicipioLabelByIdMap';
import { useTipoPaisLabelByIdMap } from '../hooks/useTipoPaisLabelByIdMap';
import { compareValues } from '@/features/notificationForms/utils';

type FormResponsesLocationState = {
  responsesBackTo?: string;
};

type ResponseRow = {
  id: number;
  status: string;
  created_at: string;
  submitted_at?: string | null;
  created_by: string;
  data_json: Record<string, unknown>;
};

const LIST_SORT_MONITOR = 'm:';
const LIST_SORT_FIELD = 'f:';

function buildListSortMonitorKey(colId: string) {
  return `${LIST_SORT_MONITOR}${colId}`;
}

function buildListSortFieldKey(fieldKey: string) {
  return `${LIST_SORT_FIELD}${fieldKey}`;
}

function parseListSortKey(key: string):
  | { type: 'monitor'; colId: string }
  | { type: 'field'; fieldKey: string }
  | { type: 'submitted_at' }
  | null {
  if (key === 'submitted_at') return { type: 'submitted_at' };
  if (key.startsWith(LIST_SORT_MONITOR)) return { type: 'monitor', colId: key.slice(LIST_SORT_MONITOR.length) };
  if (key.startsWith(LIST_SORT_FIELD)) return { type: 'field', fieldKey: key.slice(LIST_SORT_FIELD.length) };
  return null;
}

function compareFormListValues(valA: unknown, valB: unknown, sortOrder: 'asc' | 'desc'): number {
  const isNumA = typeof valA === 'number' && !Number.isNaN(valA);
  const isNumB = typeof valB === 'number' && !Number.isNaN(valB);
  if (isNumA && isNumB) {
    const diff = valA - valB;
    return sortOrder === 'asc' ? diff : -diff;
  }
  return compareValues(valA, valB, sortOrder);
}

function getListSortComparableValue(
  row: ResponseRow,
  sortKey: string,
  opts: {
    monitorSummaryById: Map<number, MonitorOperSubmissionSummary>;
    monitorColById: Map<string, MonitorOperListColSpec>;
    crsLabels: Record<string, string>;
    activeSchema: unknown;
    responseMaps: ResponseListLabelMaps;
  },
): string | number {
  const p = parseListSortKey(sortKey);
  if (!p) return '';
  if (p.type === 'submitted_at') return row.submitted_at ?? row.created_at ?? '';
  if (p.type === 'field') {
    const v = getValueAtPath(row.data_json ?? {}, p.fieldKey);
    if (v === null || v === undefined) return '';
    const field = findFormFieldByKey(opts.activeSchema, p.fieldKey);
    const display = formatCellValueForResponseList(v, field, opts.responseMaps);
    if (display !== '' && display !== String(v)) return display;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'boolean') return v ? 1 : 0;
    return String(v);
  }
  const sum = opts.monitorSummaryById.get(row.id);
  if (!sum) return '';
  if (p.colId === 'custo') return sum.custoTotal ?? 0;
  const spec = opts.monitorColById.get(p.colId);
  if (!spec) return '';
  return spec.format(sum, opts.crsLabels);
}

type FormListSortableThProps = {
  label: string;
  sortKey: string;
  activeKey: string | null;
  sortOrder: 'asc' | 'desc';
  onSort: (key: string) => void;
  thClassName?: string;
  titleAttr?: string;
  hiddenLg?: boolean;
};

const FormListSortableTh: React.FC<FormListSortableThProps> = ({
  label,
  sortKey,
  activeKey,
  sortOrder,
  onSort,
  thClassName = '',
  titleAttr,
  hiddenLg,
}) => {
  const isRight = thClassName.includes('text-right');
  const active = activeKey === sortKey;
  return (
    <th
      scope="col"
      className={`px-3 lg:px-4 xl:px-6 py-3 align-middle text-xs font-semibold uppercase tracking-wider text-white whitespace-nowrap ${hiddenLg ? 'hidden lg:table-cell' : ''} ${thClassName}`.trim()}
      title={titleAttr ?? label}
    >
      <div className={`flex min-w-0 items-center ${isRight ? 'justify-end' : ''}`}>
        <span className="min-w-0 truncate">{label}</span>
        <button
          type="button"
          onClick={() => onSort(sortKey)}
          className="ml-1 shrink-0 text-white focus:outline-none"
          aria-label={sortOrder === 'asc' && active ? 'Ordenar decrescente' : 'Ordenar crescente'}
          title={active ? (sortOrder === 'asc' ? 'Ordenar decrescente' : 'Ordenar crescente') : 'Ordenar'}
        >
          {active ? (
            sortOrder === 'asc' ? (
              <span>▲</span>
            ) : (
              <span>▼</span>
            )
          ) : (
            <span className="text-blue-200">▼</span>
          )}
        </button>
      </div>
    </th>
  );
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
  const [rows, setRows] = useState<ResponseRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [listTotal, setListTotal] = useState(0);
  const [selected, setSelected] = useState<ResponseRow | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [sheetPreviewRows, setSheetPreviewRows] = useState<ResponseRow[]>([]);
  const [sheetPreviewLoading, setSheetPreviewLoading] = useState(false);
  const [listSort, setListSort] = useState<{ key: string | null; order: 'asc' | 'desc' }>({
    key: null,
    order: 'asc',
  });

  const isMonitorOperList = (form?.form_key ?? '').toUpperCase() === MONITOR_OPER_REGIONAL_KEY;

  const activeSchema = resolveActiveSchema(form);
  const refMapsNeeded = useMemo(() => collectSchemaReferenceMapsNeeded(activeSchema), [activeSchema]);
  const municipioById = useMunicipioLabelByIdMap(refMapsNeeded.municipio);
  const crsByIdMap = useCrsLabelByIdMap(refMapsNeeded.crs || isMonitorOperList);
  const paisById = useTipoPaisLabelByIdMap(refMapsNeeded.pais);
  const responseLabelMaps = useMemo<ResponseListLabelMaps>(
    () => ({ municipioById, crsById: crsByIdMap, paisById }),
    [municipioById, crsByIdMap, paisById],
  );

  const monitorListCols = useMemo(() => (isMonitorOperList ? getMonitorOperListColumnSpecs() : []), [isMonitorOperList]);
  const monitorSummaryById = useMemo(
    () =>
      isMonitorOperList
        ? buildMonitorOperSummaryById(rows as Parameters<typeof buildMonitorOperSummaryById>[0])
        : new Map<number, MonitorOperSubmissionSummary>(),
    [isMonitorOperList, rows],
  );

  const monitorColById = useMemo(() => {
    const m = new Map<string, MonitorOperListColSpec>();
    for (const c of monitorListCols) m.set(c.id, c);
    return m;
  }, [monitorListCols]);

  const handleListSortChange = useCallback((key: string) => {
    setListSort((prev) => {
      if (prev.key !== key) return { key, order: 'asc' };
      return { key, order: prev.order === 'asc' ? 'desc' : 'asc' };
    });
  }, []);

  const sortedRows = useMemo(() => {
    const sk = listSort.key;
    if (!sk) return rows;
    const dir = listSort.order;
    const opts = { monitorSummaryById, monitorColById, crsLabels: crsByIdMap, activeSchema, responseMaps: responseLabelMaps };
    return [...rows].sort((a, b) => {
      const va = getListSortComparableValue(a, sk, opts);
      const vb = getListSortComparableValue(b, sk, opts);
      return compareFormListValues(va, vb, dir);
    });
  }, [rows, listSort.key, listSort.order, monitorSummaryById, monitorColById, crsByIdMap, activeSchema, responseLabelMaps]);

  const load = async (p = 1) => {
    try {
      setLoading(true);
      const [f, res] = await Promise.all([
        FormService.getFormById(formId),
        FormResponsesService.list(formId, { page: p, limit: 50, status: 'submitted' }),
      ]);
      setForm(f);
      setRows(res.data as ResponseRow[]);
      setPage(res.page);
      setTotalPages(res.totalPages);
      setListTotal(res.total);
      setListSort({ key: null, order: 'asc' });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      alert(err?.response?.data?.message || err?.message || 'Erro ao carregar respostas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isFinite(formId)) return;
    void load(1);
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
    FormResponsesService.listAllResponses(formId, { status: 'submitted' })
      .then((data) => {
        if (!cancelled) setSheetPreviewRows(data as ResponseRow[]);
      })
      .catch((e: unknown) => {
        console.error(e);
        if (!cancelled) {
          const err = e as { response?: { data?: { message?: string } }; message?: string };
          alert(err?.response?.data?.message || err?.message || 'Erro ao carregar respostas para a visualização');
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
      const { blob, filename } = await FormResponsesService.downloadExport(formId, { format, status: 'submitted' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      alert(err?.response?.data?.message || err?.message || 'Erro ao exportar');
    }
  };

  const genericKeyFields = guessKeyFields(activeSchema as Parameters<typeof guessKeyFields>[0]);
  const dataColCount = isMonitorOperList ? monitorListCols.length : genericKeyFields.length;

  return (
    <AppPageLayout
      title="Respostas do Formulário"
      subtitle={
        listTotal > 0
          ? `${listTotal} resposta(s) — ${form?.nome || ''}`.trim()
          : form?.nome || ''
      }
      icon={<FileSpreadsheet className="h-8 w-8" />}
      variant="desktop"
      contentWidth="wide"
      showBottomNav={false}
      backPath={responsesBackTo}
      headerActions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowSheet(true)}
            className="px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow font-medium"
            title="Pré-visualizar em tabela"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Tabela
          </button>
          <button
            type="button"
            onClick={() => download('xlsx')}
            className="px-3 py-2 bg-white text-emerald-700 rounded-lg hover:bg-emerald-50 flex items-center gap-2 shadow font-medium"
            title="Exportar XLSX"
          >
            <Download className="h-4 w-4" />
            XLSX
          </button>
          <button
            type="button"
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
        labelMaps={responseLabelMaps}
      />

      <FormResponseReadonlyModal
        open={!!selected}
        onClose={() => setSelected(null)}
        formTitle={form?.nome || 'Resposta'}
        responseId={selected?.id ?? 0}
        status={selected?.status ?? ''}
        activeSchema={activeSchema}
        dataJson={(selected?.data_json ?? {}) as Record<string, any>}
      />

      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando…</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-full text-sm divide-y divide-gray-200">
              <thead className="bg-blue-600 text-white">
                <tr>
                  {isMonitorOperList
                    ? monitorListCols.map((c) => (
                        <FormListSortableTh
                          key={c.id}
                          label={c.label}
                          sortKey={buildListSortMonitorKey(c.id)}
                          activeKey={listSort.key}
                          sortOrder={listSort.order}
                          onSort={handleListSortChange}
                          thClassName={`${c.thClassName ?? 'text-left'} whitespace-nowrap`.trim()}
                          titleAttr={c.label}
                        />
                      ))
                    : genericKeyFields.map((f, idx) => (
                        <FormListSortableTh
                          key={f.key}
                          label={f.label}
                          sortKey={buildListSortFieldKey(f.key)}
                          activeKey={listSort.key}
                          sortOrder={listSort.order}
                          onSort={handleListSortChange}
                          thClassName="text-left"
                          titleAttr={f.key}
                          hiddenLg={idx >= 2}
                        />
                      ))}
                  <FormListSortableTh
                    label="Data do envio"
                    sortKey="submitted_at"
                    activeKey={listSort.key}
                    sortOrder={listSort.order}
                    onSort={handleListSortChange}
                    thClassName="text-left whitespace-nowrap"
                    titleAttr="Data do envio"
                  />
                  <th
                    scope="col"
                    className="px-3 lg:px-4 xl:px-6 py-3 align-middle text-right text-xs font-semibold uppercase tracking-wider text-white whitespace-nowrap"
                  >
                    <span className="sr-only">Ações</span>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedRows.map((r) => {
                  const submittedAt = r.submitted_at ? new Date(r.submitted_at) : null;
                  return (
                    <tr key={r.id} className="transition-colors duration-150 hover:bg-gray-50">
                      {isMonitorOperList ? (
                        monitorListCols.map((c) => {
                          const sum = monitorSummaryById.get(r.id);
                          const text = sum ? c.format(sum, crsByIdMap) : '—';
                          return (
                            <td
                              key={c.id}
                              className={`px-3 lg:px-4 xl:px-6 py-3 align-middle text-sm text-gray-900 ${c.tdClassName ?? ''}`}
                              title={text}
                            >
                              {text}
                            </td>
                          );
                        })
                      ) : (
                        genericKeyFields.map((f, idx) => {
                          const v = getValueAtPath(r.data_json ?? {}, f.key);
                          const field = findFormFieldByKey(activeSchema, f.key);
                          const display = formatCellValueForResponseList(v, field, responseLabelMaps);
                          const s = display;
                          return (
                            <td
                              key={f.key}
                              className={`px-3 lg:px-4 xl:px-6 py-3 align-middle text-sm text-gray-900 max-w-[18rem] truncate ${idx >= 2 ? 'hidden lg:table-cell' : ''}`}
                              title={s || f.key}
                            >
                              {s ? s : <span className="text-gray-400">-</span>}
                            </td>
                          );
                        })
                      )}
                      <td className="px-3 lg:px-4 xl:px-6 py-3 align-middle text-sm text-gray-900 whitespace-nowrap" title="Data do envio">
                        {submittedAt ? submittedAt.toLocaleString('pt-BR') : '—'}
                      </td>
                      <td className="px-3 lg:px-4 xl:px-6 py-3 align-middle text-right text-sm whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelected(r)}
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
                    <td className="px-4 py-6 text-center text-gray-600" colSpan={2 + dataColCount}>
                      Nenhuma resposta encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-3 lg:px-4 py-3 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={() => void load(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded border disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-700">
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => void load(Math.min(totalPages, page + 1))}
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
