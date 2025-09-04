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
import { BookOpen, Download, FileImage, FileSearch2, File } from "lucide-react";
import { useState } from "react";

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
  COLORS?: {
    alarmante: string;
    alerta: string;
    medio: string;
    normal: string;
  };
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

const exportChartAsWord = (chartId: string, _data: ChartDataItem[], title: string): void => {
  const element = document.getElementById(chartId);
  if (!element) {
    alert('Elemento não encontrado!');
    return;
  }
  console.log(`Exportando ${title} como Word`);
  alert(`Exportação Word simulada para: ${title}`);
};

const exportChartAsCSV = (data: ChartDataItem[], title: string): void => {
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
  chartData: ChartDataItem[];
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
        exportChartAsWord(chartId, chartData, chartTitle);
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

// Componente principal
const HipotesesDiagnosticasChart: React.FC<HipotesesDiagnosticasChartProps> = ({
  data,
  onChartClick,
  activeFilter = null,
  chartId = "chart-hipoteses",
  title = "Hipóteses Diagnósticas",
  className = "bg-white p-4 rounded-lg shadow-sm",
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
        <div className="flex gap-2">
          <GraphExportMenu 
            chartId={chartId} 
            chartData={limitedData}
            chartTitle={title}
          />
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
              margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#666" />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#666"
                width={140}
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
                    stroke={activeFilter === entry.name ? "#000" : (entry.isAlarmante ? "#b71c1c" : "none")}
                    strokeWidth={activeFilter === entry.name ? 2 : (entry.isAlarmante ? 2 : 0)}
                  />
                ))}
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
