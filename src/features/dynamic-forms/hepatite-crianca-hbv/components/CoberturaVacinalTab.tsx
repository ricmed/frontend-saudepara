import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, Shield, Syringe, Zap } from 'lucide-react';
import ChartExportMenu from '@/components/common/ChartExportMenu';
import type { HepatiteCoberturaVacinalCharts } from '../types';

type Props = {
  charts: HepatiteCoberturaVacinalCharts;
};

const FUNIL_COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];
const HBIG_COLORS = ['#7c3aed', '#22c55e', '#ef4444'];

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  gradient: string;
}) {
  return (
    <div className={`rounded-xl p-5 text-white shadow-md bg-gradient-to-br ${gradient}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium opacity-90">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          <p className="text-xs mt-2 opacity-80">{subtitle}</p>
        </div>
        <Icon className="h-8 w-8 opacity-80 shrink-0" />
      </div>
    </div>
  );
}

export const CoberturaVacinalTab: React.FC<Props> = ({ charts }) => {
  const { kpis } = charts;
  const pctEsquema =
    kpis.totalHbv > 0 ? Math.round((kpis.esquemaCompleto / kpis.totalHbv) * 100) : 0;
  const pctHbig =
    kpis.elegiveisHbig > 0 ? Math.round((kpis.hbigRecebido / kpis.elegiveisHbig) * 100) : 0;

  return (
    <div className="space-y-6" data-testid="hepatite-crianca-tab-cobertura-vacinal">
      {charts.alertaHbsagSemHbig > 0 ? (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Alerta — IGHAHB na maternidade</p>
            <p className="text-sm mt-1">
              {charts.alertaHbsagSemHbig} filho(s) de mãe HBsAg+ sem registro de IGHAHB/vacina na
              maternidade no recorte atual.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Esquema Hep B completo"
          value={`${pctEsquema}%`}
          subtitle={`${kpis.esquemaCompleto} de ${kpis.totalHbv} casos HBV`}
          icon={Syringe}
          gradient="from-blue-600 to-cyan-700"
        />
        <KpiCard
          title="IGHAHB (mães HBsAg+)"
          value={`${pctHbig}%`}
          subtitle={`${kpis.hbigRecebido} de ${kpis.elegiveisHbig} elegíveis`}
          icon={Shield}
          gradient="from-emerald-600 to-teal-700"
        />
        <KpiCard
          title="Vacina na maternidade"
          value={kpis.vacinaMaternidade}
          subtitle={`casos HBV com dose na maternidade`}
          icon={Zap}
          gradient="from-violet-600 to-purple-700"
        />
        <KpiCard
          title="Sem IGHAHB (confirmado)"
          value={kpis.semHbig}
          subtitle="Não realizado — imunoglobulina ou ambos"
          icon={AlertTriangle}
          gradient="from-red-600 to-rose-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Funil — doses Hepatite B</h3>
            <ChartExportMenu
              chartId="hepatite-vacinal-funil"
              chartData={charts.funilDoses}
              chartTitle="Funil doses Hepatite B"
              buttonVariant="icon"
            />
          </div>
          <div id="hepatite-vacinal-funil">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.funilDoses} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(v: number) => [`${v} caso(s)`, 'Aplicada']} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {charts.funilDoses.map((_, i) => (
                    <Cell key={i} fill={FUNIL_COLORS[i % FUNIL_COLORS.length]} />
                  ))}
                  <LabelList dataKey="value" position="top" style={{ fontSize: 12, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">IGHAHB — elegíveis vs cobertura</h3>
            <ChartExportMenu
              chartId="hepatite-vacinal-hbig"
              chartData={charts.hbigRamo}
              chartTitle="IGHAHB elegíveis"
              buttonVariant="icon"
            />
          </div>
          <div id="hepatite-vacinal-hbig">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.hbigRamo} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={11} interval={0} />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(v: number) => [`${v} caso(s)`, 'Total']} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {charts.hbigRamo.map((_, i) => (
                    <Cell key={i} fill={HBIG_COLORS[i % HBIG_COLORS.length]} />
                  ))}
                  <LabelList dataKey="value" position="top" style={{ fontSize: 12, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
