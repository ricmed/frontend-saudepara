// Componente de Gráfico de Desfecho dos Casos - usando endpoints existentes
import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { CheckCircle, Download } from 'lucide-react';
import NotificacaoService from '@/services/NotificacaoService';

interface DesfechoItem {
  descricao: string;
  valor: number;
  percentual: number;
}

interface DesfechoCasosChartProps {
  className?: string;
  toggleFilter?: (category: string, value: string) => void;
  activeFilters?: Record<string, any>;
  filteredData?: any[];
}

const DesfechoCasosChart: React.FC<DesfechoCasosChartProps> = ({ 
  className = "",
  toggleFilter,
  activeFilters = {},
  filteredData
}) => {
  const [data, setData] = useState<DesfechoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        console.log('📊 DesfechoCasos - Usando dados filtrados:', filteredData.length, 'registros');
        result = { data: filteredData };
      } else {
        // Usar endpoint existente de notificações para contar por tipo de encerramento
        result = await NotificacaoService.getAll(1, 1000); // Buscar muitos registros
      }
      
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
    return activeFilters?.desfecho === desfecho;
  };

  // 🔧 FUNÇÃO CORRIGIDA: Obter a cor baseada no filtro mantendo cor original
  const getCellColor = (desfecho: string, baseColor: string) => {
    const hasDesfechoFilter = activeFilters?.desfecho;
    
    // Se não há filtro ativo, usar cor original
    if (!hasDesfechoFilter) {
      return baseColor;
    }
    
    // Se este item está filtrado, usar cor original (destacada)
    if (isDesfechoFiltered(desfecho)) {
      return baseColor;
    }
    
    // Se outro item está filtrado, usar cor original com transparência
    return baseColor + "60"; // 60 = transparência ~40%
  };

  const exportToCSV = () => {
    const headers = ['Desfecho', 'Quantidade', 'Percentual'];
    const csvContent = [
      headers.join(','),
      ...data.map(item => 
        `"${item.descricao}",${item.valor},${item.percentual}%`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `desfecho-casos-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                    toggleFilter('desfecho', data.descricao);
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
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Detalhamento</h4>
          <div className="space-y-2">
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
                    toggleFilter('desfecho', item.descricao);
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
                  onClick={() => toggleFilter && toggleFilter('desfecho', activeFilters.desfecho)}
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
  );
};

export default DesfechoCasosChart;
