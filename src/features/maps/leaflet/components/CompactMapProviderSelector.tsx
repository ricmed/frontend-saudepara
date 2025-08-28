import React, { useState } from 'react';
import { Globe, Zap, ChevronDown } from 'lucide-react';
import { useMapProvider } from '../hooks/useMapProvider';

export type MapProvider = 'openstreetmap' | 'mapbox';

export const CompactMapProviderSelector: React.FC = () => {
  const {
    currentProvider,
    setCurrentProvider,
    isAvailable
  } = useMapProvider();
  
  const [isOpen, setIsOpen] = useState(false);

  const providers = [
    {
      id: 'openstreetmap' as MapProvider,
      name: 'Servidor 1',
      shortName: 'S1',
      icon: Globe,
      color: 'text-green-600',
      available: true
    },
    {
      id: 'mapbox' as MapProvider,
      name: 'Servidor 2',
      shortName: 'S2',
      icon: Zap,
      color: 'text-blue-600',
      available: isAvailable('mapbox')
    }
  ];

  const currentProviderInfo = providers.find(p => p.id === currentProvider);
  const CurrentIcon = currentProviderInfo?.icon || Globe;

  const handleProviderClick = (providerId: MapProvider) => {
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
          title={`Servidor atual: ${currentProviderInfo?.name}`}
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
            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
              <div className="p-1">
                {providers.map((provider) => {
                  const Icon = provider.icon;
                  const isSelected = currentProvider === provider.id;
                  
                  return (
                    <button
                      key={provider.id}
                      onClick={() => handleProviderClick(provider.id)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors
                        ${isSelected 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'hover:bg-gray-50 text-gray-700'
                        }
                      `}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : provider.color}`} />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{provider.name}</div>
                      </div>
                      {isSelected && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};
