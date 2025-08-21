/**
 * OTIMIZAÇÃO PARA COP 30: Múltiplos provedores de tiles
 * Configuração de tile servers para distribuir carga e garantir disponibilidade
 */

export interface TileProvider {
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
  priority: number; // 1 = principal, 2 = backup, etc.
  region: string;   // 'brazil', 'global', 'europe'
  provider: 'openstreetmap' | 'mapbox'; // Tipo do provedor
  requiresApiKey?: boolean; // Se precisa de API key
}

export const TILE_PROVIDERS: TileProvider[] = [
  // OpenStreetMap Providers
  {
    name: 'OpenStreetMap Principal',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    priority: 1,
    region: 'global',
    provider: 'openstreetmap'
  },
  
  {
    name: 'CartoDB Positron',
    url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 18,
    priority: 2,
    region: 'global',
    provider: 'openstreetmap'
  },
  
  {
    name: 'OpenStreetMap França',
    url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
    priority: 3,
    region: 'europe',
    provider: 'openstreetmap'
  },
  
  {
    name: 'OpenStreetMap Alemanha',
    url: 'https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
    priority: 4,
    region: 'europe',
    provider: 'openstreetmap'
  },

  // Mapbox Providers
  {
    name: 'Mapbox Streets',
    url: 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token={accessToken}',
    attribution: '© <a href="https://www.mapbox.com/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 22,
    priority: 1,
    region: 'global',
    provider: 'mapbox',
    requiresApiKey: true
  },

  {
    name: 'Mapbox Light',
    url: 'https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token={accessToken}',
    attribution: '© <a href="https://www.mapbox.com/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 22,
    priority: 2,
    region: 'global',
    provider: 'mapbox',
    requiresApiKey: true
  },

  {
    name: 'Mapbox Satellite',
    url: 'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token={accessToken}',
    attribution: '© <a href="https://www.mapbox.com/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 22,
    priority: 3,
    region: 'global',
    provider: 'mapbox',
    requiresApiKey: true
  }
];

export const TILE_OPTIONS = {
  // Cache agressivo para COP 30
  keepBuffer: 8,          // Mantém mais tiles em cache
  updateWhenIdle: true,   // Atualiza apenas quando parado
  updateWhenZooming: false, // Não atualiza durante zoom
  crossOrigin: true,
  errorTileUrl: '',       // URL para tile de erro (opcional)
  tileSize: 256,          // Tamanho padrão
  subdomains: ['a', 'b', 'c'], // Subdomínios para distribuir requisições
};

/**
 * Seleciona o melhor tile provider baseado no tipo e prioridade
 */
export function getOptimalTileProvider(providerType: 'openstreetmap' | 'mapbox' = 'openstreetmap', apiKey?: string): TileProvider {
  const providers = TILE_PROVIDERS.filter(p => p.provider === providerType);
  
  if (providers.length === 0) {
    // Fallback para OpenStreetMap se Mapbox não estiver disponível
    return TILE_PROVIDERS.find(p => p.provider === 'openstreetmap' && p.priority === 1) || TILE_PROVIDERS[0];
  }
  
  // Retorna o provider com menor prioridade (mais importante)
  const selectedProvider = providers.sort((a, b) => a.priority - b.priority)[0];
  
  // Se for Mapbox e precisar de API key, substitui o placeholder
  if (selectedProvider.provider === 'mapbox' && selectedProvider.requiresApiKey && apiKey) {
    selectedProvider.url = selectedProvider.url.replace('{accessToken}', apiKey);
  }
  
  return selectedProvider;
}

/**
 * Retorna array de providers para fallback do tipo especificado
 */
export function getTileProvidersFallback(providerType: 'openstreetmap' | 'mapbox' = 'openstreetmap'): TileProvider[] {
  return TILE_PROVIDERS
    .filter(p => p.provider === providerType)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Verifica se o provedor está disponível
 */
export function isProviderAvailable(providerType: 'openstreetmap' | 'mapbox', apiKey?: string): boolean {
  const providers = TILE_PROVIDERS.filter(p => p.provider === providerType);
  
  if (providerType === 'mapbox') {
    return !!(apiKey && apiKey.trim());
  }
  
  return providers.length > 0;
}
