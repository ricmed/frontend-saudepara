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
import { 
  Users, 
  Download, 
  FileImage, 
  FileSearch2, 
  File, 
  BarChart3, 
  PieChart as PieChartIcon,
  Filter
} from "lucide-react";
import { useChartData } from "../../hooks/useChartData";

// Interface das props do componente (simplificada - dados vêm do contexto)
interface PublicoAtendidoChartProps {
  rawData: any[]; // Dados brutos para processamento
  chartId?: string;
  title?: string;
  className?: string;
  isVisible?: boolean;
  showToggle?: boolean;
}

// Funções de exportação
const exportChartAsPNG = (chartId: string, title: string): void => {
  const element = document.getElementById(chartId);
  if (!element) {
    alert('Elemento não encontrado!');
    return;
  }
  console.log(`Exportando ${title} como PNG`);
  alert(`Exportação PNG simulada para: ${title}`);
};

const exportChartAsPDF = (chartId: string, title: string): void => {
  const element = document.getElementById(chartId);
  if (!element) {
    alert('Elemento não encontrado!');
    return;
  }
  console.log(`Exportando ${title} como PDF`);
  alert(`Exportação PDF simulada para: ${title}`);
};

const exportChartAsWord = (chartId: string, title: string): void => {
  const element = document.getElementById(chartId);
  if (!element) {
    alert('Elemento não encontrado!');
    return;
  }
  console.log(`Exportando ${title} como Word`);
  alert(`Exportação Word simulada para: ${title}`);
};

const exportChartAsCSV = (data: any[], title: string): void => {
  try {
    const headers = ['Categoria', 'Valor'];
    const rows = [
      headers.join(','),
      ...data.map(item => `"${item.name.replace(/"/g, '""')}",${item.value}`)
    ];
    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  } catch (error) {
    console.error('Erro ao exportar CSV:', error);
    alert('Erro ao exportar CSV');
  }
};

// Componente de menu de exportação
const GraphExportMenu: React.FC<{
  chartId: string;
  chartData: any[];
  chartTitle: string;
}> = ({ chartId, chartData, chartTitle }) => {
  const [showMenu, setShowMenu] = useState(false);
  
  const handleExport = (format: string) => {
    switch (format) {
      case 'png':
        exportChartAsPNG(chartId, chartTitle);
        break;
      case 'pdf':
        exportChartAsPDF(chartId, chartTitle);
        break;
      case 'word':
        exportChartAsWord(chartId, chartTitle);
        break;
      case 'csv':
        exportChartAsCSV(chartData, chartTitle);
        break;
      default:
        break;
    }
    setShowMenu(false);
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-1 text-gray-500 hover:text-blue-500 transition-colors"
        title="Exportar gráfico"
      >
        <Download className="h-4 w-4" />
      </button>
      
      {showMenu && (
        <div className="absolute right-0 mt-1 bg-white rounded shadow-lg py-1 z-20 min-w-40">
          <button 
            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            onClick={() => handleExport('png')}
          >
            <FileImage className="h-4 w-4 text-green-500" />
            Exportar PNG
          </button>
          <button 
            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            onClick={() => handleExport('pdf')}
          >
            <FileSearch2 className="h-4 w-4 text-red-500" />
            Exportar PDF
          </button>
          <button 
            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            onClick={() => handleExport('word')}
          >
            <File className="h-4 w-4 text-blue-500" />
            Exportar Word
          </button>
          <button 
            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            onClick={() => handleExport('csv')}
          >
            <File className="h-4 w-4 text-gray-500" />
            Exportar CSV
          </button>
        </div>
      )}
    </div>
  );
};

// Componente principal (com contexto global)
const PublicoAtendidoChart: React.FC<PublicoAtendidoChartProps> = ({
  rawData,
  chartId = "chart-publico-atendido",
  title = "Distribuição por Público Atendido",
  className = "bg-white p-4 rounded-lg shadow-sm",
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
        
        <div className="flex items-center gap-2">
          <GraphExportMenu 
            chartId={chartId} 
            chartData={data}
            chartTitle={title}
          />
          
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
              <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  stroke="#666"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#666" />
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
