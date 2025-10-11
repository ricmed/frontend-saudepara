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

  // Limitar os dados aos primeiros N itens
  const limitedData = data.slice(0, maxItems);

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
        {limitedData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={limitedData}
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
                    fill={entry.fill}
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
    </div>
  );
};

export default PrincipaisSintomasChart;
