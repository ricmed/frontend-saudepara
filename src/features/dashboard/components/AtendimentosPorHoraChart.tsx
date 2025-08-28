// Componente para gráfico de atendimentos por hora com filtro por data
import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Clock, TrendingUp, AlertTriangle, BarChart3, Calendar } from 'lucide-react';
import { useAtendimentosPorHora } from '../hooks/useAtendimentosPorHora';

interface AtendimentosPorHoraChartProps {
  notificacoes: any[];
  timezone?: string;
  className?: string;
}

/**
 * Componente de gráfico para análise de atendimentos por hora com filtro por data
 * Usado para identificar picos de fluxo hospitalar em dias específicos
 */
export const AtendimentosPorHoraChart: React.FC<AtendimentosPorHoraChartProps> = ({
  notificacoes,
  timezone = 'America/Belem',
  className = ''
}) => {
  // ✅ NOVO: Estado para controlar a data selecionada
  const [dataSelecionada, setDataSelecionada] = useState<string | null>(null);

  console.log('🔍 [COMPONENT DEBUG] Estado inicial:', {
    dataSelecionada,
    totalNotificacoes: notificacoes?.length || 0
  });

  const { atendimentosPorHora, estatisticas, loading, datasDisponiveis } = useAtendimentosPorHora({
    notificacoes,
    timezone,
    dataFiltro: dataSelecionada // ✅ NOVO: Passar a data selecionada para o hook
  });

  console.log('🔍 [COMPONENT DEBUG] Dados do hook:', {
    datasDisponiveis: datasDisponiveis?.length || 0,
    primeirasDatas: datasDisponiveis?.slice(0, 3),
    atendimentosPorHora: atendimentosPorHora?.length || 0,
    dataSelecionada
  });

  if (loading) {
    return (
      <div className={`bg-white p-6 rounded-lg shadow-sm ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Processando dados...</p>
          </div>
        </div>
      </div>
    );
  }

  // Função para formatar data para exibição
  const formatarDataParaExibicao = (dataISO: string) => {
    const data = new Date(dataISO + 'T00:00:00');
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Tooltip customizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`Horário: ${label}`}</p>
          <p className="text-blue-600">
            <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
            {`Atendimentos: ${data.quantidade}`}
          </p>
          <p className="text-red-600">
            <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
            {`Urgências: ${data.urgencia}`}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {data.quantidade > 0 ? `${Math.round((data.urgencia / data.quantidade) * 100)}% urgentes` : '0% urgentes'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Fluxo de Atendimentos por Hora
            </h3>
            <p className="text-sm text-gray-600">
              {dataSelecionada 
                ? `Análise do dia ${formatarDataParaExibicao(dataSelecionada)}`
                : 'Análise consolidada de todos os dias'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* ✅ NOVO: Seletor de Data */}
          <div className="flex flex-col items-end">
            <label className="text-sm text-gray-500 mb-1">Filtrar por data:</label>
            <select
              value={dataSelecionada || 'todas'}
              onChange={(e) => {
                const novaData = e.target.value === 'todas' ? null : e.target.value;
                console.log('🔍 [SELECT DEBUG] Mudança de data:', {
                  valorAnterior: dataSelecionada,
                  novoValor: novaData,
                  eventValue: e.target.value
                });
                setDataSelecionada(novaData);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todas">📊 Todas as datas</option>
              {datasDisponiveis.map((data) => (
                <option key={data} value={data}>
                  📅 {formatarDataParaExibicao(data)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-500">Timezone</p>
            <p className="font-medium text-gray-900">{timezone}</p>
          </div>
        </div>
      </div>

      {/* Estatísticas Resumidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              {dataSelecionada ? 'Dia Selecionado' : 'Total Geral'}
            </span>
          </div>
          <p className="text-xl font-bold text-blue-700 mt-1">
            {estatisticas.totalAtendimentos.toLocaleString()}
          </p>
        </div>

        <div className="bg-green-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">Pico</span>
          </div>
          <p className="text-lg font-bold text-green-700 mt-1">
            {estatisticas.horarioPico || '—'}
          </p>
        </div>

        <div className="bg-orange-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">Urgências</span>
          </div>
          <p className="text-lg font-bold text-orange-700 mt-1">
            {estatisticas.percentualUrgencia}%
          </p>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              {dataSelecionada ? 'Média/h' : 'Dias Disp.'}
            </span>
          </div>
          <p className="text-lg font-bold text-gray-700 mt-1">
            {dataSelecionada ? estatisticas.mediaHoraria : datasDisponiveis.length}
          </p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={atendimentosPorHora} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorQuantidade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorUrgencia" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="hora" 
              stroke="#64748b"
              fontSize={12}
              interval={1}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            <Area
              type="monotone"
              dataKey="quantidade"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={0.6}
              fill="url(#colorQuantidade)"
              name="Total de Atendimentos"
            />
            
            <Area
              type="monotone"
              dataKey="urgencia"
              stroke="#ef4444"
              strokeWidth={2}
              fillOpacity={0.6}
              fill="url(#colorUrgencia)"
              name="Atendimentos Urgentes"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">💡 Insights para Gestão</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
          <div>
            <strong>Horário de Pico:</strong> {estatisticas.horarioPico} 
            {estatisticas.horarioPico && (
              <span className="text-blue-600"> (maior fluxo)</span>
            )}
          </div>
          <div>
            <strong>Menor Fluxo:</strong> {estatisticas.horarioMenorFluxo}
            {estatisticas.horarioMenorFluxo && (
              <span className="text-green-600"> (ideal para manutenção)</span>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          📊 Use estes dados para otimizar escalas médicas e planejar recursos durante eventos de massa.
        </p>
      </div>
    </div>
  );
};

export default AtendimentosPorHoraChart;
