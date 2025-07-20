export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export interface Local {
  id: string;
  nome: string;
  lat: number;
  lng: number;
  endereco: string;
  tipo: string;
  natureza: string;
  turno: string;
  // Campos adicionais da API
  cnes?: string;
  cnpj?: string;
  codigo_unidade?: string;
  ativo: boolean;
  // Arrays de habilitações e qualificações (opcionais)
  habilitacoes?: string[];
  qualificacoes?: string[];
}

export interface TempoViagem {
  modo: string;
  duracao: string;
  distancia: string;
}

export interface TipoEstabelecimento {
  id: string;
  nome: string;
}

export interface MapaLocaisState {
  allPlaces: Local[];
  filteredPlaces: Local[];
  userLocation: LatLngLiteral | null;
  mapCenter: LatLngLiteral;
  isLoading: boolean;
  locationError: string | null;
  directions: google.maps.DirectionsResult | null;
  selectedLocal: Local | null;
  searchRadius: number;
  tipoSelecionado: string;
  naturezaSelecionada: string;
  tiposEstabelecimentos: TipoEstabelecimento[];
  menuAberto: boolean;
  voiceGuidanceActive: boolean;
  selectedLanguage: SupportedLanguage;
  temposViagem: TempoViagem[];
  modoTransporteSelecionado: string;
  visibleCount: number;
}

export type SupportedLanguage = 'pt-BR' | 'en-US' | 'es-ES' | 'fr-FR' | 'zh-CN';

// Tipos específicos para API
export interface ApiEstabelecimento {
  idestabelecimento: number;
  codigo_unidade?: string;
  nome: string;
  cnes?: string;
  cnpj?: string;
  cidade?: string;
  logradouro?: string;
  bairro?: string;
  numero?: string;
  latitude?: string;
  longitude?: string;
  ativo: string; // 'S' ou 'N'
  tipo_estabelecimento?: {
    idtipo_estabelecimento: number;
    descricao: string;
  };
  tipo_natureza?: {
    idtipo_natureza: number;
    descricao: string;
  };
  tipo_turno?: {
    idtipo_turno: number;
    descricao: string;
  };
  estabelecimento_has_tipo_habilitacao?: Array<{
    tipo_habilitacao: {
      idtipo_habilitacao: number;
      codigo: string;
      descricao: string;
    };
  }>;
  estabelecimento_has_tipo_qualificacao?: Array<{
    tipo_qualificacao: {
      idtipo_qualificacao: number;
      descricao: string;
    };
  }>;
}

export interface ApiResponse<T> {
  data: T[];
  pagination: {
    total: number;
    pages: number;
    currentPage: number;
    perPage: number;
  };
}

export interface FiltrosEstabelecimentos {
  latitude?: number;
  longitude?: number;
  raio?: number; // em metros
  tipo?: string;
  natureza?: string;
  ativo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Tipos para geolocalização
export type GeolocationErrorType = 
  | "PERMISSION_DENIED"
  | "POSITION_UNAVAILABLE"
  | "TIMEOUT"
  | "BROWSER_NOT_SUPPORTED"
  | "DEFAULT";

export interface GeolocationConfig {
  options: PositionOptions;
  errors: Record<GeolocationErrorType, string>;
}

// Tipos para aplicativos de navegação
export interface NavigationApp {
  name: string;
  icon: string;
  urlTemplate: string;
  mobileOnly?: boolean;
}

export interface ModoTransporte {
  modo: string;
  icone: string;
  label: string;
  velocidadeMedia?: number; // km/h para estimativas
}

// Tipos para configuração do mapa
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapConfig {
  containerStyle: {
    width: string;
    height: string;
  };
  defaultOptions: {
    zoomControl: boolean;
    streetViewControl?: boolean;
    mapTypeControl: boolean;
    fullscreenControl: boolean;
    gestureHandling: string;
    clickableIcons: boolean;
    zoom: number;
  };
  markerIcons: {
    user: {
      normal: string;
      destination: string;
      size: number;
    };
    places: {
      public: string;
      private: string;
    };
  };
}

// Tipos para Leaflet específicos
export interface LeafletMarkerIcon {
  html: string;
  iconSize: [number, number];
  iconAnchor: [number, number];
  className?: string;
}

export interface PopupOptions {
  maxWidth: number;
  minWidth?: number;
  closeButton: boolean;
  autoClose: boolean;
  closeOnClick: boolean;
  className?: string;
}

// Tipos para estimativas de viagem
export interface EstimativaViagem {
  distanciaKm: number;
  tempoEstimadoMinutos: number;
  modo: string;
}

// Tipos para estatísticas
export interface EstatisticasEstabelecimentos {
  total: number;
  publicos: number;
  privados: number;
  porTipo: Record<string, number>;
  porNatureza: Record<string, number>;
  porMunicipio: Record<string, number>;
}

// Tipos para cache offline
export interface CacheEstabelecimentos {
  data: Local[];
  timestamp: number;
  version: string;
  bounds?: MapBounds;
}

// Tipos para preferências do usuário
export interface UserPreferences {
  language: SupportedLanguage;
  defaultRadius: number;
  voiceGuidance: boolean;
  preferredTransportMode: string;
  favoriteEstablishments: string[];
}

// Tipos para análise de dados
export interface AnaliseDistribuicao {
  centro: LatLngLiteral;
  raio: number;
  estabelecimentos: Local[];
  densidade: number;
  tipoMaisComum: string;
}