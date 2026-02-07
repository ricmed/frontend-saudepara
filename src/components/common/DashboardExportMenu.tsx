import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, FileIcon, File, Database } from 'lucide-react';
import { exportFullDashboard } from '../../utils/exportUtils';

// Interface para dados de gráfico
interface ChartDataItem {
  name: string;
  value: number;
  fill?: string;
  isAlarmante?: boolean;
  original?: any;
}

// Interface para as props do componente
interface DashboardExportMenuProps {
  // Dados de todos os gráficos do dashboard
  paisData?: ChartDataItem[];
  estadoData?: ChartDataItem[];
  municipioData?: ChartDataItem[];
  bairroData?: ChartDataItem[];
  // Dados adicionais de outros gráficos do dashboard
  estabelecimentosData?: ChartDataItem[];
  publicoData?: ChartDataItem[];
  tipoAtendimentoData?: ChartDataItem[];
  generoData?: ChartDataItem[];
  racaData?: ChartDataItem[];
  sintomasData?: ChartDataItem[];
  traumaData?: ChartDataItem[];
  hipotesesData?: ChartDataItem[];
  // Dados específicos do Dashboard DAE
  crsData?: ChartDataItem[];
  nheData?: ChartDataItem[];
  cievsData?: ChartDataItem[];
  daeData?: ChartDataItem[];
  serieTemporalData?: ChartDataItem[];
  // Metadados
  totalRecords: number;
  activeFilters?: Record<string, any>;
  className?: string;
  buttonVariant?: 'icon' | 'button';
  title?: string;
}

// 📊 COMPONENTE DE EXPORTAÇÃO COMPLETA DO DASHBOARD
const DashboardExportMenu: React.FC<DashboardExportMenuProps> = ({
  paisData = [],
  estadoData = [],
  municipioData = [],
  bairroData = [],
  estabelecimentosData = [],
  publicoData = [],
  tipoAtendimentoData = [],
  generoData = [],
  racaData = [],
  sintomasData = [],
  traumaData = [],
  hipotesesData = [],
  crsData = [],
  nheData = [],
  cievsData = [],
  daeData = [],
  serieTemporalData = [],
  totalRecords,
  activeFilters = {},
  className = '',
  buttonVariant = 'button',
  title = 'Comunicação de Eventos'
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Preparar dados completos do dashboard
  const prepareDashboardCompleteData = () => {
    const sections = [];

    // Seção Geográfica
    if (paisData.length > 0) sections.push({ name: 'Países de Residência', data: paisData });
    if (estadoData.length > 0) sections.push({ name: 'Estados/UF de Residência', data: estadoData });
    if (municipioData.length > 0) sections.push({ name: 'Municípios de Residência', data: municipioData });
    if (bairroData.length > 0) sections.push({ name: 'Bairros de Residência', data: bairroData });

    // Seção de Estabelecimentos
    if (estabelecimentosData.length > 0) sections.push({ name: 'Estabelecimentos de Saúde', data: estabelecimentosData });

    // Seção Demográfica
    if (publicoData.length > 0) sections.push({ name: 'Público Atendido', data: publicoData });
    if (tipoAtendimentoData.length > 0) sections.push({ name: 'Tipo de Atendimento', data: tipoAtendimentoData });
    if (generoData.length > 0) sections.push({ name: 'Identidade de Gênero', data: generoData });
    if (racaData.length > 0) sections.push({ name: 'Raça e Cor', data: racaData });

    // Seção Clínica
    if (sintomasData.length > 0) sections.push({ name: 'Principais Sintomas', data: sintomasData });
    if (traumaData.length > 0) sections.push({ name: 'Tipos de Trauma', data: traumaData });
    if (hipotesesData.length > 0) sections.push({ name: 'Hipóteses Diagnósticas', data: hipotesesData });

    // Seção específica do Dashboard DAE
    if (serieTemporalData && serieTemporalData.length > 0) {
      sections.unshift({ name: 'Série Temporal - Evolução Diária', data: serieTemporalData });
    }
    if (crsData.length > 0) sections.push({ name: 'CRS - Centros Regionais de Saúde', data: crsData });
    if (nheData.length > 0) sections.push({ name: 'NHE - Núcleos Hospitalares de Epidemiologia', data: nheData });
    if (cievsData.length > 0) sections.push({ name: 'CIEVS - Centros de Informações Estratégicas em Vigilância', data: cievsData });
    if (daeData.length > 0) sections.push({ name: 'DAE - Doenças, Agravos e Eventos', data: daeData });

    return {
      title: title || 'Comunicação de Eventos - Dados Completos',
      sections,
      metadata: {
        totalRecords,
        dateGenerated: new Date().toLocaleString('pt-BR'),
        filters: activeFilters,
        sectionsCount: sections.length,
        totalDataPoints: sections.reduce((sum, section) => 
          sum + section.data.reduce((sectionSum, item) => sectionSum + item.value, 0), 0
        )
      }
    };
  };

  // Função para lidar com as exportações
  const handleExport = async (format: 'excel' | 'csv' | 'pdf' | 'word') => {
    if (isExporting) return;
    
    setIsExporting(true);
    setShowMenu(false);
    
    try {
      const dashboardData = prepareDashboardCompleteData();
      await exportFullDashboard(dashboardData, format);
    } catch (error) {
      console.error('Erro na exportação do dashboard completo:', error);
      alert(`Erro ao exportar dashboard em ${format.toUpperCase()}. Tente novamente.`);
    } finally {
      setIsExporting(false);
    }
  };

  // Renderizar botão baseado na variante
  const renderTriggerButton = () => {
    const baseClasses = "transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50";
    
    switch (buttonVariant) {
      case 'icon':
        return (
          <button
            onClick={() => setShowMenu(!showMenu)}
            disabled={isExporting}
            className={`${baseClasses} p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-lg disabled:opacity-50 ${className}`}
            title="Exportar dashboard completo"
          >
            <Database className="h-4 w-4" />
          </button>
        );
      
      default: // 'button'
        return (
          <button
            onClick={() => setShowMenu(!showMenu)}
            disabled={isExporting}
            className={`${baseClasses} flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            title="Exportar dashboard completo"
          >
            <Download className="h-4 w-4" />
            <span>Exportar Dashboard</span>
            {isExporting && <span className="text-xs">(Processando...)</span>}
          </button>
        );
    }
  };

  // Calcular estatísticas para o menu
  const dashboardStats = prepareDashboardCompleteData();
  const hasData = dashboardStats.sections.length > 0;

  // Debug: Log dados para verificar
  useEffect(() => {
    if (showMenu) {
      console.log('📊 Dashboard Export Menu - Stats:', {
        hasData,
        sectionsCount: dashboardStats.sections.length,
        sections: dashboardStats.sections.map(s => ({ name: s.name, items: s.data.length })),
        totalRecords,
        municipioDataLength: municipioData.length,
        crsDataLength: crsData.length,
        nheDataLength: nheData.length,
        cievsDataLength: cievsData.length,
        daeDataLength: daeData.length,
        serieTemporalDataLength: serieTemporalData?.length || 0
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMenu, hasData, totalRecords, municipioData.length, crsData.length, nheData.length, cievsData.length, daeData.length, serieTemporalData?.length]);

  return (
    <div className="relative inline-block" data-export-menu>
      {renderTriggerButton()}
      
      {showMenu && (
        <>
          {/* Overlay para fechar menu */}
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu de opções */}
          <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[9999] min-w-80 max-w-96">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Exportar Dashboard Completo</h3>
              <p className="text-xs text-gray-500 mt-1">
                {dashboardStats.sections.length} seções • {dashboardStats.metadata?.totalDataPoints || 0} pontos de dados
              </p>
            </div>
            
            {!hasData && (
              <div className="px-4 py-3 text-sm text-gray-500">
                Nenhum dado disponível para exportação
              </div>
            )}
            
            {hasData && (
              <>
                {/* Opção Excel */}
                <button 
                  className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors disabled:opacity-50"
                  onClick={() => handleExport('excel')}
                  disabled={isExporting}
                >
                  <FileSpreadsheet className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm">Excel Completo (.xlsx)</div>
                    <div className="text-xs text-gray-500 mt-0.5">Múltiplas abas com todos os dados</div>
                  </div>
                </button>
                
                {/* Opção CSV */}
                <button 
                  className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors disabled:opacity-50"
                  onClick={() => handleExport('csv')}
                  disabled={isExporting}
                >
                  <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm">CSV Consolidado (.csv)</div>
                    <div className="text-xs text-gray-500 mt-0.5">Todos os dados em um arquivo</div>
                  </div>
                </button>
                
                {/* Opção PDF */}
                <button 
                  className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors disabled:opacity-50"
                  onClick={() => handleExport('pdf')}
                  disabled={isExporting}
                >
                  <FileIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm">Relatório PDF (.pdf)</div>
                    <div className="text-xs text-gray-500 mt-0.5">Dashboard completo visual</div>
                  </div>
                </button>
                
                {/* Opção Word */}
                <button 
                  className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors disabled:opacity-50"
                  onClick={() => handleExport('word')}
                  disabled={isExporting}
                >
                  <File className="h-5 w-5 text-blue-700 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm">Documento Word (.doc)</div>
                    <div className="text-xs text-gray-500 mt-0.5">Relatório executivo completo</div>
                  </div>
                </button>
              </>
            )}
            
            {/* Informações estatísticas */}
            <div className="px-4 py-3 mt-2 text-xs text-gray-400 border-t border-gray-100 space-y-1">
              <div>📊 {totalRecords.toLocaleString()} notificações totais</div>
              <div>📈 {dashboardStats.sections.length} gráficos incluídos</div>
              {Object.keys(activeFilters).length > 0 && (
                <div>🔍 {Object.keys(activeFilters).length} filtros ativos</div>
              )}
            </div>
          </div>
        </>
      )}
      
      {/* Indicador de carregamento */}
      {isExporting && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
      )}
    </div>
  );
};

export default DashboardExportMenu;
