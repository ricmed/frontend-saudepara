import { useState, useEffect } from 'react';
import { getOptimalTileProvider, isProviderAvailable, type TileProvider } from '../config/tileProviders';

export type MapProvider = 'openstreetmap' | 'mapbox';

interface UseMapProviderOptions {
  defaultProvider?: MapProvider;
  mapboxApiKey?: string;
}

interface UseMapProviderReturn {
  currentProvider: MapProvider;
  setCurrentProvider: (provider: MapProvider) => void;
  tileProvider: TileProvider;
  isAvailable: (provider: MapProvider) => boolean;
  mapboxApiKey?: string;
}

export function useMapProvider(options: UseMapProviderOptions = {}): UseMapProviderReturn {
  const { defaultProvider = 'openstreetmap', mapboxApiKey } = options;
  
  // Estado do provedor atual
  const [currentProvider, setCurrentProvider] = useState<MapProvider>(() => {
    // Recupera do localStorage se existir
    const saved = localStorage.getItem('map-provider');
    if (saved && (saved === 'openstreetmap' || saved === 'mapbox')) {
      return saved;
    }
    return defaultProvider;
  });

  // Estado da API key do Mapbox
  const [apiKey] = useState<string | undefined>(() => {
    // Recupera do localStorage se existir
    const saved = localStorage.getItem('mapbox-api-key');
    return saved || mapboxApiKey;
  });

  // Persiste o provedor no localStorage
  useEffect(() => {
    localStorage.setItem('map-provider', currentProvider);
  }, [currentProvider]);

  // Persiste a API key no localStorage
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('mapbox-api-key', apiKey);
    }
  }, [apiKey]);

  // Obtém o tile provider baseado no provedor atual
  const tileProvider = getOptimalTileProvider(currentProvider, apiKey);

  // Função para verificar se um provedor está disponível
  const isAvailable = (provider: MapProvider): boolean => {
    return isProviderAvailable(provider, apiKey);
  };

  // Função personalizada para trocar provedor com validação
  const handleSetCurrentProvider = (provider: MapProvider) => {
    if (!isAvailable(provider)) {
      if (provider === 'mapbox') {
        console.warn('Mapbox requer API key. Configure uma API key válida.');
        // Você pode mostrar um modal aqui pedindo a API key
        return;
      }
    }
    setCurrentProvider(provider);
  };

  return {
    currentProvider,
    setCurrentProvider: handleSetCurrentProvider,
    tileProvider,
    isAvailable,
    mapboxApiKey: apiKey
  };
}
