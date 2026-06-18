import React, { useEffect, useRef, useState } from 'react';
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
  Activity,
  Calendar,
  CheckCircle,
  FileText,
  Filter,
  HeartPulse,
  MapPin,
  X,
} from 'lucide-react';
import ChartExportMenu from '@/components/common/ChartExportMenu';
import { MapProviderProvider } from '@/features/maps/leaflet/contexts/MapProviderContext';
import {
  TIPO_EXPOSICAO_AMBOS,
  TIPO_EXPOSICAO_HBV,
  TIPO_EXPOSICAO_HCV,
} from '@/features/dynamic-forms/utils/hepatiteCriancaExposicao';
import { getMunicipioBandeiraPathBase } from '@/utils/municipioBandeiraPa';
import type { HepatiteActiveFilters, HepatiteChartItem, HepatiteDashboardStats, HepatiteMapaPonto, HepatiteSemanaEpidemiologicaPoint, HepatiteSerieTemporalPoint } from '../types';
import HepatiteCriancaMapaFicha from './HepatiteCriancaMapaFicha';

type ChartsData = {
  stats: HepatiteDashboardStats;
  dadosSerieTemporal: HepatiteSerieTemporalPoint[];
  dadosSemanaEpidemiologica: HepatiteSemanaEpidemiologicaPoint[];
  dadosMunicipiosNotificacao: HepatiteChartItem[];
  dadosMunicipiosResidencia: HepatiteChartItem[];
  mapaPontos: HepatiteMapaPonto[];
};

type FilterApi = {
  activeFilters: HepatiteActiveFilters;
  dataInicio: string;
  setDataInicio: (v: string) => void;
  dataFim: string;
  setDataFim: (v: string) => void;
  clearAllFilters: () => void;
  activeFiltersCount: number;
  toggleFilter: (key: keyof HepatiteActiveFilters, value: string, multi?: boolean) => void;
  applyTipoExposicaoGroup: (values: string[]) => void;
  toggleEncerradoFilter: () => void;
  isEncerradoFilterActive: boolean;
  isTipoGroupActive: (values: string[]) => boolean;
  isFilterActive: (value: string, filter: string | string[] | null) => boolean;
  getCellColor: (id: string, filter: string | string[] | null, color: string) => string;
};

type Props = {
  charts: ChartsData;
  filters: FilterApi;
};

const HBV_TIPOS = [TIPO_EXPOSICAO_HBV, TIPO_EXPOSICAO_AMBOS];
const HCV_TIPOS = [TIPO_EXPOSICAO_HCV, TIPO_EXPOSICAO_AMBOS];

const MUNICIPIO_COLORS = [
  '#1976D2', '#1E88E5', '#2196F3', '#42A5F5', '#64B5F6',
  '#81C784', '#66BB6A', '#4CAF50', '#43A047', '#388E3C',
];

type MunicipioPanelProps = {
  title: string;
  data: HepatiteChartItem[];
  chartId: string;
  filterKey: 'municipio_notificacao_ibge' | 'municipio_residencia_ibge';
  activeFilter: string | string[] | null;
  onBarClick: (id: string | undefined) => void;
  onListClick: (id: string | undefined, multi: boolean) => void;
  isFilterActive: (value: string, filter: string | string[] | null) => boolean;
  getCellColor: (id: string, filter: string | string[] | null, color: string) => string;
};

const MunicipioPanel: React.FC<MunicipioPanelProps> = ({
  title,
  data,
  chartId,
  filterKey,
  activeFilter,
  onBarClick,
  onListClick,
  isFilterActive,
  getCellColor,
}) => (
  <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm sm:col-span-2 lg:col-span-4 xl:col-span-4">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2 flex-wrap">
        <MapPin className="h-5 w-5 text-blue-600 shrink-0" />
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800">{title}</h3>
        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
          {data.length} {data.length === 1 ? 'município' : 'municípios'}
        </span>
      </div>
      <ChartExportMenu
        chartId={chartId}
        chartData={data}
        chartTitle={title}
        buttonVariant="icon"
      />
    </div>

    {data.length === 0 ? (
      <div className="flex items-center justify-center h-[320px] text-gray-500">
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>Nenhum dado de município disponível</p>
        </div>
      </div>
    ) : (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <p className="text-sm text-gray-500 mb-3">Top 10 — clique nas barras para filtrar</p>
          <div id={chartId}>
            <ResponsiveContainer width="100%" height={440}>
              <BarChart data={data.slice(0, 10)} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={11} interval={0} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip
                  formatter={(value: number) => [
                    `${value} notificação${value !== 1 ? 'ões' : ''}`,
                    'Total',
                  ]}
                />
                <Bar
                  dataKey="value"
                  cursor="pointer"
                  onClick={(payload) => onBarClick(payload?.id)}
                  radius={[4, 4, 0, 0]}
                >
                  {data.slice(0, 10).map((entry, index) => {
                    const base = MUNICIPIO_COLORS[index % MUNICIPIO_COLORS.length];
                    const id = entry.id ?? '';
                    return (
                      <Cell
                        key={entry.name}
                        fill={getCellColor(id, activeFilter, base)}
                        stroke={isFilterActive(id, activeFilter) ? '#000' : 'none'}
                        strokeWidth={isFilterActive(id, activeFilter) ? 3 : 0}
                      />
                    );
                  })}
                  <LabelList dataKey="value" position="top" style={{ fontSize: 14, fontWeight: 'bold' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-3">Todos os municípios</p>
          <div className="bg-gray-50 rounded-lg p-4 max-h-[440px] overflow-y-auto space-y-2">
            {data.map((item, index) => {
              const id = item.id ?? '';
              const active = isFilterActive(id, activeFilter);
              const bandeira = getMunicipioBandeiraPathBase(item.name);
              return (
                <button
                  key={`${filterKey}-${item.name}-${index}`}
                  type="button"
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all ${
                    active
                      ? 'bg-blue-100 border border-blue-300'
                      : 'bg-white hover:bg-gray-100 border border-transparent'
                  }`}
                  onClick={(e) => onListClick(item.id, e.ctrlKey || e.metaKey)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={`${bandeira}.jpg`}
                      alt=""
                      className="w-10 h-7 object-cover rounded border border-gray-200 shrink-0"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (img.src.endsWith('.jpg')) img.src = `${bandeira}.png`;
                        else img.style.display = 'none';
                      }}
                    />
                    <span className={`text-sm font-medium truncate ${active ? 'text-blue-800' : 'text-gray-700'}`}>
                      {item.name}
                    </span>
                  </div>
                  <span className={`text-sm font-semibold shrink-0 ${active ? 'text-blue-700' : 'text-gray-600'}`}>
                    {item.value}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    )}
  </div>
);

export const EpidemiologicoTab: React.FC<Props> = ({ charts, filters }) => {
  const {
    stats,
    dadosSerieTemporal,
    dadosSemanaEpidemiologica,
    dadosMunicipiosNotificacao,
    dadosMunicipiosResidencia,
    mapaPontos,
  } = charts;

  const ctrlPressedRef = useRef(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        ctrlPressedRef.current = true;
        setIsCtrlPressed(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        ctrlPressedRef.current = false;
        setIsCtrlPressed(false);
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const handleMunicipioClick = (
    filterKey: 'municipio_notificacao_ibge' | 'municipio_residencia_ibge',
    id: string | undefined,
    multi: boolean,
  ) => {
    if (!id) return;
    filters.toggleFilter(filterKey, id, multi);
  };

  return (
    <div data-testid="hepatite-crianca-tab-epidemiologico">
      {isCtrlPressed ? (
        <div className="hidden md:flex fixed top-20 right-4 z-40 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-semibold">
          Seleção múltipla (Ctrl)
        </div>
      ) : null}

      {filters.activeFiltersCount > 0 ? (
        <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-semibold text-blue-900">
              {filters.activeFiltersCount} filtro(s) ativo(s)
            </p>
          </div>
          <button
            type="button"
            onClick={filters.clearAllFilters}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm"
          >
            <X className="w-4 h-4" />
            Limpar filtros
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        <div className="bg-gradient-to-r from-indigo-500 to-blue-600 p-4 rounded-lg shadow-lg text-white sm:col-span-2 lg:col-span-4 xl:col-span-8">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5" />
            <h3 className="text-sm font-semibold">Período de notificação</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-blue-100 mb-1">Data início</label>
              <input
                type="date"
                value={filters.dataInicio}
                onChange={(e) => filters.setDataInicio(e.target.value)}
                className="w-full px-3 py-2 text-sm text-gray-900 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-blue-100 mb-1">Data fim</label>
              <input
                type="date"
                value={filters.dataFim}
                onChange={(e) => filters.setDataFim(e.target.value)}
                className="w-full px-3 py-2 text-sm text-gray-900 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-4 rounded-lg shadow-lg flex items-center gap-3 text-white sm:col-span-2 lg:col-span-2 xl:col-span-2">
          <div className="p-3 bg-white/20 rounded-full">
            <FileText className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wide text-blue-100">Total notificado</h3>
            <p className="text-3xl font-bold">{stats.total.toLocaleString('pt-BR')}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => filters.applyTipoExposicaoGroup(HBV_TIPOS)}
          className={`p-4 rounded-lg shadow-lg flex items-center gap-3 text-white sm:col-span-2 lg:col-span-2 xl:col-span-2 text-left transition-all hover:shadow-xl ${
            filters.isTipoGroupActive(HBV_TIPOS) ? 'ring-4 ring-cyan-300' : ''
          }`}
          style={{ background: 'linear-gradient(to bottom right, #06b6d4, #0891b2)' }}
        >
          <div className="p-3 bg-white/20 rounded-full">
            <Activity className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wide opacity-90">Com HBV materno</h3>
            <p className="text-3xl font-bold">{stats.comHbvMaterno.toLocaleString('pt-BR')}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => filters.applyTipoExposicaoGroup(HCV_TIPOS)}
          className={`p-4 rounded-lg shadow-lg flex items-center gap-3 text-white sm:col-span-2 lg:col-span-2 xl:col-span-2 text-left transition-all hover:shadow-xl ${
            filters.isTipoGroupActive(HCV_TIPOS) ? 'ring-4 ring-purple-300' : ''
          }`}
          style={{ background: 'linear-gradient(to bottom right, #8b5cf6, #7c3aed)' }}
        >
          <div className="p-3 bg-white/20 rounded-full">
            <HeartPulse className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wide opacity-90">Com HCV materno</h3>
            <p className="text-3xl font-bold">{stats.comHcvMaterno.toLocaleString('pt-BR')}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={filters.toggleEncerradoFilter}
          className={`p-4 rounded-lg shadow-lg flex items-center gap-3 text-white sm:col-span-2 lg:col-span-2 xl:col-span-2 text-left transition-all hover:shadow-xl ${
            filters.isEncerradoFilterActive ? 'ring-4 ring-emerald-300' : ''
          }`}
          style={{ background: 'linear-gradient(to bottom right, #10b981, #059669)' }}
        >
          <div className="p-3 bg-white/20 rounded-full">
            <CheckCircle className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wide opacity-90">Casos encerrados</h3>
            <p className="text-3xl font-bold">{stats.casosEncerrados.toLocaleString('pt-BR')}</p>
          </div>
        </button>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm sm:col-span-2 lg:col-span-4 xl:col-span-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Série temporal</h3>
              <p className="text-sm text-gray-600">Notificações por dia (últimos 30 dias com dados)</p>
            </div>
            <ChartExportMenu
              chartId="hepatite-serie-temporal"
              chartData={dadosSerieTemporal.map((d) => ({ name: d.date, value: d.total }))}
              chartTitle="Série temporal — Criança exposta"
              buttonVariant="icon"
            />
          </div>
          {dadosSerieTemporal.length === 0 ? (
            <div className="flex items-center justify-center h-80 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-gray-500">
              Nenhuma notificação no período
            </div>
          ) : (
            <div className="h-80" id="hepatite-serie-temporal">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadosSerieTemporal} margin={{ top: 30, right: 30, left: 20, bottom: 50 }}>
                  <defs>
                    <linearGradient id="hepatiteColorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b5bdb" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b5bdb" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={70} fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip
                    formatter={(value: number, _name, props) => {
                      const p = props.payload as (typeof dadosSerieTemporal)[number];
                      return [
                        `${value} total (HBV: ${p.HBV}, HCV: ${p.HCV}, ambos: ${p.Ambos})`,
                        'Notificações',
                      ];
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#3b5bdb"
                    strokeWidth={2}
                    fill="url(#hepatiteColorTotal)"
                  >
                    <LabelList dataKey="total" position="top" style={{ fill: '#3b5bdb', fontWeight: 'bold' }} />
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm sm:col-span-2 lg:col-span-4 xl:col-span-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 text-teal-700 rounded-lg">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Semana epidemiológica</h3>
                <p className="text-sm text-gray-600">Distribuição por SE (data de notificação)</p>
              </div>
            </div>
            <ChartExportMenu
              chartId="hepatite-semana-epi"
              chartData={dadosSemanaEpidemiologica}
              chartTitle="Semana epidemiológica — Criança exposta"
              buttonVariant="icon"
            />
          </div>
          {dadosSemanaEpidemiologica.length === 0 ? (
            <div className="flex items-center justify-center h-80 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-gray-500">
              Nenhum dado disponível
            </div>
          ) : (
            <div className="h-[480px]" id="hepatite-semana-epi">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosSemanaEpidemiologica} margin={{ top: 30, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} fontSize={11} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip
                    formatter={(value: number, _name, props) => [
                      `${value} notificação${value !== 1 ? 'ões' : ''}`,
                      `${props.payload.name} / ${props.payload.ano}`,
                    ]}
                  />
                  <Bar dataKey="value" fill="#5eafc6" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="value" position="top" style={{ fontWeight: 700, fontSize: 12 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <MunicipioPanel
          title="Municípios de notificação"
          data={dadosMunicipiosNotificacao}
          chartId="hepatite-municipios-notificacao"
          filterKey="municipio_notificacao_ibge"
          activeFilter={filters.activeFilters.municipio_notificacao_ibge}
          onBarClick={(id) => handleMunicipioClick('municipio_notificacao_ibge', id, ctrlPressedRef.current)}
          onListClick={(id, multi) => handleMunicipioClick('municipio_notificacao_ibge', id, multi)}
          isFilterActive={filters.isFilterActive}
          getCellColor={filters.getCellColor}
        />

        <MunicipioPanel
          title="Municípios de residência"
          data={dadosMunicipiosResidencia}
          chartId="hepatite-municipios-residencia"
          filterKey="municipio_residencia_ibge"
          activeFilter={filters.activeFilters.municipio_residencia_ibge}
          onBarClick={(id) => handleMunicipioClick('municipio_residencia_ibge', id, ctrlPressedRef.current)}
          onListClick={(id, multi) => handleMunicipioClick('municipio_residencia_ibge', id, multi)}
          isFilterActive={filters.isFilterActive}
          getCellColor={filters.getCellColor}
        />
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Mapa de localizações</h3>
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
            {mapaPontos.length} ponto(s) com coordenadas
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Pontos da residência (campos GEO da ficha). Fichas sem latitude/longitude não aparecem no mapa.
        </p>
        {mapaPontos.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] bg-gray-50 rounded-lg text-gray-500 text-sm">
            Nenhuma ficha com coordenadas de residência preenchidas
          </div>
        ) : (
          <MapProviderProvider>
            <HepatiteCriancaMapaFicha pontos={mapaPontos} />
          </MapProviderProvider>
        )}
      </div>
    </div>
  );
};
