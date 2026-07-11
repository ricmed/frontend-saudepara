import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, FileText, Calendar, Filter, X, Trash2, Edit, Eye, Menu, Download, ChevronDown, Search, ArrowUpDown, ArrowUp, ArrowDown, FileSpreadsheet, Wifi, WifiOff, BarChart2, Archive, ArchiveRestore, CheckSquare, Square, Loader2 } from 'lucide-react';
import ComunicacaoDaeService, {
  ComunicacaoDae,
  ComunicacaoDaeFilters,
  StatusLeituraFiltro,
  VisibilidadeArquivamentoFiltro,
  getComunicacaoDaeApiErrorMessage,
  isComunicacaoDaeForbiddenError,
} from '@/services/ComunicacaoDaeService';
import { SideMenu } from '@/features/home/components/SideMenu';
import { useOfflineSystem } from '@/hooks/useOfflineSystem';
import ConnectionStatus from '@/components/ConnectionStatus';
import {
  exportarComunicacoesDaeCSV,
  exportarComunicacoesDaeExcel,
  ComunicacaoDaeExportData
} from './components/exportUtilities';
import {
  exportarComunicacoesDaeListaPDF,
  exportarComunicacoesDaeListaWord,
} from './components/listDocumentExporters';
import { formatComunicacaoDaeAgravoNomes } from '@/features/comunicacao-dae/comunicacaoDaeAgravoUtils';
import { useComunicacaoDaeLeituraResumo } from '@/features/comunicacao-dae/hooks/useComunicacaoDaeLeituraResumo';
import {
  DaeTableColumnId,
  DAE_TABLE_COLUMN_ORDER,
  useResizableTableColumns,
} from '@/features/comunicacao-dae/hooks/useResizableTableColumns';
import { calcularSemanaEpidemiologica } from '@/utils/timezoneUtils';
import { offlineDataManager } from '@/services/offlineDataManager';

// Tipos para pesquisa
type SearchField = 'all' | 'nome_paciente' | 'origem' | 'unidade_notificadora' | 'dae' | 'municipio';

interface SearchParams {
  term: string;
  field: SearchField;
}

// Tipos para ordenação
type SortableField =
  | 'id_comunicacao'
  | 'data_comunicacao'
  | 'semana_epidemiologica'
  | 'nome_paciente'
  | 'origem_tipo'
  | 'unidade_notificadora'
  | 'dae'
  | 'municipio';

interface SortConfig {
  key: SortableField | null;
  direction: 'asc' | 'desc' | null;
}

const searchFields = [
  { value: 'all' as SearchField, label: 'Todos os campos' },
  { value: 'nome_paciente' as SearchField, label: 'Nome do Paciente' },
  { value: 'origem' as SearchField, label: 'Origem' },
  { value: 'unidade_notificadora' as SearchField, label: 'Unidade notificadora' },
  { value: 'dae' as SearchField, label: 'DAE' },
  { value: 'municipio' as SearchField, label: 'Município' },
];

type ComunicacaoDaePageLocationState = {
  refreshList?: boolean;
};

const ComunicacaoDaePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loadComunicacoesRef = useRef<() => void>(() => {});
  const lastFetchAtRef = useRef(0);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const MIN_LIST_REFRESH_MS = 5000;
  
  // ✅ Hook do sistema offline
  const {
    isOnline,
    pendingData,
    getOfflineStatusMessage
  } = useOfflineSystem({ includePeriodicRefresh: false });
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [comunicacoes, setComunicacoes] = useState<ComunicacaoDae[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ComunicacaoDaeFilters>({});
  const [tempFilters, setTempFilters] = useState<ComunicacaoDaeFilters>({});

  // Exportação
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Pesquisa
  const [searchParams, setSearchParams] = useState<SearchParams>({ term: '', field: 'all' });
  // debouncedSearch reflete searchParams após 400 ms — é o que é enviado ao backend
  const [debouncedSearch, setDebouncedSearch] = useState<SearchParams>({ term: '', field: 'all' });
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const [filteredComunicacoes, setFilteredComunicacoes] = useState<ComunicacaoDae[]>([]);

  // Ordenação
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });
  const [sortedComunicacoes, setSortedComunicacoes] = useState<ComunicacaoDae[]>([]);

  // Filtro de leitura (por usuário)
  const [statusLeituraFilter, setStatusLeituraFilter] = useState<StatusLeituraFiltro>('todas');
  const [visibilidadeFilter, setVisibilidadeFilter] = useState<VisibilidadeArquivamentoFiltro>('ativas');
  const { resumo: leituraResumo } = useComunicacaoDaeLeituraResumo();

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const selectAllPageRef = useRef<HTMLInputElement>(null);

  const { columnWidths, totalWidth, startResize } = useResizableTableColumns(
    tableContainerRef,
    loading || filteredComunicacoes.length === 0 ? 0 : filteredComunicacoes.length,
  );

  const loadComunicacoes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isOnline) {
        const allOffline = await offlineDataManager.getComunicacoesDaeForOfflineList();
        const start = (currentPage - 1) * itemsPerPage;
        const pageSlice = allOffline.slice(start, start + itemsPerPage);
        setComunicacoes(pageSlice);
        setTotal(allOffline.length);
        setTotalPages(Math.max(1, Math.ceil(allOffline.length / itemsPerPage)));
        lastFetchAtRef.current = Date.now();
        if (allOffline.length === 0) {
          setError('Nenhuma comunicação DAE disponível offline. Baixe os dados no Gerenciamento Offline.');
        }
        return;
      }

      const functionalFilters = { ...filters };

      if (statusLeituraFilter !== 'todas') {
        functionalFilters.status_leitura = statusLeituraFilter;
      }

      if (visibilidadeFilter !== 'ativas') {
        functionalFilters.visibilidade = visibilidadeFilter;
      }

      const searchFilters =
        debouncedSearch.term.length >= 3
          ? { search: debouncedSearch.term, search_field: debouncedSearch.field }
          : {};

      const response = await ComunicacaoDaeService.getAll(currentPage, itemsPerPage, {
        ...functionalFilters,
        ...searchFilters,
      });
      setComunicacoes(response.data || []);
      setTotal(response.pagination?.total || 0);
      setTotalPages(response.pagination?.pages || 1);
      lastFetchAtRef.current = Date.now();
    } catch (err: unknown) {
      if (isComunicacaoDaeForbiddenError(err)) {
        setComunicacoes([]);
        setTotal(0);
        setTotalPages(1);
        setError(
          getComunicacaoDaeApiErrorMessage(
            err,
            'Acesso negado às comunicações DAE para o usuário autenticado.',
          ),
        );
        return;
      }

      try {
        const allOffline = await offlineDataManager.getComunicacoesDaeForOfflineList();
        if (allOffline.length > 0) {
          const start = (currentPage - 1) * itemsPerPage;
          const pageSlice = allOffline.slice(start, start + itemsPerPage);
          setComunicacoes(pageSlice);
          setTotal(allOffline.length);
          setTotalPages(Math.max(1, Math.ceil(allOffline.length / itemsPerPage)));
          setError('Sem conexão com o servidor — exibindo dados salvos no dispositivo.');
          return;
        }
      } catch {
        /* fallback falhou */
      }
      setError(getComunicacaoDaeApiErrorMessage(err, 'Erro ao carregar comunicações'));
      console.error('Erro ao carregar comunicações:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, itemsPerPage, statusLeituraFilter, visibilidadeFilter, isOnline, debouncedSearch]);

  useEffect(() => {
    loadComunicacoesRef.current = loadComunicacoes;
  }, [loadComunicacoes]);

  useEffect(() => {
    loadComunicacoes();
  }, [loadComunicacoes]);

  // Recarregar ao voltar do formulário (após salvar)
  useEffect(() => {
    const state = location.state as ComunicacaoDaePageLocationState | null;
    if (state?.refreshList) {
      loadComunicacoes();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, loadComunicacoes, navigate]);

  // Recarregar quando o usuário volta à aba (evita lista stale, com debounce)
  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastFetchAtRef.current < MIN_LIST_REFRESH_MS) return;
      loadComunicacoesRef.current();
    };
    window.addEventListener('focus', refreshIfVisible);
    document.addEventListener('visibilitychange', refreshIfVisible);
    return () => {
      window.removeEventListener('focus', refreshIfVisible);
      document.removeEventListener('visibilitychange', refreshIfVisible);
    };
  }, []);

  // Fechar dropdown de pesquisa ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce: propaga searchParams ao backend após 400 ms (ignora digitação intermediária)
  useEffect(() => {
    // Aguarda o usuário digitar pelo menos 3 caracteres antes de disparar
    if (searchParams.term.length > 0 && searchParams.term.length < 3) return;
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchParams);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchParams]);

  // Quando online: o backend já filtrou — passa comunicacoes diretamente.
  // Quando offline: aplica filtro client-side na página carregada do cache.
  useEffect(() => {
    if (isOnline) {
      setFilteredComunicacoes(comunicacoes);
      return;
    }

    if (!searchParams.term || searchParams.term.length < 3) {
      setFilteredComunicacoes(comunicacoes);
      return;
    }

    const normalize = (s?: string) =>
      String(s || '')
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();

    const searchTerm = normalize(searchParams.term);
    const filtered = comunicacoes.filter((com) => {
      const origemNome = normalize(com.origem?.nome || '');
      const origemTipo = normalize(com.origem_tipo || '');
      const paciente = normalize(com.nome_paciente || '');
      const municipio = normalize(com.tipo_municipio?.descricao || '');
      const dae = normalize(formatComunicacaoDaeAgravoNomes(com) || '');

      switch (searchParams.field) {
        case 'nome_paciente':
          return paciente.includes(searchTerm);
        case 'origem':
          return origemTipo.includes(searchTerm) || origemNome.includes(searchTerm);
        case 'unidade_notificadora':
          return origemNome.includes(searchTerm);
        case 'dae':
          return dae.includes(searchTerm);
        case 'municipio':
          return municipio.includes(searchTerm);
        case 'all':
        default:
          return (
            paciente.includes(searchTerm) ||
            origemTipo.includes(searchTerm) ||
            origemNome.includes(searchTerm) ||
            dae.includes(searchTerm) ||
            municipio.includes(searchTerm)
          );
      }
    });

    setFilteredComunicacoes(filtered);
  }, [searchParams, comunicacoes, isOnline]);

  // Ordenação deve ser aplicada no backend (antes da paginação).
  // Aqui mantemos apenas a lista filtrada (pesquisa local na página).
  useEffect(() => {
    setSortedComunicacoes(filteredComunicacoes);
  }, [filteredComunicacoes]);

  const isComunicacaoNaoLida = (comunicacao: ComunicacaoDae) => comunicacao.lida === false;

  const getComunicacaoId = (comunicacao: ComunicacaoDae) => Number(comunicacao.id_comunicacao);

  const isComunicacaoArquivada = (comunicacao: ComunicacaoDae) => {
    if (comunicacao.arquivada === true) return true;
    if (comunicacao.arquivada === false) return false;
    return visibilidadeFilter === 'arquivadas';
  };

  const isComunicacaoAtiva = (comunicacao: ComunicacaoDae) => !isComunicacaoArquivada(comunicacao);

  const getLinhaClasses = (comunicacao: ComunicacaoDae, index: number) => {
    const id = getComunicacaoId(comunicacao);
    const isSelected = selectedIds.has(id);
    const cursor = isSelectionMode ? 'cursor-pointer' : 'cursor-pointer';
    const selectedClass = isSelected ? 'ring-2 ring-inset ring-blue-400 bg-blue-50/80' : '';

    if (isComunicacaoNaoLida(comunicacao)) {
      return `${cursor} ${selectedClass} bg-sky-50/90 hover:bg-sky-100/80 border-l-4 border-l-blue-500`;
    }
    return `${cursor} ${selectedClass} transition-colors duration-150 hover:bg-blue-50/50 ${
      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
    }`;
  };

  const handleLinhaKeyDown = (
    e: React.KeyboardEvent,
    id: number,
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRowActivation(id);
    }
  };

  const pararPropagacaoAcao = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
  };

  const marcarComunicacaoLidaLocal = (id: number) => {
    const patch = (lista: ComunicacaoDae[]) =>
      lista.map((c) =>
        Number(c.id_comunicacao) === id ? { ...c, lida: true } : c
      );
    setComunicacoes(patch);
  };

  const handleVisualizar = (id: number) => {
    marcarComunicacaoLidaLocal(id);
    // A ficha também marca leitura ao abrir — evita POST duplicado na navegação.
    navigate(`/private/comunicacao-dae/${id}`);
  };

  const handleStatusLeituraChange = (value: StatusLeituraFiltro) => {
    setStatusLeituraFilter(value);
    setCurrentPage(1);
  };

  const handleVisibilidadeChange = (value: VisibilidadeArquivamentoFiltro) => {
    setVisibilidadeFilter(value);
    setCurrentPage(1);
  };

  const handleArquivar = async (id: number) => {
    if (!isOnline) {
      setError('Arquivar comunicações requer conexão com o servidor.');
      return;
    }
    if (!confirm('Arquivar esta comunicação? Ela sairá da sua lista de ativas, mas poderá ser consultada depois.')) {
      return;
    }

    try {
      await ComunicacaoDaeService.arquivar(id);
      loadComunicacoes();
    } catch (err: unknown) {
      setError(getComunicacaoDaeApiErrorMessage(err, 'Erro ao arquivar comunicação'));
    }
  };

  const handleDesarquivar = async (id: number) => {
    if (!isOnline) {
      setError('Desarquivar comunicações requer conexão com o servidor.');
      return;
    }

    try {
      await ComunicacaoDaeService.desarquivar(id);
      loadComunicacoes();
    } catch (err: unknown) {
      setError(getComunicacaoDaeApiErrorMessage(err, 'Erro ao desarquivar comunicação'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta comunicação?')) return;

    try {
      await ComunicacaoDaeService.delete(id);
      loadComunicacoes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao excluir comunicação');
    }
  };

  const pageComunicacaoIds = sortedComunicacoes.map(getComunicacaoId);
  const selectedCount = selectedIds.size;
  const selectedOnPageCount = pageComunicacaoIds.filter((id) => selectedIds.has(id)).length;
  const allPageSelected = pageComunicacaoIds.length > 0 && selectedOnPageCount === pageComunicacaoIds.length;
  const somePageSelected = selectedOnPageCount > 0 && !allPageSelected;

  const selectedComunicacoes = sortedComunicacoes.filter((c) => selectedIds.has(getComunicacaoId(c)));
  const selectedArquivaveisCount = selectedComunicacoes.filter(isComunicacaoAtiva).length;
  const selectedArquivadasCount = selectedComunicacoes.filter(isComunicacaoArquivada).length;

  useEffect(() => {
    const el = selectAllPageRef.current;
    if (el) {
      el.indeterminate = somePageSelected;
    }
  }, [somePageSelected]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const visible = new Set(pageComunicacaoIds);
      const next = new Set([...prev].filter((id) => visible.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [pageComunicacaoIds.join(',')]);

  const toggleSelectionMode = () => {
    setIsSelectionMode((prev) => {
      if (prev) {
        setSelectedIds(new Set());
      }
      return !prev;
    });
  };

  const toggleSelectedId = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAllPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageComunicacaoIds.forEach((id) => next.delete(id));
      } else {
        pageComunicacaoIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleRowActivation = (id: number) => {
    if (isSelectionMode) {
      toggleSelectedId(id);
      return;
    }
    handleVisualizar(id);
  };

  const runBulkAction = async (
    ids: number[],
    action: (id: number) => Promise<void>,
    actionLabel: string,
  ) => {
    if (ids.length === 0) return;

    setBulkActionLoading(true);
    setError(null);

    let successCount = 0;
    let failCount = 0;

    for (const id of ids) {
      try {
        await action(id);
        successCount += 1;
      } catch {
        failCount += 1;
      }
    }

    setBulkActionLoading(false);
    setSelectedIds(new Set());
    loadComunicacoes();

    if (failCount > 0) {
      setError(
        `${successCount} comunicação(ões) ${actionLabel} com sucesso. ${failCount} falharam.`,
      );
    }
  };

  const handleBulkArquivar = async () => {
    if (!isOnline) {
      setError('Arquivar comunicações requer conexão com o servidor.');
      return;
    }

    const ids = selectedComunicacoes
      .filter(isComunicacaoAtiva)
      .map(getComunicacaoId);

    if (ids.length === 0) return;

    if (
      !confirm(
        `Arquivar ${ids.length} comunicação(ões)? Elas sairão da sua lista de ativas, mas poderão ser consultadas depois.`,
      )
    ) {
      return;
    }

    await runBulkAction(ids, (id) => ComunicacaoDaeService.arquivar(id).then(() => undefined), 'arquivada(s)');
  };

  const handleBulkDesarquivar = async () => {
    if (!isOnline) {
      setError('Desarquivar comunicações requer conexão com o servidor.');
      return;
    }

    const ids = selectedComunicacoes
      .filter(isComunicacaoArquivada)
      .map(getComunicacaoId);

    if (ids.length === 0) return;

    if (
      !confirm(
        `Desarquivar ${ids.length} comunicação(ões)? Elas voltarão para sua lista de ativas.`,
      )
    ) {
      return;
    }

    await runBulkAction(
      ids,
      (id) => ComunicacaoDaeService.desarquivar(id).then(() => undefined),
      'desarquivada(s)',
    );
  };

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;

    if (!confirm(`Tem certeza que deseja excluir ${ids.length} comunicação(ões)?`)) return;

    await runBulkAction(ids, (id) => ComunicacaoDaeService.delete(id), 'excluída(s)');
  };

  const renderSelectionCheckbox = (id: number, className = '') => (
    <input
      type="checkbox"
      checked={selectedIds.has(id)}
      onChange={() => toggleSelectedId(id)}
      onClick={pararPropagacaoAcao}
      onKeyDown={pararPropagacaoAcao}
      aria-label={`Selecionar comunicação ${id}`}
      className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer ${className}`}
    />
  );

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setCurrentPage(1);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters({});
    setTempFilters({});
    setCurrentPage(1);
    setShowFilters(false);
  };

  // Funções de ordenação
  const handleSort = (key: SortableField) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    // SE é derivada da data — mapeia para data_comunicacao no backend
    const backendKey = key === 'semana_epidemiologica' ? 'data_comunicacao' : key;
    setFilters((prev) => ({
      ...prev,
      sortKey: backendKey,
      sortDir: direction,
    }));
    setCurrentPage(1);
  };

  const renderSortIcon = (columnKey: SortableField) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="h-4 w-4 text-blue-600" /> : 
      <ArrowDown className="h-4 w-4 text-blue-600" />;
  };

  const handleExport = async (
    format: 'csv' | 'excel' | 'pdf' | 'word',
    type: 'page' | 'all',
    scope: VisibilidadeArquivamentoFiltro = 'ativas',
  ) => {
    try {
      let dataToExport: ComunicacaoDae[] = [];

      if (type === 'all') {
        const exportSearchFilters =
          debouncedSearch.term.length >= 3
            ? { search: debouncedSearch.term, search_field: debouncedSearch.field }
            : {};
        const exportVisibilidade =
          scope === 'ativas' ? {} : { visibilidade: scope };
        const response = await ComunicacaoDaeService.getAll(1, 9999, {
          ...filters,
          ...exportSearchFilters,
          ...exportVisibilidade,
        });
        dataToExport = response.data;
      } else {
        dataToExport = comunicacoes;
      }

      const scopeLabel =
        scope === 'todas' ? 'completo' : scope === 'arquivadas' ? 'arquivadas' : 'ativas';
      const filename = type === 'all'
        ? `comunicacoes_dae_${scopeLabel}`
        : `comunicacoes_dae_pagina_${currentPage}_${scopeLabel}`;

      // Converter para formato de exportação
      const exportData = dataToExport as ComunicacaoDaeExportData[];

      // Exportar no formato escolhido
      switch (format) {
        case 'csv':
          exportarComunicacoesDaeCSV(exportData, filename);
          break;
        case 'excel':
          exportarComunicacoesDaeExcel(exportData, filename);
          break;
        case 'pdf':
          await exportarComunicacoesDaeListaPDF(dataToExport, filename);
          break;
        case 'word':
          await exportarComunicacoesDaeListaWord(dataToExport, filename);
          break;
      }

      setShowExportMenu(false);
    } catch (err: unknown) {
      console.error('Erro ao exportar:', err);
      setError(
        isComunicacaoDaeForbiddenError(err)
          ? getComunicacaoDaeApiErrorMessage(
              err,
              'Acesso negado à exportação das comunicações DAE.',
            )
          : getComunicacaoDaeApiErrorMessage(err, 'Erro ao exportar dados'),
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const thClass =
    'px-2 py-3 text-left text-[10px] lg:text-xs font-semibold text-gray-700 uppercase tracking-wide';
  const tdClass = 'px-2 py-3 text-xs lg:text-sm align-middle max-w-0';
  const tdTruncate = `${tdClass} truncate`;

  const renderColumnResizeHandle = (columnId: DaeTableColumnId) => (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Redimensionar coluna"
      data-col-resize=""
      className="absolute right-0 top-0 z-10 h-full w-2 -mr-1 cursor-col-resize touch-none select-none hover:bg-blue-400/30 active:bg-blue-500/40"
      onMouseDown={(event) => startResize(columnId, event)}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    />
  );

  const renderSortableHeader = (
    columnId: DaeTableColumnId,
    label: string,
    sortKey: SortableField,
    options?: { title?: string; align?: 'left' | 'center' },
  ) => {
    const alignClass = options?.align === 'center' ? 'text-center' : 'text-left';
    const justifyClass = options?.align === 'center' ? 'justify-center' : '';
    return (
      <th
        key={columnId}
        style={{ width: columnWidths[columnId] }}
        className={`${thClass} ${alignClass} relative cursor-pointer hover:bg-gray-200/60 transition-colors select-none`}
        onClick={() => handleSort(sortKey)}
        title={options?.title ?? label}
      >
        <div className={`flex items-center gap-1 min-w-0 ${justifyClass}`}>
          <span className="truncate">{label}</span>
          {renderSortIcon(sortKey)}
        </div>
        {renderColumnResizeHandle(columnId)}
      </th>
    );
  };

  const getOrigemBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'CRS': return 'bg-blue-100 text-blue-800';
      case 'NHE': return 'bg-green-100 text-green-800';
      case 'CIEVS': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header com Azul Padrão */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg sticky top-0 z-20">
        <div className="w-full max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Lado esquerdo - Menu e Título */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                aria-label="Abrir menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">
                    Comunicação DAE
                  </h1>
                  {/* Indicador Online/Offline */}
                  {isOnline ? (
                    <Wifi className="h-5 w-5 text-green-300" title="Online" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-orange-300" title="Offline" />
                  )}
                </div>
                <p className="text-sm text-blue-100 mt-0.5">
                  Gerenciar Doenças, Agravos e Eventos
                  {leituraResumo.nao_lidas > 0 && (
                    <button
                      type="button"
                      onClick={() => handleStatusLeituraChange('nao_lidas')}
                      className="ml-2 inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white hover:bg-white/30 transition-colors"
                      title="Ver comunicações não lidas"
                    >
                      {leituraResumo.nao_lidas} não lida{leituraResumo.nao_lidas === 1 ? '' : 's'}
                    </button>
                  )}
                  {pendingData.comunicacoes_dae && pendingData.comunicacoes_dae > 0 && (
                    <span className="ml-2 text-yellow-200">
                      • {pendingData.comunicacoes_dae} pendente(s)
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            {/* Lado direito - Botões de Ação */}
            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 w-full lg:w-auto">
              {/* Botão Exportar */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="p-2 sm:w-auto sm:inline-flex sm:items-center sm:justify-center sm:space-x-2 sm:px-4 sm:py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors duration-200 shadow-md"
                >
                  <Download className="w-5 h-5" />
                  <span className="font-medium hidden sm:inline">Exportar</span>
                </button>

                {/* Menu de Exportação */}
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-30 overflow-hidden">
                    <div className="py-1">
                      {/* Exportar Página Atual */}
                      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                        <span className="text-xs font-semibold text-gray-700 uppercase">Página Atual</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleExport('csv', 'page')}
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">CSV</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExport('excel', 'page')}
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-medium">Excel</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExport('pdf', 'page')}
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium">PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExport('word', 'page')}
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-medium">Word (.docx)</span>
                      </button>

                      {/* Exportar Tudo — Ativas */}
                      <div className="px-3 py-2 bg-gray-50 border-t border-b border-gray-200 mt-1">
                        <span className="text-xs font-semibold text-gray-700 uppercase">Exportação completa — ativas</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleExport('csv', 'all', 'ativas')}
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">CSV</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExport('excel', 'all', 'ativas')}
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-medium">Excel</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExport('pdf', 'all', 'ativas')}
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium">PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExport('word', 'all', 'ativas')}
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-medium">Word (.docx)</span>
                      </button>

                      {/* Exportar Tudo — Ativas + arquivadas */}
                      <div className="px-3 py-2 bg-gray-50 border-t border-b border-gray-200 mt-1">
                        <span className="text-xs font-semibold text-gray-700 uppercase">Exportação completa — ativas + arquivadas</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleExport('csv', 'all', 'todas')}
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">CSV</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExport('excel', 'all', 'todas')}
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-medium">Excel</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExport('pdf', 'all', 'todas')}
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium">PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExport('word', 'all', 'todas')}
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-medium">Word (.docx)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Botão Dashboard */}
              <button
                onClick={() => navigate('/private/comunicacao-dae/dashboard')}
                className="p-2 sm:w-auto sm:inline-flex sm:items-center sm:justify-center sm:space-x-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md font-medium"
              >
                <BarChart2 className="w-5 h-5" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>

              {/* Botão Nova Comunicação */}
              <button
                onClick={() => navigate('/private/comunicacao-dae/nova')}
                className="p-2 sm:w-auto sm:inline-flex sm:items-center sm:justify-center sm:space-x-2 sm:px-4 sm:py-2.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200 shadow-md font-medium"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Nova Comunicação</span>
              </button>
            </div>
          </div>

          {/* Barra de Filtros e Pesquisa */}
          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  showFilters 
                    ? 'bg-blue-700 text-white' 
                    : 'bg-blue-500 text-white hover:bg-blue-700'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="font-medium">Filtros</span>
                {Object.keys(filters).length > 0 && (
                  <span className="ml-1 bg-white text-blue-600 text-xs px-2 py-0.5 rounded-full font-semibold">
                    {Object.keys(filters).length}
                  </span>
                )}
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              <button
                type="button"
                onClick={toggleSelectionMode}
                disabled={bulkActionLoading || sortedComunicacoes.length === 0}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSelectionMode
                    ? 'bg-white text-blue-700 ring-2 ring-white/80'
                    : 'bg-blue-500 text-white hover:bg-blue-700'
                }`}
                title={isSelectionMode ? 'Sair do modo de seleção' : 'Selecionar várias comunicações'}
              >
                {isSelectionMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                <span className="font-medium">{isSelectionMode ? 'Cancelar seleção' : 'Selecionar'}</span>
              </button>
              <div
                className="inline-flex rounded-lg overflow-hidden border border-blue-400/60 bg-blue-500/30"
                role="group"
                aria-label="Filtrar por leitura"
              >
                {(
                  [
                    { value: 'todas' as const, label: `Todas (${leituraResumo.todas})` },
                    { value: 'nao_lidas' as const, label: `Não lidas (${leituraResumo.nao_lidas})` },
                    { value: 'lidas' as const, label: `Lidas (${leituraResumo.lidas})` },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleStatusLeituraChange(opt.value)}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      statusLeituraFilter === opt.value
                        ? 'bg-white text-blue-700'
                        : 'text-white hover:bg-blue-600/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div
                className="inline-flex rounded-lg overflow-hidden border border-blue-400/60 bg-blue-500/30"
                role="group"
                aria-label="Filtrar por arquivamento"
              >
                {(
                  [
                    { value: 'ativas' as const, label: 'Ativas' },
                    { value: 'todas' as const, label: 'Ativas + arquivadas' },
                    { value: 'arquivadas' as const, label: 'Arquivadas' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleVisibilidadeChange(opt.value)}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      visibilidadeFilter === opt.value
                        ? 'bg-white text-blue-700'
                        : 'text-white hover:bg-blue-600/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Barra de Pesquisa */}
            <div className="flex-1 w-full sm:max-w-xl">
              <div className="relative flex items-center">
                {/* Dropdown de campos de pesquisa */}
                <div className="relative" ref={searchDropdownRef}>
                  <button
                    onClick={() => setIsSearchDropdownOpen(!isSearchDropdownOpen)}
                    className="h-10 px-3 bg-blue-500 hover:bg-blue-700 text-white rounded-l-lg border-r border-blue-400 transition-colors flex items-center space-x-1 text-sm font-medium"
                  >
                    <span className="hidden sm:inline">
                      {searchFields.find(f => f.value === searchParams.field)?.label || 'Todos'}
                    </span>
                    <span className="sm:hidden">Campo</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {isSearchDropdownOpen && (
                    <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-40">
                      {searchFields.map((field) => (
                        <button
                          key={field.value}
                          onClick={() => {
                            setSearchParams({ ...searchParams, field: field.value });
                            setIsSearchDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-50 transition-colors ${
                            searchParams.field === field.value 
                              ? 'bg-blue-50 text-blue-700 font-medium' 
                              : 'text-gray-700'
                          }`}
                        >
                          {field.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Campo de texto */}
                <input
                  type="text"
                  value={searchParams.term}
                  onChange={(e) => setSearchParams({ ...searchParams, term: e.target.value })}
                  placeholder="Pesquisar (mín. 3 caracteres)..."
                  className="flex-1 h-10 px-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />

                {/* Botão de busca/limpar */}
                {searchParams.term ? (
                  <button
                    onClick={() => setSearchParams({ ...searchParams, term: '' })}
                    className="h-10 px-3 bg-blue-500 hover:bg-blue-700 text-white rounded-r-lg transition-colors"
                    title="Limpar pesquisa"
                  >
                    <X className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    className="h-10 px-3 bg-blue-500 text-white rounded-r-lg cursor-default"
                    disabled
                  >
                    <Search className="w-5 h-5" />
                  </button>
                )}
              </div>
              {searchParams.term && searchParams.term.length < 3 && (
                <p className="text-xs text-blue-100 mt-1 ml-1">
                  Digite pelo menos 3 caracteres para pesquisar
                </p>
              )}
            </div>

            {/* Informações de Registros */}
            <div className="text-sm text-blue-100 self-start sm:self-auto">
              <span className="font-semibold text-white">{filteredComunicacoes.length}</span> de <span className="font-semibold text-white">{total}</span> comunicações
            </div>
          </div>
        </div>
      </header>

      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* Painel de Filtros Expansível */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="w-full max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Data Início
                </label>
                <input
                  type="date"
                  value={tempFilters.data_inicio || ''}
                  onChange={(e) => setTempFilters({ ...tempFilters, data_inicio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Data Fim
                </label>
                <input
                  type="date"
                  value={tempFilters.data_fim || ''}
                  onChange={(e) => setTempFilters({ ...tempFilters, data_fim: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Filter className="w-4 h-4 inline mr-1" />
                  Origem
                </label>
                <select
                  value={tempFilters.origem_tipo || ''}
                  onChange={(e) => setTempFilters({ ...tempFilters, origem_tipo: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">Todas</option>
                  <option value="CRS">CRS</option>
                  <option value="NHE">NHE</option>
                  <option value="CIEVS">CIEVS</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
              <button
                onClick={handleClearFilters}
                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Limpar Filtros
              </button>
              <button
                onClick={handleApplyFilters}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md font-medium"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="w-full max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
        {/* Status de Conexão */}
        <ConnectionStatus 
          showForceSync={true}
          className="mb-4"
        />
        
        {/* Alert de Erro */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start justify-between shadow-sm animate-fade-in">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <X className="w-5 h-5 text-red-500 mt-0.5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Estado de Carregamento */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0 left-0"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Carregando comunicações...</p>
          </div>
        ) : filteredComunicacoes.length === 0 ? (
          /* Estado Vazio */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-12 text-center">
            <div className="mx-auto w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhuma comunicação encontrada
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {Object.keys(filters).length > 0 || searchParams.term.length >= 3
                ? 'Não encontramos comunicações com os filtros ou pesquisa aplicados. Tente ajustar os critérios.'
                : 'Comece criando uma nova comunicação DAE para gerenciar doenças, agravos e eventos.'}
            </p>
            <button
              onClick={() => navigate('/private/comunicacao-dae/nova')}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nova Comunicação
            </button>
          </div>
        ) : (
          <>
            {isSelectionMode && (
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                <span className="text-sm font-medium text-blue-900">
                  {selectedCount === 0
                    ? 'Marque os itens ou use o quadrado no cabeçalho para selecionar todos desta página.'
                    : `${selectedCount} selecionado(s) nesta página`}
                </span>

                {selectedCount > 0 && (
                  <div className="flex flex-wrap items-center gap-2 ml-auto">
                    {selectedArquivaveisCount > 0 && (
                      <button
                        type="button"
                        onClick={handleBulkArquivar}
                        disabled={bulkActionLoading || !isOnline}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-slate-600 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {bulkActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                        Arquivar ({selectedArquivaveisCount})
                      </button>
                    )}
                    {selectedArquivadasCount > 0 && (
                      <button
                        type="button"
                        onClick={handleBulkDesarquivar}
                        disabled={bulkActionLoading || !isOnline}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {bulkActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArchiveRestore className="w-4 h-4" />}
                        Desarquivar ({selectedArquivadasCount})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleBulkDelete}
                      disabled={bulkActionLoading}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {bulkActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Excluir ({selectedCount})
                    </button>
                    <button
                      type="button"
                      onClick={clearSelection}
                      disabled={bulkActionLoading}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Limpar seleção
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tabela de Comunicações */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden md:overflow-visible">
              {/* Mobile: Cards */}
              <div className="block md:hidden divide-y divide-gray-100">
                {sortedComunicacoes.map((comunicacao) => {
                  const comunicacaoId = getComunicacaoId(comunicacao);
                  return (
                  <div
                    key={comunicacao.id_comunicacao}
                    role="button"
                    tabIndex={0}
                    title={isSelectionMode ? 'Clique para selecionar' : 'Clique para abrir a ficha'}
                    className={`p-4 cursor-pointer ${
                      selectedIds.has(comunicacaoId) ? 'ring-2 ring-inset ring-blue-400 bg-blue-50/80' : ''
                    } ${
                      isComunicacaoNaoLida(comunicacao)
                        ? 'bg-sky-50 border-l-4 border-l-blue-500 hover:bg-sky-100/80'
                        : 'hover:bg-blue-50/50'
                    }`}
                    onClick={() => handleRowActivation(comunicacaoId)}
                    onKeyDown={(e) => handleLinhaKeyDown(e, comunicacaoId)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {isSelectionMode && (
                        <div className="pt-1 shrink-0" onClick={pararPropagacaoAcao} onKeyDown={pararPropagacaoAcao}>
                          {renderSelectionCheckbox(comunicacaoId)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1 pointer-events-none">
                        <div className="flex items-center gap-2 mb-2">
                          {isComunicacaoNaoLida(comunicacao) && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" title="Não lida" />
                          )}
                          <span className={`text-sm font-bold text-blue-600 ${isComunicacaoNaoLida(comunicacao) ? 'font-extrabold' : ''}`}>
                            #{comunicacao.id_comunicacao}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${getOrigemBadgeColor(comunicacao.origem_tipo)}`}>
                            {comunicacao.origem_tipo}
                          </span>
                          {comunicacao.arquivada && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-200 text-gray-700">
                              Arquivada
                            </span>
                          )}
                        </div>

                        <p className={`text-sm truncate ${isComunicacaoNaoLida(comunicacao) ? 'font-bold text-gray-900' : 'font-semibold text-gray-900'}`}>
                          {comunicacao.nome_paciente || 'Não informado'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(comunicacao.data_comunicacao)}
                        </p>
                        <p className="text-xs text-gray-700 mt-2">
                          <span className="font-medium">DAE:</span> {formatComunicacaoDaeAgravoNomes(comunicacao)}
                        </p>
                        <p className="text-xs text-gray-700">
                          <span className="font-medium">Município:</span> {comunicacao.tipo_municipio?.descricao || '-'}
                        </p>

                        <span className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <FileText className="w-3 h-3 mr-1" />
                          {comunicacao.comunicacao_dae_anexo?.length || 0} anexo(s)
                        </span>
                      </div>

                      <div
                        className="flex flex-col gap-1 pointer-events-auto"
                        onClick={pararPropagacaoAcao}
                        onKeyDown={pararPropagacaoAcao}
                      >
                        <button
                          type="button"
                          onClick={() => handleVisualizar(Number(comunicacao.id_comunicacao))}
                          className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation cursor-pointer"
                          title="Visualizar"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {!comunicacao.arquivada && (
                          <button
                            type="button"
                            onClick={() => navigate(`/private/comunicacao-dae/editar/${comunicacao.id_comunicacao}`)}
                            className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors touch-manipulation cursor-pointer"
                            title="Editar"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                        )}
                        {comunicacao.arquivada ? (
                          <button
                            type="button"
                            onClick={() => handleDesarquivar(Number(comunicacao.id_comunicacao))}
                            className="p-2.5 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors touch-manipulation cursor-pointer"
                            title="Desarquivar"
                          >
                            <ArchiveRestore className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleArquivar(Number(comunicacao.id_comunicacao))}
                            className="p-2.5 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors touch-manipulation cursor-pointer"
                            title="Arquivar"
                          >
                            <Archive className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(Number(comunicacao.id_comunicacao))}
                          className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>

              {/* Desktop: Tabela com colunas redimensionáveis */}
              <div ref={tableContainerRef} className="hidden md:block w-full overflow-x-auto">
                <table
                  className="table-fixed divide-y divide-gray-200"
                  style={{ width: isSelectionMode ? totalWidth + 44 : totalWidth, minWidth: '100%' }}
                >
                  <colgroup>
                    {isSelectionMode && <col style={{ width: 44 }} />}
                    {DAE_TABLE_COLUMN_ORDER.map((colId) => (
                      <col key={colId} style={{ width: columnWidths[colId] }} />
                    ))}
                  </colgroup>
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      {isSelectionMode && (
                        <th className="w-11 px-2 py-3 text-center align-middle">
                          <input
                            ref={selectAllPageRef}
                            type="checkbox"
                            checked={allPageSelected}
                            onChange={handleToggleSelectAllPage}
                            aria-label="Selecionar todos desta página"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </th>
                      )}
                      {renderSortableHeader('id_comunicacao', 'Nº', 'id_comunicacao', { title: 'Nº Comunicação' })}
                      {renderSortableHeader('data_comunicacao', 'Data', 'data_comunicacao')}
                      {renderSortableHeader('semana_epidemiologica', 'SE', 'semana_epidemiologica', {
                        title: 'Semana epidemiológica',
                      })}
                      {renderSortableHeader('nome_paciente', 'Paciente', 'nome_paciente')}
                      {renderSortableHeader('origem_tipo', 'Origem', 'origem_tipo')}
                      {renderSortableHeader('unidade_notificadora', 'Unidade', 'unidade_notificadora', {
                        title: 'Unidade notificadora',
                      })}
                      {renderSortableHeader('dae', 'DAE', 'dae')}
                      {renderSortableHeader('municipio', 'Município', 'municipio')}
                      <th
                        style={{ width: columnWidths.anexos }}
                        className={`${thClass} relative`}
                        title="Anexos"
                      >
                        <span className="truncate block">Anex.</span>
                        {renderColumnResizeHandle('anexos')}
                      </th>
                      <th
                        style={{ width: columnWidths.acoes }}
                        className={`${thClass} relative text-center`}
                      >
                        <span className="block w-full text-center">Ações</span>
                        {renderColumnResizeHandle('acoes')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {sortedComunicacoes.map((comunicacao, index) => {
                      const daeNomes = formatComunicacaoDaeAgravoNomes(comunicacao);
                      const unidadeNome = comunicacao.origem?.nome || '-';
                      const municipioNome = comunicacao.tipo_municipio?.descricao || '-';
                      const se = calcularSemanaEpidemiologica(comunicacao.data_comunicacao);
                      const seLabel = se ? `SE ${se.semana.toString().padStart(2, '0')}/${se.ano}` : '-';
                      const comunicacaoId = getComunicacaoId(comunicacao);

                      return (
                      <tr 
                        key={comunicacao.id_comunicacao} 
                        className={getLinhaClasses(comunicacao, index)}
                        role="button"
                        tabIndex={0}
                        title={isSelectionMode ? 'Clique para selecionar' : 'Clique para abrir a ficha'}
                        onClick={() => handleRowActivation(comunicacaoId)}
                        onKeyDown={(e) => handleLinhaKeyDown(e, comunicacaoId)}
                      >
                        {isSelectionMode && (
                          <td
                            className="px-2 py-3 align-middle w-11"
                            onClick={pararPropagacaoAcao}
                            onKeyDown={pararPropagacaoAcao}
                          >
                            {renderSelectionCheckbox(comunicacaoId)}
                          </td>
                        )}
                        <td className={tdClass} style={{ width: columnWidths.id_comunicacao }}>
                          <div className="flex items-center gap-1 min-w-0">
                            {isComunicacaoNaoLida(comunicacao) && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" title="Não lida" />
                            )}
                            <span
                              className={`truncate font-bold text-blue-600 ${isComunicacaoNaoLida(comunicacao) ? 'font-extrabold' : ''}`}
                              title={`#${comunicacao.id_comunicacao}`}
                            >
                              #{comunicacao.id_comunicacao}
                            </span>
                          </div>
                        </td>
                        <td className={`${tdClass} text-gray-600`} style={{ width: columnWidths.data_comunicacao }} title={formatDate(comunicacao.data_comunicacao)}>
                          <span className="truncate block">{formatDate(comunicacao.data_comunicacao)}</span>
                        </td>
                        <td className={`${tdClass} text-gray-600`} style={{ width: columnWidths.semana_epidemiologica }} title={seLabel}>
                          <span className="truncate block">{seLabel}</span>
                        </td>
                        <td className={tdTruncate} style={{ width: columnWidths.nome_paciente }} title={comunicacao.nome_paciente}>
                          <span className={`truncate block text-gray-900 ${isComunicacaoNaoLida(comunicacao) ? 'font-bold' : 'font-medium'}`}>
                            {comunicacao.nome_paciente}
                          </span>
                        </td>
                        <td className={tdClass} style={{ width: columnWidths.origem_tipo }}>
                          <span
                            className={`inline-block max-w-full truncate px-1.5 py-0.5 text-[10px] lg:text-xs font-semibold rounded-full ${getOrigemBadgeColor(comunicacao.origem_tipo)}`}
                            title={comunicacao.origem_tipo}
                          >
                            {comunicacao.origem_tipo}
                          </span>
                        </td>
                        <td className={tdTruncate} style={{ width: columnWidths.unidade_notificadora }} title={unidadeNome}>
                          <span className="truncate block text-gray-700">{unidadeNome}</span>
                        </td>
                        <td className={tdTruncate} style={{ width: columnWidths.dae }} title={daeNomes}>
                          <span className="truncate block text-gray-600">{daeNomes}</span>
                        </td>
                        <td className={tdTruncate} style={{ width: columnWidths.municipio }} title={municipioNome}>
                          <span className="truncate block text-gray-600">{municipioNome}</span>
                        </td>
                        <td className={tdClass} style={{ width: columnWidths.anexos }}>
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] lg:text-xs font-medium bg-blue-100 text-blue-800"
                            title={`${comunicacao.comunicacao_dae_anexo?.length || 0} anexo(s)`}
                          >
                            <FileText className="w-3 h-3 mr-0.5 shrink-0" />
                            {comunicacao.comunicacao_dae_anexo?.length || 0}
                          </span>
                        </td>
                        <td
                          className={`${tdClass} text-center`}
                          style={{ width: columnWidths.acoes }}
                          onClick={pararPropagacaoAcao}
                          onKeyDown={pararPropagacaoAcao}
                        >
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleVisualizar(Number(comunicacao.id_comunicacao))}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Visualizar"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            {!comunicacao.arquivada && (
                              <button
                                type="button"
                                onClick={() => navigate(`/private/comunicacao-dae/editar/${comunicacao.id_comunicacao}`)}
                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Editar"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                            )}
                            {comunicacao.arquivada ? (
                              <button
                                type="button"
                                onClick={() => handleDesarquivar(Number(comunicacao.id_comunicacao))}
                                className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                                title="Desarquivar"
                              >
                                <ArchiveRestore className="w-5 h-5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleArquivar(Number(comunicacao.id_comunicacao))}
                                className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                                title="Arquivar"
                              >
                                <Archive className="w-5 h-5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDelete(Number(comunicacao.id_comunicacao))}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-5 h-5" />
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

            {/* Paginação e Controles */}
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Informações de Registros */}
                <div className="text-sm text-gray-600 text-center lg:text-left">
                  Mostrando <span className="font-semibold text-gray-900">{total > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}</span> a{' '}
                  <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, total)}</span> de{' '}
                  <span className="font-semibold text-gray-900">{total}</span> registros
                </div>

                {/* Controles de Paginação - Só mostra se houver múltiplas páginas */}
                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm font-medium"
                      title="Primeira página"
                    >
                      ««
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      Anterior
                    </button>
                    
                    {/* Indicador de Página */}
                    <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold text-sm shadow-sm">
                      Página {currentPage} de {totalPages}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      Próxima
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm font-medium"
                      title="Última página"
                    >
                      »»
                    </button>
                  </div>
                )}

                {/* Seletor de Itens por Página - SEMPRE VISÍVEL */}
                <div className="flex items-center justify-center gap-2 w-full lg:w-auto">
                  <label className="text-sm text-gray-600 font-medium whitespace-nowrap">Itens por página:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default ComunicacaoDaePage;
