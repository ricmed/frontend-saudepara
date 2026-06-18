import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  Info,
  Menu,
  RefreshCw,
  X,
} from 'lucide-react';
import { SideMenu } from '@/features/home/components/SideMenu';
import { useDashboardAutoRefresh } from '@/features/comunicacao-dae/hooks/useDashboardAutoRefresh';
import {
  HEPATITE_CRIANCA_DASHBOARD_TABS,
  HEPATITE_CRIANCA_HBV_FORM_KEY,
  type HepatiteCriancaDashboardTabId,
} from './constants';
import { useHepatiteCriancaDashboardData } from './hooks/useHepatiteCriancaDashboardData';
import { useHepatiteCriancaDashboardFilters } from './hooks/useHepatiteCriancaDashboardFilters';
import { useHepatiteCriancaDashboardCharts } from './hooks/useHepatiteCriancaDashboardCharts';
import { useHepatiteCriancaDashboardClinicalCharts } from './hooks/useHepatiteCriancaDashboardClinicalCharts';
import { useHepatiteCriancaDashboardOutcomeCharts } from './hooks/useHepatiteCriancaDashboardOutcomeCharts';
import { EpidemiologicoTab } from './components/EpidemiologicoTab';
import { PerfilMaternoTab } from './components/PerfilMaternoTab';
import { CoberturaVacinalTab } from './components/CoberturaVacinalTab';
import { SeguimentoLabTab } from './components/SeguimentoLabTab';
import { DesfechoAlertasTab } from './components/DesfechoAlertasTab';

function isHepatiteCriancaTabId(value: string): value is HepatiteCriancaDashboardTabId {
  return HEPATITE_CRIANCA_DASHBOARD_TABS.some((t) => t.id === value);
}

const HepatiteCriancaHbvDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { agravo } = useParams<{ agravo: string }>();
  const listPath = `/private/formularios/${HEPATITE_CRIANCA_HBV_FORM_KEY}`;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<HepatiteCriancaDashboardTabId>('epidemiologico');

  const {
    loading,
    error,
    submissions,
    municipioMaps,
    referenceMaps,
    formNome,
    lastUpdate,
    loadAllData,
    setError,
  } = useHepatiteCriancaDashboardData();

  const filters = useHepatiteCriancaDashboardFilters(submissions);
  const charts = useHepatiteCriancaDashboardCharts({
    dadosFiltrados: filters.dadosFiltrados,
    municipioMaps,
  });
  const clinicalCharts = useHepatiteCriancaDashboardClinicalCharts({
    dadosFiltrados: filters.dadosFiltrados,
    referenceMaps,
  });
  const outcomeCharts = useHepatiteCriancaDashboardOutcomeCharts({
    dadosFiltrados: filters.dadosFiltrados,
    municipioMaps,
  });

  useEffect(() => {
    if (agravo?.toUpperCase() !== HEPATITE_CRIANCA_HBV_FORM_KEY) {
      navigate(listPath, { replace: true });
      return;
    }
    loadAllData();
  }, [agravo, listPath, loadAllData, navigate]);

  const { autoRefreshEnabled, autoRefreshCountdown, toggleAutoRefresh } = useDashboardAutoRefresh(
    loadAllData,
    { intervalSeconds: 60, enabledByDefault: true },
  );

  if (agravo?.toUpperCase() !== HEPATITE_CRIANCA_HBV_FORM_KEY) {
    return null;
  }

  if (loading && submissions.length === 0 && !lastUpdate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const showFilterHint = true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl sticky top-0 z-40">
        <div className="w-full max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                className="p-2 rounded-lg hover:bg-blue-700 transition-colors"
                aria-label="Abrir menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={() => navigate(listPath)}
                className="p-2 rounded-lg hover:bg-blue-700 transition-colors sm:hidden"
                aria-label="Voltar à lista"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold truncate">{formNome}</h1>
                <p className="text-xs sm:text-sm text-blue-100 truncate">
                  Dashboard de vigilância — SES-PA · {charts.stats.total} notificação(ões)
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              {lastUpdate ? (
                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg text-xs sm:text-sm">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Atualizado: {lastUpdate}</span>
                  {autoRefreshEnabled ? (
                    <span className="text-yellow-200 whitespace-nowrap">· {autoRefreshCountdown}s</span>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-2">
                <span className="inline-flex items-center px-3 py-2 rounded-lg bg-white/10 text-xs sm:text-sm font-semibold">
                  {filters.activeFiltersCount} filtro{filters.activeFiltersCount === 1 ? '' : 's'}
                </span>
                <button
                  type="button"
                  onClick={loadAllData}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-xs sm:text-sm font-semibold disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Atualizar</span>
                </button>
                <button
                  type="button"
                  onClick={toggleAutoRefresh}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold ${
                    autoRefreshEnabled
                      ? 'bg-yellow-500 hover:bg-yellow-600'
                      : 'bg-gray-400 hover:bg-gray-500'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span className="hidden sm:inline">{autoRefreshEnabled ? 'Auto ON' : 'Auto OFF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(listPath)}
                  className="hidden sm:inline-flex items-center gap-2 px-3 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg text-xs sm:text-sm font-semibold"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="w-full max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {error ? (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button type="button" onClick={() => setError(null)} aria-label="Fechar erro">
              <X className="w-5 h-5 text-red-500" />
            </button>
          </div>
        ) : null}

        <nav
          className="mb-4 flex flex-wrap gap-2"
          aria-label="Abas do dashboard"
          data-testid="hepatite-crianca-dashboard-tabs"
        >
          {HEPATITE_CRIANCA_DASHBOARD_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (isHepatiteCriancaTabId(tab.id)) setActiveTab(tab.id);
                }}
                className={`rounded-md px-4 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {showFilterHint ? (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-blue-900">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm">
              {activeTab === 'epidemiologico'
                ? 'Clique nos cards e gráficos para filtrar · Ctrl+Click para seleção múltipla nos municípios'
                : 'Os indicadores respeitam os filtros ativos na aba Epidemiológico (período, tipo de exposição, município, encerramento).'}
            </p>
          </div>
        ) : null}

        {activeTab === 'epidemiologico' ? (
          <EpidemiologicoTab charts={charts} filters={filters} />
        ) : null}
        {activeTab === 'perfil_materno' ? (
          <PerfilMaternoTab charts={clinicalCharts.perfilMaterno} />
        ) : null}
        {activeTab === 'cobertura_vacinal' ? (
          <CoberturaVacinalTab charts={clinicalCharts.coberturaVacinal} />
        ) : null}
        {activeTab === 'seguimento_lab' ? (
          <SeguimentoLabTab charts={clinicalCharts.seguimentoLab} />
        ) : null}
        {activeTab === 'desfecho_alertas' ? (
          <DesfechoAlertasTab charts={outcomeCharts.desfechoAlertas} />
        ) : null}
      </main>
    </div>
  );
};

export default HepatiteCriancaHbvDashboardPage;
