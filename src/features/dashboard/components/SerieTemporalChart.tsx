// Componente de Série Temporal com seletor de evento e estabelecimento
import React, { useState, useMemo, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import ChartExportMenu from '../../../components/common/ChartExportMenu';

const STORAGE_KEY = 'serie_temporal_config';

interface SerieTemporalConfig {
  selectedEvento: string;
  selectedEstabelecimento: string;
  startDate: string;
  endDate: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

interface SerieTemporalChartProps {
  notificacoes: any[];
  title?: string;
  description?: string;
  estabelecimentoOptions?: any[];
}

const SerieTemporalChart: React.FC<SerieTemporalChartProps> = ({
  notificacoes,
  title = "Série Temporal por Dia de Notificação",
  description = "Evolução diária do número de notificações",
  estabelecimentoOptions = []
}) => {
  // Carregar configuração salva do localStorage
  const loadSavedConfig = (): Partial<SerieTemporalConfig> | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      // Silencioso - erro ao carregar config não é crítico
    }
    return null;
  };

  const savedConfig = loadSavedConfig();
  
  // Estado para o estabelecimento selecionado (evento já vem filtrado do dashboard)
  const [selectedEstabelecimento, setSelectedEstabelecimento] = useState<string>(savedConfig?.selectedEstabelecimento || "todos");

  // Extrair estabelecimentos únicos das notificações
  const estabelecimentosDisponiveis = useMemo(() => {
    const estabelecimentos = new Map<string, string>();
    notificacoes.forEach((notif: any) => {
      const estabelecimentoId = notif?.original?.estabelecimento_idestabelecimento;
      if (estabelecimentoId !== undefined && estabelecimentoOptions?.length > 0) {
        const estabelecimento = estabelecimentoOptions.find(
          (e: any) => String(e.idestabelecimento) === String(estabelecimentoId)
        );
        if (estabelecimento?.nome) {
          estabelecimentos.set(String(estabelecimentoId), estabelecimento.nome);
        }
      }
    });
    return Array.from(estabelecimentos.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [notificacoes, estabelecimentoOptions]);

  // Calcular período completo (primeira até última notificação)
  const periodoCompleto = useMemo(() => {
    const hoje = new Date();
    
    if (notificacoes.length === 0) {
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(hoje.getDate() - 7);
      return {
        inicio: seteDiasAtras.toISOString().split('T')[0],
        fim: hoje.toISOString().split('T')[0]
      };
    }

    const datas: Date[] = [];

    notificacoes.forEach((notif: any) => {
      const dataCreated = notif?.created_at || notif?.original?.created_at;
      if (dataCreated) {
        const data = new Date(dataCreated);
        if (!isNaN(data.getTime())) {
          datas.push(data);
        }
      }
    });

    if (datas.length === 0) {
      return {
        inicio: hoje.toISOString().split('T')[0],
        fim: hoje.toISOString().split('T')[0]
      };
    }

    const dataMinima = new Date(Math.min(...datas.map(d => d.getTime())));
    const dataMaxima = new Date(Math.max(...datas.map(d => d.getTime())));

    return {
      inicio: dataMinima.toISOString().split('T')[0],
      fim: dataMaxima.toISOString().split('T')[0]
    };
  }, [notificacoes]);

  // Salvar configuração no localStorage sempre que mudar
  useEffect(() => {
    const config: SerieTemporalConfig = {
      selectedEvento: "todos", // Sempre todos - filtro de evento vem do dashboard
      selectedEstabelecimento,
      startDate: periodoCompleto.inicio,
      endDate: periodoCompleto.fim,
      startHour: 0,
      startMinute: 0,
      endHour: 23,
      endMinute: 59,
    };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      // Silencioso - erro ao salvar não é crítico
    }
  }, [selectedEstabelecimento, periodoCompleto.inicio, periodoCompleto.fim]);

  const [isExpanded, setIsExpanded] = useState(false);

  // Filtrar notificações por estabelecimento (evento já vem filtrado do dashboard)
  const notificacoesFiltradas = useMemo(() => {
    return notificacoes.filter(notif => {
      // Filtro de estabelecimento
      if (selectedEstabelecimento !== "todos") {
        const estabelecimentoId = notif?.original?.estabelecimento_idestabelecimento;
        if (estabelecimentoId !== undefined && estabelecimentoOptions?.length > 0) {
          const estabelecimento = estabelecimentoOptions.find(
            (e: any) => String(e.idestabelecimento) === String(estabelecimentoId)
          );
          if (estabelecimento?.nome !== selectedEstabelecimento) {
            return false;
          }
        } else {
          return false;
        }
      }
      
      return true;
    });
  }, [notificacoes, selectedEstabelecimento, estabelecimentoOptions]);

  // Processar dados para o gráfico
  const dadosGrafico = useMemo(() => {
    const timezone = 'America/Belem';
    
    const notificacoesPorDia = notificacoesFiltradas.reduce((acc: any, notif: any) => {
      const dataCreated = notif?.created_at || notif?.original?.created_at;
      if (!dataCreated) return acc;
      
      try {
        const dataLocal = new Date(dataCreated);
        const data = dataLocal.toLocaleDateString('pt-BR', {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).split('/').reverse().join('-');
        
        if (!acc[data]) {
          acc[data] = { total: 0 };
        }
        acc[data].total += 1;
      } catch (error) {
        console.warn('Erro ao processar data:', error);
      }
      
      return acc;
    }, {});
    
    return Object.entries(notificacoesPorDia)
      .map(([data, valores]: [string, any]) => ({
        data: new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        dataCompleta: data,
        quantidade: valores.total,
        percentual: ((valores.total / notificacoesFiltradas.length) * 100).toFixed(1)
      }))
      .sort((a, b) => a.dataCompleta.localeCompare(b.dataCompleta));
  }, [notificacoesFiltradas]);

  const chartData = useMemo(() => {
    return dadosGrafico.map(item => ({
      name: item.data,
      value: item.quantidade
    }));
  }, [dadosGrafico]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            {isExpanded ? 'Ocultar Filtros' : 'Filtros'}
          </button>
          <ChartExportMenu
            chartId="serie-temporal-dia"
            chartData={chartData}
            chartTitle={title}
            buttonVariant="icon"
          />
        </div>
      </div>

      {/* Seletores de Filtro (Estabelecimento apenas - Evento já filtrado pelo dashboard) */}
      {isExpanded && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {/* Seletor de Estabelecimento */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🏥 Estabelecimento
            </label>
            <select
              value={selectedEstabelecimento}
              onChange={(e) => setSelectedEstabelecimento(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="todos">🏢 Todos os Estabelecimentos</option>
              {estabelecimentosDisponiveis.map((estab) => (
                <option key={estab.id} value={estab.nome}>
                  {estab.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <div className="text-gray-700 mb-2">
              <strong>📅 Período:</strong> {new Date(periodoCompleto.inicio + 'T12:00:00').toLocaleDateString('pt-BR')} até {new Date(periodoCompleto.fim + 'T12:00:00').toLocaleDateString('pt-BR')} (Todas as datas)
            </div>
            <div className="text-gray-600 text-xs mb-1">
              <strong>Estabelecimento:</strong> {selectedEstabelecimento === "todos" ? "Todos os Estabelecimentos" : selectedEstabelecimento}
            </div>
            <div className="text-gray-600 text-xs mb-1">
              <strong>{notificacoesFiltradas.length}</strong> notificações encontradas
            </div>
            <div className="text-blue-600 text-xs mt-1">
              ℹ️ Evento já filtrado pelo dashboard principal
            </div>
          </div>
        </div>
      )}

      {/* Gráfico */}
      <div id="serie-temporal-dia" className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {dadosGrafico.length > 0 ? (
            <AreaChart data={dadosGrafico} margin={{ top: 30, right: 30, left: 20, bottom: 50 }}>
              <defs>
                <linearGradient id="colorQuantidade" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b5bdb" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b5bdb" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="data"
                stroke="#6b7280"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px'
                }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
                formatter={(value: any, name: string) => {
                  if (name === 'quantidade') return [`${value} notificações`, 'Total'];
                  return [value, name];
                }}
              />
              <Area
                type="monotone"
                dataKey="quantidade"
                stroke="#3b5bdb"
                strokeWidth={2}
                fill="url(#colorQuantidade)"
                animationDuration={800}
              >
                <LabelList
                  dataKey="quantidade"
                  position="top"
                  style={{ fill: '#3b5bdb', fontWeight: 'bold', fontSize: 12 }}
                />
              </Area>
            </AreaChart>
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-gray-500 text-lg font-medium mb-2">Nenhuma notificação encontrada</p>
              <p className="text-gray-400 text-sm text-center max-w-md">
                {notificacoes.length === 0 
                  ? "Não há notificações cadastradas no sistema"
                  : "Nenhuma notificação corresponde aos filtros selecionados. Tente ajustar o período ou os filtros acima."
                }
              </p>
            </div>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SerieTemporalChart;
