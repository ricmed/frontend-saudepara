export const DEFAULT_CENTER = {
    lat: -1.4557,
    lng: -48.4902,
  };
  
  export const MIN_RADIUS = 1000;
  export const DEFAULT_RADIUS = 10000;
  export const MAX_RADIUS = 50000;
  
  export const LIBRARIES: ("places" | "geometry" | "drawing" | "visualization")[] = [
    "places",
    "geometry",
  ];
  
  export const MODOS_TRANSPORTE = [
    { modo: "DRIVING", icone: "🚗", label: "Carro" },
    { modo: "TRANSIT", icone: "🚌", label: "Ônibus" },
    { modo: "WALKING", icone: "🚶", label: "A pé" },
    { modo: "BICYCLING", icone: "🚲", label: "Bicicleta" },
  ];
  
  export const SUPPORTED_LANGUAGES = [
    { code: 'pt-BR', label: 'Português', flag: '🇧🇷' },
    { code: 'en-US', label: 'English', flag: '🇺🇸' },
    { code: 'es-ES', label: 'Español', flag: '🇪🇸' },
    { code: 'fr-FR', label: 'Français', flag: '🇫🇷' },
    { code: 'zh-CN', label: '中文', flag: '🇨🇳' },
  ] as const;