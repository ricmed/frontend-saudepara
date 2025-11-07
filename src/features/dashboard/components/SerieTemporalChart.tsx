// Componente de Série Temporal com seletor de período e evento próprios
import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, ChevronUp, ChevronDown } from 'lucide-react';
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
}

const SerieTemporalChart: React.FC<SerieTemporalChartProps> = ({
  notificacoes,
  title = "Série Temporal por Dia de Notificação",
  description = "Evolução diária do número de notificações"
}) => {
  // Carregar configuração salva do localStorage
  const loadSavedConfig = (): Partial<SerieTemporalConfig> | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('📦 Configuração da Série Temporal carregada:', parsed);
        return parsed;
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar configuração da Série Temporal:', error);
    }
    return null;
  };

  const savedConfig = loadSavedConfig();
  
  // Estado para o evento selecionado
  const [selectedEvento, setSelectedEvento] = useState<string>(savedConfig?.selectedEvento || "todos");

  // Extrair eventos únicos das notificações
  const eventosDisponiveis = useMemo(() => {
    const eventos = new Set<string>();
    notificacoes.forEach((notif: any) => {
      const evento = notif?.tipoEvento || notif?.original?.tipo_evento?.descricao;
      if (evento) {
        eventos.add(evento);
      }
    });
    console.log('📋 Eventos disponíveis na Série Temporal:', Array.from(eventos));
    return Array.from(eventos).sort();
  }, [notificacoes]);

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

  // Estado para o período personalizado da série temporal
  const [startDate, setStartDate] = useState(savedConfig?.startDate || periodoCompleto.inicio);
  const [endDate, setEndDate] = useState(savedConfig?.endDate || periodoCompleto.fim);
  const [startHour, setStartHour] = useState(savedConfig?.startHour ?? 0);
  const [startMinute, setStartMinute] = useState(savedConfig?.startMinute ?? 0);
  const [endHour, setEndHour] = useState(savedConfig?.endHour ?? 23);
  const [endMinute, setEndMinute] = useState(savedConfig?.endMinute ?? 59);

  // Salvar configuração no localStorage sempre que mudar
  useEffect(() => {
    const config: SerieTemporalConfig = {
      selectedEvento,
      startDate,
      endDate,
      startHour,
      startMinute,
      endHour,
      endMinute,
    };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      console.log('💾 Configuração da Série Temporal salva:', config);
    } catch (error) {
      console.warn('⚠️ Erro ao salvar configuração da Série Temporal:', error);
    }
  }, [selectedEvento, startDate, endDate, startHour, startMinute, endHour, endMinute]);

  // Atualizar datas quando o período completo mudar
  useEffect(() => {
    setStartDate(periodoCompleto.inicio);
    setEndDate(periodoCompleto.fim);
  }, [periodoCompleto]);

  const [isExpanded, setIsExpanded] = useState(false);

  // Funções para incrementar/decrementar datas
  const incrementStartDate = () => {
    const date = new Date(startDate + 'T00:00:00');
    date.setDate(date.getDate() + 1);
    setStartDate(date.toISOString().split('T')[0]);
  };

  const decrementStartDate = () => {
    const date = new Date(startDate + 'T00:00:00');
    date.setDate(date.getDate() - 1);
    setStartDate(date.toISOString().split('T')[0]);
  };

  const incrementEndDate = () => {
    const date = new Date(endDate + 'T00:00:00');
    date.setDate(date.getDate() + 1);
    setEndDate(date.toISOString().split('T')[0]);
  };

  const decrementEndDate = () => {
    const date = new Date(endDate + 'T00:00:00');
    date.setDate(date.getDate() - 1);
    setEndDate(date.toISOString().split('T')[0]);
  };

  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    event.target.select();
  };

  // Filtrar notificações por evento e período com janelas de 24h
  const notificacoesFiltradas = useMemo(() => {
    return notificacoes.filter(notif => {
      // Filtro de data/hora
      const dataCreated = notif?.created_at || notif?.original?.created_at;
      if (!dataCreated) return false;
      
      const date = new Date(dataCreated);
      
      // Criar o timestamp de início e fim do período com horário de corte
      // Ex: 01/10 16:01 até 10/10 16:00
      const inicioTimestamp = new Date(`${startDate}T${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}:00`);
      
      // O fim é no dia seguinte ao endDate no mesmo horário
      const fimDate = new Date(endDate + 'T00:00:00');
      fimDate.setDate(fimDate.getDate() + 1); // Adiciona 1 dia
      const fimTimestamp = new Date(`${fimDate.toISOString().split('T')[0]}T${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}:00`);
      
      // Verificar se a notificação está dentro do período total
      if (date < inicioTimestamp || date > fimTimestamp) {
        return false;
      }
      
      // Filtro de evento
      if (selectedEvento === "todos") {
        return true;
      }
      
      const eventoNotif = notif?.tipoEvento || notif?.original?.tipo_evento?.descricao;
      return eventoNotif === selectedEvento;
    });
  }, [notificacoes, startDate, endDate, startHour, startMinute, endHour, endMinute, selectedEvento]);

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
            {isExpanded ? 'Ocultar Período' : 'Período'}
          </button>
          <ChartExportMenu
            chartId="serie-temporal-dia"
            chartData={chartData}
            chartTitle={title}
            buttonVariant="icon"
          />
        </div>
      </div>

      {/* Seletor de Período e Evento */}
      {isExpanded && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {/* Seletor de Evento */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🎯 Evento
            </label>
            <select
              value={selectedEvento}
              onChange={(e) => setSelectedEvento(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="todos">📊 Todos os Eventos</option>
              {eventosDisponiveis.map((evento) => (
                <option key={evento} value={evento}>
                  {evento}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data de Início */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📅 Data de Início
              </label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  onFocus={handleInputFocus}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={incrementStartDate}
                    className="text-gray-500 hover:text-blue-600 focus:outline-none p-1"
                    title="Próximo dia"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={decrementStartDate}
                    className="text-gray-500 hover:text-blue-600 focus:outline-none p-1"
                    title="Dia anterior"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {/* Hora e Minuto de Início */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">🕐 Hora Início</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={startHour}
                    onChange={(e) => setStartHour(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                    onFocus={handleInputFocus}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">⏱️ Min Início</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={startMinute}
                    onChange={(e) => setStartMinute(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    onFocus={handleInputFocus}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                  />
                </div>
              </div>
            </div>

            {/* Data de Fim */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏁 Data de Fim
              </label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  onFocus={handleInputFocus}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={incrementEndDate}
                    className="text-gray-500 hover:text-blue-600 focus:outline-none p-1"
                    title="Próximo dia"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={decrementEndDate}
                    className="text-gray-500 hover:text-blue-600 focus:outline-none p-1"
                    title="Dia anterior"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {/* Hora e Minuto de Fim */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">🕐 Hora Fim</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={endHour}
                    onChange={(e) => setEndHour(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                    onFocus={handleInputFocus}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">⏱️ Min Fim</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={endMinute}
                    onChange={(e) => setEndMinute(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    onFocus={handleInputFocus}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <div className="text-gray-700 mb-2">
              <strong>📅 Período:</strong> {new Date(startDate + 'T12:00:00').toLocaleDateString('pt-BR')} às {String(startHour).padStart(2, '0')}:{String(startMinute).padStart(2, '0')} até {new Date(endDate + 'T12:00:00').toLocaleDateString('pt-BR')} às {String(endHour).padStart(2, '0')}:{String(endMinute).padStart(2, '0')}
            </div>
            <div className="text-gray-600 text-xs">
              <strong>Evento:</strong> {selectedEvento === "todos" ? "Todos os Eventos" : selectedEvento}
              {' '}•{' '}
              <strong>{notificacoesFiltradas.length}</strong> notificações encontradas
            </div>
            <div className="text-blue-600 text-xs mt-1">
              💡 Cada "dia" é uma janela de 24h iniciando no horário de corte especificado
            </div>
          </div>
        </div>
      )}

      {/* Gráfico */}
      <div id="serie-temporal-dia" className="h-80">
        {dadosGrafico.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
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
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Nenhuma notificação encontrada no período selecionado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SerieTemporalChart;
