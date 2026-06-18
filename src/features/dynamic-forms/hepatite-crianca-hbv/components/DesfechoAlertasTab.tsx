import React from 'react';
import { useNavigate } from 'react-router-dom';
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
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileWarning,
  FolderOpen,
  Skull,
  UserX,
} from 'lucide-react';
import ChartExportMenu from '@/components/common/ChartExportMenu';
import { HEPATITE_CRIANCA_HBV_FORM_KEY } from '../constants';
import type { HepatiteAlertaTipo, HepatiteDesfechoAlertasCharts } from '../types';
import { ALERTA_LABELS, ALERTA_SEVERIDADE } from '../utils/dashboardOutcomeRules';

type Props = {
  charts: HepatiteDesfechoAlertasCharts;
};

const EVOLUCAO_COLORS = ['#ef4444', '#22c55e', '#f59e0b', '#3b82f6', '#8b5cf6', '#1f2937', '#6b7280'];
const CLASS_COLORS = ['#2563eb', '#7c3aed', '#db2777'];

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

function alertaBadgeClass(tipo: HepatiteAlertaTipo): string {
  const sev = ALERTA_SEVERIDADE[tipo];
  if (sev === 'alta') return 'bg-red-100 text-red-800 border-red-200';
  if (sev === 'media') return 'bg-amber-100 text-amber-900 border-amber-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

export const DesfechoAlertasTab: React.FC<Props> = ({ charts }) => {
  const navigate = useNavigate();
  const { kpis } = charts;
  const pctEncerrados = kpis.total > 0 ? Math.round((kpis.encerrados / kpis.total) * 100) : 0;

  return (
    <div className="space-y-6" data-testid="hepatite-crianca-tab-desfecho-alertas">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Casos em aberto"
          value={kpis.emAberto}
          subtitle={`${kpis.comAlerta} com alerta ativo`}
          icon={FolderOpen}
          gradient="from-blue-600 to-indigo-700"
        />
        <KpiCard
          title="Encerrados"
          value={`${pctEncerrados}%`}
          subtitle={`${kpis.encerrados} de ${kpis.total} notificações`}
          icon={CheckCircle2}
          gradient="from-emerald-600 to-teal-700"
        />
        <KpiCard
          title="Detectados / Não-detectados"
          value={`${kpis.detectados} / ${kpis.naoDetectados}`}
          subtitle={`Perda de seguimento: ${kpis.perdaSeguimento}`}
          icon={ClipboardList}
          gradient="from-violet-600 to-purple-700"
        />
        <KpiCard
          title="Óbitos registrados"
          value={kpis.obitos}
          subtitle="Hepatite fulminante ou outras causas"
          icon={Skull}
          gradient="from-gray-700 to-gray-900"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Evolução do caso</h3>
            <ChartExportMenu
              chartId="hepatite-desfecho-evolucao"
              chartData={charts.evolucaoCaso}
              chartTitle="Evolução do caso"
              buttonVariant="icon"
            />
          </div>
          {charts.evolucaoCaso.length === 0 ? (
            <p className="text-sm text-gray-500 py-12 text-center">Nenhuma evolução informada</p>
          ) : (
            <div id="hepatite-desfecho-evolucao">
              <ResponsiveContainer
                width="100%"
                height={Math.max(300, charts.evolucaoCaso.length * 44)}
              >
                <BarChart
                  data={charts.evolucaoCaso}
                  layout="vertical"
                  margin={{ top: 8, right: 40, left: 4, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={200}
                    fontSize={11}
                    tick={{ fill: '#374151' }}
                  />
                  <Tooltip formatter={(v: number) => [`${v} caso(s)`, 'Total']} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                    {charts.evolucaoCaso.map((_, i) => (
                      <Cell key={i} fill={EVOLUCAO_COLORS[i % EVOLUCAO_COLORS.length]} />
                    ))}
                    <LabelList dataKey="value" position="right" style={{ fontSize: 12, fontWeight: 600 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Classificação etiológica</h3>
            <ChartExportMenu
              chartId="hepatite-desfecho-classificacao"
              chartData={charts.classificacaoEtiologica}
              chartTitle="Classificação etiológica"
              buttonVariant="icon"
            />
          </div>
          {charts.classificacaoEtiologica.length === 0 ? (
            <p className="text-sm text-gray-500 py-12 text-center">Nenhuma classificação informada</p>
          ) : (
            <div id="hepatite-desfecho-classificacao">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={charts.classificacaoEtiologica}
                  margin={{ top: 16, right: 16, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(v: number) => [`${v} caso(s)`, 'Total']} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {charts.classificacaoEtiologica.map((_, i) => (
                      <Cell key={i} fill={CLASS_COLORS[i % CLASS_COLORS.length]} />
                    ))}
                    <LabelList dataKey="value" position="top" style={{ fontSize: 12, fontWeight: 600 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FileWarning className="h-5 w-5 text-amber-600" />
          <h3 className="text-lg font-semibold text-gray-800">Painel de alertas (casos em aberto)</h3>
        </div>
        {charts.alertasResumo.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">
            Nenhum alerta ativo no recorte filtrado
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {charts.alertasResumo.map((alerta) => (
              <div
                key={alerta.tipo}
                className={`rounded-lg border px-4 py-3 ${
                  alerta.severidade === 'alta'
                    ? 'border-red-200 bg-red-50'
                    : alerta.severidade === 'media'
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800">{alerta.label}</p>
                  <span className="text-xl font-bold text-gray-900">{alerta.count}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Casos em aberto</h3>
            <span className="text-sm text-gray-500">({charts.casosEmAberto.length})</span>
          </div>
          <p className="text-xs text-gray-500 hidden sm:block">
            Identificação por ficha — sem dados pessoais do paciente
          </p>
        </div>

        {charts.casosEmAberto.length === 0 ? (
          <p className="text-sm text-gray-500 py-12 text-center">Nenhum caso em aberto no recorte</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Ficha</th>
                  <th className="px-4 py-3 font-semibold">Notif. mãe SINAN</th>
                  <th className="px-4 py-3 font-semibold">Exposição</th>
                  <th className="px-4 py-3 font-semibold">Idade</th>
                  <th className="px-4 py-3 font-semibold">Município</th>
                  <th className="px-4 py-3 font-semibold">Notificação</th>
                  <th className="px-4 py-3 font-semibold">Evolução</th>
                  <th className="px-4 py-3 font-semibold">Alertas</th>
                  <th className="px-4 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {charts.casosEmAberto.map((caso) => (
                  <tr key={caso.id} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3 font-mono text-gray-800">#{caso.id}</td>
                    <td className="px-4 py-3 text-gray-700">{caso.numeroSinanMae}</td>
                    <td className="px-4 py-3 text-gray-700">{caso.tipoExposicaoLabel}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {caso.idadeMeses !== null ? `${caso.idadeMeses} m` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[140px] truncate" title={caso.municipioLabel}>
                      {caso.municipioLabel}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{caso.dtNotificacao ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{caso.evolucaoLabel}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {caso.alertas.length === 0 ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : (
                          caso.alertas.map((tipo) => (
                            <span
                              key={tipo}
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${alertaBadgeClass(tipo)}`}
                            >
                              {ALERTA_SEVERIDADE[tipo] === 'alta' ? (
                                <AlertTriangle className="h-3 w-3" />
                              ) : null}
                              {ALERTA_LABELS[tipo]}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/private/formularios/${HEPATITE_CRIANCA_HBV_FORM_KEY}/editar/${caso.id}`,
                          )
                        }
                        className="text-blue-600 hover:text-blue-800 font-medium text-xs whitespace-nowrap"
                      >
                        Abrir ficha
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
