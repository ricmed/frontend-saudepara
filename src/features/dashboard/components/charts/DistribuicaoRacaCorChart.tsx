import React, { useState, useCallback } from "react";
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
import { Award, MousePointer, BarChart2, PieChart as PieChartIcon } from "lucide-react";
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
interface DistribuicaoRacaCorChartProps {
  data: ChartDataItem[];
  onChartClick?: (itemName: string) => void;
  activeFilter?: string | null;
  chartId?: string;
  title?: string;
  className?: string;
  exportMenu?: React.ReactNode; // 🆕 Prop opcional para menu de exportação personalizado
}

// Componente principal
const DistribuicaoRacaCorChart: React.FC<DistribuicaoRacaCorChartProps> = ({
  data,
  onChartClick,
  activeFilter = null,
  chartId = "chart-raca",
  title = "Distribuição por Raça e Cor",
  className = "bg-white p-4 rounded-lg shadow-sm md:col-span-2 lg:col-span-3",
  exportMenu // 🆕 Prop para menu de exportação personalizado
}) => {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  const toggleChartType = useCallback(() => {
    setChartType(prev => prev === 'bar' ? 'pie' : 'bar');
  }, []);

  const handleChartItemClick = useCallback((itemName: string) => {
    if (onChartClick) {
      onChartClick(itemName);
    }
  }, [onChartClick]);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-green-700" />
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
            {chartType === 'bar' ? (
              <BarChart
                data={data}
                margin={{ top: 25, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
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
                      fill={entry.fill}
                      stroke={activeFilter === entry.name ? "#000" : "none"}
                      strokeWidth={activeFilter === entry.name ? 2 : 0}
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
            ) : (
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
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
                      fill={entry.fill}
                      stroke={activeFilter === entry.name ? "#000" : "none"}
                      strokeWidth={activeFilter === entry.name ? 2 : 0}
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

export default DistribuicaoRacaCorChart;
