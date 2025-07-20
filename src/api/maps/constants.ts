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
      fallback: 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="42" height="42"><circle cx="24" cy="24" r="20" fill="%2334D399" stroke="%23059669" stroke-width="2"/><circle cx="24" cy="20" r="6" fill="white"/><path d="M15 32c0-5 4-9 9-9s9 4 9 9" fill="white"/></svg>',
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