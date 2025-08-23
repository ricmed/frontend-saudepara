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
  const { 
    defaultProvider = 'openstreetmap', 
    mapboxApiKey = 'pk.eyJ1IjoiZGFuaWVsbW9yYWVzNyIsImEiOiJjbWVtdmNvZm8wdmd6MmlvYTY5YWdqYXk0In0.6c-WJv8161bzZhq7dBxz3A' 
  } = options;
  
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
    if (saved) return saved;
    
    // Se não existe e foi fornecida uma API key, salva ela
    if (mapboxApiKey) {
      localStorage.setItem('mapbox-api-key', mapboxApiKey);
      return mapboxApiKey;
    }
    
    return undefined;
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
  
  // Log para debug - ver quando o tileProvider muda
  useEffect(() => {
    console.log('🗺️ TileProvider atualizado:', {
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
  const handleSetCurrentProvider = (provider: MapProvider) => {
    console.log('🔄 Trocando provedor de mapa para:', provider);
    
    if (!isAvailable(provider)) {
      if (provider === 'mapbox') {
        console.warn('Mapbox requer API key. Configure uma API key válida.');
        // Você pode mostrar um modal aqui pedindo a API key
        return;
      }
    }
    
    console.log('✅ Provedor alterado de', currentProvider, 'para', provider);
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
