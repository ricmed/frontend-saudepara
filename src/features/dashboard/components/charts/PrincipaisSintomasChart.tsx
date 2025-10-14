import React, { useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { Heart } from "lucide-react";
import ChartExportMenu from '../../../../components/common/ChartExportMenu';

// Interface para os dados do gráfico
interface ChartDataItem {
  name: string;
  value: number;
  fill: string;
  isAlarmante?: boolean;
  original?: any;
}

// Interface das props do componente
interface PrincipaisSintomasChartProps {
  data: ChartDataItem[];
  onChartClick?: (itemName: string) => void;
  activeFilter?: string | null;
  chartId?: string;
  title?: string;
  className?: string;
  maxItems?: number;
  isVisible?: boolean;
  exportMenu?: React.ReactNode; // 🆕 Prop opcional para menu de exportação personalizado
}

// Componente principal
const PrincipaisSintomasChart: React.FC<PrincipaisSintomasChartProps> = ({
  data,
  onChartClick,
  activeFilter = null,
  chartId = "chart-sintomas",
  title = "Principais Sinais e Sintomas",
  className = "bg-white p-4 rounded-lg shadow-sm",
  exportMenu, // 🆕 Prop para menu de exportação personalizado
  maxItems = 10,
  isVisible = true
}) => {
  const handleChartItemClick = useCallback((itemName: string) => {
    if (onChartClick) {
      onChartClick(itemName);
    }
  }, [onChartClick]);

  // Limitar os dados aos primeiros N itens para o gráfico
  const limitedData = data.slice(0, maxItems);
  
  // Calcular total para percentuais
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Adicionar percentual a todos os dados
  const dataWithPercentage = data.map(item => ({
    ...item,
    percentual: total > 0 ? Math.round((item.value / total) * 100) : 0
  }));

  // Função para verificar se um sintoma está filtrado
  const isSintomaFiltered = (sintoma: string) => {
    return activeFilter === sintoma;
  };

  // Função para obter cor baseada no filtro
  const getCellColor = (sintoma: string, baseColor: string) => {
    const hasFilter = activeFilter;
    if (!hasFilter) return baseColor;
    if (isSintomaFiltered(sintoma)) return baseColor;
    return baseColor.replace(')', ', 0.4)').replace('rgb', 'rgba');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-700" />
          <h3 className="text-sm font-medium text-gray-700">
            {title}
            {activeFilter && (
              <span className="text-red-600 font-medium ml-2">
                • Filtrado: {activeFilter}
              </span>
            )}
          </h3>
        </div>          {exportMenu || (
            <ChartExportMenu 
              chartId={chartId} 
              chartData={data}
              chartTitle={title}
              buttonVariant="icon"
            />
          )}
      </div>
      
      {/* Container completo para exportação - inclui gráfico + lista detalhada */}
      <div id={chartId}>
        <div className="h-96">
          {limitedData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={limitedData}
                layout="vertical"
                margin={{ top: 10, right: 40, left: 10, bottom: 10 }}
                barCategoryGap="20%"
              >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                type="number" 
                stroke="#666" 
                allowDecimals={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#666"
                width={150}
                interval={0}
                tick={{ fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #ddd",
                }}
                formatter={(value) => [
                  value.toLocaleString(),
                  "Notificações",
                ]}
              />
              <Bar
                dataKey="value"
                onClick={(data) => {
                  if (data && data.name) {
                    handleChartItemClick(data.name);
                  }
                }}
                cursor="pointer"
              >
                {limitedData.map((entry, i) => (
                  <Cell 
                    key={`cell-${i}`} 
                    fill={getCellColor(entry.name, entry.fill)}
                    stroke={activeFilter === entry.name ? "#000" : "none"}
                    strokeWidth={activeFilter === entry.name ? 2 : 0}
                  />
                ))}
                <LabelList 
                  dataKey="value" 
                  position="right" 
                  style={{ 
                    fontSize: '14px', 
                    fontWeight: 'bold',
                    fill: '#374151'
                  }}
                  formatter={(value: number) => value.toLocaleString()}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            Não há dados disponíveis para exibir
          </div>
        )}
        </div>

        {/* Lista detalhada com TODOS os sintomas */}
        {dataWithPercentage.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Todos os Sinais e Sintomas</h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">{/* Altura ajustada para ~3 itens */}
              {dataWithPercentage.map((item, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-3 rounded cursor-pointer transition-all duration-200 ${
                    isSintomaFiltered(item.name) 
                      ? 'bg-red-100 border-2 border-red-400' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => onChartClick && onChartClick(item.name)}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ 
                        backgroundColor: getCellColor(item.name, item.fill),
                        border: isSintomaFiltered(item.name) ? '2px solid #DC2626' : 'none'
                      }}
                    />
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-bold text-sm">{index + 1}</span>
                    </div>
                    <span className="font-medium text-sm">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{item.value}</div>
                    <div className="text-sm text-gray-600">{item.percentual}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>{/* Fim do container de exportação */}
    </div>
  );
};

export default PrincipaisSintomasChart;
