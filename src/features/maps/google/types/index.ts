export interface LatLngLiteral {
    lat: number;
    lng: number;
  }
  
  export interface Local {
    id: string;
    nome: string;
    lat: number;
    lng: number;
    endereco?: string;
    tipo: string;
    natureza: string;
    turno: string;
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
    selectedLanguage: 'pt-BR' | 'en';
    temposViagem: TempoViagem[];
    modoTransporteSelecionado: string;
    visibleCount: number;
  }

  export type SupportedLanguage = 'pt-BR' | 'en-US' | 'es-ES' | 'fr-FR' | 'zh-CN';
  