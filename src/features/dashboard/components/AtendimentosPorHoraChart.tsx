// Componente para gráfico de atendimentos por hora com filtro por data
import React, { useState, useEffect, useRef } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LabelList,
} from 'recharts';
import { Clock, TrendingUp, BarChart3, Calendar } from 'lucide-react';
import { useAtendimentosPorHora } from '../hooks/useAtendimentosPorHora';
import ChartExportMenu from '../../../components/common/ChartExportMenu';

interface AtendimentosPorHoraChartProps {
  notificacoes: any[];
  timezone?: string;
  className?: string;
}

/**
 * Componente de gráfico para análise de atendimentos por hora com filtro por data
 * 🆕 ATUALIZADO: Usa data/hora de CRIAÇÃO da notificação (created_at) em vez de data_atendimento
 * Usado para identificar picos de fluxo hospitalar em dias específicos
 */
export const AtendimentosPorHoraChart: React.FC<AtendimentosPorHoraChartProps> = ({
  notificacoes,
  timezone = 'America/Belem',
  className = ''
}) => {
  // ✅ NOVO: Estado para controlar a data selecionada
  const [dataSelecionada, setDataSelecionada] = useState<string | null>(null);
  // 🔒 Ref para controlar se já foi inicializado (previne reset quando usuário escolhe "todas")
  const jaInicializou = useRef(false);

  const { atendimentosPorHora, estatisticas, loading, datasDisponiveis } = useAtendimentosPorHora({
    notificacoes,
    timezone,
    dataFiltro: dataSelecionada
  });

  // 🆕 EFEITO: Pré-selecionar a data mais recente APENAS na primeira vez
  // ✅ CORRIGIDO: Usa useRef para não resetar quando usuário seleciona "todas as datas"
  useEffect(() => {
    if (datasDisponiveis.length > 0 && !jaInicializou.current) {
      setDataSelecionada(datasDisponiveis[0]); // Pré-selecionar a primeira (mais recente)
      jaInicializou.current = true; // Marcar como inicializado
    }
  }, [datasDisponiveis]);

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
      const totalGeral = estatisticas.totalAtendimentos;
      const percentualDoTotal = totalGeral > 0 ? ((data.quantidade / totalGeral) * 100).toFixed(1) : '0';
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`Horário: ${label}`}</p>
          <p className="text-blue-600">
            <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
            {`Atendimentos: ${data.quantidade}`}
          </p>
          <p className="text-green-600">
            <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            {`Percentual: ${percentualDoTotal}% do total geral`}
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
              Notificações por Horário de Atendimento
            </h3>
            <p className="text-sm text-gray-600">
              {dataSelecionada 
                ? `Análise do dia ${formatarDataParaExibicao(dataSelecionada)}`
                : 'Análise consolidada de todos os dias'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Botão de Exportação */}
          <ChartExportMenu
            chartId="atendimentos-por-hora"
            chartData={atendimentosPorHora.map(item => ({
              name: item.hora,
              value: item.quantidade
            }))}
            chartTitle={
              dataSelecionada 
                ? `Notificações por Horário - ${formatarDataParaExibicao(dataSelecionada)}`
                : 'Notificações por Horário - Consolidado'
            }
            buttonVariant="icon"
          />
          
          {/* ✅ NOVO: Seletor de Data */}
          <div className="flex flex-col items-end">
            <label className="text-sm text-gray-500 mb-1">Filtrar por data:</label>
            <select
              value={dataSelecionada || 'todas'}
              onChange={(e) => {
                const novaData = e.target.value === 'todas' ? null : e.target.value;
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
              {dataSelecionada 
                ? 'Dia Selecionado' 
                : 'Total Geral'
              }
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

        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Média/Hora</span>
          </div>
          <p className="text-lg font-bold text-purple-700 mt-1">
            {estatisticas.mediaHoraria}
          </p>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              Dias Disponíveis
            </span>
          </div>
          <p className="text-lg font-bold text-gray-700 mt-1">
            {datasDisponiveis.length}
          </p>
        </div>
      </div>

      {/* Gráfico */}
      <div id="atendimentos-por-hora" className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={atendimentosPorHora.map((item: any) => ({
              ...item,
              percentual: estatisticas.totalAtendimentos > 0 
                ? parseFloat(((item.quantidade / estatisticas.totalAtendimentos) * 100).toFixed(1))
                : 0
            }))} 
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorQuantidade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
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
            <YAxis 
              stroke="#64748b" 
              fontSize={12}
              allowDecimals={false}
            />
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
              dot={(props: any) => {
                if (props.payload.quantidade === 0) {
                  return <circle cx={props.cx} cy={props.cy} r={0} fill="transparent" />;
                }
                return <circle cx={props.cx} cy={props.cy} r={4} fill="#3b82f6" strokeWidth={2} />;
              }}
              activeDot={(props: any) => {
                if (props.payload.quantidade === 0) {
                  return <circle cx={props.cx} cy={props.cy} r={0} fill="transparent" />;
                }
                return <circle cx={props.cx} cy={props.cy} r={6} fill="#3b82f6" />;
              }}
            >
              <LabelList 
                dataKey="quantidade" 
                position="top" 
                style={{ fill: '#1e40af', fontWeight: 'bold', fontSize: 11 }}
                content={(props: any) => {
                  if (props.value === 0) return null;
                  return (
                    <text 
                      x={props.x} 
                      y={props.y - 10} 
                      textAnchor="middle" 
                      style={{ fill: '#1e40af', fontWeight: 'bold', fontSize: 11 }}
                    >
                      {props.value}
                    </text>
                  );
                }}
              />
            </Area>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">💡 Insights de Análise Temporal</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
          <div>
            <strong>Horário de Pico:</strong> {estatisticas.horarioPico} 
            {estatisticas.horarioPico && (
              <span className="text-blue-600"> (maior concentração)</span>
            )}
          </div>
          <div>
            <strong>Menor Fluxo:</strong> {estatisticas.horarioMenorFluxo}
            {estatisticas.horarioMenorFluxo && (
              <span className="text-green-600"> (menor atividade)</span>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          📊 Análise temporal dos atendimentos registrados no sistema por horário.
        </p>
      </div>
    </div>
  );
};

export default AtendimentosPorHoraChart;
