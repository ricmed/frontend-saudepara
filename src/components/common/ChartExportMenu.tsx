import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Image, File, FileIcon } from 'lucide-react';
import { 
  exportChartAsExcel, 
  exportChartAsCSV, 
  exportChartAsPNG, 
  exportChartAsPDF, 
  exportChartAsWord
} from '../../utils/exportUtils';

// Interface para dados de gráfico
interface ChartDataItem {
  name: string;
  value: number;
  fill?: string;
  isAlarmante?: boolean;
  original?: any;
}

// Interface para as props do componente
interface ChartExportMenuProps {
  chartId: string;
  chartData: ChartDataItem[];
  chartTitle: string;
  className?: string;
  buttonVariant?: 'icon' | 'button' | 'minimal';
  showLabels?: boolean;
}

// 📊 COMPONENTE GENÉRICO DE EXPORTAÇÃO PARA QUALQUER GRÁFICO
const ChartExportMenu: React.FC<ChartExportMenuProps> = ({
  chartId,
  chartData,
  chartTitle,
  className = '',
  buttonVariant = 'icon',
  showLabels = true
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Função para lidar com as exportações
  const handleExport = async (format: string) => {
    if (isExporting) return; // Prevenir múltiplos cliques
    
    setIsExporting(true);
    setShowMenu(false);
    
    try {
      switch (format) {
        case 'excel':
          await exportChartAsExcel(chartData, chartTitle);
          break;
        case 'csv':
          await exportChartAsCSV(chartData, chartTitle);
          break;
        case 'png':
          await exportChartAsPNG(chartId, chartTitle);
          break;
        case 'pdf':
          await exportChartAsPDF(chartId, chartTitle);
          break;
        case 'word':
          await exportChartAsWord(chartId, chartData, chartTitle);
          break;
        default:
          console.warn('Formato de exportação não reconhecido:', format);
          break;
      }
    } catch (error) {
      console.error('Erro na exportação:', error);
      alert(`Erro ao exportar ${format.toUpperCase()}. Tente novamente.`);
    } finally {
      setIsExporting(false);
    }
  };

  // Renderizar botão baseado na variante
  const renderTriggerButton = () => {
    const baseClasses = "transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50";
    
    switch (buttonVariant) {
      case 'button':
        return (
          <button
            onClick={() => setShowMenu(!showMenu)}
            disabled={isExporting}
            className={`${baseClasses} flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            title="Exportar gráfico"
          >
            <Download className="h-4 w-4" />
            {showLabels && <span>Exportar</span>}
            {isExporting && <span className="text-xs">(Processando...)</span>}
          </button>
        );
      
      case 'minimal':
        return (
          <button
            onClick={() => setShowMenu(!showMenu)}
            disabled={isExporting}
            className={`${baseClasses} p-1 text-gray-400 hover:text-gray-600 rounded ${className}`}
            title="Exportar gráfico"
          >
            <Download className="h-3 w-3" />
          </button>
        );
      
      default: // 'icon'
        return (
          <button
            onClick={() => setShowMenu(!showMenu)}
            disabled={isExporting}
            className={`${baseClasses} p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-lg ${className}`}
            title="Exportar gráfico"
          >
            <Download className="h-4 w-4" />
          </button>
        );
    }
  };

  return (
    <div className="relative inline-block">
      {renderTriggerButton()}
      
      {showMenu && (
        <>
          {/* Overlay para fechar menu */}
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu de opções */}
          <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[9999] min-w-48">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100">
              Exportar "{chartTitle}"
            </div>
            
            {/* Opção Excel */}
            <button 
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors"
              onClick={() => handleExport('excel')}
              disabled={isExporting}
            >
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              <div>
                <div className="font-medium">Excel (.xlsx)</div>
                <div className="text-xs text-gray-500">Dados tabulados com formatação</div>
              </div>
            </button>
            
            {/* Opção CSV */}
            <button 
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors"
              onClick={() => handleExport('csv')}
              disabled={isExporting}
            >
              <FileText className="h-4 w-4 text-blue-600" />
              <div>
                <div className="font-medium">CSV (.csv)</div>
                <div className="text-xs text-gray-500">Valores separados por vírgula</div>
              </div>
            </button>
            
            {/* Opção PNG */}
            <button 
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors"
              onClick={() => handleExport('png')}
              disabled={isExporting}
            >
              <Image className="h-4 w-4 text-purple-600" />
              <div>
                <div className="font-medium">Imagem (.png)</div>
                <div className="text-xs text-gray-500">Captura visual do gráfico</div>
              </div>
            </button>
            
            {/* Opção PDF */}
            <button 
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors"
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
            >
              <FileIcon className="h-4 w-4 text-red-600" />
              <div>
                <div className="font-medium">PDF (.pdf)</div>
                <div className="text-xs text-gray-500">Documento portátil</div>
              </div>
            </button>
            
            {/* Opção Word */}
            <button 
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors"
              onClick={() => handleExport('word')}
              disabled={isExporting}
            >
              <File className="h-4 w-4 text-blue-700" />
              <div>
                <div className="font-medium">Word (.doc)</div>
                <div className="text-xs text-gray-500">Documento com imagem e tabela</div>
              </div>
            </button>
            
            {/* Informações do gráfico */}
            <div className="px-4 py-2 mt-2 text-xs text-gray-400 border-t border-gray-100">
              {chartData.length} {chartData.length === 1 ? 'item' : 'itens'} • Total: {chartData.reduce((sum, item) => sum + item.value, 0)}
            </div>
          </div>
        </>
      )}
      
      {/* Indicador de carregamento */}
      {isExporting && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
      )}
    </div>
  );
};

export default ChartExportMenu;
