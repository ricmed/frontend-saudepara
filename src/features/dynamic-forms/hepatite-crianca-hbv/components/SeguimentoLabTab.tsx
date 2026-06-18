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
import { AlertTriangle, FlaskConical, Microscope, TestTube } from 'lucide-react';
import ChartExportMenu from '@/components/common/ChartExportMenu';
import type { HepatiteSeguimentoLabCharts } from '../types';

type Props = {
  charts: HepatiteSeguimentoLabCharts;
};

const SCHEME_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

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

export const SeguimentoLabTab: React.FC<Props> = ({ charts }) => {
  const { esquema1, esquema2, hcv36, hcv18 } = charts;
  const pctE1 =
    esquema1.elegiveis > 0 ? Math.round((esquema1.completas / esquema1.elegiveis) * 100) : 0;
  const pctAntiHbs =
    esquema1.examinadas > 0 ? Math.round((esquema1.antiHbsPos / esquema1.examinadas) * 100) : 0;
  const pctHcv18 =
    hcv18.elegiveis > 0 ? Math.round((hcv18.realizadas / hcv18.elegiveis) * 100) : 0;

  const esquema1Breakdown = [
    { name: 'Examinadas', value: esquema1.examinadas },
    { name: 'Pendentes', value: esquema1.pendentes },
    { name: 'HBsAg+', value: esquema1.hbsagPos },
    { name: 'Anti-HBs+', value: esquema1.antiHbsPos },
    { name: 'HBV-DNA+', value: esquema1.hbvDnaPos },
    { name: 'Inconclusivo', value: esquema1.inconclusivo },
  ];

  const acompanhamentoHcv = [
    { name: 'HCV 3–6m (eleg.)', value: hcv36.elegiveis },
    { name: 'HCV 3–6m (real.)', value: hcv36.realizadas },
    { name: 'HCV 18m (eleg.)', value: hcv18.elegiveis },
    { name: 'HCV 18m (real.)', value: hcv18.realizadas },
  ];

  return (
    <div className="space-y-6" data-testid="hepatite-crianca-tab-seguimento-lab">
      {charts.alertaEsquema1Pendente > 0 ? (
        <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-900">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Alerta — Esquema 1 (9–15 meses)</p>
            <p className="text-sm mt-1">
              {charts.alertaEsquema1Pendente} criança(s) na janela etária sem exames do 1º esquema
              laboratorial registrados.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Esquema 1 completo"
          value={`${pctE1}%`}
          subtitle={`${esquema1.completas} de ${esquema1.elegiveis} elegíveis (9–15m)`}
          icon={FlaskConical}
          gradient="from-indigo-600 to-violet-700"
        />
        <KpiCard
          title="Anti-HBs reagente (E1)"
          value={`${pctAntiHbs}%`}
          subtitle={`${esquema1.antiHbsPos} de ${esquema1.examinadas} examinadas`}
          icon={TestTube}
          gradient="from-emerald-600 to-green-700"
        />
        <KpiCard
          title="HCV 18 meses"
          value={`${pctHcv18}%`}
          subtitle={`${hcv18.realizadas} de ${hcv18.elegiveis} elegíveis`}
          icon={Microscope}
          gradient="from-cyan-600 to-blue-700"
        />
        <KpiCard
          title="Lacunas laboratoriais"
          value={charts.gapLaboratorial}
          subtitle="Pendências em E1, E2 e HCV no recorte"
          icon={AlertTriangle}
          gradient="from-amber-600 to-orange-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h3 className="text-lg font-semibold text-gray-800">1º esquema laboratorial (9–15m)</h3>
            <ChartExportMenu
              chartId="hepatite-lab-esquema1"
              chartData={esquema1Breakdown}
              chartTitle="Esquema 1"
              buttonVariant="icon"
            />
          </div>
          <div id="hepatite-lab-esquema1">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={esquema1Breakdown} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={11} interval={0} />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(v: number) => [`${v} caso(s)`, 'Total']} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {esquema1Breakdown.map((_, i) => (
                    <Cell key={i} fill={SCHEME_COLORS[i % SCHEME_COLORS.length]} />
                  ))}
                  <LabelList dataKey="value" position="top" style={{ fontSize: 12, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h3 className="text-lg font-semibold text-gray-800">2º esquema e HCV</h3>
            <ChartExportMenu
              chartId="hepatite-lab-acomp"
              chartData={acompanhamentoHcv}
              chartTitle="Acompanhamento laboratorial"
              buttonVariant="icon"
            />
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Esquema 2: {esquema2.examinadas} examinadas de {esquema2.elegiveis} elegíveis (Anti-HBs E1
            não reagente) · Anti-HBs+ pós-revacinação: {esquema2.antiHbsPos}
          </p>
          <div id="hepatite-lab-acomp">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={acompanhamentoHcv} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={11} interval={0} />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(v: number) => [`${v} caso(s)`, 'Total']} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {acompanhamentoHcv.map((_, i) => (
                    <Cell key={i} fill={SCHEME_COLORS[i % SCHEME_COLORS.length]} />
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
