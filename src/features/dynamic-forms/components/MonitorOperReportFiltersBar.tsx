import React, { useMemo } from 'react';
import { quadrimestreLabel } from '../utils/monitorOperRegionalReport';
import { buildGeoCascadeOptions } from '../utils/monitorOperGeoDimensoes';
import type { MonitorOperReportContextValue } from '../pages/monitorOperReportContext';

type Props = Pick<
  MonitorOperReportContextValue,
  'filters' | 'setFilters' | 'filterOptions' | 'crsLabels' | 'geoCatalog'
>;

export const MonitorOperReportFiltersBar: React.FC<Props> = ({
  filters,
  setFilters,
  filterOptions,
  crsLabels,
  geoCatalog,
}) => {
  const qOpts: { value: '' | 'Q1' | 'Q2' | 'Q3'; label: string }[] = [
    { value: '', label: 'Todos os quadrimestres' },
    { value: 'Q1', label: quadrimestreLabel('Q1') },
    { value: 'Q2', label: quadrimestreLabel('Q2') },
    { value: 'Q3', label: quadrimestreLabel('Q3') },
  ];

  const geoOpts = useMemo(
    () =>
      buildGeoCascadeOptions(geoCatalog, {
        macrorregiao_id: filters.macrorregiao_id,
        regiao_saude_id: filters.regiao_saude_id,
        regiao_integracao_id: filters.regiao_integracao_id,
        municipio_id: filters.municipio_id,
      }),
    [
      geoCatalog,
      filters.macrorregiao_id,
      filters.regiao_saude_id,
      filters.regiao_integracao_id,
      filters.municipio_id,
    ],
  );

  const clearFilters = () =>
    setFilters({
      ano: '',
      quadrimestre: '',
      crs_id: '',
      area: '',
      executor_nivel: '',
      macrorregiao_id: '',
      regiao_saude_id: '',
      regiao_integracao_id: '',
      municipio_id: '',
    });

  return (
    <section
      className="rounded-2xl border border-slate-200/80 bg-white shadow-md overflow-hidden p-4 md:p-5"
      aria-label="Filtros do painel"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="text-sm font-semibold text-slate-800">Filtros</h2>
        <button
          type="button"
          className="text-xs font-medium text-teal-700 hover:text-teal-900 underline-offset-2 hover:underline"
          onClick={clearFilters}
        >
          Limpar filtros
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Ano</span>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
            value={filters.ano}
            onChange={(e) => setFilters((f) => ({ ...f, ano: e.target.value }))}
          >
            <option value="">Todos</option>
            {filterOptions.anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Quadrimestre</span>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
            value={filters.quadrimestre}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                quadrimestre: e.target.value as '' | 'Q1' | 'Q2' | 'Q3',
              }))
            }
          >
            {qOpts.map((o) => (
              <option key={o.value || 'all'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Regional (CRS)</span>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
            value={filters.crs_id}
            onChange={(e) => setFilters((f) => ({ ...f, crs_id: e.target.value }))}
            data-testid="monitor-oper-filter-crs"
          >
            <option value="">Todas</option>
            {filterOptions.crsIds.map((id) => (
              <option key={id} value={id}>
                {crsLabels[id] || id}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Área</span>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
            value={filters.area}
            onChange={(e) => setFilters((f) => ({ ...f, area: e.target.value }))}
          >
            <option value="">Todas</option>
            {filterOptions.areas.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Executor</span>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
            value={filters.executor_nivel}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                executor_nivel: e.target.value as '' | 'CENTRAL' | 'REGIONAL',
              }))
            }
          >
            <option value="">Todos</option>
            <option value="CENTRAL">Nível Central (estadual)</option>
            <option value="REGIONAL">Nível regional (CRS)</option>
          </select>
        </label>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100">
        <h3 className="text-xs font-semibold text-slate-700 mb-2">Território (municípios alcançados)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="flex flex-col gap-1 min-w-0">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Macrorregião</span>
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
              value={filters.macrorregiao_id}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  macrorregiao_id: e.target.value,
                  regiao_saude_id: '',
                  municipio_id: '',
                }))
              }
              data-testid="monitor-oper-filter-macrorregiao"
            >
              <option value="">Todas</option>
              {geoOpts.macrorregioes.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 min-w-0">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Região de Saúde</span>
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
              value={filters.regiao_saude_id}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  regiao_saude_id: e.target.value,
                  municipio_id: '',
                }))
              }
              data-testid="monitor-oper-filter-regiao-saude"
            >
              <option value="">Todas</option>
              {geoOpts.regioesSaude.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 min-w-0">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              Região de Integração
            </span>
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
              value={filters.regiao_integracao_id}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  regiao_integracao_id: e.target.value,
                  municipio_id: '',
                }))
              }
              data-testid="monitor-oper-filter-regiao-integracao"
            >
              <option value="">Todas</option>
              {geoOpts.regioesIntegracao.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 min-w-0">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Município</span>
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
              value={filters.municipio_id}
              onChange={(e) => setFilters((f) => ({ ...f, municipio_id: e.target.value }))}
              data-testid="monitor-oper-filter-municipio"
            >
              <option value="">Todos</option>
              {geoOpts.municipios.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {!geoCatalog?.municipios?.length ? (
          <p className="mt-2 text-[11px] text-amber-800">
            Catálogo territorial indisponível (rode a migração e o seed geo-dimensoes-pa no backend).
          </p>
        ) : null}
      </div>
    </section>
  );
};
