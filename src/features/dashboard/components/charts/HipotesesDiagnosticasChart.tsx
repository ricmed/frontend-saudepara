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
import { BookOpen } from "lucide-react";
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
interface HipotesesDiagnosticasChartProps {
  data: ChartDataItem[];
  onChartClick?: (itemName: string) => void;
  activeFilter?: string | null;
  chartId?: string;
  title?: string;
  className?: string;
  maxItems?: number;
  isVisible?: boolean;
  exportMenu?: React.ReactNode; // 🆕 Prop opcional para menu de exportação personalizado
  COLORS?: {
    alarmante: string;
    alerta: string;
    medio: string;
    normal: string;
  };
}

// Componente principal
const HipotesesDiagnosticasChart: React.FC<HipotesesDiagnosticasChartProps> = ({
  data,
  onChartClick,
  activeFilter = null,
  chartId = "chart-hipoteses",
  title = "Hipóteses Diagnósticas",
  className = "bg-white p-4 rounded-lg shadow-sm",
  exportMenu, // 🆕 Prop para menu de exportação personalizado
  maxItems = 10,  // Alterado de 15 para 10 para consistência com outros gráficos
  isVisible = true,
  COLORS = {
    alarmante: "#d32f2f",
    alerta: "#f57c00",
    medio: "#1976d2",
    normal: "#388e3c"
  }
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

  // Função para verificar se uma hipótese está filtrada
  const isHipoteseFiltered = (hipotese: string) => {
    return activeFilter === hipotese;
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-purple-700" />
          <h3 className="text-sm font-medium text-gray-700">
            {title}
            {activeFilter && (
              <span className="text-purple-600 font-medium ml-2">
                • Filtrado: {activeFilter}
              </span>
            )}
          </h3>
        </div>
        <div className="flex gap-2">          {exportMenu || (
            <ChartExportMenu 
              chartId={chartId} 
              chartData={data}
              chartTitle={title}
              buttonVariant="icon"
            />
          )}
          <div className="flex ml-2 space-x-2 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-1" style={{backgroundColor: COLORS.alarmante}}></div>
              <span>Crítica</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-1" style={{backgroundColor: COLORS.alerta}}></div>
              <span>Alta</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-1" style={{backgroundColor: COLORS.medio}}></div>
              <span>Média</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-1" style={{backgroundColor: COLORS.normal}}></div>
              <span>Normal</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Container completo para exportação - inclui gráfico + lista detalhada */}
      <div id={chartId}>
        <div className="h-96">
          {limitedData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={limitedData}
                layout="vertical"
                margin={{ top: 5, right: 100, left: 10, bottom: 5 }}
                barCategoryGap="15%"
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
                width={220}
                interval={0}
                tick={{ fontSize: 11 }}
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
                    fill={entry.fill}
                    stroke={activeFilter === entry.name ? "#000" : (entry.isAlarmante ? "#b71c1c" : "none")}
                    strokeWidth={activeFilter === entry.name ? 2 : (entry.isAlarmante ? 2 : 0)}
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
            Não há dados disponíveis para exibir
          </div>
        )}
        </div>

        {/* Lista detalhada de todas as hipóteses diagnósticas */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Todas as Hipóteses Diagnósticas
          </h4>
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
            {dataWithPercentage.map((item, index) => {
              const isFiltered = isHipoteseFiltered(item.name);
              // Usar a mesma cor que está no item do gráfico
              const chartItem = limitedData.find(d => d.name === item.name);
              const fillColor = chartItem?.fill || '#9CA3AF';
              const isAlarmante = chartItem?.isAlarmante || false;
              
              // Determinar classes de borda baseadas na criticidade
              let borderColorClass = 'border-gray-400';
              let bgColorClass = 'bg-gray-100';
              
              if (isAlarmante) {
                borderColorClass = 'border-red-500';
                bgColorClass = 'bg-red-50';
              } else if (fillColor.includes('#F59E0B') || fillColor.includes('#FB923C')) {
                borderColorClass = 'border-orange-400';
                bgColorClass = 'bg-orange-50';
              } else if (fillColor.includes('#10B981')) {
                borderColorClass = 'border-green-400';
                bgColorClass = 'bg-green-50';
              } else if (fillColor.includes('#8B5CF6') || fillColor.includes('#A78BFA')) {
                borderColorClass = 'border-purple-400';
                bgColorClass = 'bg-purple-50';
              }
              
              return (
                <div
                  key={item.name}
                  onClick={() => handleChartItemClick(item.name)}
                  className={`p-3 rounded-lg border-l-4 transition-all cursor-pointer ${borderColorClass} ${bgColorClass} ${
                    isFiltered 
                      ? 'ring-2 ring-purple-500 shadow-md' 
                      : 'hover:shadow-sm'
                  }`}
                  style={{ 
                    opacity: activeFilter && !isFiltered ? 0.5 : 1
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className={`text-xs font-bold ${
                        index < 3 ? 'text-purple-700' : 'text-gray-600'
                      }`}>
                        #{index + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-800">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-900">
                        {item.value}
                      </span>
                      <span className="text-xs font-medium text-purple-600 bg-white px-2 py-1 rounded">
                        {item.percentual}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600">
            <span className="text-red-500 font-bold">⚠️ Atenção: </span>
            As hipóteses em <span className="text-red-500 font-bold">vermelho</span> requerem notificação imediata e vigilância rigorosa mesmo com um único caso.
            As hipóteses em <span className="text-orange-500 font-bold">laranja</span> requerem monitoramento cuidadoso.
            Todas seguem a classificação de vigilância epidemiológica do Ministério da Saúde.
          </p>
        </div>
      </div>{/* Fim do container de exportação */}
    </div>
  );
};

export default HipotesesDiagnosticasChart;
