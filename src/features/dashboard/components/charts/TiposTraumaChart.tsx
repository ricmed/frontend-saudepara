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
      
      <div className="h-64" id={chartId}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#666" />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#666"
                width={80}
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
                {data.map((entry, i) => (
                  <Cell 
                    key={`cell-${i}`} 
                    fill={entry.fill}
                    stroke={activeFilter === entry.name ? "#000" : "none"}
                    strokeWidth={activeFilter === entry.name ? 2 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            Nenhum caso de trauma registrado
          </div>
        )}
      </div>
    </div>
  );
};

export default TiposTraumaChart;
