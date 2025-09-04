// Componente de Gráfico de Estabelecimentos por Número de Casos - usando endpoints existentes
import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Building, Download } from 'lucide-react';
import NotificacaoService from '@/services/NotificacaoService';

interface EstabelecimentoItem {
  nome: string;
  totalCasos: number;
  percentual: number;
}

interface EstabelecimentosCasosChartProps {
  className?: string;
  toggleFilter?: (category: string, value: string) => void;
  activeFilters?: Record<string, any>;
  filteredData?: any[];
}

const EstabelecimentosCasosChart: React.FC<EstabelecimentosCasosChartProps> = ({ 
  className = "",
  toggleFilter,
  activeFilters = {},
  filteredData
}) => {
  const [data, setData] = useState<EstabelecimentoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Recarregar dados quando filteredData mudar (apenas se não há filtros ativos nos novos gráficos)
  useEffect(() => {
    if (filteredData && !activeFilters?.unidade) {
      loadData();
    }
  }, [filteredData, activeFilters?.unidade]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Usar dados filtrados se disponíveis, senão buscar todos
      let result;
      if (filteredData && filteredData.length > 0) {
        console.log('📊 EstabelecimentosCasos - Usando dados filtrados:', filteredData.length, 'registros');
        result = { data: filteredData };
      } else {
        // Usar endpoint existente de notificações para contar por estabelecimento
        result = await NotificacaoService.getAll(1, 1000); // Buscar muitos registros
      }
      
      // Contar por estabelecimento
      const contadores: { [key: string]: { nome: string; count: number } } = {};
      
      result.data.forEach((notificacao: any) => {
        const original = notificacao.original || notificacao;
        const estabelecimento = original.estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento ||
                              original.estabelecimento;
        
        if (estabelecimento && estabelecimento.nome) {
          const nome = estabelecimento.nome;
          if (!contadores[nome]) {
            contadores[nome] = { nome, count: 0 };
          }
          contadores[nome].count++;
        }
      });
      
      const total = Object.values(contadores).reduce((acc, curr) => acc + curr.count, 0);
      
      const processedData: EstabelecimentoItem[] = Object.values(contadores)
        .map(item => ({
          nome: item.nome,
          totalCasos: item.count,
          percentual: total > 0 ? Math.round((item.count / total) * 100) : 0
        }))
        .sort((a, b) => b.totalCasos - a.totalCasos)
        .slice(0, 15); // Pegar apenas os top 15
      
      setData(processedData);
    } catch (error) {
      console.error('Erro ao carregar dados de estabelecimentos:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Estabelecimento', 'Total de Casos', 'Percentual'];
    const csvContent = [
      headers.join(','),
      ...data.map(item => 
        `"${item.nome}",${item.totalCasos},${item.percentual}%`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `estabelecimentos-casos-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Tooltip customizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg max-w-xs">
          <p className="font-semibold text-wrap">{label}</p>
          <p className="text-blue-600">{`Casos: ${data.totalCasos}`}</p>
          <p className="text-gray-600">{`Percentual: ${data.percentual}%`}</p>
        </div>
      );
    }
    return null;
  };

  // Função para truncar nomes longos
  const truncateName = (name: string, maxLength: number = 25) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  const isEstabelecimentoFiltered = (estabelecimento: string) => {
    return activeFilters?.unidade === estabelecimento;
  };

  const getBarColor = (estabelecimento: string) => {
    if (!activeFilters || Object.keys(activeFilters).length === 0) {
      return "#8B5CF6";
    }
    return isEstabelecimentoFiltered(estabelecimento) ? "#7C3AED" : "#C4B5FD";
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center h-80">
          <div className="text-gray-500">Carregando dados de estabelecimentos...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center h-80">
          <div className="text-red-500">Erro: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building className="h-6 w-6 text-purple-600" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Estabelecimentos por Casos</h3>
            <p className="text-sm text-gray-600">Top estabelecimentos notificadores</p>
          </div>
        </div>
        
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          title="Exportar dados"
        >
          <Download className="h-4 w-4" />
          CSV
        </button>
      </div>

      {/* Gráfico */}
      <div className="h-96">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 120 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                type="category"
                dataKey="nome"
                width={150}
                tickFormatter={(value) => truncateName(value, 20)}
                fontSize={11}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="totalCasos" 
                radius={[0, 4, 4, 0]}
                onClick={(data) => {
                  if (data && data.activePayload && data.activePayload[0] && toggleFilter) {
                    const payload = data.activePayload[0].payload;
                    toggleFilter('unidade', payload.nome);
                  }
                }}
                cursor="pointer"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBarColor(entry.nome)}
                    stroke={isEstabelecimentoFiltered(entry.nome) ? "#5B21B6" : "transparent"}
                    strokeWidth={isEstabelecimentoFiltered(entry.nome) ? 2 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Nenhum dado disponível para o período selecionado</div>
          </div>
        )}
      </div>

      {/* Lista detalhada */}
      {data.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Top Estabelecimentos</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {data.map((item, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-sm">{index + 1}</span>
                  </div>
                  <span className="font-medium text-sm">{item.nome}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{item.totalCasos}</div>
                  <div className="text-sm text-gray-600">{item.percentual}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EstabelecimentosCasosChart;
