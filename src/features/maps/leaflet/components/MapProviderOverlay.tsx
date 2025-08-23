import React, { useState } from 'react';
import { Settings, Globe, Zap, ChevronDown } from 'lucide-react';
import { MapboxConfigModal } from './MapboxConfigModal';
import { useMapProvider } from '../hooks/useMapProvider';

export type MapProvider = 'openstreetmap' | 'mapbox';

export const MapProviderOverlay: React.FC = () => {
  const {
    currentProvider,
    setCurrentProvider,
    isAvailable,
    mapboxApiKey
  } = useMapProvider();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showMapboxConfig, setShowMapboxConfig] = useState(false);

  const handleMapboxConfig = (apiKey: string) => {
    localStorage.setItem('mapbox-api-key', apiKey);
    setShowMapboxConfig(false);
    // Forçar reload para aplicar a nova configuração
    window.location.reload();
  };

  const providers = [
    {
      id: 'openstreetmap' as MapProvider,
      name: 'Servidor 1',
      shortName: 'S1',
      icon: Globe,
      color: 'text-green-600',
      available: true,
      description: 'Servidor padrão'
    },
    {
      id: 'mapbox' as MapProvider,
      name: 'Servidor 2',
      shortName: 'S2',
      icon: Zap,
      color: 'text-blue-600',
      available: isAvailable('mapbox'),
      description: 'Servidor alternativo'
    }
  ];

  const currentProviderInfo = providers.find(p => p.id === currentProvider);
  const CurrentIcon = currentProviderInfo?.icon || Globe;

  const handleProviderClick = (providerId: MapProvider) => {
    if (providerId === 'mapbox' && !isAvailable('mapbox')) {
      setShowMapboxConfig(true);
      setIsOpen(false);
      return;
    }
    setCurrentProvider(providerId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Overlay para seleção de servidor de mapa - z-index baixo para não sobrepor painel */}
      <div className="absolute top-4 right-4 z-[500] bg-white rounded-lg shadow-lg border border-gray-200 max-w-[90vw] sm:max-w-none">
        <div className="p-2 sm:p-3">
          <div className="text-xs sm:text-sm font-medium text-gray-700 mb-2 hidden sm:block">
            🗺️ Selecione o servidor de mapa:
          </div>
          
          {/* Dropdown compacto */}
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 bg-white border border-gray-300 rounded-md text-xs sm:text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[100px] sm:min-w-[160px]"
            >
              <div className="flex items-center space-x-1 sm:space-x-2">
                <CurrentIcon className={`w-3 h-3 sm:w-4 sm:h-4 ${currentProviderInfo?.color || 'text-gray-600'}`} />
                <span className="font-medium truncate">{currentProviderInfo?.name || 'Selecionar'}</span>
              </div>
              <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown menu */}
            {isOpen && (
              <>
                {/* Overlay para fechar o dropdown */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsOpen(false)}
                />
                
                {/* Menu dropdown - z-index baixo para não sobrepor painel */}
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-40 min-w-[180px] max-w-[90vw]">
                  {providers.map((provider) => {
                    const ProviderIcon = provider.icon;
                    return (
                      <button
                        key={provider.id}
                        onClick={() => handleProviderClick(provider.id)}
                        disabled={!provider.available}
                        className={`
                          w-full flex items-center justify-between px-2 sm:px-3 py-2 text-xs sm:text-sm text-left
                          ${currentProvider === provider.id
                            ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-500'
                            : provider.available
                              ? 'hover:bg-gray-50 text-gray-700'
                              : 'text-gray-400 cursor-not-allowed'
                          }
                          first:rounded-t-md last:rounded-b-md
                        `}
                      >
                        <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                          <ProviderIcon className={`w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 ${provider.available ? provider.color : 'text-gray-400'}`} />
                          <div className="min-w-0">
                            <div className="font-medium truncate">{provider.name}</div>
                            <div className="text-xs text-gray-500 hidden sm:block">{provider.description}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          {currentProvider === provider.id && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          {!provider.available && provider.id === 'mapbox' && (
                            <Settings 
                              className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowMapboxConfig(true);
                                setIsOpen(false);
                              }}
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de configuração do Mapbox */}
      <MapboxConfigModal
        isOpen={showMapboxConfig}
        onClose={() => setShowMapboxConfig(false)}
        onSave={handleMapboxConfig}
        currentApiKey={mapboxApiKey}
      />
    </>
  );
};
