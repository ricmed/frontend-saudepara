import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getOptimalTileProvider, isProviderAvailable, type TileProvider } from '../config/tileProviders';
import { STORAGE_KEYS, readStringWithLegacy } from '@/utils/storageKeys';

export type MapProvider = 'openstreetmap' | 'mapbox';

interface MapProviderContextType {
  currentProvider: MapProvider;
  setCurrentProvider: (provider: MapProvider) => void;
  tileProvider: TileProvider;
  isAvailable: (provider: MapProvider) => boolean;
  mapboxApiKey?: string;
}

const MapProviderContext = createContext<MapProviderContextType | null>(null);

interface MapProviderProviderProps {
  children: ReactNode;
  defaultProvider?: MapProvider;
  mapboxApiKey?: string;
}

export const MapProviderProvider: React.FC<MapProviderProviderProps> = ({
  children,
  defaultProvider = 'openstreetmap',
  mapboxApiKey = 'pk.eyJ1IjoiZGFuaWVsbW9yYWVzNyIsImEiOiJjbWVtdmNvZm8wdmd6MmlvYTY5YWdqYXk0In0.6c-WJv8161bzZhq7dBxz3A'
}) => {
  const LEGACY_MAP_PROVIDER_KEY = 'map-provider';
  const LEGACY_MAPBOX_API_KEY = 'mapbox-api-key';
  // Estado do provedor atual
  const [currentProvider, setCurrentProviderState] = useState<MapProvider>(() => {
    // Recupera do localStorage se existir
    const saved = readStringWithLegacy(STORAGE_KEYS.map.provider, [LEGACY_MAP_PROVIDER_KEY]);
    if (saved && (saved === 'openstreetmap' || saved === 'mapbox')) {
      return saved;
    }
    return defaultProvider;
  });

  // Estado da API key do Mapbox
  const [apiKey] = useState<string | undefined>(() => {
    // Recupera do localStorage se existir
    const saved = readStringWithLegacy(STORAGE_KEYS.map.mapboxApiKey, [LEGACY_MAPBOX_API_KEY]);
    if (saved) return saved;
    
    // Se não existe e foi fornecida uma API key, salva ela
    if (mapboxApiKey) {
      localStorage.setItem(STORAGE_KEYS.map.mapboxApiKey, mapboxApiKey);
      return mapboxApiKey;
    }
    
    return undefined;
  });

  // Persiste o provedor no localStorage
  useEffect(() => {
    console.log('💾 Salvando provedor no localStorage:', currentProvider);
    localStorage.setItem(STORAGE_KEYS.map.provider, currentProvider);
  }, [currentProvider]);

  // Obtém o tile provider baseado no provedor atual
  const tileProvider = getOptimalTileProvider(currentProvider, apiKey);
  
  // Log para debug - ver quando o tileProvider muda
  useEffect(() => {
    console.log('🗺️ TileProvider Global atualizado:', {
      provider: currentProvider,
      url: tileProvider.url,
      attribution: tileProvider.attribution
    });
  }, [currentProvider, tileProvider.url]);

  // Função para verificar se um provedor está disponível
  const isAvailable = (provider: MapProvider): boolean => {
    return isProviderAvailable(provider, apiKey);
  };

  // Função personalizada para trocar provedor com validação
  const setCurrentProvider = (provider: MapProvider) => {
    console.log('🔄 Context: Trocando provedor de mapa para:', provider);
    
    if (!isAvailable(provider)) {
      if (provider === 'mapbox') {
        console.warn('Mapbox requer API key. Configure uma API key válida.');
        return;
      }
    }
    
    console.log('✅ Context: Provedor alterado de', currentProvider, 'para', provider);
    setCurrentProviderState(provider);
  };

  const value: MapProviderContextType = {
    currentProvider,
    setCurrentProvider,
    tileProvider,
    isAvailable,
    mapboxApiKey: apiKey
  };

  return (
    <MapProviderContext.Provider value={value}>
      {children}
    </MapProviderContext.Provider>
  );
};

export const useMapProvider = (): MapProviderContextType => {
  const context = useContext(MapProviderContext);
  if (!context) {
    throw new Error('useMapProvider deve ser usado dentro de um MapProviderProvider');
  }
  return context;
};
