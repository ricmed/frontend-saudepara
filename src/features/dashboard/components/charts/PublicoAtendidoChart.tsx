import React, { useState } from "react";
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
} from "recharts";
import { Users, Filter, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import ChartExportMenu from '../../../../components/common/ChartExportMenu';
import { useChartData } from "../../hooks/useChartData";

// Interface das props do componente (simplificada - dados vêm do contexto)
interface PublicoAtendidoChartProps {
  rawData: any[]; // Dados brutos para processamento
  chartId?: string;
  title?: string;
  className?: string;
  isVisible?: boolean;
  showToggle?: boolean;
  exportMenu?: React.ReactNode; // 🆕 Prop opcional para menu de exportação personalizado
}

// Componente principal (com contexto global)
const PublicoAtendidoChart: React.FC<PublicoAtendidoChartProps> = ({
  rawData,
  chartId = "chart-publico-atendido",
  title = "Distribuição por Público Atendido",
  className = "bg-white p-4 rounded-lg shadow-sm",
  exportMenu, // 🆕 Prop para menu de exportação personalizado
  isVisible = true,
  showToggle = true
}) => {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  
  // Usar o hook do contexto para obter dados filtrados e funções
  const {
    data,
    activeFilter,
    handleClick,
    isItemActive,
    hasActiveFilters,
    isCurrentChartFiltered,
  } = useChartData('publico', rawData);

  const toggleChartType = () => {
    setChartType(prev => prev === 'bar' ? 'pie' : 'bar');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`${className} ${hasActiveFilters ? 'ring-2 ring-blue-200' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-700" />
          <h3 className="text-sm font-medium text-gray-700">
            {title}
          </h3>
          {isCurrentChartFiltered && (
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-full">
              <Filter className="h-3 w-3 text-blue-600" />
              <span className="text-xs text-blue-600">Filtrado</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">          {exportMenu || (
            <ChartExportMenu 
              chartId={chartId} 
              chartData={data}
              chartTitle={title}
              buttonVariant="icon"
            />
          )}
          
          {showToggle && (
            <div className="flex bg-gray-100 rounded-md p-1">
              <button
                onClick={toggleChartType}
                className={`p-1 rounded ${
                  chartType === 'bar' 
                    ? 'bg-white shadow-sm text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Gráfico de Barras"
              >
                <BarChart3 className="h-4 w-4" />
              </button>
              <button
                onClick={toggleChartType}
                className={`p-1 rounded ${
                  chartType === 'pie' 
                    ? 'bg-white shadow-sm text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Gráfico de Pizza"
              >
                <PieChartIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="h-64" id={chartId}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={data} margin={{ top: 30, right: 30, left: 20, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  stroke="#666"
                  interval={0}
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#666" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #ddd",
                  }}
                  formatter={(value) => [
                    value.toLocaleString(),
                    "Registros",
                  ]}
                />
                <Bar
                  dataKey="value"
                  onClick={(data) => {
                    if (data && data.name) {
                      handleClick(data.name);
                    }
                  }}
                  cursor="pointer"
                >
                  {data.map((entry, i) => (
                    <Cell 
                      key={`cell-${i}`} 
                      fill={entry.fill}
                      stroke={isItemActive(entry.name) ? "#000" : "none"}
                      strokeWidth={isItemActive(entry.name) ? 2 : 0}
                      opacity={hasActiveFilters && !isItemActive(entry.name) ? 0.6 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={(data) => {
                    if (data && data.name) {
                      handleClick(data.name);
                    }
                  }}
                  cursor="pointer"
                >
                  {data.map((entry, i) => (
                    <Cell 
                      key={`cell-${i}`} 
                      fill={entry.fill}
                      stroke={isItemActive(entry.name) ? "#000" : "none"}
                      strokeWidth={isItemActive(entry.name) ? 3 : 0}
                      opacity={hasActiveFilters && !isItemActive(entry.name) ? 0.6 : 1}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [
                    value.toLocaleString(),
                    "Registros",
                  ]}
                />
              </PieChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p>Não há dados disponíveis para exibir</p>
              {hasActiveFilters && (
                <p className="text-xs mt-1">Tente remover alguns filtros</p>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Indicador de comunicação com outros gráficos */}
      {hasActiveFilters && (
        <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
          <Filter className="h-3 w-3" />
          <span>
            {isCurrentChartFiltered ? 
              'Este gráfico está aplicando filtros aos demais' : 
              'Este gráfico está sendo filtrado por outros'
            }
          </span>
        </div>
      )}
    </div>
  );
};

export default PublicoAtendidoChart;
