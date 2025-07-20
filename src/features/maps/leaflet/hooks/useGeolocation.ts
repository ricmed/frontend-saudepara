import { useState, useCallback } from 'react';
import { LatLngLiteral } from '@/api/maps/types';

interface GeolocationState {
  userLocation: LatLngLiteral | null;
  error: string | null;
  isLoading: boolean;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    userLocation: null,
    error: null,
    isLoading: false
  });

  const obterLocalizacao = useCallback(async () => {
    // Primeiro verifica se o navegador tem a API Permissions
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        console.log('Status da permissão:', result.state);
        
        if (result.state === 'denied') {
          console.log('Permissão está negada no navegador');
        }
      } catch (e) {
        console.log('Erro ao verificar permissão:', e);
      }
    }

    // Tenta obter a localização mesmo assim
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setState({
            userLocation: newLocation,
            error: null,
            isLoading: false
          });
          console.log('Localização obtida:', newLocation);
        },
        (error) => {
          console.log('Código do erro:', error.code);
          console.log('Mensagem do erro:', error.message);
          
          let errorMessage = '';
          switch (error.code) {
            case 1: // PERMISSION_DENIED
              errorMessage = 'Permissão negada. Tente recarregar a página e permitir a localização.';
              break;
            case 2: // POSITION_UNAVAILABLE
              errorMessage = 'Localização indisponível.';
              break;
            case 3: // TIMEOUT
              errorMessage = 'Tempo esgotado ao obter localização.';
              break;
            default:
              errorMessage = 'Erro ao obter localização.';
          }
          
          setState({
            userLocation: null,
            error: errorMessage,
            isLoading: false
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    }
  }, []);

  return {
    ...state,
    obterLocalizacao
  };
};