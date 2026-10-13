import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FormService, { type Form } from '@/services/FormService';
import FormSubmissionService, { type FormSubmission } from '@/services/FormSubmissionService';
import FormResponsesService from '@/services/FormResponsesService';
import { Plus, Edit, Trash2, FileText, BarChart2, BarChart3, FileSpreadsheet, Columns2, CheckSquare, Square, Loader2 } from 'lucide-react';
import { HEPATITE_CRIANCA_HBV_FORM_KEY } from '../hepatite-crianca-hbv/constants';
import {
  buildHepatiteCriancaSummaryById,
  getHepatiteCriancaListColumnSpecs,
  getHepatiteDefaultVisibleListColIds,
  readHepatiteListColSelection,
  writeHepatiteListColSelection,
  type HepatiteCriancaListColSpec,
  type HepatiteCriancaListSummary,
} from '../hepatite-crianca-hbv/utils/hepatiteCriancaListColumns';
import { loadMunicipioLabelMaps, type MunicipioLabelMaps } from '../hepatite-crianca-hbv/utils/municipioIbgeLabels';
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
import {
  monitorOperMatchesListaRecorte,
  type MonitorOperListaRecorte,
} from '../utils/monitorOperListaRecorte';
import { compareValues } from '@/features/notificationForms/utils';
import { useCrsLabelByIdMap } from '../hooks/useCrsLabelByIdMap';
import { useMunicipioLabelByIdMap } from '../hooks/useMunicipioLabelByIdMap';
import { useTipoPaisLabelByIdMap } from '../hooks/useTipoPaisLabelByIdMap';
import { FormResponseReadonlyModal } from '../components/FormResponseReadonlyModal';
import { FormResponsesSpreadsheetModal } from '../components/FormResponsesSpreadsheetModal';
import { ListPaginationBar } from '@/components/list/ListPaginationBar';
import { ListSearchFiltersBar, type ListDateFilterValues } from '../components/list/ListSearchFiltersBar';
import { ListExportMenu } from '../components/list/ListExportMenu';
import { exportRowsAsCsv, exportRowsAsXlsx } from '../components/list/exportCurrentPage';
import {
  getFormListSearchFields,
  mapUiSortToApiParams,
} from '../components/list/formListSearchAdapter';
import { getValueAtPath, guessKeyFields, resolveActiveSchema, collectSchemaReferenceMapsNeeded, findFormFieldByKey, formatCellValueForResponseList, type ResponseListLabelMaps } from '../utils/formResponsesListUtils';
import { useAuth } from '@/keycloak/AuthProvider';
import type { FormResponsesListFilters } from '@/services/FormResponsesService';

type ResponseRow = {
  id: number;
  status: string;
  created_at: string;
  submitted_at?: string | null;
  created_by: string;
  data_json: Record<string, any>;
};

const LIST_SORT_MONITOR = 'm:';
const LIST_SORT_HEPATITE = 'h:';
const LIST_SORT_FIELD = 'f:';

function buildListSortMonitorKey(colId: string) {
  return `${LIST_SORT_MONITOR}${colId}`;
}

function buildListSortHepatiteKey(colId: string) {
  return `${LIST_SORT_HEPATITE}${colId}`;
}

function buildListSortFieldKey(fieldKey: string) {
  return `${LIST_SORT_FIELD}${fieldKey}`;
}

function parseListSortKey(key: string):
  | { type: 'monitor'; colId: string }
  | { type: 'hepatite'; colId: string }
  | { type: 'field'; fieldKey: string }
  | { type: 'submitted_at' }
  | null {
  if (key === 'submitted_at') return { type: 'submitted_at' };
  if (key.startsWith(LIST_SORT_MONITOR)) return { type: 'monitor', colId: key.slice(LIST_SORT_MONITOR.length) };
  if (key.startsWith(LIST_SORT_HEPATITE)) return { type: 'hepatite', colId: key.slice(LIST_SORT_HEPATITE.length) };
  if (key.startsWith(LIST_SORT_FIELD)) return { type: 'field', fieldKey: key.slice(LIST_SORT_FIELD.length) };
  return null;
}

function getListSortComparableValue(
  row: ResponseRow,
  sortKey: string,
  opts: {
    monitorSummaryById: Map<number, MonitorOperSubmissionSummary>;
    monitorColById: Map<string, MonitorOperListColSpec>;
    hepatiteSummaryById: Map<number, HepatiteCriancaListSummary>;
    hepatiteColById: Map<string, HepatiteCriancaListColSpec>;
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
  if (p.type === 'hepatite') {
    const sum = opts.hepatiteSummaryById.get(row.id);
    const spec = opts.hepatiteColById.get(p.colId);
    if (!sum || !spec) return '';
    return spec.sortValue(sum);
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

  const [form, setForm] = useState<Form | null>(null);
  /** Carregamento completo só para totais QDQQ (monitor operacional). */
  const [monitorSubmissionsForTotals, setMonitorSubmissionsForTotals] = useState<FormSubmission[]>([]);
  const [rows, setRows] = useState<ResponseRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [listTotal, setListTotal] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ResponseRow | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [sheetPreviewRows, setSheetPreviewRows] = useState<ResponseRow[]>([]);
  const [sheetPreviewLoading, setSheetPreviewLoading] = useState(false);
  const [showListColPicker, setShowListColPicker] = useState(false);
  const [listColQuery, setListColQuery] = useState('');
  const [visibleMonitorColIds, setVisibleMonitorColIds] = useState<string[]>([]);
  const [visibleHepatiteColIds, setVisibleHepatiteColIds] = useState<string[]>([]);
  const [hepatiteMunicipioMaps, setHepatiteMunicipioMaps] = useState<MunicipioLabelMaps>({
    byIbge: {},
    byId: {},
  });
  const [listSort, setListSort] = useState<{ key: string | null; order: 'asc' | 'desc' }>({
    key: null,
    order: 'asc',
  });
  const [searchParams, setSearchParams] = useState({ term: '', field: 'all' });
  const [debouncedSearch, setDebouncedSearch] = useState({ term: '', field: 'all' });
  const [dateFilters, setDateFilters] = useState<ListDateFilterValues>({});
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [listaRecorte, setListaRecorte] = useState<MonitorOperListaRecorte>('todas');
  const [recorteSource, setRecorteSource] = useState<ResponseRow[]>([]);
  const [recorteLoading, setRecorteLoading] = useState(false);
  const listColPickerRef = useRef<HTMLDivElement | null>(null);
  const listQueryReadyRef = useRef(false);
  const skipListReloadOnceRef = useRef(false);

  const isMonitorOperList = agravo?.toUpperCase() === MONITOR_OPER_REGIONAL_KEY;
  const isHepatiteCriancaList = agravo?.toUpperCase() === HEPATITE_CRIANCA_HBV_FORM_KEY;
  const isCustomList = isMonitorOperList || isHepatiteCriancaList;
  const activeSchema = useMemo(() => resolveActiveSchema(form), [form]);
  const refMapsNeeded = useMemo(() => collectSchemaReferenceMapsNeeded(activeSchema), [activeSchema]);
  const municipioById = useMunicipioLabelByIdMap(refMapsNeeded.municipio);
  const crsByIdMap = useCrsLabelByIdMap(refMapsNeeded.crs || isMonitorOperList);
  const paisById = useTipoPaisLabelByIdMap(refMapsNeeded.pais);
  const responseLabelMaps = useMemo<ResponseListLabelMaps>(
    () => ({ municipioById, crsById: crsByIdMap, paisById }),
    [municipioById, crsByIdMap, paisById],
  );

  const totalAcumulado = useMemo(() => {
    if (agravo !== MONITOR_OPER_REGIONAL_KEY) return null;
    const monitorRows = filterMonitorOperRows(monitorSubmissionsForTotals);
    if (monitorRows.length === 0) return null;
    return computeTotalAcumuladoMes(monitorRows);
  }, [agravo, monitorSubmissionsForTotals]);

  const monitorListCols = useMemo(() => (isMonitorOperList ? getMonitorOperListColumnSpecs() : []), [isMonitorOperList]);
  const recorteAtivo = isMonitorOperList && listaRecorte !== 'todas';
  const recorteFiltered = useMemo(() => {
    if (!recorteAtivo) return [];
    return recorteSource.filter((row) => monitorOperMatchesListaRecorte(row.data_json, listaRecorte));
  }, [recorteAtivo, recorteSource, listaRecorte]);
  const monitorSummaryById = useMemo(
    () => (isMonitorOperList ? buildMonitorOperSummaryById(recorteAtivo ? recorteFiltered : rows) : new Map()),
    [isMonitorOperList, recorteAtivo, recorteFiltered, rows],
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

  const hepatiteListCols = useMemo(
    () => (isHepatiteCriancaList ? getHepatiteCriancaListColumnSpecs() : []),
    [isHepatiteCriancaList],
  );

  const hepatiteSummaryById = useMemo(
    () =>
      isHepatiteCriancaList
        ? buildHepatiteCriancaSummaryById(rows, hepatiteMunicipioMaps)
        : new Map<number, HepatiteCriancaListSummary>(),
    [isHepatiteCriancaList, rows, hepatiteMunicipioMaps],
  );

  const visibleHepatiteCols = useMemo(
    () => hepatiteListCols.filter((c) => visibleHepatiteColIds.includes(c.id)),
    [hepatiteListCols, visibleHepatiteColIds],
  );

  const hepatiteColById = useMemo(() => {
    const m = new Map<string, HepatiteCriancaListColSpec>();
    for (const c of hepatiteListCols) m.set(c.id, c);
    return m;
  }, [hepatiteListCols]);

  const sheetHepatiteSummaryById = useMemo(
    () =>
      isHepatiteCriancaList
        ? buildHepatiteCriancaSummaryById(sheetPreviewRows, hepatiteMunicipioMaps)
        : new Map<number, HepatiteCriancaListSummary>(),
    [isHepatiteCriancaList, sheetPreviewRows, hepatiteMunicipioMaps],
  );

  const handleListSortChange = useCallback((key: string) => {
    setListSort((prev) => {
      if (prev.key !== key) return { key, order: 'asc' };
      return { key, order: prev.order === 'asc' ? 'desc' : 'asc' };
    });
    setPage(1);
  }, []);

  const serverSortMeta = useMemo(
    () => mapUiSortToApiParams(listSort.key, listSort.order),
    [listSort.key, listSort.order],
  );

  const sortedRows = useMemo(() => {
    // Ordenação no servidor para campos genéricos; Monitor/Hepatite custom ficam client-side na página.
    if (!serverSortMeta.clientOnly || !listSort.key) return rows;
    const sk = listSort.key;
    const dir = listSort.order;
    const opts = {
      monitorSummaryById,
      monitorColById,
      hepatiteSummaryById,
      hepatiteColById,
      crsLabels: crsByIdMap,
      activeSchema,
      responseMaps: responseLabelMaps,
    };
    return [...rows].sort((a, b) => {
      const va = getListSortComparableValue(a, sk, opts);
      const vb = getListSortComparableValue(b, sk, opts);
      return compareFormListValues(va, vb, dir);
    });
  }, [
    rows,
    listSort.key,
    listSort.order,
    serverSortMeta.clientOnly,
    monitorSummaryById,
    monitorColById,
    hepatiteSummaryById,
    hepatiteColById,
    crsByIdMap,
    activeSchema,
    responseLabelMaps,
  ]);

  const recorteSorted = useMemo(() => {
    if (!recorteAtivo) return [];
    if (!listSort.key) return recorteFiltered;
    const dir = listSort.order;
    const opts = {
      monitorSummaryById,
      monitorColById,
      hepatiteSummaryById,
      hepatiteColById,
      crsLabels: crsByIdMap,
      activeSchema,
      responseMaps: responseLabelMaps,
    };
    return [...recorteFiltered].sort((a, b) => {
      const va = getListSortComparableValue(a, listSort.key as string, opts);
      const vb = getListSortComparableValue(b, listSort.key as string, opts);
      return compareFormListValues(va, vb, dir);
    });
  }, [
    recorteAtivo,
    recorteFiltered,
    listSort.key,
    listSort.order,
    monitorSummaryById,
    monitorColById,
    hepatiteSummaryById,
    hepatiteColById,
    crsByIdMap,
    activeSchema,
    responseLabelMaps,
  ]);

  const recortePageRows = useMemo(() => {
    if (!recorteAtivo) return [];
    const start = (page - 1) * itemsPerPage;
    return recorteSorted.slice(start, start + itemsPerPage);
  }, [recorteAtivo, recorteSorted, page, itemsPerPage]);

  const tableRows = recorteAtivo ? recortePageRows : sortedRows;
  const shownTotal = recorteAtivo ? recorteFiltered.length : listTotal;
  const shownTotalPages = recorteAtivo
    ? Math.max(1, Math.ceil(recorteFiltered.length / itemsPerPage))
    : totalPages;

  const formSearchFields = useMemo(() => getFormListSearchFields(agravo), [agravo]);

  const buildListFilters = useCallback(
    (p: number, limit: number): FormResponsesListFilters => {
      const filters: FormResponsesListFilters = {
        page: p,
        limit,
        status: 'submitted',
      };
      if (debouncedSearch.term.length >= 3) {
        filters.search = debouncedSearch.term;
        filters.search_field = debouncedSearch.field;
      }
      if (dateFilters.data_inicio) filters.data_inicio = dateFilters.data_inicio;
      if (dateFilters.data_fim) filters.data_fim = dateFilters.data_fim;
      if (!serverSortMeta.clientOnly && serverSortMeta.sortKey) {
        filters.sortKey = serverSortMeta.sortKey;
        filters.sortDir = serverSortMeta.sortDir;
      }
      return filters;
    },
    [debouncedSearch, dateFilters, serverSortMeta],
  );

  const sheetMonitorSummaryById = useMemo(
    () => (isMonitorOperList ? buildMonitorOperSummaryById(sheetPreviewRows) : new Map()),
    [isMonitorOperList, sheetPreviewRows],
  );

  const sortedSheetPreviewRows = useMemo(() => {
    const sk = listSort.key;
    if (!sk || sheetPreviewRows.length === 0) return sheetPreviewRows;
    const dir = listSort.order;
    const opts = {
      monitorSummaryById: sheetMonitorSummaryById,
      monitorColById,
      hepatiteSummaryById: sheetHepatiteSummaryById,
      hepatiteColById,
      crsLabels: crsByIdMap,
      activeSchema,
      responseMaps: responseLabelMaps,
    };
    return [...sheetPreviewRows].sort((a, b) => {
      const va = getListSortComparableValue(a, sk, opts);
      const vb = getListSortComparableValue(b, sk, opts);
      return compareFormListValues(va, vb, dir);
    });
  }, [
    sheetPreviewRows,
    listSort.key,
    listSort.order,
    sheetMonitorSummaryById,
    sheetHepatiteSummaryById,
    monitorColById,
    hepatiteColById,
    crsByIdMap,
    activeSchema,
    responseLabelMaps,
  ]);

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
    if (!isHepatiteCriancaList) {
      setVisibleHepatiteColIds([]);
      return;
    }
    const cols = getHepatiteCriancaListColumnSpecs();
    const allowedIds = cols.map((c) => c.id);
    const allowed = new Set(allowedIds);
    const stored = readHepatiteListColSelection();
    const fromStore = (stored ?? []).filter((id) => allowed.has(id));
    const def = getHepatiteDefaultVisibleListColIds(allowedIds);
    setVisibleHepatiteColIds(fromStore.length > 0 ? fromStore : def);
  }, [agravo, isHepatiteCriancaList]);

  useEffect(() => {
    if (!isHepatiteCriancaList) return;
    let cancelled = false;
    loadMunicipioLabelMaps().then((maps) => {
      if (!cancelled) setHepatiteMunicipioMaps(maps);
    });
    return () => {
      cancelled = true;
    };
  }, [isHepatiteCriancaList]);

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

  const loadResponsesPage = async (formId: number, p = 1, limit = itemsPerPage) => {
    const res = await FormResponsesService.list(formId, buildListFilters(p, limit));
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
      setSearchParams({ term: '', field: 'all' });
      setDebouncedSearch({ term: '', field: 'all' });
      setDateFilters({});
      setPage(1);
      setItemsPerPage(10);
      setMonitorSubmissionsForTotals([]);
      setListaRecorte('todas');
      setRecorteSource([]);
      listQueryReadyRef.current = false;

      const formData = await FormService.getFormByKey(agravo);
      setForm(formData);

      if (agravo === MONITOR_OPER_REGIONAL_KEY && formData.active_version_id) {
        FormSubmissionService.getSubmissionsAllPagesWithFormPayload(formData.active_version_id).then(setMonitorSubmissionsForTotals);
      }

      if (formData.id) {
        const res = await FormResponsesService.list(formData.id, {
          page: 1,
          limit: 10,
          status: 'submitted',
        });
        setRows(res.data as ResponseRow[]);
        setPage(res.page);
        setTotalPages(res.totalPages);
        setListTotal(res.total);
        listQueryReadyRef.current = true;
        skipListReloadOnceRef.current = true;
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
    if (searchParams.term.length > 0 && searchParams.term.length < 3) return;
    const t = window.setTimeout(() => {
      setDebouncedSearch(searchParams);
      setPage(1);
    }, 400);
    return () => window.clearTimeout(t);
  }, [searchParams]);

  useEffect(() => {
    if (!listQueryReadyRef.current || !form?.id) return;
    if (isMonitorOperList && listaRecorte !== 'todas') return;
    if (skipListReloadOnceRef.current) {
      skipListReloadOnceRef.current = false;
      return;
    }
    void loadResponsesPage(form.id, page, itemsPerPage);
  }, [debouncedSearch, dateFilters, serverSortMeta.sortKey, serverSortMeta.sortDir, serverSortMeta.clientOnly, page, itemsPerPage, form?.id, isMonitorOperList, listaRecorte]);

  useEffect(() => {
    if (!isMonitorOperList || listaRecorte === 'todas' || !form?.id || !listQueryReadyRef.current) return;
    let cancelled = false;
    setRecorteLoading(true);
    const filters: Omit<FormResponsesListFilters, 'page' | 'limit'> = { status: 'submitted' };
    if (debouncedSearch.term.length >= 3) {
      filters.search = debouncedSearch.term;
      filters.search_field = debouncedSearch.field;
    }
    if (dateFilters.data_inicio) filters.data_inicio = dateFilters.data_inicio;
    if (dateFilters.data_fim) filters.data_fim = dateFilters.data_fim;
    FormResponsesService.listAllResponses(form.id, filters)
      .then((data) => {
        if (!cancelled) setRecorteSource(data as ResponseRow[]);
      })
      .catch((err: unknown) => {
        console.error(err);
        if (!cancelled) setRecorteSource([]);
      })
      .finally(() => {
        if (!cancelled) setRecorteLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isMonitorOperList, listaRecorte, form?.id, debouncedSearch, dateFilters]);

  useEffect(() => {
    if (!recorteAtivo) return;
    if (page > shownTotalPages) setPage(shownTotalPages);
  }, [recorteAtivo, page, shownTotalPages]);

  useEffect(() => {
    if (!showSheet || !form?.id) {
      setSheetPreviewRows([]);
      setSheetPreviewLoading(false);
      return;
    }
    let cancelled = false;
    setSheetPreviewLoading(true);
    setSheetPreviewRows([]);
    FormResponsesService.listAllResponses(form.id, {
      status: 'submitted',
      ...(debouncedSearch.term.length >= 3
        ? { search: debouncedSearch.term, search_field: debouncedSearch.field }
        : {}),
      ...dateFilters,
    })
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
  }, [showSheet, form?.id, debouncedSearch, dateFilters]);

  const downloadAll = async (format: 'xlsx' | 'csv') => {
    if (!form?.id) return;
    try {
      const { blob, filename } = await FormResponsesService.downloadExport(form.id, {
        format,
        status: 'submitted',
        ...(debouncedSearch.term.length >= 3
          ? { search: debouncedSearch.term, search_field: debouncedSearch.field }
          : {}),
        ...dateFilters,
        ...(!serverSortMeta.clientOnly && serverSortMeta.sortKey
          ? { sortKey: serverSortMeta.sortKey, sortDir: serverSortMeta.sortDir }
          : {}),
      });
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

  const toggleSelectId = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllPage = () => {
    const pageIds = tableRows.map((r) => r.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (!confirm(`Excluir ${ids.length} notificação(ões) selecionada(s)? Esta ação não pode ser desfeita.`)) {
      return;
    }
    const userId = user?.sub || (user as any)?.id;
    if (!userId) {
      alert('Usuário não autenticado');
      return;
    }
    setBulkDeleting(true);
    let failed = 0;
    try {
      for (const id of ids) {
        try {
          await FormSubmissionService.deleteSubmission(id, userId);
        } catch {
          failed += 1;
        }
      }
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      if (form?.id) await loadResponsesPage(form.id, page);
      if (agravo === MONITOR_OPER_REGIONAL_KEY && form?.active_version_id) {
        const all = await FormSubmissionService.getSubmissionsAllPagesWithFormPayload(form.active_version_id);
        setMonitorSubmissionsForTotals(all);
      }
      if (failed > 0) {
        alert(`${failed} exclusão(ões) falharam. As demais foram concluídas.`);
      }
    } finally {
      setBulkDeleting(false);
    }
  };

  const genericKeyFields = guessKeyFields(activeSchema as Parameters<typeof guessKeyFields>[0]);

  const formatRowCard = (r: ResponseRow) => {
    const submittedAt = r.submitted_at ? new Date(r.submitted_at).toLocaleString('pt-BR') : '—';
    if (isMonitorOperList) {
      const sum = monitorSummaryById.get(r.id);
      const title = sum ? visibleMonitorCols[0]?.format(sum, crsByIdMap) || `#${r.id}` : `#${r.id}`;
      const lines = visibleMonitorCols.slice(1, 4).map((c) => {
        const text = sum ? c.format(sum, crsByIdMap) : '—';
        return `${c.label}: ${text}`;
      });
      return { title: String(title), subtitle: submittedAt, lines };
    }
    if (isHepatiteCriancaList) {
      const sum = hepatiteSummaryById.get(r.id);
      const title = sum ? visibleHepatiteCols[0]?.format(sum) || `#${r.id}` : `#${r.id}`;
      const lines = visibleHepatiteCols.slice(1, 4).map((c) => {
        const text = sum ? c.format(sum) : '—';
        return `${c.label}: ${text}`;
      });
      return { title: String(title), subtitle: submittedAt, lines };
    }
    const fields = genericKeyFields.slice(0, 3);
    const titleField = fields[0];
    const title = titleField
      ? formatCellValueForResponseList(
          getValueAtPath(r.data_json ?? {}, titleField.key),
          findFormFieldByKey(activeSchema, titleField.key),
          responseLabelMaps,
        ) || `#${r.id}`
      : `#${r.id}`;
    const lines = fields.slice(1).map((f) => {
      const display = formatCellValueForResponseList(
        getValueAtPath(r.data_json ?? {}, f.key),
        findFormFieldByKey(activeSchema, f.key),
        responseLabelMaps,
      );
      return `${f.label}: ${display || '—'}`;
    });
    return { title: String(title), subtitle: submittedAt, lines };
  };

  const pageAllSelected =
    tableRows.length > 0 && tableRows.every((r) => selectedIds.has(r.id));
  const pageSomeSelected = tableRows.some((r) => selectedIds.has(r.id)) && !pageAllSelected;

  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const pageSet = new Set(tableRows.map((r) => r.id));
      const next = new Set([...prev].filter((id) => pageSet.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [tableRows]);

  const downloadPage = (format: 'xlsx' | 'csv') => {
    const cols: Array<{ key: string; label: string }> = [
      { key: 'id', label: 'ID' },
      { key: 'submitted_at', label: 'Data do envio' },
      { key: 'created_by', label: 'Criado por' },
    ];
    for (const f of genericKeyFields.slice(0, 8)) {
      cols.push({ key: `f_${f.key}`, label: f.label || f.key });
    }
    const flat = tableRows.map((r) => {
      const row: Record<string, unknown> = {
        id: r.id,
        submitted_at: r.submitted_at ?? r.created_at,
        created_by: r.created_by,
      };
      for (const f of genericKeyFields.slice(0, 8)) {
        const v = getValueAtPath(r.data_json ?? {}, f.key);
        const field = findFormFieldByKey(activeSchema, f.key);
        row[`f_${f.key}`] = formatCellValueForResponseList(v, field, responseLabelMaps);
      }
      return row;
    });
    const base = `form-${form?.id ?? 'respostas'}-pagina-${page}`;
    if (format === 'csv') exportRowsAsCsv(flat, cols, base);
    else exportRowsAsXlsx(flat, cols, base);
  };

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
      <div className="flex flex-wrap gap-2 justify-end items-center">
        <button
          type="button"
          onClick={() => setShowSheet(true)}
          className="px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow font-medium"
          title="Pré-visualizar em tabela"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Tabela
        </button>
        <ListExportMenu
          onExportPage={downloadPage}
          onExportAll={(fmt) => void downloadAll(fmt)}
        />
      </div>
    ) : null;

  return (
    <AppPageLayout
      title={form?.nome || 'Notificações'}
      subtitle={`${shownTotal} notificação(ões) cadastrada(s)`}
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
          {agravo?.toUpperCase() === 'ENTOMOLOGIA_LARVAS' && (
            <button
              type="button"
              data-testid="entomologia-larvas-dashboard"
              onClick={() => navigate('/private/entomologia-larvas')}
              className="p-2 sm:w-auto sm:inline-flex sm:items-center sm:justify-center sm:space-x-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md font-medium"
            >
              <BarChart2 className="w-5 h-5" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          )}
          {isHepatiteCriancaList && (
            <button
              type="button"
              data-testid="hepatite-crianca-dashboard"
              onClick={() => navigate(`/private/formularios/${HEPATITE_CRIANCA_HBV_FORM_KEY}/dashboard`)}
              className="p-2 sm:w-auto sm:inline-flex sm:items-center sm:justify-center sm:space-x-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md font-medium"
            >
              <BarChart2 className="w-5 h-5" />
              <span className="hidden sm:inline">Dashboard</span>
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
        rows={
          recorteAtivo
            ? sortedSheetPreviewRows.filter((row) => monitorOperMatchesListaRecorte(row.data_json, listaRecorte))
            : sortedSheetPreviewRows
        }
        loading={sheetPreviewLoading}
        onDownloadXlsx={() => void downloadAll('xlsx')}
        onDownloadCsv={() => void downloadAll('csv')}
        labelMaps={responseLabelMaps}
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
        <>
        <ListSearchFiltersBar
          searchFields={formSearchFields.map((f) => ({ value: f.value, label: f.label }))}
          searchField={searchParams.field}
          searchTerm={searchParams.term}
          onSearchFieldChange={(field) => setSearchParams((s) => ({ ...s, field }))}
          onSearchTermChange={(term) => setSearchParams((s) => ({ ...s, term }))}
          dateFilters={dateFilters}
          onApplyDateFilters={(next) => {
            setDateFilters(next);
            setPage(1);
          }}
          onClearDateFilters={() => {
            setDateFilters({});
            setPage(1);
          }}
        />

        {isMonitorOperList ? (
          <div className="mb-4 flex justify-center">
            <div
              className="inline-flex items-center gap-1 rounded-full bg-blue-600 p-1 shadow-md shadow-blue-900/15"
              role="tablist"
              aria-label="Recorte da lista"
            >
              {(
                [
                  {
                    id: 'todas',
                    label: 'Todas',
                    idle: 'text-white/85 hover:bg-white/15',
                    on: 'bg-white text-blue-700 shadow-sm',
                  },
                  {
                    id: 'qdqq',
                    label: 'QDQQ',
                    idle: 'text-white/85 hover:bg-white/15',
                    on: 'bg-white text-[#1A7CA8] shadow-sm',
                  },
                  {
                    id: 'sigplan',
                    label: 'SIGPLAN',
                    idle: 'text-white/85 hover:bg-white/15',
                    on: 'bg-white text-emerald-700 shadow-sm',
                  },
                ] as const
              ).map((option) => {
                const selected = listaRecorte === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    data-testid={`monitor-oper-lista-recorte-${option.id}`}
                    onClick={() => {
                      setListaRecorte(option.id);
                      setPage(1);
                    }}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 ${
                      selected ? option.on : option.idle
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="form-list-selection-toggle"
            onClick={() => {
              setIsSelectionMode((v) => !v);
              setSelectedIds(new Set());
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {isSelectionMode ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            {isSelectionMode ? 'Cancelar seleção' : 'Selecionar'}
          </button>
          {isSelectionMode ? (
            <>
              <button
                type="button"
                onClick={toggleSelectAllPage}
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50"
              >
                {pageAllSelected ? 'Limpar página' : 'Selecionar página'}
              </button>
              <button
                type="button"
                disabled={selectedIds.size === 0 || bulkDeleting}
                onClick={() => void handleBulkDelete()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {bulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Excluir ({selectedIds.size})
              </button>
            </>
          ) : null}
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-visible">
          {isCustomList && listTotal > 0 ? (
            <div className="flex flex-wrap items-center justify-end gap-2 border-b border-gray-200 bg-gray-100 px-3 py-2">
              <div className="relative z-30" ref={listColPickerRef}>
                <button
                  type="button"
                  data-testid={isMonitorOperList ? 'monitor-oper-list-columns' : 'hepatite-crianca-list-columns'}
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
                          if (isMonitorOperList) {
                            const next = getMonitorOperDefaultVisibleListColIds(monitorListCols.map((c) => c.id));
                            setVisibleMonitorColIds(next);
                            writeMonitorOperListColSelection(next);
                          } else {
                            const next = getHepatiteDefaultVisibleListColIds(hepatiteListCols.map((c) => c.id));
                            setVisibleHepatiteColIds(next);
                            writeHepatiteListColSelection(next);
                          }
                        }}
                      >
                        Relevantes
                      </button>
                      <button
                        type="button"
                        className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                        onClick={() => {
                          if (isMonitorOperList) {
                            const next = monitorListCols.map((c) => c.id);
                            setVisibleMonitorColIds(next);
                            writeMonitorOperListColSelection(next);
                          } else {
                            const next = hepatiteListCols.map((c) => c.id);
                            setVisibleHepatiteColIds(next);
                            writeHepatiteListColSelection(next);
                          }
                        }}
                      >
                        Todas
                      </button>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-lg border border-gray-100">
                      {(isMonitorOperList ? monitorListCols : hepatiteListCols)
                        .filter((c) => {
                          const q = listColQuery.trim().toLowerCase();
                          if (!q) return true;
                          return `${c.label} ${c.id}`.toLowerCase().includes(q);
                        })
                        .map((c) => {
                          const visibleIds = isMonitorOperList ? visibleMonitorColIds : visibleHepatiteColIds;
                          const allCols = isMonitorOperList ? monitorListCols : hepatiteListCols;
                          const checked = visibleIds.includes(c.id);
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
                                  const next = new Set(visibleIds);
                                  if (e.target.checked) next.add(c.id);
                                  else next.delete(c.id);
                                  const arr = allCols.map((x) => x.id).filter((id) => next.has(id));
                                  if (arr.length === 0) return;
                                  if (isMonitorOperList) {
                                    setVisibleMonitorColIds(arr);
                                    writeMonitorOperListColSelection(arr);
                                  } else {
                                    setVisibleHepatiteColIds(arr);
                                    writeHepatiteListColSelection(arr);
                                  }
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
          {recorteAtivo && recorteLoading ? (
            <p className="px-4 py-6 text-center text-sm text-gray-500">Carregando este recorte…</p>
          ) : null}
          {recorteAtivo && !recorteLoading && tableRows.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-500">Nenhuma ação neste recorte.</p>
          ) : null}
          {/* Mobile: cards */}
          <div className="block md:hidden divide-y divide-gray-100" data-testid="form-list-mobile-cards">
            {tableRows.map((r) => {
              const card = formatRowCard(r);
              const selected = selectedIds.has(r.id);
              return (
                <div
                  key={r.id}
                  className={`p-4 ${selected ? 'ring-2 ring-inset ring-blue-400 bg-blue-50/80' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {isSelectionMode ? (
                      <div className="pt-1 shrink-0">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSelectId(r.id)}
                          aria-label={`Selecionar resposta ${r.id}`}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </div>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{card.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                      {card.lines.map((line) => (
                        <p key={line} className="text-xs text-gray-700 mt-1 truncate">
                          {line}
                        </p>
                      ))}
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelected(r)}
                        className="px-2.5 py-1 rounded-lg border bg-white text-xs text-blue-700 hover:bg-blue-50 font-medium"
                      >
                        Ver
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/private/formularios/${agravo}/editar/${r.id}`)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded self-end"
                        title="Editar"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded self-end"
                        title="Excluir"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: tabela */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-full text-sm divide-y divide-gray-200">
              <thead className="bg-blue-600 text-white">
                <tr>
                  {isSelectionMode ? (
                    <th scope="col" className="w-11 px-2 py-3 text-center align-middle">
                      <input
                        type="checkbox"
                        checked={pageAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = pageSomeSelected;
                        }}
                        onChange={toggleSelectAllPage}
                        aria-label="Selecionar todos desta página"
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </th>
                  ) : null}
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
                    : isHepatiteCriancaList
                      ? visibleHepatiteCols.map((c) => (
                          <FormListSortableTh
                            key={c.id}
                            label={c.label}
                            sortKey={buildListSortHepatiteKey(c.id)}
                            activeKey={listSort.key}
                            sortOrder={listSort.order}
                            onSort={handleListSortChange}
                            thClassName={`${c.thClassName ?? 'text-left'} whitespace-nowrap`.trim()}
                            titleAttr={c.label}
                            hiddenLg={c.hiddenLg}
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
                {tableRows.map((r) => {
                  const submittedAt = r.submitted_at ? new Date(r.submitted_at) : null;
                  return (
                    <tr
                      key={r.id}
                      className={`transition-colors duration-150 hover:bg-gray-50 ${
                        selectedIds.has(r.id) ? 'bg-blue-50/70' : ''
                      }`}
                    >
                      {isSelectionMode ? (
                        <td className="w-11 px-2 py-3 text-center align-middle">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(r.id)}
                            onChange={() => toggleSelectId(r.id)}
                            aria-label={`Selecionar resposta ${r.id}`}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </td>
                      ) : null}
                      {isMonitorOperList ? (
                        visibleMonitorCols.map((c) => {
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
                      ) : isHepatiteCriancaList ? (
                        visibleHepatiteCols.map((c) => {
                          const sum = hepatiteSummaryById.get(r.id);
                          const text = sum ? c.format(sum) : '—';
                          return (
                            <td
                              key={c.id}
                              className={`px-3 lg:px-4 xl:px-6 py-3 align-middle text-sm text-gray-900 ${c.hiddenLg ? 'hidden lg:table-cell' : ''} ${c.tdClassName ?? ''}`}
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
        </div>

            {/* Paginação — card separado, padrão Comunicação DAE */}
            <ListPaginationBar
              page={page}
              totalPages={shownTotalPages}
              total={shownTotal}
              itemsPerPage={itemsPerPage}
              disabled={!form?.id}
              itemsPerPageId="form-list-items-per-page"
              itemsPerPageTestId="form-list-items-per-page"
              onPageChange={(p) => setPage(p)}
              onItemsPerPageChange={(limit) => {
                setItemsPerPage(limit);
                setPage(1);
              }}
            />
        </>
      )}
    </AppPageLayout>
  );
};
