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
  maxItems = 15,
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

  // Limitar os dados aos primeiros N itens
  const limitedData = data.slice(0, maxItems);

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
      
      <div className="h-96" id={chartId}>
        {limitedData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={limitedData}
              layout="vertical"
              margin={{ top: 5, right: 80, left: 10, bottom: 5 }}
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
      
      <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-600">
          <span className="text-red-500 font-bold">⚠️ Atenção: </span>
          As hipóteses em <span className="text-red-500 font-bold">vermelho</span> requerem notificação imediata e vigilância rigorosa mesmo com um único caso.
          As hipóteses em <span className="text-orange-500 font-bold">laranja</span> requerem monitoramento cuidadoso.
          Todas seguem a classificação de vigilância epidemiológica do Ministério da Saúde.
        </p>
      </div>
    </div>
  );
};

export default HipotesesDiagnosticasChart;
