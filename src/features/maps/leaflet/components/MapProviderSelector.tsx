import React, { useState } from 'react';
import { MapPin, Globe, Zap, Settings } from 'lucide-react';
import { MapboxConfigModal } from './MapboxConfigModal';

export type MapProvider = 'openstreetmap' | 'mapbox';

interface MapProviderSelectorProps {
  currentProvider: MapProvider;
  onProviderChange: (provider: MapProvider) => void;
  isMapboxAvailable: boolean;
  onMapboxConfig: (apiKey: string) => void;
  mapboxApiKey?: string;
  className?: string;
}

export const MapProviderSelector: React.FC<MapProviderSelectorProps> = ({
  currentProvider,
  onProviderChange,
  isMapboxAvailable,
  onMapboxConfig,
  mapboxApiKey,
  className = ''
}) => {
  const [showMapboxConfig, setShowMapboxConfig] = useState(false);

  const providers = [
    {
      id: 'openstreetmap' as MapProvider,
      name: 'OpenStreetMap',
      icon: Globe,
      description: 'Gratuito e ilimitado',
      color: 'bg-green-500 hover:bg-green-600',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
      available: true
    },
    {
      id: 'mapbox' as MapProvider,
      name: 'Mapbox',
      icon: Zap,
      description: isMapboxAvailable ? 'Premium e rápido' : 'Requer API key',
      color: 'bg-blue-500 hover:bg-blue-600',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50',
      available: isMapboxAvailable
    }
  ];

  const handleProviderClick = (providerId: MapProvider) => {
    if (providerId === 'mapbox' && !isMapboxAvailable) {
      setShowMapboxConfig(true);
      return;
    }
    onProviderChange(providerId);
  };

  return (
    <>
      <div className={`bg-white rounded-lg shadow-md p-4 border ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">Provedor do Mapa</h3>
        </div>
        
        <div className="space-y-2">
          {providers.map((provider) => {
            const Icon = provider.icon;
            const isSelected = currentProvider === provider.id;
            
            return (
              <div key={provider.id} className="relative">
                <button
                  onClick={() => handleProviderClick(provider.id)}
                  disabled={provider.id === 'mapbox' && !provider.available}
                  className={`
                    w-full p-3 rounded-lg border-2 transition-all duration-200 flex items-center gap-3
                    ${isSelected 
                      ? `${provider.bgColor} border-current ${provider.textColor} shadow-sm` 
                      : provider.available
                        ? 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  <div className={`
                    p-2 rounded-full flex-shrink-0
                    ${isSelected 
                      ? provider.color.replace('hover:', '') 
                      : provider.available 
                        ? 'bg-gray-300' 
                        : 'bg-gray-200'
                    }
                  `}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  
                  <div className="flex-1 text-left">
                    <div className="font-medium">{provider.name}</div>
                    <div className="text-sm opacity-75">{provider.description}</div>
                  </div>
                  
                  {isSelected && provider.available && (
                    <div className="flex-shrink-0">
                      <div className="w-3 h-3 rounded-full bg-current opacity-75"></div>
                    </div>
                  )}
                  
                  {provider.id === 'mapbox' && provider.available && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMapboxConfig(true);
                      }}
                      className="flex-shrink-0 p-1 rounded-full hover:bg-gray-200 transition-colors"
                      title="Configurar Mapbox"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  )}
                </button>
              </div>
            );
          })}
        </div>
        
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
          <strong>💡 Dica:</strong> Use Mapbox se OpenStreetMap estiver lento ou indisponível
        </div>
      </div>

      <MapboxConfigModal
        isOpen={showMapboxConfig}
        onClose={() => setShowMapboxConfig(false)}
        onSave={onMapboxConfig}
        currentApiKey={mapboxApiKey}
      />
    </>
  );
};
