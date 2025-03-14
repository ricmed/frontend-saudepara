import { GeolocationConfig } from './types';

export const MAP_CONFIG = {
  containerStyle: {
    width: '100%',
    height: '100vh',
  },
  defaultOptions: {
    zoomControl: true,
    streetViewControl: true,
    mapTypeControl: false,
    fullscreenControl: false,
    gestureHandling: 'greedy',
    clickableIcons: true,
    zoom: 13,
  },
  markerIcons: {
    user: {
      normal: './images/illustrations/boneco-fixo.png',
      destination: './images/illustrations/boneco-fixo-2.png',
      size: 42
    },
    places: {
      public: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
      private: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
    }
  },
  directionsOptions: {
    suppressMarkers: false,
    preserveViewport: false,
  }
} as const;

export const GEOLOCATION_CONFIG: GeolocationConfig = {
  options: {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
  },
  errors: {
    PERMISSION_DENIED: "Permissão de localização negada. Por favor, habilite a localização no seu navegador.",
    POSITION_UNAVAILABLE: "Localização indisponível no momento.",
    TIMEOUT: "Tempo esgotado ao tentar obter localização.",
    BROWSER_NOT_SUPPORTED: "Seu navegador não suporta geolocalização.",
    DEFAULT: "Não foi possível obter sua localização."
  }
};