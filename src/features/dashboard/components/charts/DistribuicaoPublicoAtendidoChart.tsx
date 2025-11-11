import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";
import { Briefcase, MousePointer, BarChart2, PieChart as PieChartIcon } from "lucide-react";
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
interface DistribuicaoPublicoAtendidoChartProps {
  data: ChartDataItem[];
  onChartClick?: (itemName: string, multiSelect?: boolean) => void;
  activeFilter?: string | string[] | null;
  chartId?: string;
  title?: string;
  className?: string;
  exportMenu?: React.ReactNode; // 🆕 Prop opcional para menu de exportação personalizado
}

// Componente principal
const DistribuicaoPublicoAtendidoChart: React.FC<DistribuicaoPublicoAtendidoChartProps> = ({
  data,
  onChartClick,
  activeFilter = null,
  chartId = "chart-publico-atendido",
  title = "Distribuição por Público Atendido",
  exportMenu // 🆕 Prop exportMenu opcional
}) => {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('pie');
  
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

  const toggleChartType = useCallback(() => {
    setChartType(prev => prev === 'bar' ? 'pie' : 'bar');
  }, []);

  const handleChartItemClick = useCallback((itemName: string) => {
    if (onChartClick) {
      onChartClick(itemName, ctrlPressedRef.current);
    }
  }, [onChartClick]);
  
  // Função para verificar se um item está filtrado
  const isItemFiltered = (item: string) => {
    if (Array.isArray(activeFilter)) {
      return activeFilter.includes(item);
    }
    return activeFilter === item;
  };

  // Função para obter cor baseada no filtro
  const getCellColor = (item: string, baseColor: string) => {
    const hasFilter = activeFilter && (Array.isArray(activeFilter) ? activeFilter.length > 0 : true);
    if (!hasFilter) return baseColor;
    if (isItemFiltered(item)) return baseColor;
    // Adicionar 30% de opacidade
    return baseColor + "4D";
  };

  return (
    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm sm:col-span-2 lg:col-span-2 xl:col-span-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-700" />
          <h3 className="text-xs sm:text-sm font-medium text-gray-700">
            {title}
          </h3>
          <MousePointer className="h-3 w-3 text-blue-500 opacity-60" />
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <button 
            onClick={toggleChartType}
            className="p-1 text-gray-500 hover:text-blue-500 transition-colors"
            title="Alternar tipo de gráfico"
          >
            {chartType === 'bar' ? 
              <PieChartIcon className="h-4 w-4" /> : 
              <BarChart2 className="h-4 w-4" />}
          </button>
          {/* 🆕 Usar exportMenu customizado se fornecido, senão usar o padrão */}
          {exportMenu || (
            <ChartExportMenu 
              chartId={chartId} 
              chartData={data}
              chartTitle={title}
              buttonVariant="icon"
            />
          )}
        </div>
      </div>
      
      <div className="h-64" id={chartId}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'pie' ? (
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                  }
                  onClick={(data) => {
                    if (data && data.name) {
                      handleChartItemClick(data.name);
                    }
                  }}
                  cursor="pointer"
                >
                  {data.map((entry, i) => (
                    <Cell 
                      key={`cell-${i}`} 
                      fill={getCellColor(entry.name, entry.fill)}
                      stroke={isItemFiltered(entry.name) ? "#000" : "none"}
                      strokeWidth={isItemFiltered(entry.name) ? 3 : 0}
                    />
                  ))}
                </Pie>
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
              </PieChart>
            ) : (
              <BarChart
                data={data}
                margin={{ top: 30, right: 30, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  stroke="#666" 
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 11 }}
                />
                <YAxis stroke="#666" allowDecimals={false} />
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
                  radius={[4, 4, 0, 0]}
                  onClick={(data) => {
                    if (data && data.name) {
                      handleChartItemClick(data.name);
                    }
                  }}
                  cursor="pointer"
                >
                  {data.map((entry, i) => (
                    <Cell 
                      key={`cell-${i}`} 
                      fill={getCellColor(entry.name, entry.fill)}
                      stroke={isItemFiltered(entry.name) ? "#000" : "none"}
                      strokeWidth={isItemFiltered(entry.name) ? 4 : 0}
                    />
                  ))}
                  <LabelList 
                    dataKey="value" 
                    position="top" 
                    style={{ 
                      fontSize: '14px', 
                      fontWeight: 'bold',
                      fill: '#374151'
                    }}
                    formatter={(value: number) => value.toLocaleString()}
                  />
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            Não há dados disponíveis para exibir
          </div>
        )}
      </div>
    </div>
  );
};

export default DistribuicaoPublicoAtendidoChart;
