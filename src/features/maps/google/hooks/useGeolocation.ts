import { useState, useCallback, useEffect } from 'react';
import { LatLngLiteral } from '@/api/maps/types';

interface GeolocationState {
  userLocation: LatLngLiteral | null;
  error: string | null;
  isLoading: boolean;
  hasPermission: boolean;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    userLocation: null,
    error: null,
    isLoading: false,
    hasPermission: false
  });

  // Verifica permissão automaticamente ao carregar
  useEffect(() => {
    const checkPermission = async () => {
      if ('permissions' in navigator) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          setState(prev => ({
            ...prev,
            hasPermission: result.state === 'granted'
          }));
          
          // Se já tem permissão, tenta obter localização automaticamente
          if (result.state === 'granted') {
            obterLocalizacao();
          }
        } catch (e) {
          console.log('Erro ao verificar permissão:', e);
        }
      }
    };
    
    checkPermission();
  }, []);

  const obterLocalizacao = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    // Primeiro verifica se o navegador tem a API Permissions
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        console.log('Status da permissão:', result.state);
        
        setState(prev => ({ 
          ...prev, 
          hasPermission: result.state === 'granted' 
        }));
        
        if (result.state === 'denied') {
          setState(prev => ({
            ...prev,
            error: 'Permissão de localização negada. Habilite nas configurações do navegador.',
            isLoading: false
          }));
          return;
        }
      } catch (e) {
        console.log('Erro ao verificar permissão:', e);
      }
    }

    // Tenta obter a localização
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
            isLoading: false,
            hasPermission: true
          });
          console.log('Localização obtida:', newLocation);
        },
        (error) => {
          console.log('Código do erro:', error.code);
          console.log('Mensagem do erro:', error.message);
          
          let errorMessage = '';
          switch (error.code) {
            case 1: // PERMISSION_DENIED
              errorMessage = 'Permissão negada. Habilite a localização nas configurações do navegador.';
              break;
            case 2: // POSITION_UNAVAILABLE
              errorMessage = 'Localização indisponível. Verifique se o GPS está ativo.';
              break;
            case 3: // TIMEOUT
              errorMessage = 'Tempo esgotado ao obter localização. Tente novamente.';
              break;
            default:
              errorMessage = 'Erro ao obter localização. Tente novamente.';
          }
          
          setState(prev => ({
            ...prev,
            error: errorMessage,
            isLoading: false,
            hasPermission: error.code !== 1
          }));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000 // Cache por 1 minuto para melhor performance
        }
      );
    } else {
      setState(prev => ({
        ...prev,
        error: 'Seu navegador não suporta geolocalização.',
        isLoading: false
      }));
    }
  }, []);

  return {
    ...state,
    obterLocalizacao
  };
};