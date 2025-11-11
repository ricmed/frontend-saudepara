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
import { User, MousePointer, BarChart2, PieChart as PieChartIcon } from "lucide-react";
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
interface DistribuicaoSexoChartProps {
  data: ChartDataItem[];
  onChartClick?: (itemName: string, multiSelect?: boolean) => void;
  activeFilter?: string | string[] | null;
  chartId?: string;
  title?: string;
  className?: string;
  exportMenu?: React.ReactNode; // 🆕 Prop opcional para menu de exportação personalizado
}

// Componente principal
const DistribuicaoSexoChart: React.FC<DistribuicaoSexoChartProps> = ({
  data,
  onChartClick,
  activeFilter = null,
  chartId = "chart-genero",
  title = "Distribuição por Identidade de Gênero",
  className = "bg-white p-4 rounded-lg shadow-sm md:col-span-2 lg:col-span-2",
  exportMenu // 🆕 Prop para menu de exportação personalizado
}) => {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const ctrlPressedRef = useRef(false);

  // Rastrear tecla Ctrl pressionada
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        ctrlPressedRef.current = true;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
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
      // Usar ctrlPressedRef.current para garantir o valor mais atualizado
      onChartClick(itemName, ctrlPressedRef.current);
    }
  }, [onChartClick]);

  // Função auxiliar para verificar se um item está selecionado
  const isItemSelected = (itemName: string): boolean => {
    if (Array.isArray(activeFilter)) {
      return activeFilter.includes(itemName);
    }
    return activeFilter === itemName;
  };

  // Função para obter a cor do item (com opacidade reduzida se não selecionado)
  const getItemFillColor = (itemName: string, baseColor: string): string => {
    const hasFilter = activeFilter && (Array.isArray(activeFilter) ? activeFilter.length > 0 : true);
    if (!hasFilter) return baseColor;
    if (isItemSelected(itemName)) return baseColor;
    return baseColor + "4D";
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-blue-700" />
          <h3 className="text-sm font-medium text-gray-700">
            {title}
          </h3>
          <MousePointer className="h-3 w-3 text-blue-500 opacity-60" />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={toggleChartType}
            className="p-1 text-gray-500 hover:text-blue-500 transition-colors"
            title="Alternar tipo de gráfico"
          >
            {chartType === 'bar' ? 
              <PieChartIcon className="h-4 w-4" /> : 
              <BarChart2 className="h-4 w-4" />}
          </button>
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
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                  }
                  cursor="pointer"
                  onClick={(data) => {
                    if (data && data.name) {
                      handleChartItemClick(data.name);
                    }
                  }}
                >
                  {data.map((entry, i) => {
                    const fillColor = getItemFillColor(entry.name, entry.fill);
                    const selected = isItemSelected(entry.name);
                    return (
                      <Cell 
                        key={`cell-${i}-${entry.name}-${selected}`}
                        fill={fillColor}
                        stroke={selected ? "#000" : "none"}
                        strokeWidth={selected ? 2 : 0}
                      />
                    );
                  })}
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
                layout="vertical"
                margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
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
                  width={100}
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
                  radius={[0, 4, 4, 0]}
                  onClick={(data) => {
                    if (data && data.name) {
                      handleChartItemClick(data.name);
                    }
                  }}
                  cursor="pointer"
                >
                  {data.map((entry, i) => {
                    const fillColor = getItemFillColor(entry.name, entry.fill);
                    const selected = isItemSelected(entry.name);
                    return (
                      <Cell 
                        key={`cell-${i}-${entry.name}-${selected}`}
                        fill={fillColor}
                        stroke={selected ? "#000" : "none"}
                        strokeWidth={selected ? 2 : 0}
                      />
                    );
                  })}
                  <LabelList
                    dataKey="value"
                    position="right"
                    formatter={(value: number) => value.toLocaleString()}
                    style={{ fontSize: '14px', fontWeight: 'bold', fill: '#374151' }}
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

export default DistribuicaoSexoChart;
