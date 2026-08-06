import React from 'react';
import type { EntomologiaDashboardKpis } from '../../utils/entomologiaDashboardKpis';

type KpiCardProps = {
  label: string;
  value: number | string;
  hint?: string;
  tone?: 'blue' | 'emerald' | 'sky' | 'amber' | 'rose' | 'indigo';
};

const TONE: Record<NonNullable<KpiCardProps['tone']>, string> = {
  blue: 'from-blue-600 to-blue-800 border-blue-200',
  emerald: 'from-emerald-600 to-teal-700 border-emerald-200',
  sky: 'from-sky-500 to-blue-700 border-sky-200',
  amber: 'from-amber-500 to-orange-600 border-amber-200',
  rose: 'from-rose-500 to-red-700 border-rose-200',
  indigo: 'from-indigo-600 to-blue-800 border-indigo-200',
};

const KpiCard: React.FC<KpiCardProps> = ({ label, value, hint, tone = 'blue' }) => (
  <div
    className={`rounded-2xl border bg-gradient-to-br ${TONE[tone]} px-4 py-3.5 min-w-[9rem] flex-1 text-white shadow-md`}
  >
    <p className="text-[11px] font-medium uppercase tracking-wide text-white/80">{label}</p>
    <p className="mt-1 text-2xl font-bold tabular-nums drop-shadow-sm">{value}</p>
    {hint ? <p className="mt-0.5 text-[10px] text-white/70">{hint}</p> : null}
  </div>
);

export const EntomologiaDashKpiStrip: React.FC<{ kpis: EntomologiaDashboardKpis }> = ({ kpis }) => (
  <div
    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
    data-testid="entomologia-dash-kpis"
  >
    <KpiCard label="Relatórios" value={kpis.relatorios} tone="blue" />
    <KpiCard label="Municípios" value={kpis.municipios} hint="linhas no resumo" tone="sky" />
    <KpiCard label="Tubos c/ larvas" value={kpis.tubosComLarvas} tone="emerald" />
    <KpiCard label="Total aegypti" value={kpis.totalAeg} tone="indigo" />
    <KpiCard
      label="Total albopictus"
      value={kpis.totalAlb}
      tone={kpis.totalAlb > 0 ? 'rose' : 'amber'}
    />
    <KpiCard
      label="Mun. c/ alb"
      value={kpis.municipiosComAlb}
      hint="total alb &gt; 0"
      tone={kpis.municipiosComAlb > 0 ? 'rose' : 'sky'}
    />
  </div>
);
