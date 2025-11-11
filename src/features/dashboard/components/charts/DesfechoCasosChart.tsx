// Componente de Gráfico de Desfecho dos Casos - usando endpoints existentes
import React, { useState, useEffect, useRef } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { CheckCircle } from 'lucide-react';
import ChartExportMenu from '../../../../components/common/ChartExportMenu';

interface DesfechoItem {
  descricao: string;
  valor: number;
  percentual: number;
}

interface DesfechoCasosChartProps {
  className?: string;
  toggleFilter?: (category: string, value: string, multiSelect?: boolean) => void;
  activeFilters?: Record<string, any>;
  filteredData?: any[];  exportMenu?: React.ReactNode; // 🆕 Prop opcional para menu de exportação personalizado
}

const DesfechoCasosChart: React.FC<DesfechoCasosChartProps> = ({ 
  className = "",
  exportMenu, // 🆕 Prop para menu de exportação personalizado
  toggleFilter,
  activeFilters = {},
  filteredData
}) => {
  const [data, setData] = useState<DesfechoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 🆕 Ref para rastrear estado do Ctrl em tempo real
  const ctrlPressedRef = useRef(false);

  // 🆕 Listeners globais para rastrear Ctrl/Cmd
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        ctrlPressedRef.current = true;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        ctrlPressedRef.current = false;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Cores para diferentes desfechos - mapeamento por nome
  const COLORS = [
    '#10B981', // Verde - Alta/Cura
    '#F59E0B', // Amarelo - Óbito
    '#EF4444', // Vermelho - Óbito por outras causas
    '#8B5CF6', // Roxo - Transferido
    '#6B7280', // Cinza - Outros
    '#14B8A6', // Teal
    '#F97316', // Laranja
    '#EC4899'  // Rosa
  ];

  // Função para obter cor específica baseada no nome do desfecho
  const getColorByDesfecho = (desfecho: string, index: number): string => {
    const desfechoLower = desfecho.toLowerCase();
    
    // Mapear cores específicas por tipo de desfecho
    if (desfechoLower.includes('atendido') || desfechoLower.includes('liberado') || desfechoLower.includes('alta')) {
      return '#10B981'; // Verde - para alta/liberado
    } else if (desfechoLower.includes('observacao') || desfechoLower.includes('observação')) {
      return '#3B82F6'; // Azul - para observação
    } else if (desfechoLower.includes('óbito') || desfechoLower.includes('obito')) {
      return '#EF4444'; // Vermelho - para óbito
    } else if (desfechoLower.includes('internacao') || desfechoLower.includes('internação')) {
      return '#F59E0B'; // Amarelo/Laranja - para internação
    } else if (desfechoLower.includes('transfer')) {
      return '#8B5CF6'; // Roxo - para transferência
    } else {
      // Para outros casos, usar o índice no array
      return COLORS[index % COLORS.length];
    }
  };

  // Carregar dados sempre que filteredData mudar (incluindo na montagem inicial)
  useEffect(() => {
    // Se filteredData for undefined, ainda está carregando, então aguardar
    if (filteredData !== undefined) {
      loadData();
    }
  }, [filteredData]); // Reagir a mudanças nos dados filtrados

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 🆕 CORREÇÃO: SEMPRE usar dados filtrados (mesmo se vazio), nunca fazer fallback para API
      // Isso garante que respeitamos TODOS os filtros (evento + data + outros)
      if (filteredData === undefined) {
        console.log('⏳ DesfechoCasos - Aguardando dados filtrados...');
        setLoading(false);
        return;
      }
      
      console.log('📊 DesfechoCasos - Usando dados filtrados:', filteredData.length, 'registros');
      const result = { data: filteredData };
      
      // Contar por tipo de encerramento
      const contadores: { [key: string]: { descricao: string; count: number } } = {};
      
      result.data.forEach((notificacao: any) => {
        const original = notificacao.original || notificacao;
        const tipoEncerramento = original.tipo_encerramento;
        
        if (tipoEncerramento && tipoEncerramento.descricao) {
          const descricao = tipoEncerramento.descricao;
          if (!contadores[descricao]) {
            contadores[descricao] = { descricao, count: 0 };
          }
          contadores[descricao].count++;
        }
      });
      
      const total = Object.values(contadores).reduce((acc, curr) => acc + curr.count, 0);
      
      const processedData: DesfechoItem[] = Object.values(contadores)
        .map(item => ({
          descricao: item.descricao,
          valor: item.count,
          percentual: total > 0 ? Math.round((item.count / total) * 100) : 0
        }))
        .sort((a, b) => b.valor - a.valor);
      
      setData(processedData);
    } catch (error) {
      console.error('Erro ao carregar dados de desfecho:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Função para verificar se um desfecho está filtrado
  const isDesfechoFiltered = (desfecho: string) => {
    const filterValue = activeFilters?.desfecho;
    if (Array.isArray(filterValue)) {
      return filterValue.includes(desfecho);
    }
    return filterValue === desfecho;
  };

  // 🔧 FUNÇÃO CORRIGIDA: Obter a cor baseada no filtro mantendo cor original
  const getCellColor = (desfecho: string, baseColor: string) => {
    const desfechoFilter = activeFilters?.desfecho;
    
    // Verificar se há filtro ativo (array vazio = sem filtro)
    const hasDesfechoFilter = desfechoFilter && (Array.isArray(desfechoFilter) ? desfechoFilter.length > 0 : true);
    
    // Se não há filtro ativo, usar cor original
    if (!hasDesfechoFilter) {
      return baseColor;
    }
    
    // Se este item está filtrado, usar cor original (destacada)
    if (isDesfechoFiltered(desfecho)) {
      return baseColor;
    }
    
    // Se outro item está filtrado, usar cor com 30% de opacidade
    return baseColor + "4D"; // 4D = 30% em hexadecimal
  };

  // Tooltip customizado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold">{data.descricao}</p>
          <p className="text-blue-600">{`Casos: ${data.valor}`}</p>
          <p className="text-gray-600">{`Percentual: ${data.percentual}%`}</p>
        </div>
      );
    }
    return null;
  };

  // Label customizado para o gráfico
  const renderLabel = (entry: any) => {
    if (entry.percentual > 5) { // Só mostra label se for > 5%
      return `${entry.percentual}%`;
    }
    return '';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center h-80">
          <div className="text-gray-500">Carregando dados de desfecho...</div>
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
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Desfecho dos Casos</h3>
            <p className="text-sm text-gray-600">Distribuição por tipo de encerramento</p>
          </div>
        </div>
        
        {exportMenu || (
          <ChartExportMenu 
            chartId="desfecho-casos-completo" 
            chartData={data.map(item => ({ name: item.descricao, value: item.valor }))} 
            chartTitle="Desfecho dos Casos" 
            buttonVariant="icon"
          />
        )}
      </div>

      {/* Layout Lado a Lado: Gráfico + Detalhamento */}
      <div id="desfecho-casos-completo" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico */}
        <div className="h-96">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderLabel}
                  outerRadius={120}
                  dataKey="valor"
                  onClick={(data) => {
                    console.log('🖱️ Clicou na fatia:', data);
                    if (toggleFilter && data.descricao) {
                      toggleFilter('desfecho', data.descricao, ctrlPressedRef.current);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {data.map((entry, index) => {
                    const originalColor = getColorByDesfecho(entry.descricao, index);
                    const finalColor = getCellColor(entry.descricao, originalColor);
                    
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={finalColor}
                        stroke={isDesfechoFiltered(entry.descricao) ? '#374151' : 'transparent'}
                        strokeWidth={isDesfechoFiltered(entry.descricao) ? 3 : 0}
                        style={{ 
                          cursor: 'pointer',
                          filter: isDesfechoFiltered(entry.descricao) ? 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))' : 'none'
                        }}
                      />
                    );
                  })}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(_, entry: any) =>
                    `${entry.payload.descricao} (${entry.payload.valor})`
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Nenhum dado disponível para o período selecionado</div>
            </div>
          )}
        </div>

        {/* Lista detalhada */}
        {data.length > 0 && (
          <div className="flex flex-col">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Detalhamento</h4>
            <div className="space-y-2 overflow-y-auto max-h-96">
              {data.map((item, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-3 rounded cursor-pointer transition-all hover:shadow-md ${
                    isDesfechoFiltered(item.descricao) 
                      ? 'bg-blue-100 border-2 border-blue-300 shadow-lg' 
                      : activeFilters?.desfecho 
                        ? 'bg-gray-50 opacity-60' 
                        : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => {
                    if (toggleFilter) {
                      toggleFilter('desfecho', item.descricao, ctrlPressedRef.current);
                    }
                  }}
                  title={`🎯 Clique para filtrar por: ${item.descricao}`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ 
                        backgroundColor: getCellColor(item.descricao, getColorByDesfecho(item.descricao, index)),
                        border: isDesfechoFiltered(item.descricao) ? '2px solid #374151' : 'none'
                      }}
                    />
                    <span className={`font-medium ${
                      isDesfechoFiltered(item.descricao) ? 'text-blue-900 font-semibold' : 'text-gray-700'
                    }`}>
                      {item.descricao}
                      {isDesfechoFiltered(item.descricao) && <span className="ml-2 text-blue-600">✓</span>}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${
                      isDesfechoFiltered(item.descricao) ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {item.valor}
                    </div>
                    <div className={`text-sm ${
                      isDesfechoFiltered(item.descricao) ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      {item.percentual}%
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Botão para limpar filtro */}
              {activeFilters?.desfecho && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => {
                      const filterValue = activeFilters.desfecho;
                      if (Array.isArray(filterValue) && filterValue.length > 0) {
                        toggleFilter && toggleFilter('desfecho', filterValue[0], ctrlPressedRef.current);
                      } else if (typeof filterValue === 'string') {
                        toggleFilter && toggleFilter('desfecho', filterValue, ctrlPressedRef.current);
                      }
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                  >
                    🧹 Limpar Filtro de Desfecho
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesfechoCasosChart;
