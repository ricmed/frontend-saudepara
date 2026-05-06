import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FormService, { type Form } from '@/services/FormService';
import FormSubmissionService, { type FormSubmission } from '@/services/FormSubmissionService';
import FormResponsesService from '@/services/FormResponsesService';
import { Plus, Edit, Trash2, FileText, BarChart3, FileSpreadsheet, Download, Columns2 } from 'lucide-react';
import { AppPageLayout } from '@/components/layouts/AppPageLayout';
import {
  MONITOR_OPER_REGIONAL_KEY,
  buildMonitorOperSummaryById,
  computeTotalAcumuladoMes,
  filterMonitorOperRows,
  getMonitorOperDefaultVisibleListColIds,
  getMonitorOperListColumnSpecs,
  readMonitorOperListColSelection,
  writeMonitorOperListColSelection,
  type MonitorOperListColSpec,
  type MonitorOperSubmissionSummary,
} from '../utils/monitorOperRegionalReport';
import { compareValues } from '@/features/notificationForms/utils';
import { useCrsLabelByIdMap } from '../hooks/useCrsLabelByIdMap';
import { FormResponseReadonlyModal } from '../components/FormResponseReadonlyModal';
import { FormResponsesSpreadsheetModal } from '../components/FormResponsesSpreadsheetModal';
import { getStatusUi, getValueAtPath, guessKeyFields, resolveActiveSchema } from '../utils/formResponsesListUtils';
import { useAuth } from '@/keycloak/AuthProvider';

type ResponseRow = {
  id: number;
  status: string;
  created_at: string;
  submitted_at?: string | null;
  created_by: string;
  data_json: Record<string, any>;
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
  | { type: 'status' }
  | { type: 'submitted_at' }
  | null {
  if (key === 'status') return { type: 'status' };
  if (key === 'submitted_at') return { type: 'submitted_at' };
  if (key.startsWith(LIST_SORT_MONITOR)) return { type: 'monitor', colId: key.slice(LIST_SORT_MONITOR.length) };
  if (key.startsWith(LIST_SORT_FIELD)) return { type: 'field', fieldKey: key.slice(LIST_SORT_FIELD.length) };
  return null;
}

function getListSortComparableValue(
  row: ResponseRow,
  sortKey: string,
  opts: {
    monitorSummaryById: Map<number, MonitorOperSubmissionSummary>;
    monitorColById: Map<string, MonitorOperListColSpec>;
    crsLabels: Record<string, string>;
  },
): string | number {
  const p = parseListSortKey(sortKey);
  if (!p) return '';
  if (p.type === 'status') return row.status ?? '';
  if (p.type === 'submitted_at') return row.submitted_at ?? row.created_at ?? '';
  if (p.type === 'field') {
    const v = getValueAtPath(row.data_json ?? {}, p.fieldKey);
    if (v === null || v === undefined) return '';
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

/** Evita que `compareValues` trate o número `0` como vazio (ex.: custo QDQQ). */
function compareFormListValues(valA: unknown, valB: unknown, sortOrder: 'asc' | 'desc'): number {
  const isNumA = typeof valA === 'number' && !Number.isNaN(valA);
  const isNumB = typeof valB === 'number' && !Number.isNaN(valB);
  if (isNumA && isNumB) {
    const diff = valA - valB;
    return sortOrder === 'asc' ? diff : -diff;
  }
  return compareValues(valA, valB, sortOrder);
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
      <div className={`flex items-center min-w-0 ${isRight ? 'justify-end' : ''}`}>
        <span className="min-w-0 truncate">{label}</span>
        <button
          type="button"
          onClick={() => onSort(sortKey)}
          className="ml-1 focus:outline-none text-white shrink-0"
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

export const FormSubmissionsListPage: React.FC = () => {
  const { agravo } = useParams<{ agravo: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const crsLabels = useCrsLabelByIdMap(agravo?.toUpperCase() === MONITOR_OPER_REGIONAL_KEY);

  const [form, setForm] = useState<Form | null>(null);
  /** Carregamento completo só para totais QDQQ (monitor operacional). */
  const [monitorSubmissionsForTotals, setMonitorSubmissionsForTotals] = useState<FormSubmission[]>([]);
  const [rows, setRows] = useState<ResponseRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [listTotal, setListTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ResponseRow | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [sheetPreviewRows, setSheetPreviewRows] = useState<ResponseRow[]>([]);
  const [sheetPreviewLoading, setSheetPreviewLoading] = useState(false);
  const [showListColPicker, setShowListColPicker] = useState(false);
  const [listColQuery, setListColQuery] = useState('');
  const [visibleMonitorColIds, setVisibleMonitorColIds] = useState<string[]>([]);
  const [listSort, setListSort] = useState<{ key: string | null; order: 'asc' | 'desc' }>({
    key: null,
    order: 'asc',
  });
  const listColPickerRef = useRef<HTMLDivElement | null>(null);

  const totalAcumulado = useMemo(() => {
    if (agravo !== MONITOR_OPER_REGIONAL_KEY) return null;
    const monitorRows = filterMonitorOperRows(monitorSubmissionsForTotals);
    if (monitorRows.length === 0) return null;
    return computeTotalAcumuladoMes(monitorRows);
  }, [agravo, monitorSubmissionsForTotals]);

  const isMonitorOperList = agravo?.toUpperCase() === MONITOR_OPER_REGIONAL_KEY;
  const monitorListCols = useMemo(() => (isMonitorOperList ? getMonitorOperListColumnSpecs() : []), [isMonitorOperList]);
  const monitorSummaryById = useMemo(
    () => (isMonitorOperList ? buildMonitorOperSummaryById(rows) : new Map()),
    [isMonitorOperList, rows],
  );

  const visibleMonitorCols = useMemo(
    () => monitorListCols.filter((c) => visibleMonitorColIds.includes(c.id)),
    [monitorListCols, visibleMonitorColIds],
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
    const opts = { monitorSummaryById, monitorColById, crsLabels };
    return [...rows].sort((a, b) => {
      const va = getListSortComparableValue(a, sk, opts);
      const vb = getListSortComparableValue(b, sk, opts);
      return compareFormListValues(va, vb, dir);
    });
  }, [rows, listSort.key, listSort.order, monitorSummaryById, monitorColById, crsLabels]);

  const sheetMonitorSummaryById = useMemo(
    () => (isMonitorOperList ? buildMonitorOperSummaryById(sheetPreviewRows) : new Map()),
    [isMonitorOperList, sheetPreviewRows],
  );

  const sortedSheetPreviewRows = useMemo(() => {
    const sk = listSort.key;
    if (!sk || sheetPreviewRows.length === 0) return sheetPreviewRows;
    const dir = listSort.order;
    const opts = { monitorSummaryById: sheetMonitorSummaryById, monitorColById, crsLabels };
    return [...sheetPreviewRows].sort((a, b) => {
      const va = getListSortComparableValue(a, sk, opts);
      const vb = getListSortComparableValue(b, sk, opts);
      return compareFormListValues(va, vb, dir);
    });
  }, [sheetPreviewRows, listSort.key, listSort.order, sheetMonitorSummaryById, monitorColById, crsLabels]);

  useEffect(() => {
    if (!isMonitorOperList) {
      setVisibleMonitorColIds([]);
      return;
    }
    const cols = getMonitorOperListColumnSpecs();
    const allowedIds = cols.map((c) => c.id);
    const allowed = new Set(allowedIds);
    const stored = readMonitorOperListColSelection();
    const fromStore = (stored ?? []).filter((id) => allowed.has(id));
    const def = getMonitorOperDefaultVisibleListColIds(allowedIds);
    setVisibleMonitorColIds(fromStore.length > 0 ? fromStore : def);
  }, [agravo, isMonitorOperList]);

  useEffect(() => {
    if (!showListColPicker) return;
    const onMouseDown = (e: MouseEvent) => {
      const el = listColPickerRef.current;
      if (!el) return;
      const t = e.target as Node | null;
      if (t && !el.contains(t)) setShowListColPicker(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowListColPicker(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showListColPicker]);

  useEffect(() => {
    loadData();
  }, [agravo]);

  const loadResponsesPage = async (formId: number, p = 1) => {
    const res = await FormResponsesService.list(formId, { page: p, limit: 50 });
    setRows(res.data as ResponseRow[]);
    setPage(res.page);
    setTotalPages(res.totalPages);
    setListTotal(res.total);
  };

  const loadData = async () => {
    if (!agravo) return;

    try {
      setLoading(true);
      setError(null);
      setListSort({ key: null, order: 'asc' });
      setMonitorSubmissionsForTotals([]);

      const formData = await FormService.getFormByKey(agravo);
      setForm(formData);

      if (agravo === MONITOR_OPER_REGIONAL_KEY && formData.active_version_id) {
        FormSubmissionService.getSubmissionsAllPagesWithFormPayload(formData.active_version_id).then(setMonitorSubmissionsForTotals);
      }

      if (formData.id) {
        await loadResponsesPage(formData.id, 1);
      } else {
        setRows([]);
        setListTotal(0);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError(err.response?.data?.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!showSheet || !form?.id) {
      setSheetPreviewRows([]);
      setSheetPreviewLoading(false);
      return;
    }
    let cancelled = false;
    setSheetPreviewLoading(true);
    setSheetPreviewRows([]);
    FormResponsesService.listAllResponses(form.id)
      .then((data) => {
        if (!cancelled) setSheetPreviewRows(data as ResponseRow[]);
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
  }, [showSheet, form?.id]);

  const download = async (format: 'xlsx' | 'csv') => {
    if (!form?.id) return;
    try {
      const { blob, filename } = await FormResponsesService.downloadExport(form.id, { format });
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

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta notificação?')) return;
    const userId = user?.sub || (user as any)?.id;
    if (!userId) {
      alert('Usuário não autenticado');
      return;
    }
    try {
      await FormSubmissionService.deleteSubmission(id, userId);
      if (form?.id) await loadResponsesPage(form.id, page);
      if (agravo === MONITOR_OPER_REGIONAL_KEY && form?.active_version_id) {
        const all = await FormSubmissionService.getSubmissionsAllPagesWithFormPayload(form.active_version_id);
        setMonitorSubmissionsForTotals(all);
      }
    } catch (err: any) {
      console.error('Erro ao excluir:', err);
      alert(err.response?.data?.message || 'Erro ao excluir notificação');
    }
  };

  const activeSchema = resolveActiveSchema(form);
  const genericKeyFields = guessKeyFields(activeSchema as any);

  if (loading) {
    return (
      <AppPageLayout
        title="Notificações"
        subtitle="Carregando..."
        icon={<FileText className="h-8 w-8" />}
        variant="desktop"
        showBottomNav={false}
        backPath="/private/formularios"
      >
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        </div>
      </AppPageLayout>
    );
  }

  if (error) {
    return (
      <AppPageLayout
        title="Erro"
        subtitle="Erro ao carregar dados"
        icon={<FileText className="h-8 w-8" />}
        variant="desktop"
        showBottomNav={false}
        backPath="/private/formularios"
      >
        <div className="bg-white rounded-lg shadow p-8 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-red-600 mb-4">Erro</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/private/formularios')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Voltar
          </button>
        </div>
      </AppPageLayout>
    );
  }

  const exportHeader =
    form?.id != null ? (
      <div className="flex flex-wrap gap-2 justify-end">
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
    ) : null;

  return (
    <AppPageLayout
      title={form?.nome || 'Notificações'}
      subtitle={`${listTotal} notificação(ões) cadastrada(s)`}
      icon={<FileText className="h-8 w-8" />}
      variant="desktop"
      contentWidth="wide"
      showBottomNav={false}
      backPath="/private/formularios"
      headerActions={
        <div className="flex flex-wrap gap-2 justify-end items-center">
          {agravo === MONITOR_OPER_REGIONAL_KEY && (
            <button
              type="button"
              data-testid="monitor-oper-relatorios"
              onClick={() => navigate(`/private/formularios/${agravo}/relatorio`)}
              className="px-4 py-2 bg-white text-gray-800 rounded-md hover:bg-gray-50 flex items-center gap-2 font-medium border border-gray-200"
            >
              <BarChart3 className="h-4 w-4" />
              Relatório
            </button>
          )}
          {exportHeader}
          <button
            type="button"
            onClick={() => navigate(`/private/formularios/${agravo}/nova`)}
            className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 flex items-center gap-2 font-medium"
          >
            <Plus className="h-4 w-4" />
            Nova Notificação
          </button>
        </div>
      }
    >
      <FormResponsesSpreadsheetModal
        open={showSheet}
        onOpenChange={setShowSheet}
        form={form}
        rows={sortedSheetPreviewRows}
        loading={sheetPreviewLoading}
        onDownloadXlsx={() => download('xlsx')}
        onDownloadCsv={() => download('csv')}
      />

      <FormResponseReadonlyModal
        open={!!selected}
        onClose={() => setSelected(null)}
        formTitle={form?.nome || 'Notificação'}
        responseId={selected?.id ?? 0}
        status={selected?.status ?? ''}
        activeSchema={activeSchema}
        dataJson={selected?.data_json ?? {}}
      />

      {listTotal === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">Nenhuma notificação cadastrada ainda</p>
          <button
            onClick={() => navigate(`/private/formularios/${agravo}/nova`)}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Cadastrar Primeira Notificação
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-visible">
          {isMonitorOperList && listTotal > 0 ? (
            <div className="flex flex-wrap items-center justify-end gap-2 border-b border-gray-200 bg-gray-100 px-3 py-2">
              <div className="relative z-30" ref={listColPickerRef}>
                <button
                  type="button"
                  data-testid="monitor-oper-list-columns"
                  onClick={() =>
                    setShowListColPicker((v) => {
                      const next = !v;
                      if (next) setListColQuery('');
                      return next;
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Columns2 className="h-4 w-4 shrink-0" />
                  Colunas
                </button>
                {showListColPicker ? (
                  <div className="absolute right-0 top-full z-50 mt-1.5 w-[min(22rem,calc(100vw-2rem))] max-h-[min(28rem,calc(100vh-6rem))] flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
                    <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-gray-900">Colunas da lista</div>
                      <button
                        type="button"
                        className="text-xs text-gray-600 hover:underline"
                        onClick={() => setShowListColPicker(false)}
                      >
                        Fechar
                      </button>
                    </div>
                    <input
                      value={listColQuery}
                      onChange={(e) => setListColQuery(e.target.value)}
                      placeholder="Buscar…"
                      className="mb-2 w-full shrink-0 rounded-lg border px-3 py-2 text-sm"
                    />
                    <div className="mb-2 flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                        onClick={() => {
                          const next = getMonitorOperDefaultVisibleListColIds(monitorListCols.map((c) => c.id));
                          setVisibleMonitorColIds(next);
                          writeMonitorOperListColSelection(next);
                        }}
                      >
                        Relevantes
                      </button>
                      <button
                        type="button"
                        className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                        onClick={() => {
                          const next = monitorListCols.map((c) => c.id);
                          setVisibleMonitorColIds(next);
                          writeMonitorOperListColSelection(next);
                        }}
                      >
                        Todas
                      </button>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-lg border border-gray-100">
                      {monitorListCols
                        .filter((c) => {
                          const q = listColQuery.trim().toLowerCase();
                          if (!q) return true;
                          return `${c.label} ${c.id}`.toLowerCase().includes(q);
                        })
                        .map((c) => {
                          const checked = visibleMonitorColIds.includes(c.id);
                          return (
                            <label
                              key={c.id}
                              className="flex cursor-pointer items-start gap-2 border-b border-gray-50 px-3 py-2 last:border-b-0 hover:bg-gray-50"
                            >
                              <input
                                type="checkbox"
                                className="mt-0.5"
                                checked={checked}
                                onChange={(e) => {
                                  const next = new Set(visibleMonitorColIds);
                                  if (e.target.checked) next.add(c.id);
                                  else next.delete(c.id);
                                  let arr = monitorListCols.map((x) => x.id).filter((id) => next.has(id));
                                  if (arr.length === 0) return;
                                  setVisibleMonitorColIds(arr);
                                  writeMonitorOperListColSelection(arr);
                                }}
                              />
                              <span className="min-w-0 text-sm text-gray-900">{c.label}</span>
                            </label>
                          );
                        })}
                    </div>
                    <p className="mt-2 shrink-0 text-[11px] text-gray-500">
                      Por padrão aparecem só colunas essenciais; marque outras para ver mais campos na lista.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
          <div className="overflow-x-auto">
            <table className="w-full min-w-full text-sm divide-y divide-gray-200">
              <thead className="bg-blue-600 text-white">
                <tr>
                  {isMonitorOperList
                    ? visibleMonitorCols.map((c) => (
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
                    key="status"
                    label="Status"
                    sortKey="status"
                    activeKey={listSort.key}
                    sortOrder={listSort.order}
                    onSort={handleListSortChange}
                    thClassName="text-left"
                    titleAttr="Status"
                  />
                  <FormListSortableTh
                    key="submitted_at"
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
                  const st = getStatusUi(r.status);
                  const submittedAt = r.submitted_at ? new Date(r.submitted_at) : null;
                  return (
                    <tr key={r.id} className="transition-colors duration-150 hover:bg-gray-50">
                      {isMonitorOperList ? (
                        visibleMonitorCols.map((c) => {
                          const sum = monitorSummaryById.get(r.id);
                          const text = sum ? c.format(sum, crsLabels) : '—';
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
                          const s = v === null || v === undefined ? '' : String(v);
                          return (
                            <td
                              key={f.key}
                              className={`px-3 lg:px-4 xl:px-6 py-3 align-middle text-sm text-gray-900 max-w-[18rem] truncate ${idx >= 2 ? 'hidden lg:table-cell' : ''}`}
                              title={s}
                            >
                              {s || <span className="text-gray-400">-</span>}
                            </td>
                          );
                        })
                      )}
                      <td className="px-3 lg:px-4 xl:px-6 py-3 align-middle text-sm">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold ${st.className}`}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-3 lg:px-4 xl:px-6 py-3 align-middle text-sm text-gray-900 whitespace-nowrap" title="Data do envio">
                        {submittedAt ? submittedAt.toLocaleString('pt-BR') : '—'}
                      </td>
                      <td className="px-3 lg:px-4 xl:px-6 py-3 align-middle text-right text-sm whitespace-nowrap">
                        <div className="inline-flex justify-end flex-nowrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelected(r)}
                            className="shrink-0 px-2.5 py-1 rounded-lg border bg-white text-xs sm:text-sm text-blue-700 hover:bg-blue-50 font-medium whitespace-nowrap"
                            title="Ver conteúdo preenchido"
                          >
                            Ver resposta
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/private/formularios/${agravo}/editar/${r.id}`)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            title="Editar"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(r.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Excluir"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-3 lg:px-4 py-3 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={() => form?.id && loadResponsesPage(form.id, Math.max(1, page - 1))}
              disabled={page <= 1 || !form?.id}
              className="px-3 py-1 rounded border disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-700">
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => form?.id && loadResponsesPage(form.id, Math.min(totalPages, page + 1))}
              disabled={page >= totalPages || !form?.id}
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
