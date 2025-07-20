import { useState, useEffect } from 'react';
import { GOOGLE_MAPS_API_KEY } from '../config';

declare global {
  interface Window {
    initMap: () => void;
    google: typeof google;
  }
}

let isLoadingScript = false;
let scriptLoadPromise: Promise<void> | null = null;

export const useGoogleMapsLoader = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    // Se o Google Maps já estiver carregado, retorna imediatamente
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    const loadScript = async () => {
      // Se já estiver carregando, aguarda a promessa existente
      if (scriptLoadPromise) {
        await scriptLoadPromise;
        setIsLoaded(true);
        return;
      }

      // Se não estiver carregando ainda, inicia o carregamento
      if (!isLoadingScript) {
        isLoadingScript = true;
        scriptLoadPromise = new Promise<void>((resolve, reject) => {
          window.initMap = () => {
            resolve();
          };

          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
          script.async = true;
          script.defer = true;
          script.onerror = () => {
            reject(new Error('Erro ao carregar Google Maps'));
          };

          document.head.appendChild(script);
        });

        try {
          await scriptLoadPromise;
          setIsLoaded(true);
        } catch (error) {
          setLoadError(error as Error);
        } finally {
          isLoadingScript = false;
        }
      }
    };

    loadScript();
  }, []);

  return { isLoaded, loadError };
};
