import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ComunicacaoDae } from '@/services/ComunicacaoDaeService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  AreaChart,
  Area,
  Cell,
} from 'recharts';
import {
  FileText,
  Building2,
  Hospital,
  Activity,
  MapPin,
  ArrowLeft,
  RefreshCw,
  X,
  Calendar,
  Menu,
  Layers,
  Info,
  AlertCircle,
  Clock,
  Filter,
} from 'lucide-react';
import { SideMenu } from '@/features/home/components/SideMenu';
import ChartExportMenu from '@/components/common/ChartExportMenu';
import DashboardExportMenu from '@/components/common/DashboardExportMenu';
import MapaDashboardDAE, { LocalizacaoMapa, LocalizacaoTipo } from '@/features/dashboard/components/MapaDashboardDAE';
import { MapProviderProvider } from '@/features/maps/leaflet/contexts/MapProviderContext';
import { getThemeBrandHex } from '@/theme/palette';
import {
  formatDateTimePtBr,
} from '@/features/comunicacao-dae/utils/dashboardFormatters';
import {
  getOrigemTipoBadgeClass
} from '@/features/comunicacao-dae/utils/origemPresentation';
import { getMunicipioBandeiraPathBase } from '@/utils/municipioBandeiraPa';
import { useComunicacaoDaeDashboardData } from '@/features/comunicacao-dae/hooks/useComunicacaoDaeDashboardData';
import { useDashboardAutoRefresh } from '@/features/comunicacao-dae/hooks/useDashboardAutoRefresh';
import { useComunicacaoDaeDashboardFilters } from '@/features/comunicacao-dae/hooks/useComunicacaoDaeDashboardFilters';
import { useComunicacaoDaeDashboardCharts } from '@/features/comunicacao-dae/hooks/useComunicacaoDaeDashboardCharts';
import { ComunicacoesModal } from '@/features/comunicacao-dae/components/ComunicacoesModal';
import { ComunicacaoFichaModal } from '@/features/comunicacao-dae/components/ComunicacaoFichaModal';
import { LocalizacaoComunicacoesModal } from '@/features/comunicacao-dae/components/LocalizacaoComunicacoesModal';

const ComunicacaoDaeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {
    loading,
    comunicacoes,
    error,
    isRestrictedOriginView,
    crsList,
    nheList,
    cievsList,
    localizacoes,
    lastUpdate,
    visibilidade,
    setVisibilidade,
    loadAllData,
    loadLocalizacoes
  } = useComunicacaoDaeDashboardData();

  // Modal de comunicações
  const [showComunicacoesModal, setShowComunicacoesModal] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  
  // Estado para localizações do mapa
  const [selectedLocalizacao, setSelectedLocalizacao] = useState<LocalizacaoMapa | null>(null);
  const [showLocalizacaoModal, setShowLocalizacaoModal] = useState(false);
  
  // Estado para modal de visualização de ficha
  const [selectedComunicacao, setSelectedComunicacao] = useState<ComunicacaoDae | null>(null);
  const [showFichaModal, setShowFichaModal] = useState(false);
  const [fichaModalMode, setFichaModalMode] = useState<'view' | 'edit'>('view');

  const {
    activeFilters,
    dataInicio,
    setDataInicio,
    dataFim,
    setDataFim,
    horaInicio,
    setHoraInicio,
    horaFim,
    setHoraFim,
    clearAllFilters,
    activeFiltersCount,
    comunicacoesFiltradas,
    dadosFiltrados,
    isFilterActive,
    getCellColor,
    toggleFilter
  } = useComunicacaoDaeDashboardFilters(comunicacoes);

  // Auto-atualização
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );
  const ctrlPressedRef = useRef(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const scrollPositionRef = useRef<number>(0);

  // Listeners para rastrear Ctrl/Cmd para seleção múltipla
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        ctrlPressedRef.current = true;
        setIsCtrlPressed(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        ctrlPressedRef.current = false;
        setIsCtrlPressed(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Detectar largura da tela para ajustes finos de gráficos no mobile
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isMobileViewport = viewportWidth < 640;

  const refreshDashboardData = useCallback(() => {
    scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
    loadAllData();
  }, [loadAllData]);
  const {
    autoRefreshEnabled,
    autoRefreshCountdown,
    toggleAutoRefresh
  } = useDashboardAutoRefresh(refreshDashboardData, {
    intervalSeconds: 60,
    enabledByDefault: true
  });

  // Restaurar posição do scroll após atualização dos dados
  useEffect(() => {
    if (!loading && scrollPositionRef.current > 0) {
      window.scrollTo(0, scrollPositionRef.current);
    }
  }, [loading, comunicacoes]);

  const {
    stats,
    visibleOrigemCards,
    dadosSerieTemporalData,
    dadosSemanaEpidemiologica,
    dadosMunicipios,
    dadosMunicipiosResidencia,
    dadosDae,
    dadosCrs,
    dadosNhe,
    dadosCievs,
  } = useComunicacaoDaeDashboardCharts({
    comunicacoes,
    comunicacoesFiltradas,
    dadosFiltrados,
    activeFilters,
    isRestrictedOriginView,
    crsList,
    nheList,
    cievsList,
  });

  const summaryCardSpanClass = useMemo(() => {
    const totalCards = 1 + visibleOrigemCards.length; // +1 = card "Total"
    if (totalCards === 2) {
      return 'sm:col-span-2 lg:col-span-4 xl:col-span-4';
    }
    return 'sm:col-span-2 lg:col-span-2 xl:col-span-2';
  }, [visibleOrigemCards]);

  // 🗺️ Atualizar localizações do mapa sempre que os filtros ou dados mudarem
  useEffect(() => {
    if (comunicacoes.length > 0 && !loading && !isRestrictedOriginView) {
      // Recalcular localizações com base nas comunicações filtradas
      loadLocalizacoes(comunicacoes, dadosFiltrados);
    }
  }, [comunicacoes, dadosFiltrados, loading, loadLocalizacoes, isRestrictedOriginView]);

  // Verificar se há filtros ativos
  const hasActiveFilters = 
    Object.values(activeFilters).some(f => f !== null) || 
    dataInicio || 
    dataFim || 
    horaInicio || 
    horaFim;

  // Funções para clique em cards
  const handleCardClick = (tipo: string) => {
    if (tipo === 'all') {
      setShowComunicacoesModal(true);
    } else {
      toggleFilter('origem_tipo', tipo);
    }
  };

  const handleOpenComunicacaoView = useCallback((com: ComunicacaoDae) => {
    setSelectedComunicacao(com);
    setFichaModalMode('view');
    setShowFichaModal(true);
  }, []);

  const handleOpenComunicacaoEdit = useCallback((com: ComunicacaoDae) => {
    setSelectedComunicacao(com);
    setFichaModalMode('edit');
    setShowFichaModal(true);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleCloseComunicacoesModal = useCallback(() => {
    setShowComunicacoesModal(false);
  }, []);

  const handleOpenLocalizacaoModal = useCallback((loc: LocalizacaoMapa) => {
    setSelectedLocalizacao(loc);
    setShowLocalizacaoModal(true);
  }, []);

  const handleCloseLocalizacaoModal = useCallback(() => {
    setShowLocalizacaoModal(false);
  }, []);

  const handleCloseFichaModal = useCallback(() => {
    setShowFichaModal(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ComunicacoesModal
        isOpen={showComunicacoesModal}
        comunicacoes={dadosFiltrados}
        modalSearchTerm={modalSearchTerm}
        onSearchTermChange={setModalSearchTerm}
        onClose={handleCloseComunicacoesModal}
        onOpenView={handleOpenComunicacaoView}
        onOpenEdit={handleOpenComunicacaoEdit}
      />

      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl sticky top-0 z-40">
        <div className="w-full max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">Dashboard - Comunicação DAE</h1>
                <p className="text-xs sm:text-sm text-blue-100 truncate">Análise Completa de Doenças, Agravos e Eventos</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end lg:items-center gap-2 sm:gap-3 w-full lg:w-auto">
              {/* Timestamp e Contador */}
              <div className="flex items-center gap-2 bg-white/10 p-2 rounded text-white text-xs sm:text-sm w-full sm:w-auto" data-export-menu>
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Última atualização: {lastUpdate}</span>
                {autoRefreshEnabled && (
                  <span className="ml-2 text-yellow-200 whitespace-nowrap">
                    Próxima em: {autoRefreshCountdown}s
                  </span>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-wrap justify-end gap-2" data-export-menu>
                <div
                  className="inline-flex rounded-lg overflow-hidden border border-white/30 bg-white/10"
                  role="group"
                  aria-label="Filtrar por arquivamento"
                >
                  {(
                    [
                      { value: 'ativas' as const, label: 'Ativas' },
                      { value: 'todas' as const, label: 'Ativas + arquivadas' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setVisibilidade(opt.value)}
                      className={`px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
                        visibilidade === opt.value
                          ? 'bg-white text-blue-700'
                          : 'text-white hover:bg-white/20'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={refreshDashboardData}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 text-xs sm:text-sm"
                >
                  <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Atualizar</span>
                </button>

                <button
                  onClick={toggleAutoRefresh}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-xs sm:text-sm whitespace-nowrap ${
                    autoRefreshEnabled 
                      ? "bg-yellow-500 text-white hover:bg-yellow-600" 
                      : "bg-gray-400 text-white hover:bg-gray-500"
                  }`}
                >
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">
                    {autoRefreshEnabled ? "Auto ON" : "Auto OFF"}
                  </span>
                </button>

                <DashboardExportMenu
                  municipioData={dadosMunicipiosResidencia}
                  totalRecords={stats.total}
                  activeFilters={{
                    ...activeFilters,
                    dataInicio,
                    dataFim,
                    horaInicio,
                    horaFim
                  }}
                  title="Dashboard de Comunicação DAE"
                  buttonVariant="button"
                  crsData={dadosCrs}
                  nheData={dadosNhe}
                  cievsData={dadosCievs}
                  daeData={dadosDae}
                  serieTemporalData={dadosSerieTemporalData.map(d => ({
                    name: d.date,
                    value: d.total,
                    fill: getThemeBrandHex()
                  }))}
                />

                <button
                  onClick={() => navigate('/private/comunicacao-dae')}
                  className="flex items-center gap-2 px-3 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs sm:text-sm"
                >
                  <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Voltar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <SideMenu isOpen={isMenuOpen} onClose={handleCloseMenu} />

      {/* Indicador de seleção múltipla ativa */}
      {isCtrlPressed && (
        <div className="hidden md:flex fixed top-20 right-4 z-40 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg items-center gap-2 animate-in slide-in-from-top duration-200">
          <span className="font-semibold">Modo de Seleção Múltipla Ativo</span>
          <span className="text-xs bg-white/20 px-2 py-1 rounded">Ctrl pressionado</span>
        </div>
      )}

      {/* Container Principal */}
      <main className="w-full max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6" data-dashboard="main">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button onClick={() => setError(null)}>
              <X className="w-5 h-5 text-red-500" />
            </button>
          </div>
        )}

        {/* Indicador de filtros ativos e botão de limpar */}
        {activeFiltersCount > 0 && (
          <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  {activeFiltersCount} filtro(s) ativo(s)
                </p>
                <p className="text-xs text-blue-700">
                  Use Ctrl+Click para selecionar múltiplos itens
                </p>
              </div>
            </div>
            <button
              onClick={clearAllFilters}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors text-sm w-full sm:w-auto"
            >
              <X className="w-4 h-4" />
              Limpar Filtros
            </button>
          </div>
        )}

        {/* Grid de 8 colunas - Layout Power BI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          
          {/* LINHA 1: Filtros de Data e Horário - 8 colunas */}
          <div className="bg-gradient-to-r from-indigo-500 to-blue-600 p-4 rounded-lg shadow-lg text-white sm:col-span-2 lg:col-span-4 xl:col-span-8">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5" />
              <h3 className="text-sm font-semibold">Filtros de Período e Horário</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-blue-100 mb-1">Data Início</label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs text-blue-100 mb-1">Data Fim</label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs text-blue-100 mb-1">Hora Início</label>
                <input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs text-blue-100 mb-1">Hora Fim</label>
                <input
                  type="time"
                  value={horaFim}
                  onChange={(e) => setHoraFim(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            {(dataInicio || dataFim || horaInicio || horaFim) && (
              <button
                onClick={() => { setDataInicio(''); setDataFim(''); setHoraInicio(''); setHoraFim(''); }}
                className="mt-2 text-xs text-blue-100 hover:text-white underline"
              >
                Limpar filtros de período
              </button>
            )}
          </div>

          {/* LINHA 2: Cards de Resumo - layout adaptável por perfil de acesso */}
          
          {/* Total de Comunicações - 2 colunas */}
          <div
            className={`bg-gradient-to-br from-blue-500 to-blue-700 p-4 rounded-lg shadow-lg flex items-center gap-3 text-white ${summaryCardSpanClass} cursor-pointer hover:shadow-xl hover:from-blue-600 hover:to-blue-800 transition-all`}
            onClick={() => handleCardClick('all')}
            title="Clique para ver todas as comunicações"
          >
            <div className="p-3 bg-white bg-opacity-20 rounded-full flex-shrink-0">
              <FileText className="h-8 w-8" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs text-blue-100 uppercase tracking-wide">Total de Comunicações</h3>
              <p className="text-3xl sm:text-4xl font-bold">
                {stats.total.toLocaleString()}
              </p>
              <p className="text-xs text-blue-200 mt-1">
                👆 Clique para ver a lista
              </p>
            </div>
          </div>

          {visibleOrigemCards.includes('CRS') && (
            <div 
              className={`p-4 rounded-lg shadow-lg flex items-center gap-3 text-white ${summaryCardSpanClass} cursor-pointer hover:shadow-xl transition-all`}
              onClick={(e) => toggleFilter('origem_tipo', 'CRS', e.ctrlKey || e.metaKey)}
              style={{ 
                background: isFilterActive('CRS', activeFilters.origem_tipo)
                  ? 'linear-gradient(to bottom right, #67e8f9, #22d3ee)' 
                  : 'linear-gradient(to bottom right, #06b6d4, #0891b2)',
                minHeight: '100px',
                border: isFilterActive('CRS', activeFilters.origem_tipo) ? '3px solid #0891b2' : 'none'
              }}
            >
              <div className="p-3 bg-white bg-opacity-20 rounded-full flex-shrink-0">
                <Building2 className="h-8 w-8" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs uppercase tracking-wide opacity-90">
                  CRS {isFilterActive('CRS', activeFilters.origem_tipo) && '✓'}
                </h3>
                <p className="text-3xl sm:text-4xl font-bold">
                  {stats.crs.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {visibleOrigemCards.includes('NHE') && (
            <div 
              className={`p-4 rounded-lg shadow-lg flex items-center gap-3 text-white ${summaryCardSpanClass} cursor-pointer hover:shadow-xl transition-all`}
              onClick={(e) => toggleFilter('origem_tipo', 'NHE', e.ctrlKey || e.metaKey)}
              style={{ 
                background: isFilterActive('NHE', activeFilters.origem_tipo)
                  ? 'linear-gradient(to bottom right, #6ee7b7, #34d399)' 
                  : 'linear-gradient(to bottom right, #10b981, #059669)', 
                minHeight: '100px',
                border: isFilterActive('NHE', activeFilters.origem_tipo) ? '3px solid #059669' : 'none'
              }}
            >
              <div className="p-3 bg-white bg-opacity-20 rounded-full flex-shrink-0">
                <Hospital className="h-8 w-8" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs uppercase tracking-wide opacity-90">
                  NHE {isFilterActive('NHE', activeFilters.origem_tipo) && '✓'}
                </h3>
                <p className="text-3xl sm:text-4xl font-bold">
                  {stats.nhe.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {visibleOrigemCards.includes('CIEVS') && (
            <div 
              className={`p-4 rounded-lg shadow-lg flex items-center gap-3 text-white ${summaryCardSpanClass} cursor-pointer hover:shadow-xl transition-all`}
              onClick={(e) => toggleFilter('origem_tipo', 'CIEVS', e.ctrlKey || e.metaKey)}
              style={{ 
                background: isFilterActive('CIEVS', activeFilters.origem_tipo)
                  ? 'linear-gradient(to bottom right, #c4b5fd, #a78bfa)' 
                  : 'linear-gradient(to bottom right, #8b5cf6, #7c3aed)', 
                minHeight: '100px',
                border: isFilterActive('CIEVS', activeFilters.origem_tipo) ? '3px solid #7c3aed' : 'none'
              }}
            >
              <div className="p-3 bg-white bg-opacity-20 rounded-full flex-shrink-0">
                <Activity className="h-8 w-8" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs uppercase tracking-wide opacity-90">
                  CIEVS {isFilterActive('CIEVS', activeFilters.origem_tipo) && '✓'}
                </h3>
                <p className="text-3xl sm:text-4xl font-bold">
                  {stats.cievs.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Indicador de Filtros Ativos */}
          {hasActiveFilters && (
            <div className="bg-blue-50 p-3 rounded-lg shadow-sm border-l-4 border-blue-500 sm:col-span-2 lg:col-span-4 xl:col-span-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-blue-800">
                    Dashboard com Filtros Ativos - Dados Interconectados
                  </h3>
                </div>
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  <X className="w-4 h-4" />
                  Limpar Todos os Filtros
                </button>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Clique em qualquer gráfico para adicionar/remover filtros.
              </p>
            </div>
          )}

          {/* LINHA 4: Série Temporal - 8 colunas */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm sm:col-span-2 lg:col-span-4 xl:col-span-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Série Temporal por Dia</h3>
                  <p className="text-sm text-gray-600">Evolução diária do número de comunicações (últimos 30 dias)</p>
                </div>
              </div>
              <ChartExportMenu
                chartId="chart-serie-temporal"
                chartData={dadosSerieTemporalData.map(d => ({
                  name: d.date,
                  value: d.total,
                  fill: getThemeBrandHex()
                }))}
                chartTitle="Série Temporal - Comunicações DAE"
                buttonVariant="icon"
              />
            </div>
            {dadosSerieTemporalData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-80 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-gray-500 text-lg font-medium mb-2">Nenhuma comunicação encontrada</p>
                <p className="text-gray-400 text-sm text-center max-w-md">
                  Não há comunicações cadastradas no sistema ou nenhuma corresponde aos filtros selecionados
                </p>
              </div>
            ) : (
              <div className="h-80" id="chart-serie-temporal">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dadosSerieTemporalData} margin={{ top: 30, right: 30, left: 20, bottom: 50 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={getThemeBrandHex()} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={getThemeBrandHex()} stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280" 
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis 
                      stroke="#6b7280" 
                      fontSize={12}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                      labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
                      formatter={(value: any, name: any, props: any) => {
                        const payload = props.payload;
                        const crs = payload.CRS || 0;
                        const nhe = payload.NHE || 0;
                        const cievs = payload.CIEVS || 0;
                        const total = payload.total || 0;
                        
                        if (name === 'total') {
                          const crsPercent = total > 0 ? ((crs / total) * 100).toFixed(1) : '0';
                          const nhePercent = total > 0 ? ((nhe / total) * 100).toFixed(1) : '0';
                          const cievsPercent = total > 0 ? ((cievs / total) * 100).toFixed(1) : '0';
                          
                          return [
                            `${total} comunicações\n\nCRS: ${crs} (${crsPercent}%)\nNHE: ${nhe} (${nhePercent}%)\nCIEVS: ${cievs} (${cievsPercent}%)`,
                            'Total'
                          ];
                        }
                        return [value, name];
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke={getThemeBrandHex()}
                      strokeWidth={2}
                      fill="url(#colorTotal)"
                      animationDuration={800}
                    >
                      <LabelList
                        dataKey="total"
                        position="top"
                        style={{ fill: getThemeBrandHex(), fontWeight: 'bold', fontSize: 12 }}
                      />
                    </Area>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Casos por Semana Epidemiológica */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm sm:col-span-2 lg:col-span-4 xl:col-span-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 text-teal-700 rounded-lg">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Casos por Semana Epidemiológica</h3>
                  <p className="text-sm text-gray-600">Clique nas barras para filtrar por semana epidemiológica</p>
                </div>
              </div>
              <ChartExportMenu
                chartId="chart-semana-epidemiologica"
                chartData={dadosSemanaEpidemiologica}
                chartTitle="Casos por Semana Epidemiológica"
                buttonVariant="icon"
              />
            </div>
            {dadosSemanaEpidemiologica.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-80 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-gray-500 text-lg font-medium mb-2">Nenhuma comunicação encontrada</p>
                <p className="text-gray-400 text-sm text-center max-w-md">
                  Não há comunicações cadastradas ou nenhuma corresponde aos filtros selecionados
                </p>
              </div>
            ) : (
              <div className="h-[480px]" id="chart-semana-epidemiologica">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosSemanaEpidemiologica} margin={{ top: 30, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      stroke="#6b7280"
                      fontSize={11}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                      label={{ value: 'Semana Epidemiológica', position: 'insideBottom', offset: -10, style: { fill: '#6b7280', fontSize: 12 } }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      fontSize={12}
                      allowDecimals={false}
                      label={{ value: 'Casos', angle: -90, position: 'insideLeft', offset: -5, style: { fill: '#6b7280', fontSize: 12 } }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '12px',
                      }}
                      formatter={(value: number, _name: string, props: any) => [
                        `${value} comunicação${value !== 1 ? 'ões' : ''}`,
                        `${props.payload.name} / ${props.payload.ano}`,
                      ]}
                    />
                    <Bar
                      dataKey="value"
                      cursor="pointer"
                      onClick={(data) =>
                        data?.id && toggleFilter('semana_epidemiologica', data.id, ctrlPressedRef.current)
                      }
                      radius={[4, 4, 0, 0]}
                      animationDuration={800}
                    >
                      {dadosSemanaEpidemiologica.map((entry, index) => (
                        <Cell
                          key={`se-cell-${index}`}
                          fill={getCellColor(entry.id, activeFilters.semana_epidemiologica, '#5eafc6')}
                          stroke={isFilterActive(entry.id, activeFilters.semana_epidemiologica) ? '#000' : 'none'}
                          strokeWidth={isFilterActive(entry.id, activeFilters.semana_epidemiologica) ? 2 : 0}
                        />
                      ))}
                      <LabelList
                        dataKey="value"
                        position="top"
                        style={{ fill: '#1e6f8c', fontWeight: 700, fontSize: 12 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {!isRestrictedOriginView && (
          <>
          {/* LINHA 5: Gráficos CRS, NHE e CIEVS - 8 colunas divididas em 3 */}
          
          {/* Gráfico de CRS */}
          <div className="bg-white p-4 rounded-lg shadow-sm sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Building2 className="h-4 w-4" style={{ color: '#06b6d4' }} />
                Todos os CRS ({dadosCrs.length})
              </h3>
              <ChartExportMenu
                chartId="chart-crs"
                chartData={dadosCrs}
                chartTitle="CRS - Centros Regionais de Saúde"
                buttonVariant="minimal"
              />
            </div>
            {dadosCrs.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                <p className="text-xs">Nenhum dado disponível</p>
              </div>
            ) : (
              <>
                <div id="chart-crs">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dadosCrs.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" style={{ fontSize: '10px' }} allowDecimals={false} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={80}
                      stroke="#6b7280" 
                      style={{ fontSize: '9px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '11px'
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[0, 4, 4, 0]}
                      onClick={(data) => data && toggleFilter('origem_id', data.id, ctrlPressedRef.current)}
                      cursor="pointer"
                    >
                      {dadosCrs.slice(0, 10).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={getCellColor(entry.id, activeFilters.origem_id, '#06b6d4')}
                          stroke={isFilterActive(entry.id, activeFilters.origem_id) ? "#000" : "none"}
                          strokeWidth={isFilterActive(entry.id, activeFilters.origem_id) ? 2 : 0}
                        />
                      ))}
                      <LabelList dataKey="value" position="right" style={{ fontSize: '10px', fill: '#374151', fontWeight: 'bold' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                </div>

                {/* Lista detalhada */}
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-gray-900 mb-2">Todos os CRS</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {dadosCrs.map((item, index) => {
                      const total = dadosCrs.reduce((sum, i) => sum + i.value, 0);
                      const percentual = total > 0 ? Math.round((item.value / total) * 100) : 0;
                      const isFiltered = isFilterActive(item.id, activeFilters.origem_id);
                      return (
                        <div 
                          key={index} 
                          className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all duration-200 ${
                            isFiltered 
                              ? 'bg-cyan-100 border-2 border-cyan-400' 
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          onClick={(e) => toggleFilter('origem_id', item.id, e.ctrlKey || e.metaKey)}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded"
                              style={{ 
                                backgroundColor: '#06b6d4',
                                border: isFiltered ? '2px solid #0891b2' : 'none'
                              }}
                            />
                            <div className="w-6 h-6 bg-cyan-100 rounded-full flex items-center justify-center">
                              <span className="text-cyan-600 font-bold text-[10px]">{index + 1}</span>
                            </div>
                            <span className="font-medium text-[11px]">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900 text-xs">{item.value}</div>
                            <div className="text-[10px] text-gray-600">{percentual}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Gráfico de NHE */}
          <div className="bg-white p-4 rounded-lg shadow-sm sm:col-span-2 lg:col-span-3 xl:col-span-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Hospital className="h-4 w-4" style={{ color: '#10b981' }} />
                Top 10 NHE ({dadosNhe.length} total)
              </h3>
              <ChartExportMenu
                chartId="chart-nhe"
                chartData={dadosNhe}
                chartTitle="NHE - Núcleos Hospitalares de Epidemiologia"
                buttonVariant="minimal"
              />
            </div>
            {dadosNhe.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                <p className="text-xs">Nenhum dado disponível</p>
              </div>
            ) : (
              <>
                <div id="chart-nhe">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dadosNhe.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" stroke="#6b7280" style={{ fontSize: '10px' }} allowDecimals={false} />
                      <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={80}
                      stroke="#6b7280" 
                      style={{ fontSize: '9px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '11px'
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[0, 4, 4, 0]}
                      onClick={(data) => data && toggleFilter('origem_id', data.id, ctrlPressedRef.current)}
                      cursor="pointer"
                    >
                      {dadosNhe.slice(0, 10).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={getCellColor(entry.id, activeFilters.origem_id, '#10b981')}
                          stroke={isFilterActive(entry.id, activeFilters.origem_id) ? "#000" : "none"}
                          strokeWidth={isFilterActive(entry.id, activeFilters.origem_id) ? 2 : 0}
                        />
                      ))}
                      <LabelList dataKey="value" position="right" style={{ fontSize: '10px', fill: '#374151', fontWeight: 'bold' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                </div>

                {/* Lista detalhada */}
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-gray-900 mb-2">Todos os NHE</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {dadosNhe.map((item, index) => {
                      const total = dadosNhe.reduce((sum, i) => sum + i.value, 0);
                      const percentual = total > 0 ? Math.round((item.value / total) * 100) : 0;
                      const isFiltered = isFilterActive(item.id, activeFilters.origem_id);
                      return (
                        <div 
                          key={index} 
                          className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all duration-200 ${
                            isFiltered 
                              ? 'bg-green-100 border-2 border-green-400' 
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          onClick={(e) => toggleFilter('origem_id', item.id, e.ctrlKey || e.metaKey)}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded"
                              style={{ 
                                backgroundColor: '#10b981',
                                border: isFiltered ? '2px solid #059669' : 'none'
                              }}
                            />
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-600 font-bold text-[10px]">{index + 1}</span>
                            </div>
                            <span className="font-medium text-[11px]">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900 text-xs">{item.value}</div>
                            <div className="text-[10px] text-gray-600">{percentual}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Gráfico de CIEVS */}
          <div className="bg-white p-4 rounded-lg shadow-sm sm:col-span-2 lg:col-span-3 xl:col-span-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Activity className="h-4 w-4" style={{ color: '#8b5cf6' }} />
                Todos os CIEVS ({dadosCievs.length})
              </h3>
              <ChartExportMenu
                chartId="chart-cievs"
                chartData={dadosCievs}
                chartTitle="CIEVS - Centros de Informações Estratégicas em Vigilância em Saúde"
                buttonVariant="minimal"
              />
            </div>
            {dadosCievs.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                <p className="text-xs">Nenhum dado disponível</p>
              </div>
            ) : (
              <>
                <div id="chart-cievs">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dadosCievs.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" stroke="#6b7280" style={{ fontSize: '10px' }} allowDecimals={false} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={80}
                        stroke="#6b7280" 
                        style={{ fontSize: '9px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '11px'
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[0, 4, 4, 0]}
                      onClick={(data) => data && toggleFilter('origem_id', data.id, ctrlPressedRef.current)}
                      cursor="pointer"
                    >
                      {dadosCievs.slice(0, 10).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={getCellColor(entry.id, activeFilters.origem_id, '#8b5cf6')}
                          stroke={isFilterActive(entry.id, activeFilters.origem_id) ? "#000" : "none"}
                          strokeWidth={isFilterActive(entry.id, activeFilters.origem_id) ? 2 : 0}
                        />
                      ))}
                      <LabelList dataKey="value" position="right" style={{ fontSize: '10px', fill: '#374151', fontWeight: 'bold' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                </div>

                {/* Lista detalhada */}
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-gray-900 mb-2">Todos os CIEVS</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {dadosCievs.map((item, index) => {
                      const total = dadosCievs.reduce((sum, i) => sum + i.value, 0);
                      const percentual = total > 0 ? Math.round((item.value / total) * 100) : 0;
                      const isFiltered = isFilterActive(item.id, activeFilters.origem_id);
                      return (
                        <div 
                          key={index} 
                          className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all duration-200 ${
                            isFiltered 
                              ? 'bg-purple-100 border-2 border-purple-400' 
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          onClick={(e) => toggleFilter('origem_id', item.id, e.ctrlKey || e.metaKey)}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded"
                              style={{ 
                                backgroundColor: '#8b5cf6',
                                border: isFiltered ? '2px solid #7c3aed' : 'none'
                              }}
                            />
                            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-purple-600 font-bold text-[10px]">{index + 1}</span>
                            </div>
                            <span className="font-medium text-[11px]">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900 text-xs">{item.value}</div>
                            <div className="text-[10px] text-gray-600">{percentual}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
          </>
          )}

          {/* LINHA 6: Municípios e DAE - 4+4 colunas */}
          
          {/* Gráfico de Municípios de Ocorrência - 4 colunas */}
          <div className="bg-white p-4 rounded-lg shadow-sm sm:col-span-2 lg:col-span-4 xl:col-span-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-800">Municípios de Ocorrência</h3>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  {dadosMunicipios.length} {dadosMunicipios.length === 1 ? 'município' : 'municípios'}
                </span>
              </div>
              <ChartExportMenu
                chartId="chart-municipios"
                chartData={dadosMunicipios}
                chartTitle="Municípios de Ocorrência - Distribuição Geográfica"
                buttonVariant="icon"
              />
            </div>

            {dadosMunicipios.length === 0 ? (
              <div className="flex items-center justify-center h-[320px] text-gray-500">
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhum dado de município disponível</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Gráfico de Barras - Top 10 */}
                <div className="xl:col-span-2">
                  <div className="mb-4">
                    <h4 className="text-lg font-medium text-gray-700 mb-2">Top 10 Municípios</h4>
                    <p className="text-sm text-gray-500">Clique nas barras para filtrar por município</p>
                  </div>
                  
                  <div id="chart-municipios">
                    <ResponsiveContainer width="100%" height={440}>
                    <BarChart data={dadosMunicipios.slice(0, 10)} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        fontSize={11}
                        interval={0}
                      />
                      <YAxis fontSize={12} allowDecimals={false} />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0];
                            return (
                              <div className="bg-white p-4 border rounded-lg shadow-lg min-w-48">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-6 h-6 rounded border border-gray-200 bg-blue-100 flex items-center justify-center">
                                    <MapPin className="h-3 w-3 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-800">{label}</p>
                                  </div>
                                </div>
                                <p className="text-blue-600">
                                  <span className="font-bold">{data.value}</span> {data.value === 1 ? 'comunicação' : 'comunicações'}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        cursor="pointer"
                        onClick={(data) => data && toggleFilter('municipio_id', data.id, ctrlPressedRef.current)}
                        radius={[4, 4, 0, 0]}
                      >
                        {dadosMunicipios.slice(0, 10).map((entry, index) => {
                          const colors = [
                            "#1976D2", "#1E88E5", "#2196F3", "#42A5F5", "#64B5F6",
                            "#81C784", "#66BB6A", "#4CAF50", "#43A047", "#388E3C"
                          ];
                          const baseColor = colors[index % colors.length];
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={getCellColor(entry.id, activeFilters.municipio_id, baseColor)}
                              stroke={isFilterActive(entry.id, activeFilters.municipio_id) ? "#000" : "none"}
                              strokeWidth={isFilterActive(entry.id, activeFilters.municipio_id) ? 3 : 0}
                            />
                          );
                        })}
                        <LabelList 
                          dataKey="value" 
                          position="top" 
                          style={{ 
                            fontSize: '14px', 
                            fontWeight: 'bold',
                            fill: '#374151'
                          }}
                          formatter={(value: number) => value.toLocaleString()}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  </div>
                </div>

                {/* Tabela Completa - Todos os Municípios com Bandeiras */}
                <div className="xl:col-span-1">
                  <div className="mb-4">
                    <h4 className="text-lg font-medium text-gray-700 mb-2">Todos os Municípios</h4>
                    <p className="text-sm text-gray-500">Clique para filtrar</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 min-h-[260px] max-h-[320px] overflow-y-auto">
                    <div className="space-y-2">
                      {dadosMunicipios.map((item, index) => {
                        const isActive = isFilterActive(item.id, activeFilters.municipio_id);
                        const colors = [
                          "#1976D2", "#2196F3", "#4CAF50", "#FF9800", "#9C27B0", 
                          "#F44336", "#00BCD4", "#CDDC39", "#FF5722", "#795548"
                        ];
                        const itemColor = colors[index % colors.length];
                        const bandeiraPattern = getMunicipioBandeiraPathBase(item.name);
                        
                        return (
                          <div
                            key={index}
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                              isActive 
                                ? 'bg-blue-100 border border-blue-300 shadow-sm' 
                                : 'bg-white hover:bg-gray-100 border border-transparent hover:shadow-sm'
                            }`}
                            onClick={(e) => toggleFilter('municipio_id', item.id, e.ctrlKey || e.metaKey)}
                            title={`Clique para filtrar por ${item.name}`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {/* Bandeira do município */}
                              <img 
                                src={`${bandeiraPattern}.jpg`}
                                alt={`Bandeira de ${item.name}`}
                                className="w-10 h-7 object-cover rounded shadow-sm border border-gray-200"
                                onError={(e) => {
                                  // Tentar PNG se JPG falhar
                                  const target = e.currentTarget;
                                  if (target.src.endsWith('.jpg')) {
                                    target.src = `${bandeiraPattern}.png`;
                                  } else {
                                    // Se ambos falharem, esconder
                                    target.style.display = 'none';
                                  }
                                }}
                              />
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded border border-gray-200 flex items-center justify-center"
                                  style={{ backgroundColor: itemColor + '20' }}
                                >
                                  <div 
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: itemColor }}
                                  ></div>
                                </div>
                                <span className={`font-medium text-sm ${isActive ? 'text-blue-800' : 'text-gray-700'}`}>
                                  {item.name}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-semibold ${isActive ? 'text-blue-700' : 'text-gray-600'}`}>
                                {item.value}
                              </span>
                              {isActive && <span className="text-blue-500 text-xs">●</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Gráfico de DAE (Agravos) - 4 colunas - Estilo Dashboard Círio */}
          <div className="bg-white p-6 rounded-lg shadow-sm sm:col-span-2 lg:col-span-4 xl:col-span-4 xl:row-span-2 h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-teal-600" />
                <h3 className="text-lg font-semibold text-gray-800">DAE - Doenças, Agravos e Eventos</h3>
                <span className="bg-teal-100 text-teal-800 text-sm font-medium px-3 py-1 rounded-full">
                  {dadosDae.length} {dadosDae.length === 1 ? 'agravo' : 'agravos'}
                </span>
              </div>
              <ChartExportMenu
                chartId="chart-dae"
                chartData={dadosDae}
                chartTitle="DAE - Doenças, Agravos e Eventos"
                buttonVariant="icon"
              />
            </div>

            {dadosDae.length === 0 ? (
              <div className="flex items-center justify-center h-[400px] text-gray-500">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhum dado de DAE disponível</p>
                </div>
              </div>
            ) : (
              <>
                {/* Gráfico de Barras - Top 15 */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Top 15 DAE por Comunicações</h4>
                  <p className="text-xs text-gray-500 mb-3">Clique nas barras para filtrar por agravo específico</p>
                </div>
                
                <div className="h-96" id="chart-dae">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dadosDae.slice(0, 15)}
                      layout="vertical"
                      margin={
                        isMobileViewport
                          ? { top: 5, right: 12, left: 0, bottom: 5 }
                          : { top: 5, right: 100, left: 10, bottom: 5 }
                      }
                      barCategoryGap="15%"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        type="number" 
                        stroke="#666" 
                        allowDecimals={false}
                        fontSize={12}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#666"
                        width={isMobileViewport ? 120 : 200}
                        interval={0}
                        tick={{ fontSize: isMobileViewport ? 10 : 11 }}
                        tickFormatter={(value: string) =>
                          isMobileViewport && value?.length > 24
                            ? `${value.slice(0, 22)}...`
                            : value
                        }
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #ddd",
                          borderRadius: "8px",
                          padding: "12px"
                        }}
                        formatter={(value: any) => [
                          value.toLocaleString(),
                          "Comunicações",
                        ]}
                      />
                      <Bar
                        dataKey="value"
                        onClick={(data) => data && toggleFilter('dae_id', data.id, ctrlPressedRef.current)}
                        cursor="pointer"
                        radius={[0, 4, 4, 0]}
                      >
                        {dadosDae.slice(0, 15).map((entry, index) => {
                          // Gradiente de cores teal
                          const colors = [
                            '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4',
                            '#0891b2', '#06b6d4', '#22d3ee', '#67e8f9',
                            '#0e7490', '#0284c7', '#0ea5e9', '#38bdf8',
                            '#115e59', '#134e4a', '#166534'
                          ];
                          const baseColor = colors[index % colors.length];
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={getCellColor(entry.id, activeFilters.dae_id, baseColor)}
                              stroke={isFilterActive(entry.id, activeFilters.dae_id) ? '#000' : 'none'}
                              strokeWidth={isFilterActive(entry.id, activeFilters.dae_id) ? 3 : 0}
                            />
                          );
                        })}
                        <LabelList
                          dataKey="value"
                          position={isMobileViewport ? 'insideRight' : 'right'}
                          formatter={(value: number) => value.toLocaleString()}
                          style={{
                            fontSize: isMobileViewport ? '11px' : '14px',
                            fontWeight: 'bold',
                            fill: '#374151'
                          }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Lista detalhada de todos os DAE */}
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Todos os DAE (Comunicação Imediata)
                  </h4>
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                    {dadosDae.map((item, index) => {
                      const isFiltered = isFilterActive(item.id, activeFilters.dae_id);
                      const total = dadosDae.reduce((sum, i) => sum + i.value, 0);
                      const percentual = total > 0 ? Math.round((item.value / total) * 100) : 0;
                      
                      return (
                        <div
                          key={item.id || index}
                          onClick={(e) => toggleFilter('dae_id', item.id, e.ctrlKey || e.metaKey)}
                          className={`p-3 rounded-lg border-l-4 transition-all cursor-pointer ${
                            isFiltered 
                              ? 'ring-2 ring-teal-500 shadow-md bg-teal-50 border-teal-500' 
                              : 'hover:shadow-sm bg-gray-50 border-gray-400'
                          }`}
                          style={{ 
                            opacity: activeFilters.dae_id && !isFiltered ? 0.5 : 1
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <span className={`text-xs font-bold ${
                                index < 3 ? 'text-teal-700' : 'text-gray-600'
                              }`}>
                                #{index + 1}
                              </span>
                              <span className="text-sm font-medium text-gray-800">
                                {item.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-gray-900">
                                {item.value}
                              </span>
                              <span className="text-xs text-gray-600 min-w-[45px] text-right">
                                {percentual}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Resumo Estatístico */}
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="bg-teal-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-teal-700">
                        {dadosDae.length}
                      </div>
                      <div className="text-xs text-gray-600 font-medium mt-1">Tipos de DAE</div>
                    </div>
                    <div className="bg-cyan-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-cyan-700">
                        {dadosDae.reduce((sum, item) => sum + item.value, 0)}
                      </div>
                      <div className="text-xs text-gray-600 font-medium mt-1">Total de Comunicações</div>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-emerald-700">
                        {dadosDae.length > 0 ? Math.round(dadosDae.reduce((sum, item) => sum + item.value, 0) / dadosDae.length) : 0}
                      </div>
                      <div className="text-xs text-gray-600 font-medium mt-1">Média por DAE</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* LINHA 7: Municípios de Residência - 4 colunas (abaixo de Ocorrência) */}
          <div className="bg-white p-4 rounded-lg shadow-sm sm:col-span-2 lg:col-span-4 xl:col-span-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-600" />
                <h3 className="text-xl font-semibold text-gray-800">Municípios de Residência</h3>
                <span className="bg-emerald-100 text-emerald-800 text-sm font-medium px-3 py-1 rounded-full">
                  {dadosMunicipiosResidencia.length} {dadosMunicipiosResidencia.length === 1 ? 'município' : 'municípios'}
                </span>
              </div>
              <ChartExportMenu
                chartId="chart-municipios-residencia"
                chartData={dadosMunicipiosResidencia}
                chartTitle="Municípios de Residência - Distribuição Geográfica"
                buttonVariant="icon"
              />
            </div>

            {dadosMunicipiosResidencia.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhum dado de município de residência disponível</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                  <div className="mb-4">
                    <h4 className="text-lg font-medium text-gray-700 mb-2">Top 10 Municípios de Residência</h4>
                    <p className="text-sm text-gray-500">Clique nas barras para filtrar por município de residência</p>
                  </div>

                  <div id="chart-municipios-residencia">
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={dadosMunicipiosResidencia.slice(0, 10)} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          fontSize={11}
                          interval={0}
                        />
                        <YAxis fontSize={12} allowDecimals={false} />
                        <Tooltip />
                        <Bar
                          dataKey="value"
                          cursor="pointer"
                          onClick={(data) => data && toggleFilter('municipio_residencia_id', data.id, ctrlPressedRef.current)}
                          radius={[4, 4, 0, 0]}
                        >
                          {dadosMunicipiosResidencia.slice(0, 10).map((entry, index) => {
                            const colors = [
                              "#047857", "#059669", "#10b981", "#34d399", "#6ee7b7",
                              "#0ea5e9", "#0284c7", "#0369a1", "#38bdf8", "#7dd3fc"
                            ];
                            const baseColor = colors[index % colors.length];
                            return (
                              <Cell
                                key={`cell-res-${index}`}
                                fill={getCellColor(entry.id, activeFilters.municipio_residencia_id, baseColor)}
                                stroke={isFilterActive(entry.id, activeFilters.municipio_residencia_id) ? "#000" : "none"}
                                strokeWidth={isFilterActive(entry.id, activeFilters.municipio_residencia_id) ? 3 : 0}
                              />
                            );
                          })}
                          <LabelList
                            dataKey="value"
                            position="top"
                            style={{
                              fontSize: '14px',
                              fontWeight: 'bold',
                              fill: '#374151'
                            }}
                            formatter={(value: number) => value.toLocaleString()}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="xl:col-span-1">
                  <div className="mb-4">
                    <h4 className="text-lg font-medium text-gray-700 mb-2">Todos os Municípios de Residência</h4>
                    <p className="text-sm text-gray-500">Clique para filtrar</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 min-h-[240px] max-h-[300px] overflow-y-auto">
                    <div className="space-y-2">
                      {dadosMunicipiosResidencia.map((item, index) => {
                        const isActive = isFilterActive(item.id, activeFilters.municipio_residencia_id);
                        const colors = [
                          "#047857", "#059669", "#10b981", "#34d399", "#6ee7b7",
                          "#0ea5e9", "#0284c7", "#0369a1", "#38bdf8", "#7dd3fc"
                        ];
                        const itemColor = colors[index % colors.length];
                        const bandeiraPattern = getMunicipioBandeiraPathBase(item.name);
                        return (
                          <div
                            key={`item-res-${index}`}
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                              isActive
                                ? 'bg-emerald-100 border border-emerald-300 shadow-sm'
                                : 'bg-white hover:bg-gray-100 border border-transparent hover:shadow-sm'
                            }`}
                            onClick={(e) => toggleFilter('municipio_residencia_id', item.id, e.ctrlKey || e.metaKey)}
                            title={`Clique para filtrar por ${item.name}`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {/* Bandeira do município */}
                              <img
                                src={`${bandeiraPattern}.jpg`}
                                alt={`Bandeira de ${item.name}`}
                                className="w-10 h-7 object-cover rounded shadow-sm border border-gray-200"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  if (target.src.endsWith('.jpg')) {
                                    target.src = `${bandeiraPattern}.png`;
                                  } else {
                                    target.style.display = 'none';
                                  }
                                }}
                              />
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded border border-gray-200 flex items-center justify-center"
                                  style={{ backgroundColor: itemColor + '20' }}
                                >
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: itemColor }}
                                  ></div>
                                </div>
                                <span className={`font-medium text-sm ${isActive ? 'text-emerald-800' : 'text-gray-700'}`}>
                                  {item.name}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-semibold ${isActive ? 'text-emerald-700' : 'text-gray-600'}`}>
                                {item.value}
                              </span>
                              {isActive && <span className="text-emerald-500 text-xs">●</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {!isRestrictedOriginView && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">Mapa de Localizações</h3>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  {localizacoes.filter(loc => (loc.fichasCount || 0) > 0).length} local(is) com fichas
                </span>
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-4">
              <p>Visualize as localizações com fichas cadastradas. Clique nas bolinhas para ver os detalhes.</p>
            </div>

            <MapProviderProvider>
              <MapaDashboardDAE 
                localizacoes={localizacoes.filter(loc => (loc.fichasCount || 0) > 0)}
                onLocalizacaoClick={handleOpenLocalizacaoModal}
              />
            </MapProviderProvider>
          </div>
        )}

        {/* Informações e Legendas */}
        <div className="mt-6 bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Info className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Como usar este dashboard</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• <strong>Clique no card "Total"</strong> para ver a lista completa de comunicações</li>
                <li>• <strong>Clique nos cards</strong> CRS/NHE/CIEVS para filtrar por tipo de origem</li>
                <li>• <strong>Use os filtros de período e horário</strong> para analisar intervalos específicos de tempo</li>
                <li>• <strong>Clique nos gráficos</strong> de municípios (ocorrência/residência), DAE ou semana epidemiológica para aplicar filtros específicos</li>
                <li>• <strong>Todos os gráficos são interconectados</strong> - refletem os filtros ativos simultaneamente</li>
                <li>• <strong>Passe o mouse sobre os pontos</strong> do gráfico temporal para ver valores absolutos e porcentagens</li>
                <li>• <strong>Use "Limpar Todos os Filtros"</strong> para resetar e ver todos os dados novamente</li>
                {!isRestrictedOriginView && (
                  <li>• <strong>No mapa</strong>, clique nas bolinhas coloridas para ver as fichas relacionadas a cada localização</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </main>

      <LocalizacaoComunicacoesModal
        isOpen={showLocalizacaoModal}
        selectedLocalizacao={selectedLocalizacao}
        dadosFiltrados={dadosFiltrados}
        onClose={handleCloseLocalizacaoModal}
        onOpenView={handleOpenComunicacaoView}
        onOpenEdit={handleOpenComunicacaoEdit}
      />

      <ComunicacaoFichaModal
        isOpen={showFichaModal}
        selectedComunicacao={selectedComunicacao}
        mode={fichaModalMode}
        onClose={handleCloseFichaModal}
      />
    </div>
  );
};

export default ComunicacaoDaeDashboard;