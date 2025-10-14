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
import { AlertCircle } from "lucide-react";
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
interface TiposTraumaChartProps {
  data: ChartDataItem[];
  onChartClick?: (itemName: string) => void;
  activeFilter?: string | null;
  chartId?: string;
  title?: string;
  className?: string;
  isVisible?: boolean;
  exportMenu?: React.ReactNode; // 🆕 Prop opcional para menu de exportação personalizado
}

// Componente principal
const TiposTraumaChart: React.FC<TiposTraumaChartProps> = ({
  data,
  onChartClick,
  activeFilter = null,
  chartId = "chart-trauma",
  title = "Tipos de Trauma",
  className = "bg-white p-4 rounded-lg shadow-sm",
  exportMenu, // 🆕 Prop para menu de exportação personalizado
  isVisible = true
}) => {
  const handleChartItemClick = useCallback((itemName: string) => {
    if (onChartClick) {
      onChartClick(itemName);
    }
  }, [onChartClick]);

  // Limitar aos Top 10 para o gráfico
  const limitedData = data.slice(0, 10);
  
  // Calcular total para percentuais
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Adicionar percentual a todos os dados
  const dataWithPercentage = data.map(item => ({
    ...item,
    percentual: total > 0 ? Math.round((item.value / total) * 100) : 0
  }));

  // Função para verificar se um trauma está filtrado
  const isTraumaFiltered = (trauma: string) => {
    return activeFilter === trauma;
  };

  // Função para obter cor baseada no filtro
  const getCellColor = (trauma: string, baseColor: string) => {
    const hasFilter = activeFilter;
    if (!hasFilter) return baseColor;
    if (isTraumaFiltered(trauma)) return baseColor;
    return baseColor.replace(')', ', 0.4)').replace('rgb', 'rgba');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-700" />
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
                  "Casos",
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
                  formatter={(value: number) => value.toLocaleString()}
                  style={{ fontSize: '14px', fontWeight: 'bold', fill: '#374151' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            Nenhum caso de trauma registrado
          </div>
        )}
        </div>

        {/* Lista detalhada com TODOS os traumas */}
        {dataWithPercentage.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Todos os Tipos de Trauma</h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">{/* Altura ajustada para ~3 itens */}
              {dataWithPercentage.map((item, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-3 rounded cursor-pointer transition-all duration-200 ${
                    isTraumaFiltered(item.name) 
                      ? 'bg-orange-100 border-2 border-orange-400' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => onChartClick && onChartClick(item.name)}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ 
                        backgroundColor: getCellColor(item.name, item.fill),
                        border: isTraumaFiltered(item.name) ? '2px solid #F97316' : 'none'
                      }}
                    />
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-bold text-sm">{index + 1}</span>
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

export default TiposTraumaChart;
