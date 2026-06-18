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
import { Baby, HeartPulse, Pill, Stethoscope } from 'lucide-react';
import ChartExportMenu from '@/components/common/ChartExportMenu';
import type { HepatiteChartItem, HepatitePerfilMaternoCharts } from '../types';

type Props = {
  charts: HepatitePerfilMaternoCharts;
};

const BAR_COLORS = ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#6d28d9', '#5b21b6'];

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

function BarPanel({
  title,
  data,
  chartId,
}: {
  title: string;
  data: HepatiteChartItem[];
  chartId: string;
}) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <ChartExportMenu chartId={chartId} chartData={data} chartTitle={title} buttonVariant="icon" />
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-gray-500 py-12 text-center">Sem dados no período filtrado</p>
      ) : (
        <div id={chartId}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.slice(0, 12)} margin={{ top: 16, right: 16, left: 8, bottom: 72 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" angle={-35} textAnchor="end" height={90} fontSize={11} interval={0} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip formatter={(v: number) => [`${v} caso(s)`, 'Total']} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.slice(0, 12).map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
                <LabelList dataKey="value" position="top" style={{ fontSize: 12, fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export const PerfilMaternoTab: React.FC<Props> = ({ charts }) => {
  const { kpis } = charts;
  const prenatalPct =
    kpis.fezPrenatalInformado > 0
      ? Math.round((kpis.fezPrenatalSim / kpis.fezPrenatalInformado) * 100)
      : 0;

  return (
    <div className="space-y-6" data-testid="hepatite-crianca-tab-perfil-materno">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Pré-natal realizado"
          value={`${prenatalPct}%`}
          subtitle={`${kpis.fezPrenatalSim} de ${kpis.fezPrenatalInformado} com resposta`}
          icon={Stethoscope}
          gradient="from-violet-600 to-purple-700"
        />
        <KpiCard
          title="HIV/Aids (mãe)"
          value={kpis.hivSim}
          subtitle={`de ${kpis.total} notificações`}
          icon={HeartPulse}
          gradient="from-rose-600 to-pink-700"
        />
        <KpiCard
          title="Sífilis (mãe)"
          value={kpis.sifilisSim}
          subtitle={`de ${kpis.total} notificações`}
          icon={Baby}
          gradient="from-amber-600 to-orange-700"
        />
        <KpiCard
          title="Casos no recorte"
          value={kpis.total}
          subtitle="Respeitam filtros epidemiológicos ativos"
          icon={Pill}
          gradient="from-indigo-600 to-blue-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarPanel title="Raça/cor da mãe" data={charts.racaCor} chartId="hepatite-perfil-raca" />
        <BarPanel
          title="Escolaridade da mãe"
          data={charts.escolaridade}
          chartId="hepatite-perfil-escolaridade"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarPanel
          title="Timing HBsAg materno (HBV)"
          data={charts.hbsagTiming}
          chartId="hepatite-perfil-hbsag-timing"
        />
        <BarPanel
          title="Medicamento no pré-natal"
          data={charts.medicamentos}
          chartId="hepatite-perfil-medicamento"
        />
      </div>
    </div>
  );
};
