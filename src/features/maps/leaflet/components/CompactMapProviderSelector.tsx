import React, { useState } from 'react';
import { Settings, Globe, Zap, ChevronDown } from 'lucide-react';
import { MapboxConfigModal } from './MapboxConfigModal';
import { useMapProvider } from '../hooks/useMapProvider';

export type MapProvider = 'openstreetmap' | 'mapbox';

export const CompactMapProviderSelector: React.FC = () => {
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
      description: 'OpenStreetMap - Gratuito'
    },
    {
      id: 'mapbox' as MapProvider,
      name: 'Servidor 2',
      shortName: 'S2',
      icon: Zap,
      color: 'text-blue-600',
      available: isAvailable('mapbox'),
      description: 'Mapbox - Premium'
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
      {/* Dropdown compacto */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          title={`Provedor atual: ${currentProviderInfo?.name}`}
        >
          <CurrentIcon className={`w-4 h-4 ${currentProviderInfo?.color}`} />
          <span className="text-sm font-medium text-gray-700 hidden sm:inline">
            {currentProviderInfo?.shortName}
          </span>
          <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <>
            {/* Overlay para fechar o dropdown */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu dropdown */}
            <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
              <div className="p-1">
                {providers.map((provider) => {
                  const Icon = provider.icon;
                  const isSelected = currentProvider === provider.id;
                  
                  return (
                    <button
                      key={provider.id}
                      onClick={() => handleProviderClick(provider.id)}
                      disabled={provider.id === 'mapbox' && !provider.available}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors
                        ${isSelected 
                          ? 'bg-blue-50 text-blue-700' 
                          : provider.available
                            ? 'hover:bg-gray-50 text-gray-700'
                            : 'text-gray-400 cursor-not-allowed'
                        }
                      `}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : provider.color}`} />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{provider.name}</div>
                        <div className="text-xs opacity-75">
                          {provider.id === 'openstreetmap' 
                            ? 'Gratuito e ilimitado'
                            : provider.available 
                              ? 'Premium e rápido'
                              : 'Requer configuração'
                          }
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Divisor e configuração do Mapbox */}
              <div className="border-t border-gray-100 p-1">
                <button
                  onClick={() => {
                    setShowMapboxConfig(true);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-gray-50 text-gray-600 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">Configurar Mapbox</span>
                </button>
              </div>

              {/* Rodapé com dica */}
              <div className="border-t border-gray-100 p-2">
                <div className="text-xs text-gray-500 text-center">
                  💡 Troque se houver problemas
                </div>
              </div>
            </div>
          </>
        )}
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
