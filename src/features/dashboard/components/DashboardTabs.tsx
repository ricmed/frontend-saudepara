// Componente de abas para o dashboard com funcionalidades avançadas
import React from 'react';
import { 
  BarChart3, 
  MapPin, 
  TrendingUp,
  Brain
} from 'lucide-react';

export type DashboardTab = 'graficos' | 'fluxo' | 'mapa' | 'ia';

interface DashboardTabsProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  className?: string;
}

/**
 * Componente de navegação por abas do dashboard
 * Inclui abas para gráficos, análise de fluxo, mapa e dados tabulares
 */
export const DashboardTabs: React.FC<DashboardTabsProps> = ({
  activeTab,
  onTabChange,
  className = ''
}) => {
  
  const tabs = [
    {
      id: 'graficos' as DashboardTab,
      label: 'Gráficos',
      icon: BarChart3,
      description: 'Visão geral e estatísticas'
    },
    {
      id: 'fluxo' as DashboardTab,
      label: 'Fluxo Hospitalar',
      icon: TrendingUp,
      description: 'Atendimentos por hora'
    },
    {
      id: 'mapa' as DashboardTab,
      label: 'Mapa',
      icon: MapPin,
      description: 'Distribuição geográfica'
    },
    {
      id: 'ia' as DashboardTab,
      label: 'IA Insights',
      icon: Brain,
      description: 'Análise inteligente com Llama 3.1'
    }
  ];

  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        {/* Navegação em linha para desktop, scrollável para mobile */}
        <nav className="-mb-px flex overflow-x-auto space-x-4 sm:space-x-8 scrollbar-hide" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  group inline-flex items-center py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200 whitespace-nowrap
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon 
                  className={`
                    -ml-0.5 mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 transition-colors duration-200
                    ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `} 
                />
                <span className="block sm:hidden">{tab.label.split(' ')[0]}</span>
                <span className="hidden sm:block">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Indicador visual da aba ativa - responsivo */}
      <div className="bg-blue-50 border-t border-blue-100 px-2 sm:px-4 py-2">
        <div className="max-w-7xl mx-auto">
          {tabs.map((tab) => {
            if (activeTab !== tab.id) return null;
            
            const Icon = tab.icon;
            return (
              <div key={tab.id} className="flex items-center gap-2 text-blue-700">
                <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm font-medium">{tab.label}</span>
                <span className="hidden sm:inline text-xs sm:text-sm text-blue-600">• {tab.description}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * Hook para gerenciar estado das abas do dashboard
 * Persiste a aba ativa no localStorage para manter estado entre recarregamentos
 */
export const useDashboardTabs = (initialTab: DashboardTab = 'graficos') => {
  // Recuperar aba salva do localStorage ou usar initialTab
  const getStoredTab = (): DashboardTab => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dashboard-active-tab');
      if (stored && ['graficos', 'fluxo', 'mapa', 'ia'].includes(stored)) {
        return stored as DashboardTab;
      }
    }
    return initialTab;
  };

  const [activeTab, setActiveTab] = React.useState<DashboardTab>(getStoredTab);
  
  const handleTabChange = React.useCallback((tab: DashboardTab) => {
    setActiveTab(tab);
    // Salvar no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-active-tab', tab);
    }
  }, []);
  
  return {
    activeTab,
    setActiveTab: handleTabChange
  };
};

export default DashboardTabs;

// CSS personalizado para esconder scrollbar
const styles = `
  .scrollbar-hide {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;  /* Chrome, Safari and Opera */
  }
`;

// Injetar estilos se não existirem
if (typeof document !== 'undefined' && !document.getElementById('dashboard-tabs-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'dashboard-tabs-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
