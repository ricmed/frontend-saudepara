import React from 'react';
import { quadrimestreLabel } from '../utils/monitorOperRegionalReport';
import type { MonitorOperReportContextValue } from '../pages/monitorOperReportContext';

type Props = Pick<
  MonitorOperReportContextValue,
  'filters' | 'setFilters' | 'filterOptions' | 'crsLabels'
>;

export const MonitorOperReportFiltersBar: React.FC<Props> = ({ filters, setFilters, filterOptions, crsLabels }) => {
  const qOpts: { value: '' | 'Q1' | 'Q2' | 'Q3'; label: string }[] = [
    { value: '', label: 'Todos os quadrimestres' },
    { value: 'Q1', label: quadrimestreLabel('Q1') },
    { value: 'Q2', label: quadrimestreLabel('Q2') },
    { value: 'Q3', label: quadrimestreLabel('Q3') },
  ];

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
          onClick={() => setFilters({ ano: '', quadrimestre: '', crs_id: '', area: '', executor_nivel: '' })}
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
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Regional</span>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
            value={filters.crs_id}
            onChange={(e) => setFilters((f) => ({ ...f, crs_id: e.target.value }))}
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
            <option value="CENTRAL">Nível central (estadual)</option>
            <option value="REGIONAL">Nível regional (CRS)</option>
          </select>
        </label>
      </div>
    </section>
  );
};
