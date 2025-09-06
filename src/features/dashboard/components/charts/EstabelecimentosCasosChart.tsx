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
import { Building } from 'lucide-react';
import NotificacaoService from '@/services/NotificacaoService';
import ChartExportMenu from '../../../../components/common/ChartExportMenu';

interface EstabelecimentoItem {
  nome: string;
  totalCasos: number;
  percentual: number;
}

interface EstabelecimentosCasosChartProps {
  className?: string;
  toggleFilter?: (category: string, value: string) => void;
  activeFilters?: Record<string, any>;
  filteredData?: any[];  exportMenu?: React.ReactNode; // 🆕 Prop opcional para menu de exportação personalizado
}

const EstabelecimentosCasosChart: React.FC<EstabelecimentosCasosChartProps> = ({ 
  className = "",
  exportMenu, // 🆕 Prop para menu de exportação personalizado
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

  // Recarregar dados quando filteredData mudar - com dependências corretas
  useEffect(() => {
    if (filteredData && Array.isArray(filteredData) && filteredData.length > 0) {
      loadData();
    }
  }, [filteredData?.length]); // Usar apenas o length para evitar loop

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

  const getCellColor = (estabelecimento: string, baseColor: string = "#8B5CF6") => {
    // Se há filtro de unidade ativo
    const hasUnidadeFilter = activeFilters?.unidade;
    if (!hasUnidadeFilter) {
      return baseColor; // Cor normal quando não há filtro
    }
    
    // Se este estabelecimento está filtrado, usar cor destacada
    if (isEstabelecimentoFiltered(estabelecimento)) {
      return baseColor; // Manter cor original para item selecionado
    }
    
    // Outros estabelecimentos ficam com transparência reduzida
    return "rgba(139, 92, 246, 0.4)"; // Cor mais transparente mas ainda visível
  };

  // Função para obter propriedades da barra baseado no estado de filtro
  const getBarProperties = (estabelecimento: string) => {
    const isSelected = isEstabelecimentoFiltered(estabelecimento);
    
    return {
      fill: getCellColor(estabelecimento, "#8B5CF6"),
      stroke: isSelected ? "#5B21B6" : "transparent",
      strokeWidth: isSelected ? 4 : 0,
      // Remover transform que causava sobreposição
      transform: 'none',
      transformOrigin: 'center',
      // z-index normal para todos os elementos
      style: {
        transition: 'all 0.3s ease',
      },
      // Usar uma sombra suave para destaque sem sobreposição
      filter: isSelected ? 'drop-shadow(0 1px 3px rgba(91, 33, 182, 0.5))' : 'none'
    };
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
            <p className="text-sm text-gray-600">
              Top estabelecimentos notificadores
              {activeFilters?.unidade && (
                <span className="text-purple-600 font-medium ml-2">
                  • Filtrado: {activeFilters.unidade}
                </span>
              )}
            </p>
          </div>
        </div>
        
        {exportMenu || (
          <ChartExportMenu 
            chartId="estabelecimentos-casos" 
            chartData={data.map(item => ({ name: item.nome, value: item.totalCasos }))} 
            chartTitle="Estabelecimentos por Número de Casos" 
            buttonVariant="icon"
          />
        )}
      </div>

      {/* Gráfico */}
      <div id="estabelecimentos-casos" className="h-96 relative estabelecimentos-chart">
        <style>{`
          .estabelecimentos-chart .recharts-bar-rectangle:hover {
            transform-origin: center !important;
          }
          .estabelecimentos-chart .recharts-bar-rectangle {
            transition: all 0.2s ease !important;
          }
          .estabelecimentos-chart svg {
            overflow: visible !important;
          }
          .estabelecimentos-chart .recharts-bar {
            isolation: isolate;
          }
        `}</style>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 40, left: 20, bottom: 120 }}
              layout="vertical"
              onClick={(data) => {
                console.log('🖱️ Clicou na barra:', data);
                if (data && data.activePayload && data.activePayload[0] && toggleFilter) {
                  const payload = data.activePayload[0].payload;
                  console.log('🎯 Estabelecimento selecionado:', payload.nome);
                  toggleFilter('unidade', payload.nome);
                }
              }}
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
                cursor="pointer"
              >
                {data.map((entry, index) => {
                  const barProps = getBarProperties(entry.nome);
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={barProps.fill}
                      stroke={barProps.stroke}
                      strokeWidth={barProps.strokeWidth}
                      style={{
                        ...barProps.style,
                        transform: barProps.transform,
                        transformOrigin: barProps.transformOrigin,
                      }}
                    />
                  );
                })}
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
                className={`flex items-center justify-between p-3 rounded cursor-pointer transition-all duration-200 ${
                  isEstabelecimentoFiltered(item.nome) 
                    ? 'bg-purple-100 border-2 border-purple-400' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => toggleFilter?.('unidade', item.nome)}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ 
                      backgroundColor: getCellColor(item.nome, "#8B5CF6"),
                      border: isEstabelecimentoFiltered(item.nome) ? '2px solid #5B21B6' : 'none'
                    }}
                  />
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
